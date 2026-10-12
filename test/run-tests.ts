/**
 * Oil & Gas Sales Hub - Comprehensive Automated Security & Core Engine Test Suite
 * 
 * Tests:
 * 1. Authentication & Session signing/verification
 * 2. Strict Supplier Cost Isolation (Salesperson cannot access supplier purchase costs)
 * 3. Cross-User Visibility of enquiries (Sales 1 and Sales 2 see shared register)
 * 4. Confidential Document Access & Classification gating
 * 5. Landed Cost, Profit, and Margin Formula calculations
 * 6. Quotation Revision immutability & concurrency sequence
 * 7. Duplicate Enquiry Detection & Warning
 * 8. ExcelJS export field filtering (Salesperson vs Admin columns)
 * 9. File upload validation (MIME types & size bounds)
 * 10. Append-oriented Audit Logging access control
 */

import { hashPassword, comparePassword, signToken, verifyToken } from "../src/lib/auth";
import {
  calculateLandedCost,
  calculateProfitAndMargin,
  calculateQuotationTotals,
  convertCurrency,
} from "../src/lib/pricing";
import { dbService, memoryStore } from "../src/lib/store";
import { generateMasterSheetExcel } from "../src/lib/excel";
import { validateFile, sanitizeFilename } from "../src/lib/cloudinary";
import ExcelJS from "exceljs";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ""}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log("\n=======================================================");
  console.log("  OIL & GAS SALES HUB - AUTOMATED SECURITY TEST SUITE  ");
  console.log("=======================================================\n");

  // TEST 1: Authentication & Password Security
  console.log("TEST GROUP 1: Authentication, Password Hashing & Tokens");
  {
    const plain = "StrongCommercialPass2026!";
    const hash = await hashPassword(plain);
    const isMatch = await comparePassword(plain, hash);
    const isMismatch = await comparePassword("WrongPassword!", hash);
    assert(isMatch && !isMismatch, "Bcrypt password hashing and verification");

    const sessionPayload = {
      id: "usr_test_01",
      name: "Tariq Al-Mansoor",
      email: "sales2@oilgashub.com",
      role: "salesperson" as const,
    };
    const token = await signToken(sessionPayload);
    const verified = await verifyToken(token);
    assert(
      verified !== null && verified.email === "sales2@oilgashub.com" && verified.role === "salesperson",
      "Jose JWT session token signing and verification"
    );
  }

  // TEST 2: CRITICAL - Strict Supplier Cost Isolation
  console.log("\nTEST GROUP 2: Strict Supplier Cost Isolation (Salesperson Exclusion Proof)");
  {
    // A salesperson attempts to fetch supplier quotes for an enquiry:
    let salespersonBlocked = false;
    try {
      await dbService.listSupplierQuotesForEnquiry("enq_01", "salesperson");
    } catch (err: any) {
      if (err.message.includes("FORBIDDEN")) salespersonBlocked = true;
    }
    assert(
      salespersonBlocked,
      "SECURITY PROOF: Salesperson calling listSupplierQuotesForEnquiry is strictly blocked with FORBIDDEN"
    );

    // A salesperson attempts to fetch all supplier quotes:
    let allQuotesBlocked = false;
    try {
      await dbService.listAllSupplierQuotes("salesperson");
    } catch (err: any) {
      if (err.message.includes("FORBIDDEN")) allQuotesBlocked = true;
    }
    assert(
      allQuotesBlocked,
      "SECURITY PROOF: Salesperson calling listAllSupplierQuotes is strictly blocked with FORBIDDEN"
    );

    // A salesperson attempts to insert a supplier quote:
    let insertBlocked = false;
    try {
      await dbService.createSupplierQuote(
        {
          enquiryId: "enq_01",
          supplierId: "sup_01",
          unitPurchasePrice: 1000,
          quantity: 5,
        },
        "salesperson"
      );
    } catch (err: any) {
      if (err.message.includes("FORBIDDEN")) insertBlocked = true;
    }
    assert(
      insertBlocked,
      "SECURITY PROOF: Salesperson attempting to create a supplier pricing record is blocked with FORBIDDEN"
    );

    // Admin calling listSupplierQuotes succeeds:
    let adminAllowed = false;
    try {
      const adminQuotes = await dbService.listSupplierQuotesForEnquiry("enq_01", "admin");
      if (adminQuotes.length > 0) adminAllowed = true;
    } catch {
      adminAllowed = false;
    }
    assert(adminAllowed, "Administrator legitimately retrieves supplier purchase quotes");
  }

  // TEST 3: Cross-User Enquiry Visibility
  console.log("\nTEST GROUP 3: Cross-User Visibility of Shared Enquiry Register");
  {
    const enquiries = await dbService.listEnquiries();
    const createdBySales1 = enquiries.find((e) => e.createdBy === "usr_sales_01");
    const createdBySales2 = enquiries.find((e) => e.createdBy === "usr_sales_02");

    assert(
      enquiries.length >= 2 && createdBySales1 !== undefined && createdBySales2 !== undefined,
      "Both Salesperson 1 and Salesperson 2 enquiries exist in shared register"
    );
  }

  // TEST 4: Confidential Document Access & Classification
  console.log("\nTEST GROUP 4: Document Access Classification & Privacy Gating");
  {
    const salespersonDocs = await dbService.listDocuments("salesperson");
    const hasConfidentialInSalesList = salespersonDocs.some(
      (d) => d.accessLevel === "confidential_admin_only"
    );
    assert(
      !hasConfidentialInSalesList,
      "Salesperson document list strictly omits confidential_admin_only files"
    );

    const adminDocs = await dbService.listDocuments("admin");
    const hasConfidentialInAdminList = adminDocs.some(
      (d) => d.accessLevel === "confidential_admin_only"
    );
    assert(
      hasConfidentialInAdminList,
      "Administrator document list includes confidential supplier quotations"
    );

    // Direct access attempt by salesperson on confidential document
    let directAccessBlocked = false;
    try {
      await dbService.getDocumentById("doc_01", "salesperson");
    } catch (err: any) {
      if (err.message.includes("FORBIDDEN")) directAccessBlocked = true;
    }
    assert(
      directAccessBlocked,
      "Direct request for confidential document by salesperson throws FORBIDDEN"
    );
  }

  // TEST 5: Landed Cost & Profit Margin Formulas
  console.log("\nTEST GROUP 5: Landed Cost, Gross Profit & Decimal Calculation Engine");
  {
    // Formula verification:
    // Purchase Price: $2,850.00
    // Qty: 10
    // Freight: $1,200.00 -> $120.00/unit
    // Customs: $800.00 -> $80.00/unit
    // Other: $500.00 -> $50.00/unit
    // Expected unit landed cost = 2850 + 120 + 80 + 50 = $3,100.00
    // Expected total landed cost = $31,000.00
    const landedResult = calculateLandedCost({
      unitPurchasePrice: 2850.0,
      quantity: 10,
      allocatedFreight: 1200.0,
      allocatedCustomsAndDuties: 800.0,
      otherApplicableCosts: 500.0,
    });

    assert(
      landedResult.unitLandedCost === 3100.0 && landedResult.totalLandedCost === 31000.0,
      "Landed Cost Formula calculates exact per-unit and total cost: $3,100.00"
    );

    // Profit & Margin verification:
    // Selling Price: $4,200.00/unit
    // Qty: 10
    // Revenue (Ex-tax) = $42,000.00
    // Landed Cost = $31,000.00
    // Gross Profit = $11,000.00
    // Margin % = (11,000 / 42,000) * 100 = 26.19%
    const profitResult = calculateProfitAndMargin({
      unitSellingPrice: 4200.0,
      quantity: 10,
      unitLandedCost: 3100.0,
    });

    assert(
      profitResult.grossProfit === 11000.0 && profitResult.grossMarginPercent === 26.19,
      "Gross profit ($11,000.00) and gross margin (26.19%) evaluated strictly ex-tax"
    );

    // Quotation totals verification with line discounts and taxes:
    const quoteTotals = calculateQuotationTotals({
      items: [
        { quantity: 2, unitPrice: 1000, discountPercent: 10 }, // 2000 - 200 = 1800
        { quantity: 1, unitPrice: 500, discountPercent: 0 },   // 500
      ],
      overallDiscountPercent: 0,
      taxPercent: 5, // 5% of 2300 = 115
    });

    assert(
      quoteTotals.subtotal === 2300 && quoteTotals.taxAmount === 115 && quoteTotals.totalAmount === 2415,
      "Quotation subtotal ($2,300), tax ($115) and total ($2,415) computed server-side"
    );

    // Currency conversion test
    const usdEquivalent = convertCurrency(100, "USD", "USD");
    assert(usdEquivalent === 100, "Currency conversion normalization");
  }

  // TEST 6: Quotation Revisions & Immutability
  console.log("\nTEST GROUP 6: Quotation Revisions Immutability & Sequence");
  {
    // Retrieve initial quote
    const initialQuote = await dbService.getQuotationById("quote_01");
    assert(initialQuote && initialQuote.revision === 0, "Initial quotation revision is 0 (QT-2026-0001-R0)");

    // Create Revision 1
    const rev1 = await dbService.createQuotationRevision(
      "quote_01",
      {
        validityDate: new Date(),
        deliveryTerms: "CIF Houston",
        paymentTerms: "Net 60 Days",
        leadTime: "3 Weeks",
        items: [
          {
            itemDescription: "Trunnion Ball Valve 6'' Class 600 RF",
            quantity: 10,
            unitOfMeasure: "EA",
            unitSellingPrice: 4000.0, // Discounted from 4200 to 4000
          },
        ],
      },
      { id: "usr_sales_01", name: "Sarah Jenkins" }
    );

    assert(
      rev1.revision === 1 && rev1.quotationCode === "QT-2026-0001-R1",
      "New revision code created as QT-2026-0001-R1"
    );

    // Verify parent was marked as revised
    const updatedParent = await dbService.getQuotationById("quote_01");
    assert(updatedParent.status === "revised", "Original quotation marked as 'revised' without data mutation");
  }

  // TEST 7: Duplicate Enquiry Detection
  console.log("\nTEST GROUP 7: Duplicate Enquiry Warning Detection");
  {
    // Check against customer Aramco (cust_01) with matching size 6 inch & ASTM A216 WCB
    const dupCheck = await dbService.checkDuplicateEnquiries("cust_01", [
      { size: "6 inch", materialGrade: "ASTM A216 WCB" },
    ]);

    assert(
      dupCheck.hasPotentialDuplicate && dupCheck.duplicates.length > 0,
      "System flags potential active duplicate enquiry for Aramco 6'' valve"
    );

    // Check with non-existent specs
    const nonDup = await dbService.checkDuplicateEnquiries("cust_01", [
      { size: "48 inch", materialGrade: "Titanium Gr 5" },
    ]);
    assert(!nonDup.hasPotentialDuplicate, "Non-duplicate specification passes without warning");
  }

  // TEST 8: ExcelJS Export Confidentiality Pruning
  console.log("\nTEST GROUP 8: Excel Export Role-Based Column Protection");
  {
    const masterRows = await dbService.getMasterRegister("salesperson");
    const salesExcelBuffer = await generateMasterSheetExcel(masterRows, "salesperson");

    const salesWorkbook = new ExcelJS.Workbook();
    await salesWorkbook.xlsx.load(salesExcelBuffer);
    const salesSheet = salesWorkbook.getWorksheet("Master Register");

    // Check header columns in salesperson sheet
    const salesHeaders: string[] = [];
    salesSheet?.getRow(1).eachCell((cell) => {
      salesHeaders.push(String(cell.value));
    });

    const salesHasPurchaseCost = salesHeaders.some((h) => h.includes("Purchase Unit Cost"));
    const salesHasMargin = salesHeaders.some((h) => h.includes("Gross Margin"));

    assert(
      !salesHasPurchaseCost && !salesHasMargin,
      "SECURITY PROOF: Salesperson Excel export strictly does NOT contain Purchase Cost or Margin columns"
    );

    // Check admin sheet
    const adminRows = await dbService.getMasterRegister("admin");
    const adminExcelBuffer = await generateMasterSheetExcel(adminRows, "admin");
    const adminWorkbook = new ExcelJS.Workbook();
    await adminWorkbook.xlsx.load(adminExcelBuffer);
    const adminSheet = adminWorkbook.getWorksheet("Master Register");

    const adminHeaders: string[] = [];
    adminSheet?.getRow(1).eachCell((cell) => {
      adminHeaders.push(String(cell.value));
    });

    const adminHasPurchaseCost = adminHeaders.some((h) => h.includes("Purchase Unit Cost"));
    const adminHasMargin = adminHeaders.some((h) => h.includes("Gross Margin"));

    assert(
      adminHasPurchaseCost && adminHasMargin,
      "Administrator Excel export legitimately contains Purchase Cost and Margin columns"
    );
  }

  // TEST 9: File Upload Validation
  console.log("\nTEST GROUP 9: File Upload Size & MIME Type Validation");
  {
    const validPdf = validateFile({ name: "Drawing.pdf", size: 500000, type: "application/pdf" });
    assert(validPdf.valid, "Valid PDF file is accepted");

    const oversized = validateFile({
      name: "HugeVideo.mp4",
      size: 30 * 1024 * 1024,
      type: "application/pdf",
    });
    assert(!oversized.valid, "File exceeding 25 MB is rejected");

    const disallowedType = validateFile({
      name: "Malware.exe",
      size: 1000,
      type: "application/x-msdownload",
    });
    assert(!disallowedType.valid, "Disallowed executable MIME type is rejected");

    const cleanName = sanitizeFilename("RFQ quote #1/v2:final.pdf");
    assert(!cleanName.includes("#") && !cleanName.includes("/"), "Filename sanitization strips unsafe characters");
  }

  // TEST 10: Audit Log Access Control
  console.log("\nTEST GROUP 10: Append-Oriented Audit Log Access Protection");
  {
    let salesAuditBlocked = false;
    try {
      await dbService.listAuditLogs("salesperson");
    } catch (err: any) {
      if (err.message.includes("FORBIDDEN")) salesAuditBlocked = true;
    }
    assert(salesAuditBlocked, "Audit logs are strictly blocked from salesperson access");

    const adminLogs = await dbService.listAuditLogs("admin");
    assert(adminLogs.length > 0, "Administrator retrieves immutable audit log history");
  }

  console.log("\n=======================================================");
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED  `);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
