"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { DataTable, Column } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { formatCurrency } from "@/lib/utils";
import { Plus, Package, Filter } from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Valves");
  const [materialGrade, setMaterialGrade] = useState("");
  const [standard, setStandard] = useState("");
  const [size, setSize] = useState("");
  const [pressureClass, setPressureClass] = useState("");
  const [connectionType, setConnectionType] = useState("");
  const [unitOfMeasure, setUnitOfMeasure] = useState("EA");
  const [listPrice, setListPrice] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error("Products fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku,
          name,
          category,
          materialGrade,
          standard,
          size,
          pressureClass,
          connectionType,
          unitOfMeasure,
          listPrice: parseFloat(listPrice) || 0,
          description,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        // Reset
        setSku("");
        setName("");
        setMaterialGrade("");
        setStandard("");
        setSize("");
        setPressureClass("");
        setConnectionType("");
        setListPrice("");
        setDescription("");
        fetchProducts();
      }
    } catch {
      // Ignore
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = categoryFilter === "all"
    ? products
    : products.filter((p) => p.category === categoryFilter);

  const columns: Column<any>[] = [
    {
      key: "sku",
      header: "SKU / Part No",
      sortable: true,
      className: "w-36 font-mono font-bold text-slate-800",
    },
    {
      key: "name",
      header: "Product Specification Name",
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block">{row.name}</span>
          <span className="text-[11px] text-slate-400 line-clamp-1">{row.description}</span>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      render: (row) => (
        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
          {row.category}
        </span>
      ),
    },
    {
      key: "materialGrade",
      header: "Material Grade",
      sortable: true,
      render: (row) => <span className="font-mono text-xs">{row.materialGrade || "-"}</span>,
    },
    {
      key: "standard",
      header: "Applicable Standard",
      sortable: true,
    },
    {
      key: "sizeClass",
      header: "Size & Pressure Rating",
      render: (row) => (
        <span>
          {row.size} {row.pressureClass && `• ${row.pressureClass}`}
        </span>
      ),
    },
    {
      key: "connectionType",
      header: "End Connection",
    },
    {
      key: "listPrice",
      header: "Indicative Price",
      sortable: true,
      render: (row) => formatCurrency(row.listPrice || 0, row.currency || "USD"),
    },
    {
      key: "unitOfMeasure",
      header: "UOM",
      className: "w-16 font-semibold",
    },
  ];

  const categories = [
    "all",
    "Valves",
    "Pipes & Tubes",
    "Flanges",
    "Fittings",
    "Gaskets & Seals",
    "Instrumentation & Gauges",
  ];

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Industrial Product Catalogue</h2>
            <p className="text-xs text-slate-500">
              Standardized API 6D, ASME, and ASTM piping components with technical rating specifications
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-maroon-600 hover:bg-maroon-700 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap ${
                categoryFilter === cat
                  ? "bg-charcoal-700 text-white border-charcoal-700 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat === "all" ? "All Categories" : cat}
            </button>
          ))}
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={filteredProducts}
          searchPlaceholder="Search products by SKU, name, material grade, or size..."
          searchFields={["sku", "name", "materialGrade", "standard", "size", "category"]}
          loading={loading}
          emptyMessage="No products registered matching criteria."
        />

        {/* MODAL: Create Product */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Register Technical Product Specification"
          subtitle="Define ASME/API piping component with exact metallurgical grade and pressure rating"
          maxWidth="2xl"
        >
          <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  SKU / Material Code *
                </label>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  placeholder="e.g. VLV-BF-6-600"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-mono uppercase"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Trunnion Ball Valve 6'' Class 600 RF"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Valves">Valves</option>
                  <option value="Pipes & Tubes">Pipes & Tubes</option>
                  <option value="Flanges">Flanges</option>
                  <option value="Fittings">Fittings</option>
                  <option value="Gaskets & Seals">Gaskets & Seals</option>
                  <option value="Instrumentation & Gauges">Instrumentation & Gauges</option>
                  <option value="Drilling & Wellhead">Drilling & Wellhead</option>
                  <option value="Fasteners & Studs">Fasteners & Studs</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Material Grade *
                </label>
                <input
                  type="text"
                  required
                  value={materialGrade}
                  onChange={(e) => setMaterialGrade(e.target.value)}
                  placeholder="e.g. ASTM A216 WCB / SS316"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Applicable Standard *
                </label>
                <input
                  type="text"
                  required
                  value={standard}
                  onChange={(e) => setStandard(e.target.value)}
                  placeholder="e.g. API 6D / ASME B16.34"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Size *
                </label>
                <input
                  type="text"
                  required
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="e.g. 6 inch (DN 150)"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pressure Class *
                </label>
                <input
                  type="text"
                  required
                  value={pressureClass}
                  onChange={(e) => setPressureClass(e.target.value)}
                  placeholder="e.g. Class 600 (100 bar)"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Connection Type *
                </label>
                <input
                  type="text"
                  required
                  value={connectionType}
                  onChange={(e) => setConnectionType(e.target.value)}
                  placeholder="e.g. RF Flanged / Butt Weld"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Unit of Measure *
                </label>
                <select
                  value={unitOfMeasure}
                  onChange={(e) => setUnitOfMeasure(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-semibold"
                >
                  <option value="EA">EA - Each</option>
                  <option value="MTR">MTR - Meters</option>
                  <option value="SET">SET - Sets</option>
                  <option value="KG">KG - Kilograms</option>
                  <option value="LOT">LOT - Lot</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Indicative List Price (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={listPrice}
                  onChange={(e) => setListPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Technical Specifications & Testing Notes
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Fire-safe API 607, NACE MR0175, fugitive emissions ISO 15848-1 compliance..."
                className="w-full py-2 px-3 rounded-xl border border-slate-200"
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
                {submitting ? "Saving Product..." : "Save Product Specification"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardShell>
  );
}
