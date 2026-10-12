import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { dbService } from "@/lib/store";

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();
    const body = await req.json();

    const allowed = ["status", "outcome", "notes", "completedDate", "scheduledDate"];
    const updates: any = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    if (updates.status === "completed" && !updates.completedDate) {
      updates.completedDate = new Date();
    }

    const updated = await dbService.updateFollowUp(params.id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Follow-up not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, followUp: updated });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
