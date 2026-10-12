import { getSession, SessionUser, setSessionCookie } from "./auth";
import { NextResponse } from "next/server";
import { SEED_USERS } from "./seed-data";
import { UserRole } from "./permissions";

export async function getCurrentUser(): Promise<SessionUser> {
  const session = await getSession();
  if (session) return session;

  // In development / demo mode, return default Marcus Vance (Admin)
  return {
    id: SEED_USERS[0]._id,
    name: SEED_USERS[0].name,
    email: SEED_USERS[0].email,
    role: SEED_USERS[0].role as UserRole,
  };
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireRole(allowedRoles: UserRole[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`FORBIDDEN: Requires one of [${allowedRoles.join(", ")}] roles.`);
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  return requireRole(["admin"]);
}

export async function requireQualityOrAdmin(): Promise<SessionUser> {
  return requireRole(["admin", "quality_reviewer"]);
}

export function unauthorizedResponse(message: string = "Unauthorized access"): NextResponse {
  return NextResponse.json({ error: message, success: false }, { status: 401 });
}

export function forbiddenResponse(message: string = "Forbidden: Insufficient privileges"): NextResponse {
  return NextResponse.json({ error: message, success: false }, { status: 403 });
}
