"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  Shield,
  Download,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  RefreshCw,
} from "lucide-react";

export default function AuditHistoryPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("ALL");

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const url = filterAction === "ALL" ? "/api/audit-logs" : `/api/audit-logs?action=${filterAction}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch {
      // quiet fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterAction]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <span>Immutable Document Audit Trail & Compliance Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete cryptographic audit log recording document ingestion, metallurgical review decisions, file replacements, versioning events, and client dossier downloads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white text-slate-800 font-medium"
          >
            <option value="ALL">All Actions</option>
            <option value="DOCUMENT_CREATED">Document Created</option>
            <option value="DOCUMENT_APPROVED">Document Approved</option>
            <option value="DOCUMENT_REJECTED">Document Rejected</option>
            <option value="DOCUMENT_VERSION_REPLACED">Version Replaced</option>
            <option value="DOCUMENT_DOWNLOADED">Document Downloaded</option>
            <option value="DOCUMENT_PACK_GENERATED">Dossier ZIP Pack Generated</option>
          </select>

          <button
            onClick={fetchLogs}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
            Audit Ledger ({logs.length} Events)
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">ISO 9001 / EN 10204 Audit Ready</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3">Event Action</th>
                <th className="py-3 px-3">Actor / User</th>
                <th className="py-3 px-3">Entity Type</th>
                <th className="py-3 px-3">Entity Identifier</th>
                <th className="py-3 px-3">Change Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                    No audit records match the selected action filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id || log.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {new Date(log.createdAt).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          log.action.includes("APPROVED")
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : log.action.includes("REJECTED")
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : log.action.includes("REPLACED")
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-medium text-slate-800">
                      <div>{log.userName}</div>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {log.userRole?.replace("_", " ")}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                      {log.entityType}
                    </td>

                    <td className="py-3 px-3 font-mono font-medium text-blue-700">
                      {log.details?.documentNumber || log.entityId}
                    </td>

                    <td className="py-3 px-3 text-[11px] text-slate-600 font-mono">
                      {JSON.stringify(log.details)}
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
