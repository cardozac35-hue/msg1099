"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { DocumentReviewPanel } from "@/components/documents/document-review-panel";

export default function PendingReviewsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  const fetchPending = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/documents?approvalStatus=pending_review");
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents || []);
        if (data.documents?.length > 0 && !selectedDoc) {
          setSelectedDoc(data.documents[0]);
        }
      }
    } catch {
      // quiet fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
            <span>Pending Quality Reviews & Approval Queue</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review submitted Material Test Certificates, verify chemical and mechanical properties against ASTM/API specifications, and issue formal approval or rejection decisions.
          </p>
        </div>

        <button
          onClick={fetchPending}
          disabled={isLoading}
          className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Main Review Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List of items awaiting review */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase">
              Queue ({documents.length})
            </span>
            <span className="text-[11px] text-amber-600 font-semibold">Priority Action</span>
          </div>

          {documents.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No documents currently pending review. Great work!
            </div>
          ) : (
            documents.map((doc) => {
              const isSelected = selectedDoc && (selectedDoc._id || selectedDoc.id) === (doc._id || doc.id);
              return (
                <div
                  key={doc._id || doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition text-xs ${
                    isSelected
                      ? "bg-blue-50/70 border-blue-500 text-blue-950 ring-1 ring-blue-500"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-blue-700 font-mono">{doc.documentNumber}</span>
                    <span className="font-mono text-[11px] text-slate-500 font-semibold">
                      Rev {doc.revision || "0"}
                    </span>
                  </div>
                  <p className="font-medium text-slate-800 text-[11px] truncate">{doc.title}</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100 pt-1.5">
                    <span>Heat: <strong className="font-mono text-slate-700">{doc.heatNumber || "N/A"}</strong></span>
                    <span>By: {doc.uploaderName}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Review Workspace Pane */}
        <div className="lg:col-span-2 space-y-6">
          {selectedDoc ? (
            <>
              {/* Selected Doc Summary Banner */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900 font-mono">
                        {selectedDoc.documentNumber}
                      </h2>
                      <span className="text-xs font-mono font-semibold text-slate-600">
                        Rev {selectedDoc.revision || "0"}
                      </span>
                      <DocumentStatusBadge status={selectedDoc.approvalStatus} />
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{selectedDoc.title}</p>
                  </div>

                  <Link
                    href={`/dashboard/documents/${selectedDoc._id || selectedDoc.id}`}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5"
                  >
                    <span>Full Detail Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px] block">MATERIAL</span>
                    <span className="font-semibold text-slate-800">
                      {selectedDoc.materialCode || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">HEAT #</span>
                    <span className="font-semibold text-blue-700">
                      {selectedDoc.heatNumber || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">ISSUER</span>
                    <span className="font-sans text-slate-800 truncate block">
                      {selectedDoc.issuer}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">ORDER LINK</span>
                    <span className="text-slate-800">
                      {selectedDoc.soNumber || selectedDoc.poNumber || "Stock"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Review Panel Component */}
              <DocumentReviewPanel document={selectedDoc} onSuccess={fetchPending} />
            </>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
              Select a certificate from the left queue to begin review.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
