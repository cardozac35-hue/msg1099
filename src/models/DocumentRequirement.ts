import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IDocumentRequirement extends Document {
  ruleName: string;
  materialCategory?: string;
  materialGrade?: string;
  customerId?: Types.ObjectId;
  customerName?: string;
  documentType: string;
  isMandatory: boolean;
  validityDays?: number;
  blocksDispatch: boolean;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentRequirementSchema = new Schema<IDocumentRequirement>(
  {
    ruleName: { type: String, required: true, trim: true, unique: true },
    materialCategory: { type: String, default: "All Categories" },
    materialGrade: { type: String, default: "All Grades" },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    customerName: { type: String, default: "" },
    documentType: { type: String, required: true, trim: true },
    isMandatory: { type: Boolean, default: true },
    validityDays: { type: Number, default: 0 }, // 0 means no expiry
    blocksDispatch: { type: Boolean, default: true },
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const DocumentRequirementModel: Model<IDocumentRequirement> =
  mongoose.models.DocumentRequirement ||
  mongoose.model<IDocumentRequirement>("DocumentRequirement", DocumentRequirementSchema);
