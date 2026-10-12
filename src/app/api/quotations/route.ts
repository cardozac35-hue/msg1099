import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { dbService } from "@/lib/store";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const quotationItemSchema = z.object({
  enquiryItemId: z.string().optional(),
  productId: z.string().optional(),
  itemDescription: z.string().min(2, "Product description is required"),
  category: z.string().optional().default(""),
  materialGrade: z.string().optional().default(""),
  standard: z.string().optional().default(""),
  size: z.string().optional().default(""),
  pressureClass: z.string().optional().default(""),
  connectionType: z.string().optional().default(""),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitOfMeasure: z.string().default("EA"),
  unitSellingPrice: z.number().min(0, "Unit selling price must be non-negative"),
  discountPercent: z.number().min(0).max(100).default(0),
  leadTime: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

const createQuotationSchema = z.object({
  enquiryId: z.string().min(1, "Enquiry reference is required"),
  enquiryNumber: z.string().min(1),
  customerId: z.string().min(1, "Customer is required"),
  customerName: z.string().min(1),
  contactId: z.string().min(1, "Contact person is required"),
  contactName: z.string().min(1),
  currency: z.string().default("USD"),
  validityDate: z.string().min(1, "Validity date is required"),
  deliveryTerms: z.string().default("FOB Dubai Port (Incoterms 2020)"),
  paymentTerms: z.string().default("Net 30 Days"),
  leadTime: z.string().default("4-6 Weeks ARO"),
  discountPercent: z.number().min(0).max(100).default(0),
  taxPercent: z.number().min(0).default(5),
  notes: z.string().optional().default(""),
  items: z.array(quotationItemSchema).min(1, "At least one item is required"),
});

export async function GET() {
  try {
    await requireAuth();
    const quotations = await dbService.listQuotations();
    return NextResponse.json({ success: true, quotations });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const parsed = createQuotationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const createdQuotation = await dbService.createQuotation(
      {
        ...parsed.data,
        validityDate: new Date(parsed.data.validityDate),
      },
      { id: user.id, name: user.name }
    );

    // Update parent enquiry status to 'quoted'
    await dbService.updateEnquiry(
      parsed.data.enquiryId,
      { status: "quoted" },
      { id: user.id, name: user.name }
    );

    await logAudit({
      action: "QUOTATION_CREATED",
      entityType: "Quotation",
      entityId: createdQuotation._id?.toString() || createdQuotation.id,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      details: {
        quotationCode: createdQuotation.quotationCode,
        enquiryNumber: createdQuotation.enquiryNumber,
        totalAmount: createdQuotation.totalAmount,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({ success: true, quotation: createdQuotation }, { status: 201 });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
