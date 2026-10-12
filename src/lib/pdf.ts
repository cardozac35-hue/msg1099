import PDFDocument from "pdfkit";
import { formatCurrency, formatDate } from "./utils";

export interface QuotationPdfData {
  quotationNumber: string;
  revision: number;
  quotationCode: string;
  createdAt: string | Date;
  validityDate: string | Date;
  customerName: string;
  contactName: string;
  customerAddress?: string;
  customerCountry?: string;
  currency: string;
  deliveryTerms: string;
  paymentTerms: string;
  leadTime: string;
  items: Array<{
    itemDescription: string;
    materialGrade?: string;
    standard?: string;
    size?: string;
    pressureClass?: string;
    quantity: number;
    unitOfMeasure: string;
    unitSellingPrice: number;
    discountPercent?: number;
    lineTotal: number;
    leadTime?: string;
  }>;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  taxPercent: number;
  totalAmount: number;
  notes?: string;
  createdByName: string;
}

export function generateQuotationPdf(data: QuotationPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 40,
        info: {
          Title: `Quotation ${data.quotationCode} - Apex Oilfield`,
          Author: "Apex Oilfield & Gas Equipment FZE",
          Subject: `Industrial Quotation ${data.quotationCode}`,
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      const MAROON = "#781F32";
      const CHARCOAL = "#242C36";
      const GREY_LIGHT = "#F4F5F7";
      const GREY_LINE = "#E2E8F0";

      // 1. TOP HEADER BAND
      doc.rect(40, 40, 515, 65).fill(MAROON);

      doc.fillColor("#FFFFFF").fontSize(18).text("APEX OILFIELD & GAS EQUIPMENT", 55, 52, { bold: true } as any);
      doc.fontSize(8).fillColor("#FCE7EB").text("Commercial Division • Oilfield Piping, Valves & Instrumentation Supplies", 55, 74);
      doc.text("JAFZA South, Dubai, UAE • Phone: +971 4 881 0000 • sales@apexoilfield.com • TRN: 100492817200003", 55, 87);

      // 2. DOCUMENT TITLE & IDENTIFIERS
      doc.rect(40, 115, 515, 60).fill(GREY_LIGHT).strokeColor(GREY_LINE).stroke();

      doc.fillColor(CHARCOAL).fontSize(13).text("COMMERCIAL SALES QUOTATION", 55, 125, { bold: true } as any);
      doc.fontSize(9).fillColor("#64748B");
      doc.text(`Quotation Ref:`, 55, 145);
      doc.fillColor(MAROON).fontSize(9).text(data.quotationCode, 130, 145, { bold: true } as any);

      doc.fillColor("#64748B").fontSize(9).text(`Issue Date:`, 55, 158);
      doc.fillColor(CHARCOAL).text(formatDate(data.createdAt), 130, 158);

      doc.fillColor("#64748B").fontSize(9).text(`Revision:`, 320, 145);
      doc.fillColor(CHARCOAL).text(`REV ${data.revision}`, 390, 145, { bold: true } as any);

      doc.fillColor("#64748B").fontSize(9).text(`Valid Until:`, 320, 158);
      doc.fillColor(CHARCOAL).text(formatDate(data.validityDate), 390, 158);

      // 3. CLIENT DETAILS & COMMERCIAL TERMS
      let curY = 185;
      doc.fillColor(MAROON).fontSize(10).text("CLIENT INFORMATION", 40, curY, { bold: true } as any);
      doc.text("DELIVERY & PAYMENT TERMS", 300, curY, { bold: true } as any);

      curY += 15;
      doc.fontSize(8).fillColor(CHARCOAL);
      doc.text(`Company: ${data.customerName}`, 40, curY, { bold: true } as any);
      doc.text(`Delivery (Incoterms): ${data.deliveryTerms}`, 300, curY);

      curY += 13;
      doc.text(`Attn: ${data.contactName}`, 40, curY);
      doc.text(`Payment Terms: ${data.paymentTerms}`, 300, curY);

      curY += 13;
      doc.text(`Country: ${data.customerCountry || "International"}`, 40, curY);
      doc.text(`Estimated Lead Time: ${data.leadTime}`, 300, curY);

      // 4. ITEMS TABLE
      curY += 25;
      const tableTop = curY;
      const colX = { item: 40, desc: 65, qty: 340, uom: 380, price: 420, total: 490 };

      // Table Header
      doc.rect(40, tableTop, 515, 20).fill(CHARCOAL);
      doc.fillColor("#FFFFFF").fontSize(8);
      doc.text("#", colX.item + 5, tableTop + 6);
      doc.text("Item Description & Specification", colX.desc, tableTop + 6);
      doc.text("Qty", colX.qty, tableTop + 6);
      doc.text("UOM", colX.uom, tableTop + 6);
      doc.text(`Price (${data.currency})`, colX.price, tableTop + 6);
      doc.text(`Total (${data.currency})`, colX.total, tableTop + 6);

      curY = tableTop + 20;

      data.items.forEach((item, idx) => {
        const itemY = curY;
        const isZebra = idx % 2 === 1;
        if (isZebra) {
          doc.rect(40, itemY, 515, 30).fill("#F8FAFC");
        }

        doc.fillColor(CHARCOAL).fontSize(8);
        doc.text(String(idx + 1), colX.item + 5, itemY + 6);

        // Technical specs line
        const specs = [item.materialGrade, item.size, item.pressureClass, item.standard]
          .filter(Boolean)
          .join(" • ");

        doc.text(item.itemDescription, colX.desc, itemY + 6, { width: 265, ellipsis: true });
        if (specs) {
          doc.fontSize(7).fillColor("#64748B").text(specs, colX.desc, itemY + 16, { width: 265, ellipsis: true });
        }

        doc.fontSize(8).fillColor(CHARCOAL);
        doc.text(String(item.quantity), colX.qty, itemY + 6);
        doc.text(item.unitOfMeasure, colX.uom, itemY + 6);
        doc.text(item.unitSellingPrice.toFixed(2), colX.price, itemY + 6);
        doc.text(item.lineTotal.toFixed(2), colX.total, itemY + 6, { bold: true } as any);

        // Underline
        doc.rect(40, itemY + 30, 515, 0.5).fill(GREY_LINE);
        curY += 31;
      });

      // 5. FINANCIAL SUMMARY
      curY += 15;
      const summaryLeft = 340;
      doc.fontSize(8).fillColor(CHARCOAL);

      doc.text("Subtotal:", summaryLeft, curY);
      doc.text(formatCurrency(data.subtotal, data.currency), 460, curY, { align: "right" });

      if (data.discountAmount > 0) {
        curY += 14;
        doc.text("Commercial Discount:", summaryLeft, curY);
        doc.fillColor("#DC2626").text(`-${formatCurrency(data.discountAmount, data.currency)}`, 460, curY, { align: "right" });
        doc.fillColor(CHARCOAL);
      }

      curY += 14;
      doc.text(`VAT / Applicable Tax (${data.taxPercent}%):`, summaryLeft, curY);
      doc.text(formatCurrency(data.taxAmount, data.currency), 460, curY, { align: "right" });

      curY += 16;
      doc.rect(summaryLeft - 10, curY - 4, 225, 22).fill(MAROON);
      doc.fillColor("#FFFFFF").fontSize(10).text("TOTAL QUOTATION VALUE:", summaryLeft, curY + 2, { bold: true } as any);
      doc.text(formatCurrency(data.totalAmount, data.currency), 460, curY + 2, { align: "right", bold: true } as any);

      // 6. GENERAL NOTES & SIGN-OFF
      curY += 40;
      doc.fillColor(CHARCOAL).fontSize(8);
      doc.text("STANDARD COMMERCIAL NOTES & CONDITIONS:", 40, curY, { bold: true } as any);
      curY += 12;
      doc.fontSize(7).fillColor("#64748B");
      doc.text("1. All items are covered by standard 12 months manufacturer warranty from commissioning or 18 months from shipment.", 40, curY);
      curY += 10;
      doc.text("2. Quotation is subject to prior sales and mill slot availability upon receipt of Purchase Order.", 40, curY);
      curY += 10;
      doc.text("3. EN 10204 3.1 Mill Test Certificates and inspection test plans (ITP) are provided prior to dispatch.", 40, curY);

      // Sign-off
      curY += 30;
      doc.rect(40, curY, 200, 0.5).fill(CHARCOAL);
      doc.rect(350, curY, 200, 0.5).fill(CHARCOAL);

      curY += 6;
      doc.fontSize(8).fillColor(CHARCOAL);
      doc.text(`Prepared by: ${data.createdByName}`, 40, curY);
      doc.text("Authorized Commercial Signatory", 350, curY);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
