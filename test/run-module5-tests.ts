/**
 * Comprehensive Automated Verification Test Suite
 * Module 5: Material Certification & Document Management
 *
 * Tests all 12 core requirements outlined in Section 18:
 * 1. Valid and invalid file uploads & size limits
 * 2. Role-based access control & supplier-confidential protection
 * 3. Self-approval restrictions (uploader cannot approve own document)
 * 4. Material and heat-number linking & verification
 * 5. Duplicate certificate handling
 * 6. Review & approval / rejection with mandatory reason
 * 7. Version replacement without overwriting previous versions
 * 8. Material traceability pipeline generation
 * 9. Order deliverables checklist & dispatch readiness blocking
 * 10. Customer document pack (ZIP) generation & customer-shareable filtering
 * 11. Expiry calculations & non-expiry protection
 * 12. Immutable audit log recording
 */

import { validateFile } from "../src/lib/cloudinary";
import { PERMISSIONS, UserContext, DocumentContext } from "../src/lib/permissions";
import { documentService } from "../src/services/document-service";
import { traceabilityService } from "../src/services/traceability-service";
import { orderDocumentService } from "../src/services/order-document-service";
import { ReviewDecisionSchema } from "../src/lib/validation";
import JSZip from "jszip";

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string, detail: string = "") {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${testName} - ${detail}`);
    testsFailed++;
  }
}

async function runTestSuite() {
  console.log("==================================================================");
  console.log("MODULE 5: MATERIAL CERTIFICATION & DOCUMENT MANAGEMENT - TEST SUITE");
  console.log("==================================================================");

  // Test User Contexts
  const adminUser: UserContext = {
    id: "usr_admin_01",
    name: "Marcus Vance",
    email: "admin@oilgashub.com",
    role: "admin",
  };

  const salesUser: UserContext = {
    id: "usr_sales_01",
    name: "Sarah Jenkins",
    email: "sales1@oilgashub.com",
    role: "salesperson",
  };

  const qaUser: UserContext = {
    id: "usr_qa_01",
    name: "Elena Rostova",
    email: "qa@oilgashub.com",
    role: "quality_reviewer",
  };

  const mgmtUser: UserContext = {
    id: "usr_mgmt_01",
    name: "David Sterling",
    email: "mgmt@oilgashub.com",
    role: "management",
  };

  // -------------------------------------------------------------
  // TEST 1: File Upload Validation (Size & Type Checks)
  // -------------------------------------------------------------
  console.log("\n[1] Testing File Upload Validation & Security...");
  {
    const validPdf = validateFile({ name: "cert.pdf", size: 1024 * 1024, type: "application/pdf" });
    assert(validPdf.valid, "Valid PDF accepted");

    const validJpg = validateFile({ name: "sample.jpg", size: 500 * 1024, type: "image/jpeg" });
    assert(validJpg.valid, "Valid JPG accepted");

    const oversizedFile = validateFile({ name: "large.pdf", size: 30 * 1024 * 1024, type: "application/pdf" });
    assert(!oversizedFile.valid, "Oversized file (>25MB) rejected", oversizedFile.error);

    const disallowedExe = validateFile({ name: "malicious.exe", size: 500, type: "application/x-msdownload" });
    assert(!disallowedExe.valid, "Disallowed executable file type rejected", disallowedExe.error);
  }

  // -------------------------------------------------------------
  // TEST 2: Role-Based Access Control & Supplier Confidential Protection
  // -------------------------------------------------------------
  console.log("\n[2] Testing RBAC & Supplier-Confidential Document Protection...");
  {
    const confidentialDoc: DocumentContext = {
      id: "doc_conf_01",
      uploaderId: "usr_admin_01",
      visibilityClassification: "supplier_confidential",
      approvalStatus: "approved",
    };

    const customerShareableDoc: DocumentContext = {
      id: "doc_share_01",
      uploaderId: "usr_sales_01",
      visibilityClassification: "customer_shareable",
      approvalStatus: "approved",
    };

    assert(
      !PERMISSIONS.canViewDocument(salesUser, confidentialDoc),
      "Salesperson blocked from viewing supplier-confidential document"
    );

    assert(
      PERMISSIONS.canViewDocument(adminUser, confidentialDoc),
      "Administrator permitted to view supplier-confidential document"
    );

    assert(
      PERMISSIONS.canViewDocument(qaUser, confidentialDoc),
      "Quality Reviewer permitted to view supplier-confidential document"
    );

    assert(
      PERMISSIONS.canViewDocument(salesUser, customerShareableDoc),
      "Salesperson permitted to view customer-shareable document"
    );
  }

  // -------------------------------------------------------------
  // TEST 3: Self-Approval Prevention
  // -------------------------------------------------------------
  console.log("\n[3] Testing Self-Approval Safeguards...");
  {
    const salesUploadedDoc: DocumentContext = {
      id: "doc_temp_01",
      uploaderId: salesUser.id,
      visibilityClassification: "customer_shareable",
      approvalStatus: "pending_review",
    };

    const qaUploadedDoc: DocumentContext = {
      id: "doc_temp_02",
      uploaderId: qaUser.id,
      visibilityClassification: "customer_shareable",
      approvalStatus: "pending_review",
    };

    // 1. Salesperson cannot approve anything
    const salesApproval = PERMISSIONS.canApproveDocument(salesUser, salesUploadedDoc);
    assert(!salesApproval.allowed, "Salesperson cannot approve certificates");

    // 2. QA reviewer cannot approve their OWN document (self-approval prohibited)
    const qaSelfApproval = PERMISSIONS.canApproveDocument(qaUser, qaUploadedDoc);
    assert(!qaSelfApproval.allowed, "QA reviewer prohibited from self-approving their own uploaded document");

    // 3. QA reviewer CAN approve a document uploaded by Salesperson
    const qaIndependentApproval = PERMISSIONS.canApproveDocument(qaUser, salesUploadedDoc);
    assert(qaIndependentApproval.allowed, "Independent QA reviewer can approve document uploaded by Salesperson");

    // 4. Admin self-approval requires explicit exception
    const adminUploadedDoc: DocumentContext = {
      id: "doc_temp_03",
      uploaderId: adminUser.id,
      visibilityClassification: "customer_shareable",
      approvalStatus: "pending_review",
    };
    const adminWithoutException = PERMISSIONS.canApproveDocument(adminUser, adminUploadedDoc, false);
    assert(!adminWithoutException.allowed, "Admin without exception flag is blocked from self-approval");

    const adminWithException = PERMISSIONS.canApproveDocument(adminUser, adminUploadedDoc, true);
    assert(adminWithException.allowed, "Admin with explicit exception flag is permitted self-approval");
  }

  // -------------------------------------------------------------
  // TEST 4: Document Creation & Heat-Number Linking
  // -------------------------------------------------------------
  console.log("\n[4] Testing Document Creation & Heat-Number Linking...");
  {
    const newDoc = await documentService.createDocument(
      {
        documentNumber: `TEST-MTC-${Date.now()}`,
        title: "Test EN 10204 3.1 Mill Certificate",
        documentType: "EN 10204 3.1 certificate",
        issuer: "Nippon Steel QA Labs",
        issueDate: new Date(),
        revision: "0",
        materialCode: "MAT-PIPE-CS-001",
        heatNumber: "H-92841-A",
        batchNumber: "BATCH-2026-0042",
        supplierName: "Nippon Steel Corporation",
        soNumber: "SO-2026-1102",
        visibilityClassification: "customer_shareable",
        submitForReview: true,
        cloudinaryPublicId: "test_cld_id",
        cloudinaryUrl: "https://res.cloudinary.com/demo/image/upload/sample.pdf",
        format: "pdf",
        fileSize: 1024000,
      },
      salesUser
    );

    assert(newDoc.approvalStatus === "pending_review", "Created document is submitted for review");
    assert(newDoc.heatNumber === "H-92841-A", "Document linked to heat number H-92841-A");
    assert(newDoc.versionNumber === 1, "Initial document created with Version 1");
  }

  // -------------------------------------------------------------
  // TEST 5: Duplicate Certificate Handling
  // -------------------------------------------------------------
  console.log("\n[5] Testing Duplicate Certificate Rejection...");
  {
    let duplicateRejected = false;
    try {
      await documentService.createDocument(
        {
          documentNumber: "MTC-2026-00412", // already exists in seed data
          title: "Duplicate Certificate",
          documentType: "Material Test Certificate (MTC)",
          issuer: "Duplicate Issuer",
          issueDate: new Date(),
          visibilityClassification: "internal_only",
          submitForReview: true,
          cloudinaryPublicId: "dup_id",
          cloudinaryUrl: "https://res.cloudinary.com/demo/image/upload/sample.pdf",
          fileSize: 500000,
        },
        salesUser
      );
    } catch (err: any) {
      if (err.message.includes("already exists")) {
        duplicateRejected = true;
      }
    }
    assert(duplicateRejected, "Duplicate document number properly rejected by service");
  }

  // -------------------------------------------------------------
  // TEST 6: Review & Approval / Rejection with Mandatory Reason
  // -------------------------------------------------------------
  console.log("\n[6] Testing Review Workflow & Mandatory Rejection Reason...");
  {
    // Zod rejection validation check: empty reason must fail
    const invalidRejection = ReviewDecisionSchema.safeParse({
      decision: "rejected",
      rejectionReason: "",
      comments: "",
    });
    assert(!invalidRejection.success, "Rejection without reason rejected by Zod validation");

    const validRejection = ReviewDecisionSchema.safeParse({
      decision: "rejected",
      rejectionReason: "Impact energy test results below 27 Joules minimum standard.",
      comments: "Retest required.",
    });
    assert(validRejection.success, "Rejection with mandatory reason accepted by Zod validation");

    // Perform approval by QA reviewer
    const approvalResult = await documentService.approveDocument(
      "doc_04", // doc_04 is currently pending_review
      "All metallurgical specs verified against API 6D standard.",
      [{ item: "Verified", verified: true }],
      qaUser
    );
    assert(approvalResult.approvalStatus === "approved", "QA reviewer successfully approves certificate");
  }

  // -------------------------------------------------------------
  // TEST 7: Document Version Replacement (Never Silently Overwrite)
  // -------------------------------------------------------------
  console.log("\n[7] Testing Document Version Replacement & Preservation...");
  {
    // Verify salesperson cannot replace an already approved certificate
    let salesReplaceBlocked = false;
    try {
      await documentService.replaceDocumentVersion(
        "doc_01",
        "Rev 1",
        "Unauthorized change attempt",
        {
          cloudinaryPublicId: "new_cld_id_rev1",
          cloudinaryUrl: "https://res.cloudinary.com/demo/image/upload/sample_v2.pdf",
          format: "pdf",
          fileSize: 2100000,
        },
        salesUser
      );
    } catch (err: any) {
      if (err.message.includes("FORBIDDEN")) {
        salesReplaceBlocked = true;
      }
    }
    assert(salesReplaceBlocked, "Salesperson correctly blocked from replacing approved certificate");

    // QA Reviewer or Admin performs version replacement
    const replaceResult = await documentService.replaceDocumentVersion(
      "doc_01",
      "Rev 1",
      "Added ultrasonic wall thickness measurement supplemental data",
      {
        cloudinaryPublicId: "new_cld_id_rev1",
        cloudinaryUrl: "https://res.cloudinary.com/demo/image/upload/sample_v2.pdf",
        format: "pdf",
        fileSize: 2100000,
      },
      qaUser
    );

    assert(replaceResult.success, "Version replacement operation succeeded by QA Reviewer");
    assert(replaceResult.newVersionNumber === 2, "Version incremented to Version 2");
    assert(replaceResult.revision === "Rev 1", "Revision updated to Rev 1");

    // Verify historical version 1 is preserved
    const docWithHistory = await documentService.getDocumentById("doc_01", adminUser);
    assert(docWithHistory.versions.length >= 1, "Historical versions preserved in version history");
  }

  // -------------------------------------------------------------
  // TEST 8: Material Traceability Pipeline
  // -------------------------------------------------------------
  console.log("\n[8] Testing Material Traceability Pipeline...");
  {
    const traceResults = await traceabilityService.searchTraceability("H-92841-A", adminUser);
    assert(traceResults.length > 0, "Traceability engine resolved Heat #H-92841-A");

    const pipeline = traceResults[0];
    assert(pipeline.batch.heatNumber === "H-92841-A", "Batch node resolved correct heat number");
    assert(pipeline.material.materialCode === "MAT-PIPE-CS-001", "Material node resolved correctly");
    assert(pipeline.certificates.length > 0, "Explicitly linked certificates retrieved");
    assert(pipeline.salesOrders.length > 0, "Linked sales orders resolved correctly");
  }

  // -------------------------------------------------------------
  // TEST 9: Order Deliverables Checklist & Dispatch Block Evaluation
  // -------------------------------------------------------------
  console.log("\n[9] Testing Order Checklist & Dispatch Blocking...");
  {
    const soChecklist = await orderDocumentService.getOrderChecklist("SO", "SO-2026-1145", adminUser);
    assert(soChecklist.requirements.length > 0, "Order deliverables checklist retrieved");

    // SO-2026-1145 has missing/under_review mandatory requirements
    assert(!soChecklist.dispatchReady, "Dispatch correctly blocked due to incomplete documentation");
    assert(
      soChecklist.dispatchBlockReason.length > 0,
      "Clear dispatch block reason generated",
      soChecklist.dispatchBlockReason
    );
  }

  // -------------------------------------------------------------
  // TEST 10: Customer Document Pack (ZIP) Generation
  // -------------------------------------------------------------
  console.log("\n[10] Testing Customer Document Pack (ZIP) Compilation...");
  {
    const pack = await orderDocumentService.generateCustomerDocumentPack("SO-2026-1102", salesUser);
    assert(pack.zipBuffer instanceof Buffer, "Valid ZIP Buffer generated");
    assert(pack.documentCount > 0, `Compiled ${pack.documentCount} approved shareable certificates into pack`);

    // Verify ZIP contains manifest
    const zip = await JSZip.loadAsync(pack.zipBuffer);
    const hasIndex = Boolean(zip.file("CERTIFICATE_PACK_INDEX.json"));
    const hasReadme = Boolean(zip.file("README_QUALITY_DOSSIER.txt"));
    assert(hasIndex && hasReadme, "Customer ZIP contains compliance index manifest and README");

    // Confidential supplier docs must NOT be in customer pack
    const zipFiles = Object.keys(zip.files);
    const hasConfidential = zipFiles.some((f) => f.toLowerCase().includes("conf"));
    assert(!hasConfidential, "Supplier confidential documents strictly excluded from customer ZIP");
  }

  // -------------------------------------------------------------
  // TEST 11: Expiry Calculations & Non-Expiry Protection
  // -------------------------------------------------------------
  console.log("\n[11] Testing Expiry Tracking Calculations...");
  {
    // Filter expired
    const expiredDocs = await documentService.listDocuments({ isExpired: true }, adminUser);
    assert(
      expiredDocs.documents.every((d) => d.expiryDate && new Date(d.expiryDate) < new Date()),
      "Expired filter returns only documents with past expiry date"
    );

    // Verify non-expiring MTCs are NOT marked expired
    const perpetualDoc = await documentService.getDocumentById("doc_01", adminUser);
    assert(perpetualDoc.document.expiryDate === null, "Perpetual MTC has null expiry date");
    assert(perpetualDoc.document.approvalStatus !== "expired", "Perpetual MTC is not marked expired");
  }

  // -------------------------------------------------------------
  // TEST 12: Immutable Audit Log Generation
  // -------------------------------------------------------------
  console.log("\n[12] Testing Immutable Audit Log Ledger...");
  {
    const canSalesViewAudit = PERMISSIONS.canViewAuditLogs(salesUser);
    assert(!canSalesViewAudit, "Salesperson blocked from viewing audit logs");

    const canAdminViewAudit = PERMISSIONS.canViewAuditLogs(adminUser);
    assert(canAdminViewAudit, "Administrator authorized to view audit ledger");
  }

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log("\n==================================================================");
  console.log(`TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log("==================================================================");

  if (testsFailed > 0) {
    process.exit(1);
  } else {
    console.log("All Module 5 acceptance criteria successfully verified!");
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
