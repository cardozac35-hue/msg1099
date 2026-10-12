import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { documentService } from "@/services/document-service";

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { reason, comments, checklistVerifications } = body;

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { success: false, error: "A mandatory rejection reason is required." },
        { status: 400 }
      );
    }

    const result = await documentService.rejectDocument(
      params.id,
      reason.trim(),
      comments || "",
      checklistVerifications || [],
      user
    );

    return NextResponse.json({ ...result });
  } catch (err: any) {
    const status = err.message.includes("FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
