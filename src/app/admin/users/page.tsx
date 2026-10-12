"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { DataTable, Column } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { formatDate } from "@/lib/utils";
import {
  UserCheck,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Lock,
  UserX,
  Mail,
  Key,
} from "lucide-react";

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [userRole, setUserRole] = useState("admin");
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "salesperson">("salesperson");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const [uRes, meRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/auth/me"),
      ]);
      const uData = await uRes.json();
      const meData = await meRes.json();

      if (meData.success && meData.user) {
        setUserRole(meData.user.role);
      }
      if (uData.success) {
        setUsers(uData.users || []);
      }
    } catch (err) {
      console.error("Users error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error || "Failed to create user");
        setSubmitting(false);
        return;
      }

      setShowCreateModal(false);
      setName("");
      setEmail("");
      setPassword("");
      fetchUsers();
    } catch {
      setFormError("Network error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      fetchUsers();
    } catch {
      // Ignore
    }
  };

  if (userRole !== "admin") {
    return (
      <DashboardShell>
        <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl border border-rose-200 shadow-md text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
          <p className="text-xs text-slate-500 mt-2">
            User administration is restricted strictly to administrators.
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
      key: "name",
      header: "User Full Name",
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block">{row.name}</span>
          <span className="text-[11px] text-slate-400">{row.email}</span>
        </div>
      ),
    },
    {
      key: "role",
      header: "Assigned Role",
      sortable: true,
      render: (row) =>
        row.role === "admin" ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            <ShieldCheck className="w-3 h-3 text-amber-600" />
            Administrator
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
            Salesperson
          </span>
        ),
    },
    {
      key: "isActive",
      header: "Status",
      sortable: true,
      render: (row) =>
        row.isActive ? (
          <span className="text-xs font-bold text-emerald-700">Active</span>
        ) : (
          <span className="text-xs font-bold text-rose-600">Deactivated</span>
        ),
    },
    {
      key: "createdAt",
      header: "Created On",
      sortable: true,
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <button
          onClick={() => handleToggleActive(row._id || row.id, row.isActive)}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
            row.isActive
              ? "bg-white text-rose-600 border-rose-200 hover:bg-rose-50"
              : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
          }`}
        >
          {row.isActive ? "Deactivate" : "Activate"}
        </button>
      ),
    },
  ];

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">User Management & Role Access</h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                Admin Protected
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage accounts, invite salespeople, deactivate credentials, and audit permissions
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-maroon-600 hover:bg-maroon-700 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add User Account</span>
          </button>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={users}
          searchPlaceholder="Search users by name, email, or role..."
          searchFields={["name", "email", "role"]}
          loading={loading}
          emptyMessage="No users registered in system."
        />

        {/* MODAL: Create User */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New User Account"
          subtitle="Configure authentication credentials and role-based permissions"
          maxWidth="md"
        >
          <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800">
                {formError}
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Corporate Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="j.doe@oilgashub.com"
                className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Initial Password (min 8 characters) *
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Security Role Permission *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-bold"
              >
                <option value="salesperson">Salesperson (Restricted from supplier costs & margins)</option>
                <option value="admin">Administrator (Full commercial & system governance)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-maroon-600 hover:bg-maroon-700 text-white shadow-xs transition-colors"
              >
                {submitting ? "Creating..." : "Save User Account"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardShell>
  );
}
