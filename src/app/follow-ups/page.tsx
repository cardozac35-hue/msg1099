"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { DataTable, Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import { formatDate } from "@/lib/utils";
import {
  CalendarClock,
  Plus,
  Phone,
  Mail,
  Users,
  CheckCircle2,
  Calendar,
  AlertTriangle,
} from "lucide-react";

function FollowUpsContent() {
  const searchParams = useSearchParams();
  const filterEnq = searchParams.get("enquiryNumber");

  const [followUps, setFollowUps] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [enquiryId, setEnquiryId] = useState("");
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split("T")[0]
  );
  const [type, setType] = useState<"call" | "email" | "meeting" | "site_visit">("call");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Complete / Log Outcome Modal
  const [selectedFollowUp, setSelectedFollowUp] = useState<any>(null);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [outcome, setOutcome] = useState("positive");
  const [outcomeNotes, setOutcomeNotes] = useState("");
  const [updatingOutcome, setUpdatingOutcome] = useState(false);

  const fetchFollowUps = async () => {
    try {
      const [fuRes, enqRes] = await Promise.all([
        fetch("/api/follow-ups"),
        fetch("/api/enquiries"),
      ]);
      const fuData = await fuRes.json();
      const enqData = await enqRes.json();

      if (fuData.success) setFollowUps(fuData.followUps || []);
      if (enqData.success) setEnquiries(enqData.enquiries || []);
    } catch (err) {
      console.error("Error fetching follow-ups:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const handleCreateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryId) return;
    setSubmitting(true);

    try {
      const enq = enquiries.find((e) => e._id === enquiryId || e.id === enquiryId);
      if (!enq) return;

      const res = await fetch("/api/follow-ups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enquiryId: enq._id || enq.id,
          enquiryNumber: enq.enquiryNumber,
          customerId: enq.customerId?._id || enq.customerId,
          customerName: enq.customerName,
          scheduledDate,
          type,
          notes,
          assignedTo: enq.assignedTo?._id || enq.assignedTo,
          assignedToName: enq.assignedToName,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setNotes("");
        fetchFollowUps();
      }
    } catch {
      // Ignore
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFollowUp) return;
    setUpdatingOutcome(true);

    try {
      const res = await fetch(`/api/follow-ups/${selectedFollowUp._id || selectedFollowUp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          outcome,
          notes: outcomeNotes || selectedFollowUp.notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowOutcomeModal(false);
        setSelectedFollowUp(null);
        fetchFollowUps();
      }
    } catch {
      // Ignore
    } finally {
      setUpdatingOutcome(false);
    }
  };

  const now = new Date();
  const filteredData = followUps
    .filter((f) => !filterEnq || f.enquiryNumber === filterEnq)
    .filter((f) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "overdue") {
        return f.status === "pending" && new Date(f.scheduledDate) < now;
      }
      return f.status === statusFilter;
    });

  const columns: Column<any>[] = [
    {
      key: "scheduledDate",
      header: "Scheduled Date",
      sortable: true,
      className: "w-36 font-semibold",
      render: (row) => {
        const isOverdue = row.status === "pending" && new Date(row.scheduledDate) < now;
        return (
          <div className="flex items-center gap-1.5">
            <span className={isOverdue ? "text-rose-600 font-bold" : "text-slate-900"}>
              {formatDate(row.scheduledDate)}
            </span>
            {isOverdue && (
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                Overdue
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "enquiryNumber",
      header: "Enquiry Ref",
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-maroon-700">{row.enquiryNumber}</span>
      ),
    },
    {
      key: "customerName",
      header: "Customer Account",
      sortable: true,
      render: (row) => <span className="font-bold text-slate-900">{row.customerName}</span>,
    },
    {
      key: "type",
      header: "Channel",
      sortable: true,
      render: (row) => (
        <span className="capitalize px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
          {row.type}
        </span>
      ),
    },
    {
      key: "notes",
      header: "Follow-up Objective & Notes",
      render: (row) => (
        <span className="text-slate-600 line-clamp-1 max-w-xs">{row.notes || "-"}</span>
      ),
    },
    {
      key: "assignedToName",
      header: "Salesperson",
      sortable: true,
      render: (row) => row.assignedToName?.split(" ")[0] || "Unassigned",
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "outcome",
      header: "Commercial Outcome",
      sortable: true,
      render: (row) => (
        <span className="capitalize text-[11px] font-medium text-slate-700">
          {row.outcome?.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      render: (row) =>
        row.status === "pending" ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFollowUp(row);
              setOutcomeNotes(row.notes || "");
              setShowOutcomeModal(true);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Complete</span>
          </button>
        ) : (
          <span className="text-[11px] text-slate-400">Completed</span>
        ),
    },
  ];

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Commercial Pipeline Follow-ups</h2>
            <p className="text-xs text-slate-500">
              Customer touchpoint schedule, post-quotation reviews, and tender tracking
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-maroon-600 hover:bg-maroon-700 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Follow-up</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { label: "All Follow-ups", value: "all" },
            { label: "Pending", value: "pending" },
            { label: "Overdue Alerts", value: "overdue" },
            { label: "Completed", value: "completed" },
          ].map((st) => (
            <button
              key={st.value}
              onClick={() => setStatusFilter(st.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap ${
                statusFilter === st.value
                  ? "bg-charcoal-700 text-white border-charcoal-700 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={filteredData}
          searchPlaceholder="Search follow-ups by customer, enquiry number, notes..."
          searchFields={["enquiryNumber", "customerName", "notes", "assignedToName"]}
          loading={loading}
          emptyMessage="No follow-up touchpoints scheduled."
        />

        {/* MODAL: Schedule Follow-up */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Schedule Customer Touchpoint"
          subtitle="Set a pipeline reminder for commercial negotiations or tender clarification"
          maxWidth="md"
        >
          <form onSubmit={handleCreateFollowUp} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Link to Enquiry RFQ *
              </label>
              <select
                required
                value={enquiryId}
                onChange={(e) => setEnquiryId(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
              >
                <option value="">-- Select Customer Enquiry --</option>
                {enquiries.map((enq) => (
                  <option key={enq._id || enq.id} value={enq._id || enq.id}>
                    {enq.enquiryNumber} - {enq.customerName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Scheduled Date *
                </label>
                <input
                  type="date"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Channel
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white capitalize"
                >
                  <option value="call">Phone Call</option>
                  <option value="email">Commercial Email</option>
                  <option value="meeting">Teams / Zoom Meeting</option>
                  <option value="site_visit">Client Site Visit</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Touchpoint Objectives & Talking Points
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Follow up regarding commercial approval, discount negotiations, technical query response..."
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-maroon-600 hover:bg-maroon-700 text-white shadow-xs transition-colors"
              >
                {submitting ? "Scheduling..." : "Schedule Touchpoint"}
              </button>
            </div>
          </form>
        </Modal>

        {/* MODAL: Complete & Log Outcome */}
        <Modal
          isOpen={showOutcomeModal}
          onClose={() => setShowOutcomeModal(false)}
          title={`Log Commercial Outcome: ${selectedFollowUp?.customerName}`}
          subtitle={`Touchpoint for ${selectedFollowUp?.enquiryNumber}`}
          maxWidth="md"
        >
          <form onSubmit={handleLogOutcome} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Customer Feedback / Commercial Result *
              </label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-bold"
              >
                <option value="positive">Positive - Client considering bid favorably</option>
                <option value="price_negotiation">Price High - Discount requested</option>
                <option value="revision_requested">Revision Requested - Changes to scope/spec</option>
                <option value="order_won">Awarded / Won - Purchase order incoming</option>
                <option value="lost">Lost - Competitor selected</option>
                <option value="neutral">Neutral - Routine follow-up completed</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Meeting Summary & Next Action Steps
              </label>
              <textarea
                rows={3}
                value={outcomeNotes}
                onChange={(e) => setOutcomeNotes(e.target.value)}
                placeholder="Details of client discussion..."
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowOutcomeModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updatingOutcome}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
              >
                {updatingOutcome ? "Saving..." : "Record & Close Follow-up"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardShell>
  );
}

export default function FollowUpsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 text-sm">Loading follow-ups pipeline...</div>}>
      <FollowUpsContent />
    </Suspense>
  );
}
