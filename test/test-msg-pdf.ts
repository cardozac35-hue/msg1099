import { generateMsgQuotationPdf } from "../src/lib/msg-pdf";
import fs from "fs";

async function testPdf() {
  console.log("Testing MSG Quotation PDF generation...");

  const pdfBuffer = await generateMsgQuotationPdf({
    companyName: "MSG Oilfield Equipment Trading LLC",
    toCustomer: "PREMIER ENERGY SERVICES",
    address: "JEBEL ALI FREE ZONE, DUBAI, UAE",
    clientRef: "WHATSAPP ENQUIRY-PIPE",
    quotationRef: "MSG-1026-12466-Q",
    attention: "PURCHASE / PROCUREMENT DEPT",
    date: "08-10-2026",
    currency: "USD",
    items: [
      {
        sNo: 1,
        description: "PIPE 6\" S.80 SEAMLESS CS MATERIAL ACC TO ASTM A106 GR.B DIMENSION ACC TO ANSI B36.10 DRL",
        quantity: 240,
        unit: "MTR",
        remarks: "",
        unitPrice: 114.0,
        totalPrice: 27360.0,
      },
      {
        sNo: 2,
        description: "PIPE 8\" S.80 SEAMLESS CS MATERIAL ACC TO ASTM A106 GR.B DIMENSION ACC TO ANSI B36.10 DRL",
        quantity: 144,
        unit: "MTR",
        remarks: "",
        unitPrice: 165.0,
        totalPrice: 23760.0,
      },
      {
        sNo: 3,
        description: "PIPE 10\" S.80 SEAMLESS CS MATERIAL ACC TO ASTM A106 GR.B DIMENSION ACC TO ANSI B36.10 DRL",
        quantity: 120,
        unit: "MTR",
        remarks: "",
        unitPrice: 248.0,
        totalPrice: 29760.0,
      },
    ],
    signatoryName: "Mohammed Rizwan",
    signatoryCompany: "MSG Oilfield Equipment",
  });

  console.log(`Generated PDF successfully! Size: ${pdfBuffer.length} bytes.`);
  fs.writeFileSync("test-output-quotation.pdf", pdfBuffer);
  console.log("Saved test-output-quotation.pdf successfully.");
}

testPdf().catch((err) => {
  console.error("PDF test error:", err);
  process.exit(1);
});
