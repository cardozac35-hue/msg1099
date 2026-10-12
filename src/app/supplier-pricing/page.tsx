"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  TrendingDown,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Building,
  ArrowRight,
  Calculator,
  Truck,
  Plus,
} from "lucide-react";

export default function SupplierPricingComparisonPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>("admin");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [meRes, sqRes, enqRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/supplier-quotes"),
          fetch("/api/enquiries"),
        ]);

        const meData = await meRes.json();
        if (meData.success && meData.user) {
          setUserRole(meData.user.role);
          if (meData.user.role !== "admin") {
            setError("Forbidden: Access restricted strictly to commercial administrators");
            setLoading(false);
            return;
          }
        }

        const sqData = await sqRes.json();
        const enqData = await enqRes.json();

        if (sqData.success) setQuotes(sqData.supplierQuotes || []);
        if (enqData.success) setEnquiries(enqData.enquiries || []);
      } catch (err: any) {
        setError(err.message || "Failed to load supplier quotes");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSelectQuote = async (quoteId: string, currentSelected: boolean) => {
    try {
      await fetch(`/api/supplier-quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSelected: !currentSelected }),
      });
      // Refresh local list
      const updated = quotes.map((q) =>
        q._id === quoteId || q.id === quoteId ? { ...q, isSelected: !currentSelected } : q
      );
      setQuotes(updated);
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
          <h3 className="text-base font-bold text-slate-900">Confidential Area Access Prohibited</h3>
          <p className="text-xs text-slate-500 mt-2">
            Supplier purchase costs, landed price calculations, and manufacturer margins are strictly restricted to administrators.
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

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">
                Supplier Price Comparison & Landed Cost Matrix
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                Admin Confidential
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-supplier RFQ evaluation, landed cost computation, and winning mill selection
            </p>
          </div>
        </div>

        {/* Formula Information Card */}
        <div className="bg-charcoal-800 rounded-2xl p-5 text-white shadow-md border border-charcoal-700">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Calculator className="w-4 h-4" />
            <span>Documented Industrial Landed Cost Calculation Engine</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-charcoal-700/60 p-3 rounded-xl border border-charcoal-600">
              <span className="font-semibold text-slate-300 block mb-1">Per-Unit Landed Cost Formula:</span>
              <code className="text-amber-200 font-mono text-[11px] block">
                Unit Cost = Purchase Price + (Freight / Qty) + (Customs / Qty) + Surcharges
              </code>
            </div>
            <div className="bg-charcoal-700/60 p-3 rounded-xl border border-charcoal-600">
              <span className="font-semibold text-slate-300 block mb-1">Total Landed Allocation:</span>
              <code className="text-amber-200 font-mono text-[11px] block">
                Total Landed = Unit Cost &times; Total Quoted Quantity
              </code>
            </div>
            <div className="bg-charcoal-700/60 p-3 rounded-xl border border-charcoal-600">
              <span className="font-semibold text-slate-300 block mb-1">Gross Profit & Margin Rule:</span>
              <code className="text-amber-200 font-mono text-[11px] block">
                Gross Profit = Selling Revenue (Ex-Tax) - Total Landed Cost
              </code>
            </div>
          </div>
        </div>

        {/* Quotes Comparison Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recorded Supplier Quotations ({quotes.length})</h3>
              <p className="text-xs text-slate-500">Cross-supplier benchmarking across active tenders</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-charcoal-50/70 border-b border-slate-200 text-charcoal-600 font-semibold uppercase text-[11px]">
                  <th className="p-3.5">Selected</th>
                  <th className="p-3.5">Supplier / Mill</th>
                  <th className="p-3.5">Supplier Ref</th>
                  <th className="p-3.5">Enquiry Match</th>
                  <th className="p-3.5 text-right">Quoted Qty</th>
                  <th className="p-3.5 text-right">Base Purchase Price</th>
                  <th className="p-3.5 text-right">Allocated Freight</th>
                  <th className="p-3.5 text-right">Customs / Duties</th>
                  <th className="p-3.5 text-right font-bold text-maroon-700">Unit Landed Cost</th>
                  <th className="p-3.5 text-right font-bold text-slate-900">Total Landed Cost</th>
                  <th className="p-3.5">Lead Time</th>
                  <th className="p-3.5">Payment Terms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {quotes.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-12 text-center text-slate-400">
                      No supplier quotations recorded yet.
                    </td>
                  </tr>
                ) : (
                  quotes.map((q) => {
                    const matchingEnquiry = enquiries.find(
                      (e) => (e._id === q.enquiryId || e.id === q.enquiryId)
                    );

                    return (
                      <tr
                        key={q._id || q.id}
                        className={q.isSelected ? "bg-amber-50/40 font-medium" : "hover:bg-slate-50"}
                      >
                        <td className="p-3.5">
                          <button
                            type="button"
                            onClick={() => handleSelectQuote(q._id || q.id, q.isSelected)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                              q.isSelected
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {q.isSelected ? "Selected" : "Select"}
                          </button>
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">{q.supplierName}</td>
                        <td className="p-3.5 font-mono">{q.supplierReference}</td>
                        <td className="p-3.5">
                          {matchingEnquiry ? (
                            <Link
                              href={`/enquiries/${matchingEnquiry._id || matchingEnquiry.id}`}
                              className="text-maroon-700 font-bold hover:underline"
                            >
                              {matchingEnquiry.enquiryNumber}
                            </Link>
                          ) : (
                            <span className="text-slate-400">Enquiry #{q.enquiryId}</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right font-semibold">
                          {q.quantity} {q.unitOfMeasure}
                        </td>
                        <td className="p-3.5 text-right font-semibold">
                          {formatCurrency(q.unitPurchasePrice, q.currency)}
                        </td>
                        <td className="p-3.5 text-right text-slate-500">
                          +{formatCurrency(q.allocatedFreight || 0, q.currency)}
                        </td>
                        <td className="p-3.5 text-right text-slate-500">
                          +{formatCurrency(q.allocatedCustomsDuties || 0, q.currency)}
                        </td>
                        <td className="p-3.5 text-right font-bold text-maroon-700">
                          {formatCurrency(q.calculatedUnitLandedCost, q.currency)}
                        </td>
                        <td className="p-3.5 text-right font-bold text-slate-900">
                          {formatCurrency(q.calculatedTotalLandedCost, q.currency)}
                        </td>
                        <td className="p-3.5">{q.leadTimeWeeks} Weeks</td>
                        <td className="p-3.5">{q.paymentTerms}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
