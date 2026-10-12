import { NextRequest, NextResponse } from "next/server";
import { convertOcrWithAi } from "@/lib/ai-ocr-parser";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, instructions, apiKey } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { success: false, error: "No input text provided for AI conversion" },
        { status: 400 }
      );
    }

    const result = await convertOcrWithAi(text, instructions, apiKey);

    return NextResponse.json({
      success: true,
      items: result.items,
      summary: result.summary,
      engineUsed: result.engineUsed,
      totalItems: result.items.length,
      rawText: result.rawText,
    });
  } catch (err: any) {
    console.error("AI OCR Conversion error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process AI OCR conversion" },
      { status: 500 }
    );
  }
}
