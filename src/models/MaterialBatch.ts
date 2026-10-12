import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IMaterialBatch extends Document {
  batchNumber: string;
  heatNumber: string;
  materialId: Types.ObjectId;
  materialCode: string;
  materialName: string;
  materialGrade: string;
  supplierId: Types.ObjectId;
  supplierName: string;
  purchaseOrderId?: Types.ObjectId;
  poNumber?: string;
  quantity: number;
  unit: string;
  millName: string;
  countryOfOrigin: string;
  productionDate: Date;
  inspectionStatus: "pending" | "passed" | "rejected" | "quarantine";
  assignedCertificates: Types.ObjectId[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MaterialBatchSchema = new Schema<IMaterialBatch>(
  {
    batchNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    heatNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    materialId: {
      type: Schema.Types.ObjectId,
      ref: "Material",
      required: true,
      index: true,
    },
    materialCode: { type: String, required: true, trim: true },
    materialName: { type: String, required: true, trim: true },
    materialGrade: { type: String, required: true, trim: true },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
      index: true,
    },
    supplierName: { type: String, required: true, trim: true },
    purchaseOrderId: {
      type: Schema.Types.ObjectId,
      ref: "PurchaseOrder",
      index: true,
    },
    poNumber: { type: String, default: "" },
    quantity: { type: Number, required: true, default: 0 },
    unit: { type: String, default: "EA" },
    millName: { type: String, default: "", trim: true },
    countryOfOrigin: { type: String, default: "", trim: true },
    productionDate: { type: Date, default: Date.now },
    inspectionStatus: {
      type: String,
      enum: ["pending", "passed", "rejected", "quarantine"],
      default: "pending",
      index: true,
    },
    assignedCertificates: [{ type: Schema.Types.ObjectId, ref: "Document" }],
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

// Compound index for heat number within material/supplier
MaterialBatchSchema.index({ materialId: 1, heatNumber: 1 });

export const MaterialBatchModel: Model<IMaterialBatch> =
  mongoose.models.MaterialBatch ||
  mongoose.model<IMaterialBatch>("MaterialBatch", MaterialBatchSchema);
