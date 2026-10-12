import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { validateFile, uploadBufferToCloudinary, sanitizeFilename } from "@/lib/cloudinary";
import { PERMISSIONS } from "@/lib/permissions";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!PERMISSIONS.canUploadDocument(user)) {
      return NextResponse.json(
        { success: false, error: "FORBIDDEN: You do not have permission to upload documents." },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const documentType = (formData.get("documentType") as string) || "Certificate";
    const isConfidential = formData.get("visibilityClassification") === "supplier_confidential";

    if (!file) {
      return NextResponse.json({ success: false, error: "No file was uploaded." }, { status: 400 });
    }

    // Validate size and mime type
    const validation = validateFile({
      name: file.name,
      size: file.size,
      type: file.type,
    });

    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const folder = isConfidential
      ? "confidential_certificates"
      : documentType.toLowerCase().includes("drawing")
      ? "engineering_drawings"
      : "material_certificates";

    const uploadResult = await uploadBufferToCloudinary(buffer, file.name, {
      folder,
      isConfidential,
    });

    const extension = file.name.split(".").pop()?.toLowerCase() || "pdf";

    return NextResponse.json({
      success: true,
      file: {
        originalName: file.name,
        fileName: sanitizeFilename(file.name),
        format: extension,
        fileSize: file.size,
        mimeType: file.type,
        cloudinaryPublicId: uploadResult.publicId,
        cloudinaryUrl: uploadResult.secureUrl,
        cloudinaryAssetId: uploadResult.assetId || "",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
