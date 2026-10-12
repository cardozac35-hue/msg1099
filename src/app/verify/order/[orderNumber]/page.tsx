"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  QrCode,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  FileText,
  Download,
  Eye,
  Printer,
  ExternalLink,
  Layers,
  Package,
  Truck,
  CheckSquare,
  Lock,
  UserCheck,
  Flame,
  Clock,
  Sparkles,
} from "lucide-react";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { DocumentPreviewModal } from "@/components/documents/document-preview-modal";

export default function OrderPublicVerifyPage() {
  const params = useParams();
  const orderNumber = (params?.orderNumber as string) || "";

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  // Yard store person inspection checklist states
  const [checklist, setChecklist] = useState({
    heatStencilMatched: false,
    bevelProtectorsChecked: false,
    surfaceConditionInspected: false,
    palletTagAttached: false,
  });
  const [inspectorName, setInspectorName] = useState("");
  const [isSignedOff, setIsSignedOff] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch(`/api/verify/order/${encodeURIComponent(orderNumber)}`);
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      } catch {
        // quiet fallback
      } finally {
        setLoading(false);
      }
    }
    if (orderNumber) {
      loadOrder();
    }
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-slate-300">
          Scanning MSG Yard Database for Order Documents...
        </p>
      </div>
    );
  }

  const isCleared = data?.dispatchStatus === "CLEARED";
  const allChecksPassed =
    checklist.heatStencilMatched &&
    checklist.bevelProtectorsChecked &&
    checklist.surfaceConditionInspected &&
    checklist.palletTagAttached;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-6 px-3 sm:px-6">
      <div className="max-w-3xl w-full space-y-5">
        {/* Mobile Header with MSG Logo */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-auto p-1 bg-white rounded-lg flex items-center justify-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/msg-logo.png"
                alt="MSG Oilfield Logo"
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.includes("msgoilfield.com")) {
                    target.src = "https://www.msgoilfield.com/logo.png";
                  }
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.2 rounded border border-amber-200">
                  MSG YARD & STORE SCANNER
                </span>
                <span className="text-[10px] text-slate-400">• Dubai JAFZA Hub</span>
              </div>
              <h1 className="text-base font-bold text-slate-900 leading-tight mt-0.5">
                MSG OILFIELD EQUIPMENT TRADING LLC
              </h1>
              <p className="text-[11px] text-slate-500">
                Order QR Document Portal & Warehouse Dispatch Passport
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Gate Pass</span>
            </button>
          </div>
        </div>

        {/* Dispatch Clearance Banner */}
        <div
          className={`rounded-2xl p-5 border shadow-sm transition-all ${
            isCleared
              ? "bg-emerald-50 border-emerald-300 text-emerald-950"
              : "bg-amber-50 border-amber-300 text-amber-950"
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md ${
                isCleared ? "bg-emerald-600" : "bg-amber-600"
              }`}
            >
              {isCleared ? (
                <ShieldCheck className="w-7 h-7" />
              ) : (
                <AlertTriangle className="w-7 h-7" />
              )}
            </div>

            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isCleared
                      ? "bg-emerald-200 text-emerald-900 border border-emerald-300"
                      : "bg-amber-200 text-amber-900 border border-amber-300"
                  }`}
                >
                  {isCleared ? "DISPATCH CLEARED - GREEN" : "HOLD - DOCS PENDING QA"}
                </span>
                <span className="text-xs font-mono font-bold text-slate-700">
                  {data?.qrToken}
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-900">
                {isCleared
                  ? `Order ${data?.orderNumber} is Quality Cleared for Release`
                  : `Order ${data?.orderNumber} Documentation Under Review`}
              </h2>

              <p className="text-xs text-slate-600 leading-relaxed">
                {data?.dispatchMessage}
              </p>
            </div>
          </div>
        </div>

        {/* Order Passport & Yard Token Info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Order Passport Details
              </h3>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-500">
              Yard Pass: {data?.yardPassCode}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Order Number</span>
              <span className="font-bold text-slate-900 font-mono text-sm">
                {data?.orderNumber}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Customer / Client</span>
              <span className="font-bold text-slate-900 truncate block">
                {data?.customerName}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Delivery Terms</span>
              <span className="font-bold text-slate-900 truncate block">
                {data?.deliveryTerms}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total MTCs Linked</span>
              <span className="font-bold text-emerald-700 text-sm">
                {data?.approvedDocumentsCount} / {data?.totalDocuments} Approved
              </span>
            </div>
          </div>

          {/* Physical Line Items & Stencil Heat Reference */}
          {data?.lineItems && data.lineItems.length > 0 && (
            <div className="mt-3">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Physical Manifest & Heat Numbers on Pallets:
              </span>
              <div className="space-y-1.5">
                {data.lineItems.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                        {item.itemNumber || idx + 1}
                      </span>
                      <span className="font-medium text-slate-900">{item.description}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-700">
                        {item.quantity} {item.unit}
                      </span>
                      {item.heatNumber && (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono font-bold text-[11px] border border-amber-300">
                          Stencil Heat: {item.heatNumber}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ALL ATTACHED DOCUMENTS LIST (Core Request: Store Person can see all documents) */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>All Verified Technical Documents ({data?.documents?.length || 0})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any certificate to inspect chemical/mechanical properties or download PDF on phone.
              </p>
            </div>

            <Link
              href={`/api/sales-orders/${data?.orderNumber}/pack`}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Full Pack (ZIP)</span>
            </Link>
          </div>

          <div className="space-y-2.5">
            {(!data?.documents || data.documents.length === 0) ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No certificates attached to this order yet.
              </div>
            ) : (
              data.documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {doc.documentNumber}
                      </span>
                      <DocumentStatusBadge status={doc.approvalStatus} />
                      <span className="text-[10px] text-slate-500 bg-slate-200/80 px-1.5 py-0.2 rounded font-mono">
                        {doc.format?.toUpperCase() || "PDF"}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-800">{doc.title}</h4>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span>
                        Type: <strong className="text-slate-700">{doc.documentType}</strong>
                      </span>
                      {doc.heatNumber && doc.heatNumber !== "N/A" && (
                        <span>
                          Heat #:{" "}
                          <strong className="text-amber-800 font-mono font-bold">
                            {doc.heatNumber}
                          </strong>
                        </span>
                      )}
                      <span>
                        Mill: <strong className="text-slate-700">{doc.issuer}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>View</span>
                    </button>
                    <Link
                      href={`/verify/${doc.id}`}
                      target="_blank"
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                      <span>Seal</span>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Store Person / Yard Inspector Physical Check Sign-off */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Yard Store Keeper Physical Verification
              </h3>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
              STAGE: WAREHOUSE DISPATCH
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.heatStencilMatched}
                onChange={(e) =>
                  setChecklist({ ...checklist, heatStencilMatched: e.target.checked })
                }
                className="mt-0.5 w-4 h-4 rounded text-emerald-600"
              />
              <div>
                <span className="font-semibold text-slate-800 block">
                  1. Heat Numbers Physically Verified
                </span>
                <span className="text-[11px] text-slate-500">
                  Confirmed stenciled heat numbers on pipe body match MTCs.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.bevelProtectorsChecked}
                onChange={(e) =>
                  setChecklist({ ...checklist, bevelProtectorsChecked: e.target.checked })
                }
                className="mt-0.5 w-4 h-4 rounded text-emerald-600"
              />
              <div>
                <span className="font-semibold text-slate-800 block">
                  2. Bevel & Flange End Protection
                </span>
                <span className="text-[11px] text-slate-500">
                  Plastic end caps / wooden flange covers secured against transit damage.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.surfaceConditionInspected}
                onChange={(e) =>
                  setChecklist({ ...checklist, surfaceConditionInspected: e.target.checked })
                }
                className="mt-0.5 w-4 h-4 rounded text-emerald-600"
              />
              <div>
                <span className="font-semibold text-slate-800 block">
                  3. Cleanliness & Surface Inspection
                </span>
                <span className="text-[11px] text-slate-500">
                  Dry, free of severe rust, pit marks, or chemical contamination.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.palletTagAttached}
                onChange={(e) =>
                  setChecklist({ ...checklist, palletTagAttached: e.target.checked })
                }
                className="mt-0.5 w-4 h-4 rounded text-emerald-600"
              />
              <div>
                <span className="font-semibold text-slate-800 block">
                  4. MSG QR Pallet Tag Affixed
                </span>
                <span className="text-[11px] text-slate-500">
                  Scannable weatherproof QR dispatch tag tied to bundle/crate.
                </span>
              </div>
            </label>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Store Person Name / Employee ID"
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 w-64"
              />
            </div>

            <button
              disabled={!allChecksPassed || !inspectorName.trim() || isSignedOff}
              onClick={() => setIsSignedOff(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>
                {isSignedOff
                  ? `Signed-off by ${inspectorName}`
                  : "Confirm Yard Physical Inspection"}
              </span>
            </button>
          </div>

          {isSignedOff && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Yard Release Confirmed at {new Date().toLocaleTimeString()} by <strong>{inspectorName}</strong>. Truck driver may load material.
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-400 space-y-1">
          <p>© {new Date().getFullYear()} MSG Oilfield Equipment Trading LLC (Dubai Yard, UAE).</p>
          <p>Official Material Solutions Grid Traceability Portal • Sourcing Systematic</p>
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}
