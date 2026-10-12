import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type FollowUpStatus = "pending" | "completed" | "cancelled";
export type FollowUpType = "call" | "email" | "meeting" | "site_visit";
export type FollowUpOutcome =
  | "pending"
  | "positive"
  | "neutral"
  | "revision_requested"
  | "price_negotiation"
  | "order_won"
  | "lost";

export interface IFollowUp extends Document {
  enquiryId: Types.ObjectId;
  enquiryNumber: string;
  quotationId?: Types.ObjectId;
  quotationNumber?: string;
  customerId: Types.ObjectId;
  customerName: string;
  scheduledDate: Date;
  completedDate?: Date;
  status: FollowUpStatus;
  type: FollowUpType;
  outcome: FollowUpOutcome;
  notes: string;
  assignedTo: Types.ObjectId;
  assignedToName: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FollowUpSchema = new Schema<IFollowUp>(
  {
    enquiryId: {
      type: Schema.Types.ObjectId,
      ref: "Enquiry",
      required: true,
      index: true,
    },
    enquiryNumber: { type: String, required: true },
    quotationId: { type: Schema.Types.ObjectId, ref: "Quotation" },
    quotationNumber: { type: String, default: "" },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    customerName: { type: String, required: true },
    scheduledDate: { type: Date, required: true, index: true },
    completedDate: { type: Date },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
    type: {
      type: String,
      enum: ["call", "email", "meeting", "site_visit"],
      default: "call",
    },
    outcome: {
      type: String,
      enum: [
        "pending",
        "positive",
        "neutral",
        "revision_requested",
        "price_negotiation",
        "order_won",
        "lost",
      ],
      default: "pending",
    },
    notes: { type: String, default: "" },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    assignedToName: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const FollowUpModel: Model<IFollowUp> =
  mongoose.models.FollowUp || mongoose.model<IFollowUp>("FollowUp", FollowUpSchema);
