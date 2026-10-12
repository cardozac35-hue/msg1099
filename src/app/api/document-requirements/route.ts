import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { connectToDatabase, isDbConnected } from "@/lib/db";
import { DocumentRequirementModel } from "@/models";
import { memoryRequirements } from "@/services/document-service";
import { DocumentRequirementConfigSchema } from "@/lib/validation";
import { PERMISSIONS } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    if (isDbConnected()) {
      const requirements = await DocumentRequirementModel.find().sort({ createdAt: -1 }).lean();
      return NextResponse.json({ success: true, requirements });
    }
    return NextResponse.json({ success: true, requirements: memoryRequirements });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!PERMISSIONS.canManageRequirements(user)) {
      return NextResponse.json(
        { success: false, error: "FORBIDDEN: Only administrators can configure document requirements." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = DocumentRequirementConfigSchema.safeParse(body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    await connectToDatabase();
    let created: any = null;

    if (isDbConnected()) {
      created = await DocumentRequirementModel.create(validation.data as any);
    } else {
      created = {
        _id: `req_${Date.now()}`,
        id: `req_${Date.now()}`,
        ...validation.data,
        createdAt: new Date(),
      };
      memoryRequirements.unshift(created);
    }

    await logAudit({
      action: "DOCUMENT_REQUIREMENT_CREATED",
      entityType: "DocumentRequirement",
      entityId: String(created._id || created.id),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      details: {
        ruleName: created.ruleName,
        documentType: created.documentType,
        isMandatory: created.isMandatory,
      },
    });

    return NextResponse.json({ success: true, requirement: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
