import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { dbService } from "@/lib/store";
import { z } from "zod";

const supplierSchema = z.object({
  supplierCode: z.string().min(2, "Supplier code required"),
  name: z.string().min(2, "Supplier name required"),
  country: z.string().min(2, "Country required"),
  rating: z.number().min(1).max(5).default(5),
  paymentTerms: z.string().default("Net 60 Days"),
  contactName: z.string().optional().default(""),
  email: z.string().email("Valid email required"),
  phone: z.string().optional().default(""),
  leadTimeAverageDays: z.number().default(21),
  notes: z.string().optional().default(""),
});

export async function GET() {
  try {
    await requireAuth();
    const suppliers = await dbService.listSuppliers();
    return NextResponse.json({ success: true, suppliers });
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
    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only administrators can create new suppliers" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = supplierSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const newSupplier = await dbService.createSupplier(parsed.data);
    return NextResponse.json({ success: true, supplier: newSupplier }, { status: 201 });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
