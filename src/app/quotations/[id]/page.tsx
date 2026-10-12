"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  FileDown,
  GitBranch,
  Building,
  CheckCircle2,
  XCircle,
  Send,
  ShieldCheck,
  ShieldAlert,
  Percent,
  TrendingUp,
  AlertTriangle,
  Clock,
} from "lucide-react";

export default function QuotationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [quotation, setQuotation] = useState<any>(null);
  const [marginAnalysis, setMarginAnalysis] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("salesperson");
  const [loading, setLoading] = useState(true);

  // Revision Modal State
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisedItems, setRevisedItems] = useState<any[]>([]);
  const [revisedValidity, setRevisedValidity] = useState("");
  const [revisedLeadTime, setRevisedLeadTime] = useState("");
  const [revisedPaymentTerms, setRevisedPaymentTerms] = useState("");
  const [revisedDeliveryTerms, setRevisedDeliveryTerms] = useState("");
  const [revisedDiscount, setRevisedDiscount] = useState(0);
  const [revisedTax, setRevisedTax] = useState(5);
  const [revisedNotes, setRevisedNotes] = useState("");
  const [revising, setRevising] = useState(false);

  const fetchQuotation = async () => {
    try {
      const res = await fetch(`/api/quotations/${id}`);
      const data = await res.json();
      if (data.success) {
        setQuotation(data.quotation);
        setMarginAnalysis(data.marginAnalysis); // null for salespeople, present for admin
        setUserRole(data.userRole || "salesperson");

        // Prep revision default values
        const q = data.quotation;
        setRevisedValidity(
          q.validityDate
            ? new Date(q.validityDate).toISOString().split("T")[0]
            : ""
        );
        setRevisedLeadTime(q.leadTime || "4-6 Weeks ARO");
        setRevisedPaymentTerms(q.paymentTerms || "Net 30 Days");
        setRevisedDeliveryTerms(q.deliveryTerms || "FOB Dubai Port (Incoterms 2020)");
        setRevisedDiscount(q.discountPercent || 0);
        setRevisedTax(q.taxPercent || 5);
        setRevisedNotes(q.notes || "");
        setRevisedItems(
          (q.items || []).map((it: any) => ({
            ...it,
            unitSellingPrice: it.unitSellingPrice,
            discountPercent: it.discountPercent || 0,
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching quotation:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchQuotation();
  }, [id]);

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/quotations/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchQuotation();
      }
    } catch {
      // Ignore
    }
  };

  const handleCreateRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    setRevising(true);
    try {
      const res = await fetch(`/api/quotations/${id}/revise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          validityDate: revisedValidity,
          deliveryTerms: revisedDeliveryTerms,
          paymentTerms: revisedPaymentTerms,
          leadTime: revisedLeadTime,
          discountPercent: revisedDiscount,
          taxPercent: revisedTax,
          notes: revisedNotes,
          items: revisedItems,
        }),
      });

      const data = await res.json();
      if (data.success && data.quotation) {
        setShowRevisionModal(false);
        router.push(`/quotations/${data.quotation._id || data.quotation.id}`);
      }
    } catch {
      // Ignore
    } finally {
      setRevising(false);
    }
  };

  if (loading || !quotation) {
    return (
      <DashboardShell>
        <div className="p-12 text-center text-xs text-slate-400">
          Loading quotation details...
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/quotations"
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 font-sans">
                  {quotation.quotationCode}
                </h2>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-maroon-50 text-maroon-700 border border-maroon-200">
                  REV {quotation.revision}
                </span>
                <StatusBadge status={quotation.status} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Linked Enquiry:{" "}
                <Link
                  href={`/enquiries/${quotation.enquiryId}`}
                  className="font-bold text-maroon-700 hover:underline"
                >
                  {quotation.enquiryNumber}
                </Link>{" "}
                • Issued by {quotation.createdByName} on {formatDate(quotation.createdAt)}
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`/api/pdf/quotation/${quotation._id || quotation.id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors"
            >
              <FileDown className="w-4 h-4 text-maroon-600" />
              <span>Download PDF</span>
            </a>

            {/* Revision Action */}
            <button
              type="button"
              onClick={() => setShowRevisionModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-charcoal-700 hover:bg-charcoal-800 text-white shadow-xs transition-colors"
            >
              <GitBranch className="w-3.5 h-3.5 text-amber-300" />
              <span>Revise Offer (R{quotation.revision + 1})</span>
            </button>

            {/* Status Transition Buttons */}
            {quotation.status === "draft" && (
              <button
                type="button"
                onClick={() => handleUpdateStatus("sent")}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-maroon-600 hover:bg-maroon-700 text-white shadow-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Transmit to Client</span>
              </button>
            )}

            {quotation.status === "sent" && (
              <>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("accepted")}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Won</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("declined")}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Mark Lost</span>
                </button>
              </>
            )}

            {/* Admin Approval Actions */}
            {userRole === "admin" && quotation.status === "pending_approval" && (
              <>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("approved")}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve Margin</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("rejected")}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-rose-700 hover:bg-rose-800 text-white shadow-xs transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Commercial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Customer Account
            </span>
            <span className="text-sm font-bold text-slate-900 block">{quotation.customerName}</span>
            <span className="text-xs text-slate-600 block">Attn: {quotation.contactName}</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Commercial Terms
            </span>
            <span className="text-xs text-slate-700 block font-medium">
              Delivery: {quotation.deliveryTerms}
            </span>
            <span className="text-xs text-slate-700 block font-medium">
              Payment: {quotation.paymentTerms}
            </span>
            <span className="text-xs text-slate-700 block font-medium">
              Lead Time: {quotation.leadTime}
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Total Quotation Value
            </span>
            <span className="text-xl font-bold text-maroon-700 block">
              {formatCurrency(quotation.totalAmount, quotation.currency)}
            </span>
            <span className="text-xs text-slate-500 block">
              Valid until {formatDate(quotation.validityDate)}
            </span>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Quoted Product Lines</h3>
            <span className="text-xs text-slate-500">Immutable snapshot of technical items</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-charcoal-50/70 border-b border-slate-200 text-charcoal-600 font-semibold uppercase text-[11px]">
                  <th className="p-3.5">#</th>
                  <th className="p-3.5">Item Description & Specifications</th>
                  <th className="p-3.5 text-right">Quantity</th>
                  <th className="p-3.5 text-right">Unit Price ({quotation.currency})</th>
                  <th className="p-3.5 text-right">Discount</th>
                  <th className="p-3.5 text-right">Line Net Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {quotation.items?.map((it: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-3.5 font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 block">{it.itemDescription}</span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {it.materialGrade} • {it.size} • {it.pressureClass} • {it.standard}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-bold">
                      {it.quantity} {it.unitOfMeasure}
                    </td>
                    <td className="p-3.5 text-right font-semibold">
                      {formatCurrency(it.unitSellingPrice, quotation.currency)}
                    </td>
                    <td className="p-3.5 text-right text-slate-500">
                      {it.discountPercent ? `${it.discountPercent}%` : "-"}
                    </td>
                    <td className="p-3.5 text-right font-bold text-slate-900">
                      {formatCurrency(it.lineTotal, quotation.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Subtotal & Taxes Section */}
          <div className="p-5 border-t border-slate-200 bg-slate-50/50 flex justify-end">
            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-bold text-slate-800">
                  {formatCurrency(quotation.subtotal, quotation.currency)}
                </span>
              </div>
              {quotation.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Overall Discount ({quotation.discountPercent}%):</span>
                  <span>-{formatCurrency(quotation.discountAmount, quotation.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>VAT / Tax ({quotation.taxPercent}%):</span>
                <span className="font-bold text-slate-800">
                  {formatCurrency(quotation.taxAmount, quotation.currency)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-300 flex justify-between text-sm font-bold text-maroon-700">
                <span>TOTAL AMOUNT:</span>
                <span>{formatCurrency(quotation.totalAmount, quotation.currency)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ADMIN ONLY: CONFIDENTIAL PROFIT & MARGIN ANALYSIS */}
        {userRole === "admin" && marginAnalysis ? (
          <div className="bg-white rounded-2xl border border-amber-300 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-amber-950 uppercase tracking-wide">
                  Confidential Profit & Landed Margin Analysis (Admin Only)
                </h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                Calculated Ex-Tax
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">Matched Supplier:</span>
                <span className="font-bold text-slate-900 block mt-1">
                  {marginAnalysis.supplierName}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Ref: {marginAnalysis.supplierReference}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">Supplier Landed Cost (Total):</span>
                <span className="font-bold text-slate-900 block mt-1 text-sm">
                  {formatCurrency(marginAnalysis.totalLandedCost, quotation.currency)}
                </span>
                <span className="text-[11px] text-slate-500">
                  Unit Landed: {formatCurrency(marginAnalysis.unitLandedCost, quotation.currency)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-emerald-700 block font-semibold">Total Gross Profit:</span>
                <span className="font-bold text-emerald-900 block mt-1 text-sm">
                  {formatCurrency(marginAnalysis.grossProfit, quotation.currency)}
                </span>
                <span className="text-[11px] text-emerald-700">
                  Selling - Landed Cost
                </span>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-amber-800 block font-semibold">Gross Margin %:</span>
                <span className="font-bold text-amber-950 block mt-1 text-sm">
                  {marginAnalysis.grossMarginPercent.toFixed(2)}%
                </span>
                <span className="text-[11px] text-amber-700">
                  (Profit / Ex-Tax Revenue) &times; 100
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* SALESPERSON VIEW: STRICT RBAC NOTICE */
          <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-slate-400" />
              <span>
                Confidentiality Notice: Supplier purchase prices and profit margins are not accessible to salesperson accounts.
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">
              Strict RBAC Enforced
            </span>
          </div>
        )}

        {/* MODAL: Revise Quotation */}
        <Modal
          isOpen={showRevisionModal}
          onClose={() => setShowRevisionModal(false)}
          title={`Generate Revision: ${quotation.quotationNumber}-R${quotation.revision + 1}`}
          subtitle="Creates an immutable new revision. The current revision will be preserved as historical record."
          maxWidth="2xl"
        >
          <form onSubmit={handleCreateRevision} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900">
              <span className="font-bold block">Revision Policy:</span>
              <p className="text-[11px] mt-0.5">
                Current quotation <strong>{quotation.quotationCode}</strong> will be archived as &apos;revised&apos;.
                A new official revision <strong>{quotation.quotationNumber}-R{quotation.revision + 1}</strong> will be created.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Validity Date *
                </label>
                <input
                  type="date"
                  required
                  value={revisedValidity}
                  onChange={(e) => setRevisedValidity(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lead Time
                </label>
                <input
                  type="text"
                  value={revisedLeadTime}
                  onChange={(e) => setRevisedLeadTime(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Delivery Terms (Incoterms)
                </label>
                <input
                  type="text"
                  value={revisedDeliveryTerms}
                  onChange={(e) => setRevisedDeliveryTerms(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment Terms
                </label>
                <input
                  type="text"
                  value={revisedPaymentTerms}
                  onChange={(e) => setRevisedPaymentTerms(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-bold text-slate-800">
                Adjust Line Item Selling Prices:
              </label>
              {revisedItems.map((it, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-slate-900 block truncate">
                      {it.itemDescription}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Qty: {it.quantity} {it.unitOfMeasure}
                    </span>
                  </div>
                  <div className="w-36">
                    <label className="text-[10px] text-slate-500 block mb-0.5">Unit Selling Price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={it.unitSellingPrice}
                      onChange={(e) => {
                        const updated = [...revisedItems];
                        updated[idx].unitSellingPrice = parseFloat(e.target.value) || 0;
                        setRevisedItems(updated);
                      }}
                      className="w-full py-1.5 px-2 rounded-lg border border-slate-200 bg-white font-bold"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Revision Notes (Reason for Revision)
              </label>
              <textarea
                rows={2}
                value={revisedNotes}
                onChange={(e) => setRevisedNotes(e.target.value)}
                placeholder="Client requested price discount, extended validity, or altered delivery schedule..."
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={revising}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-charcoal-700 hover:bg-charcoal-800 text-white shadow-xs transition-colors"
              >
                {revising ? "Compiling Revision..." : `Create Revision R${quotation.revision + 1}`}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardShell>
  );
}
