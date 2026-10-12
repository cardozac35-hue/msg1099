"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { DataTable, Column } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { formatDate } from "@/lib/utils";
import {
  FolderLock,
  Upload,
  FileDown,
  ShieldAlert,
  ShieldCheck,
  FileText,
  FileSpreadsheet,
  Image,
  AlertCircle,
} from "lucide-react";

export default function DocumentLibraryPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [userRole, setUserRole] = useState("salesperson");
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload Form State
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("datasheet");
  const [accessLevel, setAccessLevel] = useState("public");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents || []);
        setUserRole(data.userRole || "salesperson");
      }
    } catch (err) {
      console.error("Documents fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setUploadError("Please select a file to upload");
      return;
    }
    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);
      formData.append("accessLevel", accessLevel);

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setUploadError(data.error || "Upload failed");
        setUploading(false);
        return;
      }

      setShowUploadModal(false);
      setFile(null);
      fetchDocuments();
    } catch {
      setUploadError("An error occurred during file upload");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (docId: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}/download`);
      const data = await res.json();
      if (data.success && data.downloadUrl) {
        window.open(data.downloadUrl, "_blank");
      } else {
        alert(data.error || "Permission denied or download failed");
      }
    } catch {
      alert("Download error");
    }
  };

  const columns: Column<any>[] = [
    {
      key: "originalName",
      header: "Document Name",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-maroon-600 shrink-0" />
          <div>
            <span className="font-bold text-slate-900 block truncate max-w-xs">
              {row.originalName}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {(row.fileSizeBytes / 1024).toFixed(0)} KB • {row.mimeType}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      render: (row) => (
        <span className="capitalize px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
          {row.category?.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "accessLevel",
      header: "Classification",
      sortable: true,
      render: (row) =>
        row.accessLevel === "confidential_admin_only" ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
            <ShieldAlert className="w-3 h-3 text-amber-600" />
            Confidential (Admin Only)
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
            Public Commercial
          </span>
        ),
    },
    {
      key: "uploadedByName",
      header: "Uploader",
      sortable: true,
      render: (row) => row.uploadedByName || "System",
    },
    {
      key: "createdAt",
      header: "Date Uploaded",
      sortable: true,
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: "actions",
      header: "Download",
      render: (row) => (
        <button
          onClick={() => handleDownload(row._id || row.id)}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
          title="Download Document"
        >
          <FileDown className="w-3.5 h-3.5 text-maroon-600" />
          <span>Get File</span>
        </button>
      ),
    },
  ];

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">Cloudinary Document Repository</h2>
              {userRole === "admin" && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  Admin File Access
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Secure Cloudinary storage for mill test certificates, product drawings, quotation PDFs, and datasheets
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-maroon-600 hover:bg-maroon-700 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>

        {/* Security Pill */}
        <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs flex items-center justify-between">
          <span>
            <strong>Access Control Protocol:</strong> Confidential supplier files require authenticated signed URLs. Public direct URLs are strictly prohibited.
          </span>
          <span className="font-semibold text-slate-500 text-[11px]">
            Cloudinary Signed Storage
          </span>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={documents}
          searchPlaceholder="Search files by name, category, or uploader..."
          searchFields={["originalName", "category", "uploadedByName"]}
          loading={loading}
          emptyMessage="No documents stored in library."
        />

        {/* MODAL: Upload Document */}
        <Modal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          title="Upload Document to Cloudinary"
          subtitle="Supports PDF, MTCs, XLSX, DOCX, and high-res product photos (up to 25 MB)"
          maxWidth="md"
        >
          <form onSubmit={handleUpload} className="space-y-4 text-xs">
            {uploadError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Select File *
              </label>
              <input
                type="file"
                required
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-maroon-50 file:text-maroon-700 hover:file:bg-maroon-100 border border-slate-200 rounded-xl p-1 bg-white cursor-pointer"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Document Category *
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (e.target.value === "supplier_quotation") {
                    setAccessLevel("confidential_admin_only");
                  }
                }}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
              >
                <option value="datasheet">Product Datasheet / Catalog</option>
                <option value="mill_test_certificate">Material Test Certificate (3.1 MTC)</option>
                <option value="product_image">Product Technical Drawing / Photo</option>
                <option value="customer_quotation_pdf">Customer Quotation PDF</option>
                <option value="supporting_document">General Supporting Document</option>
                {userRole === "admin" && (
                  <option value="supplier_quotation">Supplier Commercial Quote (Confidential)</option>
                )}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Security Classification *
              </label>
              <select
                value={accessLevel}
                disabled={category === "supplier_quotation"}
                onChange={(e) => setAccessLevel(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-medium"
              >
                <option value="public">Public Commercial (All staff access)</option>
                {userRole === "admin" && (
                  <option value="confidential_admin_only">
                    Confidential Admin Only (Restricted from sales accounts)
                  </option>
                )}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-maroon-600 hover:bg-maroon-700 text-white shadow-xs transition-colors"
              >
                {uploading ? "Uploading to Cloudinary..." : "Upload & Save"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardShell>
  );
}
