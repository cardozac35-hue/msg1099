import { connectToDatabase } from "./db";
import { AuditLogModel } from "@/models/AuditLog";

export type AuditAction =
  | "AUTH_LOGIN"
  | "AUTH_LOGOUT"
  | "AUTH_PASSWORD_RESET"
  | "ENQUIRY_CREATED"
  | "ENQUIRY_UPDATED"
  | "ENQUIRY_STATUS_CHANGED"
  | "SUPPLIER_QUOTE_CREATED"
  | "SUPPLIER_QUOTE_UPDATED"
  | "SUPPLIER_QUOTE_DELETED"
  | "QUOTATION_CREATED"
  | "QUOTATION_REVISED"
  | "QUOTATION_APPROVED"
  | "QUOTATION_REJECTED"
  | "QUOTATION_SENT"
  | "DOCUMENT_UPLOADED"
  | "DOCUMENT_ACCESSED"
  | "DOCUMENT_CREATED"
  | "DOCUMENT_METADATA_UPDATED"
  | "DOCUMENT_SUBMITTED_FOR_REVIEW"
  | "DOCUMENT_APPROVED"
  | "DOCUMENT_REJECTED"
  | "DOCUMENT_CORRECTION_REQUESTED"
  | "DOCUMENT_VERSION_REPLACED"
  | "DOCUMENT_ARCHIVED"
  | "DOCUMENT_DOWNLOADED"
  | "DOCUMENT_REQUIREMENT_CREATED"
  | "DOCUMENT_REQUIREMENT_UPDATED"
  | "DOCUMENT_PACK_GENERATED"
  | "MASTER_SHEET_EXPORTED"
  | "SETTINGS_UPDATED"
  | "USER_UPDATED";

export interface LogAuditInput {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

export async function logAudit(entry: LogAuditInput): Promise<void> {
  try {
    await connectToDatabase();
    await AuditLogModel.create({
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId || "N/A",
      userId: entry.userId,
      userName: entry.userName || "System",
      userRole: entry.userRole || "system",
      details: entry.details || {},
      ipAddress: entry.ipAddress || "127.0.0.1",
      createdAt: new Date(),
    });
  } catch (err) {
    // Audit logging is append-only and should never throw to disrupt business flow,
    // but should be recorded in server console
    console.error("[AUDIT LOGGING ERROR]", err);
  }
}
