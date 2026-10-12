import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { documentService } from "@/services/document-service";
import { UpdateDocumentSchema } from "@/lib/validation";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const result = await documentService.getDocumentById(params.id, user);
    return NextResponse.json({ success: true, ...result, currentUser: user });
  } catch (err: any) {
    const status = err.message.includes("FORBIDDEN")
      ? 403
      : err.message.includes("not found")
      ? 404
      : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();

    const validation = UpdateDocumentSchema.safeParse(body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    const updated = await documentService.updateMetadata(params.id, validation.data, user);
    return NextResponse.json({ success: true, document: updated });
  } catch (err: any) {
    const status = err.message.includes("FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
