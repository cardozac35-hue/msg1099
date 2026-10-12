"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { StatCard } from "@/components/StatCard";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart3,
  Trophy,
  Clock,
  Send,
  Users,
  Target,
  Percent,
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
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#781F32", "#242C36", "#10B981", "#F59E0B", "#3B82F6", "#8B5CF6"];

export default function SalesReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch("/api/reports/sales");
        const json = await res.json();
        if (json.success) setData(json);
      } catch (err) {
        console.error("Sales report error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, []);

  const kpis = data?.kpis || {};
  const conversionData = data?.conversionData || [];
  const statusDistribution = data?.statusDistribution || [];

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-xl font-bold text-slate-900">Commercial Sales Performance & Pipeline Reports</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Conversion metrics, tender win/loss ratios, and salesperson activity benchmarks
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Tenders"
            value={kpis.totalEnquiries || 0}
            subtitle="Unique customer enquiries"
            icon={Target}
            badge="Register"
            badgeColor="maroon"
          />
          <StatCard
            title="Orders Won"
            value={kpis.wonEnquiries || 0}
            subtitle="Successfully closed tenders"
            icon={Trophy}
            badge="Awarded"
            badgeColor="green"
          />
          <StatCard
            title="Offers Out"
            value={kpis.quotationsSent || 0}
            subtitle="Active customer proposals"
            icon={Send}
            badge="Sent"
            badgeColor="amber"
          />
          <StatCard
            title="Win Conversion"
            value={`${kpis.conversionRate || "0.0"}%`}
            subtitle="Enquiry to award ratio"
            icon={Percent}
            badge="Win Rate"
            badgeColor="green"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Bar Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Enquiry Workflow Stages
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Unique enquiries grouped by stage (prevents revision double-counting)
            </p>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusDistribution}>
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
            </div>
          </div>

          {/* Salesperson Conversion Performance */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Salesperson Conversion Analysis
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Total enquiries allocated vs orders won by representative
            </p>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conversionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="name"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(n) => n.split(" ")[0]}
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
                  <Bar dataKey="enquiriesCount" fill="#242C36" radius={[4, 4, 0, 0]} name="Enquiries Handled" />
                  <Bar dataKey="wonCount" fill="#10B981" radius={[4, 4, 0, 0]} name="Orders Won" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Salesperson Conversion Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Commercial Representative Summary</h3>
            <p className="text-xs text-slate-500">Pipeline conversion and total value quoted</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px] border-b border-slate-200">
                  <th className="p-3.5">Representative Name</th>
                  <th className="p-3.5 text-right">Enquiries Handled</th>
                  <th className="p-3.5 text-right">Orders Won</th>
                  <th className="p-3.5 text-right">Win Ratio %</th>
                  <th className="p-3.5 text-right font-bold text-slate-900">Total Quoted Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {conversionData.map((sp: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3.5 font-bold text-slate-900">{sp.name}</td>
                    <td className="p-3.5 text-right font-semibold">{sp.enquiriesCount}</td>
                    <td className="p-3.5 text-right font-semibold text-emerald-700">{sp.wonCount}</td>
                    <td className="p-3.5 text-right font-bold text-maroon-700">
                      {sp.conversionRate}%
                    </td>
                    <td className="p-3.5 text-right font-bold text-slate-900">
                      {formatCurrency(sp.quotedValue, "USD")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
