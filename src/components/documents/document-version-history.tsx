"use client";

import React, { useState } from "react";
import {
  History,
  RefreshCw,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  Calendar,
  User,
  ArrowRight,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface VersionHistoryProps {
  document: any;
  versions: any[];
  currentUser?: any;
  onVersionAdded?: () => void;
}

export function DocumentVersionHistory({
  document: doc,
  versions = [],
  currentUser,
  onVersionAdded,
}: VersionHistoryProps) {
  const { success, error, info } = useToast();

  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [newRevision, setNewRevision] = useState(
    doc.revision ? `Rev ${String.fromCharCode(doc.revision.charCodeAt(0) + 1)}` : "1"
  );
  const [changeReason, setChangeReason] = useState("");
  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReplacementFile(e.target.files[0]);
    }
  };

  const handleReplaceVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replacementFile) {
      error("File Missing", "Please select the updated certificate file.");
      return;
    }
    if (!changeReason.trim() || changeReason.trim().length < 3) {
      error("Reason Required", "Please enter a specific reason for this document replacement.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload new file to Cloudinary
      const formData = new FormData();
      formData.append("file", replacementFile);
      formData.append("documentType", doc.documentType);
      formData.append("visibilityClassification", doc.visibilityClassification);

      const uploadRes = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadData.success || !uploadData.file) {
        throw new Error(uploadData.error || "File upload failed");
      }

      // 2. Call replacement API
      const replaceRes = await fetch(`/api/documents/${doc._id || doc.id}/replace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newRevision: newRevision.trim(),
          changeReason: changeReason.trim(),
          cloudinaryPublicId: uploadData.file.cloudinaryPublicId,
          cloudinaryUrl: uploadData.file.cloudinaryUrl,
          format: uploadData.file.format,
          fileSize: uploadData.file.fileSize,
        }),
      });

      const replaceData = await replaceRes.json();
      if (!replaceData.success) {
        throw new Error(replaceData.error || "Failed to replace version");
      }

      success(
        "Version Created",
        `New version Rev ${newRevision} registered and submitted for review.`
      );
      setShowReplaceModal(false);
      setReplacementFile(null);
      setChangeReason("");
      if (onVersionAdded) onVersionAdded();
    } catch (err: any) {
      error("Replacement Failed", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-purple-600" />
          <h3 className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
            Document Version History & Audit Trail
          </h3>
        </div>

        <button
          onClick={() => setShowReplaceModal(true)}
          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5 shadow-xs transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Upload New Version / Revision</span>
        </button>
      </div>

      {/* Version Timeline */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {/* Active Current Version */}
        <div className="relative">
          <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100" />
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-blue-900 font-mono">
                    Rev {doc.revision || "0"} (v{doc.versionNumber || 1})
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">
                    CURRENT ACTIVE
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Format: {doc.format?.toUpperCase()} • {(doc.fileSize / 1024).toFixed(0)} KB
                </p>
              </div>

              <span className="text-[11px] text-slate-500">
                {new Date(doc.updatedAt || doc.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-500 border-t border-blue-100/60 pt-2">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Uploaded by {doc.uploaderName || "System"}
              </span>
              <span>•</span>
              <span>Status: <strong className="text-slate-700">{doc.approvalStatus}</strong></span>
            </div>
          </div>
        </div>

        {/* Previous Version Records */}
        {versions
          .filter((v) => v.versionNumber !== doc.versionNumber)
          .map((ver) => (
            <div key={ver._id || ver.id} className="relative">
              <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-slate-300 border-2 border-white ring-2 ring-slate-100" />
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-800 font-mono">
                        Rev {ver.revision} (v{ver.versionNumber})
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200 text-slate-700">
                        SUPERSEDED
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 font-sans">
                      Reason: <span className="italic">{ver.changeReason}</span>
                    </p>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    {new Date(ver.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200 pt-2">
                  <span>Uploaded by {ver.uploadedByName || "User"}</span>
                  <a
                    href={ver.cloudinaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download Historical Snapshot</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Replace Document Modal */}
      {showReplaceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <RefreshCw className="w-5 h-5" />
              <h3 className="font-bold text-sm text-slate-900">
                Replace Certificate / Create New Version
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Per strict quality rules, this action will create a new immutable revision (v
              {(doc.versionNumber || 1) + 1}). The previous version will remain fully archived and preserved.
            </p>

            <form onSubmit={handleReplaceVersion} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Select Updated File <span className="text-rose-500">*</span>
                </label>
                <input
                  type="file"
                  required
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg,.xlsx,.docx"
                  className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 cursor-pointer"
                />
                {replacementFile && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Selected: {replacementFile.name} ({(replacementFile.size / 1024).toFixed(0)} KB)
                  </p>
                )}
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  New Revision Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newRevision}
                  onChange={(e) => setNewRevision(e.target.value)}
                  placeholder="e.g. Rev 1, Rev B"
                  className="w-full border border-slate-200 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Mandatory Change Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="Explain why this version is being replaced (e.g., added supplementary Charpy impact re-test data)..."
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReplaceModal(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !replacementFile || !changeReason.trim()}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    "Processing Upload..."
                  ) : (
                    <>
                      <span>Submit New Version</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
