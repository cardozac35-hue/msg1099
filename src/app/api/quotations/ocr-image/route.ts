import { NextRequest, NextResponse } from "next/server";
import { parseScreenshotImage } from "@/lib/ocr-service";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let buffer: Buffer | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json({ success: false, error: "No image file provided" }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
    } else {
      const body = await req.json();
      if (!body.imageBase64) {
        return NextResponse.json({ success: false, error: "No imageBase64 data provided" }, { status: 400 });
      }

      // Strip data:image/...;base64, header if present
      const cleanBase64 = body.imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
      buffer = Buffer.from(cleanBase64, "base64");
    }

    if (!buffer || buffer.length === 0) {
      return NextResponse.json({ success: false, error: "Empty image buffer received" }, { status: 400 });
    }

    const { items, rawText } = await parseScreenshotImage(buffer);

    if (items.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Could not detect clear line items in this screenshot. Please ensure the table text is visible or paste rows directly into the text area.",
        rawText,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      items,
      rawText,
      totalItems: items.length,
    });
  } catch (err: any) {
    console.error("Screenshot OCR error:", err);
    return NextResponse.json({
      success: false,
      error: err.message || "Failed to process screenshot image",
    }, { status: 500 });
  }
}
