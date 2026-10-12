import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { dbService } from "@/lib/store";

export async function GET() {
  try {
    const user = await requireAdmin();
    const logs = await dbService.listAuditLogs(user.role);
    return NextResponse.json({ success: true, auditLogs: logs });
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
