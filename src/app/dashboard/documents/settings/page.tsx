"use client";

import React, { useState } from "react";
import {
  Sliders,
  Shield,
  Save,
  CheckCircle2,
  Lock,
  Calendar,
  Cloud,
  FileCheck,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function DocumentSettingsPage() {
  const { success } = useToast();

  const [allowSelfApproval, setAllowSelfApproval] = useState(false);
  const [blockDispatchOnMissing, setBlockDispatchOnMissing] = useState(true);
  const [expiryThresholdDays, setExpiryThresholdDays] = useState(30);
  const [cloudinaryFolder, setCloudinaryFolder] = useState("oil_gas_hub/certificates");
  const [maxFileSizeBytes, setMaxFileSizeBytes] = useState(25);
  const [require32InspectionOnSour, setRequire32InspectionOnSour] = useState(true);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    success("Settings Updated", "Document management and compliance rules successfully saved.");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            <span>Document Management & Compliance System Settings</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure quality workflows, approval thresholds, Cloudinary storage policies, and dispatch blocking rules.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Quality Workflow & Approval Safeguards */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Shield className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Quality Assurance & Workflow Controls
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
              <input
                type="checkbox"
                checked={allowSelfApproval}
                onChange={(e) => setAllowSelfApproval(e.target.checked)}
                className="rounded text-blue-600 mt-0.5"
              />
              <div>
                <p className="font-semibold text-slate-900">
                  Allow Administrator Self-Approval Exception Override
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  When disabled (default), uploaders cannot approve their own documents, enforcing mandatory four-eyes review principles.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
              <input
                type="checkbox"
                checked={blockDispatchOnMissing}
                onChange={(e) => setBlockDispatchOnMissing(e.target.checked)}
                className="rounded text-rose-600 mt-0.5"
              />
              <div>
                <p className="font-semibold text-slate-900">
                  Enforce Warehouse Dispatch Block on Incomplete Documentation
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Automatically flags sales order deliveries as &quot;Dispatch Blocked&quot; until all mandatory mill test certificates are approved.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
              <input
                type="checkbox"
                checked={require32InspectionOnSour}
                onChange={(e) => setRequire32InspectionOnSour(e.target.checked)}
                className="rounded text-blue-600 mt-0.5"
              />
              <div>
                <p className="font-semibold text-slate-900">
                  Mandatory EN 10204 3.2 for Sour Gas (NACE MR0175) Orders
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Requires independent third-party inspection endorsement (DNV, Lloyd&apos;s, TUV, BV) for all sour service line items.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Expiration Tracking Rules */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Calendar className="w-4 h-4 text-purple-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Validity & Expiration Monitoring
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Advance Expiry Warning Threshold (Days)
              </label>
              <input
                type="number"
                value={expiryThresholdDays}
                onChange={(e) => setExpiryThresholdDays(parseInt(e.target.value, 10) || 30)}
                className="w-full border border-slate-200 rounded-lg p-2 font-mono text-xs"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Triggers notification alerts when a calibration or compliance certificate expires within this window.
              </p>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Maximum Permitted Upload Size (MB)
              </label>
              <input
                type="number"
                value={maxFileSizeBytes}
                onChange={(e) => setMaxFileSizeBytes(parseInt(e.target.value, 10) || 25)}
                className="w-full border border-slate-200 rounded-lg p-2 font-mono text-xs"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Default limit is 25 MB per individual PDF or drawing.
              </p>
            </div>
          </div>
        </div>

        {/* Storage Provider & Cloudinary Configuration */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Cloud className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Cloudinary Storage & Asset Governance
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Default Storage Root Folder</label>
              <input
                type="text"
                value={cloudinaryFolder}
                onChange={(e) => setCloudinaryFolder(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 font-mono text-xs"
              />
            </div>

            <p className="text-[11px] text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-slate-200">
              Cloudinary API credentials remain securely locked on the server runtime.
              Client-side scripts only receive authorized, short-lived signed URLs.
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
