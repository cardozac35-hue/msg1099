import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { dbService } from "@/lib/store";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const createUserSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "salesperson"]).default("salesperson"),
});

export async function GET() {
  try {
    const user = await requireAdmin();
    const users = await dbService.listUsers();
    return NextResponse.json({ success: true, users });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (err.message === "FORBIDDEN" || err.message.includes("FORBIDDEN")) {
      return NextResponse.json({ success: false, error: "Forbidden: Admin required" }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();

    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const existing = await dbService.findUserByEmail(parsed.data.email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const newUser = await dbService.createUser(parsed.data);

    await logAudit({
      action: "USER_UPDATED",
      entityType: "User",
      entityId: newUser._id?.toString() || newUser.id,
      userId: admin.id,
      userName: admin.name,
      userRole: admin.role,
      details: { createdUserEmail: parsed.data.email, role: parsed.data.role },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (err.message === "FORBIDDEN" || err.message.includes("FORBIDDEN")) {
      return NextResponse.json({ success: false, error: "Forbidden: Admin required" }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
