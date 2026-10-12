"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FlaskConical,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  ShieldCheck,
  FileText,
  RotateCcw,
  Sparkles,
  Download,
  Building,
  Flame,
  ArrowRight,
  Printer,
  Share2,
} from "lucide-react";

// Standard Grade Presets
const MATERIAL_PRESETS = [
  {
    id: "API_5L_X65M_PSL2",
    name: "API 5L X65M PSL2 (Sour Service Linepipe)",
    category: "Linepipe",
    standard: "API 5L / ISO 3183 / NACE MR0175",
    chemLimits: {
      C: { max: 0.12 },
      Si: { max: 0.45 },
      Mn: { max: 1.60 },
      P: { max: 0.015 },
      S: { max: 0.002 },
      Cr: { max: 0.30 },
      Mo: { max: 0.25 },
      Ni: { max: 0.50 },
      Cu: { max: 0.35 },
      V: { max: 0.08 },
      Nb: { max: 0.06 },
      Ti: { max: 0.04 },
      N: { max: 0.012 },
      B: { max: 0.0005 },
    },
    maxCeIiw: 0.42,
    maxPcm: 0.22,
    mechLimits: {
      yieldMin: 450,
      yieldMax: 600,
      tensileMin: 535,
      tensileMax: 760,
      maxYtRatio: 0.93,
      elongationMin: 18,
      hardnessMaxHrc: 22,
      impactTemp: -29,
      impactAvgMin: 40,
      impactSingleMin: 30,
    },
    sampleData: {
      heatNumber: "HT-X65-7729",
      mill: "Vallourec Mannesmann Oil & Gas",
      size: '16" SCH 80 (406.4 x 21.44 mm)',
      C: 0.07,
      Si: 0.28,
      Mn: 1.42,
      P: 0.009,
      S: 0.001,
      Cr: 0.18,
      Mo: 0.12,
      Ni: 0.22,
      Cu: 0.15,
      V: 0.035,
      Nb: 0.032,
      Ti: 0.012,
      N: 0.005,
      B: 0.0001,
      yieldStrength: 485,
      tensileStrength: 590,
      elongation: 26,
      hardnessHrc: 19.5,
      impact1: 145,
      impact2: 152,
      impact3: 138,
      hicClr: 3.2,
      hicCtr: 0.8,
      hicCsr: 0.2,
    },
  },
  {
    id: "ASTM_A333_GR6",
    name: "ASTM A333 Grade 6 (Low-Temperature -46°C Pipe)",
    category: "Seamless Pipe",
    standard: "ASTM A333 / ASME SA333",
    chemLimits: {
      C: { max: 0.30 },
      Si: { min: 0.10 },
      Mn: { min: 0.29, max: 1.06 },
      P: { max: 0.025 },
      S: { max: 0.025 },
      Cr: { max: 0.30 },
      Mo: { max: 0.12 },
      Ni: { max: 0.40 },
      Cu: { max: 0.40 },
      V: { max: 0.08 },
    },
    maxCeIiw: 0.43,
    maxPcm: 0.23,
    mechLimits: {
      yieldMin: 240,
      yieldMax: 450,
      tensileMin: 415,
      tensileMax: 655,
      maxYtRatio: 0.85,
      elongationMin: 30,
      hardnessMaxHrc: 20,
      impactTemp: -46,
      impactAvgMin: 27,
      impactSingleMin: 20,
    },
    sampleData: {
      heatNumber: "HT-LT-4491-B",
      mill: "Tenaris Silcotub S.A.",
      size: '8" SCH 40 (219.1 x 8.18 mm)',
      C: 0.14,
      Si: 0.24,
      Mn: 0.95,
      P: 0.012,
      S: 0.003,
      Cr: 0.05,
      Mo: 0.02,
      Ni: 0.08,
      Cu: 0.06,
      V: 0.01,
      Nb: 0.002,
      Ti: 0.001,
      N: 0.004,
      B: 0,
      yieldStrength: 310,
      tensileStrength: 475,
      elongation: 35,
      hardnessHrc: 16.5,
      impact1: 65,
      impact2: 58,
      impact3: 62,
      hicClr: 0,
      hicCtr: 0,
      hicCsr: 0,
    },
  },
  {
    id: "ASTM_A105N",
    name: "ASTM A105N (Normalized Carbon Steel Forged Flange)",
    category: "Flanges & Forgings",
    standard: "ASTM A105 / ASME SA105 / NACE MR0175",
    chemLimits: {
      C: { max: 0.35 },
      Si: { min: 0.10, max: 0.35 },
      Mn: { min: 0.60, max: 1.05 },
      P: { max: 0.035 },
      S: { max: 0.035 },
      Cr: { max: 0.30 },
      Mo: { max: 0.12 },
      Ni: { max: 0.40 },
      Cu: { max: 0.40 },
      V: { max: 0.08 },
    },
    maxCeIiw: 0.45,
    maxPcm: 0.28,
    mechLimits: {
      yieldMin: 250,
      yieldMax: 420,
      tensileMin: 485,
      tensileMax: 655,
      maxYtRatio: 0.85,
      elongationMin: 22,
      hardnessMaxHrc: 22, // 187 HBW
      impactTemp: -20,
      impactAvgMin: 27,
      impactSingleMin: 20,
    },
    sampleData: {
      heatNumber: "H-FLG-9102",
      mill: "Melesi Forged Flanges S.p.A.",
      size: '6" 300# WN RF SCH 40',
      C: 0.19,
      Si: 0.22,
      Mn: 0.88,
      P: 0.014,
      S: 0.004,
      Cr: 0.08,
      Mo: 0.02,
      Ni: 0.05,
      Cu: 0.04,
      V: 0.005,
      Nb: 0.001,
      Ti: 0.001,
      N: 0.004,
      B: 0,
      yieldStrength: 325,
      tensileStrength: 520,
      elongation: 28,
      hardnessHrc: 18.2,
      impact1: 42,
      impact2: 45,
      impact3: 39,
      hicClr: 0,
      hicCtr: 0,
      hicCsr: 0,
    },
  },
  {
    id: "ASTM_A790_UNS_S31803",
    name: "ASTM A790 UNS S31803 / S32205 (Duplex 2205 Pipe)",
    category: "CRA & Duplex",
    standard: "ASTM A790 / ASME SA790 / NACE MR0175",
    chemLimits: {
      C: { max: 0.030 },
      Si: { max: 1.00 },
      Mn: { max: 2.00 },
      P: { max: 0.030 },
      S: { max: 0.020 },
      Cr: { min: 22.0, max: 23.0 },
      Mo: { min: 3.0, max: 3.5 },
      Ni: { min: 4.5, max: 6.5 },
      N: { min: 0.14, max: 0.20 },
    },
    maxCeIiw: 99.0, // N/A for CRA
    maxPcm: 99.0,
    prenMin: 35.0,
    mechLimits: {
      yieldMin: 450,
      yieldMax: 700,
      tensileMin: 655,
      tensileMax: 900,
      maxYtRatio: 0.88,
      elongationMin: 25,
      hardnessMaxHrc: 28, // Max 28 HRC for duplex under NACE
      impactTemp: -40,
      impactAvgMin: 50,
      impactSingleMin: 40,
    },
    sampleData: {
      heatNumber: "DPX-88301",
      mill: "Sandvik Materials Technology",
      size: '4" SCH 40S (114.3 x 6.02 mm)',
      C: 0.018,
      Si: 0.45,
      Mn: 1.35,
      P: 0.018,
      S: 0.001,
      Cr: 22.45,
      Mo: 3.22,
      Ni: 5.60,
      Cu: 0.12,
      V: 0.02,
      Nb: 0.01,
      Ti: 0.005,
      N: 0.175,
      B: 0,
      yieldStrength: 520,
      tensileStrength: 760,
      elongation: 32,
      hardnessHrc: 24.5,
      impact1: 110,
      impact2: 125,
      impact3: 118,
      hicClr: 0,
      hicCtr: 0,
      hicCsr: 0,
    },
  },
];

export default function MtcAnalyzerPage() {
  const [selectedPresetId, setSelectedPresetId] = useState(MATERIAL_PRESETS[0].id);
  const currentPreset = MATERIAL_PRESETS.find((p) => p.id === selectedPresetId) || MATERIAL_PRESETS[0];

  // Certificate Header Info
  const [certInfo, setCertInfo] = useState({
    heatNumber: currentPreset.sampleData.heatNumber,
    mill: currentPreset.sampleData.mill,
    size: currentPreset.sampleData.size,
    specStandard: currentPreset.standard,
    inspectionCertificate: "EN 10204 3.1",
    clientProject: "ADNOC Offshore Ruwais Expansion / Aramco 01-SAMSS-035",
  });

  // Chemical inputs
  const [chem, setChem] = useState({
    C: currentPreset.sampleData.C,
    Si: currentPreset.sampleData.Si,
    Mn: currentPreset.sampleData.Mn,
    P: currentPreset.sampleData.P,
    S: currentPreset.sampleData.S,
    Cr: currentPreset.sampleData.Cr,
    Mo: currentPreset.sampleData.Mo,
    Ni: currentPreset.sampleData.Ni,
    Cu: currentPreset.sampleData.Cu,
    V: currentPreset.sampleData.V,
    Nb: currentPreset.sampleData.Nb,
    Ti: currentPreset.sampleData.Ti,
    N: currentPreset.sampleData.N,
    B: currentPreset.sampleData.B,
  });

  // Mechanical inputs
  const [mech, setMech] = useState({
    yieldStrength: currentPreset.sampleData.yieldStrength,
    tensileStrength: currentPreset.sampleData.tensileStrength,
    elongation: currentPreset.sampleData.elongation,
    hardnessHrc: currentPreset.sampleData.hardnessHrc,
    impact1: currentPreset.sampleData.impact1,
    impact2: currentPreset.sampleData.impact2,
    impact3: currentPreset.sampleData.impact3,
    hicClr: currentPreset.sampleData.hicClr,
    hicCtr: currentPreset.sampleData.hicCtr,
    hicCsr: currentPreset.sampleData.hicCsr,
  });

  // Switch preset
  const handlePresetChange = (id: string) => {
    setSelectedPresetId(id);
    const p = MATERIAL_PRESETS.find((x) => x.id === id);
    if (p) {
      setCertInfo({
        heatNumber: p.sampleData.heatNumber,
        mill: p.sampleData.mill,
        size: p.sampleData.size,
        specStandard: p.standard,
        inspectionCertificate: "EN 10204 3.1",
        clientProject: "GCC Energy Operator Project",
      });
      setChem({
        C: p.sampleData.C,
        Si: p.sampleData.Si,
        Mn: p.sampleData.Mn,
        P: p.sampleData.P,
        S: p.sampleData.S,
        Cr: p.sampleData.Cr,
        Mo: p.sampleData.Mo,
        Ni: p.sampleData.Ni,
        Cu: p.sampleData.Cu,
        V: p.sampleData.V,
        Nb: p.sampleData.Nb,
        Ti: p.sampleData.Ti,
        N: p.sampleData.N,
        B: p.sampleData.B,
      });
      setMech({
        yieldStrength: p.sampleData.yieldStrength,
        tensileStrength: p.sampleData.tensileStrength,
        elongation: p.sampleData.elongation,
        hardnessHrc: p.sampleData.hardnessHrc,
        impact1: p.sampleData.impact1,
        impact2: p.sampleData.impact2,
        impact3: p.sampleData.impact3,
        hicClr: p.sampleData.hicClr,
        hicCtr: p.sampleData.hicCtr,
        hicCsr: p.sampleData.hicCsr,
      });
    }
  };

  // 1. Calculations
  // CE(IIW) = C + Mn/6 + (Cr+Mo+V)/5 + (Ni+Cu)/15
  const ceIiw =
    chem.C +
    chem.Mn / 6 +
    (chem.Cr + chem.Mo + chem.V) / 5 +
    (chem.Ni + chem.Cu) / 15;

  // Pcm = C + Si/30 + (Mn+Cu+Cr)/20 + Ni/60 + Mo/15 + V/10 + 5B
  const pcm =
    chem.C +
    chem.Si / 30 +
    (chem.Mn + chem.Cu + chem.Cr) / 20 +
    chem.Ni / 60 +
    chem.Mo / 15 +
    chem.V / 10 +
    5 * chem.B;

  // PREN = Cr + 3.3*(Mo) + 16*N
  const pren = chem.Cr + 3.3 * chem.Mo + 16 * chem.N;

  // Yield to Tensile Ratio
  const ytRatio = mech.tensileStrength > 0 ? mech.yieldStrength / mech.tensileStrength : 0;

  // Charpy Impact Average
  const impactAvg = (mech.impact1 + mech.impact2 + mech.impact3) / 3;
  const impactSingleMin = Math.min(mech.impact1, mech.impact2, mech.impact3);

  // 2. Evaluators
  const failures: string[] = [];
  const warnings: string[] = [];

  // Chemical checks
  Object.entries(currentPreset.chemLimits).forEach(([element, limit]: [string, any]) => {
    const val = (chem as any)[element] || 0;
    if (limit.max !== undefined && val > limit.max) {
      failures.push(
        `${element} (${val}%) exceeds maximum limit of ${limit.max}% per ${currentPreset.standard}`
      );
    }
    if (limit.min !== undefined && val < limit.min) {
      failures.push(
        `${element} (${val}%) is below minimum requirement of ${limit.min}% per ${currentPreset.standard}`
      );
    }
  });

  // CEV check
  if (currentPreset.maxCeIiw && currentPreset.maxCeIiw < 90 && ceIiw > currentPreset.maxCeIiw) {
    failures.push(`Carbon Equivalent CE(IIW) ${ceIiw.toFixed(3)} exceeds max ${currentPreset.maxCeIiw}`);
  } else if (currentPreset.maxCeIiw && ceIiw > currentPreset.maxCeIiw - 0.02) {
    warnings.push(`CE(IIW) is near upper threshold (${ceIiw.toFixed(3)} vs max ${currentPreset.maxCeIiw})`);
  }

  // Pcm check
  if (currentPreset.maxPcm && currentPreset.maxPcm < 90 && pcm > currentPreset.maxPcm) {
    failures.push(`Cracking Parameter Pcm ${pcm.toFixed(3)} exceeds max ${currentPreset.maxPcm}`);
  }

  // PREN check for Duplex
  if (currentPreset.prenMin && pren < currentPreset.prenMin) {
    failures.push(`Pitting Resistance Equivalent PREN ${pren.toFixed(2)} is below min ${currentPreset.prenMin}`);
  }

  // Mechanical checks
  const m = currentPreset.mechLimits;
  if (mech.yieldStrength < m.yieldMin) {
    failures.push(`Yield Strength ${mech.yieldStrength} MPa is below min ${m.yieldMin} MPa`);
  }
  if (mech.yieldStrength > m.yieldMax) {
    failures.push(`Yield Strength ${mech.yieldStrength} MPa exceeds max ${m.yieldMax} MPa`);
  }
  if (mech.tensileStrength < m.tensileMin) {
    failures.push(`Tensile Strength ${mech.tensileStrength} MPa is below min ${m.tensileMin} MPa`);
  }
  if (mech.tensileStrength > m.tensileMax) {
    failures.push(`Tensile Strength ${mech.tensileStrength} MPa exceeds max ${m.tensileMax} MPa`);
  }
  if (ytRatio > m.maxYtRatio) {
    failures.push(`Yield/Tensile Ratio ${ytRatio.toFixed(3)} exceeds maximum allowed ${m.maxYtRatio}`);
  }
  if (mech.elongation < m.elongationMin) {
    failures.push(`Elongation ${mech.elongation}% is below minimum ${m.elongationMin}%`);
  }
  if (mech.hardnessHrc > m.hardnessMaxHrc) {
    failures.push(
      `Hardness ${mech.hardnessHrc} HRC exceeds NACE MR0175 sour service limit of ${m.hardnessMaxHrc} HRC (250 HBW)`
    );
  }

  // Impact checks
  if (impactAvg < m.impactAvgMin) {
    failures.push(`Charpy Avg Impact ${impactAvg.toFixed(1)} J is below min required ${m.impactAvgMin} J at ${m.impactTemp}°C`);
  }
  if (impactSingleMin < m.impactSingleMin) {
    failures.push(
      `Charpy Single Min Specimen ${impactSingleMin} J is below individual threshold ${m.impactSingleMin} J at ${m.impactTemp}°C`
    );
  }

  const isCompliant = failures.length === 0;

  return (
    <div className="space-y-6">
      {/* Top Banner with MSG Oilfield Branding */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 rounded-2xl text-white shadow-xl border border-slate-700/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  MSG OILFIELD ENGINEERING
                </span>
                <span className="text-xs text-slate-400">• Dubai Technical QA Desk</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-1">
                MTC Chemical & Mechanical Compliance Analyzer
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Automatic CE(IIW), Pcm, PREN, Y/T ratio, and Charpy impact energy verification against
                API 5L, ASME Sec II, NACE MR0175, Saudi Aramco 01-SAMSS-035, and ADNOC DGS specifications.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Inspection Sheet</span>
            </button>
            <Link
              href="/dashboard/documents/upload"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-md shadow-amber-600/30"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Attach to Document</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Preset Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Material Standard & Grade Preset:
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {MATERIAL_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetChange(preset.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border ${
                selectedPresetId === preset.id
                  ? "bg-amber-500 text-white border-amber-600 shadow-xs font-semibold"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Compliance Verdict Banner */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          isCompliant
            ? "bg-emerald-50/80 border-emerald-300 text-emerald-950"
            : "bg-rose-50/80 border-rose-300 text-rose-950"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`p-2 rounded-xl text-white shrink-0 mt-0.5 ${
                isCompliant ? "bg-emerald-600" : "bg-rose-600"
              }`}
            >
              {isCompliant ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    isCompliant
                      ? "bg-emerald-200 text-emerald-900 border border-emerald-300"
                      : "bg-rose-200 text-rose-900 border border-rose-300"
                  }`}
                >
                  {isCompliant ? "VERDICT: FULLY COMPLIANT (PASS)" : "VERDICT: NON-CONFORMANT (REJECT)"}
                </span>
                <span className="text-xs font-mono text-slate-600">
                  Heat #{certInfo.heatNumber} • {currentPreset.standard}
                </span>
              </div>
              <h3 className="text-base font-bold mt-1">
                {isCompliant
                  ? "All chemical composition, carbon equivalents, and mechanical test values meet specification limits."
                  : `${failures.length} Non-Conformances Detected against ${currentPreset.name}`}
              </h3>
              {failures.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-rose-800 list-disc list-inside">
                  {failures.map((f, i) => (
                    <li key={i} className="font-medium">{f}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-3 gap-2 shrink-0 bg-white/70 backdrop-blur-xs p-3 rounded-xl border border-slate-200/60">
            <div className="text-center px-2">
              <span className="text-[10px] font-semibold text-slate-500 uppercase block">CE(IIW)</span>
              <span className={`text-sm font-bold font-mono ${ceIiw > (currentPreset.maxCeIiw || 0.42) ? "text-rose-600" : "text-emerald-700"}`}>
                {ceIiw.toFixed(3)}
              </span>
              <span className="text-[9px] text-slate-400 block">max {currentPreset.maxCeIiw || "N/A"}</span>
            </div>
            <div className="text-center px-2 border-x border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase block">Y/T Ratio</span>
              <span className={`text-sm font-bold font-mono ${ytRatio > currentPreset.mechLimits.maxYtRatio ? "text-rose-600" : "text-emerald-700"}`}>
                {ytRatio.toFixed(3)}
              </span>
              <span className="text-[9px] text-slate-400 block">max {currentPreset.mechLimits.maxYtRatio}</span>
            </div>
            <div className="text-center px-2">
              <span className="text-[10px] font-semibold text-slate-500 uppercase block">Charpy Avg</span>
              <span className={`text-sm font-bold font-mono ${impactAvg < currentPreset.mechLimits.impactAvgMin ? "text-rose-600" : "text-emerald-700"}`}>
                {impactAvg.toFixed(1)} J
              </span>
              <span className="text-[9px] text-slate-400 block">@{currentPreset.mechLimits.impactTemp}°C</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Inputs and Real-Time Limits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Chemistry & Heat Details (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Certificate Identification */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <Building className="w-4 h-4 text-amber-600" />
              1. Heat & Manufacturer Metadata
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Heat Number</label>
                <input
                  type="text"
                  value={certInfo.heatNumber}
                  onChange={(e) => setCertInfo({ ...certInfo, heatNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-medium text-slate-900 focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Mill / Manufacturer</label>
                <input
                  type="text"
                  value={certInfo.mill}
                  onChange={(e) => setCertInfo({ ...certInfo, mill: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Dimension / Size</label>
                <input
                  type="text"
                  value={certInfo.size}
                  onChange={(e) => setCertInfo({ ...certInfo, size: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Chemical Composition Table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-amber-600" />
                2. Ladle Chemical Composition (wt. %)
              </h2>
              <span className="text-[10px] text-slate-500">Limits per {currentPreset.standard}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.keys(chem).map((elem) => {
                const val = (chem as any)[elem];
                const limit = (currentPreset.chemLimits as any)[elem];
                const isOver = limit?.max !== undefined && val > limit.max;
                const isUnder = limit?.min !== undefined && val < limit.min;
                const isElemBad = isOver || isUnder;

                return (
                  <div
                    key={elem}
                    className={`p-2.5 rounded-xl border transition ${
                      isElemBad
                        ? "bg-rose-50/80 border-rose-300"
                        : "bg-slate-50 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">{elem}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {limit?.max !== undefined ? `≤${limit.max}` : ""}{" "}
                        {limit?.min !== undefined ? `≥${limit.min}` : ""}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      <input
                        type="number"
                        step="0.001"
                        value={val}
                        onChange={(e) =>
                          setChem({ ...chem, [elem]: parseFloat(e.target.value) || 0 })
                        }
                        className={`w-full bg-white border rounded px-2 py-1 text-xs font-mono font-medium focus:outline-hidden ${
                          isElemBad
                            ? "border-rose-400 text-rose-700"
                            : "border-slate-200 text-slate-900 focus:border-amber-500"
                        }`}
                      />
                      <span className="text-[10px] text-slate-500">%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Carbon Equivalent Formula Showcase */}
            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 text-xs text-amber-950 space-y-2">
              <div className="flex items-center justify-between font-semibold">
                <span>Calculated Carbon Equivalent & Cracking Parameter</span>
                <span className="text-[10px] bg-amber-200/60 px-1.5 py-0.5 rounded text-amber-800">
                  Weldability Index
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="bg-white p-2 rounded border border-amber-200">
                  <span className="text-slate-500 block">CE(IIW) = C + Mn/6 + (Cr+Mo+V)/5 + (Ni+Cu)/15</span>
                  <span className="font-bold text-xs text-amber-900">
                    Result: {ceIiw.toFixed(4)} wt.%{" "}
                    {currentPreset.maxCeIiw && (
                      <span className={ceIiw <= currentPreset.maxCeIiw ? "text-emerald-600" : "text-rose-600"}>
                        (Limit: ≤{currentPreset.maxCeIiw})
                      </span>
                    )}
                  </span>
                </div>
                <div className="bg-white p-2 rounded border border-amber-200">
                  <span className="text-slate-500 block">Pcm = C + Si/30 + (Mn+Cu+Cr)/20 + Ni/60 + ...</span>
                  <span className="font-bold text-xs text-amber-900">
                    Result: {pcm.toFixed(4)} wt.%{" "}
                    {currentPreset.maxPcm && (
                      <span className={pcm <= currentPreset.maxPcm ? "text-emerald-600" : "text-rose-600"}>
                        (Limit: ≤{currentPreset.maxPcm})
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Mechanical & Impact Properties (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                3. Mechanical Properties
              </h2>
              <span className="text-[10px] text-slate-500">Room Temp Tensile</span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">Yield Strength (Rt0.5 / Rp0.2)</span>
                  <span className="text-slate-400 font-mono">
                    Req: {currentPreset.mechLimits.yieldMin} - {currentPreset.mechLimits.yieldMax} MPa
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={mech.yieldStrength}
                    onChange={(e) => setMech({ ...mech, yieldStrength: parseFloat(e.target.value) || 0 })}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono font-medium text-slate-900 focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-500">MPa</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">Tensile Strength (Rm)</span>
                  <span className="text-slate-400 font-mono">
                    Req: {currentPreset.mechLimits.tensileMin} - {currentPreset.mechLimits.tensileMax} MPa
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={mech.tensileStrength}
                    onChange={(e) => setMech({ ...mech, tensileStrength: parseFloat(e.target.value) || 0 })}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono font-medium text-slate-900 focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-500">MPa</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">Elongation (A%)</span>
                    <span className="text-slate-400 font-mono">≥{currentPreset.mechLimits.elongationMin}%</span>
                  </div>
                  <input
                    type="number"
                    value={mech.elongation}
                    onChange={(e) => setMech({ ...mech, elongation: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono font-medium text-slate-900 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">Hardness (HRC)</span>
                    <span className="text-slate-400 font-mono">≤{currentPreset.mechLimits.hardnessMaxHrc}</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={mech.hardnessHrc}
                    onChange={(e) => setMech({ ...mech, hardnessHrc: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono font-medium text-slate-900 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Charpy Impact Testing */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500" />
                4. Charpy V-Notch Impact Test
              </h2>
              <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                Test Temp: {currentPreset.mechLimits.impactTemp}°C
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-snug">
              Required Min Average: <strong className="text-slate-700">{currentPreset.mechLimits.impactAvgMin} J</strong> • 
              Min Individual Specimen: <strong className="text-slate-700">{currentPreset.mechLimits.impactSingleMin} J</strong>
            </p>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">Specimen 1 (J)</label>
                <input
                  type="number"
                  value={mech.impact1}
                  onChange={(e) => setMech({ ...mech, impact1: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-medium"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">Specimen 2 (J)</label>
                <input
                  type="number"
                  value={mech.impact2}
                  onChange={(e) => setMech({ ...mech, impact2: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-medium"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">Specimen 3 (J)</label>
                <input
                  type="number"
                  value={mech.impact3}
                  onChange={(e) => setMech({ ...mech, impact3: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-medium"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Specimen Average</span>
                <span className={`text-base font-bold font-mono ${impactAvg < currentPreset.mechLimits.impactAvgMin ? "text-rose-600" : "text-emerald-700"}`}>
                  {impactAvg.toFixed(1)} Joules
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Lowest Specimen</span>
                <span className={`text-base font-bold font-mono ${impactSingleMin < currentPreset.mechLimits.impactSingleMin ? "text-rose-600" : "text-emerald-700"}`}>
                  {impactSingleMin} Joules
                </span>
              </div>
            </div>
          </div>

          {/* NACE MR0175 / HIC Resistance */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              5. Sour Service HIC Test (NACE TM0284)
            </h2>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">CLR (Crack Length Ratio)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    value={mech.hicClr}
                    onChange={(e) => setMech({ ...mech, hicClr: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-400">%</span>
                </div>
                <span className="text-[9px] text-slate-400">Max ≤ 15%</span>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">CTR (Crack Thickness)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    value={mech.hicCtr}
                    onChange={(e) => setMech({ ...mech, hicCtr: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-400">%</span>
                </div>
                <span className="text-[9px] text-slate-400">Max ≤ 5%</span>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">CSR (Crack Sensitivity)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    value={mech.hicCsr}
                    onChange={(e) => setMech({ ...mech, hicCsr: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-400">%</span>
                </div>
                <span className="text-[9px] text-slate-400">Max ≤ 2%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
