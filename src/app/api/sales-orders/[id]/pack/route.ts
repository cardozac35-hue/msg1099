import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { orderDocumentService } from "@/services/order-document-service";

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const result = await orderDocumentService.generateCustomerDocumentPack(params.id, user);

    const headers = new Headers();
    headers.set("Content-Type", "application/zip");
    headers.set("Content-Disposition", `attachment; filename="${result.filename}"`);
    headers.set("Content-Length", result.zipBuffer.length.toString());

    return new NextResponse(result.zipBuffer as any, {
      status: 200,
      headers,
    });
  } catch (err: any) {
    const status = err.message.includes("FORBIDDEN")
      ? 403
      : err.message.includes("NO QUALIFYING")
      ? 404
      : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
