import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProduct extends Document {
  sku: string;
  name: string;
  category: string;
  materialGrade: string;
  standard: string;
  size: string;
  pressureClass: string;
  connectionType: string;
  unitOfMeasure: string;
  description: string;
  listPrice?: number;
  currency: string;
  specifications: Record<string, string>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, index: true },
    category: {
      type: String,
      required: true,
      enum: [
        "Valves",
        "Pipes & Tubes",
        "Flanges",
        "Fittings",
        "Gaskets & Seals",
        "Instrumentation & Gauges",
        "Drilling & Wellhead",
        "Fasteners & Studs",
        "Other",
      ],
      default: "Valves",
      index: true,
    },
    materialGrade: { type: String, required: true, trim: true }, // e.g., ASTM A216 WCB, Inconel 625, AISI 316
    standard: { type: String, required: true, trim: true }, // e.g., API 6D, ASME B16.34, ASME B16.5
    size: { type: String, required: true, trim: true }, // e.g., 2", 4", 6", 8", 12", DN50, DN100
    pressureClass: { type: String, required: true, trim: true }, // e.g., Class 150, Class 300, Class 600, Class 1500, Class 2500, 3000 PSI, 5000 PSI
    connectionType: { type: String, required: true, trim: true }, // e.g., RF Flanged, RTJ Flanged, Butt Weld, Socket Weld, NPT Threaded
    unitOfMeasure: {
      type: String,
      required: true,
      enum: ["EA", "MTR", "SET", "KG", "LOT", "BOX"],
      default: "EA",
    },
    description: { type: String, default: "" },
    listPrice: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },
    specifications: { type: Map, of: String, default: {} },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const ProductModel: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
