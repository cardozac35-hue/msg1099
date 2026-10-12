import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type QuotationStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "sent"
  | "revised"
  | "accepted"
  | "declined";

export interface IQuotationItem {
  _id?: Types.ObjectId;
  enquiryItemId?: Types.ObjectId;
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
  unitSellingPrice: number;
  discountPercent: number;
  lineSubtotal: number;
  lineDiscountAmount: number;
  lineTotal: number;
  leadTime?: string;
  notes?: string;
}

export interface IQuotation extends Document {
  quotationNumber: string;
  revision: number;
  quotationCode: string; // e.g. QT-2026-0001-R0
  enquiryId: Types.ObjectId;
  enquiryNumber: string;
  customerId: Types.ObjectId;
  customerName: string;
  contactId: Types.ObjectId;
  contactName: string;
  currency: string;
  status: QuotationStatus;
  approvalRequired: boolean;
  approvalStatus: "not_required" | "pending" | "approved" | "rejected";
  approvedBy?: Types.ObjectId;
  approvedByName?: string;
  approvalNotes?: string;
  rejectionReason?: string;
  validityDate: Date;
  deliveryTerms: string;
  paymentTerms: string;
  leadTime: string;
  items: IQuotationItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  pdfDocumentUrl?: string;
  createdBy: Types.ObjectId;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuotationItemSchema = new Schema<IQuotationItem>({
  enquiryItemId: { type: Schema.Types.ObjectId },
  productId: { type: Schema.Types.ObjectId, ref: "Product" },
  itemDescription: { type: String, required: true },
  category: { type: String, default: "" },
  materialGrade: { type: String, default: "" },
  standard: { type: String, default: "" },
  size: { type: String, default: "" },
  pressureClass: { type: String, default: "" },
  connectionType: { type: String, default: "" },
  quantity: { type: Number, required: true, min: 1 },
  unitOfMeasure: { type: String, required: true, default: "EA" },
  unitSellingPrice: { type: Number, required: true, min: 0 },
  discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  lineSubtotal: { type: Number, required: true },
  lineDiscountAmount: { type: Number, default: 0 },
  lineTotal: { type: Number, required: true },
  leadTime: { type: String, default: "" },
  notes: { type: String, default: "" },
});

const QuotationSchema = new Schema<IQuotation>(
  {
    quotationNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    revision: { type: Number, required: true, default: 0, min: 0 },
    quotationCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    enquiryId: {
      type: Schema.Types.ObjectId,
      ref: "Enquiry",
      required: true,
      index: true,
    },
    enquiryNumber: { type: String, required: true, trim: true },
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
    currency: { type: String, default: "USD", uppercase: true },
    status: {
      type: String,
      enum: [
        "draft",
        "pending_approval",
        "approved",
        "rejected",
        "sent",
        "revised",
        "accepted",
        "declined",
      ],
      default: "draft",
      index: true,
    },
    approvalRequired: { type: Boolean, default: false },
    approvalStatus: {
      type: String,
      enum: ["not_required", "pending", "approved", "rejected"],
      default: "not_required",
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedByName: { type: String, default: "" },
    approvalNotes: { type: String, default: "" },
    rejectionReason: { type: String, default: "" },
    validityDate: { type: Date, required: true },
    deliveryTerms: { type: String, default: "FOB Dubai Port (Incoterms 2020)" },
    paymentTerms: { type: String, default: "Net 30 Days" },
    leadTime: { type: String, default: "4-6 Weeks ARO" },
    items: [QuotationItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    discountAmount: { type: Number, default: 0, min: 0 },
    taxPercent: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    notes: { type: String, default: "" },
    pdfDocumentUrl: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdByName: { type: String, required: true },
  },
  { timestamps: true }
);

// Compound UNIQUE index to prevent duplicate revisions under concurrent requests
QuotationSchema.index({ quotationNumber: 1, revision: 1 }, { unique: true });

export const QuotationModel: Model<IQuotation> =
  mongoose.models.Quotation ||
  mongoose.model<IQuotation>("Quotation", QuotationSchema);
