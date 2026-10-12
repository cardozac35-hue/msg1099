"use client";

import React from "react";
import Link from "next/link";
import { Menu, Plus, FileSpreadsheet, Shield } from "lucide-react";

interface HeaderProps {
  onOpenMobileSidebar: () => void;
  userRole?: "admin" | "salesperson";
  userName?: string;
}

export function Header({
  onOpenMobileSidebar,
  userRole = "salesperson",
  userName = "User",
}: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8">
      {/* Mobile Toggle & Left Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Industrial B2B Portal
          </span>
          <h1 className="text-sm font-bold text-slate-800 -mt-0.5">
            Commercial Pipeline & Tender Desk
          </h1>
        </div>
      </div>

      {/* Right Action Shortcuts */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/master-sheet"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
          <span>Master Sheet</span>
        </Link>

        <Link
          href="/enquiries/new"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-maroon-600 hover:bg-maroon-700 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Enquiry</span>
        </Link>

        {/* User Pill */}
        <div className="pl-2 border-l border-slate-200 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-maroon-50 border border-maroon-200 flex items-center justify-center text-maroon-700 font-bold text-xs">
            {userName.charAt(0)}
          </div>
          <div className="hidden lg:block text-left">
            <span className="text-xs font-semibold text-slate-800 block leading-tight">
              {userName}
            </span>
            <span className="text-[10px] text-slate-500 flex items-center gap-1 leading-tight">
              {userRole === "admin" && <Shield className="w-2.5 h-2.5 text-amber-500" />}
              {userRole.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
