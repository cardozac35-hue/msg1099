"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertTriangle,
  Building2,
  Package,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
  ClipboardPaste,
  Sparkles,
  Download,
  Eye,
  X,
  FileText,
  ShieldCheck,
  Percent,
  Camera,
} from "lucide-react";
import { DEFAULT_MSG_TERMS } from "@/lib/msg-terms";
import { formatCurrency } from "@/lib/utils";

const SAMPLE_RFQ_PASTE_TEXT = `1\tPIPE 6" S.80 SEAMLESS CS MATERIAL ACC TO ASTM A106 GR.B DIMENSION ACC TO ANSI B36.10 DRL\t240\tMTR\t114.00
2\tPIPE 8" S.80 SEAMLESS CS MATERIAL ACC TO ASTM A106 GR.B DIMENSION ACC TO ANSI B36.10 DRL\t144\tMTR\t165.00
3\tPIPE 10" S.80 SEAMLESS CS MATERIAL ACC TO ASTM A106 GR.B DIMENSION ACC TO ANSI B36.10 DRL\t120\tMTR\t248.00`;

export default function NewEnquiryPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Form State
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [contactId, setContactId] = useState("");
  const [contactName, setContactName] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [assignedToName, setAssignedToName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [notes, setNotes] = useState("");

  // Items State
  const [items, setItems] = useState<any[]>([
    {
      productId: "",
      itemDescription: "",
      category: "Valves",
      materialGrade: "",
      standard: "",
      size: "",
      pressureClass: "",
      connectionType: "",
      quantity: 1,
      unitOfMeasure: "EA",
      customerTargetUnitPrice: 0,
      notes: "",
    },
  ]);

  // Excel Importer State
  const [activeItemTab, setActiveItemTab] = useState<"excel" | "manual">("excel");
  const [pasteText, setPasteText] = useState("");
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [importNotice, setImportNotice] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Quote Preview Modal State
  const [showQuotePreview, setShowQuotePreview] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Duplicate warning state
  const [duplicateWarning, setDuplicateWarning] = useState<{
    hasPotentialDuplicate: boolean;
    duplicates: any[];
  } | null>(null);
  const [dismissDuplicateWarning, setDismissDuplicateWarning] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial master lists
  useEffect(() => {
    async function loadMasters() {
      try {
        const [cRes, pRes, uRes] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/products"),
          fetch("/api/admin/users").catch(() => null),
        ]);

        const cData = await cRes.json();
        const pData = await pRes.json();

        if (cData.success) {
          setCustomers(cData.customers || []);
          setContacts(cData.contacts || []);

          // Auto-select first customer if available
          if (cData.customers && cData.customers.length > 0) {
            const firstC = cData.customers[0];
            setCustomerId(firstC._id || firstC.id);
            setCustomerName(firstC.name);
            setCurrency(firstC.currency || "USD");

            const customerContacts = (cData.contacts || []).filter(
              (ct: any) => ct.customerId === (firstC._id || firstC.id)
            );
            if (customerContacts.length > 0) {
              setContactId(customerContacts[0]._id || customerContacts[0].id);
              setContactName(customerContacts[0].name);
            }
          }
        }
        if (pData.success) setProducts(pData.products || []);

        if (uRes && uRes.ok) {
          const uData = await uRes.json();
          if (uData.success) {
            setUsers(uData.users || []);
            if (uData.users.length > 0) {
              setAssignedTo(uData.users[0]._id || uData.users[0].id);
              setAssignedToName(uData.users[0].name);
            }
          }
        } else {
          // Fallback to current session user
          const meRes = await fetch("/api/auth/me");
          const meData = await meRes.json();
          if (meData.success && meData.user) {
            setUsers([meData.user]);
            setAssignedTo(meData.user.id);
            setAssignedToName(meData.user.name);
          }
        }
      } catch (err) {
        console.error("Master list error:", err);
      }
    }
    loadMasters();
  }, []);

  // When customer changes, filter contacts and check duplicates
  const handleCustomerChange = (cid: string) => {
    setCustomerId(cid);
    const selected = customers.find((c) => c._id === cid || c.id === cid);
    if (selected) {
      setCustomerName(selected.name);
      setCurrency(selected.currency || "USD");

      const customerContacts = contacts.filter((ct) => ct.customerId === cid);
      if (customerContacts.length > 0) {
        const primary = customerContacts.find((ct) => ct.isPrimary) || customerContacts[0];
        setContactId(primary._id || primary.id);
        setContactName(primary.name);
      } else {
        setContactId("");
        setContactName("");
      }

      checkDuplicates(cid, items);
    }
  };

  const handleContactChange = (ctid: string) => {
    setContactId(ctid);
    const ct = contacts.find((c) => c._id === ctid || c.id === ctid);
    if (ct) setContactName(ct.name);
  };

  const handleSalespersonChange = (uid: string) => {
    setAssignedTo(uid);
    const u = users.find((usr) => usr._id === uid || usr.id === uid);
    if (u) setAssignedToName(u.name);
  };

  // Duplicate checking call
  const checkDuplicates = async (cid: string, currentItems: any[]) => {
    if (!cid) return;
    try {
      const res = await fetch("/api/enquiries/check-duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: cid, items: currentItems }),
      });
      const data = await res.json();
      if (data.success && data.hasPotentialDuplicate) {
        setDuplicateWarning(data);
      } else {
        setDuplicateWarning(null);
      }
    } catch {
      // Ignore
    }
  };

  // Line item handlers
  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index][field] = value;

    if (field === "productId" && value) {
      const prod = products.find((p) => p._id === value || p.id === value);
      if (prod) {
        updated[index].itemDescription = prod.name;
        updated[index].category = prod.category;
        updated[index].materialGrade = prod.materialGrade;
        updated[index].standard = prod.standard;
        updated[index].size = prod.size;
        updated[index].pressureClass = prod.pressureClass;
        updated[index].connectionType = prod.connectionType;
        updated[index].unitOfMeasure = prod.unitOfMeasure;
        if (prod.listPrice && !updated[index].customerTargetUnitPrice) {
          updated[index].customerTargetUnitPrice = prod.listPrice;
        }
      }
    }

    setItems(updated);
    if (customerId) {
      checkDuplicates(customerId, updated);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        productId: "",
        itemDescription: "",
        category: "Valves",
        materialGrade: "",
        standard: "",
        size: "",
        pressureClass: "",
        connectionType: "",
        quantity: 1,
        unitOfMeasure: "EA",
        customerTargetUnitPrice: 0,
        notes: "",
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  // Excel / Text Parsing Handler
  const handleParsePastedText = async () => {
    if (!pasteText.trim()) {
      setImportNotice({ text: "Please paste Excel rows before clicking parse.", type: "error" });
      return;
    }
    setIsParsingExcel(true);
    setImportNotice(null);

    try {
      const res = await fetch("/api/quotations/convert-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: pasteText }),
      });
      const data = await res.json();
      if (data.success && data.items && data.items.length > 0) {
        const formattedItems = data.items.map((it: any) => ({
          productId: "",
          itemDescription: it.description,
          category: it.category || "Pipes & Tubes",
          materialGrade: it.materialGrade || "",
          standard: it.standard || "",
          size: it.size || "",
          pressureClass: it.pressureClass || "",
          connectionType: it.connectionType || "",
          quantity: it.quantity || 1,
          unitOfMeasure: it.unit || "MTR",
          customerTargetUnitPrice: it.unitPrice || 0,
          notes: it.remarks || "",
        }));

        setItems(formattedItems);
        setImportNotice({
          text: `Successfully converted ${formattedItems.length} spreadsheet items into Quote format!`,
          type: "success",
        });
        if (customerId) checkDuplicates(customerId, formattedItems);
      } else {
        setImportNotice({
          text: "Could not parse rows. Ensure columns are separated by Tabs, Commas, or Pipes.",
          type: "error",
        });
      }
    } catch (err: any) {
      setImportNotice({ text: err.message || "Failed to parse text", type: "error" });
    } finally {
      setIsParsingExcel(false);
    }
  };

  // Excel File Upload Handler (.xlsx, .csv)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingExcel(true);
    setImportNotice(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/quotations/convert-excel", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.items && data.items.length > 0) {
        const formattedItems = data.items.map((it: any) => ({
          productId: "",
          itemDescription: it.description,
          category: it.category || "Pipes & Tubes",
          materialGrade: it.materialGrade || "",
          standard: it.standard || "",
          size: it.size || "",
          pressureClass: it.pressureClass || "",
          connectionType: it.connectionType || "",
          quantity: it.quantity || 1,
          unitOfMeasure: it.unit || "MTR",
          customerTargetUnitPrice: it.unitPrice || 0,
          notes: it.remarks || "",
        }));

        setItems(formattedItems);
        setImportNotice({
          text: `Imported ${formattedItems.length} items from ${file.name} into Quote format!`,
          type: "success",
        });
        if (customerId) checkDuplicates(customerId, formattedItems);
      } else {
        setImportNotice({
          text: data.error || "Failed to parse items from Excel file.",
          type: "error",
        });
      }
    } catch (err: any) {
      setImportNotice({ text: err.message || "File upload failed", type: "error" });
    } finally {
      setIsParsingExcel(false);
    }
  };

  // Helper to upscale and contrast-enhance screenshot on canvas for sharp OCR
  const preprocessScreenshotForOcr = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              resolve(img.src);
              return;
            }
            const scale = 2.5;
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            for (let i = 0; i < data.length; i += 4) {
              const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
              const contrast = (gray - 128) * 1.6 + 128;
              const clamped = Math.min(255, Math.max(0, contrast));
              data[i] = clamped;
              data[i + 1] = clamped;
              data[i + 2] = clamped;
            }
            ctx.putImageData(imgData, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          } catch {
            resolve(img.src);
          }
        };
        img.onerror = () => resolve(URL.createObjectURL(file));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(URL.createObjectURL(file));
      reader.readAsDataURL(file);
    });
  };

  // Screenshot / Image OCR Handler — Server sharp OCR first, client canvas fallback
  const processImageOcr = async (file: File) => {
    setIsParsingExcel(true);
    setImportNotice({
      text: `🖼️ Scanning screenshot "${file.name || "clipboard-image"}" with OCR...`,
      type: "success",
    });

    // 1. Try high-precision server OCR first (Sharp contrast + Tesseract column detection)
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/quotations/ocr-image", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.items && data.items.length > 0) {
          const formattedItems = data.items.map((it: any) => ({
            productId: "",
            itemDescription: it.description,
            category: it.category || "Pipes & Tubes",
            materialGrade: it.materialGrade || "",
            standard: it.standard || "",
            size: it.size || "",
            pressureClass: it.pressureClass || "",
            connectionType: it.connectionType || "",
            quantity: it.quantity || 1,
            unitOfMeasure: it.unit || "MTR",
            customerTargetUnitPrice: it.unitPrice || 0,
            notes: it.remarks || "",
          }));

          setItems(formattedItems);
          setImportNotice({
            text: `📸 Successfully extracted ${formattedItems.length} quotation items from your screenshot!`,
            type: "success",
          });
          if (customerId) checkDuplicates(customerId, formattedItems);
          setIsParsingExcel(false);
          return;
        }
      }
    } catch (serverErr) {
      console.warn("Server OCR failed, attempting client-side fallback:", serverErr);
    }

    // 2. Client-side Fallback with Canvas 2.5x upscale & contrast boost
    try {
      setImportNotice({
        text: `🖼️ Enhancing screenshot resolution for in-browser OCR...`,
        type: "success",
      });

      const enhancedDataUrl = await preprocessScreenshotForOcr(file);

      const Tesseract = await import("tesseract.js");
      const worker = await Tesseract.createWorker("eng", undefined, {
        logger: (m: any) => {
          if (m.status === "recognizing text") {
            setImportNotice({
              text: `🖼️ OCR in progress... ${Math.round((m.progress || 0) * 100)}%`,
              type: "success",
            });
          }
        },
      });

      const result = await worker.recognize(enhancedDataUrl);
      const rawText = result.data.text || "";
      await worker.terminate();

      if (!rawText.trim()) {
        setImportNotice({
          text: "Could not read text from screenshot. Please make sure the table has visible rows, or copy & paste text directly.",
          type: "error",
        });
        setIsParsingExcel(false);
        return;
      }

      // Industrial term cleanup
      const cleanedText = rawText
        .replace(/\b[5$]\.(80|40|160|20|10|STD|XS|XXS)\b/gi, "S.$1")
        .replace(/\bANS[!|l1]\b/g, "ANSI")
        .replace(/\bASTM\s+A1O6\b/gi, "ASTM A106")
        .replace(/\bGR\.8\b/gi, "GR.B")
        .replace(/\b[O0]RL\b/g, "DRL")
        .replace(/\bDR[I|l]\b/g, "DRL")
        .replace(/\bM7R\b/gi, "MTR")
        .replace(/\s+(?:ENE|IEEE|ww|we|ow|Co)$/gi, "")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'");

      const lines = cleanedText.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);
      const oilGasKeywords = /pipe|valve|flange|fitting|astm|ansi|seamless|class|elbow|reducer|tee|coupling|gasket|stud|bolt|nut|\d+["']/i;
      const headerKeywords = /^(s\.?no|sno|s no|description|item|qty|quantity|unit|total|remarks|sl|sr)/i;

      const candidateLines = lines.filter((l: string) => {
        if (headerKeywords.test(l)) return false;
        return oilGasKeywords.test(l);
      });

      const formattedItems: any[] = [];
      for (const line of candidateLines) {
        let desc = line
          .replace(/^[^a-zA-Z0-9]+/, "")
          .replace(/^[0-9]+[\s.:|_-]+/, "")
          .replace(/\s+(?:ENE|IEEE|ww|we|ow|Co)$/i, "")
          .trim();

        if (desc.length < 5) continue;

        let qty = 1;
        let unit = "MTR";
        const qtyUnitMatch = desc.match(/\b(\d+(?:\.\d+)?)\s*(MTR|EA|SET|KG|LOT|FT|PCS|NOS|SETS|PC|M)\b/i);
        if (qtyUnitMatch) {
          qty = parseFloat(qtyUnitMatch[1]) || 1;
          unit = qtyUnitMatch[2].toUpperCase();
          if (unit === "M") unit = "MTR";
          if (unit === "PC") unit = "PCS";
          if (unit === "SETS") unit = "SET";
        }

        const sizeMatch = desc.match(/(\d+(?:\/\d+)?(?:\.\d+)?)\s*(?:"|inch|in\b)/i);
        const gradeMatch = desc.match(/\b(ASTM\s+[A-Z0-9]+(?:\s+GR\.[A-Z0-9]+)?|A106(?:\s+GR\.[A-Z0-9]+)?|A105|A333|A350|A312|A216\s+WCB)\b/i);

        formattedItems.push({
          productId: "",
          itemDescription: desc,
          category: desc.toLowerCase().includes("pipe")
            ? "Pipes & Tubes"
            : desc.toLowerCase().includes("valve")
            ? "Valves"
            : desc.toLowerCase().includes("flange")
            ? "Flanges"
            : "Pipes & Tubes",
          materialGrade: gradeMatch ? gradeMatch[1].toUpperCase() : "",
          standard: "",
          size: sizeMatch ? `${sizeMatch[1]}"` : "",
          pressureClass: "",
          connectionType: "",
          quantity: qty,
          unitOfMeasure: unit,
          customerTargetUnitPrice: 0,
          notes: "",
        });
      }

      if (formattedItems.length > 0) {
        setItems(formattedItems);
        setImportNotice({
          text: `📸 Successfully extracted ${formattedItems.length} quotation items from your screenshot!`,
          type: "success",
        });
        if (customerId) checkDuplicates(customerId, formattedItems);
      } else {
        setImportNotice({
          text: "Could not detect clear line items in screenshot. Please ensure the table has visible rows, or copy & paste text directly.",
          type: "error",
        });
      }
    } catch (err: any) {
      console.error("Client-side OCR error:", err);
      setImportNotice({ text: err.message || "Screenshot OCR processing failed", type: "error" });
    } finally {
      setIsParsingExcel(false);
    }
  };

  // Clipboard Paste Event Handler (Ctrl+V)
  const handleClipboardPaste = (e: React.ClipboardEvent) => {
    const clipItems = e.clipboardData?.items;
    if (!clipItems) return;

    for (let i = 0; i < clipItems.length; i++) {
      const it = clipItems[i];
      if (it.type.startsWith("image/")) {
        const file = it.getAsFile();
        if (file) {
          e.preventDefault();
          processImageOcr(file);
          return;
        }
      }
    }
  };

  // Calculate Grand Totals
  const totalQuantity = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  const totalTargetValue = items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.customerTargetUnitPrice) || 0),
    0
  );

  // Generate Quotation Reference (MSG-MMYY-XXXX-Q)
  const quoteRefNumber = `MSG-${new Date().getMonth() + 1}${new Date().getFullYear().toString().slice(-2)}-${Math.floor(
    10000 + Math.random() * 90000
  )}-Q`;

  // Direct Download of MSG Quotation PDF
  const handleDownloadMsgPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const dateStr = `${String(new Date().getDate()).padStart(2, "0")}-${String(
        new Date().getMonth() + 1
      ).padStart(2, "0")}-${new Date().getFullYear()}`;

      const payload = {
        companyName: "MSG Oilfield Equipment Trading LLC",
        toCustomer: customerName || "PREMIER ENERGY SERVICES",
        address: "JEBEL ALI FREE ZONE, DUBAI, UAE",
        clientRef: notes ? `RFQ - ${notes.slice(0, 30)}` : "WHATSAPP ENQUIRY-PIPE",
        quotationRef: quoteRefNumber,
        attention: contactName || "PURCHASE / PROCUREMENT DEPT",
        date: dateStr,
        currency,
        items: items.map((it, idx) => ({
          sNo: idx + 1,
          description: it.itemDescription,
          quantity: Number(it.quantity) || 1,
          unit: it.unitOfMeasure || "MTR",
          unitPrice: Number(it.customerTargetUnitPrice) || 0,
          totalPrice: (Number(it.quantity) || 1) * (Number(it.customerTargetUnitPrice) || 0),
          remarks: it.notes || "",
        })),
        commercialTerms: DEFAULT_MSG_TERMS.commercial,
        technicalTerms: DEFAULT_MSG_TERMS.technical,
        otherTerms: DEFAULT_MSG_TERMS.other,
        signatoryName: assignedToName || "Mohammed Rizwan",
        signatoryCompany: "MSG Oilfield Equipment",
      };

      const res = await fetch("/api/pdf/msg-quotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to generate PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Quotation_${quoteRefNumber}.pdf`;
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

  // Submit Handler: Supports both "Create Enquiry Only" and "Create Enquiry & Generate Quote"
  const handleFormSubmit = async (shouldGenerateQuote: boolean) => {
    setError(null);

    if (!customerId) {
      setError("Please select a customer organization");
      return;
    }
    if (!contactId) {
      setError("Please select a customer contact person");
      return;
    }
    if (!assignedTo) {
      setError("Please assign a salesperson");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].itemDescription.trim()) {
        setError(`Item #${i + 1} requires a product description`);
        return;
      }
      if (items[i].quantity < 1) {
        setError(`Item #${i + 1} quantity must be at least 1`);
        return;
      }
    }

    setSubmitting(true);

    try {
      // 1. Create Enquiry
      const enqRes = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          customerName,
          contactId,
          contactName,
          assignedTo,
          assignedToName,
          currency,
          priority,
          nextFollowUpDate: nextFollowUpDate || undefined,
          notes,
          items,
        }),
      });

      const enqData = await enqRes.json();
      if (!enqRes.ok || !enqData.success) {
        setError(enqData.error || "Failed to create enquiry");
        setSubmitting(false);
        return;
      }

      const createdEnquiry = enqData.enquiry;
      const enqId = createdEnquiry._id || createdEnquiry.id;

      // 2. If user requested Quote Conversion
      if (shouldGenerateQuote) {
        const quotePayload = {
          enquiryId: enqId,
          enquiryNumber: createdEnquiry.enquiryNumber,
          customerId,
          customerName,
          contactId,
          contactName,
          currency,
          validityDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split("T")[0],
          deliveryTerms: "EX OUR WAREHOUSE IN DUBAI",
          paymentTerms: "50% ADVANCE, BALANCE 50% ON READINESS",
          leadTime: "Exstock, subject to unsold (5-6 working days)",
          discountPercent: 0,
          taxPercent: 5,
          notes: notes || "Quotation generated from Excel RFQ import",
          items: items.map((it: any) => ({
            itemDescription: it.itemDescription,
            category: it.category || "Pipes & Tubes",
            materialGrade: it.materialGrade || "",
            standard: it.standard || "",
            size: it.size || "",
            pressureClass: it.pressureClass || "",
            connectionType: it.connectionType || "",
            quantity: Number(it.quantity) || 1,
            unitOfMeasure: it.unitOfMeasure || "MTR",
            unitSellingPrice: Number(it.customerTargetUnitPrice) || 0,
            discountPercent: 0,
            leadTime: "Exstock",
            notes: it.notes || "",
          })),
        };

        const quoteRes = await fetch("/api/quotations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(quotePayload),
        });

        const quoteData = await quoteRes.json();
        if (quoteRes.ok && quoteData.success) {
          // Trigger download of official MSG PDF
          await handleDownloadMsgPdf();
          router.push(`/quotations/${quoteData.quotation._id || quoteData.quotation.id}`);
          return;
        }
      }

      // Default: Redirect to enquiry details
      router.push(`/enquiries/${enqId}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setSubmitting(false);
    }
  };

  const filteredCustomerContacts = contacts.filter((c) => c.customerId === customerId);

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* Header Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/enquiries"
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 font-sans">
                  Create New Customer Enquiry
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  Excel-to-Quote Integrated
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Paste or upload spreadsheet RFQ items and convert directly into official MSG Quotation format
              </p>
            </div>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowQuotePreview(true)}
              disabled={items.length === 0 || !items[0].itemDescription}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors disabled:opacity-40"
            >
              <Eye className="w-3.5 h-3.5 text-maroon-600" />
              <span>Preview MSG Quote</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadMsgPdf}
              disabled={isGeneratingPdf || items.length === 0 || !items[0].itemDescription}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-2xs transition-colors disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>{isGeneratingPdf ? "Building PDF..." : "Export MSG PDF"}</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Potential Duplicate Banner */}
        {duplicateWarning?.hasPotentialDuplicate && !dismissDuplicateWarning && (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 shadow-2xs space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold">Potential Duplicate Enquiry Warning</h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  An active enquiry with matching customer and technical specifications already exists in the system:
                </p>
                <div className="mt-2 space-y-1">
                  {duplicateWarning.duplicates.map((dup: any, idx: number) => (
                    <div key={idx} className="text-xs font-mono bg-white/80 p-2 rounded border border-amber-200">
                      <span className="font-bold text-maroon-700">{dup.enquiryNumber}</span> • Customer: {dup.customerName} • Status: {dup.status.toUpperCase()} • Assigned: {dup.assignedToName}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDismissDuplicateWarning(true)}
                className="px-3 py-1.5 text-xs font-bold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                Confirm & Proceed Anyway
              </button>
              <Link
                href="/enquiries"
                className="text-xs font-medium text-amber-900 underline hover:text-amber-950"
              >
                Cancel and Review Existing Enquiries
              </Link>
            </div>
          </div>
        )}

        {/* Section 1: Customer & Commercial Assignment */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-maroon-600" />
            <span>Customer & Commercial Assignment</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Organization *
              </label>
              <select
                required
                value={customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-600 bg-white"
              >
                <option value="">-- Select Customer --</option>
                {customers.map((c) => (
                  <option key={c._id || c.id} value={c._id || c.id}>
                    {c.name} ({c.customerCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Person *
              </label>
              <select
                required
                value={contactId}
                onChange={(e) => handleContactChange(e.target.value)}
                disabled={!customerId}
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-600 bg-white disabled:bg-slate-50"
              >
                <option value="">-- Select Contact --</option>
                {filteredCustomerContacts.map((ct) => (
                  <option key={ct._id || ct.id} value={ct._id || ct.id}>
                    {ct.name} {ct.designation ? `- ${ct.designation}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Salesperson *
              </label>
              <select
                required
                value={assignedTo}
                onChange={(e) => handleSalespersonChange(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-600 bg-white"
              >
                <option value="">-- Select Salesperson --</option>
                {users.map((u) => (
                  <option key={u._id || u.id} value={u._id || u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                RFQ Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-600 bg-white font-semibold"
              >
                <option value="USD">USD - US Dollar ($)</option>
                <option value="AED">AED - UAE Dirham</option>
                <option value="SAR">SAR - Saudi Riyal</option>
                <option value="EUR">EUR - Euro (€)</option>
                <option value="GBP">GBP - British Pound (£)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tender Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-600 bg-white"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent Turnaround</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Follow-up Date
              </label>
              <input
                type="date"
                value={nextFollowUpDate}
                onChange={(e) => setNextFollowUpDate(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-600 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Client Reference / Tender Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. WHATSAPP ENQUIRY-PIPE / Client RFQ Ref #49281 / Delivery location JAFZA"
              className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-600 bg-white"
            />
          </div>
        </div>

        {/* Section 2: Excel / Spreadsheet Importer & Line Items */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Product Line Items ({items.length})</span>
              </h3>
              <p className="text-xs text-slate-500">
                Easily copy & paste spreadsheet tables from client RFQs or upload an Excel file directly
              </p>
            </div>

            {/* Input Method Toggle */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveItemTab("excel")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeItemTab === "excel"
                    ? "bg-white text-emerald-800 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-emerald-600" />
                <span>Excel / Table Paste</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveItemTab("manual")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeItemTab === "manual"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Package className="w-3.5 h-3.5 text-slate-500" />
                <span>Manual Specs</span>
              </button>
            </div>
          </div>

          {/* Excel / Paste Area */}
          {activeItemTab === "excel" && (
            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ClipboardPaste className="w-4 h-4 text-emerald-600" />
                  Paste Excel Cells or Select .xlsx File
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPasteText(SAMPLE_RFQ_PASTE_TEXT)}
                    className="text-[11px] font-bold text-emerald-700 bg-emerald-100/60 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300 transition-colors"
                  >
                    ⚡ Load Sample MSG Pipes RFQ
                  </button>
                  {pasteText && (
                    <button
                      type="button"
                      onClick={() => setPasteText("")}
                      className="text-[11px] font-medium text-slate-500 hover:text-rose-600 px-2 py-1 rounded"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Paste Textarea with onPaste screenshot support */}
              <div onPaste={handleClipboardPaste} className="relative">
                <textarea
                  rows={4}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  onPaste={handleClipboardPaste}
                  placeholder="Paste rows copied directly from Excel, CSV, or WhatsApp message:
1 | PIPE 6'' S.80 SEAMLESS CS MATERIAL ACC TO ASTM A106 GR.B DIMENSION ACC TO ANSI B36.10 DRL | 240 | MTR | 114.00
2 | PIPE 8'' S.80 SEAMLESS CS MATERIAL ACC TO ASTM A106 GR.B DIMENSION ACC TO ANSI B36.10 DRL | 144 | MTR | 165.00
3 | PIPE 10'' S.80 SEAMLESS CS MATERIAL ACC TO ASTM A106 GR.B DIMENSION ACC TO ANSI B36.10 DRL | 120 | MTR | 248.00

💡 Tip: You can also take a screenshot of any spreadsheet and press Ctrl + V right here to convert via OCR!"
                  className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-inner"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                {/* File Upload & Screenshot Alternative */}
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer transition-colors shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Upload Excel (.xlsx, .xls)</span>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 cursor-pointer transition-colors shadow-2xs">
                    <Camera className="w-3.5 h-3.5 text-emerald-600" />
                    <span>📸 Upload Screenshot / Image (OCR)</span>
                    <input
                      type="file"
                      accept="image/*,.png,.jpg,.jpeg,.webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) processImageOcr(file);
                      }}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-slate-500 hidden md:inline">
                    Or press <kbd className="px-1 py-0.5 bg-slate-200 rounded font-mono text-[10px]">Ctrl+V</kbd> to paste screenshot
                  </span>
                </div>

                {/* Parse Button */}
                <button
                  type="button"
                  onClick={handleParsePastedText}
                  disabled={isParsingExcel || !pasteText.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors disabled:opacity-40"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>
                    {isParsingExcel ? "Parsing Table..." : "⚡ Convert Excel to Quote Items"}
                  </span>
                </button>
              </div>

              {/* Notice Banner */}
              {importNotice && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    importNotice.type === "success"
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                      : "bg-rose-50 border border-rose-200 text-rose-800"
                  }`}
                >
                  {importNotice.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{importNotice.text}</span>
                </div>
              )}
            </div>
          )}

          {/* Editable Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-3 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Quotation Line Items Table ({items.length} items)
              </span>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-maroon-600" />
                <span>Add Row</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-charcoal-500 text-white uppercase text-[10px] tracking-wider">
                    <th className="p-2.5 w-10 text-center">#</th>
                    <th className="p-2.5 min-w-[320px]">Item Description & Material Specifications</th>
                    <th className="p-2.5 w-32">Category</th>
                    <th className="p-2.5 w-24 text-right">Qty</th>
                    <th className="p-2.5 w-24">Unit</th>
                    <th className="p-2.5 w-32 text-right">Target Price ({currency})</th>
                    <th className="p-2.5 w-32 text-right">Total ({currency})</th>
                    <th className="p-2.5 w-28">Remarks</th>
                    <th className="p-2.5 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.map((item, idx) => {
                    const lineTotal = (Number(item.quantity) || 0) * (Number(item.customerTargetUnitPrice) || 0);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-2.5 text-center font-bold text-slate-400">{idx + 1}</td>

                        {/* Description & Extracted Specs Badges */}
                        <td className="p-2.5 space-y-1">
                          <textarea
                            rows={2}
                            required
                            value={item.itemDescription}
                            onChange={(e) => handleItemChange(idx, "itemDescription", e.target.value)}
                            placeholder="e.g. PIPE 6'' S.80 SEAMLESS CS MATERIAL ACC TO ASTM A106 GR.B..."
                            className="w-full text-xs p-1.5 rounded-lg border border-slate-200 focus:outline-hidden focus:border-maroon-600 font-sans"
                          />
                          {(item.materialGrade || item.size || item.standard || item.pressureClass) && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {item.size && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200">
                                  Size: {item.size}
                                </span>
                              )}
                              {item.materialGrade && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Grade: {item.materialGrade}
                                </span>
                              )}
                              {item.pressureClass && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-50 text-purple-700 border border-purple-200">
                                  Class: {item.pressureClass}
                                </span>
                              )}
                              {item.standard && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                                  Std: {item.standard}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Category */}
                        <td className="p-2.5">
                          <select
                            value={item.category || "Pipes & Tubes"}
                            onChange={(e) => handleItemChange(idx, "category", e.target.value)}
                            className="w-full text-xs py-1 px-1.5 rounded-lg border border-slate-200 bg-white"
                          >
                            <option value="Pipes & Tubes">Pipes & Tubes</option>
                            <option value="Valves">Valves</option>
                            <option value="Flanges">Flanges</option>
                            <option value="Fittings">Fittings</option>
                            <option value="Gaskets & Seals">Gaskets & Seals</option>
                            <option value="Instrumentation & Gauges">Instrumentation & Gauges</option>
                            <option value="Fasteners & Studs">Fasteners & Studs</option>
                            <option value="Drilling & Wellhead">Drilling & Wellhead</option>
                          </select>
                        </td>

                        {/* Quantity */}
                        <td className="p-2.5">
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(idx, "quantity", parseInt(e.target.value) || 1)
                            }
                            className="w-full text-xs py-1 px-1.5 text-right font-bold rounded-lg border border-slate-200 bg-white"
                          />
                        </td>

                        {/* Unit */}
                        <td className="p-2.5">
                          <select
                            value={item.unitOfMeasure || "MTR"}
                            onChange={(e) => handleItemChange(idx, "unitOfMeasure", e.target.value)}
                            className="w-full text-xs py-1 px-1.5 rounded-lg border border-slate-200 bg-white font-medium"
                          >
                            <option value="MTR">MTR</option>
                            <option value="EA">EA</option>
                            <option value="SET">SET</option>
                            <option value="KG">KG</option>
                            <option value="LOT">LOT</option>
                            <option value="FT">FT</option>
                          </select>
                        </td>

                        {/* Customer Target / Unit Price */}
                        <td className="p-2.5">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.customerTargetUnitPrice || ""}
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                "customerTargetUnitPrice",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="0.00"
                            className="w-full text-xs py-1 px-1.5 text-right font-mono rounded-lg border border-slate-200 bg-white"
                          />
                        </td>

                        {/* Line Total */}
                        <td className="p-2.5 text-right font-bold font-mono text-slate-900">
                          {lineTotal > 0 ? formatCurrency(lineTotal, currency) : "-"}
                        </td>

                        {/* Remarks */}
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={item.notes || ""}
                            onChange={(e) => handleItemChange(idx, "notes", e.target.value)}
                            placeholder="e.g. MTC 3.1"
                            className="w-full text-xs py-1 px-1.5 rounded-lg border border-slate-200 bg-white"
                          />
                        </td>

                        {/* Remove Action */}
                        <td className="p-2.5 text-center">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                              title="Delete Row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer Totals */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span>
                  Total Line Items: <strong className="text-slate-900">{items.length}</strong>
                </span>
                <span>
                  Total Units / Qty: <strong className="text-slate-900">{totalQuantity}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Grand Estimated Value:
                </span>
                <span className="text-base font-bold font-mono text-maroon-700">
                  {formatCurrency(totalTargetValue, currency)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons: Convert to Quote, Save Enquiry, Cancel */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <Link
            href="/enquiries"
            className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors w-full sm:w-auto text-center"
          >
            Cancel
          </Link>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {/* Action 1: Save as Enquiry Only */}
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleFormSubmit(false)}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors disabled:opacity-50"
            >
              Save as Enquiry Only
            </button>

            {/* Action 2: PRIMARY - Save Enquiry & Convert to MSG Quotation */}
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleFormSubmit(true)}
              className="px-6 py-2.5 text-xs font-bold rounded-xl bg-maroon-600 hover:bg-maroon-700 text-white shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>
                {submitting ? "Processing Quotation..." : "⚡ Save & Convert to MSG Quotation"}
              </span>
            </button>
          </div>
        </div>

        {/* MODAL: MSG Quotation Preview */}
        {showQuotePreview && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
              {/* Modal Top Bar */}
              <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/msg-logo.png"
                    alt="MSG Oilfield Logo"
                    className="h-9 w-auto object-contain shrink-0"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (!target.src.includes("msgoilfield.com")) {
                        target.src = "https://www.msgoilfield.com/logo.png";
                      }
                    }}
                  />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Official Quotation Format Preview
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      MSG Oilfield Equipment Trading LLC • Reference: {quoteRefNumber}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadMsgPdf}
                    disabled={isGeneratingPdf}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-maroon-600 hover:bg-maroon-700 text-white transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isGeneratingPdf ? "Generating..." : "Download Official PDF"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowQuotePreview(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Exact MSG Quotation Document Layout */}
              <div className="p-6 sm:p-8 space-y-6 font-sans text-xs text-slate-800">
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row items-center justify-between border-b-2 border-maroon-700 pb-4 gap-4">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/msg-logo.png"
                      alt="MSG Oilfield Logo"
                      className="h-12 w-auto object-contain shrink-0"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.src.includes("msgoilfield.com")) {
                          target.src = "https://www.msgoilfield.com/logo.png";
                        }
                      }}
                    />
                    <div>
                      <h1 className="text-xl font-black text-maroon-800 tracking-tight">
                        MSG OILFIELD EQUIPMENT TRADING LLC
                      </h1>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        P.O. Box: 49281, Dubai, United Arab Emirates • TRN: 100492817200003
                      </p>
                      <p className="text-[11px] text-slate-600">
                        Tel: +971 4 881 0000 • Email: sales@msgoilfield.com • Web: www.msgoilfield.com
                      </p>
                    </div>
                  </div>
                  <div className="text-right border-l-2 border-slate-200 pl-4 shrink-0">
                    <span className="px-2.5 py-1 rounded bg-amber-50 text-amber-900 border border-amber-300 font-bold text-[10px] uppercase block">
                      ISO 9001:2015 Certified
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      ASIB Accredited Organization
                    </span>
                  </div>
                </div>

                {/* Client & RFQ Details Grid */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">To:</span>
                    <strong className="text-sm text-slate-900 block">
                      {customerName || "PREMIER ENERGY SERVICES"}
                    </strong>
                    <span className="text-slate-600 block mt-0.5">
                      JEBEL ALI FREE ZONE, DUBAI, UAE
                    </span>
                    <span className="text-slate-600 block">
                      Attn: {contactName || "PURCHASE / PROCUREMENT DEPT"}
                    </span>
                  </div>
                  <div className="text-right space-y-1">
                    <div>
                      <span className="text-slate-500">Quotation Ref: </span>
                      <strong className="text-maroon-700 font-mono">{quoteRefNumber}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Date: </span>
                      <strong>
                        {`${String(new Date().getDate()).padStart(2, "0")}-${String(
                          new Date().getMonth() + 1
                        ).padStart(2, "0")}-${new Date().getFullYear()}`}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Client Ref: </span>
                      <span>{notes || "WHATSAPP ENQUIRY-PIPE"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Currency: </span>
                      <strong className="text-slate-900">{currency}</strong>
                    </div>
                  </div>
                </div>

                {/* Bordered Items Table matching PDF images */}
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold text-[11px]">
                        <th className="p-2.5 border-r border-slate-300 w-12 text-center">S No.</th>
                        <th className="p-2.5 border-r border-slate-300">Description</th>
                        <th className="p-2.5 border-r border-slate-300 w-20 text-right">Qty</th>
                        <th className="p-2.5 border-r border-slate-300 w-16 text-center">Unit</th>
                        <th className="p-2.5 border-r border-slate-300 w-28 text-right">Unit Price</th>
                        <th className="p-2.5 border-r border-slate-300 w-28 text-right">Total Price</th>
                        <th className="p-2.5 w-24">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {items.map((it, idx) => {
                        const lTotal = (Number(it.quantity) || 0) * (Number(it.customerTargetUnitPrice) || 0);
                        return (
                          <tr key={idx}>
                            <td className="p-2.5 border-r border-slate-300 text-center font-bold text-slate-500">
                              {idx + 1}
                            </td>
                            <td className="p-2.5 border-r border-slate-300 font-medium text-slate-900">
                              {it.itemDescription}
                            </td>
                            <td className="p-2.5 border-r border-slate-300 text-right font-bold">
                              {it.quantity}
                            </td>
                            <td className="p-2.5 border-r border-slate-300 text-center">
                              {it.unitOfMeasure || "MTR"}
                            </td>
                            <td className="p-2.5 border-r border-slate-300 text-right font-mono">
                              {Number(it.customerTargetUnitPrice).toFixed(2)}
                            </td>
                            <td className="p-2.5 border-r border-slate-300 text-right font-mono font-bold text-slate-900">
                              {lTotal.toFixed(2)}
                            </td>
                            <td className="p-2.5 text-slate-600">{it.notes || "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 font-bold border-t-2 border-slate-300 text-slate-900">
                        <td colSpan={5} className="p-2.5 text-right uppercase border-r border-slate-300">
                          Total Amount ({currency}):
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-maroon-700 text-sm border-r border-slate-300">
                          {formatCurrency(totalTargetValue, currency)}
                        </td>
                        <td className="p-2.5"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Terms & Conditions Summary */}
                <div className="space-y-4 pt-2 border-t border-slate-200">
                  <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider">
                    Commercial & Technical Terms
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] text-slate-600">
                    <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                      <p><strong>Price Basis:</strong> {DEFAULT_MSG_TERMS.commercial.price}</p>
                      <p><strong>Validity:</strong> {DEFAULT_MSG_TERMS.commercial.validity}</p>
                      <p><strong>Payment:</strong> {DEFAULT_MSG_TERMS.commercial.payment}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                      <p><strong>Delivery:</strong> Exstock, subject to unsold (5-6 working days)</p>
                      <p><strong>MTC:</strong> 3.1 as per EN 10204</p>
                      <p><strong>Make / Origin:</strong> EUROPEAN / REPUTED</p>
                    </div>
                  </div>
                </div>

                {/* Signatory Block */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase block">Authorized Signatory:</span>
                    <strong className="text-sm text-slate-900 block">Mohammed Rizwan</strong>
                    <span className="text-xs text-slate-600 block">
                      Sales Department • MSG Oilfield Equipment Trading LLC
                    </span>
                  </div>
                  <div className="border border-slate-300 rounded p-2 text-center text-[10px] text-slate-400 w-36 h-20 flex flex-col items-center justify-center">
                    <span className="font-bold text-maroon-700">MSG OILFIELD</span>
                    <span className="text-[9px]">OFFICIAL STAMP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
