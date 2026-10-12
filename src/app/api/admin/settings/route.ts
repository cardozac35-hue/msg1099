import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/session";
import { dbService } from "@/lib/store";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireAuth();
    const settings = await dbService.getSettings();
    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();

    const updated = await dbService.updateSettings(body, admin.role);

    await logAudit({
      action: "SETTINGS_UPDATED",
      entityType: "Settings",
      entityId: "APP_SETTINGS",
      userId: admin.id,
      userName: admin.name,
      userRole: admin.role,
      details: body,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (err.message === "FORBIDDEN" || err.message.includes("FORBIDDEN")) {
      return NextResponse.json({ success: false, error: "Forbidden: Admin required" }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
