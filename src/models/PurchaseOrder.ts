import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IPOItem {
  materialId: Types.ObjectId;
  materialCode: string;
  materialName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  heatNumbers: string[];
  batchIds: Types.ObjectId[];
  receivedQuantity: number;
}

export interface IPurchaseOrder extends Document {
  poNumber: string;
  supplierId: Types.ObjectId;
  supplierName: string;
  orderDate: Date;
  expectedDeliveryDate: Date;
  status: "issued" | "partially_received" | "received" | "closed" | "cancelled";
  items: IPOItem[];
  totalAmount: number;
  currency: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const POItemSchema = new Schema<IPOItem>(
  {
    materialId: { type: Schema.Types.ObjectId, ref: "Material", required: true },
    materialCode: { type: String, required: true },
    materialName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, default: "EA" },
    unitPrice: { type: Number, default: 0 },
    heatNumbers: [{ type: String }],
    batchIds: [{ type: Schema.Types.ObjectId, ref: "MaterialBatch" }],
    receivedQuantity: { type: Number, default: 0 },
  },
  { _id: false }
);

const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    poNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
      index: true,
    },
    supplierName: { type: String, required: true, trim: true },
    orderDate: { type: Date, default: Date.now },
    expectedDeliveryDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["issued", "partially_received", "received", "closed", "cancelled"],
      default: "issued",
      index: true,
    },
    items: [POItemSchema],
    totalAmount: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export const PurchaseOrderModel: Model<IPurchaseOrder> =
  mongoose.models.PurchaseOrder ||
  mongoose.model<IPurchaseOrder>("PurchaseOrder", PurchaseOrderSchema);
