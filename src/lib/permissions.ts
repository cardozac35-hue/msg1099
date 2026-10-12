/**
 * Role-Based Access Control (RBAC) and Document Security Permissions
 * for Oil & Gas Material Certification and Document Management Module.
 */

export type UserRole = "admin" | "salesperson" | "quality_reviewer" | "management";

export type DocumentVisibility =
  | "internal_only"
  | "quality_team_only"
  | "customer_shareable"
  | "supplier_confidential";

export type DocumentStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "correction_required"
  | "superseded"
  | "archived"
  | "expired";

export interface UserContext {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface DocumentContext {
  id: string;
  uploaderId?: string;
  visibilityClassification: DocumentVisibility;
  approvalStatus: DocumentStatus;
}

export const PERMISSIONS = {
  // Can upload documents
  canUploadDocument(user: UserContext): boolean {
    return ["admin", "salesperson", "quality_reviewer"].includes(user.role);
  },

  // Can view a specific document based on its visibility and status
  canViewDocument(user: UserContext, doc: DocumentContext): boolean {
    if (user.role === "admin") return true;

    // Supplier confidential documents cannot be viewed by salesperson
    if (doc.visibilityClassification === "supplier_confidential") {
      return ["quality_reviewer", "management"].includes(user.role);
    }

    // Quality team only documents
    if (doc.visibilityClassification === "quality_team_only") {
      return ["quality_reviewer", "management"].includes(user.role);
    }

    // Customer shareable
    if (doc.visibilityClassification === "customer_shareable") {
      return true; // All roles can view customer-shareable
    }

    // Internal only
    if (doc.visibilityClassification === "internal_only") {
      return true; // All internal authenticated roles
    }

    return true;
  },

  // Can approve a document
  canApproveDocument(
    user: UserContext,
    doc: DocumentContext,
    allowSelfApprovalForAdmin: boolean = false
  ): { allowed: boolean; reason?: string } {
    if (!["admin", "quality_reviewer"].includes(user.role)) {
      return {
        allowed: false,
        reason: "Only Quality / Document Reviewers and Administrators can approve certificates.",
      };
    }

    // Self-approval restriction: Uploader cannot approve their own document unless admin has explicit exception
    if (doc.uploaderId && String(doc.uploaderId) === String(user.id)) {
      if (user.role === "admin" && allowSelfApprovalForAdmin) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: "Self-approval is prohibited: Uploaders cannot approve their own certificates.",
      };
    }

    return { allowed: true };
  },

  // Can reject a document
  canRejectDocument(user: UserContext): boolean {
    return ["admin", "quality_reviewer"].includes(user.role);
  },

  // Can submit for review
  canSubmitForReview(user: UserContext, doc: DocumentContext): boolean {
    if (["admin", "quality_reviewer"].includes(user.role)) return true;
    if (user.role === "salesperson") {
      return ["draft", "correction_required"].includes(doc.approvalStatus);
    }
    return false;
  },

  // Can replace document version
  canReplaceDocument(user: UserContext, doc: DocumentContext): boolean {
    if (["admin", "quality_reviewer"].includes(user.role)) return true;
    if (user.role === "salesperson" && doc.uploaderId === user.id) {
      return ["draft", "correction_required", "rejected"].includes(doc.approvalStatus);
    }
    return false;
  },

  // Can archive document
  canArchiveDocument(user: UserContext): boolean {
    return ["admin", "quality_reviewer"].includes(user.role);
  },

  // Can manage requirements and settings
  canManageRequirements(user: UserContext): boolean {
    return ["admin"].includes(user.role);
  },

  // Can configure system settings
  canManageSettings(user: UserContext): boolean {
    return ["admin"].includes(user.role);
  },

  // Can generate customer document pack (ZIP)
  canGenerateCustomerPack(user: UserContext): boolean {
    return ["admin", "salesperson", "quality_reviewer", "management"].includes(user.role);
  },

  // Can view audit history
  canViewAuditLogs(user: UserContext): boolean {
    return ["admin", "quality_reviewer", "management"].includes(user.role);
  },
};
