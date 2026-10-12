import { NextRequest, NextResponse } from "next/server";
import { comparePassword, setSessionCookie } from "@/lib/auth";
import { dbService } from "@/lib/store";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Valid email and password required" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const user = await dbService.findUserByEmail(email);

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials or inactive account" },
        { status: 401 }
      );
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const sessionUser = {
      id: user._id?.toString() || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    await setSessionCookie(sessionUser);

    await logAudit({
      action: "AUTH_LOGIN",
      entityType: "User",
      entityId: sessionUser.id,
      userId: sessionUser.id,
      userName: sessionUser.name,
      userRole: sessionUser.role,
      details: { email: sessionUser.email },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({
      success: true,
      user: sessionUser,
    });
  } catch (err: any) {
    console.error("Login API error:", err);
    return NextResponse.json(
      { success: false, error: "Authentication failed" },
      { status: 500 }
    );
  }
}
