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
    const body = await req.json().catch(() => ({}));
    const { comments, checklistVerifications, allowSelfApprovalException } = body;

    const result = await documentService.approveDocument(
      params.id,
      comments || "",
      checklistVerifications || [],
      user,
      Boolean(allowSelfApprovalException)
    );

    return NextResponse.json({ ...result });
  } catch (err: any) {
    const status =
      err.message.includes("FORBIDDEN") ||
      err.message.includes("REJECTED") ||
      err.message.includes("Self-approval")
        ? 403
        : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
