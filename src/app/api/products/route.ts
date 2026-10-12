import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { dbService } from "@/lib/store";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const productSchema = z.object({
  sku: z.string().min(2, "SKU is required"),
  name: z.string().min(2, "Product name is required"),
  category: z.string().default("Valves"),
  materialGrade: z.string().min(1, "Material grade is required"),
  standard: z.string().min(1, "Standard (e.g. API 6D, ASME B16.5) is required"),
  size: z.string().min(1, "Size is required"),
  pressureClass: z.string().min(1, "Pressure class is required"),
  connectionType: z.string().min(1, "Connection type is required"),
  unitOfMeasure: z.string().default("EA"),
  description: z.string().optional().default(""),
  listPrice: z.number().default(0),
  currency: z.string().default("USD"),
  specifications: z.record(z.string(), z.string()).optional().default({}),
});

export async function GET() {
  try {
    await requireAuth();
    const products = await dbService.listProducts();
    return NextResponse.json({ success: true, products });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();

    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const newProd = await dbService.createProduct(parsed.data);
    return NextResponse.json({ success: true, product: newProd }, { status: 201 });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
