import PDFDocument from "pdfkit";

export interface MsgQuotationItem {
  sNo?: number | string;
  description: string;
  quantity: number;
  unit: string;
  remarks?: string;
  unitPrice: number;
  unitSellingPrice?: number;
  totalPrice?: number;
}

export interface MsgQuotationData {
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  toCustomer: string;
  address?: string;
  clientRef?: string;
  quotationRef: string;
  attention?: string;
  date: string;
  currency?: string;
  items: MsgQuotationItem[];
  commercialTerms?: {
    price?: string;
    validity?: string;
    payment?: string;
    cancellation?: string;
    ld?: string;
  };
  technicalTerms?: {
    delivery?: string;
    mtc?: string;
    make?: string;
    warranty?: string;
    legalization?: string;
    packing?: string;
    services?: string;
  };
  otherTerms?: string[];
  signatoryName?: string;
  signatoryCompany?: string;
}

export const DEFAULT_MSG_TERMS = {
  commercial: {
    price: "IN USD, EX OUR WAREHOUSE IN DUBAI",
    validity: "5 DAYS",
    payment: "50% ADVANCE ALONG WITH THE ORDER , BALANCE 50% ON READINESS",
    cancellation:
      "Once order placed, cancellation of any items/deduction in the quantity will not be acceptable. Cancellation charges will apply.",
    ld: "Liquidated Damages not applicable unless mutually agreed in writing before placement of order.",
  },
  technical: {
    delivery:
      "Exstock, subject to unsold. Please allow 5/6 working days to keep the material ready.\nDelivery is considered from technically /commercially clear purchase order or from the approval of Drawings & Documents, if applicable.\nDelivery starts from the date of advance payment/LC opening, if applicable.",
    mtc: "3.1",
    make: "EUROPEAN",
    warranty: "18 months from date of PO or 12 months from the date of commissioning, whichever is soonest.",
    legalization: "Charges Extra",
    packing: "Sea Worthy/Road Worthy Packing Included",
    services:
      "The offer is valid for the quoted product only. Commissioning and other services not applicable and hence are not included in the offer",
  },
  other: [
    "All prices offered for complete quotation, partial order subject to requote.",
    "In case of additional requirement, price and delivery shall be reconfirmed.",
    "Any clarification/approvals required post order, shall be confirmed quickly by client. Any delay to confirm will be excluded from agreed delivery.",
    "No specification was provided with the enquiry, and hence none considered. Any additional spec involved/required, subject to requote.",
    "All items offered bare as per manufacturer standard finishing without any cladding / coating / overlay / painting.",
    "The prices would be fixed and firm for the duration of the Purchase Order.",
    "We do not accept responsibility for process compatibility. Customer is responsible for material suitability to meet their process conditions.",
    "Incase of any rejection/ returns. MUST be pre-approved by MSG Sales staff/QAQC",
    "Any rejection due to damage or short supply to be reported within 2 week from the receipt of material.",
    "Pipe will be supplied in DRL(10 -11.9mtr) as per availability. Actual quantity supplied will be invoiced.",
  ],
};

export function generateMsgQuotationPdf(data: MsgQuotationData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 20,
        bufferPages: true,
        info: {
          Title: `Quotation ${data.quotationRef}`,
          Author: "MSG Oilfield Equipment Trading LLC",
          Subject: `Industrial Quotation ${data.quotationRef}`,
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      const PAGE_WIDTH = 595.28;
      const LEFT = 20;
      const RIGHT = PAGE_WIDTH - 20;
      const CONTENT_WIDTH = RIGHT - LEFT; // ~555.28

      const currency = data.currency || "USD";

      // Helper function to render header on any page
      const renderHeader = () => {
        let y = 20;

        // Outer header box
        doc.rect(LEFT, y, CONTENT_WIDTH, 65).strokeColor("#000000").lineWidth(1).stroke();

        // 1. Logo area (Left)
        // Red flame symbol + MSG stylized text
        doc.fillColor("#E11D48").fontSize(18).font("Helvetica-Bold").text("MSG", LEFT + 35, y + 16);
        doc.fillColor("#242C36").fontSize(18).font("Helvetica-Bold").text("MSG", LEFT + 34, y + 15);
        doc.fillColor("#64748B").fontSize(5.5).font("Helvetica").text("SOURCING, RELIABLE & SYSTEMATIC", LEFT + 12, y + 42);

        // Vertical divider for logo
        doc.moveTo(LEFT + 115, y).lineTo(LEFT + 115, y + 65).stroke();

        // 2. Company Address Block (Center)
        const centerLeft = LEFT + 120;
        const centerWidth = CONTENT_WIDTH - 230;

        doc.fillColor("#C5221F").fontSize(14).font("Helvetica-Bold")
          .text(data.companyName || "MSG Oilfield Equipment Trading LLC", centerLeft, y + 8, {
            align: "center",
            width: centerWidth,
          });

        doc.fillColor("#1E293B").fontSize(7.5).font("Helvetica-Bold")
          .text("DUBAI INDUSTRIAL CITY (DIC)", centerLeft, y + 25, {
            align: "center",
            width: centerWidth,
          });

        doc.fillColor("#334155").fontSize(6.5).font("Helvetica")
          .text("Phase-1, Saih Shuaib 2, Warehouse no: J-04, Dubai, UAE", centerLeft, y + 36, {
            align: "center",
            width: centerWidth,
          });

        doc.text("Tel: +971 4 295 1222  /  +971 4 5912553", centerLeft, y + 46, {
          align: "center",
          width: centerWidth,
        });

        doc.text("E-mail: sales@msgoilfield.com   Website: www.msgoilfield.com", centerLeft, y + 54, {
          align: "center",
          width: centerWidth,
        });

        // Vertical divider for right certifications
        doc.moveTo(RIGHT - 110, y).lineTo(RIGHT - 110, y + 65).stroke();

        // 3. Right side Certification badges (ISO 9001 + ASIB)
        const certX = RIGHT - 105;
        // ISO badge
        doc.rect(certX + 5, y + 10, 40, 45).lineWidth(0.5).strokeColor("#2563EB").stroke();
        doc.fillColor("#1E40AF").fontSize(7).font("Helvetica-Bold").text("SCS", certX + 16, y + 16);
        doc.fontSize(6).font("Helvetica").text("ISO 9001", certX + 10, y + 36);

        // ASIB badge
        doc.rect(certX + 52, y + 10, 40, 45).lineWidth(0.5).strokeColor("#1E3A8A").stroke();
        doc.fillColor("#1E3A8A").fontSize(7).font("Helvetica-Bold").text("ASIB", certX + 62, y + 24);

        doc.strokeColor("#000000").lineWidth(1);
      };

      // PAGE 1
      renderHeader();

      let currentY = 90;

      // CLIENT & QUOTATION DETAILS TABLE
      const infoBoxY = currentY;
      const infoBoxHeight = 44;

      doc.rect(LEFT, infoBoxY, CONTENT_WIDTH, infoBoxHeight).stroke();

      // Horizontal split line inside info box
      doc.moveTo(LEFT, infoBoxY + 22).lineTo(RIGHT, infoBoxY + 22).stroke();

      // Vertical columns
      // Row 1: TO (width ~100) | ADDRESS (width ~455)
      doc.moveTo(LEFT + 70, infoBoxY).lineTo(LEFT + 70, infoBoxY + 22).stroke();
      doc.fillColor("#000000").fontSize(7.5).font("Helvetica-Bold").text("TO", LEFT + 5, infoBoxY + 7);
      doc.font("Helvetica").text(data.toCustomer || "CLIENT", LEFT + 75, infoBoxY + 7, { width: 170, ellipsis: true });

      doc.moveTo(LEFT + 250, infoBoxY).lineTo(LEFT + 250, infoBoxY + 22).stroke();
      doc.font("Helvetica-Bold").text("ADDRESS", LEFT + 255, infoBoxY + 7);
      doc.font("Helvetica").text(data.address || "DUBAI, UAE", LEFT + 320, infoBoxY + 7, { width: 230, ellipsis: true });

      // Row 2: CLIENT REF | REF | ATTENTION | DATE
      const row2Y = infoBoxY + 22;
      doc.moveTo(LEFT + 70, row2Y).lineTo(LEFT + 70, row2Y + 22).stroke();
      doc.font("Helvetica-Bold").text("CLIENT REF", LEFT + 5, row2Y + 7);
      doc.font("Helvetica").text(data.clientRef || "ENQUIRY", LEFT + 75, row2Y + 7, { width: 170, ellipsis: true });

      doc.moveTo(LEFT + 250, row2Y).lineTo(LEFT + 250, row2Y + 22).stroke();
      doc.font("Helvetica-Bold").text("REF:", LEFT + 255, row2Y + 7);
      doc.font("Helvetica-Bold").text(data.quotationRef, LEFT + 285, row2Y + 7);

      doc.moveTo(LEFT + 430, row2Y).lineTo(LEFT + 430, row2Y + 22).stroke();
      doc.font("Helvetica-Bold").text("ATTENTION", LEFT + 380, row2Y + 7);
      doc.font("Helvetica").text(data.attention || "PURCHASE DEPT", LEFT + 435, row2Y + 7, { width: 70, ellipsis: true });

      doc.moveTo(RIGHT - 65, row2Y).lineTo(RIGHT - 65, row2Y + 22).stroke();
      doc.font("Helvetica-Bold").text("DATE:", RIGHT - 60, row2Y + 4);
      doc.font("Helvetica").text(data.date, RIGHT - 60, row2Y + 13);

      currentY = infoBoxY + infoBoxHeight + 8;

      // Salutation Text
      doc.fillColor("#000000").fontSize(7.5).font("Helvetica")
        .text("We thank you very much for your enquiry and we are pleased to submit our OFFER as follows:", LEFT, currentY);

      currentY += 14;

      // ITEMS TABLE
      // Columns: S No. (30) | Description (275) | Qty (40) | Unit (40) | Remarks (50) | Unit Price (60) | Total Price (60)
      const colX = {
        sNo: LEFT,
        desc: LEFT + 30,
        qty: LEFT + 30 + 265,
        unit: LEFT + 30 + 265 + 40,
        remarks: LEFT + 30 + 265 + 40 + 40,
        unitPrice: LEFT + 30 + 265 + 40 + 40 + 60,
        totalPrice: LEFT + 30 + 265 + 40 + 40 + 60 + 60,
      };

      const tableHeaderY = currentY;
      const tableHeaderHeight = 18;

      // Table Header row border
      doc.rect(LEFT, tableHeaderY, CONTENT_WIDTH, tableHeaderHeight).stroke();

      // Column vertical lines in header
      doc.moveTo(colX.desc, tableHeaderY).lineTo(colX.desc, tableHeaderY + tableHeaderHeight).stroke();
      doc.moveTo(colX.qty, tableHeaderY).lineTo(colX.qty, tableHeaderY + tableHeaderHeight).stroke();
      doc.moveTo(colX.unit, tableHeaderY).lineTo(colX.unit, tableHeaderY + tableHeaderHeight).stroke();
      doc.moveTo(colX.remarks, tableHeaderY).lineTo(colX.remarks, tableHeaderY + tableHeaderHeight).stroke();
      doc.moveTo(colX.unitPrice, tableHeaderY).lineTo(colX.unitPrice, tableHeaderY + tableHeaderHeight).stroke();
      doc.moveTo(colX.totalPrice, tableHeaderY).lineTo(colX.totalPrice, tableHeaderY + tableHeaderHeight).stroke();

      // Header labels
      doc.font("Helvetica-Bold").fontSize(7.5);
      doc.text("S No.", colX.sNo, tableHeaderY + 5, { width: 30, align: "center" });
      doc.text("Description", colX.desc, tableHeaderY + 5, { width: 265, align: "center" });
      doc.text("Qty", colX.qty, tableHeaderY + 5, { width: 40, align: "center" });
      doc.text("Unit", colX.unit, tableHeaderY + 5, { width: 40, align: "center" });
      doc.text("Remarks", colX.remarks, tableHeaderY + 5, { width: 60, align: "center" });
      doc.text("Unit Price", colX.unitPrice, tableHeaderY + 5, { width: 60, align: "center" });
      doc.text("Total Price", colX.totalPrice, tableHeaderY + 5, { width: 60, align: "center" });

      currentY = tableHeaderY + tableHeaderHeight;

      let grandTotal = 0;

      // Render Item rows
      data.items.forEach((item, index) => {
        const sNo = item.sNo !== undefined ? String(item.sNo) : String(index + 1);
        const qty = Number(item.quantity) || 0;
        const unitPrice = Number(item.unitSellingPrice || item.unitPrice) || 0;
        const lineTotal = item.totalPrice !== undefined ? Number(item.totalPrice) : qty * unitPrice;
        grandTotal += lineTotal;

        // Calculate height required for description
        doc.font("Helvetica").fontSize(7);
        const descHeight = doc.heightOfString(item.description, { width: 255 });
        const rowHeight = Math.max(24, descHeight + 10);

        // Row bounding box
        doc.rect(LEFT, currentY, CONTENT_WIDTH, rowHeight).stroke();

        // Vertical column dividers
        doc.moveTo(colX.desc, currentY).lineTo(colX.desc, currentY + rowHeight).stroke();
        doc.moveTo(colX.qty, currentY).lineTo(colX.qty, currentY + rowHeight).stroke();
        doc.moveTo(colX.unit, currentY).lineTo(colX.unit, currentY + rowHeight).stroke();
        doc.moveTo(colX.remarks, currentY).lineTo(colX.remarks, currentY + rowHeight).stroke();
        doc.moveTo(colX.unitPrice, currentY).lineTo(colX.unitPrice, currentY + rowHeight).stroke();
        doc.moveTo(colX.totalPrice, currentY).lineTo(colX.totalPrice, currentY + rowHeight).stroke();

        // Cell contents
        doc.font("Helvetica").fontSize(7);
        doc.text(sNo, colX.sNo, currentY + 6, { width: 30, align: "center" });
        doc.text(item.description, colX.desc + 4, currentY + 5, { width: 255 });
        doc.text(String(qty), colX.qty, currentY + 6, { width: 40, align: "center" });
        doc.text(item.unit || "MTR", colX.unit, currentY + 6, { width: 40, align: "center" });
        doc.text(item.remarks || "", colX.remarks + 2, currentY + 6, { width: 56, align: "center" });
        doc.text(unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), colX.unitPrice, currentY + 6, {
          width: 56,
          align: "right",
        });
        doc.text(lineTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), colX.totalPrice, currentY + 6, {
          width: 56,
          align: "right",
        });

        currentY += rowHeight;
      });

      // TOTAL ROW
      const totalRowHeight = 18;
      doc.rect(LEFT, currentY, CONTENT_WIDTH, totalRowHeight).stroke();

      // Divider before total value
      doc.moveTo(colX.totalPrice, currentY).lineTo(colX.totalPrice, currentY + totalRowHeight).stroke();

      doc.font("Helvetica-Bold").fontSize(7.5);
      doc.text(`TOTAL AMOUNT IN ${currency}`, LEFT, currentY + 5, { width: colX.totalPrice - LEFT - 10, align: "right" });
      doc.text(grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), colX.totalPrice, currentY + 5, {
        width: 56,
        align: "right",
      });

      currentY += totalRowHeight + 10;

      const comm = { ...DEFAULT_MSG_TERMS.commercial, ...data.commercialTerms };
      const tech = { ...DEFAULT_MSG_TERMS.technical, ...data.technicalTerms };
      const other = data.otherTerms && data.otherTerms.length > 0 ? data.otherTerms : DEFAULT_MSG_TERMS.other;

      // Section: COMMERCIAL TERMS
      doc.font("Helvetica-Bold").fontSize(7.5).text("COMMERCIAL TERMS:", LEFT, currentY);
      currentY += 10;

      const renderTermLine = (label: string, val: string) => {
        doc.font("Helvetica-Bold").fontSize(7).text(`${label}:`, LEFT + 10, currentY, { width: 75 });
        doc.font("Helvetica").fontSize(6.5).text(val, LEFT + 85, currentY, { width: CONTENT_WIDTH - 90 });
        currentY += doc.heightOfString(val, { width: CONTENT_WIDTH - 90 }) + 3;
      };

      if (comm.price) renderTermLine("Price", comm.price);
      if (comm.validity) renderTermLine("Validity", comm.validity);
      if (comm.payment) renderTermLine("Payment", comm.payment);
      if (comm.cancellation) renderTermLine("Cancellation", comm.cancellation);
      if (comm.ld) renderTermLine("LD", comm.ld);

      currentY += 4;

      // Section: TECHNICAL TERMS
      doc.font("Helvetica-Bold").fontSize(7.5).text("TECHNICAL TERMS:", LEFT, currentY);
      currentY += 10;

      if (tech.delivery) renderTermLine("Delivery", tech.delivery);
      if (tech.mtc) renderTermLine("MTC", tech.mtc);
      if (tech.make) renderTermLine("Make", tech.make);
      if (tech.warranty) renderTermLine("Warranty", tech.warranty);
      if (tech.legalization) renderTermLine("Legalization", tech.legalization);
      if (tech.packing) renderTermLine("Packing", tech.packing);
      if (tech.services) renderTermLine("Services", tech.services);

      currentY += 4;

      // Section: OTHER TERMS
      doc.font("Helvetica-Bold").fontSize(7.5).text("OTHER TERMS:", LEFT, currentY);
      currentY += 10;

      other.slice(0, 7).forEach((term, i) => {
        const bullet = `${i + 1}  `;
        doc.font("Helvetica").fontSize(6.5).text(bullet + term, LEFT + 10, currentY, { width: CONTENT_WIDTH - 15 });
        currentY += doc.heightOfString(bullet + term, { width: CONTENT_WIDTH - 15 }) + 2;
      });

      // PAGE 2 (Terms continuation & Sign-off, matching Image 2 exactly)
      doc.addPage();
      renderHeader();

      let p2Y = 95;

      // Remaining other terms (terms 8, 9, 10 etc.)
      const remainingTerms = other.slice(7);
      if (remainingTerms.length > 0) {
        remainingTerms.forEach((term, i) => {
          const bullet = `${i + 8}  `;
          doc.font("Helvetica").fontSize(7).text(bullet + term, LEFT + 10, p2Y, { width: CONTENT_WIDTH - 15 });
          p2Y += doc.heightOfString(bullet + term, { width: CONTENT_WIDTH - 15 }) + 4;
        });
        p2Y += 15;
      }

      // Closing paragraph
      doc.font("Helvetica").fontSize(7.5)
        .text("Should you have any clarification, please feel free to contact us. Awaiting your valued order confirmation.", LEFT, p2Y);

      p2Y += 25;

      doc.font("Helvetica-Bold").fontSize(8)
        .text(`For ${data.signatoryCompany || "MSG Oilfield Equipment"}`, LEFT, p2Y);

      p2Y += 35;

      // Signatory Name
      doc.font("Helvetica-Bold").fontSize(8.5)
        .text(data.signatoryName || "Mohammed Rizwan", LEFT, p2Y);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
