import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { notificationService } from "@/services/notification-service";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const notifications = await notificationService.getUserNotifications(user.id);
    return NextResponse.json({ success: true, notifications });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (id) {
      await notificationService.markAsRead(id);
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
