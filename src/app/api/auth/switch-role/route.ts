import { NextRequest, NextResponse } from "next/server";
import { SEED_USERS } from "@/lib/seed-data";
import { setSessionCookie } from "@/lib/auth";
import { UserRole } from "@/lib/permissions";

export async function POST(req: NextRequest) {
  try {
    const { role, email } = await req.json();

    let target = SEED_USERS.find((u) => u.role === role);
    if (email) {
      const byEmail = SEED_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (byEmail) target = byEmail;
    }

    if (!target) {
      return NextResponse.json({ error: "User not found for role", success: false }, { status: 400 });
    }

    await setSessionCookie({
      id: target._id,
      name: target.name,
      email: target.email,
      role: target.role as UserRole,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: target._id,
        name: target.name,
        email: target.email,
        role: target.role,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, success: false }, { status: 500 });
  }
}
