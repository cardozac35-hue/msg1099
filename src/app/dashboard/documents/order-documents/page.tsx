"use client";

import React from "react";
import { ClipboardList } from "lucide-react";
import { DocumentChecklist } from "@/components/documents/document-checklist";

export default function OrderDocumentsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-blue-600" />
          <span>Order Document Deliverables & Customer Dossier Management</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor order-specific technical documentation requirements, track missing deliverables, evaluate dispatch readiness, and compile customer technical dossiers (ZIP).
        </p>
      </div>

      <DocumentChecklist />
    </div>
  );
}
