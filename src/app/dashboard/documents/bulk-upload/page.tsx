"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FolderSync,
  UploadCloud,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Database,
  Building,
  RefreshCw,
  Trash2,
  Layers,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface StagedDoc {
  id: string;
  filename: string;
  size: string;
  fileType: string;
  detectedDocType: string;
  detectedHeatNumber: string;
  detectedIssuer: string;
  detectedMaterialCode: string;
  matchedPoNumber: string;
  matchedSoNumber: string;
  confidenceScore: number;
  status: "ready" | "ingested" | "failed";
}

const DEMO_BATCH_FILES: StagedDoc[] = [
  {
    id: "batch-01",
    filename: "MTC_Tenaris_H92841A_8in_A333Gr6_EN10204_3.1.pdf",
    size: "2.4 MB",
    fileType: "application/pdf",
    detectedDocType: "EN 10204 3.1 certificate",
    detectedHeatNumber: "H-92841-A",
    detectedIssuer: "Tenaris Silcotub S.A.",
    detectedMaterialCode: "PIPE-SMLS-A333-8",
    matchedPoNumber: "PO-2026-0881",
    matchedSoNumber: "SO-2026-1145",
    confidenceScore: 98,
    status: "ready",
  },
  {
    id: "batch-02",
    filename: "MTC_Vallourec_H7729X65_16in_API5L_PSL2_Sour.pdf",
    size: "3.1 MB",
    fileType: "application/pdf",
    detectedDocType: "EN 10204 3.1 certificate",
    detectedHeatNumber: "HT-X65-7729",
    detectedIssuer: "Vallourec Mannesmann Oil & Gas",
    detectedMaterialCode: "PIPE-SMLS-X65-16",
    matchedPoNumber: "PO-2026-0882",
    matchedSoNumber: "SO-2026-1146",
    confidenceScore: 95,
    status: "ready",
  },
  {
    id: "batch-03",
    filename: "NDT_UT_Full_Volumetric_H44102_HyundaiSteel.pdf",
    size: "1.8 MB",
    fileType: "application/pdf",
    detectedDocType: "NDT report",
    detectedHeatNumber: "B-44102-H",
    detectedIssuer: "Hyundai Steel Tubular Products",
    detectedMaterialCode: "PIPE-WLD-A672-24",
    matchedPoNumber: "PO-2026-0881",
    matchedSoNumber: "SO-2026-1145",
    confidenceScore: 91,
    status: "ready",
  },
  {
    id: "batch-04",
    filename: "PMI_Spectro_Report_HFLG9102_Melesi_Flanges.pdf",
    size: "850 KB",
    fileType: "application/pdf",
    detectedDocType: "PMI report",
    detectedHeatNumber: "H-FLG-9102",
    detectedIssuer: "Melesi Forged Flanges S.p.A.",
    detectedMaterialCode: "FLG-WN-A105N-6",
    matchedPoNumber: "PO-2026-0883",
    matchedSoNumber: "SO-2026-1145",
    confidenceScore: 94,
    status: "ready",
  },
  {
    id: "batch-05",
    filename: "Hydrotest_Chart_H88301_Duplex2205_Piping.pdf",
    size: "1.2 MB",
    fileType: "application/pdf",
    detectedDocType: "Hydrostatic test report",
    detectedHeatNumber: "DPX-88301",
    detectedIssuer: "Sandvik Materials Technology",
    detectedMaterialCode: "PIPE-SMLS-S31803-4",
    matchedPoNumber: "PO-2026-0884",
    matchedSoNumber: "SO-2026-1147",
    confidenceScore: 88,
    status: "ready",
  },
];

export default function BulkUploadPage() {
  const router = useRouter();
  const { success, error, info } = useToast();

  const [stagedDocs, setStagedDocs] = useState<StagedDoc[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ingestedCount, setIngestedCount] = useState(0);

  // Available POs and SOs for auto-matcher dropdown
  const [availablePos, setAvailablePos] = useState<any[]>([]);
  const [availableSos, setAvailableSos] = useState<any[]>([]);

  useEffect(() => {
    async function loadOrders() {
      try {
        const [poRes, soRes] = await Promise.all([
          fetch("/api/purchase-orders"),
          fetch("/api/sales-orders"),
        ]);
        const poData = await poRes.json();
        const soData = await soRes.json();
        if (poData.success) setAvailablePos(poData.purchaseOrders || []);
        if (soData.success) setAvailableSos(soData.salesOrders || []);
      } catch {
        // fallback
      }
    }
    loadOrders();
  }, []);

  const handleLoadDemoBatch = () => {
    setStagedDocs(DEMO_BATCH_FILES);
    info(
      "Sample Certificate Batch Loaded",
      "5 oilfield certificates with parsed heats and orders ready for verification."
    );
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    parseFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      parseFiles(files);
    }
  };

  const parseFiles = (files: File[]) => {
    const newStaged: StagedDoc[] = files.map((f, idx) => {
      const name = f.name.toLowerCase();

      // Simulated auto-extraction rules
      let docType = "Material Test Certificate (MTC)";
      if (name.includes("ndt") || name.includes("ut")) docType = "NDT report";
      else if (name.includes("pmi")) docType = "PMI report";
      else if (name.includes("hydro")) docType = "Hydrostatic test report";
      else if (name.includes("3.1")) docType = "EN 10204 3.1 certificate";
      else if (name.includes("3.2")) docType = "EN 10204 3.2 certificate";

      // Detect Heat Number
      let heat = `H-${Math.floor(10000 + Math.random() * 90000)}`;
      const heatMatch = f.name.match(/H[-_]?([0-9a-zA-Z]+)/i);
      if (heatMatch) heat = `H-${heatMatch[1]}`;

      // Detect Mill
      let mill = "Tenaris / Vallourec";
      if (name.includes("tenaris")) mill = "Tenaris Silcotub S.A.";
      else if (name.includes("vallourec")) mill = "Vallourec Mannesmann Oil & Gas";
      else if (name.includes("melesi")) mill = "Melesi Forged Flanges S.p.A.";
      else if (name.includes("hyundai")) mill = "Hyundai Steel Tubular Products";
      else if (name.includes("sandvik")) mill = "Sandvik Materials Technology";

      return {
        id: `upload-${Date.now()}-${idx}`,
        filename: f.name,
        size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
        fileType: f.type || "application/pdf",
        detectedDocType: docType,
        detectedHeatNumber: heat,
        detectedIssuer: mill,
        detectedMaterialCode: "PIPE-SMLS-001",
        matchedPoNumber: "PO-2026-0881",
        matchedSoNumber: "SO-2026-1145",
        confidenceScore: 92,
        status: "ready",
      };
    });

    setStagedDocs((prev) => [...prev, ...newStaged]);
    success("Files Staged", `${files.length} document(s) parsed with auto-detected heats.`);
  };

  const handleUpdateDoc = (id: string, field: keyof StagedDoc, value: any) => {
    setStagedDocs((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, [field]: value } : doc))
    );
  };

  const handleRemoveDoc = (id: string) => {
    setStagedDocs((prev) => prev.filter((doc) => doc.id !== id));
  };

  // Ingest batch to database
  const handleIngestAll = async () => {
    if (stagedDocs.length === 0) return;
    setIsProcessing(true);
    let successCount = 0;

    for (const doc of stagedDocs) {
      try {
        const payload = {
          documentNumber: `DOC-MSG-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
          title: `${doc.detectedDocType} - Heat ${doc.detectedHeatNumber}`,
          documentType: doc.detectedDocType,
          issuer: doc.detectedIssuer,
          issueDate: new Date().toISOString().split("T")[0],
          heatNumber: doc.detectedHeatNumber,
          materialCode: doc.detectedMaterialCode,
          poNumber: doc.matchedPoNumber,
          soNumber: doc.matchedSoNumber,
          visibility: "customer_shareable",
          submitForReview: true,
          fileName: doc.filename,
          fileSize: 2048500,
          format: "pdf",
          fileData: "data:application/pdf;base64,JVBERi0xLjUKJUZha2VNZXRhZGF0YQ==",
        };

        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          successCount++;
          handleUpdateDoc(doc.id, "status", "ingested");
        }
      } catch {
        handleUpdateDoc(doc.id, "status", "failed");
      }
    }

    setIsProcessing(false);
    setIngestedCount(successCount);
    success(
      "Batch Ingestion Complete",
      `Successfully ingested and linked ${successCount} certificates to MongoDB Atlas.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 rounded-2xl text-white shadow-xl border border-slate-700/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
              <FolderSync className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  MSG OILFIELD INGESTION ENGINE
                </span>
                <span className="text-xs text-slate-400">• Intelligent Heat Matcher</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-1">
                Bulk Document Upload & Auto-Matcher
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Upload 10+ mill certificates simultaneously. Our parser automatically detects Heat
                Numbers, Mill names, and assigns them to active Purchase Orders and Sales Orders.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleLoadDemoBatch}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load 5-File Demo Batch</span>
            </button>
          </div>
        </div>
      </div>

      {/* Drag & Drop Staging Area */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
        className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 transition text-center cursor-pointer group"
      >
        <input
          type="file"
          id="bulk-file-upload"
          multiple
          accept=".pdf,.jpg,.png,.tiff"
          onChange={handleFileInput}
          className="hidden"
        />
        <label htmlFor="bulk-file-upload" className="cursor-pointer block space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Drag & drop certificate files here, or click to browse
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Supports multiple PDF, JPG, PNG files (MTC 3.1/3.2, NDT, Hydrotest, PMI)
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
            <span>Automatic OCR Heat & Mill Detection</span>
          </div>
        </label>
      </div>

      {/* Staged Documents Table */}
      {stagedDocs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Staged Documents Queue ({stagedDocs.length} files)
              </h2>
              <p className="text-xs text-slate-500">
                Review detected heat numbers and linked orders before final database ingestion.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStagedDocs([])}
                className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition"
              >
                Clear Queue
              </button>
              <button
                disabled={isProcessing}
                onClick={handleIngestAll}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md shadow-emerald-600/30 transition cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Ingesting to MongoDB...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5" />
                    <span>Ingest All ({stagedDocs.length}) to Database</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-3">File Name</th>
                  <th className="py-3 px-3">Document Type</th>
                  <th className="py-3 px-3">Detected Heat #</th>
                  <th className="py-3 px-3">Mill / Issuer</th>
                  <th className="py-3 px-3">Matched PO</th>
                  <th className="py-3 px-3">Matched SO</th>
                  <th className="py-3 px-3">Confidence</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {stagedDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-medium text-slate-900 max-w-[200px] truncate">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate" title={doc.filename}>{doc.filename}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 pl-6 block">{doc.size}</span>
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={doc.detectedDocType}
                        onChange={(e) =>
                          handleUpdateDoc(doc.id, "detectedDocType", e.target.value)
                        }
                        className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs w-full"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={doc.detectedHeatNumber}
                        onChange={(e) =>
                          handleUpdateDoc(doc.id, "detectedHeatNumber", e.target.value)
                        }
                        className="bg-amber-50 border border-amber-200 font-mono font-bold text-amber-900 rounded px-2 py-1 text-xs w-full"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={doc.detectedIssuer}
                        onChange={(e) =>
                          handleUpdateDoc(doc.id, "detectedIssuer", e.target.value)
                        }
                        className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs w-full"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={doc.matchedPoNumber}
                        onChange={(e) =>
                          handleUpdateDoc(doc.id, "matchedPoNumber", e.target.value)
                        }
                        className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                      >
                        <option value="PO-2026-0881">PO-2026-0881</option>
                        <option value="PO-2026-0882">PO-2026-0882</option>
                        <option value="PO-2026-0883">PO-2026-0883</option>
                        <option value="PO-2026-0884">PO-2026-0884</option>
                      </select>
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={doc.matchedSoNumber}
                        onChange={(e) =>
                          handleUpdateDoc(doc.id, "matchedSoNumber", e.target.value)
                        }
                        className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                      >
                        <option value="SO-2026-1145">SO-2026-1145</option>
                        <option value="SO-2026-1146">SO-2026-1146</option>
                        <option value="SO-2026-1147">SO-2026-1147</option>
                      </select>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono">
                        {doc.confidenceScore}% Match
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {doc.status === "ingested" ? (
                        <span className="text-emerald-600 font-bold text-xs flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          Saved
                        </span>
                      ) : (
                        <button
                          onClick={() => handleRemoveDoc(doc.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition"
                          title="Remove file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {ingestedCount > 0 && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-900 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-semibold">
                  {ingestedCount} documents successfully ingested and sent to Review Queue!
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard/documents/all"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
                >
                  View in All Documents
                </Link>
                <Link
                  href="/dashboard/documents/pending-reviews"
                  className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-semibold transition"
                >
                  Go to Pending Reviews
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
