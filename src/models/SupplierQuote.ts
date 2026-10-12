import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ISupplierQuote {
  enquiryId: Types.ObjectId;
  enquiryItemId: Types.ObjectId;
  supplierId: Types.ObjectId;
  supplierName: string;
  supplierReference: string;
  quoteDate: Date;
  validityDate: Date;
  currency: string;
  // Confidential pricing fields (Strictly Admin Access Only)
  unitPurchasePrice: number;
  quantity: number;
  unitOfMeasure: string;
  allocatedFreight: number;
  allocatedCustomsDuties: number;
  otherApplicableCosts: number;
  calculatedUnitLandedCost: number;
  calculatedTotalLandedCost: number;
  leadTimeWeeks: number;
  paymentTerms: string;
  isSelected: boolean;
  confidentialDocumentId?: Types.ObjectId;
  notes?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierQuoteSchema = new Schema<ISupplierQuote>(
  {
    enquiryId: {
      type: Schema.Types.ObjectId,
      ref: "Enquiry",
      required: true,
      index: true,
    },
    enquiryItemId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
      index: true,
    },
    supplierName: { type: String, required: true, trim: true },
    supplierReference: { type: String, required: true, trim: true },
    quoteDate: { type: Date, required: true, default: Date.now },
    validityDate: { type: Date, required: true },
    currency: { type: String, default: "USD", uppercase: true },
    unitPurchasePrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    unitOfMeasure: { type: String, required: true, default: "EA" },
    allocatedFreight: { type: Number, default: 0, min: 0 },
    allocatedCustomsDuties: { type: Number, default: 0, min: 0 },
    otherApplicableCosts: { type: Number, default: 0, min: 0 },
    calculatedUnitLandedCost: { type: Number, required: true, min: 0 },
    calculatedTotalLandedCost: { type: Number, required: true, min: 0 },
    leadTimeWeeks: { type: Number, default: 2 },
    paymentTerms: { type: String, default: "Net 30 Days" },
    isSelected: { type: Boolean, default: false, index: true },
    confidentialDocumentId: { type: Schema.Types.ObjectId, ref: "Document" },
    notes: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Compound index to quickly find supplier quotes for an enquiry item
SupplierQuoteSchema.index({ enquiryId: 1, enquiryItemId: 1 });

export const SupplierQuoteModel: Model<ISupplierQuote> =
  mongoose.models.SupplierQuote ||
  mongoose.model<ISupplierQuote>("SupplierQuote", SupplierQuoteSchema);
