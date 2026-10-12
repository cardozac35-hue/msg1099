"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
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
  Flame,
  FlaskConical,
  CheckCheck,
  FolderSync,
  ExternalLink,
} from "lucide-react";

interface SidebarProps {
  pendingCount?: number;
  missingCount?: number;
}

export function Sidebar({ pendingCount = 2, missingCount = 1 }: SidebarProps) {
  const pathname = usePathname();

  const coreNavItems = [
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

  const specializedMSGTools = [
    {
      name: "MTC Chemical & Mech Analyzer",
      href: "/dashboard/documents/mtc-analyzer",
      icon: FlaskConical,
      badge: "MSG AI",
      badgeColor: "bg-amber-500/20 text-amber-300 border border-amber-500/40",
      description: "CEV, NACE MR0175, Charpy -46°C",
    },
    {
      name: "Project Specs Matrix",
      href: "/dashboard/documents/project-specs",
      icon: CheckCheck,
      badge: "ARAMCO/ADNOC",
      badgeColor: "bg-blue-500/20 text-blue-300 border border-blue-500/40",
      description: "01-SAMSS-035, DGS-1300, PDO SP",
    },
    {
      name: "Bulk Heat No. Matcher",
      href: "/dashboard/documents/bulk-upload",
      icon: FolderSync,
      badge: "AUTO",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40",
      description: "Batch MTC & PO line assignment",
    },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 text-slate-300 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/80">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center shadow-md border border-slate-700 shrink-0">
            {/* Fallback to image tag with local /msg-logo.png and remote fallback */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/msg-logo.png"
              alt="MSG Oilfield Logo"
              className="max-h-full max-w-full object-contain"
              onError={(e) => {
                // If local fails, try remote
                const target = e.target as HTMLImageElement;
                if (!target.src.includes("msgoilfield.com")) {
                  target.src = "https://www.msgoilfield.com/logo.png";
                }
              }}
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-white font-bold text-sm tracking-tight leading-tight truncate">
              MSG OILFIELD
            </h1>
            <p className="text-[10px] text-amber-400 font-medium tracking-wider uppercase truncate">
              Material Solutions Grid
            </p>
            <p className="text-[9px] text-slate-400 truncate">
              Dubai, UAE • Sourcing Systematic
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation Section */}
      <div className="p-3 flex-1 overflow-y-auto space-y-4">
        {/* Specialized Oilfield Suite Section */}
        <div>
          <div className="px-3 pt-2 pb-1.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              MSG Oilfield Tools
            </span>
            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-mono">
              SPEC
            </span>
          </div>
          <div className="mt-1 space-y-1">
            {specializedMSGTools.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex flex-col px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-amber-600/90 text-white shadow-sm font-semibold"
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? "text-white" : "text-amber-400"
                        }`}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${item.badgeColor}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 group-hover:text-slate-300 pl-6 mt-0.5 truncate">
                    {item.description}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Core Material Documents Module 5 */}
        <div>
          <div className="px-3 pt-2 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Material Documents</span>
            <span className="text-[9px] bg-slate-800 text-slate-300 px-1 py-0.2 rounded font-mono">
              MOD 5
            </span>
          </div>

          <nav className="mt-1 space-y-0.5">
            {coreNavItems.map((item) => {
              const isActive =
                item.href === "/dashboard/documents"
                  ? pathname === "/dashboard/documents" || pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-semibold"
                      : item.highlight
                      ? "text-blue-400 hover:bg-slate-900 hover:text-white"
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
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

        {/* Commercial Pipeline Cross-Link */}
        <div className="pt-2 border-t border-slate-800/80">
          <Link
            href="/master-sheet"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition"
          >
            <span>Commercial Master Sheet</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </Link>
        </div>
      </div>

      {/* Compliance Standard Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950 text-[11px] text-slate-400">
        <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1">
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          <span>MSG Quality Assurance</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
          EN 10204 3.1 & 3.2 • NACE MR0175 • Aramco 01-SAMSS-035 • ADNOC DGS
        </p>
        <p className="text-[9px] text-slate-500 mt-1">
          Stockist: Pipes, Valves, Fittings & Flanges
        </p>
      </div>
    </aside>
  );
}
