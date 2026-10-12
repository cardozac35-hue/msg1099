"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  FileQuestion,
  FileCheck,
  Send,
  Clock,
  Trophy,
  Percent,
  Plus,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const PIE_COLORS = ["#3B82F6", "#F59E0B", "#8B5CF6", "#10B981", "#0D9488", "#EF4444"];

export default function DashboardPage() {
  const [salesData, setSalesData] = useState<any>(null);
  const [marginData, setMarginData] = useState<any>(null);
  const [recentEnquiries, setRecentEnquiries] = useState<any[]>([]);
  const [upcomingFollowUps, setUpcomingFollowUps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [salesRes, enqRes, fuRes] = await Promise.all([
          fetch("/api/reports/sales"),
          fetch("/api/enquiries"),
          fetch("/api/follow-ups"),
        ]);

        const salesJson = await salesRes.json();
        const enqJson = await enqRes.json();
        const fuJson = await fuRes.json();

        if (salesJson.success) setSalesData(salesJson);
        if (enqJson.success) setRecentEnquiries(enqJson.enquiries.slice(0, 5));
        if (fuJson.success) {
          const pending = fuJson.followUps.filter((f: any) => f.status === "pending");
          setUpcomingFollowUps(pending.slice(0, 5));
        }

        // If user is admin, fetch margin analytics
        if (salesJson.userRole === "admin") {
          const marginRes = await fetch("/api/reports/margins");
          const marginJson = await marginRes.json();
          if (marginJson.success) setMarginData(marginJson);
        }
      } catch (err) {
        console.error("Dashboard data fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const kpis = salesData?.kpis || {};
  const isAdmin = salesData?.userRole === "admin";

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Page Top Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Executive Commercial Dashboard
              </h2>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  Admin Executive Mode
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Apex Oilfield & Gas Equipment • Real-time Tender Register & Commercial Metrics
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/enquiries/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-maroon-600 hover:bg-maroon-700 rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create RFQ / Enquiry</span>
            </Link>
          </div>
        </div>

        {/* Commercial KPI Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Enquiries"
            value={kpis.totalEnquiries || 0}
            subtitle="Unique customer enquiries registered"
            icon={FileQuestion}
            badge="Pipeline"
            badgeColor="maroon"
          />
          <StatCard
            title="Open Enquiries"
            value={kpis.openEnquiries || 0}
            subtitle="Active tender review & pricing"
            icon={Clock}
            badge="In Progress"
            badgeColor="amber"
          />
          <StatCard
            title="Quotations Sent"
            value={kpis.quotationsSent || 0}
            subtitle="Commercial offers submitted"
            icon={Send}
            badge="Out to Client"
            badgeColor="green"
          />
          <StatCard
            title="Conversion Rate"
            value={`${kpis.conversionRate || "0.0"}%`}
            subtitle={`${kpis.wonEnquiries || 0} won / ${kpis.totalEnquiries || 0} enquiries`}
            icon={Trophy}
            badge="Win / Total"
            badgeColor="green"
          />
        </div>

        {/* Due Follow-ups Alert Banner if any overdue */}
        {(kpis.followUpsDue > 0 || kpis.followUpsOverdue > 0) && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-amber-900">
                  Attention: Follow-ups Require Customer Engagement
                </p>
                <p className="text-[11px] text-amber-700">
                  {kpis.followUpsOverdue} follow-up(s) overdue, {kpis.followUpsDue} due today.
                </p>
              </div>
            </div>
            <Link
              href="/follow-ups"
              className="text-xs font-bold text-amber-900 hover:text-amber-950 underline"
            >
              Review Pipeline &rarr;
            </Link>
          </div>
        )}

        {/* ADMIN-ONLY CONFIDENTIAL PROFIT & MARGIN CARDS */}
        {isAdmin && marginData?.summary && (
          <div className="bg-gradient-to-r from-charcoal-700 to-charcoal-800 rounded-2xl p-6 text-white shadow-lg border border-charcoal-600">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold tracking-wider uppercase text-amber-300">
                  Confidential Profitability & Gross Margin Overview (Admin Only)
                </h3>
              </div>
              <span className="text-[11px] text-slate-300">
                Formula: GP = Revenue - Landed Cost (Ex-Tax)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-charcoal-600/70 p-4 rounded-xl border border-charcoal-500/60">
                <span className="text-[11px] text-slate-300 font-medium block">
                  Total Quoted Revenue (Ex-Tax)
                </span>
                <span className="text-2xl font-bold text-white block mt-1">
                  {formatCurrency(marginData.summary.totalRevenue, "USD")}
                </span>
              </div>

              <div className="bg-charcoal-600/70 p-4 rounded-xl border border-charcoal-500/60">
                <span className="text-[11px] text-slate-300 font-medium block">
                  Total Supplier Landed Cost
                </span>
                <span className="text-2xl font-bold text-slate-200 block mt-1">
                  {formatCurrency(marginData.summary.totalLandedCost, "USD")}
                </span>
              </div>

              <div className="bg-charcoal-600/70 p-4 rounded-xl border border-charcoal-500/60">
                <span className="text-[11px] text-slate-300 font-medium block">
                  Total Gross Profit
                </span>
                <span className="text-2xl font-bold text-emerald-400 block mt-1">
                  {formatCurrency(marginData.summary.totalGrossProfit, "USD")}
                </span>
              </div>

              <div className="bg-charcoal-600/70 p-4 rounded-xl border border-charcoal-500/60">
                <span className="text-[11px] text-slate-300 font-medium block">
                  Overall Gross Margin %
                </span>
                <span className="text-2xl font-bold text-amber-400 block mt-1">
                  {marginData.summary.overallGrossMarginPercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Visual Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enquiry Status Distribution */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Enquiry Status Distribution
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Unique tender allocation by commercial workflow stage
            </p>
            <div className="h-64 w-full">
              {salesData?.statusDistribution ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData.statusDistribution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#242C36",
                        border: "none",
                        borderRadius: "8px",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="value" fill="#781F32" radius={[4, 4, 0, 0]} name="Enquiries" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Loading charts...
                </div>
              )}
            </div>
          </div>

          {/* Salesperson Activity & Performance */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Salesperson Pipeline Activity
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enquiries managed vs. orders successfully closed
            </p>
            <div className="h-64 w-full">
              {salesData?.conversionData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData.conversionData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="name"
                      stroke="#94A3B8"
                      fontSize={10}
                      tickLine={false}
                      tickFormatter={(name) => name.split(" ")[0]}
                    />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#242C36",
                        border: "none",
                        borderRadius: "8px",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="enquiriesCount" fill="#242C36" radius={[4, 4, 0, 0]} name="Enquiries" />
                    <Bar dataKey="wonCount" fill="#10B981" radius={[4, 4, 0, 0]} name="Orders Won" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Loading charts...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Enquiries & Follow-ups Table Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Enquiries Register (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Customer Enquiries</h3>
                <p className="text-xs text-slate-500">Shared active RFQ tender register</p>
              </div>
              <Link
                href="/enquiries"
                className="text-xs font-semibold text-maroon-600 hover:text-maroon-700 flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {recentEnquiries.map((enq) => (
                <Link
                  key={enq._id || enq.id}
                  href={`/enquiries/${enq._id || enq.id}`}
                  className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors block"
                >
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {enq.enquiryNumber}
                      </span>
                      <StatusBadge status={enq.status} />
                    </div>
                    <p className="text-xs text-slate-600 font-medium truncate mt-1">
                      {enq.customerName}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      Assigned: {enq.assignedToName} • {formatDate(enq.createdAt)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-800 block">
                      {formatCurrency(enq.targetPriceTotal || 0, enq.currency || "USD")}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase">Target Total</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Due Pipeline Follow-ups (1 Col) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Upcoming Follow-ups</h3>
                <p className="text-xs text-slate-500">Pending customer touchpoints</p>
              </div>
              <Link
                href="/follow-ups"
                className="text-xs font-semibold text-maroon-600 hover:text-maroon-700 flex items-center gap-1"
              >
                <span>Manage</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 p-2">
              {upcomingFollowUps.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No upcoming follow-ups scheduled.
                </div>
              ) : (
                upcomingFollowUps.map((fu) => (
                  <div key={fu._id || fu.id} className="p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {fu.customerName}
                      </span>
                      <span className="text-[10px] font-semibold text-maroon-700 bg-maroon-50 px-2 py-0.5 rounded border border-maroon-200 shrink-0">
                        {formatDate(fu.scheduledDate)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2">{fu.notes || "Follow-up discussion."}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Enq: {fu.enquiryNumber} • Owner: {fu.assignedToName}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
