"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import {
  FileSpreadsheet,
  Upload,
  ClipboardPaste,
  Download,
  Eye,
  Plus,
  Trash2,
  CheckCircle2,
  FileText,
  Sparkles,
  ArrowRight,
  Settings,
  Building2,
  Calendar,
  Layers,
} from "lucide-react";
import { DEFAULT_MSG_TERMS } from "@/lib/msg-pdf";

const SAMPLE_MSG_ITEMS = [
  {
    sNo: 1,
    description: "PIPE 6\" S.80 SEAMLESS CS MATERIAL ACC TO ASTM A106 GR.B DIMENSION ACC TO ANSI B36.10 DRL",
    quantity: 240,
    unit: "MTR",
    remarks: "",
    unitPrice: 114.0,
    totalPrice: 27360.0,
  },
  {
    sNo: 2,
    description: "PIPE 8\" S.80 SEAMLESS CS MATERIAL ACC TO ASTM A106 GR.B DIMENSION ACC TO ANSI B36.10 DRL",
    quantity: 144,
    unit: "MTR",
    remarks: "",
    unitPrice: 165.0,
    totalPrice: 23760.0,
  },
  {
    sNo: 3,
    description: "PIPE 10\" S.80 SEAMLESS CS MATERIAL ACC TO ASTM A106 GR.B DIMENSION ACC TO ANSI B36.10 DRL",
    quantity: 120,
    unit: "MTR",
    remarks: "",
    unitPrice: 248.0,
    totalPrice: 29760.0,
  },
];

export default function ExcelToQuoteConverterPage() {
  const [activeTab, setActiveTab] = useState<"import" | "items" | "terms" | "preview">("import");

  // Quotation Header State
  const [companyName, setCompanyName] = useState("MSG Oilfield Equipment Trading LLC");
  const [toCustomer, setToCustomer] = useState("PREMIER ENERGY SERVICES");
  const [address, setAddress] = useState("JEBEL ALI FREE ZONE, DUBAI, UAE");
  const [clientRef, setClientRef] = useState("WHATSAPP ENQUIRY-PIPE");
  const [quotationRef, setQuotationRef] = useState(`MSG-${new Date().getMonth() + 1}${new Date().getFullYear().toString().slice(-2)}-12466-Q`);
  const [attention, setAttention] = useState("PURCHASE / PROCUREMENT DEPT");
  const [date, setDate] = useState(
    `${String(new Date().getDate()).padStart(2, "0")}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${new Date().getFullYear()}`
  );
  const [currency, setCurrency] = useState("USD");

  // Items State
  const [items, setItems] = useState<any[]>(SAMPLE_MSG_ITEMS);

  // Paste / File State
  const [pasteText, setPasteText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  // Terms State
  const [commercialTerms, setCommercialTerms] = useState(DEFAULT_MSG_TERMS.commercial);
  const [technicalTerms, setTechnicalTerms] = useState(DEFAULT_MSG_TERMS.technical);
  const [otherTerms, setOtherTerms] = useState(DEFAULT_MSG_TERMS.other);

  // Totals
  const totalAmount = items.reduce(
    (sum, item) => sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0)),
    0
  );

  // Handle Pasted Text Conversion
  const handleParsePastedText = async () => {
    if (!pasteText.trim()) return;
    setIsProcessing(true);
    setUploadMessage(null);

    try {
      const res = await fetch("/api/quotations/convert-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: pasteText }),
      });
      const data = await res.json();
      if (data.success && data.items.length > 0) {
        setItems(data.items);
        setUploadMessage(`Successfully parsed ${data.items.length} line items from text!`);
        setActiveTab("items");
      } else {
        setUploadMessage("Could not parse table. Ensure columns are separated by Tabs, Commas, or Pipes.");
      }
    } catch (err: any) {
      setUploadMessage(err.message || "Failed to process pasted data");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle File Upload (.xlsx, .csv)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setUploadMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/quotations/convert-excel", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.items.length > 0) {
        setItems(data.items);
        setUploadMessage(`Imported ${data.items.length} items from ${file.name}`);
        setActiveTab("items");
      } else {
        setUploadMessage(data.error || "Failed to parse items from Excel file.");
      }
    } catch (err: any) {
      setUploadMessage(err.message || "Upload failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // Update line item
  const updateItem = (index: number, field: string, val: any) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: val };
    if (field === "quantity" || field === "unitPrice") {
      const q = parseFloat(next[index].quantity) || 0;
      const p = parseFloat(next[index].unitPrice) || 0;
      next[index].totalPrice = q * p;
    }
    setItems(next);
  };

  // Add Item
  const addItem = () => {
    setItems([
      ...items,
      {
        sNo: items.length + 1,
        description: "",
        quantity: 1,
        unit: "MTR",
        remarks: "",
        unitPrice: 0,
        totalPrice: 0,
      },
    ]);
  };

  // Remove Item
  const removeItem = (index: number) => {
    const next = items.filter((_, i) => i !== index).map((item, i) => ({ ...item, sNo: i + 1 }));
    setItems(next);
  };

  // Download PDF matching MSG format
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const payload = {
        companyName,
        toCustomer,
        address,
        clientRef,
        quotationRef,
        attention,
        date,
        currency,
        items,
        commercialTerms,
        technicalTerms,
        otherTerms,
        signatoryName: "Mohammed Rizwan",
        signatoryCompany: "MSG Oilfield Equipment",
      };

      const res = await fetch("/api/pdf/msg-quotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Quotation_${quotationRef}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Error generating PDF: " + err.message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Top Control Bar & Header Information */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">MSG Oilfield Quotation Compiler</h2>
                <p className="text-xs text-slate-500">
                  Import S No, Description, Qty, Unit, Remarks & convert to standard B2B offer.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setItems(SAMPLE_MSG_ITEMS);
                  setUploadMessage("Loaded standard MSG Piping RFQ sample (3 items).");
                  setActiveTab("items");
                }}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Load Sample RFQ</span>
              </button>

              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf || items.length === 0}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-maroon-700 hover:bg-maroon-800 text-white shadow-xs flex items-center gap-2 transition disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isGeneratingPdf ? "Building PDF..." : "Generate Official PDF"}</span>
              </button>
            </div>
          </div>

          {/* Quick Header Metadata Inputs */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-4 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Customer (TO):</label>
              <input
                type="text"
                value={toCustomer}
                onChange={(e) => setToCustomer(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-maroon-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Address / Location:</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-maroon-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Quote Ref Number:</label>
              <input
                type="text"
                value={quotationRef}
                onChange={(e) => setQuotationRef(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-maroon-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Client Ref:</label>
              <input
                type="text"
                value={clientRef}
                onChange={(e) => setClientRef(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-maroon-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Attention:</label>
              <input
                type="text"
                value={attention}
                onChange={(e) => setAttention(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-maroon-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Date:</label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-maroon-500"
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-slate-200">
          <button
            onClick={() => setActiveTab("import")}
            className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === "import"
                ? "border-maroon-700 text-maroon-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>1. Upload or Paste Excel</span>
          </button>

          <button
            onClick={() => setActiveTab("items")}
            className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === "items"
                ? "border-maroon-700 text-maroon-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. Items & Pricing ({items.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("terms")}
            className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === "terms"
                ? "border-maroon-700 text-maroon-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>3. Commercial & Technical Terms</span>
          </button>

          <button
            onClick={() => setActiveTab("preview")}
            className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === "preview"
                ? "border-maroon-700 text-maroon-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>4. Exact Quotation Preview</span>
          </button>
        </div>

        {/* TAB 1: IMPORT / PASTE */}
        {activeTab === "import" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* File Upload Box */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Upload className="w-4 h-4 text-maroon-700" />
                  <h3 className="text-sm font-bold text-slate-900">Upload Spreadsheet (.xlsx, .csv)</h3>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Drag and drop an Excel file containing item columns (S No, Description, Qty, Unit, Remarks, Unit Price).
                </p>

                <label className="border-2 border-dashed border-slate-200 hover:border-maroon-500 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50/50 hover:bg-rose-50/20">
                  <FileSpreadsheet className="w-10 h-10 text-slate-400 mb-2" />
                  <span className="text-xs font-bold text-slate-700">Click to browse or drop file here</span>
                  <span className="text-[10px] text-slate-400 mt-1">Supports XLSX, XLS, CSV</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {uploadMessage && (
                <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium">
                  {uploadMessage}
                </div>
              )}
            </div>

            {/* Paste from Clipboard Box */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardPaste className="w-4 h-4 text-maroon-700" />
                  <h3 className="text-sm font-bold text-slate-900">Paste Directly from Excel (Ctrl + V)</h3>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Select rows in Excel, copy them, and paste them directly into the box below:
                </p>

                <textarea
                  rows={8}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={`Example pasted format:\n1\tPIPE 6" S.80 SEAMLESS CS ASTM A106 GR.B\t240\tMTR\t\t114.00\n2\tPIPE 8" S.80 SEAMLESS CS ASTM A106 GR.B\t144\tMTR\t\t165.00`}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-maroon-500"
                />
              </div>

              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    setPasteText(
                      `1\tPIPE 6" S.80 SEAMLESS CS MATERIAL ACC TO ASTM A106 GR.B DIMENSION ACC TO ANSI B36.10 DRL\t240\tMTR\t\t114.00\n2\tPIPE 8" S.80 SEAMLESS CS MATERIAL ACC TO ASTM A106 GR.B DIMENSION ACC TO ANSI B36.10 DRL\t144\tMTR\t\t165.00\n3\tPIPE 10" S.80 SEAMLESS CS MATERIAL ACC TO ASTM A106 GR.B DIMENSION ACC TO ANSI B36.10 DRL\t120\tMTR\t\t248.00`
                    )
                  }
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline"
                >
                  Insert Sample Pasted Rows
                </button>

                <button
                  onClick={handleParsePastedText}
                  disabled={isProcessing || !pasteText.trim()}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition disabled:opacity-50"
                >
                  {isProcessing ? "Converting..." : "Convert to Quotation Items"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ITEMS & PRICING TABLE */}
        {activeTab === "items" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Quotation Line Items</h3>
                <p className="text-xs text-slate-500">
                  Review imported specifications and enter unit selling prices. Totals update dynamically.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={addItem}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line</span>
                </button>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Quotation Value</span>
                  <span className="text-base font-extrabold text-maroon-700">
                    {currency} {totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Editable Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-200 uppercase">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">S No.</th>
                    <th className="py-2.5 px-3 min-w-[320px]">Description & Specifications</th>
                    <th className="py-2.5 px-3 w-20 text-center">Qty</th>
                    <th className="py-2.5 px-3 w-20 text-center">Unit</th>
                    <th className="py-2.5 px-3 w-28">Remarks</th>
                    <th className="py-2.5 px-3 w-28 text-right">Unit Price ({currency})</th>
                    <th className="py-2.5 px-3 w-32 text-right">Total ({currency})</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td className="py-2 px-3 text-center font-mono font-medium text-slate-500">
                        {item.sNo || idx + 1}
                      </td>

                      <td className="py-2 px-3">
                        <textarea
                          rows={2}
                          value={item.description}
                          onChange={(e) => updateItem(idx, "description", e.target.value)}
                          className="w-full p-1.5 rounded border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-maroon-500 resize-y"
                        />
                      </td>

                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)}
                          className="w-full p-1.5 rounded border border-slate-200 text-xs text-center font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-maroon-500"
                        />
                      </td>

                      <td className="py-2 px-3 text-center">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => updateItem(idx, "unit", e.target.value.toUpperCase())}
                          className="w-full p-1.5 rounded border border-slate-200 text-xs text-center font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-maroon-500"
                        />
                      </td>

                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.remarks || ""}
                          placeholder="—"
                          onChange={(e) => updateItem(idx, "remarks", e.target.value)}
                          className="w-full p-1.5 rounded border border-slate-200 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-maroon-500"
                        />
                      </td>

                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                          className="w-full p-1.5 rounded border border-slate-200 text-xs text-right font-mono font-bold text-emerald-700 focus:outline-none focus:ring-1 focus:ring-maroon-500"
                        />
                      </td>

                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => removeItem(idx)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-bold text-xs border-t border-slate-200">
                  <tr>
                    <td colSpan={6} className="py-3 px-4 text-right uppercase tracking-wider text-slate-600">
                      TOTAL AMOUNT IN {currency}:
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-sm text-maroon-700">
                      {totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setActiveTab("import")}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                ← Back to Import
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("preview")}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview Quotation Layout</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TERMS & CONDITIONS */}
        {activeTab === "terms" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Commercial & Technical Terms</h3>
              <p className="text-xs text-slate-500">
                These standardized terms are pre-loaded according to MSG Oilfield Equipment standard operations.
              </p>
            </div>

            {/* Commercial terms */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-700 border-b pb-1.5">Commercial Terms:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Price Basis:</label>
                  <input
                    type="text"
                    value={commercialTerms.price}
                    onChange={(e) => setCommercialTerms({ ...commercialTerms, price: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Validity:</label>
                  <input
                    type="text"
                    value={commercialTerms.validity}
                    onChange={(e) => setCommercialTerms({ ...commercialTerms, validity: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="font-semibold text-slate-600 block mb-1">Payment Terms:</label>
                  <input
                    type="text"
                    value={commercialTerms.payment}
                    onChange={(e) => setCommercialTerms({ ...commercialTerms, payment: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Technical terms */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-700 border-b pb-1.5">Technical Terms:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">MTC Standard:</label>
                  <input
                    type="text"
                    value={technicalTerms.mtc}
                    onChange={(e) => setTechnicalTerms({ ...technicalTerms, mtc: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Make / Origin:</label>
                  <input
                    type="text"
                    value={technicalTerms.make}
                    onChange={(e) => setTechnicalTerms({ ...technicalTerms, make: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Warranty:</label>
                  <input
                    type="text"
                    value={technicalTerms.warranty}
                    onChange={(e) => setTechnicalTerms({ ...technicalTerms, warranty: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setActiveTab("preview")}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-maroon-700 hover:bg-maroon-800 text-white"
              >
                Next: View Exact Preview →
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: EXACT MSG QUOTATION PREVIEW */}
        {activeTab === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900">
                  Exact Quotation Preview Matching MSG Oilfield Equipment Specification
                </span>
              </div>
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-maroon-700 hover:bg-maroon-800 text-white shadow-xs flex items-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                <span>{isGeneratingPdf ? "Building PDF..." : "Download Official PDF"}</span>
              </button>
            </div>

            {/* Document Sheet Simulation */}
            <div className="bg-white p-8 md:p-12 rounded-2xl border-2 border-slate-300 shadow-lg max-w-4xl mx-auto font-sans text-slate-900 text-xs space-y-4">
              {/* MSG Header Box */}
              <div className="border border-black p-3 flex items-center justify-between gap-4">
                <div className="w-28 text-center border-r border-black pr-2">
                  <span className="text-xl font-black text-rose-700 block">MSG</span>
                  <span className="text-[7px] text-slate-500 block uppercase font-medium">SOURCING, RELIABLE & SYSTEMATIC</span>
                </div>

                <div className="flex-1 text-center">
                  <h1 className="text-base font-black text-rose-700">{companyName}</h1>
                  <p className="text-[10px] font-bold text-slate-800">DUBAI INDUSTRIAL CITY (DIC)</p>
                  <p className="text-[9px] text-slate-600">Phase-1, Saih Shuaib 2, Warehouse no: J-04, Dubai, UAE</p>
                  <p className="text-[9px] text-slate-600">Tel: +971 4 295 1222 / +971 4 5912553</p>
                  <p className="text-[9px] text-slate-600">E-mail: sales@msgoilfield.com  Website: www.msgoilfield.com</p>
                </div>

                <div className="w-28 flex items-center justify-center gap-2 border-l border-black pl-2">
                  <div className="border border-blue-600 text-blue-700 text-[9px] p-1.5 font-bold rounded text-center">
                    SCS<br /><span className="text-[7px]">ISO 9001</span>
                  </div>
                  <div className="border border-blue-900 text-blue-900 text-[9px] p-1.5 font-bold rounded text-center">
                    ASIB
                  </div>
                </div>
              </div>

              {/* Client & Reference Table */}
              <div className="border border-black text-xs font-medium">
                <div className="grid grid-cols-6 border-b border-black">
                  <div className="p-1.5 border-r border-black font-bold bg-slate-50">TO</div>
                  <div className="p-1.5 col-span-2 border-r border-black">{toCustomer}</div>
                  <div className="p-1.5 border-r border-black font-bold bg-slate-50">ADDRESS</div>
                  <div className="p-1.5 col-span-2">{address}</div>
                </div>
                <div className="grid grid-cols-8">
                  <div className="p-1.5 border-r border-black font-bold bg-slate-50">CLIENT REF</div>
                  <div className="p-1.5 col-span-2 border-r border-black">{clientRef}</div>
                  <div className="p-1.5 border-r border-black font-bold bg-slate-50">REF:</div>
                  <div className="p-1.5 col-span-2 border-r border-black font-bold">{quotationRef}</div>
                  <div className="p-1.5 border-r border-black font-bold bg-slate-50">DATE:</div>
                  <div className="p-1.5 font-bold">{date}</div>
                </div>
              </div>

              <p className="text-xs italic text-slate-700 pt-1">
                We thank you very much for your enquiry and we are pleased to submit our OFFER as follows:
              </p>

              {/* Items Table */}
              <div className="border border-black">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-black font-bold text-center bg-slate-50">
                      <th className="border-r border-black p-1.5 w-12">S No.</th>
                      <th className="border-r border-black p-1.5">Description</th>
                      <th className="border-r border-black p-1.5 w-16">Qty</th>
                      <th className="border-r border-black p-1.5 w-16">Unit</th>
                      <th className="border-r border-black p-1.5 w-20">Remarks</th>
                      <th className="border-r border-black p-1.5 w-24 text-right">Unit Price</th>
                      <th className="p-1.5 w-28 text-right">Total Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className="border-b border-black">
                        <td className="border-r border-black p-2 text-center">{item.sNo || idx + 1}</td>
                        <td className="border-r border-black p-2 font-mono text-[11px]">{item.description}</td>
                        <td className="border-r border-black p-2 text-center font-bold">{item.quantity}</td>
                        <td className="border-r border-black p-2 text-center">{item.unit}</td>
                        <td className="border-r border-black p-2 text-center">{item.remarks || "—"}</td>
                        <td className="border-r border-black p-2 text-right font-mono">
                          {Number(item.unitPrice || 0).toFixed(2)}
                        </td>
                        <td className="p-2 text-right font-mono font-bold">
                          {((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr className="font-bold border-t border-black bg-slate-50">
                      <td colSpan={6} className="p-2 text-right uppercase border-r border-black">
                        TOTAL AMOUNT IN {currency}
                      </td>
                      <td className="p-2 text-right font-mono text-sm">
                        {totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Commercial Terms */}
              <div className="space-y-1 text-[11px] pt-2">
                <p className="font-bold uppercase text-slate-800">COMMERCIAL TERMS:</p>
                <p><strong>Price:</strong> {commercialTerms.price}</p>
                <p><strong>Validity:</strong> {commercialTerms.validity}</p>
                <p><strong>Payment:</strong> {commercialTerms.payment}</p>
                <p><strong>Cancellation:</strong> {commercialTerms.cancellation}</p>
                <p><strong>LD:</strong> {commercialTerms.ld}</p>
              </div>

              {/* Technical Terms */}
              <div className="space-y-1 text-[11px] pt-2">
                <p className="font-bold uppercase text-slate-800">TECHNICAL TERMS:</p>
                <p><strong>Delivery:</strong> {technicalTerms.delivery}</p>
                <p><strong>MTC:</strong> {technicalTerms.mtc}</p>
                <p><strong>Make:</strong> {technicalTerms.make}</p>
                <p><strong>Warranty:</strong> {technicalTerms.warranty}</p>
                <p><strong>Legalization:</strong> {technicalTerms.legalization}</p>
                <p><strong>Packing:</strong> {technicalTerms.packing}</p>
                <p><strong>Services:</strong> {technicalTerms.services}</p>
              </div>

              {/* Other Terms (1-10) */}
              <div className="space-y-1 text-[10.5px] pt-2">
                <p className="font-bold uppercase text-slate-800">OTHER TERMS:</p>
                {otherTerms.map((t, i) => (
                  <p key={i}><strong>{i + 1}.</strong> {t}</p>
                ))}
              </div>

              {/* Sign-off */}
              <div className="pt-6 border-t border-slate-200">
                <p className="text-xs text-slate-600 mb-4">
                  Should you have any clarification, please feel free to contact us. Awaiting your valued order confirmation.
                </p>
                <p className="font-bold text-xs text-slate-800">For MSG Oilfield Equipment</p>
                <p className="font-bold text-sm text-slate-900 mt-6">Mohammed Rizwan</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
