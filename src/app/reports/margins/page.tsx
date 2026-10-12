"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { formatCurrency } from "@/lib/utils";
import {
  ShieldCheck,
  ShieldAlert,
  Percent,
  TrendingUp,
  DollarSign,
  Truck,
  ArrowRight,
  Calculator,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function ProfitMarginReportsPage() {
  const [data, setData] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("admin");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMarginData() {
      try {
        const [meRes, marginRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/reports/margins"),
        ]);

        const meData = await meRes.json();
        if (meData.success && meData.user) {
          setUserRole(meData.user.role);
          if (meData.user.role !== "admin") {
            setError("Forbidden: Administrator access required");
            setLoading(false);
            return;
          }
        }

        const marginData = await marginRes.json();
        if (marginData.success) {
          setData(marginData);
        } else {
          setError(marginData.error || "Failed to load profitability metrics");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    }
    fetchMarginData();
  }, []);

  if (userRole !== "admin") {
    return (
      <DashboardShell>
        <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl border border-rose-200 shadow-md text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Restricted Commercial Area</h3>
          <p className="text-xs text-slate-500 mt-2">
            Profitability reports, supplier landed costs, and margin calculations are strictly restricted to administrators.
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

  const summary = data?.summary || {};
  const profitabilityList = data?.profitabilityList || [];
  const supplierLeadTimes = data?.supplierLeadTimes || [];

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">Commercial Profit & Landed Margin Reports</h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                Strict Admin Privilege
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Net revenue vs supplier landed cost, gross profit benchmarks, and mill delivery times
            </p>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Quoted Revenue (Ex-Tax)
            </span>
            <span className="text-2xl font-bold text-slate-900 block mt-2">
              {formatCurrency(summary.totalRevenue || 0, "USD")}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">Net customer selling value</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Total Landed Cost
            </span>
            <span className="text-2xl font-bold text-slate-700 block mt-2">
              {formatCurrency(summary.totalLandedCost || 0, "USD")}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">Purchase + Freight + Duties</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Total Gross Profit
            </span>
            <span className="text-2xl font-bold text-emerald-600 block mt-2">
              {formatCurrency(summary.totalGrossProfit || 0, "USD")}
            </span>
            <span className="text-[11px] text-emerald-600 mt-1 block font-medium">Revenue - Landed Cost</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Overall Gross Margin %
            </span>
            <span className="text-2xl font-bold text-amber-600 block mt-2">
              {(summary.overallGrossMarginPercent || 0).toFixed(2)}%
            </span>
            <span className="text-[11px] text-amber-700 mt-1 block font-medium">(GP / Revenue) &times; 100</span>
          </div>
        </div>

        {/* Supplier Lead Time Benchmark Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Supplier Delivery Lead Times Benchmarking
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Average manufacturing lead times (Weeks) across approved partner mills
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={supplierLeadTimes}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="supplierName" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} unit=" wks" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#242C36",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="leadTimeWeeks" fill="#781F32" radius={[4, 4, 0, 0]} name="Lead Time (Weeks)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quotation Profitability Breakdown Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Quotation Profitability Matrix</h3>
              <p className="text-xs text-slate-500">Purchase cost vs selling price and gross profit margin</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px] border-b border-slate-200">
                  <th className="p-3.5">Quote Ref</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Item Description</th>
                  <th className="p-3.5">Supplier</th>
                  <th className="p-3.5 text-right">Unit Purchase</th>
                  <th className="p-3.5 text-right">Unit Landed</th>
                  <th className="p-3.5 text-right font-bold text-slate-900">Unit Selling</th>
                  <th className="p-3.5 text-right">Revenue (Ex-Tax)</th>
                  <th className="p-3.5 text-right font-bold text-emerald-700">Gross Profit</th>
                  <th className="p-3.5 text-right font-bold text-amber-700">Gross Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {profitabilityList.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-slate-400">
                      No quotation profitability data to display. Link quotations to supplier quotes to view margin analysis.
                    </td>
                  </tr>
                ) : (
                  profitabilityList.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold text-maroon-700">{row.quotationCode}</td>
                      <td className="p-3.5 font-semibold text-slate-900">{row.customerName}</td>
                      <td className="p-3.5 max-w-xs truncate">{row.productDescription}</td>
                      <td className="p-3.5">{row.supplierName}</td>
                      <td className="p-3.5 text-right font-mono">
                        {formatCurrency(row.unitPurchasePrice, "USD")}
                      </td>
                      <td className="p-3.5 text-right font-mono text-maroon-700 font-semibold">
                        {formatCurrency(row.unitLandedCost, "USD")}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(row.unitSellingPrice, "USD")}
                      </td>
                      <td className="p-3.5 text-right font-mono font-semibold">
                        {formatCurrency(row.revenue, "USD")}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-700">
                        {formatCurrency(row.grossProfit, "USD")}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-amber-700">
                        {row.grossMarginPercent.toFixed(2)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
