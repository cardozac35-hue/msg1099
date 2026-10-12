"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import {
  ArrowLeft,
  FileSpreadsheet,
  CalendarPlus,
  TrendingDown,
  Building2,
  Clock,
  History,
  CheckCircle2,
  AlertCircle,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Percent,
} from "lucide-react";

export default function EnquiryDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [enquiry, setEnquiry] = useState<any>(null);
  const [userRole, setUserRole] = useState<"admin" | "salesperson">("salesperson");
  const [loading, setLoading] = useState(true);

  // Supplier quotes (Admin only)
  const [supplierQuotes, setSupplierQuotes] = useState<any[]>([]);
  const [showAddSupplierQuoteModal, setShowAddSupplierQuoteModal] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  // Supplier Quote form state
  const [sqSupplierId, setSqSupplierId] = useState("");
  const [sqReference, setSqReference] = useState("");
  const [sqUnitPrice, setSqUnitPrice] = useState("");
  const [sqFreight, setSqFreight] = useState("");
  const [sqCustoms, setSqCustoms] = useState("");
  const [sqOther, setSqOther] = useState("");
  const [sqLeadWeeks, setSqLeadWeeks] = useState("4");
  const [sqTerms, setSqTerms] = useState("Net 30 Days");
  const [sqNotes, setSqNotes] = useState("");
  const [sqSubmitting, setSqSubmitting] = useState(false);

  // Status updating state
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchEnquiryDetails = async () => {
    try {
      const res = await fetch(`/api/enquiries/${id}`);
      const data = await res.json();
      if (data.success) {
        setEnquiry(data.enquiry);
        setUserRole(data.userRole || "salesperson");

        // If user is Admin, fetch confidential supplier quotes
        if (data.userRole === "admin") {
          const [sqRes, supRes] = await Promise.all([
            fetch(`/api/supplier-quotes?enquiryId=${id}`),
            fetch("/api/suppliers"),
          ]);
          const sqData = await sqRes.json();
          const supData = await supRes.json();
          if (sqData.success) setSupplierQuotes(sqData.supplierQuotes || []);
          if (supData.success) setSuppliers(supData.suppliers || []);
        }
      }
    } catch (err) {
      console.error("Error loading enquiry:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchEnquiryDetails();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/enquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setEnquiry(data.enquiry);
      }
    } catch {
      // Ignore
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCreateSupplierQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sqSupplierId || !enquiry) return;
    setSqSubmitting(true);

    try {
      const sup = suppliers.find((s) => s._id === sqSupplierId || s.id === sqSupplierId);
      const firstItem = enquiry.items?.[0];

      const res = await fetch("/api/supplier-quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enquiryId: enquiry._id || enquiry.id,
          enquiryItemId: firstItem?._id || firstItem?.id || "item_01",
          supplierId: sqSupplierId,
          supplierName: sup ? sup.name : "Supplier",
          supplierReference: sqReference,
          validityDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
          currency: enquiry.currency || "USD",
          unitPurchasePrice: parseFloat(sqUnitPrice) || 0,
          quantity: firstItem?.quantity || 1,
          unitOfMeasure: firstItem?.unitOfMeasure || "EA",
          allocatedFreight: parseFloat(sqFreight) || 0,
          allocatedCustomsDuties: parseFloat(sqCustoms) || 0,
          otherApplicableCosts: parseFloat(sqOther) || 0,
          leadTimeWeeks: parseInt(sqLeadWeeks) || 2,
          paymentTerms: sqTerms,
          isSelected: supplierQuotes.length === 0, // auto select if first
          notes: sqNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowAddSupplierQuoteModal(false);
        // Reset form
        setSqReference("");
        setSqUnitPrice("");
        setSqFreight("");
        setSqCustoms("");
        setSqOther("");
        fetchEnquiryDetails();
      }
    } catch {
      // Ignore
    } finally {
      setSqSubmitting(false);
    }
  };

  if (loading || !enquiry) {
    return (
      <DashboardShell>
        <div className="p-12 text-center text-xs text-slate-400">
          Loading enquiry record...
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/enquiries"
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 font-sans">
                  {enquiry.enquiryNumber}
                </h2>
                <StatusBadge status={enquiry.status} />
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase">
                  {enquiry.priority} Priority
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Created on {formatDate(enquiry.createdAt)} by {enquiry.createdByName} • Assigned to{" "}
                <span className="font-semibold text-slate-700">{enquiry.assignedToName}</span>
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={enquiry.status}
              disabled={updatingStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="text-xs font-bold py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 transition-colors"
            >
              <option value="received">Status: Received</option>
              <option value="in_review">Status: In Review</option>
              <option value="supplier_pricing">Status: Supplier Pricing</option>
              <option value="quoted">Status: Quoted</option>
              <option value="follow_up">Status: Follow Up</option>
              <option value="won">Status: Won (Awarded)</option>
              <option value="lost">Status: Lost</option>
              <option value="cancelled">Status: Cancelled</option>
            </select>

            <Link
              href={`/quotations/builder?enquiryId=${enquiry._id || enquiry.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-maroon-600 hover:bg-maroon-700 text-white shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Build Quotation</span>
            </Link>

            <Link
              href={`/follow-ups?enquiryNumber=${enquiry.enquiryNumber}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-slate-500" />
              <span>Schedule Follow-up</span>
            </Link>
          </div>
        </div>

        {/* Customer & Technical Profile Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-maroon-600" />
              <span>Client Information</span>
            </h3>
            <div>
              <span className="text-sm font-bold text-slate-900 block">{enquiry.customerName}</span>
              <span className="text-xs text-slate-600 block mt-0.5">Attn: {enquiry.contactName}</span>
              <span className="text-xs text-slate-500 block">Currency: {enquiry.currency}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-maroon-600" />
              <span>Next Follow-up</span>
            </h3>
            <div>
              <span className="text-sm font-bold text-slate-900 block">
                {enquiry.nextFollowUpDate ? formatDate(enquiry.nextFollowUpDate) : "Not Scheduled"}
              </span>
              <span className="text-xs text-slate-500 block mt-0.5">
                Owner: {enquiry.assignedToName}
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-maroon-600" />
              <span>Customer Target Total</span>
            </h3>
            <div>
              <span className="text-sm font-bold text-slate-900 block">
                {enquiry.targetPriceTotal ? formatCurrency(enquiry.targetPriceTotal, enquiry.currency) : "No target price"}
              </span>
              <span className="text-xs text-slate-500 block mt-0.5">
                Based on client budgetary indications
              </span>
            </div>
          </div>
        </div>

        {/* Product Line Items Specifications Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Enquiry Technical Specifications</h3>
              <p className="text-xs text-slate-500">Specified materials, pressure classes, and quantities</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-charcoal-50/70 border-b border-slate-200 text-charcoal-600 font-semibold uppercase text-[11px]">
                  <th className="p-3.5">#</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5">Material Grade</th>
                  <th className="p-3.5">Standard</th>
                  <th className="p-3.5">Size & Class</th>
                  <th className="p-3.5">Connection</th>
                  <th className="p-3.5 text-right">Qty</th>
                  <th className="p-3.5">Target Unit</th>
                  <th className="p-3.5 text-right">Target Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {enquiry.items?.map((item: any, idx: number) => {
                  const lineTotal = (item.quantity || 1) * (item.customerTargetUnitPrice || 0);
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3.5 font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-3.5 font-semibold text-slate-800">{item.itemDescription}</td>
                      <td className="p-3.5 font-mono text-[11px]">{item.materialGrade || "-"}</td>
                      <td className="p-3.5">{item.standard || "-"}</td>
                      <td className="p-3.5">
                        {item.size || "-"} {item.pressureClass && `• ${item.pressureClass}`}
                      </td>
                      <td className="p-3.5">{item.connectionType || "-"}</td>
                      <td className="p-3.5 text-right font-bold">
                        {item.quantity} {item.unitOfMeasure}
                      </td>
                      <td className="p-3.5">
                        {item.customerTargetUnitPrice
                          ? formatCurrency(item.customerTargetUnitPrice, enquiry.currency)
                          : "-"}
                      </td>
                      <td className="p-3.5 text-right font-bold text-slate-900">
                        {lineTotal > 0 ? formatCurrency(lineTotal, enquiry.currency) : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ADMIN ONLY: CONFIDENTIAL SUPPLIER PRICING & LANDED COST SECTION */}
        {userRole === "admin" ? (
          <div className="bg-white rounded-2xl border border-amber-300 shadow-sm overflow-hidden">
            <div className="p-4 bg-amber-500/10 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-sm font-bold text-amber-950 uppercase tracking-wide">
                    Confidential Supplier Cost & Landed Pricing (Strict Admin Access)
                  </h3>
                  <p className="text-xs text-amber-800">
                    Isolated from salesperson accounts • Formulas: Landed Cost & Gross Profit applied
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSupplierQuoteModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-700 hover:bg-amber-800 text-white shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Supplier Quote</span>
              </button>
            </div>

            <div className="p-4">
              {supplierQuotes.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No supplier quotes recorded yet for this enquiry. Click &ldquo;Record Supplier Quote&rdquo; to add manufacturer costs.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px] border-b border-slate-200">
                        <th className="p-3">Selected</th>
                        <th className="p-3">Supplier</th>
                        <th className="p-3">RFQ Reference</th>
                        <th className="p-3 text-right">Purchase Price</th>
                        <th className="p-3 text-right">Freight (Unit)</th>
                        <th className="p-3 text-right">Customs/Duties</th>
                        <th className="p-3 text-right">Unit Landed Cost</th>
                        <th className="p-3 text-right">Total Landed Cost</th>
                        <th className="p-3">Lead Time</th>
                        <th className="p-3">Payment Terms</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {supplierQuotes.map((sq) => {
                        const unitFreight = sq.quantity > 0 ? (sq.allocatedFreight / sq.quantity) : 0;
                        const unitCustoms = sq.quantity > 0 ? (sq.allocatedCustomsDuties / sq.quantity) : 0;
                        return (
                          <tr
                            key={sq._id || sq.id}
                            className={sq.isSelected ? "bg-amber-50/40 font-medium" : "hover:bg-slate-50"}
                          >
                            <td className="p-3">
                              {sq.isSelected ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" /> Selected
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400">Alternative</span>
                              )}
                            </td>
                            <td className="p-3 font-bold text-slate-900">{sq.supplierName}</td>
                            <td className="p-3 font-mono">{sq.supplierReference}</td>
                            <td className="p-3 text-right font-semibold">
                              {formatCurrency(sq.unitPurchasePrice, sq.currency)}
                            </td>
                            <td className="p-3 text-right text-slate-500">
                              +{formatCurrency(unitFreight, sq.currency)}
                            </td>
                            <td className="p-3 text-right text-slate-500">
                              +{formatCurrency(unitCustoms, sq.currency)}
                            </td>
                            <td className="p-3 text-right font-bold text-maroon-700">
                              {formatCurrency(sq.calculatedUnitLandedCost, sq.currency)}
                            </td>
                            <td className="p-3 text-right font-bold text-slate-900">
                              {formatCurrency(sq.calculatedTotalLandedCost, sq.currency)}
                            </td>
                            <td className="p-3">{sq.leadTimeWeeks} Weeks</td>
                            <td className="p-3">{sq.paymentTerms}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* SALESPERSON VIEW: CONFIDENTIALITY SHIELD NOTICE */
          <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-slate-400" />
              <span>
                Confidentiality Notice: Supplier cost sheets and landed margins are restricted to commercial administration.
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">
              Field-Level Isolation Enforced
            </span>
          </div>
        )}

        {/* Activity Timeline History */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <History className="w-4 h-4 text-maroon-600" />
            <span>Audit & Activity History</span>
          </h3>

          <div className="space-y-4">
            {enquiry.activities?.length === 0 ? (
              <p className="text-xs text-slate-400">No activity recorded yet.</p>
            ) : (
              enquiry.activities?.map((act: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-maroon-600 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        {act.action.replace(/_/g, " ")}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {formatDateTime(act.timestamp)}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{act.notes}</p>
                    <span className="text-[10px] text-slate-400">
                      By: {act.performerName}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* MODAL: Record Supplier Quote (Admin Only) */}
        <Modal
          isOpen={showAddSupplierQuoteModal}
          onClose={() => setShowAddSupplierQuoteModal(false)}
          title="Record Supplier Quotation & Cost Breakdown"
          subtitle={`Enquiry ${enquiry.enquiryNumber} • Calculates per-unit landed cost`}
          maxWidth="2xl"
        >
          <form onSubmit={handleCreateSupplierQuote} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Supplier / Manufacturer *
                </label>
                <select
                  required
                  value={sqSupplierId}
                  onChange={(e) => setSqSupplierId(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s._id || s.id} value={s._id || s.id}>
                      {s.name} ({s.country})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Supplier RFQ Reference *
                </label>
                <input
                  type="text"
                  required
                  value={sqReference}
                  onChange={(e) => setSqReference(e.target.value)}
                  placeholder="e.g. RFQ-VALV-2026-902"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                >
                </input>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Unit Purchase Price ({enquiry.currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={sqUnitPrice}
                  onChange={(e) => setSqUnitPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Total Allocated Freight ({enquiry.currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={sqFreight}
                  onChange={(e) => setSqFreight(e.target.value)}
                  placeholder="e.g. 1200.00"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Total Customs / Duties / Clearance ({enquiry.currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={sqCustoms}
                  onChange={(e) => setSqCustoms(e.target.value)}
                  placeholder="e.g. 800.00"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Other Surcharges / Handling ({enquiry.currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={sqOther}
                  onChange={(e) => setSqOther(e.target.value)}
                  placeholder="e.g. 500.00"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lead Time (Weeks)
                </label>
                <input
                  type="number"
                  min="1"
                  value={sqLeadWeeks}
                  onChange={(e) => setSqLeadWeeks(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment Terms
                </label>
                <input
                  type="text"
                  value={sqTerms}
                  onChange={(e) => setSqTerms(e.target.value)}
                  placeholder="e.g. Net 60 Days"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Cost Allocation Notes
              </label>
              <textarea
                rows={2}
                value={sqNotes}
                onChange={(e) => setSqNotes(e.target.value)}
                placeholder="Ex-works location, port of loading, warranty included..."
                className="w-full py-2 px-3 rounded-xl border border-slate-200"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddSupplierQuoteModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sqSubmitting}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-700 hover:bg-amber-800 text-white shadow-xs transition-colors"
              >
                {sqSubmitting ? "Calculating & Saving..." : "Save Confidential Pricing"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardShell>
  );
}
