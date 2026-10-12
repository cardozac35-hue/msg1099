import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { dbService } from "@/lib/store";
import { z } from "zod";

const customerSchema = z.object({
  customerCode: z.string().min(2, "Customer code required"),
  name: z.string().min(2, "Customer name required"),
  industry: z.string().default("Oil & Gas Upstream"),
  country: z.string().min(2, "Country required"),
  city: z.string().optional().default(""),
  address: z.string().optional().default(""),
  taxNumber: z.string().optional().default(""),
  paymentTerms: z.string().default("Net 30 Days"),
  creditLimit: z.number().default(0),
  currency: z.string().default("USD"),
  notes: z.string().optional().default(""),
});

export async function GET() {
  try {
    await requireAuth();
    const customers = await dbService.listCustomers();
    const contacts = await dbService.listContacts();
    return NextResponse.json({ success: true, customers, contacts });
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

    const parsed = customerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const newCustomer = await dbService.createCustomer(parsed.data);
    return NextResponse.json({ success: true, customer: newCustomer }, { status: 201 });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
