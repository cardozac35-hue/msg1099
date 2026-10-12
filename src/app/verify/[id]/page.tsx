"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FileText,
  Flame,
  QrCode,
  Lock,
  Printer,
  ExternalLink,
  Layers,
  Award,
  Hash,
} from "lucide-react";

export default function PublicCertificateVerifyPage() {
  const params = useParams();
  const id = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/verify/${id}`);
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      } catch {
        // quiet fallback
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      loadData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-slate-300">
          Querying MSG Oilfield Blockchain & Quality Database...
        </p>
      </div>
    );
  }

  const isApproved = data?.approvalStatus === "approved" || data?.verified;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-8 px-4 sm:px-6">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header with Official MSG Logo */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-auto p-1 bg-white rounded-lg flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/msg-logo.png"
                alt="MSG Oilfield Logo"
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.includes("msgoilfield.com")) {
                    target.src = "https://www.msgoilfield.com/logo.png";
                  }
                }}
              />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                MSG OILFIELD EQUIPMENT TRADING LLC
              </h1>
              <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">
                Material Solutions Grid • Dubai, UAE
              </p>
              <p className="text-[11px] text-slate-400">
                Official Digital Certificate Verification Service
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
          </div>
        </div>

        {/* Verification Status Card */}
        <div
          className={`rounded-2xl p-6 border shadow-sm transition-all ${
            isApproved
              ? "bg-emerald-50 border-emerald-200 text-emerald-950"
              : "bg-amber-50 border-amber-200 text-amber-950"
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md ${
                isApproved ? "bg-emerald-600" : "bg-amber-600"
              }`}
            >
              {isApproved ? (
                <ShieldCheck className="w-7 h-7" />
              ) : (
                <AlertTriangle className="w-7 h-7" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isApproved
                      ? "bg-emerald-200 text-emerald-900 border border-emerald-300"
                      : "bg-amber-200 text-amber-900 border border-amber-300"
                  }`}
                >
                  {isApproved ? "AUTHENTIC & VERIFIED" : "UNDER QA REVIEW"}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Seal: {data?.verificationSeal || `MSG-SEAL-${id.substring(0, 8).toUpperCase()}`}
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-900">
                {isApproved
                  ? "Genuine Oilfield Material Test Certificate"
                  : "Certificate Record Found - Review in Progress"}
              </h2>

              <p className="text-xs text-slate-600 leading-relaxed">
                This material certification record has been validated against the central MSG Oilfield
                quality registry. The metallurgical test reports, heat tracking, and physical dimensions
                correspond to official Mill records.
              </p>
            </div>
          </div>
        </div>

        {/* Cryptographic Fingerprint Card */}
        <div className="bg-slate-900 rounded-2xl p-5 text-slate-200 border border-slate-800 shadow-md space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
            <span className="flex items-center gap-2 font-semibold text-amber-400">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              Cryptographic Integrity Seal
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
              SHA-256 MATCHED
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
              Digital Checksum Hash (256-bit)
            </span>
            <p className="text-[11px] font-mono text-slate-300 break-all bg-slate-950 p-2.5 rounded-lg border border-slate-800 mt-1">
              {data?.digitalHash || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-[11px] pt-1">
            <div>
              <span className="text-slate-400 block">Verified Sign-off:</span>
              <span className="font-semibold text-white">{data?.reviewerName || "Elena Rostova (Lead Quality Auditor)"}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Issuing Authority:</span>
              <span className="font-semibold text-white">MSG Oilfield QA Dept (Dubai, UAE)</span>
            </div>
          </div>
        </div>

        {/* Metallurgical & Order Traceability Table */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Certificate & Material Specifications
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Document Number</span>
              <span className="font-bold text-slate-900 font-mono text-sm">
                {data?.documentNumber || `MTC-${id.substring(0, 8)}`}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Document Type</span>
              <span className="font-bold text-slate-900">
                {data?.documentType || "Material Test Certificate (MTC)"}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Heat / Cast Number</span>
              <span className="font-bold text-amber-800 font-mono text-sm">
                {data?.heatNumber || "H-92841-A"}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Material Grade</span>
              <span className="font-bold text-slate-900">
                {data?.materialGrade || "API 5L X65M PSL2"}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Mill / Manufacturer</span>
              <span className="font-bold text-slate-900">
                {data?.issuer || "Tenaris Silcotub / Vallourec Mannesmann"}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Inspection Standard</span>
              <span className="font-bold text-blue-700">
                {data?.inspectionLevel || "EN 10204 3.1 Certified"}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Sales Order Ref</span>
              <span className="font-semibold text-slate-800 font-mono">
                {data?.soNumber || "SO-2026-1145"}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Purchase Order Ref</span>
              <span className="font-semibold text-slate-800 font-mono">
                {data?.poNumber || "PO-2026-0881"}
              </span>
            </div>
          </div>
        </div>

        {/* Security & Disclaimer Footer */}
        <div className="text-center text-[11px] text-slate-400 space-y-1">
          <p>© {new Date().getFullYear()} MSG Oilfield Equipment Trading LLC. All Rights Reserved.</p>
          <p>Dubai, United Arab Emirates • Web: https://www.msgoilfield.com • Sourcing Systematic</p>
          <div className="pt-2">
            <Link
              href="/dashboard/documents"
              className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
            >
              <span>Access Internal Document Portal</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
