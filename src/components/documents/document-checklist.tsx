"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Download,
  FileText,
  ShieldCheck,
  Building,
  Truck,
  ExternalLink,
  UploadCloud,
  FileArchive,
} from "lucide-react";
import { DocumentStatusBadge } from "./document-status-badge";
import { useToast } from "@/components/ui/Toast";

interface OrderChecklistProps {
  initialOrderType?: "SO" | "PO";
  initialOrderNumber?: string;
}

export function DocumentChecklist({
  initialOrderType = "SO",
  initialOrderNumber = "SO-2026-1102",
}: OrderChecklistProps) {
  const { success, error, info } = useToast();

  const [orderType, setOrderType] = useState<"SO" | "PO">(initialOrderType);
  const [orderNumber, setOrderNumber] = useState<string>(initialOrderNumber);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [checklistData, setChecklistData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPack, setIsGeneratingPack] = useState(false);

  // Load list of available orders
  useEffect(() => {
    async function loadOrders() {
      try {
        const url = orderType === "SO" ? "/api/sales-orders" : "/api/purchase-orders";
        const res = await fetch(url);
        const data = await res.json();
        const list = orderType === "SO" ? data.salesOrders : data.purchaseOrders;
        if (list && list.length > 0) {
          setAvailableOrders(list);
          const currentExists = list.some((o: any) => (o.soNumber || o.poNumber) === orderNumber);
          if (!currentExists) {
            setOrderNumber(list[0].soNumber || list[0].poNumber);
          }
        }
      } catch {
        // quiet fallback
      }
    }
    loadOrders();
  }, [orderType]);

  // Load checklist for selected order
  const fetchChecklist = async (type: "SO" | "PO", num: string) => {
    if (!num) return;
    setIsLoading(true);
    try {
      const endpoint =
        type === "SO"
          ? `/api/sales-orders/${num}/checklist`
          : `/api/purchase-orders/${num}/checklist`;
      const res = await fetch(endpoint);
      const data = await res.json();
      if (data.success) {
        setChecklistData(data);
      } else {
        setChecklistData(null);
      }
    } catch {
      setChecklistData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChecklist(orderType, orderNumber);
  }, [orderType, orderNumber]);

  // Generate Customer Document Pack (ZIP)
  const handleDownloadPack = async () => {
    if (orderType !== "SO") return;
    setIsGeneratingPack(true);
    info("Generating Document Pack", "Compiling verified certificates into customer zip archive...");

    try {
      const res = await fetch(`/api/sales-orders/${orderNumber}/pack`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate document pack");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Customer_Document_Pack_${orderNumber}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      success("Document Pack Ready", `Customer dossier ZIP for ${orderNumber} successfully generated.`);
    } catch (err: any) {
      error("Pack Generation Error", err.message);
    } finally {
      setIsGeneratingPack(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Order Selector Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-medium">
            <button
              onClick={() => setOrderType("SO")}
              className={`px-3 py-1.5 rounded-md transition ${
                orderType === "SO" ? "bg-white text-blue-700 shadow-xs font-semibold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sales Orders (SO)
            </button>
            <button
              onClick={() => setOrderType("PO")}
              className={`px-3 py-1.5 rounded-md transition ${
                orderType === "PO" ? "bg-white text-blue-700 shadow-xs font-semibold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Purchase Orders (PO)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700">Select Order:</label>
            <select
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono bg-white font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/20"
            >
              {availableOrders.map((o) => {
                const num = o.soNumber || o.poNumber;
                const client = o.customerName || o.supplierName;
                return (
                  <option key={o._id || o.id} value={num}>
                    {num} — {client}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Generate Pack Action */}
        {orderType === "SO" && (
          <button
            onClick={handleDownloadPack}
            disabled={isGeneratingPack || !checklistData?.shareableApprovedDocumentsCount}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition"
          >
            {isGeneratingPack ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Assembling ZIP Pack...</span>
              </>
            ) : (
              <>
                <FileArchive className="w-4 h-4" />
                <span>
                  Download Customer Document Pack (ZIP){" "}
                  {checklistData?.shareableApprovedDocumentsCount
                    ? `(${checklistData.shareableApprovedDocumentsCount} Docs)`
                    : ""}
                </span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Order Context & Readiness Banner */}
      {checklistData && (
        <div
          className={`p-5 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${
            checklistData.dispatchReady
              ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
              : "bg-amber-50/80 border-amber-200 text-amber-950"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                checklistData.dispatchReady ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {checklistData.dispatchReady ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Truck className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">
                  {checklistData.dispatchReady
                    ? "Dispatch Ready: All Mandatory Technical Documentation Approved"
                    : "Dispatch On Hold: Incomplete Quality Documentation"}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    checklistData.dispatchReady
                      ? "bg-emerald-200 text-emerald-800"
                      : "bg-amber-200 text-amber-800"
                  }`}
                >
                  {checklistData.dispatchReady ? "CLEAR TO SHIP" : "DISPATCH BLOCKED"}
                </span>
              </div>

              <p className="text-xs opacity-90 mt-1">
                Order <strong className="font-mono">{orderNumber}</strong> •{" "}
                {checklistData.order?.customerName || checklistData.order?.supplierName} •{" "}
                Delivery Terms: {checklistData.order?.deliveryTerms || "Standard"}
              </p>

              {checklistData.dispatchBlockReason && (
                <p className="text-xs text-rose-700 font-medium mt-1">
                  Reason: {checklistData.dispatchBlockReason}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Checklist Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-blue-600" />
            <span>Document Deliverables Checklist</span>
          </h3>

          <Link
            href="/dashboard/documents/upload"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Missing Deliverable</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Requirement / Document Type</th>
                <th className="py-3 px-3">Classification</th>
                <th className="py-3 px-3">Material Link</th>
                <th className="py-3 px-3">Verification Status</th>
                <th className="py-3 px-3">Linked Certificate</th>
                <th className="py-3 px-3">Responsible Party</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {!checklistData || checklistData.requirements?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No explicit document requirements found for this order.
                  </td>
                </tr>
              ) : (
                checklistData.requirements.map((req: any) => {
                  const doc = req.linkedDocumentId;

                  return (
                    <tr key={req._id || req.id} className="hover:bg-slate-50 transition">
                      {/* Document Type */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{req.documentType}</p>
                        {req.notes && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{req.notes}</p>
                        )}
                      </td>

                      {/* Required / Optional */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            req.isMandatory
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {req.isMandatory ? "MANDATORY" : "OPTIONAL"}
                        </span>
                      </td>

                      {/* Material Link */}
                      <td className="py-3.5 px-3 font-mono text-slate-700">
                        {req.materialCode || "Entire Order"}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        {req.status === "approved" && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Approved
                          </span>
                        )}
                        {req.status === "under_review" && (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Under Review
                          </span>
                        )}
                        {req.status === "uploaded" && (
                          <span className="inline-flex items-center gap-1 text-blue-700 font-medium">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            Uploaded (Pending)
                          </span>
                        )}
                        {req.status === "missing" && (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            Missing
                          </span>
                        )}
                        {req.status === "rejected" && (
                          <span className="inline-flex items-center gap-1 text-rose-800 font-medium">
                            <XCircle className="w-3.5 h-3.5 text-rose-700" />
                            Rejected (Re-upload required)
                          </span>
                        )}
                      </td>

                      {/* Linked Certificate */}
                      <td className="py-3.5 px-3">
                        {doc ? (
                          <div>
                            <Link
                              href={`/dashboard/documents/${doc._id || doc.id}`}
                              className="font-mono text-blue-600 hover:underline font-semibold"
                            >
                              {doc.documentNumber}
                            </Link>
                            <p className="text-[10px] text-slate-400">
                              Rev {doc.revision || "0"} • Heat {doc.heatNumber || "N/A"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not Linked</span>
                        )}
                      </td>

                      {/* Responsible Person */}
                      <td className="py-3.5 px-3 text-slate-700 font-medium">
                        {req.responsibleUserName || "Quality Lead"}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-3 text-right">
                        {doc ? (
                          <Link
                            href={`/dashboard/documents/${doc._id || doc.id}`}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] inline-flex items-center gap-1"
                          >
                            <span>View</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        ) : (
                          <Link
                            href={`/dashboard/documents/upload`}
                            className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-[11px] inline-flex items-center gap-1"
                          >
                            <span>Upload</span>
                            <UploadCloud className="w-3 h-3" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
