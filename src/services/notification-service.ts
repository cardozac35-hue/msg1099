import { connectToDatabase, isDbConnected } from "@/lib/db";
import { NotificationModel, UserModel } from "@/models";
import { Types } from "mongoose";

export interface CreateNotificationParams {
  userId?: string;
  roleTarget?: "admin" | "quality_reviewer" | "salesperson" | "management";
  title: string;
  message: string;
  type:
    | "review_assigned"
    | "document_approved"
    | "document_rejected"
    | "expiry_warning"
    | "missing_doc";
  documentId?: string;
  orderId?: string;
  orderNumber?: string;
}

// In-memory fallback
const memoryNotifications: any[] = [];

export const notificationService = {
  async notify(params: CreateNotificationParams): Promise<void> {
    try {
      await connectToDatabase();
      const targetUserIds: string[] = [];

      if (params.userId) {
        targetUserIds.push(params.userId);
      } else if (params.roleTarget) {
        if (isDbConnected()) {
          const users = await UserModel.find({ role: params.roleTarget, isActive: true });
          users.forEach((u) => targetUserIds.push(String(u._id)));
        }
      }

      if (targetUserIds.length === 0) {
        // Fallback placeholder
        memoryNotifications.unshift({
          _id: `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          title: params.title,
          message: params.message,
          type: params.type,
          documentId: params.documentId,
          orderId: params.orderId,
          orderNumber: params.orderNumber || "",
          isRead: false,
          createdAt: new Date(),
        });
        return;
      }

      for (const uid of targetUserIds) {
        if (isDbConnected()) {
          await NotificationModel.create({
            userId: new Types.ObjectId(uid),
            title: params.title,
            message: params.message,
            type: params.type,
            documentId: params.documentId ? new Types.ObjectId(params.documentId) : undefined,
            orderId: params.orderId ? new Types.ObjectId(params.orderId) : undefined,
            orderNumber: params.orderNumber || "",
            isRead: false,
            createdAt: new Date(),
          });
        } else {
          memoryNotifications.unshift({
            _id: `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            userId: uid,
            title: params.title,
            message: params.message,
            type: params.type,
            documentId: params.documentId,
            orderId: params.orderId,
            orderNumber: params.orderNumber || "",
            isRead: false,
            createdAt: new Date(),
          });
        }
      }
    } catch (err) {
      console.error("[Notification Service Error]", err);
    }
  },

  async getUserNotifications(userId: string) {
    await connectToDatabase();
    if (isDbConnected()) {
      return NotificationModel.find({
        $or: [{ userId: new Types.ObjectId(userId) }, { userId: { $exists: false } }],
      })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean();
    }
    return memoryNotifications.slice(0, 30);
  },

  async markAsRead(id: string) {
    await connectToDatabase();
    if (isDbConnected()) {
      await NotificationModel.findByIdAndUpdate(id, { isRead: true });
    } else {
      const n = memoryNotifications.find((x) => x._id === id);
      if (n) n.isRead = true;
    }
  },
};
