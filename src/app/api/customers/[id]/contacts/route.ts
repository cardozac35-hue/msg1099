import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { dbService } from "@/lib/store";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Contact name is required"),
  designation: z.string().optional().default(""),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional().default(""),
  isPrimary: z.boolean().default(false),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();
    const body = await req.json();

    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const contact = await dbService.createContact({
      ...parsed.data,
      customerId: params.id,
    });

    return NextResponse.json({ success: true, contact }, { status: 201 });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
