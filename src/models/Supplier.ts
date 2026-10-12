import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISupplier extends Document {
  supplierCode: string;
  name: string;
  country: string;
  rating: number; // 1 to 5
  paymentTerms: string;
  contactName: string;
  email: string;
  phone: string;
  leadTimeAverageDays: number;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    supplierCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, index: true },
    country: { type: String, required: true, trim: true },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    paymentTerms: { type: String, default: "Net 60 Days", trim: true },
    contactName: { type: String, default: "", trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true },
    leadTimeAverageDays: { type: Number, default: 14 },
    notes: { type: String, default: "" },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const SupplierModel: Model<ISupplier> =
  mongoose.models.Supplier || mongoose.model<ISupplier>("Supplier", SupplierSchema);
