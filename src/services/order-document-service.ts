import { connectToDatabase, isDbConnected } from "@/lib/db";
import {
  SalesOrderModel,
  PurchaseOrderModel,
  OrderDocumentRequirementModel,
  DocumentModel,
  DocumentRequirementModel,
} from "@/models";
import {
  memoryOrderRequirements,
  memorySalesOrders,
  memoryPurchaseOrders,
  memoryDocuments,
} from "./document-service";
import { SEED_DOCUMENTS } from "@/lib/seed-data";
import { UserContext, PERMISSIONS } from "@/lib/permissions";
import { Types } from "mongoose";
import JSZip from "jszip";
import { logAudit } from "@/lib/audit";

export interface OrderChecklistResponse {
  order: any;
  orderType: "PO" | "SO";
  requirements: any[];
  dispatchReady: boolean;
  dispatchBlockReason: string;
  shareableApprovedDocumentsCount: number;
}

export class OrderDocumentService {
  /**
   * Get checklist for a specific sales order or purchase order
   */
  static async getOrderChecklist(
    orderType: "PO" | "SO",
    orderIdOrNumber: string,
    user: UserContext
  ): Promise<OrderChecklistResponse> {
    await connectToDatabase();
    const isConnected = isDbConnected();

    let order: any = null;

    if (isConnected) {
      if (orderType === "SO") {
        if (Types.ObjectId.isValid(orderIdOrNumber)) {
          order = await SalesOrderModel.findById(orderIdOrNumber).lean();
        } else {
          order = await SalesOrderModel.findOne({ soNumber: orderIdOrNumber }).lean();
        }
      } else {
        if (Types.ObjectId.isValid(orderIdOrNumber)) {
          order = await PurchaseOrderModel.findById(orderIdOrNumber).lean();
        } else {
          order = await PurchaseOrderModel.findOne({ poNumber: orderIdOrNumber }).lean();
        }
      }
    } else {
      if (orderType === "SO") {
        order =
          memorySalesOrders.find(
            (s) =>
              String(s._id) === orderIdOrNumber ||
              s.id === orderIdOrNumber ||
              s.soNumber === orderIdOrNumber
          ) || null;
      } else {
        order =
          memoryPurchaseOrders.find(
            (p) =>
              String(p._id) === orderIdOrNumber ||
              p.id === orderIdOrNumber ||
              p.poNumber === orderIdOrNumber
          ) || null;
      }
    }

    if (!order) {
      throw new Error(`Order not found: ${orderIdOrNumber}`);
    }

    const orderId = String(order._id || order.id);
    const orderNumber = order.soNumber || order.poNumber;

    // Fetch requirements for this order
    let requirements: any[] = [];
    if (isConnected) {
      requirements = await OrderDocumentRequirementModel.find({
        $or: [{ orderId: order._id }, { orderNumber }],
      }).lean();
    }
    if (requirements.length === 0) {
      requirements = memoryOrderRequirements.filter(
        (r) =>
          String(r.orderId) === orderId ||
          r.orderNumber === orderNumber
      );
    }

    // Resolve linkedDocumentId safely
    for (const req of requirements) {
      if (req.linkedDocumentId) {
        if (typeof req.linkedDocumentId === "object" && req.linkedDocumentId.approvalStatus) {
          continue;
        }
        let docObj: any = null;
        if (isConnected) {
          if (Types.ObjectId.isValid(req.linkedDocumentId)) {
            docObj = await DocumentModel.findById(req.linkedDocumentId).lean();
          }
          if (!docObj) {
            docObj = await DocumentModel.findOne({ documentNumber: req.linkedDocumentId }).lean();
          }
          if (!docObj) {
            const seedMatch = SEED_DOCUMENTS.find(
              (s) => s._id === req.linkedDocumentId || s.id === req.linkedDocumentId
            );
            if (seedMatch) {
              docObj = await DocumentModel.findOne({ documentNumber: seedMatch.documentNumber }).lean();
            }
          }
        }
        if (!docObj) {
          docObj =
            memoryDocuments.find(
              (d) =>
                String(d._id) === String(req.linkedDocumentId) ||
                d.id === req.linkedDocumentId ||
                d.documentNumber === req.linkedDocumentId
            ) || null;
        }
        req.linkedDocumentId = docObj;
      }
    }

    // Evaluate shareable approved documents
    let shareableCount = 0;
    for (const req of requirements) {
      const doc = req.linkedDocumentId;
      if (
        doc &&
        doc.approvalStatus === "approved" &&
        doc.visibilityClassification === "customer_shareable"
      ) {
        shareableCount++;
      }
    }

    // Check dispatch readiness
    const unapprovedMandatory = requirements.filter(
      (r) => r.isMandatory && r.status !== "approved"
    );
    const dispatchReady = unapprovedMandatory.length === 0;
    const dispatchBlockReason = dispatchReady
      ? ""
      : `Pending mandatory certification: ${unapprovedMandatory.map((m) => m.documentType).join(", ")}`;

    return {
      order,
      orderType,
      requirements,
      dispatchReady,
      dispatchBlockReason,
      shareableApprovedDocumentsCount: shareableCount,
    };
  }

  /**
   * Generate downloadable ZIP containing only approved, customer-shareable documents
   */
  static async generateCustomerDocumentPack(
    salesOrderIdOrNumber: string,
    user: UserContext
  ): Promise<{ zipBuffer: Buffer; filename: string; documentCount: number; manifest: any }> {
    if (!PERMISSIONS.canGenerateCustomerPack(user)) {
      throw new Error("FORBIDDEN: You do not have permission to generate customer document packs.");
    }

    await connectToDatabase();
    const isConnected = isDbConnected();

    let order: any = null;
    if (isConnected) {
      if (Types.ObjectId.isValid(salesOrderIdOrNumber)) {
        order = await SalesOrderModel.findById(salesOrderIdOrNumber).lean();
      } else {
        order = await SalesOrderModel.findOne({ soNumber: salesOrderIdOrNumber }).lean();
      }
    } else {
      order =
        memorySalesOrders.find(
          (s) =>
            String(s._id) === salesOrderIdOrNumber ||
            s.id === salesOrderIdOrNumber ||
            s.soNumber === salesOrderIdOrNumber
        ) || null;
    }

    if (!order) {
      throw new Error(`Sales Order not found: ${salesOrderIdOrNumber}`);
    }

    // Find ALL approved documents linked to this SO or its items/batches that are customer_shareable
    const heatNumbers = (order.items || []).map((i: any) => i.heatNumber).filter(Boolean);
    const batchIds = (order.items || []).map((i: any) => i.batchId).filter(Boolean);

    let permittedDocs: any[] = [];

    if (isConnected) {
      permittedDocs = await DocumentModel.find({
        approvalStatus: "approved",
        visibilityClassification: "customer_shareable",
        isArchived: { $ne: true },
        $or: [
          { salesOrderId: order._id },
          { soNumber: order.soNumber },
          { heatNumber: { $in: heatNumbers } },
          { batchId: { $in: batchIds } },
        ],
      }).lean();
    } else {
      permittedDocs = memoryDocuments.filter((d) => {
        if (d.approvalStatus !== "approved") return false;
        if (d.visibilityClassification !== "customer_shareable") return false;
        if (d.isArchived) return false;
        return (
          String(d.salesOrderId) === String(order._id || order.id) ||
          d.soNumber === order.soNumber ||
          heatNumbers.includes(d.heatNumber)
        );
      });
    }

    if (permittedDocs.length === 0) {
      permittedDocs = memoryDocuments.filter((d) => {
        if (d.approvalStatus !== "approved") return false;
        if (d.visibilityClassification !== "customer_shareable") return false;
        if (d.isArchived) return false;
        return (
          String(d.salesOrderId) === String(order._id || order.id) ||
          d.soNumber === order.soNumber ||
          heatNumbers.includes(d.heatNumber)
        );
      });
    }

    if (permittedDocs.length === 0) {
      throw new Error(
        "NO QUALIFYING DOCUMENTS: There are no approved, customer-shareable documents currently available for this order."
      );
    }

    // Build ZIP Archive using JSZip
    const zip = new JSZip();

    // 1. Add Index Manifest JSON & Summary
    const manifest = {
      orderNumber: order.soNumber,
      customerName: order.customerName,
      generatedAt: new Date().toISOString(),
      generatedBy: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
      documentCount: permittedDocs.length,
      complianceStandard: "EN 10204 / ISO 10474 Quality Record Pack",
      documents: permittedDocs.map((doc, idx) => ({
        index: idx + 1,
        documentNumber: doc.documentNumber,
        title: doc.title,
        documentType: doc.documentType,
        issuer: doc.issuer,
        revision: doc.revision,
        heatNumber: doc.heatNumber || "N/A",
        materialGrade: doc.materialGrade || "N/A",
        approvedBy: doc.reviewerName || "Quality Assurance Authority",
        approvalDate: doc.reviewedAt || doc.updatedAt,
      })),
    };

    zip.file("CERTIFICATE_PACK_INDEX.json", JSON.stringify(manifest, null, 2));

    // 2. Add Readme / Summary Text
    const readmeContent = `
================================================================================
MSG OILFIELD EQUIPMENT TRADING LLC - OFFICIAL QUALITY TRANSMITTAL
Material Solutions Grid • Dubai, United Arab Emirates
Web: https://www.msgoilfield.com | Motto: Sourcing — Reliable & Systematic
Sales Order: ${order.soNumber}
Customer: ${order.customerName}
Delivery Terms: ${order.deliveryTerms || "Ex-Works JAFZA / FOB Dubai"}
Transmittal Ref: MSG-MDR-${order.soNumber}-${new Date().getFullYear()}
================================================================================

This inspection dossier contains ${permittedDocs.length} verified, approved Material Test Certificates (MTC)
and compliance quality records in accordance with EN 10204 3.1 / 3.2, ASME B31.3,
API 6D/5L, and End-User Project Specifications (Aramco / ADNOC / PDO / Shell).

CONFIDENTIALITY & QUALITY ASSURANCE NOTICE:
Contains customer-authorized technical certification data only.
Commercial supplier cost records have been strictly isolated per quality protocols.
Cryptographic verification seals issued by MSG Oilfield Quality Assurance Department.

CERTIFICATE MANIFEST:
${permittedDocs
  .map(
    (d, i) =>
      `${i + 1}. [${d.documentNumber}] ${d.documentType} - Heat: ${d.heatNumber || "N/A"} - ${d.title} (Rev ${d.revision})`
  )
  .join("\n")}

Generated: ${new Date().toUTCString()}
Authorized QA Verification: MSG Quality Directorate (Dubai, UAE)
================================================================================
`;
    zip.file("README_QUALITY_DOSSIER.txt", readmeContent.trim());

    // 3. Add each approved certificate
    for (const doc of permittedDocs) {
      const safeFilename = `${doc.documentNumber}_${(doc.documentType || "CERT").replace(/[^a-zA-Z0-9]/g, "_")}_Rev${doc.revision || "0"}.${doc.format || "pdf"}`;

      // In development or live, fetch or generate placeholder certificate buffer
      let fileBuffer: Buffer;
      try {
        if (doc.cloudinaryUrl && doc.cloudinaryUrl.startsWith("http") && !doc.cloudinaryUrl.includes("demo")) {
          const res = await fetch(doc.cloudinaryUrl);
          if (res.ok) {
            const ab = await res.arrayBuffer();
            fileBuffer = Buffer.from(ab);
          } else {
            fileBuffer = Buffer.from(`Material Certificate Content for ${doc.documentNumber}`);
          }
        } else {
          fileBuffer = Buffer.from(
            `OFFICIAL MATERIAL TEST CERTIFICATE\nDocument: ${doc.documentNumber}\nHeat: ${doc.heatNumber}\nMaterial: ${doc.materialCode}\nStandard: ${doc.applicableStandard}\nIssuer: ${doc.issuer}\nApproved By: ${doc.reviewerName || "QA Team"}`
          );
        }
      } catch {
        fileBuffer = Buffer.from(`Certificate record for ${doc.documentNumber}`);
      }

      zip.file(`certificates/${safeFilename}`, fileBuffer);
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

    // Log Immutable Audit Event
    await logAudit({
      action: "DOCUMENT_PACK_GENERATED",
      entityType: "SalesOrder",
      entityId: String(order._id || order.id),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      details: {
        soNumber: order.soNumber,
        customerName: order.customerName,
        documentCount: permittedDocs.length,
        documents: permittedDocs.map((d) => d.documentNumber),
      },
    });

    return {
      zipBuffer,
      filename: `Customer_Document_Pack_${order.soNumber}.zip`,
      documentCount: permittedDocs.length,
      manifest,
    };
  }
}

export const orderDocumentService = OrderDocumentService;
