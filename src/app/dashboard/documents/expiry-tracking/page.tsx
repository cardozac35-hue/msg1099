"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarDays,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  FileText,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";

export default function ExpiryTrackingPage() {
  const [filterPeriod, setFilterPeriod] = useState<"30" | "60" | "90" | "expired">("30");
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchExpiring = async () => {
    setIsLoading(true);
    try {
      const endpoint =
        filterPeriod === "expired"
          ? "/api/documents?isExpired=true"
          : `/api/documents?expiringWithinDays=${filterPeriod}`;

      const res = await fetch(endpoint);
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents || []);
      }
    } catch {
      // quiet fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpiring();
  }, [filterPeriod]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-purple-600" />
            <span>Certificate Validity & Expiration Tracking</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Proactively monitor test bench calibrations, pressure gauge certifications, and third-party inspection validity horizons. Perpetual certificates (without expiry dates) are strictly protected.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-medium">
          <button
            onClick={() => setFilterPeriod("30")}
            className={`px-3 py-1.5 rounded-md transition ${
              filterPeriod === "30"
                ? "bg-white text-purple-700 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Expiring in 30 Days
          </button>
          <button
            onClick={() => setFilterPeriod("60")}
            className={`px-3 py-1.5 rounded-md transition ${
              filterPeriod === "60"
                ? "bg-white text-purple-700 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Expiring in 60 Days
          </button>
          <button
            onClick={() => setFilterPeriod("90")}
            className={`px-3 py-1.5 rounded-md transition ${
              filterPeriod === "90"
                ? "bg-white text-purple-700 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Expiring in 90 Days
          </button>
          <button
            onClick={() => setFilterPeriod("expired")}
            className={`px-3 py-1.5 rounded-md transition ${
              filterPeriod === "expired"
                ? "bg-rose-600 text-white shadow-xs font-semibold"
                : "text-rose-600 hover:text-rose-800"
            }`}
          >
            Expired
          </button>
        </div>
      </div>

      {/* Main Expiring Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
            {filterPeriod === "expired" ? "Expired Certificate Records" : `Certificates Expiring Within ${filterPeriod} Days`} ({documents.length})
          </h3>
          <span className="text-xs text-slate-500">
            Automated alerts dispatched to Quality Reviewers
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Document # & Title</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Issuer / Authority</th>
                <th className="py-3 px-3">Issue Date</th>
                <th className="py-3 px-3">Expiry Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <span>No certificates matching the selected expiration window.</span>
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc._id || doc.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <Link
                        href={`/dashboard/documents/${doc._id || doc.id}`}
                        className="font-mono text-blue-600 hover:underline"
                      >
                        {doc.documentNumber}
                      </Link>
                      <p className="text-[11px] text-slate-500 font-normal truncate max-w-sm mt-0.5">
                        {doc.title}
                      </p>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                        {doc.documentType}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-slate-700">{doc.issuer}</td>

                    <td className="py-3.5 px-3 font-mono text-slate-500">
                      {new Date(doc.issueDate).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-3 font-mono font-bold text-rose-600">
                      {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : "Perpetual"}
                    </td>

                    <td className="py-3.5 px-3">
                      <DocumentStatusBadge status={doc.approvalStatus} />
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <Link
                        href={`/dashboard/documents/${doc._id || doc.id}`}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs inline-flex items-center gap-1 transition"
                      >
                        <span>Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
