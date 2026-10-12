import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { dbService } from "@/lib/store";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const createSupplierQuoteSchema = z.object({
  enquiryId: z.string().min(1, "Enquiry ID required"),
  enquiryItemId: z.string().min(1, "Enquiry line item ID required"),
  supplierId: z.string().min(1, "Supplier ID required"),
  supplierName: z.string().min(1),
  supplierReference: z.string().min(1, "Supplier RFQ reference required"),
  quoteDate: z.string().optional(),
  validityDate: z.string().min(1, "Validity date required"),
  currency: z.string().default("USD"),
  unitPurchasePrice: z.number().min(0, "Purchase price must be positive"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitOfMeasure: z.string().default("EA"),
  allocatedFreight: z.number().default(0),
  allocatedCustomsDuties: z.number().default(0),
  otherApplicableCosts: z.number().default(0),
  leadTimeWeeks: z.number().default(2),
  paymentTerms: z.string().default("Net 30 Days"),
  isSelected: z.boolean().default(false),
  notes: z.string().optional().default(""),
});

export async function GET(req: NextRequest) {
  try {
    // STRICT ADMIN GUARD
    const user = await requireAdmin();

    const { searchParams } = new URL(req.url);
    const enquiryId = searchParams.get("enquiryId");

    let quotes: any[] = [];
    if (enquiryId) {
      quotes = await dbService.listSupplierQuotesForEnquiry(enquiryId, user.role);
    } else {
      quotes = await dbService.listAllSupplierQuotes(user.role);
    }

    return NextResponse.json({ success: true, supplierQuotes: quotes });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (err.message === "FORBIDDEN" || err.message.includes("FORBIDDEN")) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Salespeople are strictly prohibited from accessing supplier costs" },
        { status: 403 }
      );
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await req.json();

    const parsed = createSupplierQuoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const created = await dbService.createSupplierQuote(
      {
        ...parsed.data,
        quoteDate: parsed.data.quoteDate ? new Date(parsed.data.quoteDate) : new Date(),
        validityDate: new Date(parsed.data.validityDate),
        createdBy: user.id,
      },
      user.role
    );

    await logAudit({
      action: "SUPPLIER_QUOTE_CREATED",
      entityType: "SupplierQuote",
      entityId: created._id?.toString() || created.id,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      details: {
        supplierName: parsed.data.supplierName,
        supplierReference: parsed.data.supplierReference,
        unitPurchasePrice: parsed.data.unitPurchasePrice,
        calculatedUnitLandedCost: created.calculatedUnitLandedCost,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({ success: true, supplierQuote: created }, { status: 201 });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (err.message === "FORBIDDEN" || err.message.includes("FORBIDDEN")) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Administrator privileges required" },
        { status: 403 }
      );
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
