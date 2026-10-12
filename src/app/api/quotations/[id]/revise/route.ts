import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { dbService } from "@/lib/store";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const reviseQuotationSchema = z.object({
  validityDate: z.string().min(1, "Validity date is required"),
  deliveryTerms: z.string().default("FOB Dubai Port (Incoterms 2020)"),
  paymentTerms: z.string().default("Net 30 Days"),
  leadTime: z.string().default("4-6 Weeks ARO"),
  discountPercent: z.number().min(0).max(100).default(0),
  taxPercent: z.number().min(0).default(5),
  notes: z.string().optional().default(""),
  items: z.array(
    z.object({
      enquiryItemId: z.string().optional(),
      productId: z.string().optional(),
      itemDescription: z.string().min(2),
      category: z.string().optional().default(""),
      materialGrade: z.string().optional().default(""),
      standard: z.string().optional().default(""),
      size: z.string().optional().default(""),
      pressureClass: z.string().optional().default(""),
      connectionType: z.string().optional().default(""),
      quantity: z.number().min(1),
      unitOfMeasure: z.string().default("EA"),
      unitSellingPrice: z.number().min(0),
      discountPercent: z.number().min(0).max(100).default(0),
      leadTime: z.string().optional().default(""),
      notes: z.string().optional().default(""),
    })
  ).min(1),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const parsed = reviseQuotationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const newRevision = await dbService.createQuotationRevision(
      params.id,
      {
        ...parsed.data,
        validityDate: new Date(parsed.data.validityDate),
      },
      { id: user.id, name: user.name }
    );

    await logAudit({
      action: "QUOTATION_REVISED",
      entityType: "Quotation",
      entityId: newRevision._id?.toString() || newRevision.id,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      details: {
        parentQuotationId: params.id,
        newQuotationCode: newRevision.quotationCode,
        revisionNumber: newRevision.revision,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({ success: true, quotation: newRevision }, { status: 201 });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
