"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Files,
  UploadCloud,
  Network,
  ClipboardList,
  Clock,
  AlertCircle,
  CalendarDays,
  FileCheck2,
  History,
  Sliders,
  Shield,
  Layers,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  pendingCount?: number;
  missingCount?: number;
}

export function Sidebar({ pendingCount = 2, missingCount = 1 }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Document Dashboard",
      href: "/dashboard/documents",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: "All Documents",
      href: "/dashboard/documents/all",
      icon: Files,
      badge: null,
    },
    {
      name: "Upload Document",
      href: "/dashboard/documents/upload",
      icon: UploadCloud,
      badge: null,
      highlight: true,
    },
    {
      name: "Material Traceability",
      href: "/dashboard/documents/traceability",
      icon: Network,
      badge: null,
    },
    {
      name: "Order Documents",
      href: "/dashboard/documents/order-documents",
      icon: ClipboardList,
      badge: null,
    },
    {
      name: "Pending Reviews",
      href: "/dashboard/documents/pending-reviews",
      icon: Clock,
      badge: pendingCount > 0 ? pendingCount : null,
      badgeColor: "bg-amber-500 text-white",
    },
    {
      name: "Missing Documents",
      href: "/dashboard/documents/missing-documents",
      icon: AlertCircle,
      badge: missingCount > 0 ? missingCount : null,
      badgeColor: "bg-rose-500 text-white",
    },
    {
      name: "Expiry Tracking",
      href: "/dashboard/documents/expiry-tracking",
      icon: CalendarDays,
      badge: null,
    },
    {
      name: "Document Requirements",
      href: "/dashboard/documents/requirements",
      icon: FileCheck2,
      badge: null,
    },
    {
      name: "Audit History",
      href: "/dashboard/documents/audit-history",
      icon: History,
      badge: null,
    },
    {
      name: "Document Settings",
      href: "/dashboard/documents/settings",
      icon: Sliders,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 font-bold">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-white font-semibold text-sm tracking-tight leading-tight">
            Apex Oilfield ERP
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">Quality & Cert Hub</p>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="p-3 flex-1 overflow-y-auto">
        <div className="px-3 pt-2 pb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Material Documents</span>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
            MOD 5
          </span>
        </div>

        <nav className="mt-1 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard/documents"
                ? pathname === "/dashboard/documents" || pathname === "/dashboard"
                : pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-semibold"
                    : item.highlight
                    ? "text-blue-400 hover:bg-slate-800/80 hover:text-white"
                    : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />
                  <span className="truncate">{item.name}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.badge !== null && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        item.badgeColor || "bg-slate-800 text-slate-200"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-200" />}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Compliance Standard Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400">
        <div className="flex items-center gap-2 text-slate-300 font-medium mb-1">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>Industrial Compliance</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          EN 10204 3.1 & 3.2 • ASME SEC II / VIII • API 6D • NACE MR0175
        </p>
      </div>
    </aside>
  );
}
