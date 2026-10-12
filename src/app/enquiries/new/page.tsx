"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertTriangle,
  Building2,
  Package,
  Calendar,
  CheckCircle2,
} from "lucide-react";

export default function NewEnquiryPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Form State
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [contactId, setContactId] = useState("");
  const [contactName, setContactName] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [assignedToName, setAssignedToName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<any[]>([
    {
      productId: "",
      itemDescription: "",
      category: "Valves",
      materialGrade: "",
      standard: "",
      size: "",
      pressureClass: "",
      connectionType: "",
      quantity: 1,
      unitOfMeasure: "EA",
      customerTargetUnitPrice: 0,
      notes: "",
    },
  ]);

  // Duplicate warning state
  const [duplicateWarning, setDuplicateWarning] = useState<{
    hasPotentialDuplicate: boolean;
    duplicates: any[];
  } | null>(null);
  const [dismissDuplicateWarning, setDismissDuplicateWarning] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial master lists
  useEffect(() => {
    async function loadMasters() {
      try {
        const [cRes, pRes, uRes] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/products"),
          fetch("/api/admin/users").catch(() => null), // might be 403 if salesperson
        ]);

        const cData = await cRes.json();
        const pData = await pRes.json();

        if (cData.success) {
          setCustomers(cData.customers || []);
          setContacts(cData.contacts || []);
        }
        if (pData.success) setProducts(pData.products || []);

        if (uRes && uRes.ok) {
          const uData = await uRes.json();
          if (uData.success) setUsers(uData.users || []);
        } else {
          // Fallback to current session user
          const meRes = await fetch("/api/auth/me");
          const meData = await meRes.json();
          if (meData.success && meData.user) {
            setUsers([meData.user]);
            setAssignedTo(meData.user.id);
            setAssignedToName(meData.user.name);
          }
        }
      } catch (err) {
        console.error("Master list error:", err);
      }
    }
    loadMasters();
  }, []);

  // When customer changes, filter contacts and check duplicates
  const handleCustomerChange = (cid: string) => {
    setCustomerId(cid);
    const selected = customers.find((c) => c._id === cid || c.id === cid);
    if (selected) {
      setCustomerName(selected.name);
      setCurrency(selected.currency || "USD");

      // Set default primary contact
      const customerContacts = contacts.filter((ct) => ct.customerId === cid);
      if (customerContacts.length > 0) {
        const primary = customerContacts.find((ct) => ct.isPrimary) || customerContacts[0];
        setContactId(primary._id || primary.id);
        setContactName(primary.name);
      } else {
        setContactId("");
        setContactName("");
      }

      checkDuplicates(cid, items);
    }
  };

  const handleContactChange = (ctid: string) => {
    setContactId(ctid);
    const ct = contacts.find((c) => c._id === ctid || c.id === ctid);
    if (ct) setContactName(ct.name);
  };

  const handleSalespersonChange = (uid: string) => {
    setAssignedTo(uid);
    const u = users.find((usr) => usr._id === uid || usr.id === uid);
    if (u) setAssignedToName(u.name);
  };

  // Duplicate checking call
  const checkDuplicates = async (cid: string, currentItems: any[]) => {
    if (!cid) return;
    try {
      const res = await fetch("/api/enquiries/check-duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: cid, items: currentItems }),
      });
      const data = await res.json();
      if (data.success && data.hasPotentialDuplicate) {
        setDuplicateWarning(data);
      } else {
        setDuplicateWarning(null);
      }
    } catch {
      // Ignore
    }
  };

  // Line item handlers
  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index][field] = value;

    // If selecting a product from catalogue
    if (field === "productId" && value) {
      const prod = products.find((p) => p._id === value || p.id === value);
      if (prod) {
        updated[index].itemDescription = prod.name;
        updated[index].category = prod.category;
        updated[index].materialGrade = prod.materialGrade;
        updated[index].standard = prod.standard;
        updated[index].size = prod.size;
        updated[index].pressureClass = prod.pressureClass;
        updated[index].connectionType = prod.connectionType;
        updated[index].unitOfMeasure = prod.unitOfMeasure;
        if (prod.listPrice && !updated[index].customerTargetUnitPrice) {
          updated[index].customerTargetUnitPrice = prod.listPrice;
        }
      }
    }

    setItems(updated);
    if (customerId) {
      checkDuplicates(customerId, updated);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        productId: "",
        itemDescription: "",
        category: "Valves",
        materialGrade: "",
        standard: "",
        size: "",
        pressureClass: "",
        connectionType: "",
        quantity: 1,
        unitOfMeasure: "EA",
        customerTargetUnitPrice: 0,
        notes: "",
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError("Please select a customer");
      return;
    }
    if (!contactId) {
      setError("Please select a customer contact person");
      return;
    }
    if (!assignedTo) {
      setError("Please assign a salesperson");
      return;
    }

    // Verify all items have description and quantity
    for (let i = 0; i < items.length; i++) {
      if (!items[i].itemDescription.trim()) {
        setError(`Item #${i + 1} requires a product description`);
        return;
      }
      if (items[i].quantity < 1) {
        setError(`Item #${i + 1} quantity must be at least 1`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          customerName,
          contactId,
          contactName,
          assignedTo,
          assignedToName,
          currency,
          priority,
          nextFollowUpDate: nextFollowUpDate || undefined,
          notes,
          items,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to create enquiry");
        setSubmitting(false);
        return;
      }

      // Successfully created -> redirect to newly created enquiry
      router.push(`/enquiries/${data.enquiry._id || data.enquiry.id}`);
    } catch {
      setError("An unexpected error occurred while creating enquiry");
      setSubmitting(false);
    }
  };

  const filteredCustomerContacts = contacts.filter((c) => c.customerId === customerId);

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-3">
          <Link
            href="/enquiries"
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Create New Customer Enquiry</h2>
            <p className="text-xs text-slate-500">
              Auto-generates sequential enquiry number (ENQ-2026-XXXX)
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* DUPLICATE ENQUIRY WARNING BANNER */}
        {duplicateWarning?.hasPotentialDuplicate && !dismissDuplicateWarning && (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 shadow-xs space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold">
                  Potential Duplicate Enquiry Warning
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  An active enquiry with matching customer and technical specifications already exists in the system:
                </p>
                <div className="mt-2 space-y-1">
                  {duplicateWarning.duplicates.map((dup: any, idx: number) => (
                    <div key={idx} className="text-xs font-mono bg-white/80 p-2 rounded border border-amber-200">
                      <span className="font-bold text-maroon-700">{dup.enquiryNumber}</span> • Customer: {dup.customerName} • Status: {dup.status.toUpperCase()} • Assigned: {dup.assignedToName}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-amber-700 mt-2">
                  As per company policy, please confirm if this is a separate tender line or duplicate RFQ submission.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDismissDuplicateWarning(true)}
                className="px-3 py-1.5 text-xs font-bold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                Confirm & Proceed Anyway
              </button>
              <Link
                href="/enquiries"
                className="text-xs font-medium text-amber-900 underline hover:text-amber-950"
              >
                Cancel and Review Existing Enquiries
              </Link>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Customer & Assignment */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 className="w-4 h-4 text-maroon-600" />
              <span>Customer & Commercial Assignment</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Organization *
                </label>
                <select
                  required
                  value={customerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-600 bg-white"
                >
                  <option value="">-- Select Customer --</option>
                  {customers.map((c) => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.name} ({c.customerCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Person *
                </label>
                <select
                  required
                  value={contactId}
                  onChange={(e) => handleContactChange(e.target.value)}
                  disabled={!customerId}
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-600 bg-white disabled:bg-slate-50"
                >
                  <option value="">-- Select Contact --</option>
                  {filteredCustomerContacts.map((ct) => (
                    <option key={ct._id || ct.id} value={ct._id || ct.id}>
                      {ct.name} - {ct.designation}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Salesperson *
                </label>
                <select
                  required
                  value={assignedTo}
                  onChange={(e) => handleSalespersonChange(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-600 bg-white"
                >
                  <option value="">-- Select Salesperson --</option>
                  {users.map((u) => (
                    <option key={u._id || u.id} value={u._id || u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  RFQ Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-600 bg-white"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="SAR">SAR - Saudi Riyal</option>
                  <option value="AED">AED - UAE Dirham</option>
                  <option value="GBP">GBP - British Pound</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tender Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-600 bg-white"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent Tender Turnaround</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Follow-up Date
                </label>
                <input
                  type="date"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-600 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Commercial Notes & Client Requirements
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Client specific remarks, required testing (e.g. PMI, NDT, Hydro), delivery location..."
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-600"
              />
            </div>
          </div>

          {/* Section 2: Line Items & Technical Specifications */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-maroon-600" />
                <span>Product Line Items ({items.length})</span>
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Line Item #{idx + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                        title="Remove Line Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Select from Product Catalogue (Optional Autofill)
                      </label>
                      <select
                        value={item.productId || ""}
                        onChange={(e) => handleItemChange(idx, "productId", e.target.value)}
                        className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="">-- Custom Specification --</option>
                        {products.map((p) => (
                          <option key={p._id || p.id} value={p._id || p.id}>
                            {p.sku} - {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Item Description *
                      </label>
                      <input
                        type="text"
                        required
                        value={item.itemDescription}
                        onChange={(e) => handleItemChange(idx, "itemDescription", e.target.value)}
                        placeholder="e.g. Trunnion Ball Valve 6'' Class 600 RF"
                        className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Category
                      </label>
                      <select
                        value={item.category}
                        onChange={(e) => handleItemChange(idx, "category", e.target.value)}
                        className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="Valves">Valves</option>
                        <option value="Pipes & Tubes">Pipes & Tubes</option>
                        <option value="Flanges">Flanges</option>
                        <option value="Fittings">Fittings</option>
                        <option value="Gaskets & Seals">Gaskets & Seals</option>
                        <option value="Instrumentation & Gauges">Instrumentation & Gauges</option>
                        <option value="Drilling & Wellhead">Drilling & Wellhead</option>
                        <option value="Fasteners & Studs">Fasteners & Studs</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Material Grade
                      </label>
                      <input
                        type="text"
                        value={item.materialGrade}
                        onChange={(e) => handleItemChange(idx, "materialGrade", e.target.value)}
                        placeholder="e.g. ASTM A216 WCB"
                        className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Applicable Standard
                      </label>
                      <input
                        type="text"
                        value={item.standard}
                        onChange={(e) => handleItemChange(idx, "standard", e.target.value)}
                        placeholder="e.g. API 6D / ASME B16.34"
                        className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Nominal Size
                      </label>
                      <input
                        type="text"
                        value={item.size}
                        onChange={(e) => handleItemChange(idx, "size", e.target.value)}
                        placeholder="e.g. 6 inch (DN 150)"
                        className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Pressure Class / Rating
                      </label>
                      <input
                        type="text"
                        value={item.pressureClass}
                        onChange={(e) => handleItemChange(idx, "pressureClass", e.target.value)}
                        placeholder="e.g. Class 600"
                        className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Connection Type
                      </label>
                      <input
                        type="text"
                        value={item.connectionType}
                        onChange={(e) => handleItemChange(idx, "connectionType", e.target.value)}
                        placeholder="e.g. RF Flanged / Butt Weld"
                        className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, "quantity", parseInt(e.target.value) || 1)}
                        className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Unit of Measure
                      </label>
                      <select
                        value={item.unitOfMeasure}
                        onChange={(e) => handleItemChange(idx, "unitOfMeasure", e.target.value)}
                        className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="EA">EA - Each</option>
                        <option value="MTR">MTR - Meters</option>
                        <option value="SET">SET - Sets</option>
                        <option value="KG">KG - Kilograms</option>
                        <option value="LOT">LOT - Lot</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Customer Target Unit Price ({currency})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.customerTargetUnitPrice || ""}
                        onChange={(e) => handleItemChange(idx, "customerTargetUnitPrice", parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Action Controls */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              href="/enquiries"
              className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 text-xs font-bold rounded-xl bg-maroon-600 hover:bg-maroon-700 text-white shadow-md transition-all disabled:opacity-50"
            >
              {submitting ? "Registering Enquiry..." : "Create & Submit Enquiry"}
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
