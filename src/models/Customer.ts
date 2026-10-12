import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICustomer extends Document {
  customerCode: string;
  name: string;
  industry: string;
  country: string;
  city: string;
  address: string;
  taxNumber?: string;
  paymentTerms: string;
  creditLimit: number;
  currency: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    customerCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, index: true },
    industry: { type: String, default: "Oil & Gas Upstream", trim: true },
    country: { type: String, required: true, trim: true },
    city: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    taxNumber: { type: String, default: "", trim: true },
    paymentTerms: { type: String, default: "Net 30 Days", trim: true },
    creditLimit: { type: Number, default: 0 },
    currency: { type: String, default: "USD", uppercase: true },
    notes: { type: String, default: "" },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const CustomerModel: Model<ICustomer> =
  mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);
