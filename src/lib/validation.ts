import { z } from "zod";

export const DocumentTypeSchema = z.enum([
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
]);

export const DocumentVisibilitySchema = z.enum([
  "internal_only",
  "quality_team_only",
  "customer_shareable",
  "supplier_confidential",
]);

export const DocumentApprovalStatusSchema = z.enum([
  "draft",
  "pending_review",
  "approved",
  "rejected",
  "correction_required",
  "superseded",
  "archived",
  "expired",
]);

// Document Creation & Upload Zod Schema
export const CreateDocumentSchema = z.object({
  documentNumber: z.string().min(2, "Document number is required").max(60),
  title: z.string().min(2, "Title is required").max(200),
  documentType: DocumentTypeSchema,
  issuer: z.string().min(2, "Issuing organization is required").max(120),
  issueDate: z.string().or(z.date()),
  expiryDate: z.string().or(z.date()).nullable().optional(),
  revision: z.string().default("0"),
  description: z.string().max(1000).optional().default(""),

  // Material linking
  materialId: z.string().optional().nullable(),
  materialCode: z.string().optional().default(""),
  materialName: z.string().optional().default(""),
  materialGrade: z.string().optional().default(""),
  applicableStandard: z.string().optional().default(""),
  batchId: z.string().optional().nullable(),
  batchNumber: z.string().optional().default(""),
  heatNumber: z.string().optional().default(""),
  serialNumber: z.string().optional().default(""),

  // Business relationships
  supplierId: z.string().optional().nullable(),
  supplierName: z.string().optional().default(""),
  purchaseOrderId: z.string().optional().nullable(),
  poNumber: z.string().optional().default(""),
  customerId: z.string().optional().nullable(),
  customerName: z.string().optional().default(""),
  salesOrderId: z.string().optional().nullable(),
  soNumber: z.string().optional().default(""),
  shipmentOrDeliveryNumber: z.string().optional().default(""),

  // Visibility and workflow
  visibilityClassification: DocumentVisibilitySchema.default("internal_only"),
  submitForReview: z.boolean().default(true),

  // File metadata (from Cloudinary or client)
  cloudinaryPublicId: z.string().min(1, "File must be uploaded to Cloudinary"),
  cloudinaryUrl: z.string().url("Valid file URL is required"),
  cloudinaryAssetId: z.string().optional().default(""),
  format: z.string().default("pdf"),
  fileSize: z.number().nonnegative(),
});

// Update Document Metadata Zod Schema
export const UpdateDocumentSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  documentType: DocumentTypeSchema.optional(),
  issuer: z.string().min(2).max(120).optional(),
  issueDate: z.string().or(z.date()).optional(),
  expiryDate: z.string().or(z.date()).nullable().optional(),
  revision: z.string().optional(),
  description: z.string().max(1000).optional(),
  materialCode: z.string().optional(),
  materialGrade: z.string().optional(),
  heatNumber: z.string().optional(),
  batchNumber: z.string().optional(),
  serialNumber: z.string().optional(),
  supplierName: z.string().optional(),
  poNumber: z.string().optional(),
  customerName: z.string().optional(),
  soNumber: z.string().optional(),
  visibilityClassification: DocumentVisibilitySchema.optional(),
});

// Review decision schema
export const ReviewDecisionSchema = z.object({
  decision: z.enum(["approved", "rejected", "correction_required"]),
  comments: z.string().optional().default(""),
  rejectionReason: z.string().optional(),
  checklistVerifications: z
    .array(
      z.object({
        item: z.string(),
        verified: z.boolean(),
      })
    )
    .optional()
    .default([]),
}).refine(
  (data) => {
    if (data.decision === "rejected") {
      return (
        (data.rejectionReason && data.rejectionReason.trim().length > 0) ||
        (data.comments && data.comments.trim().length > 0)
      );
    }
    return true;
  },
  {
    message: "A mandatory rejection reason is required when rejecting a certificate.",
    path: ["rejectionReason"],
  }
);

// Document Version Replacement Schema
export const ReplaceDocumentSchema = z.object({
  newRevision: z.string().min(1, "New revision code is required"),
  changeReason: z.string().min(3, "Reason for document change/replacement is required"),
  cloudinaryPublicId: z.string().min(1, "Uploaded file public ID is required"),
  cloudinaryUrl: z.string().url(),
  format: z.string().default("pdf"),
  fileSize: z.number().nonnegative(),
});

// Document Requirement Configuration Schema
export const DocumentRequirementConfigSchema = z.object({
  ruleName: z.string().min(3, "Rule name is required"),
  materialCategory: z.string().default("All Categories"),
  materialGrade: z.string().default("All Grades"),
  customerId: z.string().optional().nullable(),
  customerName: z.string().optional().default(""),
  documentType: DocumentTypeSchema,
  isMandatory: z.boolean().default(true),
  validityDays: z.number().int().nonnegative().default(0),
  blocksDispatch: z.boolean().default(true),
  description: z.string().optional().default(""),
  isActive: z.boolean().default(true),
});
