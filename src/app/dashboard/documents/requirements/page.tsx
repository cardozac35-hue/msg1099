"use client";

import React, { useState, useEffect } from "react";
import {
  FileCheck2,
  Plus,
  ShieldCheck,
  AlertCircle,
  Building,
  Layers,
  CheckCircle2,
  Sliders,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

const DOCUMENT_TYPES = [
  "Material Test Certificate (MTC)",
  "EN 10204 3.1 certificate",
  "EN 10204 3.2 certificate",
  "Inspection report",
  "Hydrostatic test report",
  "NDT report",
  "PMI report",
  "Dimensional inspection report",
  "Certificate of Conformity",
  "Technical datasheet",
  "Engineering drawing",
  "Compliance certificate",
  "Other",
];

export default function DocumentRequirementsPage() {
  const { success, error } = useToast();

  const [rules, setRules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Rule Form State
  const [ruleName, setRuleName] = useState("");
  const [materialCategory, setMaterialCategory] = useState("All Categories");
  const [materialGrade, setMaterialGrade] = useState("All Grades");
  const [documentType, setDocumentType] = useState(DOCUMENT_TYPES[0]);
  const [isMandatory, setIsMandatory] = useState(true);
  const [validityDays, setValidityDays] = useState(0);
  const [blocksDispatch, setBlocksDispatch] = useState(true);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/document-requirements");
      const data = await res.json();
      if (data.success) {
        setRules(data.requirements || []);
      }
    } catch {
      // quiet fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) {
      error("Missing Name", "Rule name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/document-requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ruleName: ruleName.trim(),
          materialCategory,
          materialGrade,
          documentType,
          isMandatory,
          validityDays: Number(validityDays) || 0,
          blocksDispatch,
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        success("Rule Created", `Requirement rule "${ruleName}" successfully registered.`);
        setShowAddModal(false);
        setRuleName("");
        setDescription("");
        fetchRules();
      } else {
        error("Creation Failed", data.error);
      }
    } catch (err: any) {
      error("Submission Error", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-blue-600" />
            <span>Configurable Document Requirements & Standards Rules</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Establish automated quality deliverable policies for materials, grades, and specific client projects. Missing mandatory requirements automatically halt order dispatch.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Define New Requirement Rule</span>
        </button>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
            Active Quality Rules ({rules.length})
          </h3>
          <span className="text-xs text-slate-500">Enforced across all new Orders</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Rule Policy Name</th>
                <th className="py-3 px-3">Applicable Scope</th>
                <th className="py-3 px-3">Required Certificate Type</th>
                <th className="py-3 px-3">Classification</th>
                <th className="py-3 px-3">Validity Horizon</th>
                <th className="py-3 px-3">Dispatch Policy</th>
                <th className="py-3 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rules.map((rule) => (
                <tr key={rule._id || rule.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    <p>{rule.ruleName}</p>
                    {rule.description && (
                      <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                        {rule.description}
                      </p>
                    )}
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-mono">
                      {rule.materialCategory} / {rule.materialGrade}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 font-semibold text-blue-700">
                    {rule.documentType}
                  </td>

                  <td className="py-3.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rule.isMandatory
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {rule.isMandatory ? "MANDATORY" : "OPTIONAL"}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 font-mono text-slate-600">
                    {rule.validityDays > 0 ? `${rule.validityDays} Days` : "Perpetual"}
                  </td>

                  <td className="py-3.5 px-3">
                    {rule.blocksDispatch ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        Blocks Warehouse Dispatch
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">Non-blocking Advisory</span>
                    )}
                  </td>

                  <td className="py-3.5 px-3 text-right">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6">
            <h3 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-blue-600" />
              <span>Define Technical Requirement Policy</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Configure automated certificate deliverables for matching material families or orders.
            </p>

            <form onSubmit={handleAddRule} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Rule Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="e.g. Inconel 625 Mandatory PMI & NDT Inspection"
                  className="w-full border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Material Category</label>
                  <select
                    value={materialCategory}
                    onChange={(e) => setMaterialCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2"
                  >
                    <option value="All Categories">All Categories</option>
                    <option value="Pipes & Tubes">Pipes & Tubes</option>
                    <option value="Valves">Valves</option>
                    <option value="Flanges">Flanges</option>
                    <option value="Fittings">Fittings</option>
                    <option value="Fasteners & Studs">Fasteners & Studs</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Material Grade</label>
                  <input
                    type="text"
                    value={materialGrade}
                    onChange={(e) => setMaterialGrade(e.target.value)}
                    placeholder="All Grades or A106 Gr. B"
                    className="w-full border border-slate-200 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Required Document Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2"
                >
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    value={validityDays}
                    onChange={(e) => setValidityDays(parseInt(e.target.value, 10) || 0)}
                    placeholder="0 = Perpetual"
                    className="w-full border border-slate-200 rounded-lg p-2 font-mono"
                  />
                  <span className="text-[10px] text-slate-400">0 for non-expiring MTCs</span>
                </div>

                <div className="flex flex-col justify-end space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isMandatory}
                      onChange={(e) => setIsMandatory(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span className="font-semibold text-slate-800">Mandatory Item</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={blocksDispatch}
                      onChange={(e) => setBlocksDispatch(e.target.checked)}
                      className="rounded text-rose-600"
                    />
                    <span className="font-semibold text-rose-800">Block Dispatch if Missing</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Rationale and standards reference..."
                  className="w-full border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  {isSubmitting ? "Saving..." : "Save Requirement Policy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
