"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Bell,
  UserCheck,
  Shield,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Building2,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface HeaderProps {
  currentUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export function Header({ currentUser: initialUser }: HeaderProps) {
  const router = useRouter();
  const { success, error, info } = useToast();

  const [currentUser, setCurrentUser] = useState(
    initialUser || {
      id: "usr_admin_01",
      name: "Marcus Vance",
      email: "admin@oilgashub.com",
      role: "admin",
    }
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Fetch notifications
  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json();
        if (data.success && data.notifications) {
          setNotifications(data.notifications);
        }
      } catch {
        // quiet fallback
      }
    }
    loadNotifications();
  }, [currentUser]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/dashboard/documents/all?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleRoleSwitch = async (role: string, name: string) => {
    try {
      const res = await fetch("/api/auth/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        setShowRoleMenu(false);
        success(`Active Role Switched`, `Now viewing as ${name} (${role.toUpperCase()})`);
        router.refresh();
      } else {
        error("Role switch failed", data.error);
      }
    } catch (err: any) {
      error("Error switching role", err.message);
    }
  };

  const roleBadgeColor = {
    admin: "bg-purple-100 text-purple-800 border-purple-200",
    salesperson: "bg-blue-100 text-blue-800 border-blue-200",
    quality_reviewer: "bg-emerald-100 text-emerald-800 border-emerald-200",
    management: "bg-amber-100 text-amber-800 border-amber-200",
  }[currentUser.role] || "bg-slate-100 text-slate-800 border-slate-200";

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Global Search Bar */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search certificates, heat #, materials, PO, SO..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>
      </form>

      {/* MSG Oilfield Operations Hub Banner */}
      <div className="hidden lg:flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-semibold text-slate-800">MSG QA Desk</span>
          <span className="text-[10px] text-slate-500">• Dubai, UAE</span>
        </div>
        <Link
          href="/dashboard/documents/mtc-analyzer"
          className="text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition"
        >
          <span>⚡ MTC Analyzer</span>
        </Link>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Quick Testing Role Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition cursor-pointer"
            title="Switch user role to test permissions"
          >
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Role:</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase border ${roleBadgeColor}`}>
              {currentUser.role.replace("_", " ")}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Select Active Testing Persona
              </div>
              <div className="space-y-1 mt-1">
                <button
                  onClick={() => handleRoleSwitch("admin", "Marcus Vance (Commercial Dir)")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center justify-between ${
                    currentUser.role === "admin"
                      ? "bg-purple-50 text-purple-900 font-semibold"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div>
                    <p className="font-medium text-xs">Marcus Vance</p>
                    <p className="text-[10px] text-slate-500">Administrator (Full Access)</p>
                  </div>
                  {currentUser.role === "admin" && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                </button>

                <button
                  onClick={() => handleRoleSwitch("quality_reviewer", "Elena Rostova (Quality Lead)")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center justify-between ${
                    currentUser.role === "quality_reviewer"
                      ? "bg-emerald-50 text-emerald-900 font-semibold"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div>
                    <p className="font-medium text-xs">Elena Rostova</p>
                    <p className="text-[10px] text-slate-500">Quality / Doc Reviewer (Approver)</p>
                  </div>
                  {currentUser.role === "quality_reviewer" && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                </button>

                <button
                  onClick={() => handleRoleSwitch("salesperson", "Sarah Jenkins (Technical Sales)")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center justify-between ${
                    currentUser.role === "salesperson"
                      ? "bg-blue-50 text-blue-900 font-semibold"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div>
                    <p className="font-medium text-xs">Sarah Jenkins</p>
                    <p className="text-[10px] text-slate-500">Salesperson (No Confidential Costs)</p>
                  </div>
                  {currentUser.role === "salesperson" && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  )}
                </button>

                <button
                  onClick={() => handleRoleSwitch("management", "David Sterling (Operations VP)")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center justify-between ${
                    currentUser.role === "management"
                      ? "bg-amber-50 text-amber-900 font-semibold"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div>
                    <p className="font-medium text-xs">David Sterling</p>
                    <p className="text-[10px] text-slate-500">Management (Dashboards & Readiness)</p>
                  </div>
                  {currentUser.role === "management" && (
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition relative cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {notifications.filter((n) => !n.isRead).length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full animate-ping" />
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs font-semibold text-slate-900">Module Alerts & Tasks</h4>
                <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                  {notifications.length} recent
                </span>
              </div>
              <div className="mt-2 space-y-2 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No unread notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs transition border border-slate-100"
                    >
                      <p className="font-medium text-slate-800 text-[11px]">{n.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Current User Avatar */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-semibold text-xs flex items-center justify-center">
            {currentUser.name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .substring(0, 2)}
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-semibold text-slate-900 leading-tight">{currentUser.name}</p>
            <p className="text-[10px] text-slate-400 capitalize">{currentUser.role.replace("_", " ")}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
