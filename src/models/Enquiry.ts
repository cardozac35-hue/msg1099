import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type EnquiryStatus =
  | "received"
  | "in_review"
  | "supplier_pricing"
  | "quoted"
  | "follow_up"
  | "won"
  | "lost"
  | "cancelled";

export interface IEnquiryItem {
  _id?: Types.ObjectId;
  productId?: Types.ObjectId;
  itemDescription: string;
  category?: string;
  materialGrade: string;
  standard: string;
  size: string;
  pressureClass: string;
  connectionType: string;
  quantity: number;
  unitOfMeasure: string;
  customerTargetUnitPrice?: number;
  customerTargetTotalPrice?: number;
  notes?: string;
}

export interface IEnquiryActivity {
  _id?: Types.ObjectId;
  action: string;
  performedBy: Types.ObjectId;
  performerName: string;
  timestamp: Date;
  notes?: string;
}

export interface IEnquiry extends Document {
  enquiryNumber: string;
  customerId: Types.ObjectId;
  customerName: string;
  contactId: Types.ObjectId;
  contactName: string;
  assignedTo: Types.ObjectId;
  assignedToName: string;
  createdBy: Types.ObjectId;
  createdByName: string;
  currency: string;
  status: EnquiryStatus;
  priority: "low" | "medium" | "high" | "urgent";
  nextFollowUpDate?: Date;
  targetPriceTotal?: number;
  notes?: string;
  items: IEnquiryItem[];
  activities: IEnquiryActivity[];
  createdAt: Date;
  updatedAt: Date;
}

const EnquiryItemSchema = new Schema<IEnquiryItem>({
  productId: { type: Schema.Types.ObjectId, ref: "Product" },
  itemDescription: { type: String, required: true },
  category: { type: String, default: "Valves" },
  materialGrade: { type: String, default: "" },
  standard: { type: String, default: "" },
  size: { type: String, default: "" },
  pressureClass: { type: String, default: "" },
  connectionType: { type: String, default: "" },
  quantity: { type: Number, required: true, min: 1 },
  unitOfMeasure: { type: String, required: true, default: "EA" },
  customerTargetUnitPrice: { type: Number, default: 0 },
  customerTargetTotalPrice: { type: Number, default: 0 },
  notes: { type: String, default: "" },
});

const EnquiryActivitySchema = new Schema<IEnquiryActivity>({
  action: { type: String, required: true },
  performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  performerName: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  notes: { type: String, default: "" },
});

const EnquirySchema = new Schema<IEnquiry>(
  {
    enquiryNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    customerName: { type: String, required: true, trim: true },
    contactId: {
      type: Schema.Types.ObjectId,
      ref: "CustomerContact",
      required: true,
    },
    contactName: { type: String, required: true, trim: true },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    assignedToName: { type: String, required: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdByName: { type: String, required: true },
    currency: { type: String, default: "USD", uppercase: true },
    status: {
      type: String,
      enum: [
        "received",
        "in_review",
        "supplier_pricing",
        "quoted",
        "follow_up",
        "won",
        "lost",
        "cancelled",
      ],
      default: "received",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    nextFollowUpDate: { type: Date, index: true },
    targetPriceTotal: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    items: [EnquiryItemSchema],
    activities: [EnquiryActivitySchema],
  },
  { timestamps: true }
);

// Compound index for duplicate detection queries
EnquirySchema.index({ customerId: 1, status: 1 });

export const EnquiryModel: Model<IEnquiry> =
  mongoose.models.Enquiry || mongoose.model<IEnquiry>("Enquiry", EnquirySchema);
