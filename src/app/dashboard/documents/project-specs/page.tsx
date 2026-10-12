"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCheck,
  Building2,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Filter,
  Search,
  Download,
  FileText,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Layers,
  Flame,
  ArrowRight,
  BookOpen,
} from "lucide-react";

interface SpecRequirement {
  id: string;
  category: "Pipes" | "Fittings" | "Flanges" | "Valves" | "Fasteners";
  parameter: string;
  baseStandard: string;
  baseValue: string;
  operatorValue: string;
  mandatoryLevel: "Mandatory" | "Project Specific" | "Critical Sour";
  notes: string;
}

interface OperatorSpec {
  id: string;
  operator: string;
  country: string;
  logoBadge: string;
  specCode: string;
  title: string;
  revision: string;
  requirements: SpecRequirement[];
}

const OPERATOR_SPECS: OperatorSpec[] = [
  {
    id: "ARAMCO",
    operator: "Saudi Aramco",
    country: "Saudi Arabia (KSA)",
    logoBadge: "bg-emerald-700 text-white",
    specCode: "01-SAMSS-035 / 02-SAMSS-005",
    title: "API 5L Line Pipe PSL2 & Buttweld Fittings Specification",
    revision: "Rev 2024 (Mandatory Saudi Aramco Engineering Standard)",
    requirements: [
      {
        id: "SA-01",
        category: "Pipes",
        parameter: "Carbon Equivalent (CE IIW)",
        baseStandard: "API 5L PSL2",
        baseValue: "≤ 0.43 wt.%",
        operatorValue: "≤ 0.42 wt.% (Pcm ≤ 0.22 if C ≤ 0.12%)",
        mandatoryLevel: "Mandatory",
        notes: "Strict weldability limit for sour gas transmission lines.",
      },
      {
        id: "SA-02",
        category: "Pipes",
        parameter: "Sulfur Content (S)",
        baseStandard: "API 5L PSL2",
        baseValue: "≤ 0.015 wt.%",
        operatorValue: "≤ 0.002 wt.% (Ultra Low Sulfur)",
        mandatoryLevel: "Critical Sour",
        notes: "Calcium treated for inclusion shape control (Ca/S 1.5 - 3.0).",
      },
      {
        id: "SA-03",
        category: "Pipes",
        parameter: "HIC Resistance (NACE TM0284)",
        baseStandard: "NACE MR0175",
        baseValue: "CLR ≤ 15%, CTR ≤ 5%",
        operatorValue: "Solution A: CLR ≤ 15%, CTR ≤ 3%, CSR ≤ 1.5%",
        mandatoryLevel: "Critical Sour",
        notes: "3 specimens per heat from pipe body and weld zone.",
      },
      {
        id: "SA-04",
        category: "Pipes",
        parameter: "Charpy V-Notch Impact Test",
        baseStandard: "API 5L PSL2",
        baseValue: "0°C (Min 27 J avg)",
        operatorValue: "-20°C (Min 40 J avg, 30 J single)",
        mandatoryLevel: "Mandatory",
        notes: "Transverse specimens for OD ≥ 219.1 mm.",
      },
      {
        id: "SA-05",
        category: "Fittings",
        parameter: "100% PMI (Positive Material Identification)",
        baseStandard: "MSS SP-75",
        baseValue: "Sampling (10%)",
        operatorValue: "100% Each piece verification",
        mandatoryLevel: "Mandatory",
        notes: "XRF spectroscopy before delivery and marking.",
      },
      {
        id: "SA-06",
        category: "Flanges",
        parameter: "Inspection Certificate Type",
        baseStandard: "EN 10204",
        baseValue: "Type 3.1",
        operatorValue: "Type 3.1 + Aramco Approved 9COM Mill",
        mandatoryLevel: "Mandatory",
        notes: "Mill must have active Aramco RVL (Approved Vendor List) status.",
      },
    ],
  },
  {
    id: "ADNOC",
    operator: "ADNOC (Abu Dhabi National Oil Co)",
    country: "United Arab Emirates (UAE)",
    logoBadge: "bg-blue-700 text-white",
    specCode: "DGS-1300 / DGS-1400",
    title: "ADNOC Offshore & Onshore Piping & Valves Material Standard",
    revision: "Rev 4 (ADNOC Technical Guidelines)",
    requirements: [
      {
        id: "AD-01",
        category: "Pipes",
        parameter: "Maximum Hardness (Sour Service)",
        baseStandard: "NACE MR0175",
        baseValue: "≤ 22 HRC (250 HBW)",
        operatorValue: "≤ 248 HV10 (22 HRC max across HAZ & weld)",
        mandatoryLevel: "Mandatory",
        notes: "Vickers microhardness traverse per ISO 6507-1.",
      },
      {
        id: "AD-02",
        category: "Pipes",
        parameter: "Inspection Certificate Standard",
        baseStandard: "EN 10204",
        baseValue: "Type 3.1",
        operatorValue: "Type 3.2 for Critical Sour Lines (DNV/BV/TUV)",
        mandatoryLevel: "Critical Sour",
        notes: "Independent 3rd party inspector witness required.",
      },
      {
        id: "AD-03",
        category: "Flanges",
        parameter: "Gasket Facing Finish (Serrated)",
        baseStandard: "ASME B16.5",
        baseValue: "Ra 3.2 - 6.3 µm",
        operatorValue: "Ra 3.2 - 6.3 µm concentric or spiral serrated",
        mandatoryLevel: "Mandatory",
        notes: "Must be 100% inspected and protected with heavy flange covers.",
      },
      {
        id: "AD-04",
        category: "Valves",
        parameter: "Fugitive Emission Testing",
        baseStandard: "API 6D",
        baseValue: "Manufacturer Standard",
        operatorValue: "ISO 15848-1 Class BH (Helium leak test)",
        mandatoryLevel: "Mandatory",
        notes: "Tested at design pressure and ambient/maximum temperature cycles.",
      },
      {
        id: "AD-05",
        category: "Pipes",
        parameter: "Hydrostatic Test Duration",
        baseStandard: "ASTM A106 / A333",
        baseValue: "5 seconds hold",
        operatorValue: "Min 15 seconds hold with chart recorder",
        mandatoryLevel: "Mandatory",
        notes: "100% mill hydrotest at 95% SMYS.",
      },
    ],
  },
  {
    id: "PDO",
    operator: "Petroleum Development Oman (PDO)",
    country: "Sultanate of Oman",
    logoBadge: "bg-amber-700 text-white",
    specCode: "SP-1173 / DEP 31.38.01.11-Gen",
    title: "Welded and Seamless Linepipe Specification (Shell DEP Alignment)",
    revision: "SP-1173 Version 4.0",
    requirements: [
      {
        id: "PDO-01",
        category: "Pipes",
        parameter: "Charpy Impact Energy at -29°C",
        baseStandard: "ASTM A333 Gr 6",
        baseValue: "Min 27 J avg, 20 J single",
        operatorValue: "Min 40 J avg, 30 J single at -29°C",
        mandatoryLevel: "Mandatory",
        notes: "Enhanced toughness required for desert sub-zero winter temperatures.",
      },
      {
        id: "PDO-02",
        category: "Pipes",
        parameter: "Yield-to-Tensile Ratio (Y/T)",
        baseStandard: "API 5L PSL2",
        baseValue: "≤ 0.93",
        operatorValue: "≤ 0.90 for Grade X60 and lower",
        mandatoryLevel: "Mandatory",
        notes: "Ensures plastic deformation capacity in buried pipeline.",
      },
      {
        id: "PDO-03",
        category: "Fittings",
        parameter: "Non-Destructive Examination (NDE)",
        baseStandard: "ASME B16.9",
        baseValue: "Visual & Dimensional",
        operatorValue: "100% MT/PT on bevel ends + 100% RT on welds",
        mandatoryLevel: "Critical Sour",
        notes: "Full volumetric inspection required for sour service fittings.",
      },
    ],
  },
  {
    id: "QATARENERGY",
    operator: "QatarEnergy",
    country: "State of Qatar",
    logoBadge: "bg-purple-800 text-white",
    specCode: "QP-ENG-STD-004 / ES-S-01",
    title: "CRA Piping and Sour Gas Material Specification",
    revision: "Rev 2023",
    requirements: [
      {
        id: "QE-01",
        category: "Pipes",
        parameter: "Duplex 2205 Ferrite Content",
        baseStandard: "ASTM A790",
        baseValue: "35% - 65%",
        operatorValue: "40% - 60% per ASTM E562 / E1245",
        mandatoryLevel: "Mandatory",
        notes: "Point count method across base metal and HAZ.",
      },
      {
        id: "QE-02",
        category: "Pipes",
        parameter: "Critical Pitting Temperature (CPT / G48)",
        baseStandard: "ASTM G48 Method A",
        baseValue: "20°C for 24 hours",
        operatorValue: "25°C for 24 hours (No pitting at 20x)",
        mandatoryLevel: "Critical Sour",
        notes: "Weight loss < 4.0 g/m² mandatory.",
      },
      {
        id: "QE-03",
        category: "Fasteners",
        parameter: "Stud Bolts for Marine / Sour Service",
        baseStandard: "ASTM A193 B7",
        baseValue: "Standard B7",
        operatorValue: "ASTM A193 B7M + PTFE Xylan 1424 Blue Coating",
        mandatoryLevel: "Mandatory",
        notes: "Max 235 HBW / 22 HRC hardness for B7M.",
      },
    ],
  },
];

export default function ProjectSpecsPage() {
  const [selectedOpId, setSelectedOpId] = useState("ARAMCO");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [concessionModalOpen, setConcessionModalOpen] = useState(false);
  const [activeReqForConcession, setActiveReqForConcession] = useState<SpecRequirement | null>(null);

  const activeOp = OPERATOR_SPECS.find((o) => o.id === selectedOpId) || OPERATOR_SPECS[0];

  // Filtering
  const filteredRequirements = activeOp.requirements.filter((req) => {
    const matchesCategory = selectedCategory === "ALL" || req.category === selectedCategory;
    const matchesSearch =
      req.parameter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.operatorValue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.notes.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-6 rounded-2xl text-white shadow-xl border border-slate-700/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400 shrink-0">
              <CheckCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30">
                  MSG OILFIELD COMPLIANCE MATRIX
                </span>
                <span className="text-xs text-slate-400">• Middle East Energy Standards</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-1">
                End-User Project Specifications Compliance Matrix
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Compare mill test certificates against Saudi Aramco, ADNOC, PDO, and QatarEnergy
                project engineering additions. Flag variances and generate Deviation Requests (CDR).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/dashboard/documents/mtc-analyzer"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-md shadow-amber-600/30"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Verify In MTC Analyzer</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Operator Selector Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {OPERATOR_SPECS.map((op) => {
          const isSelected = selectedOpId === op.id;
          return (
            <button
              key={op.id}
              onClick={() => setSelectedOpId(op.id)}
              className={`p-4 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "bg-white border-blue-500 shadow-md ring-2 ring-blue-500/20"
                  : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{op.operator}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${op.logoBadge}`}>
                  {op.id}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-mono truncate">{op.specCode}</p>
              <p className="text-[10px] text-slate-400 mt-2">{op.country}</p>
            </button>
          );
        })}
      </div>

      {/* Active Operator Banner & Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">{activeOp.operator} Specification</h2>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-medium">
                {activeOp.specCode}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{activeOp.title} ({activeOp.revision})</p>
          </div>

          {/* Commodity Category Badges */}
          <div className="flex flex-wrap gap-1.5">
            {["ALL", "Pipes", "Fittings", "Flanges", "Valves", "Fasteners"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-slate-900 text-white font-semibold"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeOp.operator} clauses, limits, NACE, test parameters...`}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Item & Commodity</th>
                <th className="py-3 px-4">Quality Parameter</th>
                <th className="py-3 px-4">Base Mill / ASTM Standard</th>
                <th className="py-3 px-4 text-blue-700">{activeOp.operator} Required Value</th>
                <th className="py-3 px-4">Compliance Level</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRequirements.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-700 mr-2">
                      {req.category}
                    </span>
                    <span className="font-mono text-slate-500">{req.id}</span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">{req.parameter}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-700">{req.baseStandard}</span>
                    <span className="text-slate-500 block text-[11px] font-mono">{req.baseValue}</span>
                  </td>
                  <td className="py-3 px-4 bg-blue-50/40">
                    <span className="font-bold text-blue-900 font-mono">{req.operatorValue}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{req.notes}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        req.mandatoryLevel === "Critical Sour"
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : req.mandatoryLevel === "Mandatory"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {req.mandatoryLevel}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        setActiveReqForConcession(req);
                        setConcessionModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[11px] font-medium transition cursor-pointer"
                    >
                      Draft CDR
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Concession / Deviation Request Modal */}
      {concessionModalOpen && activeReqForConcession && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Engineering Concession / Deviation Request (CDR)
                </h3>
              </div>
              <button
                onClick={() => setConcessionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ×
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                <p className="font-bold">Operator: {activeOp.operator} ({activeOp.specCode})</p>
                <p className="mt-0.5">Clause: {activeReqForConcession.parameter}</p>
                <p className="text-[11px] mt-0.5 font-mono text-amber-800">
                  Requirement: {activeReqForConcession.operatorValue}
                </p>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Proposed Deviation / Mill Actual Value
                </label>
                <input
                  type="text"
                  defaultValue={`Heat actual: ${activeReqForConcession.baseValue} per standard mill production.`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Technical Justification for Concession
                </label>
                <textarea
                  rows={3}
                  defaultValue="Mechanical tensile and Charpy impact tests exceed SMYS by >15%. Material is fit for intended design pressure with no compromise on sour service resistance."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setConcessionModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert(`Concession Request CDR-${activeReqForConcession.id}-2026 logged for ${activeOp.operator} Quality Engineer.`);
                    setConcessionModalOpen(false);
                  }}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold"
                >
                  Submit CDR to Client
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
