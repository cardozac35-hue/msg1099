import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, isDbConnected } from "@/lib/db";
import { PurchaseOrderModel } from "@/models";
import { memoryPurchaseOrders } from "@/services/document-service";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    if (isDbConnected()) {
      const pos = await PurchaseOrderModel.find().sort({ orderDate: -1 }).lean();
      return NextResponse.json({ success: true, purchaseOrders: pos });
    }
    return NextResponse.json({ success: true, purchaseOrders: memoryPurchaseOrders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
