"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileCheck,
  AlertCircle,
  Building,
  CheckCircle2,
  Lock,
  Layers,
  ArrowRight,
  FileText,
  X,
  Calendar,
  Hash,
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

export function DocumentUploadForm() {
  const router = useRouter();
  const { success, error, info } = useToast();

  // Dropdown lookup data
  const [materials, setMaterials] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [salesOrders, setSalesOrders] = useState<any[]>([]);

  // Section A: File State
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Section B: Classification State
  const [documentNumber, setDocumentNumber] = useState("");
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState(DOCUMENT_TYPES[0]);
  const [issuer, setIssuer] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");
  const [revision, setRevision] = useState("0");
  const [description, setDescription] = useState("");

  // Section C: Material Linking State
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [materialCode, setMaterialCode] = useState("");
  const [materialGrade, setMaterialGrade] = useState("");
  const [applicableStandard, setApplicableStandard] = useState("");
  const [heatNumber, setHeatNumber] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [serialNumber, setSerialNumber] = useState("");

  // Section D: Business Relationships State
  const [supplierName, setSupplierName] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [soNumber, setSoNumber] = useState("");
  const [shipmentOrDeliveryNumber, setShipmentOrDeliveryNumber] = useState("");

  // Section E: Visibility & Review State
  const [visibilityClassification, setVisibilityClassification] =
    useState<string>("internal_only");
  const [submitForReview, setSubmitForReview] = useState(true);

  // Fetch relational dropdowns from API
  useEffect(() => {
    async function loadLookupData() {
      try {
        const [matRes, batchRes, poRes, soRes] = await Promise.all([
          fetch("/api/materials").then((r) => r.json()),
          fetch("/api/batches").then((r) => r.json()),
          fetch("/api/purchase-orders").then((r) => r.json()),
          fetch("/api/sales-orders").then((r) => r.json()),
        ]);

        if (matRes.materials) setMaterials(matRes.materials);
        if (batchRes.batches) setBatches(batchRes.batches);
        if (poRes.purchaseOrders) setPurchaseOrders(poRes.purchaseOrders);
        if (soRes.salesOrders) setSalesOrders(soRes.salesOrders);
      } catch {
        // Handled silently
      }
    }
    loadLookupData();
  }, []);

  // Material selection auto-fill
  const handleMaterialSelect = (matId: string) => {
    setSelectedMaterialId(matId);
    const found = materials.find((m) => String(m._id || m.id) === matId);
    if (found) {
      setMaterialCode(found.materialCode);
      setMaterialGrade(found.materialGrade);
      setApplicableStandard(found.applicableStandard);
      if (!title) {
        setTitle(`${documentType} - ${found.materialCode}`);
      }
    }
  };

  // Batch selection auto-fill
  const handleBatchSelect = (batchId: string) => {
    const found = batches.find((b) => String(b._id || b.id) === batchId);
    if (found) {
      setBatchNumber(found.batchNumber);
      setHeatNumber(found.heatNumber);
      if (found.materialCode && !materialCode) setMaterialCode(found.materialCode);
      if (found.materialGrade && !materialGrade) setMaterialGrade(found.materialGrade);
      if (found.supplierName && !supplierName) setSupplierName(found.supplierName);
      if (found.poNumber && !poNumber) setPoNumber(found.poNumber);
      if (!documentNumber) {
        setDocumentNumber(`CERT-${found.heatNumber}`);
      }
    }
  };

  // SO selection auto-fill
  const handleSOSelect = (soNum: string) => {
    setSoNumber(soNum);
    const found = salesOrders.find((s) => s.soNumber === soNum);
    if (found) {
      setCustomerName(found.customerName);
    }
  };

  // File drag & drop handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      // Size check (max 25MB)
      if (selected.size > 25 * 1024 * 1024) {
        setFileError("File size exceeds 25 MB maximum limit.");
        return;
      }
      setFile(selected);
      // Auto-suggest title if empty
      if (!title) {
        const cleanName = selected.name.replace(/\.[^/.]+$/, "").replace(/[_]/g, " ");
        setTitle(cleanName);
      }
      if (!documentNumber) {
        setDocumentNumber(`DOC-${Date.now().toString().slice(-6)}`);
      }
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFileError(null);

    if (!file) {
      setFileError("Please attach a certificate or specification file.");
      error("Missing File", "Please select a file to upload.");
      return;
    }

    if (!documentNumber.trim()) {
      error("Missing Field", "Document number is required.");
      return;
    }

    if (!title.trim()) {
      error("Missing Field", "Document title is required.");
      return;
    }

    if (!issuer.trim()) {
      error("Missing Field", "Issuing organization is required.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    try {
      // 1. Upload file to Cloudinary via backend upload endpoint
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);
      formData.append("visibilityClassification", visibilityClassification);

      setUploadProgress(45);
      const uploadRes = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadData.success || !uploadData.file) {
        throw new Error(uploadData.error || "File upload to storage provider failed");
      }

      setUploadProgress(75);

      // 2. Create document record in MongoDB
      const payload = {
        documentNumber: documentNumber.trim(),
        title: title.trim(),
        documentType,
        issuer: issuer.trim(),
        issueDate,
        expiryDate: hasExpiry && expiryDate ? expiryDate : null,
        revision: revision.trim() || "0",
        description: description.trim(),

        materialCode,
        materialGrade,
        applicableStandard,
        heatNumber,
        batchNumber,
        serialNumber,

        supplierName,
        poNumber,
        customerName,
        soNumber,
        shipmentOrDeliveryNumber,

        visibilityClassification,
        submitForReview,

        cloudinaryPublicId: uploadData.file.cloudinaryPublicId,
        cloudinaryUrl: uploadData.file.cloudinaryUrl,
        cloudinaryAssetId: uploadData.file.cloudinaryAssetId || "",
        format: uploadData.file.format,
        fileSize: uploadData.file.fileSize,
      };

      const docRes = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const docData = await docRes.json();
      if (!docData.success) {
        throw new Error(docData.error || "Failed to save document metadata");
      }

      setUploadProgress(100);
      success(
        "Document Registered",
        `${documentNumber} has been uploaded and ${
          submitForReview ? "submitted for quality review." : "saved as draft."
        }`
      );

      // Navigate to all documents table or details
      setTimeout(() => {
        router.push(`/dashboard/documents/${docData.document._id || docData.document.id}`);
      }, 500);
    } catch (err: any) {
      error("Upload Failed", err.message);
      setFileError(err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* SECTION A: File Selection & Drag Drop */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
            A
          </div>
          <h2 className="text-sm font-semibold text-slate-800">File Asset</h2>
        </div>

        <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 text-center bg-slate-50/50 hover:bg-blue-50/20 transition cursor-pointer relative">
          <input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.docx"
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />

          {file ? (
            <div className="flex items-center justify-center gap-3">
              <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
                <FileText className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-800">{file.name}</p>
                <p className="text-[11px] text-slate-500">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || "Document"}
                </p>
                <span className="inline-block mt-1 text-[10px] text-emerald-600 font-medium">
                  Ready to process
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
              <p className="text-xs font-semibold text-slate-700">
                Click or drag & drop certificate file here
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Supports PDF, JPG, PNG, WEBP, and XLSX up to 25 MB
              </p>
            </div>
          )}
        </div>

        {fileError && (
          <div className="mt-3 flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{fileError}</span>
          </div>
        )}

        {isUploading && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Uploading to secure Cloudinary repository...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION B: Document Classification */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
            B
          </div>
          <h2 className="text-sm font-semibold text-slate-800">Document Classification</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Document Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder="e.g. MTC-2026-00412"
              className="w-full border border-slate-200 rounded-lg p-2 font-mono text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Document Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block font-medium text-slate-700 mb-1">
              Document Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. EN 10204 3.2 Mill Test Certificate - Seamless Line Pipe"
              className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Issuing Organization <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              placeholder="e.g. TUV Rheinland / Nippon Steel QA"
              className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Revision Number</label>
            <input
              type="text"
              value={revision}
              onChange={(e) => setRevision(e.target.value)}
              placeholder="0, 1, A, Rev B"
              className="w-full border border-slate-200 rounded-lg p-2 font-mono text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Issue Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-medium text-slate-700">Expiry Date (Optional)</label>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasExpiry}
                  onChange={(e) => setHasExpiry(e.target.checked)}
                  className="rounded text-blue-600"
                />
                Has Expiration
              </label>
            </div>
            <input
              type="date"
              disabled={!hasExpiry}
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 text-xs disabled:bg-slate-100 disabled:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Leave unchecked for perpetual certificates (MTCs typically do not expire).
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="block font-medium text-slate-700 mb-1">Description & Notes</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Technical observations, heat treatment notes, testing parameters..."
              className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* SECTION C: Material Linking */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
              C
            </div>
            <h2 className="text-sm font-semibold text-slate-800">Material & Heat Verification</h2>
          </div>
          <span className="text-[11px] text-slate-400">Explicit Heat & Batch Linking</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Select Catalog Material</label>
            <select
              value={selectedMaterialId}
              onChange={(e) => handleMaterialSelect(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 text-xs"
            >
              <option value="">-- Choose Material --</option>
              {materials.map((m) => (
                <option key={m._id || m.id} value={m._id || m.id}>
                  {m.materialCode} ({m.materialGrade})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Heat / Cast Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={heatNumber}
              onChange={(e) => setHeatNumber(e.target.value)}
              placeholder="e.g. H-92841-A"
              className="w-full border border-slate-200 rounded-lg p-2 font-mono text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Related Batch Number</label>
            <select
              value={batchNumber}
              onChange={(e) => {
                const b = batches.find((x) => x.batchNumber === e.target.value);
                if (b) handleBatchSelect(b._id || b.id);
                else setBatchNumber(e.target.value);
              }}
              className="w-full border border-slate-200 rounded-lg p-2 font-mono text-xs"
            >
              <option value="">-- Select or Type Batch --</option>
              {batches.map((b) => (
                <option key={b._id || b.id} value={b.batchNumber}>
                  {b.batchNumber} (Heat: {b.heatNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Material Grade</label>
            <input
              type="text"
              value={materialGrade}
              onChange={(e) => setMaterialGrade(e.target.value)}
              placeholder="e.g. ASTM A106 Gr. B"
              className="w-full border border-slate-200 rounded-lg p-2 text-xs"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Applicable Standard</label>
            <input
              type="text"
              value={applicableStandard}
              onChange={(e) => setApplicableStandard(e.target.value)}
              placeholder="e.g. API 6D / ASME B16.34"
              className="w-full border border-slate-200 rounded-lg p-2 text-xs"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Item Serial Number</label>
            <input
              type="text"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="e.g. SN-8821-004 (Optional)"
              className="w-full border border-slate-200 rounded-lg p-2 font-mono text-xs"
            />
          </div>
        </div>
      </div>

      {/* SECTION D: Business Relationships */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
            D
          </div>
          <h2 className="text-sm font-semibold text-slate-800">Business & Order Relationships</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Supplier / Manufacturer</label>
            <input
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="e.g. Nippon Steel / Valvitalia"
              className="w-full border border-slate-200 rounded-lg p-2 text-xs"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Supplier Purchase Order</label>
            <select
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 font-mono text-xs"
            >
              <option value="">-- Select PO --</option>
              {purchaseOrders.map((po) => (
                <option key={po._id || po.id} value={po.poNumber}>
                  {po.poNumber} ({po.supplierName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Customer Sales Order</label>
            <select
              value={soNumber}
              onChange={(e) => handleSOSelect(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 font-mono text-xs"
            >
              <option value="">-- Select Sales Order --</option>
              {salesOrders.map((so) => (
                <option key={so._id || so.id} value={so.soNumber}>
                  {so.soNumber} ({so.customerName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Customer Organization</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Aramco / ADNOC"
              className="w-full border border-slate-200 rounded-lg p-2 text-xs"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-medium text-slate-700 mb-1">
              Delivery / Shipment Reference
            </label>
            <input
              type="text"
              value={shipmentOrDeliveryNumber}
              onChange={(e) => setShipmentOrDeliveryNumber(e.target.value)}
              placeholder="e.g. DN-2026-0412 or BHR-SA-88129"
              className="w-full border border-slate-200 rounded-lg p-2 font-mono text-xs"
            />
          </div>
        </div>
      </div>

      {/* SECTION E: Visibility & Review Workflow */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
            E
          </div>
          <h2 className="text-sm font-semibold text-slate-800">Security Classification & Review</h2>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-2">
              Access & Visibility Classification
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  id: "internal_only",
                  title: "Internal Only",
                  desc: "Visible to company team members only.",
                },
                {
                  id: "quality_team_only",
                  title: "Authorized QA Team Only",
                  desc: "Restricted to Quality Reviewers and Admin.",
                },
                {
                  id: "customer_shareable",
                  title: "Customer Shareable",
                  desc: "Permitted in customer technical dossiers once approved.",
                },
                {
                  id: "supplier_confidential",
                  title: "Confidential Supplier Document",
                  desc: "Restricted pricing & mill cost info (Admin/QA only).",
                },
              ].map((item) => (
                <label
                  key={item.id}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition flex items-start gap-2.5 ${
                    visibilityClassification === item.id
                      ? "bg-blue-50/70 border-blue-500 text-blue-950 ring-1 ring-blue-500"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={item.id}
                    checked={visibilityClassification === item.id}
                    onChange={(e) => setVisibilityClassification(e.target.value)}
                    className="mt-0.5 text-blue-600"
                  />
                  <div>
                    <p className="font-semibold text-xs leading-tight">{item.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={submitForReview}
                onChange={(e) => setSubmitForReview(e.target.checked)}
                className="rounded text-blue-600 w-4 h-4"
              />
              <div>
                <p className="font-semibold text-slate-800 text-xs">
                  Submit directly to Quality Review queue
                </p>
                <p className="text-[11px] text-slate-500">
                  Document will be queued with Pending Review status for Elena Rostova. Uncheck to save as Draft.
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-700 transition"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isUploading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
        >
          {isUploading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Processing Cloudinary Upload...</span>
            </>
          ) : (
            <>
              <span>Save & Register Document</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
