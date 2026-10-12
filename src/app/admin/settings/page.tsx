"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import {
  Settings as SettingsIcon,
  ShieldCheck,
  ShieldAlert,
  Building,
  Percent,
  CheckCircle2,
  Save,
} from "lucide-react";

export default function ApplicationSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [userRole, setUserRole] = useState("admin");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form State
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyTaxNumber, setCompanyTaxNumber] = useState("");
  const [enquiryPrefix, setEnquiryPrefix] = useState("ENQ");
  const [quotationPrefix, setQuotationPrefix] = useState("QT");
  const [minMarginThreshold, setMinMarginThreshold] = useState(15.0);
  const [requireApproval, setRequireApproval] = useState(true);
  const [defaultTaxRate, setDefaultTaxRate] = useState(5.0);
  const [validityDays, setValidityDays] = useState(30);

  useEffect(() => {
    async function loadSettings() {
      try {
        const [sRes, meRes] = await Promise.all([
          fetch("/api/admin/settings"),
          fetch("/api/auth/me"),
        ]);
        const sData = await sRes.json();
        const meData = await meRes.json();

        if (meData.success && meData.user) {
          setUserRole(meData.user.role);
        }
        if (sData.success && sData.settings) {
          const s = sData.settings;
          setSettings(s);
          setCompanyName(s.companyName || "");
          setCompanyAddress(s.companyAddress || "");
          setCompanyPhone(s.companyPhone || "");
          setCompanyEmail(s.companyEmail || "");
          setCompanyTaxNumber(s.companyTaxNumber || "");
          setEnquiryPrefix(s.enquiryPrefix || "ENQ");
          setQuotationPrefix(s.quotationPrefix || "QT");
          setMinMarginThreshold(s.minMarginApprovalThreshold || 15.0);
          setRequireApproval(s.requireApprovalBelowThreshold ?? true);
          setDefaultTaxRate(s.defaultTaxRate || 5.0);
          setValidityDays(s.defaultQuotationValidityDays || 30);
        }
      } catch (err) {
        console.error("Settings load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          companyAddress,
          companyPhone,
          companyEmail,
          companyTaxNumber,
          enquiryPrefix,
          quotationPrefix,
          minMarginApprovalThreshold: minMarginThreshold,
          requireApprovalBelowThreshold: requireApproval,
          defaultTaxRate,
          defaultQuotationValidityDays: validityDays,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3500);
      }
    } catch {
      // Ignore
    } finally {
      setSaving(false);
    }
  };

  if (userRole !== "admin") {
    return (
      <DashboardShell>
        <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl border border-rose-200 shadow-md text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
          <p className="text-xs text-slate-500 mt-2">
            System configuration and approval threshold settings are restricted strictly to administrators.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-charcoal-700 rounded-xl"
            >
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">Commercial Rules & System Settings</h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                Admin Protected
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Configurable quotation approval margin rules, numbering sequences, and legal entity profile
            </p>
          </div>

          {savedSuccess && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Settings Saved Successfully</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Approval Rules & Margins */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Percent className="w-4 h-4 text-maroon-600" />
              <span>Configurable Margin Approval Rules</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Minimum Gross Margin Threshold (%) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  required
                  value={minMarginThreshold}
                  onChange={(e) => setMinMarginThreshold(parseFloat(e.target.value) || 0)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-bold"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Quotations yielding a gross margin below this threshold will require administrator sign-off.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Approval Enforcement Policy
                </label>
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireApproval}
                      onChange={(e) => setRequireApproval(e.target.checked)}
                      className="rounded border-slate-300 text-maroon-600 focus:ring-maroon-500"
                    />
                    <span className="font-medium text-slate-700">
                      Block transmission until admin approves quotes below minimum margin
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Concurrency-Safe Sequence Prefixes */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <SettingsIcon className="w-4 h-4 text-maroon-600" />
              <span>Document Sequence Numbering Rules</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Enquiry Number Prefix *
                </label>
                <input
                  type="text"
                  required
                  value={enquiryPrefix}
                  onChange={(e) => setEnquiryPrefix(e.target.value.toUpperCase())}
                  placeholder="ENQ"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white uppercase font-mono font-bold"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Generates format: <code>{enquiryPrefix}-2026-0001</code>
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Quotation Number Prefix *
                </label>
                <input
                  type="text"
                  required
                  value={quotationPrefix}
                  onChange={(e) => setQuotationPrefix(e.target.value.toUpperCase())}
                  placeholder="QT"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white uppercase font-mono font-bold"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Generates format: <code>{quotationPrefix}-2026-0001-R0</code>
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Default Tax / VAT Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={defaultTaxRate}
                  onChange={(e) => setDefaultTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Default Offer Validity (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={validityDays}
                  onChange={(e) => setValidityDays(parseInt(e.target.value) || 30)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Legal Entity Profile (Rendered on Quotation PDFs) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building className="w-4 h-4 text-maroon-600" />
              <span>Commercial Company Profile (Quotation Header)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Legal Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-semibold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Headquarters Registered Address *
                </label>
                <input
                  type="text"
                  required
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Official Commercial Phone
                </label>
                <input
                  type="text"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Commercial Inquiries Email
                </label>
                <input
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tax Registration Number (TRN / VAT)
                </label>
                <input
                  type="text"
                  value={companyTaxNumber}
                  onChange={(e) => setCompanyTaxNumber(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl bg-maroon-600 hover:bg-maroon-700 text-white shadow-md transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving Changes..." : "Save Application Settings"}</span>
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
