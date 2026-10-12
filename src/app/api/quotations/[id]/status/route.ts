import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { dbService } from "@/lib/store";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum([
    "draft",
    "pending_approval",
    "approved",
    "rejected",
    "sent",
    "accepted",
    "declined",
  ]),
  rejectionReason: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { status, rejectionReason } = parsed.data;

    // Only Admin can approve or reject
    if (["approved", "rejected"].includes(status) && user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Only administrators can approve or reject quotations" },
        { status: 403 }
      );
    }

    const updated = await dbService.updateQuotationStatus(
      params.id,
      status,
      { id: user.id, name: user.name },
      rejectionReason
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: "Quotation not found" }, { status: 404 });
    }

    await logAudit({
      action: status === "approved" ? "QUOTATION_APPROVED" : status === "rejected" ? "QUOTATION_REJECTED" : "QUOTATION_SENT",
      entityType: "Quotation",
      entityId: params.id,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      details: { newStatus: status, rejectionReason },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({ success: true, quotation: updated });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
