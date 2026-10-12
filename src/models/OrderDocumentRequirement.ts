import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IOrderDocumentRequirement extends Document {
  orderType: "PO" | "SO";
  orderId: any;
  orderNumber: string;
  requirementId?: any;
  materialId?: any;
  materialCode?: string;
  documentType: string;
  isMandatory: boolean;
  status: "missing" | "uploaded" | "under_review" | "approved" | "rejected";
  linkedDocumentId?: any;
  responsibleUserId?: any;
  responsibleUserName: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderDocumentRequirementSchema = new Schema<IOrderDocumentRequirement>(
  {
    orderType: { type: String, enum: ["PO", "SO"], required: true, index: true },
    orderId: { type: Schema.Types.Mixed, required: true, index: true },
    orderNumber: { type: String, required: true, index: true },
    requirementId: { type: Schema.Types.Mixed, ref: "DocumentRequirement" },
    materialId: { type: Schema.Types.Mixed, ref: "Material" },
    materialCode: { type: String, default: "" },
    documentType: { type: String, required: true, index: true },
    isMandatory: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["missing", "uploaded", "under_review", "approved", "rejected"],
      default: "missing",
      index: true,
    },
    linkedDocumentId: { type: Schema.Types.Mixed, ref: "Document" },
    responsibleUserId: { type: Schema.Types.Mixed, ref: "User" },
    responsibleUserName: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

OrderDocumentRequirementSchema.index({ orderId: 1, documentType: 1 });

export const OrderDocumentRequirementModel: Model<IOrderDocumentRequirement> =
  mongoose.models.OrderDocumentRequirement ||
  mongoose.model<IOrderDocumentRequirement>(
    "OrderDocumentRequirement",
    OrderDocumentRequirementSchema
  );
