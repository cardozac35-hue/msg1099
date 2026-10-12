import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { dbService } from "@/lib/store";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireAuth();
    // dbService.getMasterRegister automatically omits confidential columns for salespeople
    const rows = await dbService.getMasterRegister(user.role);
    return NextResponse.json({
      success: true,
      rows,
      userRole: user.role,
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
