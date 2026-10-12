import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: "green" | "red" | "amber" | "maroon";
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeColor = "maroon",
  className,
}: StatCardProps) {
  const badgeStyles = {
    maroon: "bg-maroon-50 text-maroon-700 border-maroon-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
  }[badgeColor];

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200 shadow-xs p-5 hover:border-slate-300 transition-all",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className="w-9 h-9 rounded-lg bg-charcoal-50 flex items-center justify-center text-charcoal-700 border border-slate-100">
          <Icon className="w-5 h-5 text-maroon-600" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </span>
        {badge && (
          <span
            className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full border",
              badgeStyles
            )}
          >
            {badge}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 line-clamp-1">{subtitle}</p>
      )}
    </div>
  );
}
