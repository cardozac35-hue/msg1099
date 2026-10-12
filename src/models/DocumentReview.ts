import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IChecklistItem {
  item: string;
  verified: boolean;
}

export interface IDocumentReview extends Document {
  documentId: Types.ObjectId;
  versionNumber: number;
  reviewerId: Types.ObjectId;
  reviewerName: string;
  reviewerRole: string;
  decision: "approved" | "rejected" | "correction_required";
  comments: string;
  checklistVerifications: IChecklistItem[];
  reviewedAt: Date;
}

const ChecklistItemSchema = new Schema<IChecklistItem>(
  {
    item: { type: String, required: true },
    verified: { type: Boolean, default: false },
  },
  { _id: false }
);

const DocumentReviewSchema = new Schema<IDocumentReview>(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    versionNumber: { type: Number, required: true },
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reviewerName: { type: String, required: true },
    reviewerRole: { type: String, required: true },
    decision: {
      type: String,
      enum: ["approved", "rejected", "correction_required"],
      required: true,
      index: true,
    },
    comments: { type: String, default: "" },
    checklistVerifications: [ChecklistItemSchema],
    reviewedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const DocumentReviewModel: Model<IDocumentReview> =
  mongoose.models.DocumentReview ||
  mongoose.model<IDocumentReview>("DocumentReview", DocumentReviewSchema);
