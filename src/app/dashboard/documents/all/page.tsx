"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Files,
  Search,
  Filter,
  RefreshCw,
  UploadCloud,
  ChevronDown,
  Layers,
  Building,
  Hash,
} from "lucide-react";
import { DocumentTable } from "@/components/documents/document-table";
import { DocumentPreviewModal } from "@/components/documents/document-preview-modal";

const DOCUMENT_TYPES = [
  "All Types",
  "Material Test Certificate (MTC)",
  "EN 10204 3.1 certificate",
  "EN 10204 3.2 certificate",
  "Inspection report",
  "Hydrostatic test report",
  "NDT report",
  "PMI report",
  "Dimensional inspection report",
  "Certificate of Conformity",
  "Technical datasheet",
  "Engineering drawing",
  "Compliance certificate",
  "Other",
];

const APPROVAL_STATUSES = [
  "All Statuses",
  "approved",
  "pending_review",
  "rejected",
  "correction_required",
  "expired",
  "draft",
  "superseded",
];

export default function AllDocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [documentType, setDocumentType] = useState("All Types");
  const [approvalStatus, setApprovalStatus] = useState("All Statuses");
  const [materialCode, setMaterialCode] = useState("");
  const [heatNumber, setHeatNumber] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "15");
      if (search.trim()) params.set("search", search.trim());
      if (documentType !== "All Types") params.set("documentType", documentType);
      if (approvalStatus !== "All Statuses") params.set("approvalStatus", approvalStatus);
      if (materialCode.trim()) params.set("materialCode", materialCode.trim());
      if (heatNumber.trim()) params.set("heatNumber", heatNumber.trim());
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      const res = await fetch(`/api/documents?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      // quiet fallback
    } finally {
      setIsLoading(false);
    }
  }, [page, search, documentType, approvalStatus, materialCode, heatNumber, sortBy, sortOrder]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDocuments();
  };

  const handleResetFilters = () => {
    setSearch("");
    setDocumentType("All Types");
    setApprovalStatus("All Statuses");
    setMaterialCode("");
    setHeatNumber("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Files className="w-5 h-5 text-blue-600" />
            <span>Master Material Document Repository</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse, search, inspect, and manage verified MTCs, NDT records, hydrostatic test charts and compliance certificates.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchDocuments()}
            disabled={isLoading}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <Link
            href="/dashboard/documents/upload"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-2 transition"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Document</span>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Document #, Title, Heat #, Material, Supplier, SO, PO..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Document Type Filter */}
            <select
              value={documentType}
              onChange={(e) => {
                setDocumentType(e.target.value);
                setPage(1);
              }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20"
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {/* Approval Status Filter */}
            <select
              value={approvalStatus}
              onChange={(e) => {
                setApprovalStatus(e.target.value);
                setPage(1);
              }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20"
            >
              {APPROVAL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ").toUpperCase()}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
            >
              Filter
            </button>

            {(search ||
              documentType !== "All Types" ||
              approvalStatus !== "All Statuses" ||
              materialCode ||
              heatNumber) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-2 text-slate-500 hover:text-slate-800 text-xs font-medium transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Main Table */}
      <DocumentTable
        documents={documents}
        total={total}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p)}
        onRefresh={fetchDocuments}
        onPreview={(doc) => setPreviewDoc(doc)}
      />

      {/* Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal document={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  );
}
