import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (session) {
      await logAudit({
        action: "AUTH_LOGOUT",
        entityType: "User",
        entityId: session.id,
        userId: session.id,
        userName: session.name,
        userRole: session.role,
        details: { email: session.email },
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      });
    }

    await clearSessionCookie();
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
