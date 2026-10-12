import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, isDbConnected } from "@/lib/db";
import { MaterialModel } from "@/models";
import { memoryMaterials } from "@/services/document-service";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    if (isDbConnected()) {
      const materials = await MaterialModel.find({ isActive: true }).sort({ materialCode: 1 }).lean();
      return NextResponse.json({ success: true, materials });
    }
    return NextResponse.json({ success: true, materials: memoryMaterials });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
