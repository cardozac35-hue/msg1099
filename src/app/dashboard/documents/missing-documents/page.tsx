"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Truck,
  UploadCloud,
  FileText,
  Filter,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

export default function MissingDocumentsPage() {
  const [missingItems, setMissingItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all");

  const loadMissing = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/sales-orders/SO-2026-1145/checklist");
      const data = await res.json();
      if (data.success && data.requirements) {
        const unfulfilled = data.requirements.filter((r: any) =>
          ["missing", "rejected"].includes(r.status)
        );
        setMissingItems(unfulfilled);
      }
    } catch {
      // quiet fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMissing();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <span>Missing Deliverables & Dispatch Blockers</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Active order deliverables that are unfulfilled or rejected, blocking technical dossier completion and warehouse dispatch.
          </p>
        </div>

        <Link
          href="/dashboard/documents/upload"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Missing Document</span>
        </Link>
      </div>

      {/* Main Missing Requirements Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
            Unfulfilled Technical Requirements ({missingItems.length})
          </h3>
          <span className="text-xs text-rose-600 font-semibold">Immediate Action Required</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Order Reference</th>
                <th className="py-3 px-3">Customer / Client</th>
                <th className="py-3 px-3">Missing Document Type</th>
                <th className="py-3 px-3">Material Grade</th>
                <th className="py-3 px-3">Requirement Impact</th>
                <th className="py-3 px-3">Responsible Party</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {missingItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <span>No unfulfilled document requirements found!</span>
                  </td>
                </tr>
              ) : (
                missingItems.map((item) => (
                  <tr key={item._id || item.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {item.orderNumber}
                    </td>
                    <td className="py-3.5 px-3 text-slate-800 font-medium">
                      ADNOC Offshore Logistics
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-semibold text-slate-800">{item.documentType}</span>
                      {item.notes && (
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.notes}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-700">
                      {item.materialCode || "MAT-VLV-TB-003"}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                        BLOCKS DISPATCH
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-700 font-medium">
                      {item.responsibleUserName || "Sarah Jenkins"}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <Link
                        href={`/dashboard/documents/upload`}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1 transition"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload Now</span>
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
