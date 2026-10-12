"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { DataTable, Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Eye, FileQuestion, ArrowRight } from "lucide-react";

export default function AllEnquiriesPage() {
  const router = useRouter();
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function fetchEnquiries() {
      try {
        const res = await fetch("/api/enquiries");
        const data = await res.json();
        if (data.success) {
          setEnquiries(data.enquiries || []);
        }
      } catch (err) {
        console.error("Error fetching enquiries:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchEnquiries();
  }, []);

  const filteredEnquiries = statusFilter === "all"
    ? enquiries
    : enquiries.filter((e) => e.status === statusFilter);

  const columns: Column<any>[] = [
    {
      key: "enquiryNumber",
      header: "Enquiry No",
      sortable: true,
      className: "w-36 font-semibold text-slate-900",
      render: (row) => (
        <span className="font-bold text-maroon-700 hover:underline">
          {row.enquiryNumber}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Date",
      sortable: true,
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: "customerName",
      header: "Customer & Contact",
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-800 block">{row.customerName}</span>
          <span className="text-[11px] text-slate-400">{row.contactName}</span>
        </div>
      ),
    },
    {
      key: "itemsSummary",
      header: "Primary Items & Specs",
      render: (row) => {
        const first = row.items?.[0];
        if (!first) return "-";
        return (
          <div className="max-w-xs">
            <span className="block truncate font-medium text-slate-700">
              {first.itemDescription}
            </span>
            <span className="text-[11px] text-slate-400 block truncate">
              {first.quantity} {first.unitOfMeasure} • {first.materialGrade || "Standard"} {first.pressureClass || ""}
              {row.items?.length > 1 && ` (+${row.items.length - 1} more)`}
            </span>
          </div>
        );
      },
    },
    {
      key: "targetPriceTotal",
      header: "Target Total",
      sortable: true,
      render: (row) =>
        row.targetPriceTotal
          ? formatCurrency(row.targetPriceTotal, row.currency || "USD")
          : "-",
    },
    {
      key: "assignedToName",
      header: "Assigned To",
      sortable: true,
      render: (row) => row.assignedToName?.split(" ")[0] || "Unassigned",
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "nextFollowUpDate",
      header: "Next Follow-Up",
      sortable: true,
      render: (row) => formatDate(row.nextFollowUpDate),
    },
    {
      key: "actions",
      header: "Action",
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/enquiries/${row._id || row.id}`);
          }}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-maroon-600 transition-colors"
          title="View Enquiry Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const statuses = [
    { label: "All Enquiries", value: "all" },
    { label: "Received", value: "received" },
    { label: "In Review", value: "in_review" },
    { label: "Supplier Pricing", value: "supplier_pricing" },
    { label: "Quoted", value: "quoted" },
    { label: "Won", value: "won" },
    { label: "Lost", value: "lost" },
  ];

  return (
    <DashboardShell>
      <div className="space-y-5">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Enquiry Management</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Shared enquiry register visible to both salespeople and commercial admin
            </p>
          </div>
          <Link
            href="/enquiries/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-maroon-600 hover:bg-maroon-700 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Enquiry</span>
          </Link>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {statuses.map((st) => (
            <button
              key={st.value}
              onClick={() => setStatusFilter(st.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap ${
                statusFilter === st.value
                  ? "bg-charcoal-700 text-white border-charcoal-700 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredEnquiries}
          searchPlaceholder="Search by enquiry number, customer, material, or salesperson..."
          searchFields={["enquiryNumber", "customerName", "contactName", "assignedToName"]}
          loading={loading}
          emptyMessage="No customer enquiries found matching criteria."
          onRowClick={(row) => router.push(`/enquiries/${row._id || row.id}`)}
        />
      </div>
    </DashboardShell>
  );
}
