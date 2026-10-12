import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { dbService } from "@/lib/store";
import { logAudit } from "@/lib/audit";

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const enquiry = await dbService.getEnquiryById(params.id);

    if (!enquiry) {
      return NextResponse.json({ success: false, error: "Enquiry not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      enquiry,
      userRole: user.role,
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    // Whitelist explicitly permitted fields to prevent mass assignment
    const allowedFields = ["status", "priority", "nextFollowUpDate", "notes", "assignedTo", "assignedToName"];
    const sanitizedUpdates: any = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        sanitizedUpdates[key] = body[key];
      }
    }

    if (sanitizedUpdates.nextFollowUpDate) {
      sanitizedUpdates.nextFollowUpDate = new Date(sanitizedUpdates.nextFollowUpDate);
    }

    const updatedEnquiry = await dbService.updateEnquiry(
      params.id,
      sanitizedUpdates,
      { id: user.id, name: user.name }
    );

    if (!updatedEnquiry) {
      return NextResponse.json({ success: false, error: "Enquiry not found" }, { status: 404 });
    }

    await logAudit({
      action: "ENQUIRY_UPDATED",
      entityType: "Enquiry",
      entityId: params.id,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      details: sanitizedUpdates,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({ success: true, enquiry: updatedEnquiry });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
