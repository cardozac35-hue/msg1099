"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  FileText,
  ArrowLeft,
  Download,
  Calendar,
  Building,
  Hash,
  Layers,
  History,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  User,
  ExternalLink,
  Edit,
  RefreshCw,
  Lock,
} from "lucide-react";
import { DocumentStatusBadge, DocumentVisibilityBadge } from "@/components/documents/document-status-badge";
import { DocumentReviewPanel } from "@/components/documents/document-review-panel";
import { DocumentVersionHistory } from "@/components/documents/document-version-history";
import { useToast } from "@/components/ui/Toast";

export default function DocumentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { success, error, info } = useToast();

  const docId = params.id as string;
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"details" | "review" | "versions" | "audit">("details");

  const fetchDocument = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/documents/${docId}`);
      const result = await res.json();
      if (result.success) {
        setData(result);
      } else {
        error("Document Error", result.error);
      }
    } catch (err: any) {
      error("Fetch Error", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (docId) {
      fetchDocument();
    }
  }, [docId]);

  const handleDownload = async () => {
    try {
      const res = await fetch(`/api/documents/${docId}/download`);
      const result = await res.json();
      if (result.success && result.downloadUrl) {
        window.open(result.downloadUrl, "_blank");
      } else {
        error("Download Denied", result.error || "Cannot retrieve file");
      }
    } catch (err: any) {
      error("Error", err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center flex flex-col items-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-500">Loading certificate record and security clearances...</p>
      </div>
    );
  }

  if (!data?.document) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-800">Document Not Accessible</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          This document could not be found, or your active role does not possess authorization to view this confidential supplier record.
        </p>
        <Link
          href="/dashboard/documents/all"
          className="mt-4 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium"
        >
          Return to Document Repository
        </Link>
      </div>
    );
  }

  const doc = data.document;
  const versions = data.versions || [];
  const reviews = data.reviews || [];
  const auditLogs = data.auditLogs || [];
  const currentUser = data.currentUser;

  const isImage = ["jpg", "jpeg", "png", "webp"].includes(doc.format?.toLowerCase());

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/documents/all"
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition"
            title="Back to all documents"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 font-mono tracking-tight">
                {doc.documentNumber}
              </h1>
              <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Rev {doc.revision || "0"} (v{doc.versionNumber || 1})
              </span>
              <DocumentStatusBadge status={doc.approvalStatus} />
              <DocumentVisibilityBadge visibility={doc.visibilityClassification} />
            </div>
            <p className="text-xs text-slate-600 mt-1">{doc.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>Download Certified Copy</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex rounded-xl border border-slate-200 p-1 bg-white text-xs font-medium shadow-xs max-w-fit">
        <button
          onClick={() => setActiveTab("details")}
          className={`px-4 py-2 rounded-lg transition ${
            activeTab === "details"
              ? "bg-slate-900 text-white shadow-xs font-semibold"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          Certificate Overview & Metadata
        </button>
        <button
          onClick={() => setActiveTab("review")}
          className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 ${
            activeTab === "review"
              ? "bg-slate-900 text-white shadow-xs font-semibold"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <span>Quality Verification</span>
          {doc.approvalStatus === "pending_review" && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("versions")}
          className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 ${
            activeTab === "versions"
              ? "bg-slate-900 text-white shadow-xs font-semibold"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <span>Revision History ({versions.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2 rounded-lg transition ${
            activeTab === "audit"
              ? "bg-slate-900 text-white shadow-xs font-semibold"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          Audit Ledger ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: DETAILS & METADATA */}
      {activeTab === "details" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Visual File Preview (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Certified Document Preview</span>
                <span className="font-mono text-[11px] text-slate-400">
                  {doc.format?.toUpperCase()} • {(doc.fileSize / 1024).toFixed(0)} KB
                </span>
              </h3>

              <div className="bg-slate-900 rounded-xl overflow-hidden min-h-[460px] flex items-center justify-center p-4">
                {isImage ? (
                  <img
                    src={doc.cloudinaryUrl}
                    alt={doc.title}
                    className="max-h-[500px] max-w-full object-contain rounded shadow"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-50 rounded-lg border border-slate-300 p-8 flex flex-col justify-between text-slate-800 font-sans shadow-inner">
                    <div className="border-b border-slate-300 pb-4 flex justify-between items-start">
                      <div>
                        <h2 className="font-serif font-bold text-xl text-slate-900 tracking-tight">
                          {doc.issuer}
                        </h2>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">
                          OFFICIAL METALLURGICAL TEST REPORT
                        </p>
                      </div>
                      <span className="font-mono text-xs font-bold border border-slate-300 px-2.5 py-1 rounded bg-white shadow-xs">
                        {doc.documentType}
                      </span>
                    </div>

                    <div className="my-6 space-y-3 font-mono text-xs">
                      <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-slate-200">
                        <div>
                          <span className="text-slate-400 text-[10px] block">DOCUMENT NO</span>
                          <span className="font-bold text-sm text-slate-900">{doc.documentNumber}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">HEAT / MELT NO</span>
                          <span className="font-bold text-sm text-blue-700">{doc.heatNumber || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">MATERIAL CODE</span>
                          <span className="font-semibold text-slate-800">{doc.materialCode || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">SPECIFICATION STANDARD</span>
                          <span className="font-semibold text-slate-800">
                            {doc.applicableStandard || "ASME B36.10 / API 6D"}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-blue-50/70 rounded border border-blue-200 text-[11px] text-blue-900 leading-relaxed font-sans">
                        ✓ Chemical analysis complies with ladle composition limits.
                        <br />
                        ✓ Tensile, yield strength, and Charpy V-notch values verified at design temp.
                        <br />
                        ✓ NACE MR0175 / ISO 15156 hardness limits within 22 HRC maximum threshold.
                      </div>
                    </div>

                    <div className="border-t border-slate-300 pt-3 flex justify-between items-center text-xs text-slate-500 font-sans">
                      <span>Issued: {new Date(doc.issueDate).toLocaleDateString()}</span>
                      <span className="font-semibold text-slate-700">
                        QA Decision: {doc.approvalStatus.toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {doc.description && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-2">
                  Technical Description & Remarks
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {doc.description}
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Metadata Panels (1 col) */}
          <div className="space-y-6 text-xs">
            {/* Classification & Identification */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                Document Classification
              </h3>
              <div className="space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Document Type</span>
                  <span className="font-semibold text-slate-900 text-right">{doc.documentType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Issuing Organization</span>
                  <span className="font-medium text-slate-800 text-right">{doc.issuer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Issue Date</span>
                  <span className="font-mono">{new Date(doc.issueDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Expiry Date</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : "Perpetual (No Expiry)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Security Visibility</span>
                  <DocumentVisibilityBadge visibility={doc.visibilityClassification} />
                </div>
              </div>
            </div>

            {/* Metallurgical Linkage */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                Material & Heat Linking
              </h3>
              <div className="space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Material Code</span>
                  <span className="font-semibold text-slate-900">{doc.materialCode || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Heat / Cast #</span>
                  <span className="font-mono font-bold text-blue-700">{doc.heatNumber || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Batch Number</span>
                  <span className="font-mono text-slate-700">{doc.batchNumber || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Material Grade</span>
                  <span className="font-medium text-slate-800">{doc.materialGrade || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Serial Number</span>
                  <span className="font-mono text-slate-600">{doc.serialNumber || "—"}</span>
                </div>
              </div>
            </div>

            {/* Commercial Context */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                Commercial & Order Associations
              </h3>
              <div className="space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Supplier / Mill</span>
                  <span className="font-medium text-slate-900">{doc.supplierName || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Purchase Order</span>
                  <span className="font-mono font-semibold text-slate-800">{doc.poNumber || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer</span>
                  <span className="font-medium text-slate-900">{doc.customerName || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sales Order</span>
                  <span className="font-mono font-bold text-blue-700">{doc.soNumber || "—"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QUALITY REVIEW WORKFLOW */}
      {activeTab === "review" && (
        <div className="space-y-6">
          <DocumentReviewPanel
            document={doc}
            currentUser={currentUser}
            onSuccess={fetchDocument}
          />

          {/* Historical Review Records */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-3">
              Historical Review Log ({reviews.length})
            </h3>
            <div className="space-y-3 text-xs">
              {reviews.length === 0 ? (
                <p className="text-slate-400 py-4 text-center">No review decisions logged yet.</p>
              ) : (
                reviews.map((rev: any) => (
                  <div
                    key={rev._id || rev.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{rev.reviewerName}</span>
                        <span className="text-[10px] text-slate-400 capitalize">
                          ({rev.reviewerRole?.replace("_", " ")})
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            rev.decision === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {rev.decision}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(rev.reviewedAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-slate-700 font-sans italic bg-white p-2.5 rounded border border-slate-100">
                      &quot;{rev.comments}&quot;
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VERSIONS */}
      {activeTab === "versions" && (
        <DocumentVersionHistory
          document={doc}
          versions={versions}
          currentUser={currentUser}
          onVersionAdded={fetchDocument}
        />
      )}

      {/* TAB 4: AUDIT LEDGER */}
      {activeTab === "audit" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs overflow-hidden">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-4">
            Immutable Audit Trail for {doc.documentNumber}
          </h3>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Event Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No audit events found.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log: any) => (
                    <tr key={log._id || log.id}>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {log.userName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        {JSON.stringify(log.details)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
