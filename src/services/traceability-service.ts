import { connectToDatabase, isDbConnected } from "@/lib/db";
import {
  MaterialModel,
  MaterialBatchModel,
  PurchaseOrderModel,
  SalesOrderModel,
  DocumentModel,
  SupplierModel,
  CustomerModel,
} from "@/models";
import {
  memoryMaterials,
  memoryMaterialBatches,
  memoryDocuments,
  memoryPurchaseOrders,
  memorySalesOrders,
} from "./document-service";
import { UserContext, PERMISSIONS } from "@/lib/permissions";
import { Types } from "mongoose";

export interface TraceabilityResult {
  searchQuery: string;
  matchedBatch?: any;
  material?: any;
  batch?: any;
  supplier?: any;
  purchaseOrder?: any;
  certificates: any[];
  salesOrders: any[];
  deliveries: any[];
  dispatchReady: boolean;
  verificationReport: {
    isFullyCertified: boolean;
    hasRejectedCertificates: boolean;
    pendingReviewsCount: number;
    approvedCertificatesCount: number;
    totalCertificatesCount: number;
  };
}

export const traceabilityService = {
  /**
   * Search for material traceability records across batches, materials, orders, and certificates
   */
  async searchTraceability(query: string, user: UserContext): Promise<TraceabilityResult[]> {
    if (!query || !query.trim()) return [];
    await connectToDatabase();

    const term = query.trim();
    const regex = new RegExp(term, "i");
    const isConnected = isDbConnected();

    let matchedBatches: any[] = [];

    if (isConnected) {
      // Find batches matching heatNumber, batchNumber, or materialCode
      matchedBatches = await MaterialBatchModel.find({
        $or: [
          { heatNumber: regex },
          { batchNumber: regex },
          { materialCode: regex },
          { supplierName: regex },
          { poNumber: regex },
        ],
      }).lean();

      // If no batches matched directly, check if a SalesOrder matched
      if (matchedBatches.length === 0) {
        const matchingSO = await SalesOrderModel.find({
          $or: [{ soNumber: regex }, { customerName: regex }],
        }).lean();

        for (const so of matchingSO) {
          for (const item of so.items) {
            if (item.batchId) {
              const b = await MaterialBatchModel.findById(item.batchId).lean();
              if (b && !matchedBatches.some((x) => String(x._id) === String(b._id))) {
                matchedBatches.push(b);
              }
            } else if (item.heatNumber) {
              const bList = await MaterialBatchModel.find({ heatNumber: item.heatNumber }).lean();
              bList.forEach((b) => {
                if (!matchedBatches.some((x) => String(x._id) === String(b._id))) {
                  matchedBatches.push(b);
                }
              });
            }
          }
        }
      }
    } else {
      matchedBatches = memoryMaterialBatches.filter(
        (b) =>
          b.heatNumber?.toLowerCase().includes(term.toLowerCase()) ||
          b.batchNumber?.toLowerCase().includes(term.toLowerCase()) ||
          b.materialCode?.toLowerCase().includes(term.toLowerCase()) ||
          b.supplierName?.toLowerCase().includes(term.toLowerCase()) ||
          b.poNumber?.toLowerCase().includes(term.toLowerCase())
      );
    }

    const results: TraceabilityResult[] = [];

    for (const batch of matchedBatches) {
      const batchId = String(batch._id || batch.id);

      // 1. Fetch Material details
      let material: any = null;
      if (isConnected) {
        if (batch.materialId) {
          material = await MaterialModel.findById(batch.materialId).lean();
        }
        if (!material && batch.materialCode) {
          material = await MaterialModel.findOne({ materialCode: batch.materialCode }).lean();
        }
      } else {
        material =
          memoryMaterials.find(
            (m) =>
              String(m._id) === String(batch.materialId) ||
              m.materialCode === batch.materialCode
          ) || null;
      }

      // 2. Fetch Supplier details
      let supplier: any = null;
      if (isConnected) {
        if (batch.supplierId) {
          supplier = await SupplierModel.findById(batch.supplierId).lean();
        }
      }

      // 3. Fetch Purchase Order details
      let purchaseOrder: any = null;
      if (isConnected) {
        if (batch.purchaseOrderId) {
          purchaseOrder = await PurchaseOrderModel.findById(batch.purchaseOrderId).lean();
        } else if (batch.poNumber) {
          purchaseOrder = await PurchaseOrderModel.findOne({ poNumber: batch.poNumber }).lean();
        }
      } else {
        purchaseOrder =
          memoryPurchaseOrders.find(
            (p) =>
              String(p._id) === String(batch.purchaseOrderId) ||
              p.poNumber === batch.poNumber
          ) || null;
      }

      // 4. Fetch Associated Certificates (Requires EXPLICIT linking to batch or heatNumber, not just title!)
      let certificates: any[] = [];
      if (isConnected) {
        const certQuery: any = {
          isArchived: { $ne: true },
          $or: [
            { batchId: batch._id },
            { batchNumber: batch.batchNumber },
            { heatNumber: batch.heatNumber },
          ],
        };

        // Filter permissions: Salesperson cannot see confidential supplier documents
        if (user.role === "salesperson") {
          certQuery.visibilityClassification = { $in: ["internal_only", "customer_shareable"] };
        }

        certificates = await DocumentModel.find(certQuery).sort({ createdAt: -1 }).lean();
      } else {
        certificates = memoryDocuments.filter((d) => {
          const matches =
            String(d.batchId) === batchId ||
            d.batchNumber === batch.batchNumber ||
            d.heatNumber === batch.heatNumber;
          if (!matches || d.isArchived) return false;
          if (user.role === "salesperson") {
            return ["internal_only", "customer_shareable"].includes(d.visibilityClassification);
          }
          return true;
        });
      }

      // 5. Fetch Linked Sales Orders and Customers
      let salesOrders: any[] = [];
      let deliveries: any[] = [];

      if (isConnected) {
        salesOrders = await SalesOrderModel.find({
          $or: [
            { "items.batchId": batch._id },
            { "items.heatNumber": batch.heatNumber },
            { "items.batchNumber": batch.batchNumber },
          ],
        }).lean();
      } else {
        salesOrders = memorySalesOrders.filter((so) =>
          so.items?.some(
            (item: any) =>
              String(item.batchId) === batchId ||
              item.heatNumber === batch.heatNumber ||
              item.batchNumber === batch.batchNumber
          )
        );
      }

      salesOrders.forEach((so) => {
        if (so.deliveries && Array.isArray(so.deliveries)) {
          so.deliveries.forEach((d: any) => {
            deliveries.push({
              ...d,
              soNumber: so.soNumber,
              customerName: so.customerName,
            });
          });
        }
      });

      // Verification statistics
      const approvedCount = certificates.filter((c) => c.approvalStatus === "approved").length;
      const pendingCount = certificates.filter((c) => c.approvalStatus === "pending_review").length;
      const rejectedCount = certificates.filter((c) => c.approvalStatus === "rejected").length;
      const isFullyCertified = approvedCount > 0 && rejectedCount === 0 && pendingCount === 0;

      results.push({
        searchQuery: term,
        matchedBatch: batch,
        material: material || {
          materialCode: batch.materialCode,
          name: batch.materialName,
          materialGrade: batch.materialGrade,
          applicableStandard: "N/A",
          category: "Pipes & Tubes",
        },
        batch,
        supplier: supplier || {
          name: batch.supplierName || "Approved Manufacturer",
          country: batch.countryOfOrigin || "Global",
        },
        purchaseOrder: purchaseOrder || {
          poNumber: batch.poNumber || "PO-REF-PENDING",
          orderDate: batch.productionDate || new Date(),
        },
        certificates,
        salesOrders,
        deliveries,
        dispatchReady: isFullyCertified && salesOrders.every((s) => s.dispatchReady !== false),
        verificationReport: {
          isFullyCertified,
          hasRejectedCertificates: rejectedCount > 0,
          pendingReviewsCount: pendingCount,
          approvedCertificatesCount: approvedCount,
          totalCertificatesCount: certificates.length,
        },
      });
    }

    return results;
  },
};
