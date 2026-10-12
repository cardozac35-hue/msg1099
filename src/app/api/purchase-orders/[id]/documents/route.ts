import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { documentService } from "@/services/document-service";

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const result = await documentService.listDocuments(
      { poNumber: params.id },
      user
    );
    return NextResponse.json({ ...result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
