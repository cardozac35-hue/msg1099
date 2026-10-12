import sharp from "sharp";
import { createWorker } from "tesseract.js";
import { ParsedQuoteItem, parsePastedExcelText } from "./excel-importer";

/**
 * Common OCR corrections for oil & gas industrial terms
 */
function cleanIndustrialOcrText(text: string): string {
  return text
    .replace(/\b[5$]\.(80|40|160|20|10|STD|XS|XXS)\b/gi, "S.$1")
    .replace(/\bANS[!|l1]\b/g, "ANSI")
    .replace(/\bASTM\s+A1O6\b/gi, "ASTM A106")
    .replace(/\bGR\.8\b/gi, "GR.B")
    .replace(/\b[O0]RL\b/g, "DRL")
    .replace(/\bDR[I|l]\b/g, "DRL")
    .replace(/\bM7R\b/gi, "MTR")
    .replace(/\s+(?:ENE|IEEE|ww|we|ow|Co)$/gi, "")
    .replace(/["”]/g, '"')
    .replace(/['’]/g, "'");
}

/**
 * OCR service that converts an image buffer (screenshot of spreadsheet or table)
 * into structured ParsedQuoteItem array for quotation generation.
 */
export async function parseScreenshotImage(buffer: Buffer): Promise<{
  items: ParsedQuoteItem[];
  rawText: string;
}> {
  let worker: any = null;
  try {
    const meta = await sharp(buffer).metadata();
    const width = meta.width || 800;
    const height = meta.height || 600;

    worker = await createWorker("eng");

    // 1. Process full image with contrast boost & scaling for high OCR fidelity
    const scaleFactor = width < 1200 ? 2 : 1;
    const processedFull = await sharp(buffer)
      .resize({ width: width * scaleFactor })
      .grayscale()
      .normalize()
      .png()
      .toBuffer();

    const fullResult = await worker.recognize(processedFull);
    const rawFullText = cleanIndustrialOcrText(fullResult.data.text || "");

    // 2. Intelligent column band extraction for structured spreadsheet screenshots
    const qtyNumbers: number[] = [];
    const units: string[] = [];

    try {
      // Qty Column Band (~58% to 69% of image width in standard RFQ tables)
      const qtyLeft = Math.floor(width * 0.58);
      const qtyWidth = Math.floor(width * 0.11);
      const qtyCrop = await sharp(buffer)
        .extract({ left: qtyLeft, top: 0, width: qtyWidth, height })
        .resize({ width: 350 })
        .toBuffer();

      const qtyRes = await worker.recognize(qtyCrop);
      const rawQtyLines = (qtyRes.data.text || "")
        .split("\n")
        .map((l: string) => l.trim())
        .filter((l: string) => l && !l.toLowerCase().includes("qty") && !l.toLowerCase().includes("total"));

      for (const line of rawQtyLines) {
        const numMatch = line.match(/\b(\d+(?:\.\d+)?)\b/);
        if (numMatch) {
          qtyNumbers.push(parseFloat(numMatch[1]));
        }
      }

      // Unit Column Band (~68% to 78% of image width)
      const unitLeft = Math.floor(width * 0.68);
      const unitWidth = Math.floor(width * 0.10);
      const unitCrop = await sharp(buffer)
        .extract({ left: unitLeft, top: 0, width: unitWidth, height })
        .resize({ width: 300 })
        .toBuffer();

      const unitRes = await worker.recognize(unitCrop);
      const rawUnitLines = (unitRes.data.text || "")
        .split("\n")
        .map((l: string) => l.trim())
        .filter((l: string) => l && !l.toLowerCase().includes("unit") && !l.toLowerCase().includes("total"));

      for (const line of rawUnitLines) {
        const uMatch = line.match(/\b(MTR|EA|SET|KG|LOT|FT|PCS|NOS)\b/i);
        if (uMatch) {
          units.push(uMatch[1].toUpperCase());
        }
      }
    } catch {
      // If column crop fails, whole text fallback will be used
    }

    // 3. Extract description lines from full text
    const candidateLines = rawFullText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => {
        if (!l) return false;
        const low = l.toLowerCase();
        if (
          low.startsWith("s no") ||
          low.startsWith("s.no") ||
          low.startsWith("sno") ||
          low.includes("description") ||
          low.includes("total amount")
        ) {
          return false;
        }
        return (
          low.includes("pipe") ||
          low.includes("valve") ||
          low.includes("flange") ||
          low.includes("fitting") ||
          low.includes("astm") ||
          low.includes("ansi") ||
          low.includes("seamless") ||
          low.includes("class") ||
          /\d+["']/.test(l)
        );
      });

    // 4. Map candidate descriptions to items
    const items: ParsedQuoteItem[] = [];
    let counter = 1;

    for (let i = 0; i < candidateLines.length; i++) {
      let desc = candidateLines[i]
        .replace(/^[^a-zA-Z0-9]+/, "") // remove leading symbols like ; : .
        .replace(/^[0-9]+[\s.:|_-]+/, "") // remove leading row serial numbers
        .replace(/\s+[0-9A-Za-z]{1,2}$/, "") // remove trailing stray OCR artifacts
        .trim();

      desc = cleanIndustrialOcrText(desc);

      if (desc.length < 5) continue;

      // Extract specs from description
      const sizeMatch = desc.match(/(\d+(?:\/\d+)?(?:\.\d+)?)\s*(?:\"|inch|in\b)/i);
      const gradeMatch = desc.match(/\b(ASTM\s+[A-Z0-9]+(?:\s+GR\.[A-Z0-9]+)?|A106(?:\s+GR\.[A-Z0-9]+)?|A105|A333|A350|A312|A216\s+WCB)\b/i);
      const stdMatch = desc.match(/\b(ANSI\s+B36\.10|ASME\s+B16\.[0-9]+|API\s+6[A-D]|API\s+5L)\b/i);
      const schMatch = desc.match(/\b(S\.\d+|SCH\s*\d+|CLASS\s*\d+|150#|300#|600#)\b/i);

      let qty = 1;
      let unit = "MTR";

      if (qtyNumbers[i] !== undefined) {
        qty = qtyNumbers[i];
      } else {
        const inlineQtyMatch = candidateLines[i].match(/\b(\d+)\s+(MTR|EA|SET|KG|LOT|PCS)\b/i);
        if (inlineQtyMatch) {
          qty = parseInt(inlineQtyMatch[1], 10) || 1;
        }
      }

      if (units[i] !== undefined) {
        unit = units[i];
      } else {
        const inlineUnitMatch = candidateLines[i].match(/\b(MTR|EA|SET|KG|LOT|PCS)\b/i);
        if (inlineUnitMatch) {
          unit = inlineUnitMatch[1].toUpperCase();
        }
      }

      items.push({
        sNo: counter,
        description: desc,
        quantity: qty,
        unit,
        remarks: "",
        unitPrice: 0,
        totalPrice: 0,
        category: desc.toLowerCase().includes("pipe")
          ? "Pipes & Tubes"
          : desc.toLowerCase().includes("valve")
          ? "Valves"
          : desc.toLowerCase().includes("flange")
          ? "Flanges"
          : "Pipes & Tubes",
        size: sizeMatch ? `${sizeMatch[1]}"` : undefined,
        materialGrade: gradeMatch ? gradeMatch[1].toUpperCase() : undefined,
        standard: stdMatch ? stdMatch[1].toUpperCase() : undefined,
        pressureClass: schMatch ? schMatch[1].toUpperCase() : undefined,
      });

      counter++;
    }

    // Fallback if candidateLines was empty
    if (items.length === 0) {
      const fallback = parsePastedExcelText(rawFullText);
      return { items: fallback, rawText: rawFullText };
    }

    return { items, rawText: rawFullText };
  } finally {
    if (worker) {
      await worker.terminate().catch(() => {});
    }
  }
}
