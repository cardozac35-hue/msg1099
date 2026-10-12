"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { DataTable, Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  FileSpreadsheet,
  Download,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
} from "lucide-react";

export default function MasterSheetPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>("salesperson");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMasterSheet() {
      try {
        const res = await fetch("/api/master-sheet");
        const data = await res.json();
        if (data.success) {
          setRows(data.rows || []);
          setUserRole(data.userRole || "salesperson");
        }
      } catch (err) {
        console.error("Error loading master sheet:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMasterSheet();
  }, []);

  const isAdmin = userRole === "admin";

  // Base Salesperson Columns
  const columns: Column<any>[] = [
    {
      key: "enquiryNumber",
      header: "Enquiry No",
      sortable: true,
      className: "w-32 font-bold text-maroon-700",
    },
    {
      key: "enquiryDate",
      header: "Date",
      sortable: true,
      render: (row) => formatDate(row.enquiryDate),
    },
    {
      key: "customerName",
      header: "Customer & Contact",
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block">{row.customerName}</span>
          <span className="text-[11px] text-slate-400">{row.contactName}</span>
        </div>
      ),
    },
    {
      key: "productDescription",
      header: "Product & Technical Specs",
      render: (row) => (
        <div className="max-w-xs">
          <span className="font-semibold text-slate-800 block truncate">
            {row.productDescription}
          </span>
          <span className="text-[11px] text-slate-500 block truncate font-mono">
            {row.technicalSpecs || "-"}
          </span>
        </div>
      ),
    },
    {
      key: "quantity",
      header: "Qty / UOM",
      sortable: true,
      className: "text-right",
      render: (row) => (
        <span className="font-bold text-slate-800">
          {row.quantity} {row.unitOfMeasure}
        </span>
      ),
    },
    {
      key: "customerTargetUnitPrice",
      header: "Target Unit",
      sortable: true,
      render: (row) =>
        row.customerTargetUnitPrice > 0
          ? formatCurrency(row.customerTargetUnitPrice, "USD")
          : "-",
    },
    {
      key: "quotationNumber",
      header: "Quote Ref",
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-700">
          {row.quotationNumber}
        </span>
      ),
    },
    {
      key: "customerSellingUnitPrice",
      header: "Selling Price",
      sortable: true,
      className: "text-right font-bold text-slate-900",
      render: (row) =>
        row.customerSellingUnitPrice > 0
          ? formatCurrency(row.customerSellingUnitPrice, "USD")
          : "-",
    },
    {
      key: "assignedSalesperson",
      header: "Salesperson",
      sortable: true,
      render: (row) => row.assignedSalesperson?.split(" ")[0] || "Unassigned",
    },
    {
      key: "enquiryStatus",
      header: "Status",
      sortable: true,
      render: (row) => <StatusBadge status={row.enquiryStatus} />,
    },
    {
      key: "nextFollowUpDate",
      header: "Next Follow-Up",
      sortable: true,
      render: (row) => formatDate(row.nextFollowUpDate),
    },
  ];

  // Admin-only confidential columns appended dynamically
  if (isAdmin) {
    columns.push(
      {
        key: "supplierName",
        header: "Supplier (Admin)",
        className: "bg-amber-50/30 font-semibold text-slate-800",
        render: (row) => row.supplierName || "-",
      },
      {
        key: "unitPurchasePrice",
        header: "Purchase Cost",
        sortable: true,
        className: "bg-amber-50/30 text-right font-mono",
        render: (row) =>
          row.unitPurchasePrice > 0 ? formatCurrency(row.unitPurchasePrice, "USD") : "-",
      },
      {
        key: "unitLandedCost",
        header: "Unit Landed",
        sortable: true,
        className: "bg-amber-50/30 text-right font-bold text-maroon-700 font-mono",
        render: (row) =>
          row.unitLandedCost > 0 ? formatCurrency(row.unitLandedCost, "USD") : "-",
      },
      {
        key: "grossProfit",
        header: "Gross Profit",
        sortable: true,
        className: "bg-amber-50/30 text-right font-bold text-emerald-700 font-mono",
        render: (row) =>
          row.grossProfit !== undefined ? formatCurrency(row.grossProfit, "USD") : "-",
      },
      {
        key: "grossMarginPercent",
        header: "Margin %",
        sortable: true,
        className: "bg-amber-50/30 text-right font-bold text-amber-700 font-mono",
        render: (row) =>
          row.grossMarginPercent !== undefined
            ? `${row.grossMarginPercent.toFixed(1)}%`
            : "-",
      }
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">Commercial Master Register</h2>
              {isAdmin ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  Full Commercial Access
                </span>
              ) : (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                  Salesperson Protected View
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Unified real-time ledger linking enquiries, specifications, quotations, and pipeline follow-ups
            </p>
          </div>

          <a
            href="/api/export/master-sheet"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
          >
            <Download className="w-4 h-4" />
            <span>Export to Excel (.xlsx)</span>
          </a>
        </div>

        {/* Security Info Pill */}
        {!isAdmin && (
          <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs flex items-center justify-between">
            <span>
              <strong>Role Access Notice:</strong> Confidential supplier costs, landed costs, and profit margin columns are stripped by server projection.
            </span>
            <span className="font-semibold text-slate-500 text-[11px]">
              Export Restricted to Permitted Fields
            </span>
          </div>
        )}

        {/* Master Table */}
        <DataTable
          columns={columns}
          data={rows}
          searchPlaceholder="Search master sheet across all enquiry, client, spec, quote fields..."
          searchFields={[
            "enquiryNumber",
            "customerName",
            "contactName",
            "productDescription",
            "technicalSpecs",
            "quotationNumber",
            "assignedSalesperson",
          ]}
          loading={loading}
          itemsPerPage={15}
          emptyMessage="No records in master register."
        />
      </div>
    </DashboardShell>
  );
}
