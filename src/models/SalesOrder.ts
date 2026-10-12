import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ISOItem {
  materialId: Types.ObjectId;
  materialCode: string;
  materialName: string;
  batchId?: Types.ObjectId;
  batchNumber?: string;
  heatNumber?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export interface ISODelivery {
  deliveryNoteNumber: string;
  deliveryDate: Date;
  carrier?: string;
  trackingNumber?: string;
  status: "scheduled" | "in_transit" | "delivered";
}

export interface ISalesOrder extends Document {
  soNumber: string;
  customerId: Types.ObjectId;
  customerName: string;
  orderDate: Date;
  requestedDeliveryDate: Date;
  deliveryTerms: string; // e.g. "FOB Dammam", "CIF Rotterdam", "DDP Jubail"
  status:
    | "confirmed"
    | "processing"
    | "inspection"
    | "ready_for_dispatch"
    | "dispatched"
    | "delivered"
    | "cancelled";
  dispatchReady: boolean;
  dispatchBlockReason?: string;
  items: ISOItem[];
  deliveries: ISODelivery[];
  totalAmount: number;
  currency: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SOItemSchema = new Schema<ISOItem>(
  {
    materialId: { type: Schema.Types.ObjectId, ref: "Material", required: true },
    materialCode: { type: String, required: true },
    materialName: { type: String, required: true },
    batchId: { type: Schema.Types.ObjectId, ref: "MaterialBatch" },
    batchNumber: { type: String, default: "" },
    heatNumber: { type: String, default: "" },
    quantity: { type: Number, required: true },
    unit: { type: String, default: "EA" },
    unitPrice: { type: Number, default: 0 },
  },
  { _id: false }
);

const SODeliverySchema = new Schema<ISODelivery>(
  {
    deliveryNoteNumber: { type: String, required: true },
    deliveryDate: { type: Date, default: Date.now },
    carrier: { type: String, default: "" },
    trackingNumber: { type: String, default: "" },
    status: {
      type: String,
      enum: ["scheduled", "in_transit", "delivered"],
      default: "scheduled",
    },
  },
  { _id: false }
);

const SalesOrderSchema = new Schema<ISalesOrder>(
  {
    soNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    customerName: { type: String, required: true, trim: true },
    orderDate: { type: Date, default: Date.now },
    requestedDeliveryDate: { type: Date, required: true },
    deliveryTerms: { type: String, default: "FOB Port", trim: true },
    status: {
      type: String,
      enum: [
        "confirmed",
        "processing",
        "inspection",
        "ready_for_dispatch",
        "dispatched",
        "delivered",
        "cancelled",
      ],
      default: "confirmed",
      index: true,
    },
    dispatchReady: { type: Boolean, default: false },
    dispatchBlockReason: { type: String, default: "" },
    items: [SOItemSchema],
    deliveries: [SODeliverySchema],
    totalAmount: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export const SalesOrderModel: Model<ISalesOrder> =
  mongoose.models.SalesOrder ||
  mongoose.model<ISalesOrder>("SalesOrder", SalesOrderSchema);
