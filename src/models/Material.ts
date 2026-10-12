import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMaterial extends Document {
  materialCode: string;
  name: string;
  category: string;
  materialGrade: string;
  applicableStandard: string;
  size: string;
  pressureClass?: string;
  schedule?: string;
  specifications: Record<string, string>;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MaterialSchema = new Schema<IMaterial>(
  {
    materialCode: {
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
        "Pipes & Tubes",
        "Valves",
        "Flanges",
        "Fittings",
        "Fasteners & Studs",
        "Gaskets & Seals",
        "Structural Steel",
        "Instrumentation & Gauges",
        "Other",
      ],
      default: "Pipes & Tubes",
      index: true,
    },
    materialGrade: { type: String, required: true, trim: true, index: true },
    applicableStandard: { type: String, required: true, trim: true },
    size: { type: String, required: true, trim: true },
    pressureClass: { type: String, default: "" },
    schedule: { type: String, default: "" },
    specifications: { type: Map, of: String, default: {} },
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const MaterialModel: Model<IMaterial> =
  mongoose.models.Material || mongoose.model<IMaterial>("Material", MaterialSchema);
