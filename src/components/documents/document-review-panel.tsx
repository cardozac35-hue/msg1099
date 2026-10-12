"use client";

import React, { useState } from "react";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  ShieldAlert,
  ClipboardCheck,
  MessageSquare,
  Lock,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface ReviewPanelProps {
  document: any;
  currentUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  onSuccess?: () => void;
}

export function DocumentReviewPanel({
  document: doc,
  currentUser = { id: "usr_qa_01", name: "Elena Rostova", email: "qa@oilgashub.com", role: "quality_reviewer" },
  onSuccess,
}: ReviewPanelProps) {
  const { success, error, warning } = useToast();

  const [comments, setComments] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [activeModal, setActiveModal] = useState<"approve" | "reject" | "correction" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allowAdminSelfApproval, setAllowAdminSelfApproval] = useState(false);

  // Quality Verification Checklist
  const [checklist, setChecklist] = useState([
    { item: "Heat & Cast number verified against physical stamping", verified: true },
    { item: "Chemical composition within ASME/EN tolerances", verified: true },
    { item: "Tensile, yield and elongation test results compliant", verified: true },
    { item: "Charpy V-Notch impact testing at design temp compliant", verified: true },
    { item: "NACE MR0175 / ISO 15156 sour gas compliance certified", verified: true },
    { item: "Third-party inspection endorsement signature valid", verified: true },
  ]);

  const toggleChecklist = (index: number) => {
    setChecklist((prev) =>
      prev.map((item, i) => (i === index ? { ...item, verified: !item.verified } : item))
    );
  };

  const isUploader = String(doc.uploaderId) === String(currentUser.id);
  const canApproveRole = ["admin", "quality_reviewer"].includes(currentUser.role);
  const isSelfApprovalBlocked = isUploader && currentUser.role !== "admin";

  // Handle Approve
  const handleApprove = async () => {
    if (isSelfApprovalBlocked) {
      error(
        "Self-Approval Prohibited",
        "Uploaders cannot approve their own documents. Another Quality Reviewer or Administrator must verify this certificate."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/documents/${doc._id || doc.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comments,
          checklistVerifications: checklist,
          allowSelfApprovalException: allowAdminSelfApproval,
        }),
      });

      const data = await res.json();
      if (data.success) {
        success("Certificate Approved", `${doc.documentNumber} is now marked as Approved.`);
        setActiveModal(null);
        if (onSuccess) onSuccess();
      } else {
        error("Approval Failed", data.error);
      }
    } catch (err: any) {
      error("Submission Error", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Reject
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      error("Missing Reason", "A mandatory rejection reason is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/documents/${doc._id || doc.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: rejectionReason.trim(),
          comments,
          checklistVerifications: checklist,
        }),
      });

      const data = await res.json();
      if (data.success) {
        warning("Certificate Rejected", `${doc.documentNumber} was rejected.`);
        setActiveModal(null);
        if (onSuccess) onSuccess();
      } else {
        error("Rejection Failed", data.error);
      }
    } catch (err: any) {
      error("Submission Error", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Request Correction
  const handleCorrection = async () => {
    if (!comments.trim()) {
      error("Missing Instructions", "Please provide correction notes for the uploader.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/documents/${doc._id || doc.id}/patch`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalStatus: "correction_required" }),
      });
      const data = await res.json();
      if (data.success) {
        warning("Correction Requested", "Uploader has been requested to provide updated certificate.");
        setActiveModal(null);
        if (onSuccess) onSuccess();
      } else {
        error("Failed", data.error);
      }
    } catch (err: any) {
      error("Error", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-blue-600" />
          <h3 className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
            Quality Verification & Workflow Action
          </h3>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">
          Logged in as: <strong className="text-slate-800">{currentUser.name}</strong> (
          {currentUser.role.replace("_", " ")})
        </span>
      </div>

      {/* Self-approval notice if applicable */}
      {isUploader && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Self-Approval Protection Active</p>
            <p className="text-[11px] opacity-90 mt-0.5">
              You originally uploaded this document. Under standard oil & gas quality assurance guidelines,
              an independent Quality Reviewer must approve this certificate.
            </p>
            {currentUser.role === "admin" && (
              <label className="flex items-center gap-1.5 mt-2 font-medium text-[11px] cursor-pointer text-amber-950">
                <input
                  type="checkbox"
                  checked={allowAdminSelfApproval}
                  onChange={(e) => setAllowAdminSelfApproval(e.target.checked)}
                  className="rounded text-amber-700"
                />
                Apply Administrator Emergency Exception Override
              </label>
            )}
          </div>
        </div>
      )}

      {/* Verification Checklist */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-slate-800 mb-2">Technical Compliance Checks</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          {checklist.map((item, idx) => (
            <label
              key={idx}
              className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition ${
                item.verified
                  ? "bg-slate-50/80 border-slate-200 text-slate-800"
                  : "bg-white border-slate-200 text-slate-400"
              }`}
            >
              <input
                type="checkbox"
                checked={item.verified}
                onChange={() => toggleChecklist(idx)}
                className="rounded text-blue-600 mt-0.5"
              />
              <span className="text-[11px] leading-snug">{item.item}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Reviewer Comments input */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-slate-700 mb-1">
          Reviewer Notes / Verification Remarks
        </label>
        <textarea
          rows={2}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Enter metallurgical inspection notes, test chart verification remarks, or standard confirmation..."
          className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="text-[11px] text-slate-400">
          Decision will be recorded in immutable audit logs.
        </div>

        <div className="flex items-center gap-2">
          {canApproveRole && (
            <>
              <button
                type="button"
                onClick={() => setActiveModal("correction")}
                className="px-3 py-1.5 rounded-lg border border-orange-300 text-orange-700 hover:bg-orange-50 text-xs font-medium transition"
              >
                Request Correction
              </button>

              <button
                type="button"
                onClick={() => setActiveModal("reject")}
                className="px-3 py-1.5 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-medium transition flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject Certificate</span>
              </button>

              <button
                type="button"
                onClick={handleApprove}
                disabled={isSubmitting || (isSelfApprovalBlocked && !allowAdminSelfApproval)}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Approve Certificate</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {activeModal === "reject" && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 text-rose-600 mb-2">
              <XCircle className="w-4 h-4" />
              Mandatory Certificate Rejection Reason
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Per ISO compliance rules, rejecting a Material Test Certificate requires an explicit, recorded reason.
            </p>

            <textarea
              rows={3}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Tensile strength test results below ASTM A106 minimum (actual 400 MPa vs required 415 MPa)..."
              className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 mb-4 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isSubmitting || !rejectionReason.trim()}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold"
              >
                {isSubmitting ? "Submitting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Correction Modal */}
      {activeModal === "correction" && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 text-orange-600 mb-2">
              <AlertCircle className="w-4 h-4" />
              Request Correction from Uploader
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Specify what corrections or missing attachments are needed on this certificate.
            </p>

            <textarea
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="e.g. Please upload revision including Page 2 with heat treatment furnace charts..."
              className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 mb-4 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCorrection}
                disabled={isSubmitting || !comments.trim()}
                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold"
              >
                {isSubmitting ? "Submitting..." : "Send Correction Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
