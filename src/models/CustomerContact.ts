import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ICustomerContact extends Document {
  customerId: Types.ObjectId;
  name: string;
  designation: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerContactSchema = new Schema<ICustomerContact>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    designation: { type: String, default: "", trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true },
    isPrimary: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const CustomerContactModel: Model<ICustomerContact> =
  mongoose.models.CustomerContact ||
  mongoose.model<ICustomerContact>("CustomerContact", CustomerContactSchema);
