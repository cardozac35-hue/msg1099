import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, isDbConnected } from "@/lib/db";
import { MaterialBatchModel } from "@/models";
import { memoryMaterialBatches } from "@/services/document-service";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    if (isDbConnected()) {
      const batches = await MaterialBatchModel.find().sort({ createdAt: -1 }).lean();
      return NextResponse.json({ success: true, batches });
    }
    return NextResponse.json({ success: true, batches: memoryMaterialBatches });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
