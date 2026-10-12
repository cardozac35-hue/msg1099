import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { dbService } from "@/lib/store";
import { generateQuotationPdf } from "@/lib/pdf";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();
    const quotation = await dbService.getQuotationById(params.id);

    if (!quotation) {
      return NextResponse.json({ success: false, error: "Quotation not found" }, { status: 404 });
    }

    const pdfBuffer = await generateQuotationPdf({
      quotationNumber: quotation.quotationNumber,
      revision: quotation.revision,
      quotationCode: quotation.quotationCode,
      createdAt: quotation.createdAt,
      validityDate: quotation.validityDate,
      customerName: quotation.customerName,
      contactName: quotation.contactName,
      currency: quotation.currency,
      deliveryTerms: quotation.deliveryTerms,
      paymentTerms: quotation.paymentTerms,
      leadTime: quotation.leadTime,
      items: quotation.items.map((it: any) => ({
        itemDescription: it.itemDescription,
        materialGrade: it.materialGrade,
        standard: it.standard,
        size: it.size,
        pressureClass: it.pressureClass,
        quantity: it.quantity,
        unitOfMeasure: it.unitOfMeasure,
        unitSellingPrice: it.unitSellingPrice,
        discountPercent: it.discountPercent,
        lineTotal: it.lineTotal,
        leadTime: it.leadTime,
      })),
      subtotal: quotation.subtotal,
      discountAmount: quotation.discountAmount,
      taxAmount: quotation.taxAmount,
      taxPercent: quotation.taxPercent,
      totalAmount: quotation.totalAmount,
      notes: quotation.notes,
      createdByName: quotation.createdByName,
    });

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Quotation_${quotation.quotationCode}.pdf"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
