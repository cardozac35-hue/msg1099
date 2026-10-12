import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { documentService } from "@/services/document-service";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const metrics = await documentService.getDashboardMetrics(user);
    return NextResponse.json({ success: true, ...metrics, currentUser: user });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
