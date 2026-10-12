"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  FileSpreadsheet,
  Building,
  Package,
  Plus,
  Trash2,
  Calendar,
  Calculator,
  AlertTriangle,
} from "lucide-react";

export default function QuotationBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const enquiryIdParam = searchParams.get("enquiryId");

  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState(enquiryIdParam || "");

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactId, setContactId] = useState("");
  const [enquiryNumber, setEnquiryNumber] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [validityDate, setValidityDate] = useState(
    new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0]
  );
  const [deliveryTerms, setDeliveryTerms] = useState("FOB Dubai Port (Incoterms 2020)");
  const [paymentTerms, setPaymentTerms] = useState("Net 30 Days");
  const [leadTime, setLeadTime] = useState("4-6 Weeks ARO");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(5);
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<any[]>([
    {
      itemDescription: "",
      category: "Valves",
      materialGrade: "",
      standard: "",
      size: "",
      pressureClass: "",
      connectionType: "",
      quantity: 1,
      unitOfMeasure: "EA",
      unitSellingPrice: 0,
      discountPercent: 0,
      leadTime: "4 Weeks",
      notes: "",
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load enquiries
  useEffect(() => {
    async function loadEnquiries() {
      try {
        const res = await fetch("/api/enquiries");
        const data = await res.json();
        if (data.success) {
          setEnquiries(data.enquiries || []);

          if (enquiryIdParam) {
            const found = data.enquiries.find(
              (e: any) => e._id === enquiryIdParam || e.id === enquiryIdParam
            );
            if (found) populateFromEnquiry(found);
          }
        }
      } catch (err) {
        console.error("Enquiries load error:", err);
      }
    }
    loadEnquiries();
  }, [enquiryIdParam]);

  const populateFromEnquiry = (enq: any) => {
    setSelectedEnquiryId(enq._id || enq.id);
    setEnquiryNumber(enq.enquiryNumber);
    setCustomerId(enq.customerId?._id || enq.customerId);
    setCustomerName(enq.customerName);
    setContactId(enq.contactId?._id || enq.contactId);
    setContactName(enq.contactName);
    setCurrency(enq.currency || "USD");

    if (enq.items && enq.items.length > 0) {
      setItems(
        enq.items.map((it: any) => ({
          enquiryItemId: it._id || it.id,
          productId: it.productId,
          itemDescription: it.itemDescription,
          category: it.category || "Valves",
          materialGrade: it.materialGrade || "",
          standard: it.standard || "",
          size: it.size || "",
          pressureClass: it.pressureClass || "",
          connectionType: it.connectionType || "",
          quantity: it.quantity || 1,
          unitOfMeasure: it.unitOfMeasure || "EA",
          unitSellingPrice: it.customerTargetUnitPrice || 0,
          discountPercent: 0,
          leadTime: "4-6 Weeks ARO",
          notes: it.notes || "",
        }))
      );
    }
  };

  const handleEnquirySelect = (eid: string) => {
    setSelectedEnquiryId(eid);
    const found = enquiries.find((e) => e._id === eid || e.id === eid);
    if (found) populateFromEnquiry(found);
  };

  const handleItemChange = (idx: number, field: string, val: any) => {
    const updated = [...items];
    updated[idx][field] = val;
    setItems(updated);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        itemDescription: "",
        category: "Valves",
        materialGrade: "",
        standard: "",
        size: "",
        pressureClass: "",
        connectionType: "",
        quantity: 1,
        unitOfMeasure: "EA",
        unitSellingPrice: 0,
        discountPercent: 0,
        leadTime: "4 Weeks",
        notes: "",
      },
    ]);
  };

  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  // Live client-side calculation preview
  const subtotal = items.reduce((sum, it) => {
    const lineTotal = (it.quantity || 1) * (it.unitSellingPrice || 0) * (1 - (it.discountPercent || 0) / 100);
    return sum + lineTotal;
  }, 0);

  const discountAmount = (subtotal * (discountPercent || 0)) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * (taxPercent || 0)) / 100;
  const totalAmount = taxableAmount + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedEnquiryId) {
      setError("Please link an enquiry to this quotation");
      return;
    }
    if (!validityDate) {
      setError("Please specify quotation validity date");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enquiryId: selectedEnquiryId,
          enquiryNumber,
          customerId,
          customerName,
          contactId,
          contactName,
          currency,
          validityDate,
          deliveryTerms,
          paymentTerms,
          leadTime,
          discountPercent,
          taxPercent,
          notes,
          items,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to create quotation");
        setSubmitting(false);
        return;
      }

      router.push(`/quotations/${data.quotation._id || data.quotation.id}`);
    } catch {
      setError("An unexpected error occurred while generating quotation");
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Navigation & Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/quotations"
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Commercial Quotation Builder</h2>
            <p className="text-xs text-slate-500">
              Generates formal customer quote (QT-2026-XXXX-R0) with verified server-side totals
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Linked Enquiry & Client Profile */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building className="w-4 h-4 text-maroon-600" />
              <span>Commercial Reference & Client Assignment</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Link to Enquiry RFQ *
                </label>
                <select
                  required
                  value={selectedEnquiryId}
                  onChange={(e) => handleEnquirySelect(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">-- Select RFQ Enquiry --</option>
                  {enquiries.map((enq) => (
                    <option key={enq._id || enq.id} value={enq._id || enq.id}>
                      {enq.enquiryNumber} - {enq.customerName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Customer Organization
                </label>
                <input
                  type="text"
                  readOnly
                  value={customerName}
                  placeholder="Selected from enquiry"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Attention (Contact Person)
                </label>
                <input
                  type="text"
                  readOnly
                  value={contactName}
                  placeholder="Selected from enquiry"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Quotation Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-bold"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="SAR">SAR - Saudi Riyal</option>
                  <option value="AED">AED - UAE Dirham</option>
                  <option value="GBP">GBP - British Pound</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Validity Expiry Date *
                </label>
                <input
                  type="date"
                  required
                  value={validityDate}
                  onChange={(e) => setValidityDate(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Promised Lead Time
                </label>
                <input
                  type="text"
                  value={leadTime}
                  onChange={(e) => setLeadTime(e.target.value)}
                  placeholder="e.g. 4-6 Weeks ARO"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Delivery Terms (Incoterms 2020)
                </label>
                <input
                  type="text"
                  value={deliveryTerms}
                  onChange={(e) => setDeliveryTerms(e.target.value)}
                  placeholder="e.g. FOB Dubai Port / CIF Houston"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Commercial Payment Terms
                </label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="e.g. Net 30 Days from Delivery / 100% LC at Sight"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Line Items & Commercial Pricing */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-maroon-600" />
                <span>Commercial Line Items ({items.length})</span>
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, idx) => {
                const lineRaw = (item.quantity || 1) * (item.unitSellingPrice || 0);
                const lineDisc = (lineRaw * (item.discountPercent || 0)) / 100;
                const lineTotal = lineRaw - lineDisc;

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Item #{idx + 1}</span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Item Description *
                        </label>
                        <input
                          type="text"
                          required
                          value={item.itemDescription}
                          onChange={(e) => handleItemChange(idx, "itemDescription", e.target.value)}
                          placeholder="e.g. Trunnion Ball Valve 6'' Class 600 RF"
                          className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Material Grade
                        </label>
                        <input
                          type="text"
                          value={item.materialGrade}
                          onChange={(e) => handleItemChange(idx, "materialGrade", e.target.value)}
                          placeholder="e.g. ASTM A216 WCB"
                          className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Standard
                        </label>
                        <input
                          type="text"
                          value={item.standard}
                          onChange={(e) => handleItemChange(idx, "standard", e.target.value)}
                          placeholder="e.g. API 6D"
                          className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", parseInt(e.target.value) || 1)}
                          className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          UOM
                        </label>
                        <select
                          value={item.unitOfMeasure}
                          onChange={(e) => handleItemChange(idx, "unitOfMeasure", e.target.value)}
                          className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white"
                        >
                          <option value="EA">EA - Each</option>
                          <option value="MTR">MTR - Meters</option>
                          <option value="SET">SET - Sets</option>
                          <option value="KG">KG - Kilograms</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Unit Selling Price ({currency}) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={item.unitSellingPrice || ""}
                          onChange={(e) => handleItemChange(idx, "unitSellingPrice", parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white font-bold text-maroon-700"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Line Discount %
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discountPercent || 0}
                          onChange={(e) => handleItemChange(idx, "discountPercent", parseFloat(e.target.value) || 0)}
                          className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-slate-500">
                      <span>Line Subtotal: {formatCurrency(lineRaw, currency)}</span>
                      <span className="font-bold text-slate-900">
                        Line Net Total: {formatCurrency(lineTotal, currency)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Financial Summary & Taxes */}
            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between gap-6">
              <div className="sm:w-1/2 space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Special Warranty & Quotation Notes
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Subject to prior sales, 18 months standard warranty from shipment, MTC 3.1 included..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div className="sm:w-1/2 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Gross Subtotal:</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(subtotal, currency)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Overall Discount (%):</span>
                  <div className="w-24">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                      className="w-full py-1 px-2 text-right rounded border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                {discountAmount > 0 && (
                  <div className="flex items-center justify-between text-rose-600">
                    <span>Discount Deduction:</span>
                    <span>-{formatCurrency(discountAmount, currency)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">VAT / Tax (%):</span>
                  <div className="w-24">
                    <input
                      type="number"
                      min="0"
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                      className="w-full py-1 px-2 text-right rounded border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Tax Amount:</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(taxAmount, currency)}</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-sm font-bold text-maroon-700">
                  <span>TOTAL QUOTATION VALUE:</span>
                  <span className="text-base">{formatCurrency(totalAmount, currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              href="/quotations"
              className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 text-xs font-bold rounded-xl bg-maroon-600 hover:bg-maroon-700 text-white shadow-md transition-all disabled:opacity-50"
            >
              {submitting ? "Compiling Quote..." : "Generate Official Quotation (R0)"}
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
