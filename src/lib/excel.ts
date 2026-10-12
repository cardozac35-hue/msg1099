import ExcelJS from "exceljs";
import { formatDate } from "./utils";

export interface MasterSheetRow {
  enquiryNumber: string;
  enquiryDate: string | Date;
  customerName: string;
  contactName: string;
  productDescription: string;
  technicalSpecs: string;
  quantity: number;
  unitOfMeasure: string;
  customerTargetUnitPrice: number;
  customerTargetTotalPrice: number;
  quotationNumber: string;
  quotationRevision: string | number;
  customerSellingUnitPrice: number;
  customerSellingTotalPrice: number;
  assignedSalesperson: string;
  enquiryStatus: string;
  nextFollowUpDate?: string | Date | null;
  // Admin-only fields:
  supplierName?: string;
  supplierReference?: string;
  unitPurchasePrice?: number;
  unitLandedCost?: number;
  totalLandedCost?: number;
  grossProfit?: number;
  grossMarginPercent?: number;
}

export async function generateMasterSheetExcel(
  rows: MasterSheetRow[],
  role: "admin" | "salesperson" | "quality_reviewer" | "management" | string
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Oil & Gas Sales Hub";
  workbook.lastModifiedBy = "Oil & Gas Sales Hub System";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Master Register", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  // Base salesperson columns (Always safe to export)
  const columns: Array<{ header: string; key: string; width: number; style?: any }> = [
    { header: "Enquiry No", key: "enquiryNumber", width: 16 },
    { header: "Date", key: "enquiryDate", width: 14 },
    { header: "Customer Name", key: "customerName", width: 28 },
    { header: "Contact Person", key: "contactName", width: 22 },
    { header: "Product Description", key: "productDescription", width: 36 },
    { header: "Technical Specifications", key: "technicalSpecs", width: 32 },
    { header: "Qty", key: "quantity", width: 10 },
    { header: "UOM", key: "unitOfMeasure", width: 8 },
    { header: "Target Unit Price (USD)", key: "customerTargetUnitPrice", width: 20 },
    { header: "Target Total Price (USD)", key: "customerTargetTotalPrice", width: 20 },
    { header: "Quote Number", key: "quotationNumber", width: 18 },
    { header: "Rev", key: "quotationRevision", width: 8 },
    { header: "Selling Unit Price (USD)", key: "customerSellingUnitPrice", width: 22 },
    { header: "Selling Total Price (USD)", key: "customerSellingTotalPrice", width: 22 },
    { header: "Assigned Salesperson", key: "assignedSalesperson", width: 24 },
    { header: "Status", key: "enquiryStatus", width: 16 },
    { header: "Next Follow-Up", key: "nextFollowUpDate", width: 16 },
  ];

  // Admin-only confidential columns (STRIPPED for Salespeople)
  if (role === "admin") {
    columns.push(
      { header: "Selected Supplier", key: "supplierName", width: 24 },
      { header: "Supplier Ref", key: "supplierReference", width: 18 },
      { header: "Purchase Unit Cost (USD)", key: "unitPurchasePrice", width: 22 },
      { header: "Unit Landed Cost (USD)", key: "unitLandedCost", width: 22 },
      { header: "Total Landed Cost (USD)", key: "totalLandedCost", width: 22 },
      { header: "Gross Profit (USD)", key: "grossProfit", width: 18 },
      { header: "Gross Margin %", key: "grossMarginPercent", width: 16 }
    );
  }

  worksheet.columns = columns;

  // Header row styling - Maroon theme #781F32
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "781F32" }, // Maroon brand
    };
    cell.font = {
      name: "Calibri",
      size: 11,
      bold: true,
      color: { argb: "FFFFFF" },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.border = {
      top: { style: "thin", color: { argb: "D4D4D4" } },
      left: { style: "thin", color: { argb: "D4D4D4" } },
      bottom: { style: "medium", color: { argb: "242C36" } },
      right: { style: "thin", color: { argb: "D4D4D4" } },
    };
  });

  // Populate data rows with strict sanitization
  rows.forEach((row, index) => {
    const safeData: any = {
      enquiryNumber: row.enquiryNumber,
      enquiryDate: formatDate(row.enquiryDate),
      customerName: row.customerName,
      contactName: row.contactName,
      productDescription: row.productDescription,
      technicalSpecs: row.technicalSpecs,
      quantity: row.quantity,
      unitOfMeasure: row.unitOfMeasure,
      customerTargetUnitPrice: row.customerTargetUnitPrice,
      customerTargetTotalPrice: row.customerTargetTotalPrice,
      quotationNumber: row.quotationNumber,
      quotationRevision: row.quotationRevision,
      customerSellingUnitPrice: row.customerSellingUnitPrice,
      customerSellingTotalPrice: row.customerSellingTotalPrice,
      assignedSalesperson: row.assignedSalesperson,
      enquiryStatus: row.enquiryStatus.toUpperCase(),
      nextFollowUpDate: row.nextFollowUpDate ? formatDate(row.nextFollowUpDate) : "-",
    };

    if (role === "admin") {
      safeData.supplierName = row.supplierName || "-";
      safeData.supplierReference = row.supplierReference || "-";
      safeData.unitPurchasePrice = row.unitPurchasePrice || 0;
      safeData.unitLandedCost = row.unitLandedCost || 0;
      safeData.totalLandedCost = row.totalLandedCost || 0;
      safeData.grossProfit = row.grossProfit || 0;
      safeData.grossMarginPercent = row.grossMarginPercent || 0;
    }

    const addedRow = worksheet.addRow(safeData);
    addedRow.height = 22;

    // Alternating zebra row shading
    const isEven = index % 2 === 0;
    addedRow.eachCell((cell, colNumber) => {
      cell.font = { name: "Calibri", size: 10 };
      cell.alignment = { vertical: "middle" };
      if (!isEven) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "F8F9FA" },
        };
      }
      cell.border = {
        top: { style: "thin", color: { argb: "E5E7EB" } },
        bottom: { style: "thin", color: { argb: "E5E7EB" } },
        left: { style: "thin", color: { argb: "E5E7EB" } },
        right: { style: "thin", color: { argb: "E5E7EB" } },
      };

      // Currency formatting for numeric cost & price columns
      if (
        [9, 10, 13, 14, 20, 21, 22, 23].includes(colNumber) &&
        typeof cell.value === "number"
      ) {
        cell.numFmt = '"$"#,##0.00';
      }
      // Margin percentage formatting
      if (colNumber === 24 && typeof cell.value === "number") {
        cell.numFmt = '0.00"%"';
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
