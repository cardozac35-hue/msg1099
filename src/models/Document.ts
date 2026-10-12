import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type DocumentTypeEnum =
  | "Material Test Certificate (MTC)"
  | "EN 10204 3.1 certificate"
  | "EN 10204 3.2 certificate"
  | "Inspection report"
  | "Hydrostatic test report"
  | "NDT report"
  | "PMI report"
  | "Dimensional inspection report"
  | "Certificate of Conformity"
  | "Technical datasheet"
  | "Engineering drawing"
  | "Compliance certificate"
  | "Other";

export type DocumentVisibilityEnum =
  | "internal_only"
  | "quality_team_only"
  | "customer_shareable"
  | "supplier_confidential";

export type DocumentApprovalStatusEnum =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "correction_required"
  | "superseded"
  | "archived"
  | "expired";

export interface IDocumentRecord extends Document {
  documentNumber: string;
  title: string;
  documentType: DocumentTypeEnum;
  cloudinaryAssetId?: string;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  format: string;
  fileSize: number;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date | null;
  revision: string;
  description?: string;

  // Material linking
  materialId?: Types.ObjectId;
  materialCode?: string;
  materialName?: string;
  materialGrade?: string;
  applicableStandard?: string;
  batchId?: Types.ObjectId;
  batchNumber?: string;
  heatNumber?: string;
  serialNumber?: string;

  // Business relationships
  supplierId?: Types.ObjectId;
  supplierName?: string;
  purchaseOrderId?: Types.ObjectId;
  poNumber?: string;
  customerId?: Types.ObjectId;
  customerName?: string;
  salesOrderId?: Types.ObjectId;
  soNumber?: string;
  shipmentOrDeliveryNumber?: string;

  // Visibility and workflow
  visibilityClassification: DocumentVisibilityEnum;
  approvalStatus: DocumentApprovalStatusEnum;
  uploaderId: Types.ObjectId;
  uploaderName: string;
  reviewerId?: Types.ObjectId | null;
  reviewerName?: string;
  reviewedAt?: Date | null;
  rejectionReason?: string;
  reviewNotes?: string;

  // Versioning and archiving
  versionNumber: number;
  replacementReference?: Types.ObjectId | null;
  isArchived: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const DocumentRecordSchema = new Schema<IDocumentRecord>(
  {
    documentNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, index: true },
    documentType: {
      type: String,
      required: true,
      enum: [
        "Material Test Certificate (MTC)",
        "EN 10204 3.1 certificate",
        "EN 10204 3.2 certificate",
        "Inspection report",
        "Hydrostatic test report",
        "NDT report",
        "PMI report",
        "Dimensional inspection report",
        "Certificate of Conformity",
        "Technical datasheet",
        "Engineering drawing",
        "Compliance certificate",
        "Other",
      ],
      index: true,
    },
    cloudinaryAssetId: { type: String, default: "" },
    cloudinaryPublicId: { type: String, required: true, index: true },
    cloudinaryUrl: { type: String, required: true },
    format: { type: String, default: "pdf" },
    fileSize: { type: Number, required: true, default: 0 },
    issuer: { type: String, required: true, trim: true },
    issueDate: { type: Date, required: true, default: Date.now },
    expiryDate: { type: Date, default: null, index: true },
    revision: { type: String, default: "0", trim: true },
    description: { type: String, default: "" },

    // Material linking
    materialId: { type: Schema.Types.ObjectId, ref: "Material", index: true },
    materialCode: { type: String, default: "", index: true },
    materialName: { type: String, default: "" },
    materialGrade: { type: String, default: "", index: true },
    applicableStandard: { type: String, default: "" },
    batchId: { type: Schema.Types.ObjectId, ref: "MaterialBatch", index: true },
    batchNumber: { type: String, default: "", index: true },
    heatNumber: { type: String, default: "", index: true },
    serialNumber: { type: String, default: "" },

    // Business relationships
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", index: true },
    supplierName: { type: String, default: "" },
    purchaseOrderId: { type: Schema.Types.ObjectId, ref: "PurchaseOrder", index: true },
    poNumber: { type: String, default: "", index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", index: true },
    customerName: { type: String, default: "" },
    salesOrderId: { type: Schema.Types.ObjectId, ref: "SalesOrder", index: true },
    soNumber: { type: String, default: "", index: true },
    shipmentOrDeliveryNumber: { type: String, default: "" },

    // Visibility and workflow
    visibilityClassification: {
      type: String,
      enum: [
        "internal_only",
        "quality_team_only",
        "customer_shareable",
        "supplier_confidential",
      ],
      required: true,
      default: "internal_only",
      index: true,
    },
    approvalStatus: {
      type: String,
      enum: [
        "draft",
        "pending_review",
        "approved",
        "rejected",
        "correction_required",
        "superseded",
        "archived",
        "expired",
      ],
      required: true,
      default: "pending_review",
      index: true,
    },
    uploaderId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    uploaderName: { type: String, required: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewerName: { type: String, default: "" },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: "" },
    reviewNotes: { type: String, default: "" },

    // Versioning and archiving
    versionNumber: { type: Number, default: 1, min: 1 },
    replacementReference: { type: Schema.Types.ObjectId, ref: "Document", default: null },
    isArchived: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Helpful compound indexes
DocumentRecordSchema.index({ materialCode: 1, heatNumber: 1 });
DocumentRecordSchema.index({ approvalStatus: 1, visibilityClassification: 1 });

export const DocumentModel: Model<IDocumentRecord> =
  mongoose.models.Document ||
  mongoose.model<IDocumentRecord>("Document", DocumentRecordSchema);
