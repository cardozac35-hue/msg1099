import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "demo",
  api_key: process.env.CLOUDINARY_API_KEY || "123456789012345",
  api_secret: process.env.CLOUDINARY_API_SECRET || "sample_cloudinary_secret",
  secure: true,
});

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export function validateFile(file: { name: string; size: number; type: string }): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: "File exceeds maximum permitted size of 25 MB" };
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: `Disallowed file type: ${file.type}. Allowed: PDF, JPG, PNG, WEBP, XLSX, DOCX.` };
  }
  return { valid: true };
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export interface UploadOptions {
  folder?: string;
  isConfidential?: boolean;
  publicId?: string;
}

export async function uploadBufferToCloudinary(
  buffer: Buffer,
  filename: string,
  options: UploadOptions = {}
): Promise<{ publicId: string; secureUrl: string; resourceType: string; assetId?: string }> {
  // If running with mock/demo credentials in local development or test
  if (
    !process.env.CLOUDINARY_API_SECRET ||
    process.env.CLOUDINARY_API_SECRET.includes("sample") ||
    process.env.CLOUDINARY_CLOUD_NAME === "demo"
  ) {
    const cleanId = `oil_gas_hub/${options.folder || "general"}/${Date.now()}_${sanitizeFilename(filename)}`;
    return {
      publicId: cleanId,
      secureUrl: `https://res.cloudinary.com/demo/raw/upload/${cleanId}`,
      resourceType: "raw",
      assetId: `cld_mock_${Date.now()}`,
    };
  }

  const cleanFilename = sanitizeFilename(filename);
  const folder = options.folder ? `oil_gas_hub/${options.folder}` : "oil_gas_hub/general";

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        type: options.isConfidential ? "authenticated" : "upload",
        public_id: options.publicId || `${Date.now()}_${cleanFilename}`,
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Cloudinary upload failed"));
        } else {
          resolve({
            publicId: result.public_id,
            secureUrl: result.secure_url,
            resourceType: result.resource_type,
            assetId: (result as any).asset_id || result.public_id,
          });
        }
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Generates time-limited signed delivery URL for confidential documents.
 * Only authenticated users with admin privileges can generate this.
 */
export function generateSignedDocumentUrl(publicId: string, expiresInSeconds: number = 3600): string {
  if (
    !process.env.CLOUDINARY_API_SECRET ||
    process.env.CLOUDINARY_API_SECRET.includes("sample") ||
    process.env.CLOUDINARY_CLOUD_NAME === "demo"
  ) {
    return `https://res.cloudinary.com/demo/raw/upload/${publicId}?expires=${Date.now() + expiresInSeconds * 1000}`;
  }

  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  return cloudinary.utils.private_download_url(publicId, "", {
    expires_at: expiresAt,
  });
}
