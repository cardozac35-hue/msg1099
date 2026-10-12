import React from "react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const s = (status || "").toLowerCase().replace(/[\s-]/g, "_");

  let colorClasses = "bg-slate-100 text-slate-700 border-slate-200";

  switch (s) {
    // Enquiry & Quote Statuses
    case "received":
    case "draft":
      colorClasses = "bg-blue-50 text-blue-700 border-blue-200";
      break;
    case "in_review":
    case "pending_approval":
    case "pending":
      colorClasses = "bg-amber-50 text-amber-700 border-amber-200";
      break;
    case "supplier_pricing":
      colorClasses = "bg-purple-50 text-purple-700 border-purple-200";
      break;
    case "quoted":
    case "sent":
    case "approved":
      colorClasses = "bg-emerald-50 text-emerald-700 border-emerald-200";
      break;
    case "revised":
      colorClasses = "bg-indigo-50 text-indigo-700 border-indigo-200";
      break;
    case "won":
    case "accepted":
    case "completed":
    case "order_won":
      colorClasses = "bg-teal-50 text-teal-700 border-teal-200 font-medium";
      break;
    case "lost":
    case "rejected":
    case "declined":
    case "cancelled":
      colorClasses = "bg-rose-50 text-rose-700 border-rose-200";
      break;
    case "urgent":
    case "high":
      colorClasses = "bg-red-50 text-red-700 border-red-200 font-semibold";
      break;
    case "medium":
      colorClasses = "bg-amber-50 text-amber-700 border-amber-200";
      break;
    case "low":
      colorClasses = "bg-slate-100 text-slate-600 border-slate-200";
      break;
  }

  // Format label
  const label = status
    ? status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Unknown";

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border shadow-xs transition-colors",
        colorClasses,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {label}
    </span>
  );
}
