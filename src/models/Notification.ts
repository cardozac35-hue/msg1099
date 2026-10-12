import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface INotification extends Document {
  userId: Types.ObjectId;
  title: string;
  message: string;
  type:
    | "review_assigned"
    | "document_approved"
    | "document_rejected"
    | "expiry_warning"
    | "missing_doc";
  documentId?: Types.ObjectId;
  orderId?: Types.ObjectId;
  orderNumber?: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "review_assigned",
        "document_approved",
        "document_rejected",
        "expiry_warning",
        "missing_doc",
      ],
      required: true,
      index: true,
    },
    documentId: { type: Schema.Types.ObjectId, ref: "Document" },
    orderId: { type: Schema.Types.ObjectId },
    orderNumber: { type: String, default: "" },
    isRead: { type: Boolean, default: false, index: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const NotificationModel: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);
