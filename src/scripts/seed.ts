/**
 * Oil & Gas Sales Hub - Initial Seed Setup Script
 * Module 5: Material Certification & Document Management
 */

import { connectToDatabase } from "../lib/db";
import {
  UserModel,
  CustomerModel,
  CustomerContactModel,
  ProductModel,
  MaterialModel,
  MaterialBatchModel,
  SupplierModel,
  PurchaseOrderModel,
  SalesOrderModel,
  DocumentModel,
  DocumentVersionModel,
  DocumentReviewModel,
  DocumentRequirementModel,
  OrderDocumentRequirementModel,
  EnquiryModel,
  SupplierQuoteModel,
  QuotationModel,
  SettingsModel,
  CounterModel,
} from "../models";
import bcrypt from "bcryptjs";
import {
  SEED_MATERIALS,
  SEED_BATCHES,
  SEED_PURCHASE_ORDERS,
  SEED_SALES_ORDERS,
  SEED_DOCUMENTS,
  SEED_REQUIREMENT_RULES,
  SEED_ORDER_REQUIREMENTS,
} from "../lib/seed-data";

async function runSeed() {
  console.log("==========================================");
  console.log("Oil & Gas Sales Hub - Starting Database Seed");
  console.log("==========================================");

  const conn = await connectToDatabase();
  if (!conn) {
    console.log("[Notice] MongoDB Atlas is not currently running. In-memory fallback will serve requests seamlessly.");
    return;
  }

  console.log("[MongoDB] Connected to database. Initializing collections...");

  // 1. Initial Users (All 4 RBAC roles)
  const adminHash = await bcrypt.hash("AdminPass2026!", 10);
  const sales1Hash = await bcrypt.hash("Sales1Pass2026!", 10);
  const sales2Hash = await bcrypt.hash("Sales2Pass2026!", 10);
  const qaHash = await bcrypt.hash("QualityPass2026!", 10);
  const mgmtHash = await bcrypt.hash("MgmtPass2026!", 10);

  await UserModel.deleteMany({});
  const adminUser = await UserModel.create({
    name: "Marcus Vance",
    email: "admin@oilgashub.com",
    passwordHash: adminHash,
    role: "admin",
    isActive: true,
    mustChangePassword: false,
  });

  const sales1User = await UserModel.create({
    name: "Sarah Jenkins",
    email: "sales1@oilgashub.com",
    passwordHash: sales1Hash,
    role: "salesperson",
    isActive: true,
    mustChangePassword: false,
  });

  const sales2User = await UserModel.create({
    name: "Tariq Al-Mansoor",
    email: "sales2@oilgashub.com",
    passwordHash: sales2Hash,
    role: "salesperson",
    isActive: true,
    mustChangePassword: false,
  });

  const qaUser = await UserModel.create({
    name: "Elena Rostova",
    email: "qa@oilgashub.com",
    passwordHash: qaHash,
    role: "quality_reviewer",
    isActive: true,
    mustChangePassword: false,
  });

  const mgmtUser = await UserModel.create({
    name: "David Sterling",
    email: "mgmt@oilgashub.com",
    passwordHash: mgmtHash,
    role: "management",
    isActive: true,
    mustChangePassword: false,
  });

  console.log(`[Seed] 5 Accounts initialized: Admin, Sales 1 & 2, Quality Lead, Management`);

  // 2. Settings
  await SettingsModel.deleteMany({});
  await SettingsModel.create({
    companyName: "Apex Oilfield & Gas Equipment FZE",
    companyAddress: "Plot 42, Jebel Ali Free Zone South, Dubai, UAE",
    companyPhone: "+971 4 881 0000",
    companyEmail: "sales@apexoilfield.com",
    companyTaxNumber: "TRN-100492817200003",
    companyWebsite: "www.apexoilfield.com",
    defaultCurrency: "USD",
    enquiryPrefix: "ENQ",
    quotationPrefix: "QT",
    minMarginApprovalThreshold: 15.0,
    requireApprovalBelowThreshold: true,
    defaultTaxRate: 5.0,
    defaultQuotationValidityDays: 30,
  });

  // 3. Customers
  await CustomerModel.deleteMany({});
  const custAramco = await CustomerModel.create({
    customerCode: "CUST-SA-001",
    name: "Aramco Upstream Operations",
    industry: "Oil & Gas Upstream",
    country: "Saudi Arabia",
    city: "Dhahran",
    address: "North Park Complex, Dhahran 31311",
    taxNumber: "VAT-300029182300003",
    paymentTerms: "Net 60 Days",
    creditLimit: 5000000,
    currency: "USD",
    notes: "Tier 1 National Oil Company. Strict API 6D and NACE MR0175 compliance required.",
    isActive: true,
  });

  const custAdnoc = await CustomerModel.create({
    customerCode: "CUST-AE-002",
    name: "ADNOC Offshore Logistics",
    industry: "Offshore Exploration",
    country: "United Arab Emirates",
    city: "Abu Dhabi",
    address: "Corniche Road, Sector W-10, Abu Dhabi",
    taxNumber: "TRN-100348271900003",
    paymentTerms: "Net 45 Days",
    creditLimit: 3000000,
    currency: "USD",
    notes: "Sour gas service specialists. High nickel alloy valves and fittings priority.",
    isActive: true,
  });

  // 4. Suppliers
  await SupplierModel.deleteMany({});
  const supValvitalia = await SupplierModel.create({
    supplierCode: "SUP-IT-001",
    name: "Valvitalia S.p.A.",
    country: "Italy",
    rating: 5,
    paymentTerms: "Net 60 Days",
    contactName: "Marco Rossi",
    email: "m.rossi@valvitalia-group.com",
    phone: "+39 0382 6171",
    leadTimeAverageDays: 28,
    notes: "Top European API 6D valve manufacturer with Aramco and ADNOC qualification approvals.",
    isActive: true,
  });

  const supNippon = await SupplierModel.create({
    supplierCode: "SUP-JP-002",
    name: "Nippon Steel Corporation",
    country: "Japan",
    rating: 5,
    paymentTerms: "LC at Sight",
    contactName: "Kenji Sato",
    email: "k.sato@nipponsteel.co.jp",
    phone: "+81 3 6867 4111",
    leadTimeAverageDays: 35,
    notes: "Global premier manufacturer of seamless alloy and carbon steel line pipes.",
    isActive: true,
  });

  // 5. Materials
  await MaterialModel.deleteMany({});
  for (const m of SEED_MATERIALS) {
    await MaterialModel.create({
      materialCode: m.materialCode,
      name: m.name,
      category: m.category,
      materialGrade: m.materialGrade,
      applicableStandard: m.applicableStandard,
      size: m.size,
      schedule: m.schedule || "",
      pressureClass: m.pressureClass || "",
      specifications: m.specifications || {},
      description: m.description,
      isActive: true,
    });
  }

  // 6. Batches
  await MaterialBatchModel.deleteMany({});
  for (const b of SEED_BATCHES) {
    await MaterialBatchModel.create({
      batchNumber: b.batchNumber,
      heatNumber: b.heatNumber,
      materialId: adminUser._id, // placeholder
      materialCode: b.materialCode,
      materialName: b.materialName,
      materialGrade: b.materialGrade,
      supplierId: supNippon._id,
      supplierName: b.supplierName,
      poNumber: b.poNumber || "",
      quantity: b.quantity,
      unit: b.unit,
      millName: b.millName,
      countryOfOrigin: b.countryOfOrigin,
      productionDate: b.productionDate,
      inspectionStatus: b.inspectionStatus as any,
      assignedCertificates: [],
      notes: b.notes,
    });
  }

  // 7. Purchase Orders
  await PurchaseOrderModel.deleteMany({});
  for (const po of SEED_PURCHASE_ORDERS) {
    await PurchaseOrderModel.create({
      poNumber: po.poNumber,
      supplierId: supValvitalia._id,
      supplierName: po.supplierName,
      orderDate: po.orderDate,
      expectedDeliveryDate: po.expectedDeliveryDate,
      status: po.status,
      totalAmount: po.totalAmount,
      currency: po.currency,
      items: po.items.map((i: any) => ({
        materialId: adminUser._id,
        materialCode: i.materialCode,
        materialName: i.materialName,
        quantity: i.quantity,
        unit: i.unit,
        unitPrice: i.unitPrice,
        heatNumbers: i.heatNumbers,
        batchIds: [],
        receivedQuantity: i.receivedQuantity,
      })),
      notes: po.notes,
    });
  }

  // 8. Sales Orders
  await SalesOrderModel.deleteMany({});
  for (const so of SEED_SALES_ORDERS) {
    await SalesOrderModel.create({
      soNumber: so.soNumber,
      customerId: custAramco._id,
      customerName: so.customerName,
      orderDate: so.orderDate,
      requestedDeliveryDate: so.requestedDeliveryDate,
      deliveryTerms: so.deliveryTerms,
      status: so.status,
      dispatchReady: so.dispatchReady,
      dispatchBlockReason: so.dispatchBlockReason,
      totalAmount: so.totalAmount,
      currency: so.currency,
      items: so.items.map((i: any) => ({
        materialId: adminUser._id,
        materialCode: i.materialCode,
        materialName: i.materialName,
        batchNumber: i.batchNumber,
        heatNumber: i.heatNumber,
        quantity: i.quantity,
        unit: i.unit,
        unitPrice: i.unitPrice,
      })),
      deliveries: so.deliveries,
      notes: so.notes,
    });
  }

  // 9. Document Requirements
  await DocumentRequirementModel.deleteMany({});
  for (const r of SEED_REQUIREMENT_RULES) {
    await DocumentRequirementModel.create({
      ruleName: r.ruleName,
      materialCategory: r.materialCategory,
      materialGrade: r.materialGrade,
      documentType: r.documentType,
      isMandatory: r.isMandatory,
      validityDays: r.validityDays,
      blocksDispatch: r.blocksDispatch,
      description: r.description,
      isActive: true,
    });
  }

  // 10. Documents, Versions, and Reviews
  await DocumentModel.deleteMany({});
  await DocumentVersionModel.deleteMany({});
  await DocumentReviewModel.deleteMany({});

  for (const doc of SEED_DOCUMENTS) {
    const createdDoc = await DocumentModel.create({
      documentNumber: doc.documentNumber,
      title: doc.title,
      documentType: doc.documentType,
      cloudinaryAssetId: doc.cloudinaryAssetId,
      cloudinaryPublicId: doc.cloudinaryPublicId,
      cloudinaryUrl: doc.cloudinaryUrl,
      format: doc.format,
      fileSize: doc.fileSize,
      issuer: doc.issuer,
      issueDate: doc.issueDate,
      expiryDate: doc.expiryDate,
      revision: doc.revision,
      description: doc.description,
      materialCode: doc.materialCode || "",
      materialName: doc.materialName || "",
      materialGrade: doc.materialGrade || "",
      heatNumber: doc.heatNumber || "",
      batchNumber: doc.batchNumber || "",
      supplierName: doc.supplierName || "",
      poNumber: doc.poNumber || "",
      customerName: doc.customerName || "",
      soNumber: doc.soNumber || "",
      visibilityClassification: doc.visibilityClassification,
      approvalStatus: doc.approvalStatus,
      uploaderId: adminUser._id,
      uploaderName: doc.uploaderName,
      reviewerId: doc.reviewerName ? qaUser._id : null,
      reviewerName: doc.reviewerName || "",
      reviewedAt: doc.reviewedAt || null,
      rejectionReason: doc.rejectionReason || "",
      versionNumber: doc.versionNumber || 1,
      isArchived: false,
    });

    // Create Initial Version 1
    await DocumentVersionModel.create({
      documentId: createdDoc._id,
      versionNumber: 1,
      revision: doc.revision || "0",
      cloudinaryAssetId: doc.cloudinaryAssetId || "",
      cloudinaryPublicId: doc.cloudinaryPublicId,
      cloudinaryUrl: doc.cloudinaryUrl,
      format: doc.format || "pdf",
      fileSize: doc.fileSize,
      changeReason: "Initial upload and registration",
      uploadedBy: adminUser._id,
      uploadedByName: doc.uploaderName || "Admin",
      metadataSnapshot: {
        title: doc.title,
        documentType: doc.documentType,
        materialCode: doc.materialCode,
        heatNumber: doc.heatNumber,
      },
      createdAt: doc.createdAt || new Date(),
    });

    // Create Review Record if reviewed
    if (doc.reviewerName || doc.approvalStatus === "approved" || doc.approvalStatus === "rejected") {
      await DocumentReviewModel.create({
        documentId: createdDoc._id,
        versionNumber: 1,
        reviewerId: qaUser._id,
        reviewerName: doc.reviewerName || qaUser.name,
        reviewerRole: "quality_reviewer",
        decision: doc.approvalStatus === "rejected" ? "rejected" : "approved",
        comments: doc.rejectionReason || "Compliance standard verified.",
        checklistVerifications: [{ item: "Standard compliance verified", verified: true }],
        reviewedAt: doc.reviewedAt || new Date(),
      });
    }
  }

  // 11. Order Document Requirements
  await OrderDocumentRequirementModel.deleteMany({});
  for (const req of SEED_ORDER_REQUIREMENTS) {
    await OrderDocumentRequirementModel.create({
      orderType: req.orderType,
      orderId: req.orderId,
      orderNumber: req.orderNumber,
      materialCode: req.materialCode || "",
      documentType: req.documentType,
      isMandatory: req.isMandatory !== false,
      status: req.status,
      linkedDocumentId: req.linkedDocumentId,
      responsibleUserId: qaUser._id,
      responsibleUserName: req.responsibleUserName || "Elena Rostova",
      notes: req.notes || "",
    });
  }

  // 12. Counters
  await CounterModel.deleteMany({});
  await CounterModel.create({ _id: `enquiry-${new Date().getFullYear()}`, seq: 1 });
  await CounterModel.create({ _id: `quotation-${new Date().getFullYear()}`, seq: 1 });
  await CounterModel.create({ _id: `document-${new Date().getFullYear()}`, seq: 8 });

  console.log("==========================================");
  console.log("Database Seed Finished Successfully!");
  console.log("==========================================");
  process.exit(0);
}

runSeed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
