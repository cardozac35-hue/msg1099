"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileQuestion,
  PlusCircle,
  Users,
  Package,
  Truck,
  TrendingDown,
  FileSpreadsheet,
  FileText,
  CalendarClock,
  Table,
  BarChart3,
  Percent,
  FolderLock,
  UserCheck,
  History,
  Settings,
  LogOut,
  Flame,
  ShieldCheck,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  userRole?: "admin" | "salesperson";
  userName?: string;
  userEmail?: string;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  userRole = "salesperson",
  userName = "User",
  userEmail = "user@oilgashub.com",
  isOpenMobile = false,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  const navGroups = [
    {
      label: "Commercial Core",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "All Enquiries", href: "/enquiries", icon: FileQuestion },
        { label: "New Enquiry", href: "/enquiries/new", icon: PlusCircle },
        { label: "Shared Master Sheet", href: "/master-sheet", icon: Table },
      ],
    },
    {
      label: "Catalogs & Partners",
      items: [
        { label: "Customers & Contacts", href: "/customers", icon: Users },
        { label: "Product Catalogue", href: "/products", icon: Package },
        { label: "Supplier Directory", href: "/suppliers", icon: Truck },
        // ADMIN ONLY
        ...(userRole === "admin"
          ? [
              {
                label: "Supplier Pricing (Confidential)",
                href: "/supplier-pricing",
                icon: TrendingDown,
                adminOnly: true,
              },
            ]
          : []),
      ],
    },
    {
      label: "Quotations & Pipeline",
      items: [
        { label: "⚡ Excel to Quote", href: "/excel-to-quote", icon: FileSpreadsheet },
        { label: "Quotation Builder", href: "/quotations/builder", icon: FileText },
        { label: "All Quotations", href: "/quotations", icon: FileSpreadsheet },
        { label: "Follow-ups", href: "/follow-ups", icon: CalendarClock },
        { label: "Document Library", href: "/documents", icon: FolderLock },
      ],
    },
    {
      label: "Intelligence & Reports",
      items: [
        { label: "Sales Reports", href: "/reports/sales", icon: BarChart3 },
        // ADMIN ONLY
        ...(userRole === "admin"
          ? [
              {
                label: "Profit & Margins",
                href: "/reports/margins",
                icon: Percent,
                adminOnly: true,
              },
            ]
          : []),
      ],
    },
    // ADMIN ONLY GOVERNANCE
    ...(userRole === "admin"
      ? [
          {
            label: "System Administration",
            items: [
              { label: "User Management", href: "/admin/users", icon: UserCheck, adminOnly: true },
              { label: "Audit Logs", href: "/admin/audit-logs", icon: History, adminOnly: true },
              { label: "Settings & Rules", href: "/admin/settings", icon: Settings, adminOnly: true },
            ],
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Persistent Desktop Sidebar & Sliding Mobile Drawer */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 w-64 bg-charcoal-500 text-slate-300 flex flex-col border-r border-charcoal-700/60 transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Banner */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-charcoal-700/80 bg-charcoal-600/50">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-maroon-600 flex items-center justify-center text-white shadow-md group-hover:bg-maroon-500 transition-colors">
              <Flame className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white block font-sans">
                OIL & GAS
              </span>
              <span className="text-[10px] tracking-widest uppercase font-semibold text-maroon-300 block -mt-1">
                SALES HUB
              </span>
            </div>
          </Link>
        </div>

        {/* User Role Tag */}
        <div className="px-5 py-3 bg-charcoal-700/30 border-b border-charcoal-700/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-medium text-slate-400">Environment: Live</span>
          </div>
          <span
            className={cn(
              "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border",
              userRole === "admin"
                ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                : "bg-blue-500/10 text-blue-300 border-blue-500/30"
            )}
          >
            {userRole === "admin" ? "Admin" : "Salesperson"}
          </span>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                {group.label}
              </p>
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-all",
                      isActive
                        ? "bg-maroon-600 text-white shadow-sm font-semibold"
                        : "text-slate-300 hover:text-white hover:bg-charcoal-600/70"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4",
                        isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                    {item.adminOnly && (
                      <ShieldCheck className="w-3.5 h-3.5 ml-auto text-amber-400/80" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Footer Profile & Logout */}
        <div className="p-3 border-t border-charcoal-700/80 bg-charcoal-600/40">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-charcoal-700/50">
            <div className="w-8 h-8 rounded-full bg-charcoal-800 border border-slate-600 flex items-center justify-center text-slate-300">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{userName}</p>
              <p className="text-[10px] text-slate-400 truncate">{userEmail}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-charcoal-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
