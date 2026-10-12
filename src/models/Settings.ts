import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISettings extends Document {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyTaxNumber: string;
  companyWebsite: string;
  defaultCurrency: string;
  enquiryPrefix: string;
  quotationPrefix: string;
  minMarginApprovalThreshold: number; // e.g. 15 for 15%. If quotation margin is lower, admin approval required
  requireApprovalBelowThreshold: boolean;
  defaultTaxRate: number; // e.g. 5 for 5% VAT
  defaultQuotationValidityDays: number;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    companyName: {
      type: String,
      default: "Apex Oilfield & Gas Equipment FZE",
      trim: true,
    },
    companyAddress: {
      type: String,
      default: "Plot 42, Jebel Ali Free Zone South, Dubai, UAE",
      trim: true,
    },
    companyPhone: { type: String, default: "+971 4 881 0000", trim: true },
    companyEmail: { type: String, default: "sales@apexoilfield.com", trim: true },
    companyTaxNumber: { type: String, default: "TRN-100492817200003", trim: true },
    companyWebsite: { type: String, default: "www.apexoilfield.com", trim: true },
    defaultCurrency: { type: String, default: "USD" },
    enquiryPrefix: { type: String, default: "ENQ" },
    quotationPrefix: { type: String, default: "QT" },
    minMarginApprovalThreshold: { type: Number, default: 15.0 }, // 15%
    requireApprovalBelowThreshold: { type: Boolean, default: true },
    defaultTaxRate: { type: Number, default: 5.0 }, // 5%
    defaultQuotationValidityDays: { type: Number, default: 30 },
  },
  { timestamps: true }
);

export const SettingsModel: Model<ISettings> =
  mongoose.models.Settings ||
  mongoose.model<ISettings>("Settings", SettingsSchema);
