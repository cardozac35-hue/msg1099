"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { DataTable, Column } from "@/components/DataTable";
import { formatDateTime } from "@/lib/utils";
import { History, ShieldCheck, ShieldAlert, Terminal } from "lucide-react";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [userRole, setUserRole] = useState("admin");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const [lRes, meRes] = await Promise.all([
          fetch("/api/admin/audit-logs"),
          fetch("/api/auth/me"),
        ]);
        const lData = await lRes.json();
        const meData = await meRes.json();

        if (meData.success && meData.user) {
          setUserRole(meData.user.role);
        }
        if (lData.success) {
          setLogs(lData.auditLogs || []);
        }
      } catch (err) {
        console.error("Audit logs error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  if (userRole !== "admin") {
    return (
      <DashboardShell>
        <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl border border-rose-200 shadow-md text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
          <p className="text-xs text-slate-500 mt-2">
            Audit logs are append-only compliance records strictly restricted to administrators.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-charcoal-700 rounded-xl"
            >
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const columns: Column<any>[] = [
    {
      key: "createdAt",
      header: "Timestamp",
      sortable: true,
      className: "w-44 font-mono text-[11px]",
      render: (row) => formatDateTime(row.createdAt),
    },
    {
      key: "action",
      header: "Security Action",
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-bold text-slate-900">
          {row.action}
        </span>
      ),
    },
    {
      key: "entityType",
      header: "Target Entity",
      sortable: true,
      render: (row) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          {row.entityType} ({row.entityId || "N/A"})
        </span>
      ),
    },
    {
      key: "userName",
      header: "Actor (User)",
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 block">{row.userName}</span>
          <span className="text-[10px] text-slate-400 capitalize">{row.userRole}</span>
        </div>
      ),
    },
    {
      key: "details",
      header: "Audit Metadata Details",
      render: (row) => (
        <code className="text-[11px] text-slate-600 block max-w-sm truncate bg-slate-50 p-1 rounded border border-slate-200 font-mono">
          {JSON.stringify(row.details || {})}
        </code>
      ),
    },
    {
      key: "ipAddress",
      header: "IP Address",
      className: "w-28 font-mono text-[11px] text-slate-400",
    },
  ];

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">Append-Only Audit Logs</h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                Compliance Record
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable trail tracking logins, tender creations, supplier cost modifications, and quotation revisions
            </p>
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={logs}
          searchPlaceholder="Search audit events by action, actor, or entity..."
          searchFields={["action", "entityType", "userName", "entityId"]}
          loading={loading}
          itemsPerPage={20}
          emptyMessage="No audit logs recorded."
        />
      </div>
    </DashboardShell>
  );
}
