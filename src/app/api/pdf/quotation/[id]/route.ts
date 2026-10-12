import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { dbService } from "@/lib/store";
import { generateQuotationPdf } from "@/lib/pdf";
import { generateMsgQuotationPdf } from "@/lib/msg-pdf";

export const dynamic = 'force-dynamic';

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

    const format = req.nextUrl.searchParams.get("format");

    if (format === "apex") {
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

      return new Response(pdfBuffer as any, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="Quotation_${quotation.quotationCode}.pdf"`,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // Default: Official MSG Quotation Format matching company branding & images
    const dateObj = quotation.createdAt ? new Date(quotation.createdAt) : new Date();
    const formattedDate = `${String(dateObj.getDate()).padStart(2, "0")}-${String(
      dateObj.getMonth() + 1
    ).padStart(2, "0")}-${dateObj.getFullYear()}`;

    const pdfBuffer = await generateMsgQuotationPdf({
      companyName: "MSG Oilfield Equipment Trading LLC",
      toCustomer: quotation.customerName || "VALUED CLIENT",
      address: quotation.deliveryTerms?.includes("Dubai")
        ? "JEBEL ALI FREE ZONE, DUBAI, UAE"
        : "DUBAI, UNITED ARAB EMIRATES",
      clientRef: quotation.enquiryNumber || "WHATSAPP / EMAIL ENQUIRY",
      quotationRef: quotation.quotationCode,
      attention: quotation.contactName || "PURCHASE / PROCUREMENT DEPT",
      date: formattedDate,
      currency: quotation.currency || "USD",
      items: (quotation.items || []).map((it: any, idx: number) => ({
        sNo: idx + 1,
        description: it.itemDescription,
        quantity: it.quantity,
        unit: it.unitOfMeasure || "MTR",
        unitPrice: it.unitSellingPrice || 0,
        totalPrice: it.lineTotal || (it.quantity || 1) * (it.unitSellingPrice || 0),
        remarks: it.notes || "",
      })),
      signatoryName: quotation.createdByName || "Mohammed Rizwan",
      signatoryCompany: "MSG Oilfield Equipment",
    });

    return new Response(pdfBuffer as any, {
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
