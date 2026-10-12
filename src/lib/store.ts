/**
 * Oil & Gas Sales Hub - Central Data Store & Service Layer
 * 
 * Features:
 * 1. Works with MongoDB Atlas via Mongoose models when connected.
 * 2. Provides deterministic in-memory storage fallback for offline development & tests.
 * 3. Enforces STRICT FIELD-LEVEL ISOLATION:
 *    - Salespeople NEVER receive supplier purchase prices, landed costs, profit margins,
 *      or confidential supplier quote records.
 *    - Handled at query and projection layer.
 */

import { connectToDatabase, isDbConnected } from "./db";
import {
  UserModel,
  CustomerModel,
  CustomerContactModel,
  ProductModel,
  SupplierModel,
  EnquiryModel,
  SupplierQuoteModel,
  QuotationModel,
  FollowUpModel,
  DocumentModel,
  AuditLogModel,
  SettingsModel,
  CounterModel,
} from "@/models";
import { calculateLandedCost, calculateProfitAndMargin, calculateQuotationTotals } from "./pricing";
import { getNextEnquiryNumber, getNextQuotationNumber } from "./sequence";
import bcrypt from "bcryptjs";

// ==========================================
// In-Memory Fallback State (Pre-populated)
// ==========================================

export interface MemoryDb {
  users: any[];
  customers: any[];
  contacts: any[];
  products: any[];
  suppliers: any[];
  enquiries: any[];
  supplierQuotes: any[];
  quotations: any[];
  followUps: any[];
  documents: any[];
  auditLogs: any[];
  settings: any;
  counters: Record<string, number>;
}

// Initial default password hashes for seed:
// AdminPass2026!, Sales1Pass2026!, Sales2Pass2026!
const ADMIN_HASH = bcrypt.hashSync("AdminPass2026!", 10);
const SALES1_HASH = bcrypt.hashSync("Sales1Pass2026!", 10);
const SALES2_HASH = bcrypt.hashSync("Sales2Pass2026!", 10);

export const memoryStore: MemoryDb = {
  users: [
    {
      _id: "usr_admin_01",
      id: "usr_admin_01",
      name: "Marcus Vance (Commercial Director)",
      email: "admin@oilgashub.com",
      passwordHash: ADMIN_HASH,
      role: "admin",
      isActive: true,
      mustChangePassword: false,
      createdAt: new Date("2026-01-01T08:00:00Z"),
    },
    {
      _id: "usr_sales_01",
      id: "usr_sales_01",
      name: "Sarah Jenkins (Senior Technical Sales)",
      email: "sales1@oilgashub.com",
      passwordHash: SALES1_HASH,
      role: "salesperson",
      isActive: true,
      mustChangePassword: false,
      createdAt: new Date("2026-01-02T08:00:00Z"),
    },
    {
      _id: "usr_sales_02",
      id: "usr_sales_02",
      name: "Tariq Al-Mansoor (Key Account Manager)",
      email: "sales2@oilgashub.com",
      passwordHash: SALES2_HASH,
      role: "salesperson",
      isActive: true,
      mustChangePassword: false,
      createdAt: new Date("2026-01-02T08:00:00Z"),
    },
  ],
  customers: [
    {
      _id: "cust_01",
      id: "cust_01",
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
      createdAt: new Date("2026-01-05T10:00:00Z"),
    },
    {
      _id: "cust_02",
      id: "cust_02",
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
      createdAt: new Date("2026-01-08T11:00:00Z"),
    },
    {
      _id: "cust_03",
      id: "cust_03",
      customerCode: "CUST-QA-003",
      name: "QatarEnergy LNG Operations",
      industry: "LNG Liquefaction & Export",
      country: "Qatar",
      city: "Ras Laffan",
      address: "Ras Laffan Industrial City, Zone 4",
      taxNumber: "QTR-99281720",
      paymentTerms: "Net 30 Days",
      creditLimit: 4000000,
      currency: "USD",
      notes: "Cryogenic valve and duplex stainless pipe requirements for LNG expansion trains.",
      isActive: true,
      createdAt: new Date("2026-01-12T09:30:00Z"),
    },
  ],
  contacts: [
    {
      _id: "cont_01",
      id: "cont_01",
      customerId: "cust_01",
      name: "Eng. Fahad Al-Ghamdi",
      designation: "Senior Piping Procurement Specialist",
      email: "f.ghamdi@aramco-ops.sa",
      phone: "+966 13 874 4421",
      isPrimary: true,
      createdAt: new Date("2026-01-05T10:15:00Z"),
    },
    {
      _id: "cont_02",
      id: "cont_02",
      customerId: "cust_02",
      name: "Mariam Al-Zaabi",
      designation: "Lead Contracts & Procurement Manager",
      email: "m.alzaabi@adnoc-offshore.ae",
      phone: "+971 2 602 3390",
      isPrimary: true,
      createdAt: new Date("2026-01-08T11:20:00Z"),
    },
    {
      _id: "cont_03",
      id: "cont_03",
      customerId: "cust_03",
      name: "Khalid Al-Marri",
      designation: "Head of Mechanical Supplies",
      email: "k.marri@qatarenergy-lng.qa",
      phone: "+974 4473 1180",
      isPrimary: true,
      createdAt: new Date("2026-01-12T09:45:00Z"),
    },
  ],
  products: [
    {
      _id: "prod_01",
      id: "prod_01",
      sku: "VLV-TB-6-600-WCB",
      name: "Trunnion Ball Valve 6\" Class 600 RF",
      category: "Valves",
      materialGrade: "ASTM A216 WCB / SS316 Trim",
      standard: "API 6D / ASME B16.34",
      size: "6 inch (DN 150)",
      pressureClass: "Class 600",
      connectionType: "RF Flanged",
      unitOfMeasure: "EA",
      description: "Full bore trunnion mounted ball valve with fire-safe API 607 graphite seals, NACE MR0175 compliant.",
      listPrice: 4200.0,
      currency: "USD",
      specifications: {
        Bore: "Full Bore",
        Operation: "Gear Operated",
        NACE: "MR0175 / ISO 15156",
        FireSafe: "API 607 7th Ed",
      },
      isActive: true,
    },
    {
      _id: "prod_02",
      id: "prod_02",
      sku: "VLV-GT-4-300-316",
      name: "Wedge Gate Valve 4\" Class 300 RF",
      category: "Valves",
      materialGrade: "ASTM A351 CF8M (SS316)",
      standard: "API 600 / ASME B16.34",
      size: "4 inch (DN 100)",
      pressureClass: "Class 300",
      connectionType: "RF Flanged",
      unitOfMeasure: "EA",
      description: "Outside screw and yoke (OS&Y) bolted bonnet gate valve for corrosive chemical and hydrocarbon duty.",
      listPrice: 2850.0,
      currency: "USD",
      specifications: {
        Bonnet: "Bolted Bonnet",
        Stem: "Rising Stem OS&Y",
        Trim: "API Trim 10",
      },
      isActive: true,
    },
    {
      _id: "prod_03",
      id: "prod_03",
      sku: "PIP-SMLS-8-SCH80-X65",
      name: "Seamless Line Pipe 8\" SCH 80 PSL-2",
      category: "Pipes & Tubes",
      materialGrade: "API 5L Grade X65 PSL-2",
      standard: "API 5L / ASME B36.10M",
      size: "8 inch (DN 200)",
      pressureClass: "SCH 80 (12.7mm WT)",
      connectionType: "Butt Weld",
      unitOfMeasure: "MTR",
      description: "High-yield carbon steel seamless line pipe for sour oil and high-pressure wet gas transmission pipelines.",
      listPrice: 165.0,
      currency: "USD",
      specifications: {
        Manufacturing: "Hot Rolled Seamless",
        Testing: "100% NDT UT & Hydrostatic",
        Coating: "3LPE External Fusion Bonded",
      },
      isActive: true,
    },
    {
      _id: "prod_04",
      id: "prod_04",
      sku: "FLG-WN-10-900-RTJ-F22",
      name: "Weld Neck Flange 10\" Class 900 RTJ",
      category: "Flanges",
      materialGrade: "ASTM A182 F22 Class 3",
      standard: "ASME B16.5",
      size: "10 inch (DN 250)",
      pressureClass: "Class 900",
      connectionType: "RTJ Flanged",
      unitOfMeasure: "EA",
      description: "Alloy steel high temperature high pressure weld neck flange with ring joint facing groove.",
      listPrice: 940.0,
      currency: "USD",
      specifications: {
        RingGroove: "Octagonal Ring R-53",
        BoreMatch: "SCH 120",
      },
      isActive: true,
    },
  ],
  suppliers: [
    {
      _id: "sup_01",
      id: "sup_01",
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
    },
    {
      _id: "sup_02",
      id: "sup_02",
      supplierCode: "SUP-KR-002",
      name: "SeAH Steel Corporation",
      country: "South Korea",
      rating: 4,
      paymentTerms: "LC at 90 Days",
      contactName: "Jin-Woo Park",
      email: "jw.park@seahsteel.co.kr",
      phone: "+82 2 6970 0114",
      leadTimeAverageDays: 35,
      notes: "Leading API 5L line pipe mill. Fast delivery for heavy wall seamless schedules.",
      isActive: true,
    },
    {
      _id: "sup_03",
      id: "sup_03",
      supplierCode: "SUP-DE-003",
      name: "KITZ Armaturen GmbH",
      country: "Germany",
      rating: 5,
      paymentTerms: "Net 30 Days",
      contactName: "Hans Weber",
      email: "h.weber@kitz-europe.de",
      phone: "+49 211 4155 0",
      leadTimeAverageDays: 21,
      notes: "High reliability industrial gate, globe, and check valves in duplex and exotic alloys.",
      isActive: true,
    },
  ],
  enquiries: [
    {
      _id: "enq_01",
      id: "enq_01",
      enquiryNumber: "ENQ-2026-0001",
      customerId: "cust_01",
      customerName: "Aramco Upstream Operations",
      contactId: "cont_01",
      contactName: "Eng. Fahad Al-Ghamdi",
      assignedTo: "usr_sales_01",
      assignedToName: "Sarah Jenkins (Senior Technical Sales)",
      createdBy: "usr_sales_01",
      createdByName: "Sarah Jenkins",
      currency: "USD",
      status: "quoted",
      priority: "high",
      nextFollowUpDate: new Date("2026-10-18T10:00:00Z"),
      targetPriceTotal: 42000.0,
      notes: "Urgent turnaround requested for Shaybah gas gathering manifold expansion.",
      items: [
        {
          _id: "item_01",
          productId: "prod_01",
          itemDescription: "Trunnion Ball Valve 6\" Class 600 RF, API 6D, A216 WCB body, SS316 trim, Fire-safe API 607",
          category: "Valves",
          materialGrade: "ASTM A216 WCB",
          standard: "API 6D",
          size: "6 inch",
          pressureClass: "Class 600",
          connectionType: "RF Flanged",
          quantity: 10,
          unitOfMeasure: "EA",
          customerTargetUnitPrice: 4200.0,
          customerTargetTotalPrice: 42000.0,
          notes: "Include 3.1 Mill Test Certificate and Hydro test chart.",
        },
      ],
      activities: [
        {
          _id: "act_01",
          action: "ENQUIRY_CREATED",
          performedBy: "usr_sales_01",
          performerName: "Sarah Jenkins",
          timestamp: new Date("2026-10-01T09:00:00Z"),
          notes: "RFQ received from client via procurement portal.",
        },
        {
          _id: "act_02",
          action: "SUPPLIER_PRICING_UPDATED",
          performedBy: "usr_admin_01",
          performerName: "Marcus Vance",
          timestamp: new Date("2026-10-02T14:30:00Z"),
          notes: "Obtained quote from Valvitalia S.p.A.",
        },
        {
          _id: "act_03",
          action: "QUOTATION_SENT",
          performedBy: "usr_sales_01",
          performerName: "Sarah Jenkins",
          timestamp: new Date("2026-10-04T11:00:00Z"),
          notes: "Quotation QT-2026-0001-R0 transmitted to Eng. Fahad Al-Ghamdi.",
        },
      ],
      createdAt: new Date("2026-10-01T09:00:00Z"),
      updatedAt: new Date("2026-10-04T11:00:00Z"),
    },
    {
      _id: "enq_02",
      id: "enq_02",
      enquiryNumber: "ENQ-2026-0002",
      customerId: "cust_02",
      customerName: "ADNOC Offshore Logistics",
      contactId: "cont_02",
      contactName: "Mariam Al-Zaabi",
      assignedTo: "usr_sales_02",
      assignedToName: "Tariq Al-Mansoor (Key Account Manager)",
      createdBy: "usr_sales_02",
      createdByName: "Tariq Al-Mansoor",
      currency: "USD",
      status: "supplier_pricing",
      priority: "urgent",
      nextFollowUpDate: new Date("2026-10-15T09:00:00Z"),
      targetPriceTotal: 28500.0,
      notes: "Das Island sour gas injection platform maintenance shutdown.",
      items: [
        {
          _id: "item_02",
          productId: "prod_02",
          itemDescription: "Wedge Gate Valve 4\" Class 300 RF, ASTM A351 CF8M (SS316), API 600, OS&Y",
          category: "Valves",
          materialGrade: "ASTM A351 CF8M",
          standard: "API 600",
          size: "4 inch",
          pressureClass: "Class 300",
          connectionType: "RF Flanged",
          quantity: 10,
          unitOfMeasure: "EA",
          customerTargetUnitPrice: 2850.0,
          customerTargetTotalPrice: 28500.0,
          notes: "Requires PMI and ferrite content verification.",
        },
      ],
      activities: [
        {
          _id: "act_04",
          action: "ENQUIRY_CREATED",
          performedBy: "usr_sales_02",
          performerName: "Tariq Al-Mansoor",
          timestamp: new Date("2026-10-05T08:30:00Z"),
          notes: "New enquiry registered from ADNOC Offshore shutdown committee.",
        },
      ],
      createdAt: new Date("2026-10-05T08:30:00Z"),
      updatedAt: new Date("2026-10-05T08:30:00Z"),
    },
  ],
  // STRICTLY CONFIDENTIAL SUPPLIER PRICING COLLECTION
  supplierQuotes: [
    {
      _id: "sq_01",
      id: "sq_01",
      enquiryId: "enq_01",
      enquiryItemId: "item_01",
      supplierId: "sup_01",
      supplierName: "Valvitalia S.p.A.",
      supplierReference: "RFQ-VALV-2026-881",
      quoteDate: new Date("2026-10-02T10:00:00Z"),
      validityDate: new Date("2026-11-02T10:00:00Z"),
      currency: "USD",
      unitPurchasePrice: 2850.0,
      quantity: 10,
      unitOfMeasure: "EA",
      allocatedFreight: 1200.0, // 120/ea
      allocatedCustomsDuties: 800.0, // 80/ea
      otherApplicableCosts: 500.0, // 50/ea
      calculatedUnitLandedCost: 3100.0, // 2850 + 120 + 80 + 50 = 3100.00
      calculatedTotalLandedCost: 31000.0,
      leadTimeWeeks: 4,
      paymentTerms: "Net 60 Days",
      isSelected: true,
      notes: "Ex-works Milan. Sea freight via Genoa port included in freight estimate.",
      createdBy: "usr_admin_01",
      createdAt: new Date("2026-10-02T14:30:00Z"),
    },
    {
      _id: "sq_02",
      id: "sq_02",
      enquiryId: "enq_01",
      enquiryItemId: "item_01",
      supplierId: "sup_03",
      supplierName: "KITZ Armaturen GmbH",
      supplierReference: "KITZ-DE-Q9941",
      quoteDate: new Date("2026-10-03T11:00:00Z"),
      validityDate: new Date("2026-11-03T11:00:00Z"),
      currency: "USD",
      unitPurchasePrice: 3200.0,
      quantity: 10,
      unitOfMeasure: "EA",
      allocatedFreight: 1500.0,
      allocatedCustomsDuties: 900.0,
      otherApplicableCosts: 400.0,
      calculatedUnitLandedCost: 3480.0,
      calculatedTotalLandedCost: 34800.0,
      leadTimeWeeks: 6,
      paymentTerms: "Net 30 Days",
      isSelected: false,
      notes: "Alternative German mill offer. Higher price and longer lead time.",
      createdBy: "usr_admin_01",
      createdAt: new Date("2026-10-03T15:00:00Z"),
    },
  ],
  quotations: [
    {
      _id: "quote_01",
      id: "quote_01",
      quotationNumber: "QT-2026-0001",
      revision: 0,
      quotationCode: "QT-2026-0001-R0",
      enquiryId: "enq_01",
      enquiryNumber: "ENQ-2026-0001",
      customerId: "cust_01",
      customerName: "Aramco Upstream Operations",
      contactId: "cont_01",
      contactName: "Eng. Fahad Al-Ghamdi",
      currency: "USD",
      status: "sent",
      approvalRequired: false,
      approvalStatus: "not_required",
      validityDate: new Date("2026-11-04T00:00:00Z"),
      deliveryTerms: "DDP Dhahran Yard (Incoterms 2020)",
      paymentTerms: "Net 60 Days from delivery",
      leadTime: "4-5 Weeks ARO",
      items: [
        {
          _id: "qitem_01",
          enquiryItemId: "item_01",
          productId: "prod_01",
          itemDescription: "Trunnion Ball Valve 6\" Class 600 RF, API 6D, A216 WCB body, SS316 trim, Fire-safe API 607",
          category: "Valves",
          materialGrade: "ASTM A216 WCB",
          standard: "API 6D",
          size: "6 inch",
          pressureClass: "Class 600",
          connectionType: "RF Flanged",
          quantity: 10,
          unitOfMeasure: "EA",
          unitSellingPrice: 4200.0,
          discountPercent: 0,
          lineSubtotal: 42000.0,
          lineDiscountAmount: 0,
          lineTotal: 42000.0,
          leadTime: "4 Weeks",
          notes: "Manufacturer: Valvitalia Italy. Complete with 3.1 MTC.",
        },
      ],
      subtotal: 42000.0,
      discountPercent: 0,
      discountAmount: 0,
      taxPercent: 5.0,
      taxAmount: 2100.0,
      totalAmount: 44100.0,
      notes: "Prices firm for 30 days. Subject to standard warranty terms 18 months from shipment or 12 months from installation.",
      createdBy: "usr_sales_01",
      createdByName: "Sarah Jenkins",
      createdAt: new Date("2026-10-04T10:30:00Z"),
      updatedAt: new Date("2026-10-04T11:00:00Z"),
    },
  ],
  followUps: [
    {
      _id: "fu_01",
      id: "fu_01",
      enquiryId: "enq_01",
      enquiryNumber: "ENQ-2026-0001",
      quotationId: "quote_01",
      quotationNumber: "QT-2026-0001-R0",
      customerId: "cust_01",
      customerName: "Aramco Upstream Operations",
      scheduledDate: new Date("2026-10-18T10:00:00Z"),
      status: "pending",
      type: "call",
      outcome: "pending",
      notes: "Follow up with Eng. Fahad regarding commercial review and technical evaluation.",
      assignedTo: "usr_sales_01",
      assignedToName: "Sarah Jenkins",
      createdBy: "usr_sales_01",
      createdAt: new Date("2026-10-04T11:15:00Z"),
    },
  ],
  documents: [
    {
      _id: "doc_01",
      id: "doc_01",
      fileName: "valvitalia-quote-881.pdf",
      originalName: "Supplier Quote Valvitalia RFQ 881.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 245000,
      cloudinaryPublicId: "oil_gas_hub/suppliers/valvitalia_881",
      cloudinaryUrl: "https://res.cloudinary.com/demo/image/upload/v1/oil_gas_hub/suppliers/valvitalia_881.pdf",
      resourceType: "raw",
      category: "supplier_quotation",
      accessLevel: "confidential_admin_only",
      relatedEntityType: "supplier_quote",
      relatedEntityId: "sq_01",
      uploadedBy: "usr_admin_01",
      uploadedByName: "Marcus Vance",
      createdAt: new Date("2026-10-02T14:35:00Z"),
    },
    {
      _id: "doc_02",
      id: "doc_02",
      fileName: "QT-2026-0001-R0.pdf",
      originalName: "Customer Quotation QT-2026-0001-R0.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 182000,
      cloudinaryPublicId: "oil_gas_hub/quotations/QT-2026-0001-R0",
      cloudinaryUrl: "https://res.cloudinary.com/demo/image/upload/v1/oil_gas_hub/quotations/QT-2026-0001-R0.pdf",
      resourceType: "raw",
      category: "customer_quotation_pdf",
      accessLevel: "public",
      relatedEntityType: "quotation",
      relatedEntityId: "quote_01",
      uploadedBy: "usr_sales_01",
      uploadedByName: "Sarah Jenkins",
      createdAt: new Date("2026-10-04T10:45:00Z"),
    },
  ],
  auditLogs: [
    {
      _id: "log_01",
      id: "log_01",
      action: "AUTH_LOGIN",
      entityType: "User",
      entityId: "usr_admin_01",
      userId: "usr_admin_01",
      userName: "Marcus Vance",
      userRole: "admin",
      details: { method: "credentials" },
      ipAddress: "192.168.1.100",
      createdAt: new Date("2026-10-01T08:00:00Z"),
    },
    {
      _id: "log_02",
      id: "log_02",
      action: "ENQUIRY_CREATED",
      entityType: "Enquiry",
      entityId: "enq_01",
      userId: "usr_sales_01",
      userName: "Sarah Jenkins",
      userRole: "salesperson",
      details: { enquiryNumber: "ENQ-2026-0001", customer: "Aramco Upstream Operations" },
      ipAddress: "192.168.1.102",
      createdAt: new Date("2026-10-01T09:00:00Z"),
    },
  ],
  settings: {
    _id: "sett_01",
    id: "sett_01",
    companyName: "Apex Oilfield & Gas Equipment FZE",
    companyAddress: "Plot 42, Jebel Ali Free Zone South, Dubai, United Arab Emirates",
    companyPhone: "+971 4 881 0000",
    companyEmail: "sales@apexoilfield.com",
    companyTaxNumber: "TRN-100492817200003",
    companyWebsite: "www.apexoilfield.com",
    defaultCurrency: "USD",
    enquiryPrefix: "ENQ",
    quotationPrefix: "QT",
    minMarginApprovalThreshold: 15.0, // 15%
    requireApprovalBelowThreshold: true,
    defaultTaxRate: 5.0,
    defaultQuotationValidityDays: 30,
    updatedAt: new Date("2026-01-01T08:00:00Z"),
  },
  counters: {
    "enquiry-2026": 2,
    "quotation-2026": 1,
  },
};

// Helper to generate IDs
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

// ==========================================
// Central Data Access Methods with Strict RBAC
// ==========================================

export const dbService = {
  // --- USERS ---
  async findUserByEmail(email: string) {
    if (isDbConnected()) {
      return UserModel.findOne({ email: email.toLowerCase() });
    }
    return memoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async findUserById(id: string) {
    if (isDbConnected()) {
      return UserModel.findById(id);
    }
    return memoryStore.users.find((u) => u._id === id || u.id === id) || null;
  },

  async listUsers() {
    if (isDbConnected()) {
      return UserModel.find({}, { passwordHash: 0 }).sort({ createdAt: -1 });
    }
    return memoryStore.users.map(({ passwordHash, ...rest }) => rest);
  },

  async createUser(userData: any) {
    const hashedPassword = await bcrypt.hash(userData.password || "Password2026!", 10);
    if (isDbConnected()) {
      return UserModel.create({
        ...userData,
        passwordHash: hashedPassword,
      });
    }
    const newUser = {
      _id: generateId("usr"),
      id: generateId("usr"),
      ...userData,
      passwordHash: hashedPassword,
      isActive: true,
      mustChangePassword: false,
      createdAt: new Date(),
    };
    memoryStore.users.push(newUser);
    const { passwordHash, ...safe } = newUser;
    return safe;
  },

  async updateUser(id: string, updates: any) {
    if (isDbConnected()) {
      return UserModel.findByIdAndUpdate(id, updates, { new: true });
    }
    const idx = memoryStore.users.findIndex((u) => u._id === id || u.id === id);
    if (idx !== -1) {
      if (updates.password) {
        updates.passwordHash = await bcrypt.hash(updates.password, 10);
        delete updates.password;
      }
      memoryStore.users[idx] = { ...memoryStore.users[idx], ...updates, updatedAt: new Date() };
      const { passwordHash, ...safe } = memoryStore.users[idx];
      return safe;
    }
    return null;
  },

  // --- CUSTOMERS & CONTACTS ---
  async listCustomers() {
    if (isDbConnected()) {
      return CustomerModel.find({ isActive: true }).sort({ name: 1 });
    }
    return memoryStore.customers.filter((c) => c.isActive);
  },

  async getCustomerById(id: string) {
    if (isDbConnected()) {
      const customer = await CustomerModel.findById(id);
      const contacts = await CustomerContactModel.find({ customerId: id });
      return { customer, contacts };
    }
    const customer = memoryStore.customers.find((c) => c._id === id || c.id === id) || null;
    const contacts = memoryStore.contacts.filter((ct) => ct.customerId === id);
    return { customer, contacts };
  },

  async createCustomer(data: any) {
    if (isDbConnected()) {
      return CustomerModel.create(data);
    }
    const newCustomer = {
      _id: generateId("cust"),
      id: generateId("cust"),
      ...data,
      isActive: true,
      createdAt: new Date(),
    };
    memoryStore.customers.push(newCustomer);
    return newCustomer;
  },

  async updateCustomer(id: string, data: any) {
    if (isDbConnected()) {
      return CustomerModel.findByIdAndUpdate(id, data, { new: true });
    }
    const idx = memoryStore.customers.findIndex((c) => c._id === id || c.id === id);
    if (idx !== -1) {
      memoryStore.customers[idx] = { ...memoryStore.customers[idx], ...data, updatedAt: new Date() };
      return memoryStore.customers[idx];
    }
    return null;
  },

  async createContact(data: any) {
    if (isDbConnected()) {
      return CustomerContactModel.create(data);
    }
    const newContact = {
      _id: generateId("cont"),
      id: generateId("cont"),
      ...data,
      createdAt: new Date(),
    };
    memoryStore.contacts.push(newContact);
    return newContact;
  },

  async listContacts() {
    if (isDbConnected()) {
      return CustomerContactModel.find();
    }
    return memoryStore.contacts;
  },

  // --- PRODUCTS ---
  async listProducts() {
    if (isDbConnected()) {
      return ProductModel.find({ isActive: true }).sort({ name: 1 });
    }
    return memoryStore.products.filter((p) => p.isActive);
  },

  async getProductById(id: string) {
    if (isDbConnected()) {
      return ProductModel.findById(id);
    }
    return memoryStore.products.find((p) => p._id === id || p.id === id) || null;
  },

  async createProduct(data: any) {
    if (isDbConnected()) {
      return ProductModel.create(data);
    }
    const newProd = {
      _id: generateId("prod"),
      id: generateId("prod"),
      ...data,
      isActive: true,
      createdAt: new Date(),
    };
    memoryStore.products.push(newProd);
    return newProd;
  },

  async updateProduct(id: string, data: any) {
    if (isDbConnected()) {
      return ProductModel.findByIdAndUpdate(id, data, { new: true });
    }
    const idx = memoryStore.products.findIndex((p) => p._id === id || p.id === id);
    if (idx !== -1) {
      memoryStore.products[idx] = { ...memoryStore.products[idx], ...data, updatedAt: new Date() };
      return memoryStore.products[idx];
    }
    return null;
  },

  // --- SUPPLIERS (Admin full manage, Salesperson directory view if allowed) ---
  async listSuppliers() {
    if (isDbConnected()) {
      return SupplierModel.find({ isActive: true }).sort({ name: 1 });
    }
    return memoryStore.suppliers.filter((s) => s.isActive);
  },

  async createSupplier(data: any) {
    if (isDbConnected()) {
      return SupplierModel.create(data);
    }
    const newSup = {
      _id: generateId("sup"),
      id: generateId("sup"),
      ...data,
      isActive: true,
      createdAt: new Date(),
    };
    memoryStore.suppliers.push(newSup);
    return newSup;
  },

  async updateSupplier(id: string, data: any) {
    if (isDbConnected()) {
      return SupplierModel.findByIdAndUpdate(id, data, { new: true });
    }
    const idx = memoryStore.suppliers.findIndex((s) => s._id === id || s.id === id);
    if (idx !== -1) {
      memoryStore.suppliers[idx] = { ...memoryStore.suppliers[idx], ...data, updatedAt: new Date() };
      return memoryStore.suppliers[idx];
    }
    return null;
  },

  // --- SUPPLIER QUOTES (STRICTLY ADMIN ONLY) ---
  async listSupplierQuotesForEnquiry(enquiryId: string, role: string) {
    // ENFORCE SERVER-SIDE RBAC GUARD
    if (role !== "admin") {
      throw new Error("FORBIDDEN: Salespeople are strictly prohibited from accessing supplier purchase quotes");
    }

    if (isDbConnected()) {
      return SupplierQuoteModel.find({ enquiryId }).sort({ createdAt: -1 });
    }
    return memoryStore.supplierQuotes.filter((sq) => sq.enquiryId === enquiryId);
  },

  async listAllSupplierQuotes(role: string) {
    if (role !== "admin") {
      throw new Error("FORBIDDEN: Salespeople are strictly prohibited from accessing supplier purchase costs");
    }
    if (isDbConnected()) {
      return SupplierQuoteModel.find().sort({ createdAt: -1 });
    }
    return memoryStore.supplierQuotes;
  },

  async createSupplierQuote(data: any, role: string) {
    if (role !== "admin") {
      throw new Error("FORBIDDEN: Only administrators can create supplier pricing records");
    }

    // Server-side calculation of landed cost
    const landedResult = calculateLandedCost({
      unitPurchasePrice: data.unitPurchasePrice,
      quantity: data.quantity,
      allocatedFreight: data.allocatedFreight || 0,
      allocatedCustomsAndDuties: data.allocatedCustomsDuties || 0,
      otherApplicableCosts: data.otherApplicableCosts || 0,
    });

    const quoteRecord = {
      ...data,
      calculatedUnitLandedCost: landedResult.unitLandedCost,
      calculatedTotalLandedCost: landedResult.totalLandedCost,
    };

    if (isDbConnected()) {
      return SupplierQuoteModel.create(quoteRecord);
    }
    const newSQ = {
      _id: generateId("sq"),
      id: generateId("sq"),
      ...quoteRecord,
      createdAt: new Date(),
    };
    memoryStore.supplierQuotes.push(newSQ);
    return newSQ;
  },

  async updateSupplierQuote(id: string, data: any, role: string) {
    if (role !== "admin") {
      throw new Error("FORBIDDEN: Only administrators can update supplier pricing records");
    }

    if (data.unitPurchasePrice !== undefined || data.allocatedFreight !== undefined) {
      const landedResult = calculateLandedCost({
        unitPurchasePrice: data.unitPurchasePrice,
        quantity: data.quantity,
        allocatedFreight: data.allocatedFreight || 0,
        allocatedCustomsAndDuties: data.allocatedCustomsDuties || 0,
        otherApplicableCosts: data.otherApplicableCosts || 0,
      });
      data.calculatedUnitLandedCost = landedResult.unitLandedCost;
      data.calculatedTotalLandedCost = landedResult.totalLandedCost;
    }

    if (isDbConnected()) {
      return SupplierQuoteModel.findByIdAndUpdate(id, data, { new: true });
    }
    const idx = memoryStore.supplierQuotes.findIndex((sq) => sq._id === id || sq.id === id);
    if (idx !== -1) {
      memoryStore.supplierQuotes[idx] = { ...memoryStore.supplierQuotes[idx], ...data, updatedAt: new Date() };
      return memoryStore.supplierQuotes[idx];
    }
    return null;
  },

  async deleteSupplierQuote(id: string, role: string) {
    if (role !== "admin") {
      throw new Error("FORBIDDEN: Only administrators can delete supplier pricing records");
    }
    if (isDbConnected()) {
      return SupplierQuoteModel.findByIdAndDelete(id);
    }
    const idx = memoryStore.supplierQuotes.findIndex((sq) => sq._id === id || sq.id === id);
    if (idx !== -1) {
      const deleted = memoryStore.supplierQuotes.splice(idx, 1);
      return deleted[0];
    }
    return null;
  },

  // --- ENQUIRIES (Shared Register with Concurrency-Safe Sequence & Duplicate Warning) ---
  async listEnquiries() {
    if (isDbConnected()) {
      return EnquiryModel.find().sort({ createdAt: -1 });
    }
    return memoryStore.enquiries;
  },

  async getEnquiryById(id: string) {
    if (isDbConnected()) {
      return EnquiryModel.findById(id);
    }
    return memoryStore.enquiries.find((e) => e._id === id || e.id === id) || null;
  },

  /**
   * Duplicate Enquiry Warning Detector
   * Checks if an existing active enquiry matches the customer or similar specifications
   */
  async checkDuplicateEnquiries(customerId: string, itemSpecs: Array<{ size?: string; materialGrade?: string; standard?: string }>) {
    let existingList: any[] = [];
    if (isDbConnected()) {
      existingList = await EnquiryModel.find({
        customerId,
        status: { $nin: ["won", "lost", "cancelled"] },
      });
    } else {
      existingList = memoryStore.enquiries.filter(
        (e) => (e.customerId === customerId || e.customerId?._id === customerId) &&
               !["won", "lost", "cancelled"].includes(e.status)
      );
    }

    if (existingList.length === 0) return { hasPotentialDuplicate: false, duplicates: [] };

    const matches: any[] = [];
    for (const enq of existingList) {
      let isMatch = false;
      for (const existingItem of enq.items || []) {
        for (const newItem of itemSpecs) {
          if (
            newItem.size &&
            existingItem.size &&
            newItem.size.toLowerCase() === existingItem.size.toLowerCase() &&
            newItem.materialGrade &&
            existingItem.materialGrade &&
            newItem.materialGrade.toLowerCase() === existingItem.materialGrade.toLowerCase()
          ) {
            isMatch = true;
            break;
          }
        }
        if (isMatch) break;
      }
      if (isMatch) {
        matches.push({
          enquiryNumber: enq.enquiryNumber,
          customerName: enq.customerName,
          status: enq.status,
          createdAt: enq.createdAt,
          assignedToName: enq.assignedToName,
        });
      }
    }

    return {
      hasPotentialDuplicate: matches.length > 0,
      duplicates: matches,
    };
  },

  async createEnquiry(data: any, currentUser: { id: string; name: string }) {
    // Generate next sequence number
    let enquiryNumber = "";
    if (isDbConnected()) {
      enquiryNumber = await getNextEnquiryNumber();
    } else {
      const year = new Date().getFullYear();
      const key = `enquiry-${year}`;
      memoryStore.counters[key] = (memoryStore.counters[key] || 0) + 1;
      const seqStr = String(memoryStore.counters[key]).padStart(4, "0");
      const prefix = memoryStore.settings.enquiryPrefix || "ENQ";
      enquiryNumber = `${prefix}-${year}-${seqStr}`;
    }

    // Calculate customer target price total
    const targetPriceTotal = (data.items || []).reduce((sum: number, it: any) => {
      const lineTarget = (it.quantity || 1) * (it.customerTargetUnitPrice || 0);
      return sum + lineTarget;
    }, 0);

    const initialActivity = {
      action: "ENQUIRY_CREATED",
      performedBy: currentUser.id,
      performerName: currentUser.name,
      timestamp: new Date(),
      notes: "Enquiry created in system",
    };

    const newEnquiryData = {
      ...data,
      enquiryNumber,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      targetPriceTotal,
      activities: [initialActivity],
    };

    if (isDbConnected()) {
      return EnquiryModel.create(newEnquiryData);
    }
    const createdEnq = {
      _id: generateId("enq"),
      id: generateId("enq"),
      ...newEnquiryData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.enquiries.push(createdEnq);
    return createdEnq;
  },

  async updateEnquiry(id: string, updates: any, currentUser: { id: string; name: string }) {
    const activityEntry = {
      action: updates.status ? `STATUS_UPDATED_TO_${updates.status.toUpperCase()}` : "ENQUIRY_UPDATED",
      performedBy: currentUser.id,
      performerName: currentUser.name,
      timestamp: new Date(),
      notes: updates.notes || `Updated by ${currentUser.name}`,
    };

    if (isDbConnected()) {
      return EnquiryModel.findByIdAndUpdate(
        id,
        {
          ...updates,
          $push: { activities: activityEntry },
        },
        { new: true }
      );
    }

    const idx = memoryStore.enquiries.findIndex((e) => e._id === id || e.id === id);
    if (idx !== -1) {
      const current = memoryStore.enquiries[idx];
      const updated = {
        ...current,
        ...updates,
        activities: [...(current.activities || []), activityEntry],
        updatedAt: new Date(),
      };
      memoryStore.enquiries[idx] = updated;
      return updated;
    }
    return null;
  },

  // --- QUOTATIONS & REVISIONS ---
  async listQuotations() {
    if (isDbConnected()) {
      return QuotationModel.find().sort({ createdAt: -1 });
    }
    return memoryStore.quotations;
  },

  async getQuotationById(id: string) {
    if (isDbConnected()) {
      return QuotationModel.findById(id);
    }
    return memoryStore.quotations.find((q) => q._id === id || q.id === id) || null;
  },

  async createQuotation(data: any, currentUser: { id: string; name: string }) {
    // Generate base quotation number
    let quotationNumber = "";
    if (isDbConnected()) {
      quotationNumber = await getNextQuotationNumber();
    } else {
      const year = new Date().getFullYear();
      const key = `quotation-${year}`;
      memoryStore.counters[key] = (memoryStore.counters[key] || 0) + 1;
      const seqStr = String(memoryStore.counters[key]).padStart(4, "0");
      const prefix = memoryStore.settings.quotationPrefix || "QT";
      quotationNumber = `${prefix}-${year}-${seqStr}`;
    }

    const revision = 0;
    const quotationCode = `${quotationNumber}-R${revision}`;

    // Validate server-side calculation totals
    const calcResult = calculateQuotationTotals({
      items: data.items.map((it: any) => ({
        quantity: it.quantity,
        unitPrice: it.unitSellingPrice,
        discountPercent: it.discountPercent || 0,
      })),
      overallDiscountPercent: data.discountPercent || 0,
      taxPercent: data.taxPercent || 0,
    });

    const quotationRecord = {
      ...data,
      quotationNumber,
      revision,
      quotationCode,
      subtotal: calcResult.subtotal,
      discountAmount: calcResult.discountAmount,
      taxAmount: calcResult.taxAmount,
      totalAmount: calcResult.totalAmount,
      items: data.items.map((it: any, index: number) => ({
        ...it,
        lineSubtotal: calcResult.itemsCalculated[index].lineSubtotal,
        lineDiscountAmount: calcResult.itemsCalculated[index].lineDiscountAmount,
        lineTotal: calcResult.itemsCalculated[index].lineTotal,
      })),
      status: "draft",
      approvalRequired: false,
      approvalStatus: "not_required",
      createdBy: currentUser.id,
      createdByName: currentUser.name,
    };

    if (isDbConnected()) {
      return QuotationModel.create(quotationRecord);
    }
    const createdQuote = {
      _id: generateId("quote"),
      id: generateId("quote"),
      ...quotationRecord,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.quotations.push(createdQuote);
    return createdQuote;
  },

  /**
   * Concurrency-Safe Quotation Revision Creator
   * Preserves sent quotation as immutable history, marks previous as 'revised',
   * and creates QT-XXXX-R(N+1).
   */
  async createQuotationRevision(parentQuotationId: string, revisionData: any, currentUser: { id: string; name: string }) {
    let parentQuote: any = null;
    if (isDbConnected()) {
      parentQuote = await QuotationModel.findById(parentQuotationId);
    } else {
      parentQuote = memoryStore.quotations.find((q) => q._id === parentQuotationId || q.id === parentQuotationId);
    }

    if (!parentQuote) {
      throw new Error("Parent quotation not found");
    }

    const newRevisionNumber = parentQuote.revision + 1;
    const newQuotationCode = `${parentQuote.quotationNumber}-R${newRevisionNumber}`;

    // Server-side calculation verification
    const calcResult = calculateQuotationTotals({
      items: revisionData.items.map((it: any) => ({
        quantity: it.quantity,
        unitPrice: it.unitSellingPrice,
        discountPercent: it.discountPercent || 0,
      })),
      overallDiscountPercent: revisionData.discountPercent || 0,
      taxPercent: revisionData.taxPercent || 0,
    });

    // Mark previous as revised
    if (isDbConnected()) {
      await QuotationModel.findByIdAndUpdate(parentQuotationId, { status: "revised" });
    } else {
      const idx = memoryStore.quotations.findIndex((q) => q._id === parentQuotationId || q.id === parentQuotationId);
      if (idx !== -1) {
        memoryStore.quotations[idx].status = "revised";
      }
    }

    const newRevisionRecord = {
      ...parentQuote.toObject ? parentQuote.toObject() : parentQuote,
      ...revisionData,
      revision: newRevisionNumber,
      quotationCode: newQuotationCode,
      status: "draft",
      subtotal: calcResult.subtotal,
      discountAmount: calcResult.discountAmount,
      taxAmount: calcResult.taxAmount,
      totalAmount: calcResult.totalAmount,
      items: revisionData.items.map((it: any, index: number) => ({
        ...it,
        lineSubtotal: calcResult.itemsCalculated[index].lineSubtotal,
        lineDiscountAmount: calcResult.itemsCalculated[index].lineDiscountAmount,
        lineTotal: calcResult.itemsCalculated[index].lineTotal,
      })),
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    delete newRevisionRecord._id;
    delete newRevisionRecord.id;

    if (isDbConnected()) {
      return QuotationModel.create(newRevisionRecord);
    }
    const createdRev = {
      _id: generateId("quote"),
      id: generateId("quote"),
      ...newRevisionRecord,
    };
    memoryStore.quotations.push(createdRev);
    return createdRev;
  },

  async updateQuotationStatus(id: string, status: string, approverUser?: { id: string; name: string }, rejectionReason?: string) {
    const updates: any = { status };
    if (status === "approved" && approverUser) {
      updates.approvalStatus = "approved";
      updates.approvedBy = approverUser.id;
      updates.approvedByName = approverUser.name;
    } else if (status === "rejected" && approverUser) {
      updates.approvalStatus = "rejected";
      updates.rejectionReason = rejectionReason || "Rejected by administrator";
    }

    if (isDbConnected()) {
      return QuotationModel.findByIdAndUpdate(id, updates, { new: true });
    }
    const idx = memoryStore.quotations.findIndex((q) => q._id === id || q.id === id);
    if (idx !== -1) {
      memoryStore.quotations[idx] = { ...memoryStore.quotations[idx], ...updates, updatedAt: new Date() };
      return memoryStore.quotations[idx];
    }
    return null;
  },

  // --- FOLLOW-UPS ---
  async listFollowUps() {
    if (isDbConnected()) {
      return FollowUpModel.find().sort({ scheduledDate: 1 });
    }
    return memoryStore.followUps;
  },

  async createFollowUp(data: any, currentUser: { id: string; name: string }) {
    const record = {
      ...data,
      createdBy: currentUser.id,
    };
    if (isDbConnected()) {
      return FollowUpModel.create(record);
    }
    const newFU = {
      _id: generateId("fu"),
      id: generateId("fu"),
      ...record,
      createdAt: new Date(),
    };
    memoryStore.followUps.push(newFU);
    return newFU;
  },

  async updateFollowUp(id: string, updates: any) {
    if (isDbConnected()) {
      return FollowUpModel.findByIdAndUpdate(id, updates, { new: true });
    }
    const idx = memoryStore.followUps.findIndex((f) => f._id === id || f.id === id);
    if (idx !== -1) {
      memoryStore.followUps[idx] = { ...memoryStore.followUps[idx], ...updates, updatedAt: new Date() };
      return memoryStore.followUps[idx];
    }
    return null;
  },

  // --- DOCUMENTS (With Cloudinary & Access Classification Enforcement) ---
  async listDocuments(role: string) {
    // Salespeople can only see public documents, NEVER confidential supplier quotes
    if (isDbConnected()) {
      const filter = role === "admin" ? {} : { accessLevel: "public" };
      return DocumentModel.find(filter).sort({ createdAt: -1 });
    }
    if (role === "admin") {
      return memoryStore.documents;
    }
    return memoryStore.documents.filter((d) => d.accessLevel === "public");
  },

  async createDocumentRecord(data: any, currentUser: { id: string; name: string }) {
    const record = {
      ...data,
      uploadedBy: currentUser.id,
      uploadedByName: currentUser.name,
    };
    if (isDbConnected()) {
      return DocumentModel.create(record);
    }
    const newDoc = {
      _id: generateId("doc"),
      id: generateId("doc"),
      ...record,
      createdAt: new Date(),
    };
    memoryStore.documents.push(newDoc);
    return newDoc;
  },

  async getDocumentById(id: string, role: string) {
    let doc: any = null;
    if (isDbConnected()) {
      doc = await DocumentModel.findById(id);
    } else {
      doc = memoryStore.documents.find((d) => d._id === id || d.id === id) || null;
    }

    if (!doc) return null;

    // RBAC check: if document is confidential_admin_only, salesperson is blocked!
    if (doc.accessLevel === "confidential_admin_only" && role !== "admin") {
      throw new Error("FORBIDDEN: You do not have permission to access confidential supplier documents");
    }
    return doc;
  },

  // --- AUDIT LOGS (ADMIN ONLY) ---
  async listAuditLogs(role: string) {
    if (role !== "admin") {
      throw new Error("FORBIDDEN: Audit logs are strictly restricted to administrators");
    }
    if (isDbConnected()) {
      return AuditLogModel.find().sort({ createdAt: -1 }).limit(200);
    }
    return [...memoryStore.auditLogs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // --- SETTINGS ---
  async getSettings() {
    if (isDbConnected()) {
      let settings = await SettingsModel.findOne();
      if (!settings) {
        settings = await SettingsModel.create({});
      }
      return settings;
    }
    return memoryStore.settings;
  },

  async updateSettings(updates: any, role: string) {
    if (role !== "admin") {
      throw new Error("FORBIDDEN: Only administrators can update system settings");
    }
    if (isDbConnected()) {
      return SettingsModel.findOneAndUpdate({}, updates, { new: true, upsert: true });
    }
    memoryStore.settings = { ...memoryStore.settings, ...updates, updatedAt: new Date() };
    return memoryStore.settings;
  },

  // --- COMBINED MASTER REGISTER FOR ROLE-RESTRICTED VIEW & EXCELJS EXPORT ---
  async getMasterRegister(role: string) {
    const enquiries = await this.listEnquiries();
    const quotations = await this.listQuotations();
    const followUps = await this.listFollowUps();
    const supplierQuotes = role === "admin" ? await this.listAllSupplierQuotes("admin") : [];

    const rows: any[] = [];

    for (const enq of enquiries) {
      // Find latest quotation for this enquiry
      const enqQuotes = quotations.filter(
        (q) => q.enquiryId === enq._id || q.enquiryId === enq.id || q.enquiryNumber === enq.enquiryNumber
      );
      const latestQuote = enqQuotes.sort((a, b) => (b.revision || 0) - (a.revision || 0))[0];

      // Find next follow-up
      const enqFollowUps = followUps.filter(
        (f) => f.enquiryId === enq._id || f.enquiryId === enq.id || f.enquiryNumber === enq.enquiryNumber
      );
      const nextFU = enqFollowUps.filter((f) => f.status === "pending").sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())[0];

      for (const item of enq.items || []) {
        const row: any = {
          enquiryNumber: enq.enquiryNumber,
          enquiryDate: enq.createdAt,
          customerName: enq.customerName,
          contactName: enq.contactName,
          productDescription: item.itemDescription,
          technicalSpecs: `${item.materialGrade || ""} ${item.size || ""} ${item.pressureClass || ""} ${item.standard || ""}`.trim(),
          quantity: item.quantity,
          unitOfMeasure: item.unitOfMeasure,
          customerTargetUnitPrice: item.customerTargetUnitPrice || 0,
          customerTargetTotalPrice: (item.quantity || 1) * (item.customerTargetUnitPrice || 0),
          quotationNumber: latestQuote ? latestQuote.quotationCode : "Not Quoted",
          quotationRevision: latestQuote ? latestQuote.revision : "-",
          customerSellingUnitPrice: latestQuote?.items?.[0]?.unitSellingPrice || 0,
          customerSellingTotalPrice: latestQuote?.items?.[0]?.lineTotal || 0,
          assignedSalesperson: enq.assignedToName,
          enquiryStatus: enq.status,
          nextFollowUpDate: nextFU ? nextFU.scheduledDate : enq.nextFollowUpDate || null,
        };

        // ADMIN-ONLY CONFIDENTIAL COLUMNS
        if (role === "admin") {
          const matchingSQ = supplierQuotes.find(
            (sq: any) =>
              (sq.enquiryId === enq._id || sq.enquiryId === enq.id) &&
              (sq.enquiryItemId === item._id || sq.enquiryItemId === item.id) &&
              sq.isSelected
          ) || supplierQuotes.find(
            (sq: any) => (sq.enquiryId === enq._id || sq.enquiryId === enq.id)
          );

          if (matchingSQ) {
            row.supplierName = matchingSQ.supplierName;
            row.supplierReference = matchingSQ.supplierReference;
            row.unitPurchasePrice = matchingSQ.unitPurchasePrice;
            row.unitLandedCost = matchingSQ.calculatedUnitLandedCost;
            row.totalLandedCost = matchingSQ.calculatedTotalLandedCost;

            if (latestQuote && latestQuote.items?.[0]) {
              const profitData = calculateProfitAndMargin({
                unitSellingPrice: latestQuote.items[0].unitSellingPrice,
                quantity: item.quantity,
                discountPercent: latestQuote.items[0].discountPercent || 0,
                unitLandedCost: matchingSQ.calculatedUnitLandedCost,
              });
              row.grossProfit = profitData.grossProfit;
              row.grossMarginPercent = profitData.grossMarginPercent;
            } else {
              row.grossProfit = 0;
              row.grossMarginPercent = 0;
            }
          } else {
            row.supplierName = "-";
            row.supplierReference = "-";
            row.unitPurchasePrice = 0;
            row.unitLandedCost = 0;
            row.totalLandedCost = 0;
            row.grossProfit = 0;
            row.grossMarginPercent = 0;
          }
        }

        rows.push(row);
      }
    }

    return rows;
  },
};
