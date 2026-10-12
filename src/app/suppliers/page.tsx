"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { DataTable, Column } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { Plus, Truck, Star, Building, Mail, Phone } from "lucide-react";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("salesperson");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [country, setCountry] = useState("Italy");
  const [rating, setRating] = useState(5);
  const [terms, setTerms] = useState("Net 60 Days");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [leadDays, setLeadDays] = useState("28");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchSuppliers = async () => {
    try {
      const [sRes, mRes] = await Promise.all([
        fetch("/api/suppliers"),
        fetch("/api/auth/me"),
      ]);
      const sData = await sRes.json();
      const mData = await mRes.json();

      if (sData.success) setSuppliers(sData.suppliers || []);
      if (mData.success && mData.user) setUserRole(mData.user.role);
    } catch (err) {
      console.error("Suppliers fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierCode: code,
          name,
          country,
          rating,
          paymentTerms: terms,
          contactName,
          email,
          phone,
          leadTimeAverageDays: parseInt(leadDays) || 14,
          notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setCode("");
        setName("");
        setEmail("");
        fetchSuppliers();
      }
    } catch {
      // Ignore
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<any>[] = [
    {
      key: "supplierCode",
      header: "Supplier Code",
      sortable: true,
      className: "w-32 font-mono font-bold text-slate-800",
    },
    {
      key: "name",
      header: "Manufacturer / Mill Name",
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block">{row.name}</span>
          <span className="text-[11px] text-slate-400">{row.notes || "Approved mill supplier"}</span>
        </div>
      ),
    },
    {
      key: "country",
      header: "Origin / Mill Country",
      sortable: true,
    },
    {
      key: "rating",
      header: "Audit Rating",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1 text-amber-500 font-bold">
          <Star className="w-3.5 h-3.5 fill-current" />
          <span>{row.rating}.0 / 5.0</span>
        </div>
      ),
    },
    {
      key: "leadTimeAverageDays",
      header: "Avg Mill Lead Time",
      sortable: true,
      render: (row) => `${Math.round(row.leadTimeAverageDays / 7)} Weeks (${row.leadTimeAverageDays} days)`,
    },
    {
      key: "paymentTerms",
      header: "Credit Terms",
      sortable: true,
    },
    {
      key: "contact",
      header: "Sales Contact",
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-800 block">{row.contactName || "-"}</span>
          <span className="text-[11px] text-slate-400">{row.email}</span>
        </div>
      ),
    },
  ];

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Approved Supplier Directory</h2>
            <p className="text-xs text-slate-500">
              Vetted European, Asian, and American oilfield valve, piping and fittings mills
            </p>
          </div>
          {userRole === "admin" && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-maroon-600 hover:bg-maroon-700 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Supplier</span>
            </button>
          )}
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={suppliers}
          searchPlaceholder="Search suppliers by code, name, country..."
          searchFields={["supplierCode", "name", "country", "contactName"]}
          loading={loading}
          emptyMessage="No approved suppliers registered."
        />

        {/* MODAL: Create Supplier */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Onboard Approved Supplier / Mill"
          subtitle="Register an OEM valve manufacturer or API certified steel pipe mill"
          maxWidth="xl"
        >
          <form onSubmit={handleCreateSupplier} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Supplier Code *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SUP-IT-004"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white uppercase font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Manufacturer Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Bonney Forge Corp"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Country of Origin *
                </label>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. United States"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  QA / Audit Rating (1 to 5 Stars)
                </label>
                <select
                  value={rating}
                  onChange={(e) => setRating(parseInt(e.target.value))}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-bold"
                >
                  <option value={5}>5.0 - Tier 1 Premium Approved Mill</option>
                  <option value={4}>4.0 - Approved Major Manufacturer</option>
                  <option value={3}>3.0 - Standard Qualified Supplier</option>
                  <option value={2}>2.0 - Conditional Provisional Approval</option>
                  <option value={1}>1.0 - Under Commercial Review</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Average Production Lead Time (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={leadDays}
                  onChange={(e) => setLeadDays(e.target.value)}
                  placeholder="e.g. 28"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Commercial Payment Terms
                </label>
                <select
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Net 30 Days">Net 30 Days</option>
                  <option value="Net 60 Days">Net 60 Days</option>
                  <option value="LC at 90 Days">LC at 90 Days</option>
                  <option value="30% Advance, 70% against BL">30% Adv / 70% BL</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Sales Representative Name
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. David Miller"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Commercial Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sales@bonneyforge.com"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>
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
                {submitting ? "Onboarding..." : "Register Supplier"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardShell>
  );
}
