import { NextRequest, NextResponse } from "next/server";
import { generateMsgQuotationPdf, MsgQuotationData } from "@/lib/msg-pdf";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const data: MsgQuotationData = await req.json();

    if (!data.quotationRef || !data.items || data.items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Quotation reference and at least one item are required" },
        { status: 400 }
      );
    }

    const pdfBuffer = await generateMsgQuotationPdf(data);

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Quotation_${data.quotationRef}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (err: any) {
    console.error("PDF generation error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
