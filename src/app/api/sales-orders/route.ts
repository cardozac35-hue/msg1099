import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, isDbConnected } from "@/lib/db";
import { SalesOrderModel } from "@/models";
import { memorySalesOrders } from "@/services/document-service";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    if (isDbConnected()) {
      const sos = await SalesOrderModel.find().sort({ orderDate: -1 }).lean();
      return NextResponse.json({ success: true, salesOrders: sos });
    }
    return NextResponse.json({ success: true, salesOrders: memorySalesOrders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
