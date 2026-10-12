import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { orderDocumentService } from "@/services/order-document-service";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const result = await orderDocumentService.getOrderChecklist("SO", params.id, user);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    const status = err.message.includes("not found") ? 404 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
