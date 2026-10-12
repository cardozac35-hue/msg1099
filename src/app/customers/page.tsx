"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { DataTable, Column } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Users, Building2, Mail, Phone, UserPlus } from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // New Customer Form
  const [custCode, setCustCode] = useState("");
  const [custName, setCustName] = useState("");
  const [custIndustry, setCustIndustry] = useState("Oil & Gas Upstream");
  const [custCountry, setCustCountry] = useState("Saudi Arabia");
  const [custCity, setCustCity] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [custTax, setCustTax] = useState("");
  const [custTerms, setCustTerms] = useState("Net 30 Days");
  const [custLimit, setCustLimit] = useState("1000000");
  const [custCurrency, setCustCurrency] = useState("USD");
  const [custNotes, setCustNotes] = useState("");
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  // New Contact Form
  const [contName, setContName] = useState("");
  const [contDesignation, setContDesignation] = useState("");
  const [contEmail, setContEmail] = useState("");
  const [contPhone, setContPhone] = useState("");
  const [contIsPrimary, setContIsPrimary] = useState(false);
  const [creatingContact, setCreatingContact] = useState(false);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers || []);
        setContacts(data.contacts || []);
      }
    } catch (err) {
      console.error("Customers fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCustomer(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerCode: custCode,
          name: custName,
          industry: custIndustry,
          country: custCountry,
          city: custCity,
          address: custAddress,
          taxNumber: custTax,
          paymentTerms: custTerms,
          creditLimit: parseFloat(custLimit) || 0,
          currency: custCurrency,
          notes: custNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateCustomerModal(false);
        // Reset form
        setCustCode("");
        setCustName("");
        fetchCustomers();
      }
    } catch {
      // Ignore
    } finally {
      setCreatingCustomer(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setCreatingContact(true);
    try {
      const res = await fetch(`/api/customers/${selectedCustomer._id || selectedCustomer.id}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contName,
          designation: contDesignation,
          email: contEmail,
          phone: contPhone,
          isPrimary: contIsPrimary,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddContactModal(false);
        setContName("");
        setContEmail("");
        setContPhone("");
        fetchCustomers();
      }
    } catch {
      // Ignore
    } finally {
      setCreatingContact(false);
    }
  };

  const columns: Column<any>[] = [
    {
      key: "customerCode",
      header: "Code",
      sortable: true,
      className: "w-28 font-mono font-bold text-slate-800",
    },
    {
      key: "name",
      header: "Customer Name",
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block">{row.name}</span>
          <span className="text-[11px] text-slate-400">{row.industry}</span>
        </div>
      ),
    },
    {
      key: "country",
      header: "Country / City",
      sortable: true,
      render: (row) => `${row.country} ${row.city ? `(${row.city})` : ""}`,
    },
    {
      key: "paymentTerms",
      header: "Payment Terms",
      sortable: true,
    },
    {
      key: "creditLimit",
      header: "Credit Limit",
      sortable: true,
      render: (row) => formatCurrency(row.creditLimit || 0, row.currency || "USD"),
    },
    {
      key: "contactsCount",
      header: "Contacts",
      render: (row) => {
        const cList = contacts.filter((c) => c.customerId === (row._id || row.id));
        return (
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-800">{cList.length}</span>
            <span className="text-[11px] text-slate-400">persons</span>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Action",
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedCustomer(row);
            setShowAddContactModal(true);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5 text-maroon-600" />
          <span>Add Contact</span>
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
            <h2 className="text-xl font-bold text-slate-900">Customers & Contacts Directory</h2>
            <p className="text-xs text-slate-500">
              Approved client registry, contact engineers, and commercial credit profiles
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateCustomerModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-maroon-600 hover:bg-maroon-700 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={customers}
          searchPlaceholder="Search customers by code, name, country..."
          searchFields={["customerCode", "name", "country", "industry"]}
          loading={loading}
          emptyMessage="No customer records registered yet."
        />

        {/* MODAL: Create Customer */}
        <Modal
          isOpen={showCreateCustomerModal}
          onClose={() => setShowCreateCustomerModal(false)}
          title="Register New Customer Account"
          subtitle="Add an oilfield operator, EPC contractor, or drilling company"
          maxWidth="xl"
        >
          <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Customer Code *
                </label>
                <input
                  type="text"
                  required
                  value={custCode}
                  onChange={(e) => setCustCode(e.target.value.toUpperCase())}
                  placeholder="e.g. CUST-SA-004"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white uppercase font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="e.g. Kuwait Oil Company (KOC)"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Industry Segment
                </label>
                <input
                  type="text"
                  value={custIndustry}
                  onChange={(e) => setCustIndustry(e.target.value)}
                  placeholder="e.g. Upstream Exploration"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Country *
                </label>
                <input
                  type="text"
                  required
                  value={custCountry}
                  onChange={(e) => setCustCountry(e.target.value)}
                  placeholder="e.g. Kuwait"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={custCity}
                  onChange={(e) => setCustCity(e.target.value)}
                  placeholder="e.g. Ahmadi"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tax / VAT Registration No
                </label>
                <input
                  type="text"
                  value={custTax}
                  onChange={(e) => setCustTax(e.target.value)}
                  placeholder="e.g. VAT-392019280"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment Terms
                </label>
                <select
                  value={custTerms}
                  onChange={(e) => setCustTerms(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Net 30 Days">Net 30 Days</option>
                  <option value="Net 45 Days">Net 45 Days</option>
                  <option value="Net 60 Days">Net 60 Days</option>
                  <option value="LC at Sight">100% LC at Sight</option>
                  <option value="Advance Payment">100% Advance Payment</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Credit Limit (USD)
                </label>
                <input
                  type="number"
                  min="0"
                  value={custLimit}
                  onChange={(e) => setCustLimit(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCreateCustomerModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingCustomer}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-maroon-600 hover:bg-maroon-700 text-white shadow-xs transition-colors"
              >
                {creatingCustomer ? "Registering..." : "Save Customer"}
              </button>
            </div>
          </form>
        </Modal>

        {/* MODAL: Add Contact Person */}
        <Modal
          isOpen={showAddContactModal}
          onClose={() => setShowAddContactModal(false)}
          title={`Add Contact Person: ${selectedCustomer?.name}`}
          subtitle="Register an engineer, procurement officer, or commercial evaluator"
          maxWidth="md"
        >
          <form onSubmit={handleAddContact} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={contName}
                onChange={(e) => setContName(e.target.value)}
                placeholder="e.g. Eng. Mansoor Al-Harbi"
                className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Designation / Department
              </label>
              <input
                type="text"
                value={contDesignation}
                onChange={(e) => setContDesignation(e.target.value)}
                placeholder="e.g. Lead Piping Materials Engineer"
                className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Business Email Address *
              </label>
              <input
                type="email"
                required
                value={contEmail}
                onChange={(e) => setContEmail(e.target.value)}
                placeholder="m.harbi@koc-kw.com"
                className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={contPhone}
                onChange={(e) => setContPhone(e.target.value)}
                placeholder="+965 2386 1100"
                className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isPrimary"
                checked={contIsPrimary}
                onChange={(e) => setContIsPrimary(e.target.checked)}
                className="rounded border-slate-300 text-maroon-600 focus:ring-maroon-500"
              />
              <label htmlFor="isPrimary" className="text-slate-700 select-none">
                Designate as Primary Commercial Contact
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddContactModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingContact}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-maroon-600 hover:bg-maroon-700 text-white shadow-xs transition-colors"
              >
                {creatingContact ? "Adding..." : "Add Contact"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardShell>
  );
}
