"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarDays,
  UploadCloud,
  Search,
  ArrowRight,
  TrendingUp,
  Building,
  Layers,
  ShieldAlert,
  ChevronRight,
  FileCheck,
  Truck,
  Sparkles,
} from "lucide-react";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { DocumentPreviewModal } from "@/components/documents/document-preview-modal";

export default function DocumentDashboardPage() {
  const [stats, setStats] = useState<any>({
    totalDocuments: 0,
    pendingReview: 0,
    approved: 0,
    rejected: 0,
    missingDocuments: 0,
    expiredDocuments: 0,
    upcomingExpiryCount: 0,
    recentUploads: [],
    awaitingReviewList: [],
    incompleteOrders: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        const data = await res.json();
        if (data.success) {
          setStats(data);
        }
      } catch {
        // quiet fallback
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Material Certification & Quality Hub
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
              LIVE ERP
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise management of EN 10204 3.1 & 3.2 certificates, inspection charts, and dispatch readiness dossiers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/documents/upload"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-2 transition"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Certificate</span>
          </Link>
          <Link
            href="/dashboard/documents/traceability"
            className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition"
          >
            Traceability Engine
          </Link>
        </div>
      </div>

      {/* KPI Summary Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Documents */}
        <Link
          href="/dashboard/documents/all"
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-500 transition group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase">Total Docs</span>
            <FileText className="w-4 h-4 text-blue-600 group-hover:scale-110 transition" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.totalDocuments}</p>
          <p className="text-[10px] text-slate-400 mt-1">Controlled repository</p>
        </Link>

        {/* Pending Review */}
        <Link
          href="/dashboard/documents/pending-reviews"
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-500 transition group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase text-amber-700">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-600 group-hover:scale-110 transition animate-pulse" />
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats.pendingReview}</p>
          <p className="text-[10px] text-amber-600/80 mt-1">Awaiting Quality Sign-off</p>
        </Link>

        {/* Approved */}
        <Link
          href="/dashboard/documents/all?approvalStatus=approved"
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-500 transition group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase text-emerald-700">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{stats.approved}</p>
          <p className="text-[10px] text-emerald-600/80 mt-1">Ready for Customer Packs</p>
        </Link>

        {/* Rejected */}
        <Link
          href="/dashboard/documents/all?approvalStatus=rejected"
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-rose-500 transition group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase text-rose-700">Rejected</span>
            <XCircle className="w-4 h-4 text-rose-600 group-hover:scale-110 transition" />
          </div>
          <p className="text-2xl font-bold text-rose-600">{stats.rejected}</p>
          <p className="text-[10px] text-rose-600/80 mt-1">Correction required</p>
        </Link>

        {/* Missing Documents */}
        <Link
          href="/dashboard/documents/missing-documents"
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-rose-500 transition group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase text-rose-800">Missing Deliverables</span>
            <AlertCircle className="w-4 h-4 text-rose-700 group-hover:scale-110 transition" />
          </div>
          <p className="text-2xl font-bold text-rose-700">{stats.missingDocuments}</p>
          <p className="text-[10px] text-rose-700/80 mt-1">Blocks SO Dispatch</p>
        </Link>

        {/* Expired Documents */}
        <Link
          href="/dashboard/documents/expiry-tracking"
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-purple-500 transition group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase text-purple-700">Expired</span>
            <CalendarDays className="w-4 h-4 text-purple-600 group-hover:scale-110 transition" />
          </div>
          <p className="text-2xl font-bold text-purple-700">{stats.expiredDocuments}</p>
          <p className="text-[10px] text-purple-700/80 mt-1">
            {stats.upcomingExpiryCount} upcoming (30d)
          </p>
        </Link>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Documents Awaiting Review */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                Certificates Awaiting Quality Approval
              </h3>
            </div>
            <Link
              href="/dashboard/documents/pending-reviews"
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>View All ({stats.pendingReview})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {stats.awaitingReviewList?.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                No certificates currently awaiting approval.
              </p>
            ) : (
              stats.awaitingReviewList?.map((doc: any) => (
                <div
                  key={doc._id || doc.id}
                  className="p-3 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/20 transition flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/documents/${doc._id || doc.id}`}
                        className="font-bold text-blue-600 hover:underline"
                      >
                        {doc.documentNumber}
                      </Link>
                      <span className="font-mono text-slate-500 font-semibold text-[11px]">
                        Rev {doc.revision}
                      </span>
                      <DocumentStatusBadge status={doc.approvalStatus} />
                    </div>
                    <p className="text-[11px] text-slate-600 truncate mt-0.5" title={doc.title}>
                      {doc.title}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Heat: <strong className="font-mono text-slate-700">{doc.heatNumber || "N/A"}</strong> •{" "}
                      Uploader: {doc.uploaderName}
                    </p>
                  </div>

                  <Link
                    href={`/dashboard/documents/${doc._id || doc.id}`}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shrink-0 transition"
                  >
                    Review
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Incomplete Orders & Dispatch Readiness */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-rose-600" />
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                Orders with Incomplete Documentation
              </h3>
            </div>
            <Link
              href="/dashboard/documents/order-documents"
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>Order Checklists</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {stats.incompleteOrders?.length === 0 ? (
              <p className="text-xs text-emerald-600 text-center py-8">
                All active sales orders have complete approved documentation!
              </p>
            ) : (
              stats.incompleteOrders?.map((order: any) => (
                <div
                  key={order._id || order.id}
                  className="p-3 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50/20 transition flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 font-mono">{order.soNumber}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                        DISPATCH BLOCKED
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 font-medium mt-0.5">
                      {order.customerName}
                    </p>
                    <p className="text-[10px] text-rose-600 mt-0.5 truncate">
                      {order.dispatchBlockReason || "Missing mandatory mill certificates"}
                    </p>
                  </div>

                  <Link
                    href={`/dashboard/documents/order-documents?orderNumber=${order.soNumber}`}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-700 font-medium text-xs shrink-0 transition"
                  >
                    Checklist
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recently Uploaded Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              Recently Uploaded Material Certificates
            </h3>
          </div>
          <Link
            href="/dashboard/documents/all"
            className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
          >
            <span>All Documents Repository</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Document #</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Heat / Cast #</th>
                <th className="py-2.5 px-3">Issuer / Supplier</th>
                <th className="py-2.5 px-3">Order Link</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.recentUploads?.map((doc: any) => (
                <tr key={doc._id || doc.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    <Link
                      href={`/dashboard/documents/${doc._id || doc.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {doc.documentNumber}
                    </Link>
                    <p className="text-[11px] text-slate-500 font-normal truncate max-w-xs">
                      {doc.title}
                    </p>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                      {doc.documentType}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-medium text-slate-800">
                    {doc.heatNumber || "—"}
                  </td>
                  <td className="py-3 px-3 text-slate-600 truncate max-w-[150px]">
                    {doc.issuer || doc.supplierName}
                  </td>
                  <td className="py-3 px-3 font-mono text-blue-700">
                    {doc.soNumber || doc.poNumber || "Unlinked"}
                  </td>
                  <td className="py-3 px-3">
                    <DocumentStatusBadge status={doc.approvalStatus} />
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
                    >
                      Preview
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal document={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  );
}
