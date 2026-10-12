"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Eye,
  Download,
  Send,
  Archive,
  MoreVertical,
  ArrowUpDown,
  Filter,
  Search,
  ExternalLink,
  Layers,
  FileCheck,
  Building,
  Hash,
} from "lucide-react";
import { DocumentStatusBadge, DocumentVisibilityBadge } from "./document-status-badge";
import { useToast } from "@/components/ui/Toast";

interface DocumentTableProps {
  documents: any[];
  total: number;
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  onFilterChange?: (filters: any) => void;
  onRefresh?: () => void;
  onPreview?: (doc: any) => void;
}

export function DocumentTable({
  documents = [],
  total = 0,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onFilterChange,
  onRefresh,
  onPreview,
}: DocumentTableProps) {
  const { success, error, info } = useToast();
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Quick Action: Submit for review
  const handleSubmitReview = async (id: string, docNumber: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/documents/${id}/submit-review`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        success("Submitted for Review", `${docNumber} is now awaiting Quality verification.`);
        if (onRefresh) onRefresh();
      } else {
        error("Submission Failed", data.error);
      }
    } catch (err: any) {
      error("Submission Error", err.message);
    } finally {
      setActionLoading(false);
      setActionMenuOpenId(null);
    }
  };

  // Quick Action: Archive
  const handleArchive = async (id: string, docNumber: string) => {
    if (!confirm(`Are you sure you want to archive certificate ${docNumber}?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/documents/${id}/archive`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        success("Document Archived", `${docNumber} moved to archive repository.`);
        if (onRefresh) onRefresh();
      } else {
        error("Archival Failed", data.error);
      }
    } catch (err: any) {
      error("Archival Error", err.message);
    } finally {
      setActionLoading(false);
      setActionMenuOpenId(null);
    }
  };

  // Quick Action: Download
  const handleDownload = async (id: string, docNumber: string) => {
    try {
      info("Preparing download...", "Validating security permissions");
      const res = await fetch(`/api/documents/${id}/download`);
      const data = await res.json();
      if (data.success && data.downloadUrl) {
        window.open(data.downloadUrl, "_blank");
      } else {
        error("Download Denied", data.error || "Could not retrieve document");
      }
    } catch (err: any) {
      error("Download Error", err.message);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Document # & Title</th>
              <th className="py-3 px-3">Type</th>
              <th className="py-3 px-3">Material & Heat #</th>
              <th className="py-3 px-3">Supplier & PO</th>
              <th className="py-3 px-3">Order Link</th>
              <th className="py-3 px-2 text-center">Rev</th>
              <th className="py-3 px-3">Uploaded</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {documents.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800">No documents found</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      No certificates match your query or filter parameters. Try adjusting your search filters or upload a new certificate.
                    </p>
                    <Link
                      href="/dashboard/documents/upload"
                      className="mt-4 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition"
                    >
                      Upload New Certificate
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              documents.map((doc) => {
                const docId = String(doc._id || doc.id);
                return (
                  <tr key={docId} className="hover:bg-slate-50/80 transition-colors">
                    {/* Document Number & Title */}
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 rounded-md bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/dashboard/documents/${docId}`}
                            className="font-semibold text-blue-600 hover:underline hover:text-blue-800 tracking-tight block truncate max-w-[200px]"
                          >
                            {doc.documentNumber}
                          </Link>
                          <p className="text-[11px] text-slate-500 truncate max-w-[200px]" title={doc.title}>
                            {doc.title}
                          </p>
                          <div className="mt-1">
                            <DocumentVisibilityBadge visibility={doc.visibilityClassification} />
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Document Type */}
                    <td className="py-3.5 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
                        {doc.documentType}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[130px]">
                        {doc.issuer}
                      </p>
                    </td>

                    {/* Material & Heat Number */}
                    <td className="py-3.5 px-3">
                      <div className="text-slate-800 font-medium">
                        {doc.materialCode || "N/A"}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5 font-mono">
                        <Hash className="w-3 h-3 text-slate-400" />
                        <span>{doc.heatNumber || "Batch: " + (doc.batchNumber || "—")}</span>
                      </div>
                    </td>

                    {/* Supplier & PO */}
                    <td className="py-3.5 px-3">
                      <p className="text-slate-800 font-medium truncate max-w-[120px]" title={doc.supplierName}>
                        {doc.supplierName || "—"}
                      </p>
                      {doc.poNumber && (
                        <p className="text-[10px] text-slate-500 font-mono">{doc.poNumber}</p>
                      )}
                    </td>

                    {/* Sales Order & Customer */}
                    <td className="py-3.5 px-3">
                      {doc.soNumber ? (
                        <div>
                          <p className="font-mono text-blue-700 font-medium">{doc.soNumber}</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[110px]">
                            {doc.customerName || "Customer"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Unlinked</span>
                      )}
                    </td>

                    {/* Revision */}
                    <td className="py-3.5 px-2 text-center font-mono font-semibold text-slate-700">
                      Rev {doc.revision || "0"}
                      {doc.versionNumber > 1 && (
                        <span className="block text-[10px] text-purple-600 font-sans">
                          v{doc.versionNumber}
                        </span>
                      )}
                    </td>

                    {/* Upload Date & By */}
                    <td className="py-3.5 px-3 text-slate-500">
                      <div>
                        {new Date(doc.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[90px]">
                        {doc.uploaderName || "System"}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3">
                      <DocumentStatusBadge status={doc.approvalStatus} />
                    </td>

                    {/* Row Actions */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            if (onPreview) onPreview(doc);
                          }}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Quick Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDownload(docId, doc.documentNumber)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition"
                          title="Download File"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        <Link
                          href={`/dashboard/documents/${docId}`}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                          title="View Full Details"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        {/* More Menu */}
                        <div className="relative">
                          <button
                            onClick={() =>
                              setActionMenuOpenId(actionMenuOpenId === docId ? null : docId)
                            }
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {actionMenuOpenId === docId && (
                            <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 text-xs">
                              {["draft", "correction_required"].includes(doc.approvalStatus) && (
                                <button
                                  onClick={() => handleSubmitReview(docId, doc.documentNumber)}
                                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                                >
                                  <Send className="w-3.5 h-3.5 text-blue-600" />
                                  Submit for Review
                                </button>
                              )}
                              <button
                                onClick={() => handleArchive(docId, doc.documentNumber)}
                                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-rose-600 flex items-center gap-2"
                              >
                                <Archive className="w-3.5 h-3.5" />
                                Archive Record
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {total > 0 && (
        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
          <div>
            Showing <span className="font-semibold text-slate-700">{documents.length}</span> of{" "}
            <span className="font-semibold text-slate-700">{total}</span> records
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange && onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <span className="text-slate-700 font-medium">
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              onClick={() => onPageChange && onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
