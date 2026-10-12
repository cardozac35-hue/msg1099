"use client";

import React from "react";
import { X, Download, FileText, ExternalLink, Calendar, Hash, Building } from "lucide-react";
import { DocumentStatusBadge, DocumentVisibilityBadge } from "./document-status-badge";

interface PreviewModalProps {
  document: any | null;
  onClose: () => void;
}

export function DocumentPreviewModal({ document: doc, onClose }: PreviewModalProps) {
  if (!doc) return null;

  const docId = String(doc._id || doc.id);

  const handleDownload = async () => {
    try {
      const res = await fetch(`/api/documents/${docId}/download`);
      const data = await res.json();
      if (data.success && data.downloadUrl) {
        window.open(data.downloadUrl, "_blank");
      } else {
        alert(data.error || "Cannot download document");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const isImage = ["jpg", "jpeg", "png", "webp"].includes(doc.format?.toLowerCase());

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">{doc.documentNumber}</h3>
                <span className="text-xs font-mono text-slate-500">Rev {doc.revision || "0"}</span>
                <DocumentStatusBadge status={doc.approvalStatus} />
              </div>
              <p className="text-xs text-slate-500 truncate max-w-lg">{doc.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
              aria-label="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Preview & Metadata Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden">
          {/* Document Viewer Pane (2 Cols) */}
          <div className="md:col-span-2 bg-slate-900 flex items-center justify-center p-4 relative overflow-auto">
            {isImage ? (
              <img
                src={doc.cloudinaryUrl}
                alt={doc.title}
                className="max-h-[550px] max-w-full object-contain rounded shadow"
              />
            ) : (
              <div className="w-full h-full min-h-[480px] bg-slate-100 rounded-lg border border-slate-300 p-6 flex flex-col justify-between text-slate-800">
                <div className="border-b border-slate-300 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-serif font-bold text-lg text-slate-900 tracking-tight">
                        {doc.issuer}
                      </h4>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-sans">
                        Inspection & Testing Authority Record
                      </p>
                    </div>
                    <span className="font-mono text-xs font-bold border border-slate-300 px-2 py-1 rounded bg-white">
                      {doc.documentType}
                    </span>
                  </div>
                </div>

                <div className="my-6 space-y-4 font-mono text-xs">
                  <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded border border-slate-200">
                    <div>
                      <span className="text-slate-400 text-[10px] block">DOCUMENT NO</span>
                      <span className="font-bold">{doc.documentNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">HEAT / CAST NO</span>
                      <span className="font-bold text-blue-700">{doc.heatNumber || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">MATERIAL CODE</span>
                      <span>{doc.materialCode || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">SPECIFICATION / STD</span>
                      <span>{doc.applicableStandard || "ASME / API 6D"}</span>
                    </div>
                  </div>

                  <p className="text-[11px] font-sans text-slate-600 italic bg-amber-50/70 p-3 rounded border border-amber-200">
                    This document represents an official certified quality test dossier record.
                    Stored securely with Cloudinary private asset encryption.
                  </p>
                </div>

                <div className="border-t border-slate-300 pt-3 flex justify-between items-center text-[11px] text-slate-500 font-sans">
                  <span>Issued: {new Date(doc.issueDate).toLocaleDateString()}</span>
                  <span>Verified QA Status: {doc.approvalStatus.toUpperCase()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Metadata Sidebar (1 Col) */}
          <div className="p-5 border-l border-slate-200 overflow-y-auto space-y-4 text-xs bg-white">
            <div>
              <h4 className="font-bold text-slate-900 mb-1 text-xs">Document Properties</h4>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Security</span>
                  <DocumentVisibilityBadge visibility={doc.visibilityClassification} />
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Format & Size</span>
                  <span className="font-mono uppercase">
                    {doc.format} • {(doc.fileSize / 1024).toFixed(0)} KB
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Issue Date</span>
                  <span>{new Date(doc.issueDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Expiry Date</span>
                  <span>
                    {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : "Perpetual"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-1 text-xs">Industrial Linkage</h4>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Material</span>
                  <span className="font-medium text-slate-800">{doc.materialCode || "N/A"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Heat #</span>
                  <span className="font-mono text-blue-700">{doc.heatNumber || "N/A"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Batch #</span>
                  <span className="font-mono">{doc.batchNumber || "—"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Supplier</span>
                  <span>{doc.supplierName || "—"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">PO #</span>
                  <span className="font-mono">{doc.poNumber || "—"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Sales Order</span>
                  <span className="font-mono text-blue-700">{doc.soNumber || "—"}</span>
                </div>
              </div>
            </div>

            {doc.description && (
              <div>
                <h4 className="font-bold text-slate-900 mb-1 text-xs">Technical Notes</h4>
                <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100 leading-relaxed">
                  {doc.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
