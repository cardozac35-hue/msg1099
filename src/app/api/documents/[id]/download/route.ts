import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { documentService } from "@/services/document-service";
import { generateSignedDocumentUrl } from "@/lib/cloudinary";
import { logAudit } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const result = await documentService.getDocumentById(params.id, user);
    const doc = result.document;

    // Log Download Audit Event
    await logAudit({
      action: "DOCUMENT_DOWNLOADED",
      entityType: "Document",
      entityId: String(doc._id || doc.id),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      details: {
        documentNumber: doc.documentNumber,
        versionNumber: doc.versionNumber,
        format: doc.format,
      },
    });

    // Generate short-lived signed access URL
    const signedUrl = generateSignedDocumentUrl(doc.cloudinaryPublicId, 3600);

    return NextResponse.json({
      success: true,
      downloadUrl: signedUrl,
      documentNumber: doc.documentNumber,
      format: doc.format,
      filename: `${doc.documentNumber}_Rev${doc.revision}.${doc.format}`,
    });
  } catch (err: any) {
    const status = err.message.includes("FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
