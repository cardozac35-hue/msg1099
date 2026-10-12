import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { dbService } from "@/lib/store";
import { z } from "zod";

const followUpSchema = z.object({
  enquiryId: z.string().min(1, "Enquiry reference is required"),
  enquiryNumber: z.string().min(1),
  quotationId: z.string().optional(),
  quotationNumber: z.string().optional(),
  customerId: z.string().min(1, "Customer is required"),
  customerName: z.string().min(1),
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  type: z.enum(["call", "email", "meeting", "site_visit"]).default("call"),
  outcome: z.enum([
    "pending",
    "positive",
    "neutral",
    "revision_requested",
    "price_negotiation",
    "order_won",
    "lost",
  ]).default("pending"),
  notes: z.string().optional().default(""),
  assignedTo: z.string().min(1),
  assignedToName: z.string().min(1),
});

export async function GET() {
  try {
    await requireAuth();
    const followUps = await dbService.listFollowUps();
    return NextResponse.json({ success: true, followUps });
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

    const parsed = followUpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const newFollowUp = await dbService.createFollowUp(
      {
        ...parsed.data,
        scheduledDate: new Date(parsed.data.scheduledDate),
      },
      { id: user.id, name: user.name }
    );

    // Also update enquiry's nextFollowUpDate
    await dbService.updateEnquiry(
      parsed.data.enquiryId,
      { nextFollowUpDate: new Date(parsed.data.scheduledDate) },
      { id: user.id, name: user.name }
    );

    return NextResponse.json({ success: true, followUp: newFollowUp }, { status: 201 });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
