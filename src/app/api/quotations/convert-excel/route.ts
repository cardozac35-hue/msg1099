import { NextRequest, NextResponse } from "next/server";
import { parsePastedExcelText, parseExcelBuffer } from "@/lib/excel-importer";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      let items: any[] = [];
      try {
        if (file.name.endsWith(".csv") || file.name.endsWith(".txt")) {
          const text = buffer.toString("utf-8");
          items = parsePastedExcelText(text);
        } else {
          items = await parseExcelBuffer(buffer);
        }
      } catch (parseErr: any) {
        console.warn("Buffer parse failed, attempting text fallback:", parseErr.message);
        try {
          const text = buffer.toString("utf-8");
          items = parsePastedExcelText(text);
        } catch {
          // Ignore
        }
      }

      if (!items || items.length === 0) {
        return NextResponse.json({
          success: false,
          error: `Could not parse items from "${file.name}". Please ensure it contains product descriptions and quantities, or copy and paste the rows directly into the text box.`,
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        items,
        totalItems: items.length,
        fileName: file.name,
      });
    }

    // JSON payload with pasted text
    const body = await req.json();
    if (!body.rawText) {
      return NextResponse.json({ success: false, error: "No Excel table text provided" }, { status: 400 });
    }

    const items = parsePastedExcelText(body.rawText);

    return NextResponse.json({
      success: true,
      items,
      totalItems: items.length,
    });
  } catch (err: any) {
    console.error("Excel conversion error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to parse Excel data" },
      { status: 500 }
    );
  }
}
