import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IDocumentVersion extends Document {
  documentId: Types.ObjectId;
  versionNumber: number;
  revision: string;
  cloudinaryAssetId?: string;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  format: string;
  fileSize: number;
  changeReason: string;
  uploadedBy: any;
  uploadedByName: string;
  metadataSnapshot: Record<string, any>;
  createdAt: Date;
}

const DocumentVersionSchema = new Schema<IDocumentVersion>(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    versionNumber: { type: Number, required: true },
    revision: { type: String, required: true },
    cloudinaryAssetId: { type: String, default: "" },
    cloudinaryPublicId: { type: String, required: true },
    cloudinaryUrl: { type: String, required: true },
    format: { type: String, default: "pdf" },
    fileSize: { type: Number, required: true },
    changeReason: { type: String, required: true },
    uploadedBy: {
      type: Schema.Types.Mixed,
      ref: "User",
      required: true,
    },
    uploadedByName: { type: String, required: true },
    metadataSnapshot: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

DocumentVersionSchema.index({ documentId: 1, versionNumber: 1 });

export const DocumentVersionModel: Model<IDocumentVersion> =
  mongoose.models.DocumentVersion ||
  mongoose.model<IDocumentVersion>("DocumentVersion", DocumentVersionSchema);
