import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { dbService } from "@/lib/store";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAdmin();
    const body = await req.json();

    const updated = await dbService.updateSupplierQuote(params.id, body, user.role);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Supplier quote not found" }, { status: 404 });
    }

    await logAudit({
      action: "SUPPLIER_QUOTE_UPDATED",
      entityType: "SupplierQuote",
      entityId: params.id,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      details: body,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({ success: true, supplierQuote: updated });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (err.message === "FORBIDDEN" || err.message.includes("FORBIDDEN")) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Administrator privileges required" },
        { status: 403 }
      );
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAdmin();
    const deleted = await dbService.deleteSupplierQuote(params.id, user.role);

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Supplier quote not found" }, { status: 404 });
    }

    await logAudit({
      action: "SUPPLIER_QUOTE_DELETED",
      entityType: "SupplierQuote",
      entityId: params.id,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      details: { deletedId: params.id },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({ success: true, message: "Supplier quote deleted" });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (err.message === "FORBIDDEN" || err.message.includes("FORBIDDEN")) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Administrator privileges required" },
        { status: 403 }
      );
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
