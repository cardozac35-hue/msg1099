import ExcelJS from "exceljs";
import * as XLSX from "xlsx";

export interface ParsedQuoteItem {
  sNo: number;
  description: string;
  quantity: number;
  unit: string;
  remarks: string;
  unitPrice: number;
  totalPrice: number;
  // Extracted specs if present
  category?: string;
  materialGrade?: string;
  size?: string;
  standard?: string;
  pressureClass?: string;
  connectionType?: string;
}

/**
 * Parses raw copied text from Excel or spreadsheet table (Tab-separated or Comma-separated)
 */
export function parsePastedExcelText(rawText: string): ParsedQuoteItem[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  // Determine separator: Tab (Excel default) or Comma or Semicolon or Pipe
  const firstLine = lines[0];
  let delimiter = "\t";
  if (!firstLine.includes("\t")) {
    if (firstLine.includes(",")) delimiter = ",";
    else if (firstLine.includes("|")) delimiter = "|";
    else if (firstLine.includes(";")) delimiter = ";";
  }

  const rows = lines.map((line) => {
    return line.split(delimiter).map((cell) => cell.trim().replace(/^["']|["']$/g, ""));
  });

  return parseTableRows(rows);
}

/**
 * Parses an Excel file Buffer (.xlsx, .xls, .csv, HTML table)
 */
export async function parseExcelBuffer(buffer: Buffer): Promise<ParsedQuoteItem[]> {
  // Method 1: SheetJS (XLSX) - Natively reads .xlsx, .xls (BIFF8 binary), CSV, TSV, XML, HTML
  try {
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
    if (workbook.SheetNames && workbook.SheetNames.length > 0) {
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      if (worksheet) {
        const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
        const cleanRows: string[][] = rawRows
          .map((row) => (Array.isArray(row) ? row : []).map((c) => String(c ?? "").trim()))
          .filter((row) => row.some((c) => c.length > 0));

        if (cleanRows.length > 0) {
          const parsed = parseTableRows(cleanRows);
          if (parsed.length > 0) return parsed;
        }
      }
    }
  } catch (err) {
    // Continue to fallback
  }

  // Method 2: ExcelJS - specifically for standard OpenXML .xlsx (valid PK zip archive)
  try {
    const isZip = buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b;
    if (isZip) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const worksheet = workbook.worksheets[0];
      if (worksheet) {
        const rows: string[][] = [];
        worksheet.eachRow({ includeEmpty: false }, (row) => {
          const rowValues = row.values as any[];
          const cleanCells = (Array.isArray(rowValues) ? rowValues.slice(1) : []).map((val) => {
            if (val === null || val === undefined) return "";
            if (typeof val === "object" && val.text) return String(val.text).trim();
            if (typeof val === "object" && val.result !== undefined) return String(val.result).trim();
            return String(val).trim();
          });
          if (cleanCells.some((c) => c.length > 0)) {
            rows.push(cleanCells);
          }
        });
        if (rows.length > 0) {
          const parsed = parseTableRows(rows);
          if (parsed.length > 0) return parsed;
        }
      }
    }
  } catch (err) {
    // Continue to text fallback
  }

  // Method 3: Fallback for HTML tables (common in ERP exports renamed to .xls or .xlsx)
  try {
    const text = buffer.toString("utf-8");
    if (text.includes("<table") || text.includes("<tr")) {
      const htmlRows = parseHtmlTable(text);
      if (htmlRows.length > 0) {
        const parsed = parseTableRows(htmlRows);
        if (parsed.length > 0) return parsed;
      }
    }

    // Method 4: Fallback for Plain text / CSV
    const textItems = parsePastedExcelText(text);
    if (textItems.length > 0) return textItems;
  } catch (err) {
    // Fall through
  }

  return [];
}

/**
 * Helper to parse HTML tables (e.g. ERP reports saved as .xls)
 */
function parseHtmlTable(html: string): string[][] {
  const rows: string[][] = [];
  const trMatches = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  for (const tr of trMatches) {
    const cellMatches = tr.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || [];
    const cells = cellMatches.map((cell) => {
      return cell
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
    });
    if (cells.some((c) => c.length > 0)) {
      rows.push(cells);
    }
  }
  return rows;
}

/**
 * Core table mapping logic that finds header row and extracts items
 */
function parseTableRows(rows: string[][]): ParsedQuoteItem[] {
  if (rows.length === 0) return [];

  let headerIndex = -1;
  let colMap = {
    sNo: -1,
    desc: -1,
    qty: -1,
    unit: -1,
    remarks: -1,
    unitPrice: -1,
    totalPrice: -1,
  };

  // 1. Identify header row
  for (let r = 0; r < Math.min(rows.length, 5); r++) {
    const row = rows[r].map((c) => c.toLowerCase());
    const hasDesc = row.some((c) => c.includes("desc") || c.includes("material") || c.includes("item"));
    const hasQty = row.some((c) => c.includes("qty") || c.includes("quantity") || c.includes("q'ty"));

    if (hasDesc || hasQty) {
      headerIndex = r;
      row.forEach((col, idx) => {
        if (col.includes("s no") || col.includes("s.no") || col.includes("sl") || col === "#" || col === "no") {
          colMap.sNo = idx;
        } else if (col.includes("desc") || col.includes("material") || col.includes("product") || col.includes("item")) {
          colMap.desc = idx;
        } else if (col.includes("qty") || col.includes("quantity") || col.includes("q'ty") || col.includes("pieces") || col.includes("pcs")) {
          colMap.qty = idx;
        } else if (col.includes("unit") || col.includes("uom")) {
          colMap.unit = idx;
        } else if (col.includes("remark") || col.includes("note")) {
          colMap.remarks = idx;
        } else if (col.includes("unit price") || col.includes("price") || col.includes("rate")) {
          colMap.unitPrice = idx;
        } else if (col.includes("total") || col.includes("amount")) {
          colMap.totalPrice = idx;
        }
      });
      break;
    }
  }

  // Fallback default column layout if no explicit header matched
  if (headerIndex === -1) {
    headerIndex = 0;
    // Guess: Col 0 = S No, Col 1 = Desc, Col 2 = Qty, Col 3 = Unit, Col 4 = Remarks
    colMap = { sNo: 0, desc: 1, qty: 2, unit: 3, remarks: 4, unitPrice: 5, totalPrice: 6 };
  } else {
    // If description wasn't found, find the longest string column
    if (colMap.desc === -1) colMap.desc = 1;
    if (colMap.qty === -1) colMap.qty = 2;
    if (colMap.unit === -1) colMap.unit = 3;
    if (colMap.remarks === -1 && rows[headerIndex].length > 4) colMap.remarks = 4;
  }

  const items: ParsedQuoteItem[] = [];
  const dataRows = rows.slice(headerIndex + 1);

  let itemCounter = 1;
  for (const row of dataRows) {
    // Stop if row is a total row or empty
    const rowText = row.join(" ").toLowerCase();
    if (rowText.includes("total amount") || rowText.includes("grand total") || rowText.includes("subtotal")) {
      continue;
    }

    const desc = colMap.desc !== -1 && row[colMap.desc] ? row[colMap.desc] : "";
    if (!desc || desc.trim().length === 0) continue;

    // Parse Quantity
    let qty = 1;
    if (colMap.qty !== -1 && row[colMap.qty]) {
      const rawQty = row[colMap.qty].replace(/[^0-9.]/g, "");
      qty = parseFloat(rawQty) || 1;
    }

    // Parse Unit
    let unit = "MTR";
    if (colMap.unit !== -1 && row[colMap.unit]) {
      unit = row[colMap.unit].toUpperCase().trim() || "MTR";
    }

    // Parse Remarks
    let remarks = "";
    if (colMap.remarks !== -1 && row[colMap.remarks]) {
      remarks = row[colMap.remarks].trim();
    }

    // Parse Unit Price
    let unitPrice = 0;
    if (colMap.unitPrice !== -1 && row[colMap.unitPrice]) {
      const rawPrice = row[colMap.unitPrice].replace(/[^0-9.]/g, "");
      unitPrice = parseFloat(rawPrice) || 0;
    }

    // Parse S No.
    let sNo = itemCounter;
    if (colMap.sNo !== -1 && row[colMap.sNo]) {
      const rawSNo = parseInt(row[colMap.sNo].replace(/[^0-9]/g, ""), 10);
      if (!isNaN(rawSNo)) sNo = rawSNo;
    }

    const totalPrice = unitPrice > 0 ? qty * unitPrice : 0;

    // Extract common oil & gas specs from description if present
    const specs = extractIndustrialSpecs(desc);

    items.push({
      sNo,
      description: desc,
      quantity: qty,
      unit,
      remarks,
      unitPrice,
      totalPrice,
      ...specs,
    });

    itemCounter++;
  }

  return items;
}

/**
 * Intelligent helper to extract grade, size, standard from piping description
 */
function extractIndustrialSpecs(desc: string) {
  const specs: {
    category?: string;
    materialGrade?: string;
    size?: string;
    standard?: string;
    pressureClass?: string;
    connectionType?: string;
  } = {};

  const lower = desc.toLowerCase();

  // Category detection
  if (lower.includes("pipe") || lower.includes("tube") || lower.includes("tubing")) {
    specs.category = "Pipes & Tubes";
  } else if (
    lower.includes("valve") ||
    lower.includes("ball") ||
    lower.includes("gate") ||
    lower.includes("globe") ||
    lower.includes("check") ||
    lower.includes("butterfly")
  ) {
    specs.category = "Valves";
  } else if (lower.includes("flange") || lower.includes("wnrf") || lower.includes("sorf") || lower.includes("blind")) {
    specs.category = "Flanges";
  } else if (
    lower.includes("fitting") ||
    lower.includes("elbow") ||
    lower.includes("tee") ||
    lower.includes("reducer") ||
    lower.includes("coupling")
  ) {
    specs.category = "Fittings";
  } else if (lower.includes("gasket") || lower.includes("seal") || lower.includes("spiral wound")) {
    specs.category = "Gaskets & Seals";
  } else if (lower.includes("gauge") || lower.includes("transmitter") || lower.includes("instrumentation")) {
    specs.category = "Instrumentation & Gauges";
  } else if (lower.includes("bolt") || lower.includes("stud") || lower.includes("nut") || lower.includes("fastener")) {
    specs.category = "Fasteners & Studs";
  } else if (lower.includes("drill") || lower.includes("casing") || lower.includes("wellhead")) {
    specs.category = "Drilling & Wellhead";
  } else {
    specs.category = "Pipes & Tubes";
  }

  // Connection Type detection
  if (lower.includes("butt weld") || lower.includes("bw") || lower.includes("drl") || lower.includes("beveled")) {
    specs.connectionType = "Butt Weld";
  } else if (lower.includes("rf") || lower.includes("raised face") || lower.includes("flanged")) {
    specs.connectionType = "RF Flanged";
  } else if (lower.includes("rtj") || lower.includes("ring type joint")) {
    specs.connectionType = "RTJ";
  } else if (lower.includes("threaded") || lower.includes("npt")) {
    specs.connectionType = "Threaded / NPT";
  } else if (lower.includes("socket weld") || lower.includes("sw")) {
    specs.connectionType = "Socket Weld";
  }

  // Size pattern: 6", 8", 10", DN 150, 1/2"
  const sizeMatch = desc.match(/(\d+(?:\/\d+)?(?:\.\d+)?)\s*(?:\"|inch|in\b|mm\b)/i);
  if (sizeMatch) {
    specs.size = `${sizeMatch[1]}"`;
  }

  // Material Grade: ASTM A106 GR.B, A105, A333 GR.6, A312 TP316L, etc.
  const gradeMatch = desc.match(/\b(ASTM\s+[A-Z0-9]+(?:\s+GR\.[A-Z0-9]+)?|A106(?:\s+GR\.[A-Z0-9]+)?|A105|A333(?:\s+GR\.[0-9]+)?|A350(?:\s+LF[0-9]+)?|A312(?:\s+TP[0-9]+[A-Z]*)?|A216\s+WCB|SS316L?|SS304L?|INCONEL\s*\d+|DUPLEX\s*\d*)\b/i);
  if (gradeMatch) {
    specs.materialGrade = gradeMatch[1].toUpperCase();
  }

  // Standard: ANSI B36.10, API 6D, ASME B16.5, etc.
  const stdMatch = desc.match(/\b(ANSI\s+B36\.10|ASME\s+B16\.[0-9]+|API\s+6[A-D]|API\s+5L|DIN\s+[0-9]+|BS\s+[0-9]+)\b/i);
  if (stdMatch) {
    specs.standard = stdMatch[1].toUpperCase();
  }

  // Schedule / Class: S.80, SCH 40, CLASS 600, 150#
  const schMatch = desc.match(/\b(S\.\d+|SCH\s*\d+|CLASS\s*\d+|150#|300#|600#|900#|1500#|2500#)\b/i);
  if (schMatch) {
    specs.pressureClass = schMatch[1].toUpperCase();
  }

  return specs;
}
