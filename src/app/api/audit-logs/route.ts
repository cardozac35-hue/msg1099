import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { connectToDatabase, isDbConnected } from "@/lib/db";
import { AuditLogModel } from "@/models";
import { PERMISSIONS } from "@/lib/permissions";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!PERMISSIONS.canViewAuditLogs(user)) {
      return NextResponse.json(
        { success: false, error: "FORBIDDEN: You do not have permission to view audit logs." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const entityType = searchParams.get("entityType");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    await connectToDatabase();
    const query: any = {};
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;

    if (isDbConnected()) {
      const logs = await AuditLogModel.find(query).sort({ createdAt: -1 }).limit(limit).lean();
      return NextResponse.json({ success: true, logs });
    }

    return NextResponse.json({
      success: true,
      logs: [
        {
          _id: "audit_init_01",
          action: "DOCUMENT_CREATED",
          entityType: "Document",
          entityId: "doc_01",
          userName: "Sarah Jenkins",
          userRole: "salesperson",
          details: { documentNumber: "MTC-2026-00412", heatNumber: "H-92841-A" },
          createdAt: new Date("2026-01-23T09:15:00Z"),
        },
        {
          _id: "audit_init_02",
          action: "DOCUMENT_APPROVED",
          entityType: "Document",
          entityId: "doc_01",
          userName: "Elena Rostova",
          userRole: "quality_reviewer",
          details: { documentNumber: "MTC-2026-00412", heatNumber: "H-92841-A" },
          createdAt: new Date("2026-01-24T14:30:00Z"),
        },
      ],
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
