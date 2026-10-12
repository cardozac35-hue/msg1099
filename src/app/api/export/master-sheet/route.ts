import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { dbService } from "@/lib/store";
import { generateMasterSheetExcel } from "@/lib/excel";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    // Query rows with role-dependent projection
    const rows = await dbService.getMasterRegister(user.role);

    // Generate Excel buffer with role-based columns
    const excelBuffer = await generateMasterSheetExcel(rows, user.role);

    await logAudit({
      action: "MASTER_SHEET_EXPORTED",
      entityType: "MasterSheet",
      entityId: "ALL",
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      details: { rowCount: rows.length, exportedRole: user.role },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `Oil_Gas_Sales_Hub_Master_${user.role}_${dateStr}.xlsx`;

    return new Response(excelBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
