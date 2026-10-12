import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { documentService } from "@/services/document-service";
import { ReplaceDocumentSchema } from "@/lib/validation";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();

    const validation = ReplaceDocumentSchema.safeParse(body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    const { newRevision, changeReason, cloudinaryPublicId, cloudinaryUrl, format, fileSize } =
      validation.data;

    const result = await documentService.replaceDocumentVersion(
      params.id,
      newRevision,
      changeReason,
      {
        cloudinaryPublicId,
        cloudinaryUrl,
        format,
        fileSize,
      },
      user
    );

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    const status = err.message.includes("FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
