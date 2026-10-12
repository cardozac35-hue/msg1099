import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { traceabilityService } from "@/services/traceability-service";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";

    const results = await traceabilityService.searchTraceability(query, user);
    return NextResponse.json({ success: true, results, count: results.length });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
