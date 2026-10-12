"use client";

import React from "react";
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Archive,
  RefreshCw,
  FileCheck,
  ShieldCheck,
  Lock,
  Users,
  Eye,
  AlertTriangle,
} from "lucide-react";

export function DocumentStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "approved":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          Approved
        </span>
      );
    case "pending_review":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          Pending Review
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Rejected
        </span>
      );
    case "correction_required":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
          <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
          Correction Required
        </span>
      );
    case "expired":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
          Expired
        </span>
      );
    case "superseded":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
          <RefreshCw className="w-3.5 h-3.5 text-purple-600" />
          Superseded
        </span>
      );
    case "archived":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300">
          <Archive className="w-3.5 h-3.5 text-slate-500" />
          Archived
        </span>
      );
    case "draft":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">
          <FileCheck className="w-3.5 h-3.5 text-slate-400" />
          Draft
        </span>
      );
  }
}

export function DocumentVisibilityBadge({ visibility }: { visibility: string }) {
  switch (visibility) {
    case "customer_shareable":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <Users className="w-3 h-3 text-blue-600" />
          Customer Shareable
        </span>
      );
    case "supplier_confidential":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-800 border border-rose-200">
          <Lock className="w-3 h-3 text-rose-600" />
          Supplier Confidential
        </span>
      );
    case "quality_team_only":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
          <ShieldCheck className="w-3 h-3 text-indigo-600" />
          QA Team Only
        </span>
      );
    case "internal_only":
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
          <Eye className="w-3 h-3 text-slate-500" />
          Internal Only
        </span>
      );
  }
}
