"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { DataTable, Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Eye, FileDown, FileSpreadsheet } from "lucide-react";

export default function QuotationsListPage() {
  const router = useRouter();
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuotations() {
      try {
        const res = await fetch("/api/quotations");
        const data = await res.json();
        if (data.success) {
          setQuotations(data.quotations || []);
        }
      } catch (err) {
        console.error("Error loading quotations:", err);
      } finally {
        setLoading(false);
      }
    }
    loadQuotations();
  }, []);

  const columns: Column<any>[] = [
    {
      key: "quotationCode",
      header: "Quotation Ref",
      sortable: true,
      className: "w-36 font-bold text-maroon-700",
      render: (row) => (
        <span className="font-bold text-maroon-700 hover:underline">
          {row.quotationCode}
        </span>
      ),
    },
    {
      key: "revision",
      header: "Rev",
      className: "w-16",
      render: (row) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
          R{row.revision}
        </span>
      ),
    },
    {
      key: "enquiryNumber",
      header: "Enquiry Link",
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs text-slate-600">{row.enquiryNumber}</span>
      ),
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
      key: "totalAmount",
      header: "Quotation Value",
      sortable: true,
      className: "text-right font-bold text-slate-900",
      render: (row) => formatCurrency(row.totalAmount, row.currency || "USD"),
    },
    {
      key: "validityDate",
      header: "Valid Until",
      sortable: true,
      render: (row) => formatDate(row.validityDate),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      className: "w-28",
      render: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => router.push(`/quotations/${row._id || row.id}`)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-maroon-600 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <a
            href={`/api/pdf/quotation/${row._id || row.id}`}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-maroon-600 transition-colors"
            title="Download PDF"
          >
            <FileDown className="w-4 h-4" />
          </a>
        </div>
      ),
    },
  ];

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Quotation Register & History</h2>
            <p className="text-xs text-slate-500">
              Commercial proposals, revision histories, and official client offer documents
            </p>
          </div>
          <Link
            href="/quotations/builder"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-maroon-600 hover:bg-maroon-700 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Quotation</span>
          </Link>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={quotations}
          searchPlaceholder="Search quotations by quote ref, customer, or enquiry..."
          searchFields={["quotationCode", "enquiryNumber", "customerName", "contactName"]}
          loading={loading}
          emptyMessage="No quotations generated yet."
          onRowClick={(row) => router.push(`/quotations/${row._id || row.id}`)}
        />
      </div>
    </DashboardShell>
  );
}
