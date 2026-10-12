"use client";

import React from "react";
import Link from "next/link";
import { UploadCloud, ArrowLeft, Shield } from "lucide-react";
import { DocumentUploadForm } from "@/components/documents/document-upload-form";

export default function UploadDocumentPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/documents/all"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition"
              title="Back to all documents"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-blue-600" />
              <span>Register & Upload Material Document</span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 pl-8">
            Upload Mill Test Certificates, NDT reports, inspection sheets, or compliance records. Files are validated and stored securely with Cloudinary private storage encryption.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <Shield className="w-3.5 h-3.5 text-blue-600" />
          <span>Audit-Verified Ingestion</span>
        </div>
      </div>

      {/* Multi-Section Form */}
      <DocumentUploadForm />
    </div>
  );
}
