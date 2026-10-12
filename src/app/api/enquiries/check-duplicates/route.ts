import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { dbService } from "@/lib/store";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    const { customerId, items } = body;

    if (!customerId) {
      return NextResponse.json({ success: true, hasPotentialDuplicate: false, duplicates: [] });
    }

    const itemSpecs = (items || []).map((it: any) => ({
      size: it.size,
      materialGrade: it.materialGrade,
      standard: it.standard,
    }));

    const result = await dbService.checkDuplicateEnquiries(customerId, itemSpecs);
    return NextResponse.json({ ...result });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
