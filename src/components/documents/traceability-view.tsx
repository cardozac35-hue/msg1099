"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Layers,
  Hash,
  Building,
  FileCheck,
  Truck,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  FileText,
} from "lucide-react";
import { DocumentStatusBadge } from "./document-status-badge";

export function TraceabilityView() {
  const [searchQuery, setSearchQuery] = useState("H-92841-A");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchTraceability = async (query: string) => {
    if (!query.trim()) return;
    setIsLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/traceability?query=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (data.success) {
        setResults(data.results || []);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTraceability("H-92841-A");
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTraceability(searchQuery);
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-1">
          Full Lifecycle Material Traceability Engine
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Trace physical materials from melt furnace heat number through mill inspection, supplier purchase orders, certified test reports, sales contracts to final site delivery.
        </p>

        <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-2xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Heat # (e.g. H-92841-A, V-55421), Material Code, Batch, PO or SO..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition shrink-0 flex items-center gap-1.5"
          >
            {isLoading ? "Searching..." : "Trace Pipeline"}
          </button>
        </form>

        {/* Quick Search Chips */}
        <div className="flex items-center gap-2 mt-3 text-xs text-slate-500 flex-wrap">
          <span className="text-[11px] font-medium text-slate-400">Quick Test Searches:</span>
          {["H-92841-A", "V-55421", "N-88219", "SO-2026-1102", "MAT-PIPE-CS-001"].map((chip) => (
            <button
              key={chip}
              onClick={() => {
                setSearchQuery(chip);
                fetchTraceability(chip);
              }}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] transition"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-xs text-slate-500 flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <span>Querying relational batches, mill test records, and purchase orders...</span>
        </div>
      ) : results.length === 0 && hasSearched ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">No Traceability Records Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            No active batches or verified certificates match &quot;{searchQuery}&quot;. Please verify the heat number or batch identifier.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {results.map((res, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
            >
              {/* Pipeline Card Top Bar */}
              <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-600 font-bold">
                    <Layers className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-white font-mono">
                        Heat #{res.batch?.heatNumber || "N/A"}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 font-mono">
                        {res.batch?.batchNumber}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {res.material?.materialCode} • {res.material?.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="text-right">
                    <p className="text-[11px] text-slate-400">Dispatch Compliance</p>
                    <span
                      className={`font-semibold inline-flex items-center gap-1 ${
                        res.verificationReport?.isFullyCertified
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }`}
                    >
                      {res.verificationReport?.isFullyCertified ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>100% Certified</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5" />
                          <span>Certification Incomplete</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* End-to-End Pipeline Visualization Nodes */}
              <div className="p-6">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span>Linear Traceability Chain</span>
                  <div className="h-px bg-slate-200 flex-1" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {/* Node 1: Material */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition">
                    <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold mb-1">
                      <span>1. Material</span>
                      <Layers className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <p className="font-bold text-xs text-slate-900 truncate">
                      {res.material?.materialCode}
                    </p>
                    <p className="text-[11px] text-slate-600 truncate mt-0.5">
                      {res.material?.materialGrade}
                    </p>
                    <span className="inline-block mt-2 text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                      {res.material?.applicableStandard || "ASME Std"}
                    </span>
                  </div>

                  {/* Node 2: Heat / Batch */}
                  <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40">
                    <div className="flex items-center justify-between text-blue-800 text-[10px] uppercase font-bold mb-1">
                      <span>2. Heat & Batch</span>
                      <Hash className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <p className="font-bold text-xs text-blue-900 font-mono">
                      {res.batch?.heatNumber}
                    </p>
                    <p className="text-[11px] text-blue-700 font-mono mt-0.5 truncate">
                      {res.batch?.batchNumber}
                    </p>
                    <span className="inline-block mt-2 text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-semibold">
                      Qty: {res.batch?.quantity} {res.batch?.unit}
                    </span>
                  </div>

                  {/* Node 3: Supplier */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
                    <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold mb-1">
                      <span>3. Supplier</span>
                      <Building className="w-3.5 h-3.5 text-slate-600" />
                    </div>
                    <p className="font-bold text-xs text-slate-900 truncate">
                      {res.supplier?.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {res.batch?.millName || res.supplier?.country}
                    </p>
                    <span className="inline-block mt-2 text-[10px] text-slate-500 font-mono">
                      Origin: {res.batch?.countryOfOrigin || "Global"}
                    </span>
                  </div>

                  {/* Node 4: Purchase Order */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
                    <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold mb-1">
                      <span>4. Purchase Order</span>
                      <FileCheck className="w-3.5 h-3.5 text-slate-600" />
                    </div>
                    <p className="font-bold text-xs text-slate-900 font-mono">
                      {res.purchaseOrder?.poNumber || "PO-DIRECT"}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Status: {res.purchaseOrder?.status || "Received"}
                    </p>
                    <span className="inline-block mt-2 text-[10px] text-slate-400">
                      {res.purchaseOrder?.orderDate
                        ? new Date(res.purchaseOrder.orderDate).toLocaleDateString()
                        : "Issued"}
                    </span>
                  </div>

                  {/* Node 5: Certificates */}
                  <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
                    <div className="flex items-center justify-between text-emerald-800 text-[10px] uppercase font-bold mb-1">
                      <span>5. Certificates</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <p className="font-bold text-xs text-emerald-900">
                      {res.certificates.length} Linked
                    </p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      {res.verificationReport.approvedCertificatesCount} Approved
                    </p>
                    <span className="inline-block mt-2 text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">
                      Verified Match
                    </span>
                  </div>

                  {/* Node 6: Sales Order & Customer */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
                    <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold mb-1">
                      <span>6. Sales Order</span>
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <p className="font-bold text-xs text-slate-900 font-mono">
                      {res.salesOrders[0]?.soNumber || "Stock / Available"}
                    </p>
                    <p className="text-[11px] text-slate-600 truncate mt-0.5">
                      {res.salesOrders[0]?.customerName || "In Warehouse"}
                    </p>
                    <span className="inline-block mt-2 text-[10px] text-blue-700 font-medium">
                      {res.salesOrders[0]?.deliveryTerms || "Standard"}
                    </span>
                  </div>

                  {/* Node 7: Site Delivery */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
                    <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold mb-1">
                      <span>7. Delivery Note</span>
                      <Truck className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <p className="font-bold text-xs text-slate-900 font-mono">
                      {res.deliveries[0]?.deliveryNoteNumber || "DN-PENDING"}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {res.deliveries[0]?.carrier || "Bahri / Tristar"}
                    </p>
                    <span className="inline-block mt-2 text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-semibold">
                      {res.deliveries[0]?.status || "Scheduled"}
                    </span>
                  </div>
                </div>

                {/* Associated Certificates Table */}
                <div className="mt-6 border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center justify-between">
                    <span>
                      Explicitly Linked Quality & Test Certificates ({res.certificates.length})
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      Verified against Heat #{res.batch?.heatNumber}
                    </span>
                  </h4>

                  {res.certificates.length === 0 ? (
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
                      No certificates currently linked to this batch. Upload an EN 10204 3.1 or 3.2 certificate and specify Heat #{res.batch?.heatNumber}.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {res.certificates.map((cert: any) => (
                        <div
                          key={cert._id || cert.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded">
                              <FileCheck className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/dashboard/documents/${cert._id || cert.id}`}
                                  className="font-bold text-blue-600 hover:underline"
                                >
                                  {cert.documentNumber}
                                </Link>
                                <span className="font-medium text-slate-700 font-mono">
                                  Rev {cert.revision || "0"}
                                </span>
                                <DocumentStatusBadge status={cert.approvalStatus} />
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {cert.documentType} • Issuer: {cert.issuer}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-slate-400 font-mono">
                              Heat: {cert.heatNumber}
                            </span>
                            <Link
                              href={`/dashboard/documents/${cert._id || cert.id}`}
                              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1 transition"
                            >
                              <span>Inspect</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
