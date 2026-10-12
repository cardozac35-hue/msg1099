import { connectToDatabase, isDbConnected } from "@/lib/db";
import {
  DocumentModel,
  DocumentVersionModel,
  DocumentReviewModel,
  AuditLogModel,
  MaterialModel,
  MaterialBatchModel,
  PurchaseOrderModel,
  SalesOrderModel,
  OrderDocumentRequirementModel,
  DocumentRequirementModel,
} from "@/models";
import { logAudit } from "@/lib/audit";
import { notificationService } from "./notification-service";
import { PERMISSIONS, UserContext, DocumentContext } from "@/lib/permissions";
import { Types } from "mongoose";

import {
  SEED_DOCUMENTS,
  SEED_MATERIALS,
  SEED_BATCHES,
  SEED_PURCHASE_ORDERS,
  SEED_SALES_ORDERS,
  SEED_REQUIREMENT_RULES,
  SEED_ORDER_REQUIREMENTS,
} from "@/lib/seed-data";

// In-memory fallback repository for offline/test environments
export const memoryDocuments: any[] = JSON.parse(JSON.stringify(SEED_DOCUMENTS));
export const memoryDocumentVersions: any[] = [
  {
    _id: "ver_01_init",
    documentId: "doc_01",
    versionNumber: 1,
    revision: "0",
    cloudinaryPublicId: "oil_gas_hub/certificates/mtc_heat_h92841a_3_2",
    cloudinaryUrl: "https://res.cloudinary.com/demo/image/upload/sample.pdf",
    format: "pdf",
    fileSize: 1845200,
    changeReason: "Initial certified issue by Lloyd's Register & Nippon Steel",
    uploadedBy: "usr_sales_01",
    uploadedByName: "Sarah Jenkins",
    createdAt: new Date("2026-01-23T09:15:00Z"),
  },
];
export const memoryDocumentReviews: any[] = [
  {
    _id: "rev_01_init",
    documentId: "doc_01",
    versionNumber: 1,
    reviewerId: "usr_qa_01",
    reviewerName: "Elena Rostova",
    reviewerRole: "quality_reviewer",
    decision: "approved",
    comments: "All mechanical and chemical properties fully verified against Aramco 01-SAMSS-035.",
    checklistVerifications: [
      { item: "Tensile & Yield strength verified", verified: true },
      { item: "Charpy impact at -29C compliant", verified: true },
      { item: "HIC/SSC NACE compliance confirmed", verified: true },
    ],
    reviewedAt: new Date("2026-01-24T14:30:00Z"),
  },
];
export const memoryRequirements: any[] = JSON.parse(JSON.stringify(SEED_REQUIREMENT_RULES));
export const memoryOrderRequirements: any[] = JSON.parse(JSON.stringify(SEED_ORDER_REQUIREMENTS));
export const memoryMaterialBatches: any[] = JSON.parse(JSON.stringify(SEED_BATCHES));
export const memoryMaterials: any[] = JSON.parse(JSON.stringify(SEED_MATERIALS));
export const memoryPurchaseOrders: any[] = JSON.parse(JSON.stringify(SEED_PURCHASE_ORDERS));
export const memorySalesOrders: any[] = JSON.parse(JSON.stringify(SEED_SALES_ORDERS));

export interface ListDocumentsFilter {
  search?: string;
  documentType?: string;
  approvalStatus?: string;
  materialCode?: string;
  heatNumber?: string;
  batchNumber?: string;
  supplierId?: string;
  supplierName?: string;
  salesOrderId?: string;
  soNumber?: string;
  purchaseOrderId?: string;
  poNumber?: string;
  visibilityClassification?: string;
  isArchived?: boolean;
  expiringWithinDays?: number;
  isExpired?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const documentService = {
  /**
   * List documents with server-side filtering, sorting, pagination, and RBAC
   */
  async listDocuments(filter: ListDocumentsFilter, user: UserContext) {
    await connectToDatabase();
    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, Math.min(100, filter.limit || 20));
    const skip = (page - 1) * limit;

    const isConnected = isDbConnected();

    if (isConnected) {
      const query: any = {};

      // Archived filter
      if (typeof filter.isArchived === "boolean") {
        query.isArchived = filter.isArchived;
      } else {
        query.isArchived = { $ne: true };
      }

      // RBAC Filter: Salesperson can never view supplier_confidential or quality_team_only
      if (user.role === "salesperson") {
        query.visibilityClassification = {
          $in: ["internal_only", "customer_shareable"],
        };
      }

      // Search term (documentNumber, title, heatNumber, materialCode)
      if (filter.search && filter.search.trim()) {
        const searchRegex = new RegExp(filter.search.trim(), "i");
        query.$or = [
          { documentNumber: searchRegex },
          { title: searchRegex },
          { heatNumber: searchRegex },
          { materialCode: searchRegex },
          { batchNumber: searchRegex },
          { issuer: searchRegex },
          { supplierName: searchRegex },
          { soNumber: searchRegex },
          { poNumber: searchRegex },
        ];
      }

      if (filter.documentType) query.documentType = filter.documentType;
      if (filter.approvalStatus) query.approvalStatus = filter.approvalStatus;
      if (filter.materialCode) query.materialCode = filter.materialCode;
      if (filter.heatNumber) query.heatNumber = filter.heatNumber;
      if (filter.batchNumber) query.batchNumber = filter.batchNumber;
      if (filter.supplierName) query.supplierName = filter.supplierName;
      if (filter.soNumber) query.soNumber = filter.soNumber;
      if (filter.poNumber) query.poNumber = filter.poNumber;
      if (filter.visibilityClassification) query.visibilityClassification = filter.visibilityClassification;

      // Expiry filter
      const now = new Date();
      if (filter.isExpired) {
        query.expiryDate = { $ne: null, $lt: now };
      } else if (filter.expiringWithinDays) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + filter.expiringWithinDays);
        query.expiryDate = { $ne: null, $gte: now, $lte: futureDate };
      }

      const sortField = filter.sortBy || "createdAt";
      const sortDirection = filter.sortOrder === "asc" ? 1 : -1;
      const sortOption: any = { [sortField]: sortDirection };

      const [total, documents] = await Promise.all([
        DocumentModel.countDocuments(query),
        DocumentModel.find(query).sort(sortOption).skip(skip).limit(limit).lean(),
      ]);

      return {
        documents,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    // In-memory filter
    let docs = [...memoryDocuments];

    // Archived filter
    if (typeof filter.isArchived === "boolean") {
      docs = docs.filter((d) => (d.isArchived || false) === filter.isArchived);
    } else {
      docs = docs.filter((d) => !d.isArchived);
    }

    // RBAC Filter
    if (user.role === "salesperson") {
      docs = docs.filter((d) =>
        ["internal_only", "customer_shareable"].includes(d.visibilityClassification)
      );
    }

    // Search filter
    if (filter.search && filter.search.trim()) {
      const term = filter.search.trim().toLowerCase();
      docs = docs.filter(
        (d) =>
          d.documentNumber?.toLowerCase().includes(term) ||
          d.title?.toLowerCase().includes(term) ||
          d.heatNumber?.toLowerCase().includes(term) ||
          d.materialCode?.toLowerCase().includes(term) ||
          d.batchNumber?.toLowerCase().includes(term) ||
          d.issuer?.toLowerCase().includes(term) ||
          d.supplierName?.toLowerCase().includes(term) ||
          d.soNumber?.toLowerCase().includes(term) ||
          d.poNumber?.toLowerCase().includes(term)
      );
    }

    if (filter.documentType) docs = docs.filter((d) => d.documentType === filter.documentType);
    if (filter.approvalStatus) docs = docs.filter((d) => d.approvalStatus === filter.approvalStatus);
    if (filter.materialCode) docs = docs.filter((d) => d.materialCode === filter.materialCode);
    if (filter.heatNumber) docs = docs.filter((d) => d.heatNumber === filter.heatNumber);
    if (filter.batchNumber) docs = docs.filter((d) => d.batchNumber === filter.batchNumber);
    if (filter.supplierName) docs = docs.filter((d) => d.supplierName === filter.supplierName);
    if (filter.soNumber) docs = docs.filter((d) => d.soNumber === filter.soNumber);
    if (filter.poNumber) docs = docs.filter((d) => d.poNumber === filter.poNumber);

    // Expiry filter
    const nowTime = new Date().getTime();
    if (filter.isExpired) {
      docs = docs.filter((d) => d.expiryDate && new Date(d.expiryDate).getTime() < nowTime);
    } else if (filter.expiringWithinDays) {
      const futureTime = nowTime + filter.expiringWithinDays * 24 * 60 * 60 * 1000;
      docs = docs.filter(
        (d) =>
          d.expiryDate &&
          new Date(d.expiryDate).getTime() >= nowTime &&
          new Date(d.expiryDate).getTime() <= futureTime
      );
    }

    const total = docs.length;
    // Sorting
    const sortField = filter.sortBy || "createdAt";
    docs.sort((a, b) => {
      const valA = a[sortField] || "";
      const valB = b[sortField] || "";
      if (valA < valB) return filter.sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return filter.sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    const paginated = docs.slice(skip, skip + limit);
    return {
      documents: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Get single document by ID with versions, audit logs, reviews, and permissions check
   */
  async getDocumentById(id: string, user: UserContext) {
    await connectToDatabase();
    let doc: any = null;

    if (isDbConnected()) {
      if (Types.ObjectId.isValid(id)) {
        doc = await DocumentModel.findById(id).lean();
      }
      if (!doc) {
        doc = await DocumentModel.findOne({ documentNumber: id }).lean();
      }
      if (!doc) {
        const seedMatch = SEED_DOCUMENTS.find((d) => d._id === id || d.id === id);
        if (seedMatch) {
          doc = await DocumentModel.findOne({ documentNumber: seedMatch.documentNumber }).lean();
        }
      }
    }
    if (!doc) {
      doc = memoryDocuments.find((d) => String(d._id) === id || d.id === id || d.documentNumber === id) || null;
    }

    if (!doc) {
      throw new Error(`Document not found: ${id}`);
    }

    // RBAC Security Check
    const docContext: DocumentContext = {
      id: String(doc._id || doc.id),
      uploaderId: String(doc.uploaderId),
      visibilityClassification: doc.visibilityClassification,
      approvalStatus: doc.approvalStatus,
    };

    if (!PERMISSIONS.canViewDocument(user, docContext)) {
      throw new Error(
        "FORBIDDEN: You do not have permission to view this confidential document."
      );
    }

    // Fetch version history
    let versions: any[] = [];
    if (isDbConnected()) {
      versions = await DocumentVersionModel.find({
        documentId: doc._id,
      })
        .sort({ versionNumber: -1 })
        .lean();
    }
    if (versions.length === 0) {
      versions = memoryDocumentVersions
        .filter((v) => String(v.documentId) === String(doc._id || doc.id) || v.documentNumber === doc.documentNumber)
        .sort((a, b) => b.versionNumber - a.versionNumber);
    }

    // Fetch review history
    let reviews: any[] = [];
    if (isDbConnected()) {
      reviews = await DocumentReviewModel.find({
        documentId: doc._id,
      })
        .sort({ reviewedAt: -1 })
        .lean();
    }
    if (reviews.length === 0) {
      reviews = memoryDocumentReviews
        .filter((r) => String(r.documentId) === String(doc._id || doc.id) || r.documentNumber === doc.documentNumber)
        .sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime());
    }

    // Fetch audit history for this document
    let auditLogs: any[] = [];
    if (isDbConnected()) {
      auditLogs = await AuditLogModel.find({
        $or: [{ entityId: String(doc._id) }, { entityId: doc.documentNumber }],
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
    }

    return {
      document: doc,
      versions,
      reviews,
      auditLogs,
    };
  },

  /**
   * Create new document record and link to material batches and orders
   */
  async createDocument(data: any, user: UserContext) {
    if (!PERMISSIONS.canUploadDocument(user)) {
      throw new Error("FORBIDDEN: You do not have permission to upload documents.");
    }

    await connectToDatabase();

    // Check duplicate documentNumber
    const existing = isDbConnected()
      ? await DocumentModel.findOne({ documentNumber: data.documentNumber })
      : memoryDocuments.find((d) => d.documentNumber === data.documentNumber);

    if (existing) {
      throw new Error(`A document with document number '${data.documentNumber}' already exists.`);
    }

    const approvalStatus = data.submitForReview ? "pending_review" : "draft";

    const docPayload = {
      ...data,
      approvalStatus,
      versionNumber: 1,
      isArchived: false,
      uploaderId: isDbConnected() && Types.ObjectId.isValid(user.id) ? new Types.ObjectId(user.id) : user.id,
      uploaderName: user.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let createdDoc: any = null;

    if (isDbConnected()) {
      createdDoc = await DocumentModel.create(docPayload);

      // Create Initial Version 1 Record
      await DocumentVersionModel.create({
        documentId: createdDoc._id,
        versionNumber: 1,
        revision: data.revision || "0",
        cloudinaryAssetId: data.cloudinaryAssetId || "",
        cloudinaryPublicId: data.cloudinaryPublicId,
        cloudinaryUrl: data.cloudinaryUrl,
        format: data.format || "pdf",
        fileSize: data.fileSize || 0,
        changeReason: "Initial upload and creation",
        uploadedBy: createdDoc.uploaderId,
        uploadedByName: user.name,
        metadataSnapshot: {
          title: data.title,
          documentType: data.documentType,
          materialCode: data.materialCode,
          heatNumber: data.heatNumber,
          batchNumber: data.batchNumber,
        },
        createdAt: new Date(),
      });

      // Link to Material Batch if batchId or heatNumber matches
      if (data.batchId && Types.ObjectId.isValid(data.batchId)) {
        await MaterialBatchModel.findByIdAndUpdate(data.batchId, {
          $addToSet: { assignedCertificates: createdDoc._id },
        });
      } else if (data.heatNumber) {
        await MaterialBatchModel.updateMany(
          { heatNumber: data.heatNumber },
          { $addToSet: { assignedCertificates: createdDoc._id } }
        );
      }

      // Check and update order requirement checklist
      if (data.salesOrderId || data.soNumber) {
        await OrderDocumentRequirementModel.updateMany(
          {
            $or: [
              { orderId: data.salesOrderId },
              { orderNumber: data.soNumber },
            ],
            documentType: data.documentType,
          },
          {
            status: approvalStatus === "pending_review" ? "under_review" : "uploaded",
            linkedDocumentId: createdDoc._id,
          }
        );
      }
    } else {
      const newId = `doc_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      createdDoc = {
        _id: newId,
        id: newId,
        ...docPayload,
      };
      memoryDocuments.unshift(createdDoc);

      memoryDocumentVersions.unshift({
        _id: `ver_${Date.now()}`,
        documentId: newId,
        versionNumber: 1,
        revision: data.revision || "0",
        cloudinaryAssetId: data.cloudinaryAssetId || "",
        cloudinaryPublicId: data.cloudinaryPublicId,
        cloudinaryUrl: data.cloudinaryUrl,
        format: data.format || "pdf",
        fileSize: data.fileSize || 0,
        changeReason: "Initial upload and creation",
        uploadedBy: user.id,
        uploadedByName: user.name,
        createdAt: new Date(),
      });
    }

    // Log Immutable Audit Event
    await logAudit({
      action: "DOCUMENT_CREATED",
      entityType: "Document",
      entityId: String(createdDoc._id || createdDoc.id),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      details: {
        documentNumber: data.documentNumber,
        title: data.title,
        documentType: data.documentType,
        heatNumber: data.heatNumber,
        materialCode: data.materialCode,
        visibilityClassification: data.visibilityClassification,
        approvalStatus,
      },
    });

    // Notify Quality Reviewers if submitted for review
    if (approvalStatus === "pending_review") {
      await notificationService.notify({
        roleTarget: "quality_reviewer",
        title: "New Certificate Submitted for Review",
        message: `${data.documentNumber} (${data.documentType}) for Heat #${data.heatNumber || "N/A"} requires quality verification.`,
        type: "review_assigned",
        documentId: String(createdDoc._id || createdDoc.id),
      });
    }

    return createdDoc;
  },

  /**
   * Update Document Metadata (title, revision, issue date, etc.)
   */
  async updateMetadata(id: string, updates: any, user: UserContext) {
    const existing = await this.getDocumentById(id, user);
    const doc = existing.document;

    if (user.role !== "admin" && user.role !== "quality_reviewer") {
      if (user.role === "salesperson" && doc.uploaderId !== user.id) {
        throw new Error("FORBIDDEN: You can only edit metadata of documents you uploaded.");
      }
    }

    await connectToDatabase();
    let updatedDoc: any = null;

    if (isDbConnected()) {
      updatedDoc = await DocumentModel.findByIdAndUpdate(
        doc._id,
        { $set: { ...updates, updatedAt: new Date() } },
        { new: true }
      ).lean();
    } else {
      const idx = memoryDocuments.findIndex((d) => String(d._id) === id || d.id === id);
      if (idx !== -1) {
        memoryDocuments[idx] = { ...memoryDocuments[idx], ...updates, updatedAt: new Date() };
        updatedDoc = memoryDocuments[idx];
      }
    }

    await logAudit({
      action: "DOCUMENT_METADATA_UPDATED",
      entityType: "Document",
      entityId: String(doc._id || doc.id),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      details: {
        documentNumber: doc.documentNumber,
        updatedFields: Object.keys(updates),
      },
    });

    return updatedDoc;
  },

  /**
   * Submit document for review
   */
  async submitForReview(id: string, user: UserContext) {
    const existing = await this.getDocumentById(id, user);
    const doc = existing.document;

    const docContext: DocumentContext = {
      id: String(doc._id || doc.id),
      uploaderId: String(doc.uploaderId),
      visibilityClassification: doc.visibilityClassification,
      approvalStatus: doc.approvalStatus,
    };

    if (!PERMISSIONS.canSubmitForReview(user, docContext)) {
      throw new Error("FORBIDDEN: You cannot submit this document for review.");
    }

    await connectToDatabase();
    if (isDbConnected()) {
      await DocumentModel.findByIdAndUpdate(doc._id, {
        approvalStatus: "pending_review",
        rejectionReason: "",
      });
      // Update linked order requirement
      if (doc.salesOrderId || doc.soNumber) {
        await OrderDocumentRequirementModel.updateMany(
          { linkedDocumentId: doc._id },
          { status: "under_review" }
        );
      }
    } else {
      const d = memoryDocuments.find((x) => String(x._id) === id || x.id === id);
      if (d) {
        d.approvalStatus = "pending_review";
        d.rejectionReason = "";
      }
    }

    await logAudit({
      action: "DOCUMENT_SUBMITTED_FOR_REVIEW",
      entityType: "Document",
      entityId: String(doc._id || doc.id),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      details: { documentNumber: doc.documentNumber },
    });

    await notificationService.notify({
      roleTarget: "quality_reviewer",
      title: "Document Ready for Review",
      message: `${doc.documentNumber} (${doc.title}) has been submitted for review.`,
      type: "review_assigned",
      documentId: String(doc._id || doc.id),
    });

    return { success: true };
  },

  /**
   * Approve Document with self-approval check and order requirement update
   */
  async approveDocument(
    id: string,
    comments: string = "",
    checklistVerifications: any[] = [],
    user: UserContext,
    allowSelfApprovalException: boolean = false
  ) {
    const existing = await this.getDocumentById(id, user);
    const doc = existing.document;

    const docContext: DocumentContext = {
      id: String(doc._id || doc.id),
      uploaderId: String(doc.uploaderId),
      visibilityClassification: doc.visibilityClassification,
      approvalStatus: doc.approvalStatus,
    };

    const permCheck = PERMISSIONS.canApproveDocument(
      user,
      docContext,
      allowSelfApprovalException
    );

    if (!permCheck.allowed) {
      throw new Error(`APPROVAL REJECTED: ${permCheck.reason}`);
    }

    await connectToDatabase();
    const reviewedAt = new Date();

    if (isDbConnected()) {
      await DocumentModel.findByIdAndUpdate(doc._id, {
        approvalStatus: "approved",
        reviewerId: Types.ObjectId.isValid(user.id) ? new Types.ObjectId(user.id) : user.id,
        reviewerName: user.name,
        reviewedAt,
        reviewNotes: comments,
        rejectionReason: "",
      });

      // Record Review Record
      await DocumentReviewModel.create({
        documentId: doc._id,
        versionNumber: doc.versionNumber || 1,
        reviewerId: Types.ObjectId.isValid(user.id) ? new Types.ObjectId(user.id) : user.id,
        reviewerName: user.name,
        reviewerRole: user.role,
        decision: "approved",
        comments: comments || "Document meets all technical and specification requirements.",
        checklistVerifications,
        reviewedAt,
      });

      // Update linked order requirement status
      await OrderDocumentRequirementModel.updateMany(
        { linkedDocumentId: doc._id },
        { status: "approved" }
      );

      // Check if SalesOrder is now ready for dispatch
      if (doc.salesOrderId) {
        await this.evaluateOrderDispatchReadiness(String(doc.salesOrderId));
      }
    } else {
      const d = memoryDocuments.find((x) => String(x._id) === id || x.id === id);
      if (d) {
        d.approvalStatus = "approved";
        d.reviewerId = user.id;
        d.reviewerName = user.name;
        d.reviewedAt = reviewedAt;
        d.reviewNotes = comments;
      }
      memoryDocumentReviews.unshift({
        _id: `rev_${Date.now()}`,
        documentId: String(doc._id || doc.id),
        versionNumber: doc.versionNumber || 1,
        reviewerId: user.id,
        reviewerName: user.name,
        reviewerRole: user.role,
        decision: "approved",
        comments: comments || "Document approved",
        checklistVerifications,
        reviewedAt,
      });
    }

    await logAudit({
      action: "DOCUMENT_APPROVED",
      entityType: "Document",
      entityId: String(doc._id || doc.id),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      details: {
        documentNumber: doc.documentNumber,
        versionNumber: doc.versionNumber,
        heatNumber: doc.heatNumber,
        comments,
      },
    });

    // Notify uploader
    await notificationService.notify({
      userId: String(doc.uploaderId),
      title: "Certificate Approved",
      message: `${doc.documentNumber} (${doc.title}) has been formally APPROVED by ${user.name}.`,
      type: "document_approved",
      documentId: String(doc._id || doc.id),
    });

    return { success: true, approvalStatus: "approved" };
  },

  /**
   * Reject Document with mandatory reason
   */
  async rejectDocument(
    id: string,
    reason: string,
    comments: string = "",
    checklistVerifications: any[] = [],
    user: UserContext
  ) {
    if (!PERMISSIONS.canRejectDocument(user)) {
      throw new Error("FORBIDDEN: Only Quality Reviewers and Admins can reject documents.");
    }

    if (!reason || !reason.trim()) {
      throw new Error("MANDATORY FIELD MISSING: Rejection requires a mandatory reason.");
    }

    const existing = await this.getDocumentById(id, user);
    const doc = existing.document;
    const reviewedAt = new Date();

    await connectToDatabase();

    if (isDbConnected()) {
      await DocumentModel.findByIdAndUpdate(doc._id, {
        approvalStatus: "rejected",
        reviewerId: Types.ObjectId.isValid(user.id) ? new Types.ObjectId(user.id) : user.id,
        reviewerName: user.name,
        reviewedAt,
        rejectionReason: reason.trim(),
        reviewNotes: comments,
      });

      await DocumentReviewModel.create({
        documentId: doc._id,
        versionNumber: doc.versionNumber || 1,
        reviewerId: Types.ObjectId.isValid(user.id) ? new Types.ObjectId(user.id) : user.id,
        reviewerName: user.name,
        reviewerRole: user.role,
        decision: "rejected",
        comments: `REJECTED: ${reason.trim()}. ${comments}`,
        checklistVerifications,
        reviewedAt,
      });

      await OrderDocumentRequirementModel.updateMany(
        { linkedDocumentId: doc._id },
        { status: "rejected" }
      );

      if (doc.salesOrderId) {
        await this.evaluateOrderDispatchReadiness(String(doc.salesOrderId));
      }
    } else {
      const d = memoryDocuments.find((x) => String(x._id) === id || x.id === id);
      if (d) {
        d.approvalStatus = "rejected";
        d.reviewerId = user.id;
        d.reviewerName = user.name;
        d.reviewedAt = reviewedAt;
        d.rejectionReason = reason.trim();
        d.reviewNotes = comments;
      }
      memoryDocumentReviews.unshift({
        _id: `rev_${Date.now()}`,
        documentId: String(doc._id || doc.id),
        versionNumber: doc.versionNumber || 1,
        reviewerId: user.id,
        reviewerName: user.name,
        reviewerRole: user.role,
        decision: "rejected",
        comments: reason.trim(),
        checklistVerifications,
        reviewedAt,
      });
    }

    await logAudit({
      action: "DOCUMENT_REJECTED",
      entityType: "Document",
      entityId: String(doc._id || doc.id),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      details: {
        documentNumber: doc.documentNumber,
        versionNumber: doc.versionNumber,
        reason: reason.trim(),
        comments,
      },
    });

    // Notify uploader
    await notificationService.notify({
      userId: String(doc.uploaderId),
      title: "Certificate Rejected",
      message: `${doc.documentNumber} was REJECTED: ${reason.trim()}`,
      type: "document_rejected",
      documentId: String(doc._id || doc.id),
    });

    return { success: true, approvalStatus: "rejected" };
  },

  /**
   * Request correction from uploader
   */
  async requestCorrection(id: string, notes: string, user: UserContext) {
    if (!PERMISSIONS.canRejectDocument(user)) {
      throw new Error("FORBIDDEN: Only Quality Reviewers and Admins can request corrections.");
    }

    if (!notes || !notes.trim()) {
      throw new Error("Correction instructions are required.");
    }

    const existing = await this.getDocumentById(id, user);
    const doc = existing.document;
    const reviewedAt = new Date();

    await connectToDatabase();

    if (isDbConnected()) {
      await DocumentModel.findByIdAndUpdate(doc._id, {
        approvalStatus: "correction_required",
        reviewNotes: notes,
        reviewedAt,
      });

      await DocumentReviewModel.create({
        documentId: doc._id,
        versionNumber: doc.versionNumber || 1,
        reviewerId: Types.ObjectId.isValid(user.id) ? new Types.ObjectId(user.id) : user.id,
        reviewerName: user.name,
        reviewerRole: user.role,
        decision: "correction_required",
        comments: notes,
        checklistVerifications: [],
        reviewedAt,
      });
    } else {
      const d = memoryDocuments.find((x) => String(x._id) === id || x.id === id);
      if (d) {
        d.approvalStatus = "correction_required";
        d.reviewNotes = notes;
      }
    }

    await logAudit({
      action: "DOCUMENT_CORRECTION_REQUESTED",
      entityType: "Document",
      entityId: String(doc._id || doc.id),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      details: {
        documentNumber: doc.documentNumber,
        notes,
      },
    });

    await notificationService.notify({
      userId: String(doc.uploaderId),
      title: "Correction Required for Certificate",
      message: `Correction requested on ${doc.documentNumber}: ${notes}`,
      type: "document_rejected",
      documentId: String(doc._id || doc.id),
    });

    return { success: true, approvalStatus: "correction_required" };
  },

  /**
   * Replace Document Version (Creates new version, never silently overwrites!)
   */
  async replaceDocumentVersion(
    id: string,
    newRevision: string,
    changeReason: string,
    fileData: {
      cloudinaryPublicId: string;
      cloudinaryUrl: string;
      cloudinaryAssetId?: string;
      format: string;
      fileSize: number;
    },
    user: UserContext
  ) {
    const existing = await this.getDocumentById(id, user);
    const doc = existing.document;

    const docContext: DocumentContext = {
      id: String(doc._id || doc.id),
      uploaderId: String(doc.uploaderId),
      visibilityClassification: doc.visibilityClassification,
      approvalStatus: doc.approvalStatus,
    };

    if (!PERMISSIONS.canReplaceDocument(user, docContext)) {
      throw new Error("FORBIDDEN: You do not have permission to replace this document version.");
    }

    if (!changeReason || changeReason.trim().length < 3) {
      throw new Error("A specific change reason is required for creating a new document version.");
    }

    const nextVersionNumber = (doc.versionNumber || 1) + 1;
    await connectToDatabase();

    if (isDbConnected()) {
      // 1. Create DocumentVersion record for the NEW version
      const newVersionRecord = await DocumentVersionModel.create({
        documentId: doc._id,
        versionNumber: nextVersionNumber,
        revision: newRevision,
        cloudinaryAssetId: fileData.cloudinaryAssetId || "",
        cloudinaryPublicId: fileData.cloudinaryPublicId,
        cloudinaryUrl: fileData.cloudinaryUrl,
        format: fileData.format || "pdf",
        fileSize: fileData.fileSize,
        changeReason: changeReason.trim(),
        uploadedBy: Types.ObjectId.isValid(user.id) ? new Types.ObjectId(user.id) : user.id,
        uploadedByName: user.name,
        metadataSnapshot: {
          previousRevision: doc.revision,
          previousVersion: doc.versionNumber,
          materialCode: doc.materialCode,
          heatNumber: doc.heatNumber,
        },
        createdAt: new Date(),
      });

      // 2. Update master document with new version details and reset to pending_review
      await DocumentModel.findByIdAndUpdate(doc._id, {
        versionNumber: nextVersionNumber,
        revision: newRevision,
        cloudinaryPublicId: fileData.cloudinaryPublicId,
        cloudinaryUrl: fileData.cloudinaryUrl,
        cloudinaryAssetId: fileData.cloudinaryAssetId || "",
        format: fileData.format,
        fileSize: fileData.fileSize,
        approvalStatus: "pending_review",
        replacementReference: newVersionRecord._id,
        rejectionReason: "",
        reviewedAt: null,
        reviewerId: null,
        reviewerName: "",
        updatedAt: new Date(),
      });

      // Update order requirements to under_review
      await OrderDocumentRequirementModel.updateMany(
        { linkedDocumentId: doc._id },
        { status: "under_review" }
      );
    } else {
      const d = memoryDocuments.find((x) => String(x._id) === id || x.id === id);
      if (d) {
        d.versionNumber = nextVersionNumber;
        d.revision = newRevision;
        d.cloudinaryPublicId = fileData.cloudinaryPublicId;
        d.cloudinaryUrl = fileData.cloudinaryUrl;
        d.format = fileData.format;
        d.fileSize = fileData.fileSize;
        d.approvalStatus = "pending_review";
        d.rejectionReason = "";
      }
      memoryDocumentVersions.unshift({
        _id: `ver_${Date.now()}`,
        documentId: String(doc._id || doc.id),
        versionNumber: nextVersionNumber,
        revision: newRevision,
        cloudinaryPublicId: fileData.cloudinaryPublicId,
        cloudinaryUrl: fileData.cloudinaryUrl,
        format: fileData.format,
        fileSize: fileData.fileSize,
        changeReason: changeReason.trim(),
        uploadedBy: user.id,
        uploadedByName: user.name,
        createdAt: new Date(),
      });
    }

    await logAudit({
      action: "DOCUMENT_VERSION_REPLACED",
      entityType: "Document",
      entityId: String(doc._id || doc.id),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      details: {
        documentNumber: doc.documentNumber,
        previousVersion: doc.versionNumber,
        newVersion: nextVersionNumber,
        newRevision,
        changeReason: changeReason.trim(),
      },
    });

    await notificationService.notify({
      roleTarget: "quality_reviewer",
      title: "New Document Version Uploaded",
      message: `${doc.documentNumber} updated to Rev ${newRevision} (v${nextVersionNumber}) and awaiting review.`,
      type: "review_assigned",
      documentId: String(doc._id || doc.id),
    });

    return {
      success: true,
      newVersionNumber: nextVersionNumber,
      revision: newRevision,
    };
  },

  /**
   * Archive document (soft-archive)
   */
  async archiveDocument(id: string, user: UserContext) {
    if (!PERMISSIONS.canArchiveDocument(user)) {
      throw new Error("FORBIDDEN: You do not have permission to archive certificates.");
    }

    const existing = await this.getDocumentById(id, user);
    const doc = existing.document;

    await connectToDatabase();

    if (isDbConnected()) {
      await DocumentModel.findByIdAndUpdate(doc._id, {
        isArchived: true,
        approvalStatus: "archived",
      });
    } else {
      const d = memoryDocuments.find((x) => String(x._id) === id || x.id === id);
      if (d) {
        d.isArchived = true;
        d.approvalStatus = "archived";
      }
    }

    await logAudit({
      action: "DOCUMENT_ARCHIVED",
      entityType: "Document",
      entityId: String(doc._id || doc.id),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      details: {
        documentNumber: doc.documentNumber,
      },
    });

    return { success: true };
  },

  /**
   * Evaluate SalesOrder dispatch readiness based on document requirements
   */
  async evaluateOrderDispatchReadiness(salesOrderId: string) {
    if (!isDbConnected()) return true;

    const requirements = await OrderDocumentRequirementModel.find({
      orderId: new Types.ObjectId(salesOrderId),
      isMandatory: true,
    });

    const unapproved = requirements.filter((r) => r.status !== "approved");
    const isReady = unapproved.length === 0;

    const blockReason = isReady
      ? ""
      : `Missing or unapproved mandatory documentation: ${unapproved.map((u) => u.documentType).join(", ")}`;

    await SalesOrderModel.findByIdAndUpdate(salesOrderId, {
      dispatchReady: isReady,
      dispatchBlockReason: blockReason,
    });

    return isReady;
  },

  /**
   * Get Dashboard Metrics & Analytics
   */
  async getDashboardMetrics(user: UserContext) {
    await connectToDatabase();
    const isConnected = isDbConnected();

    if (isConnected) {
      const now = new Date();
      const in30Days = new Date();
      in30Days.setDate(in30Days.getDate() + 30);

      const rbacQuery: any = { isArchived: { $ne: true } };
      if (user.role === "salesperson") {
        rbacQuery.visibilityClassification = { $in: ["internal_only", "customer_shareable"] };
      }

      const [
        totalDocuments,
        pendingReview,
        approved,
        rejected,
        expired,
        upcomingExpiryCount,
        missingRequirementsCount,
        recentUploads,
        awaitingReviewList,
        incompleteOrders,
      ] = await Promise.all([
        DocumentModel.countDocuments(rbacQuery),
        DocumentModel.countDocuments({ ...rbacQuery, approvalStatus: "pending_review" }),
        DocumentModel.countDocuments({ ...rbacQuery, approvalStatus: "approved" }),
        DocumentModel.countDocuments({ ...rbacQuery, approvalStatus: "rejected" }),
        DocumentModel.countDocuments({
          ...rbacQuery,
          expiryDate: { $ne: null, $lt: now },
        }),
        DocumentModel.countDocuments({
          ...rbacQuery,
          expiryDate: { $ne: null, $gte: now, $lte: in30Days },
        }),
        OrderDocumentRequirementModel.countDocuments({
          status: { $in: ["missing", "rejected"] },
          isMandatory: true,
        }),
        DocumentModel.find(rbacQuery).sort({ createdAt: -1 }).limit(6).lean(),
        DocumentModel.find({ ...rbacQuery, approvalStatus: "pending_review" })
          .sort({ createdAt: -1 })
          .limit(6)
          .lean(),
        SalesOrderModel.find({ dispatchReady: false }).limit(6).lean(),
      ]);

      return {
        totalDocuments,
        pendingReview,
        approved,
        rejected,
        missingDocuments: missingRequirementsCount,
        expiredDocuments: expired,
        upcomingExpiryCount,
        recentUploads,
        awaitingReviewList,
        incompleteOrders,
      };
    }

    // In-memory fallback metrics
    const now = new Date().getTime();
    const in30Days = now + 30 * 24 * 60 * 60 * 1000;

    let docs = memoryDocuments.filter((d) => !d.isArchived);
    if (user.role === "salesperson") {
      docs = docs.filter((d) =>
        ["internal_only", "customer_shareable"].includes(d.visibilityClassification)
      );
    }

    const totalDocuments = docs.length;
    const pendingReview = docs.filter((d) => d.approvalStatus === "pending_review").length;
    const approved = docs.filter((d) => d.approvalStatus === "approved").length;
    const rejected = docs.filter((d) => d.approvalStatus === "rejected").length;
    const expired = docs.filter(
      (d) => d.expiryDate && new Date(d.expiryDate).getTime() < now
    ).length;
    const upcomingExpiryCount = docs.filter(
      (d) =>
        d.expiryDate &&
        new Date(d.expiryDate).getTime() >= now &&
        new Date(d.expiryDate).getTime() <= in30Days
    ).length;

    const missingDocuments = memoryOrderRequirements.filter(
      (r) => r.isMandatory && ["missing", "rejected"].includes(r.status)
    ).length;

    return {
      totalDocuments,
      pendingReview,
      approved,
      rejected,
      missingDocuments,
      expiredDocuments: expired,
      upcomingExpiryCount,
      recentUploads: docs.slice(0, 6),
      awaitingReviewList: docs.filter((d) => d.approvalStatus === "pending_review").slice(0, 6),
      incompleteOrders: memorySalesOrders.filter((s) => !s.dispatchReady).slice(0, 6),
    };
  },
};
