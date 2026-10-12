import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbService } from "@/lib/store";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const resetPasswordSchema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { email, newPassword } = parsed.data;
    const user = await dbService.findUserByEmail(email);

    if (!user) {
      // Return safe message without leaking user existence
      return NextResponse.json({
        success: true,
        message: "If an active account exists, password has been updated.",
      });
    }

    const userId = user._id?.toString() || user.id;
    await dbService.updateUser(userId, {
      password: newPassword,
      mustChangePassword: false,
    });

    await logAudit({
      action: "AUTH_PASSWORD_RESET",
      entityType: "User",
      entityId: userId,
      userName: user.name,
      userRole: user.role,
      details: { email },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({
      success: true,
      message: "Password has been successfully updated. You may now log in.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
