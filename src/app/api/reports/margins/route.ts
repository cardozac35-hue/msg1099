import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { dbService } from "@/lib/store";
import { calculateProfitAndMargin } from "@/lib/pricing";

export async function GET() {
  try {
    // STRICT ADMIN GUARD
    const user = await requireAdmin();

    const supplierQuotes = await dbService.listAllSupplierQuotes(user.role);
    const quotations = await dbService.listQuotations();
    const suppliers = await dbService.listSuppliers();

    // 1. Supplier Lead Time Benchmarking
    const supplierLeadTimes = suppliers.map((s) => {
      const quotes = supplierQuotes.filter((sq) => sq.supplierId === s._id || sq.supplierId === s.id);
      const avgLeadTimeWeeks = quotes.length > 0
        ? quotes.reduce((acc, q) => acc + (q.leadTimeWeeks || 2), 0) / quotes.length
        : s.leadTimeAverageDays / 7;

      return {
        supplierName: s.name,
        country: s.country,
        rating: s.rating,
        leadTimeWeeks: parseFloat(avgLeadTimeWeeks.toFixed(1)),
        quoteCount: quotes.length,
      };
    });

    // 2. Quotation Profitability & Margins (Purchase Cost vs Selling Price)
    const profitabilityList: any[] = [];
    let totalRevenue = 0;
    let totalLandedCost = 0;
    let totalProfit = 0;

    for (const q of quotations) {
      if (!q.items || q.items.length === 0) continue;
      const firstItem = q.items[0];

      // Match against selected supplier quote
      const sq = supplierQuotes.find(
        (s) =>
          (s.enquiryId === q.enquiryId || s.enquiryId?._id === q.enquiryId) &&
          s.isSelected
      ) || supplierQuotes.find(
        (s) => s.enquiryId === q.enquiryId || s.enquiryId?._id === q.enquiryId
      );

      if (sq) {
        const pm = calculateProfitAndMargin({
          unitSellingPrice: firstItem.unitSellingPrice,
          quantity: firstItem.quantity,
          discountPercent: firstItem.discountPercent || 0,
          unitLandedCost: sq.calculatedUnitLandedCost,
        });

        totalRevenue += pm.revenueExTax;
        totalLandedCost += pm.totalLandedCost;
        totalProfit += pm.grossProfit;

        profitabilityList.push({
          quotationCode: q.quotationCode,
          customerName: q.customerName,
          productDescription: firstItem.itemDescription,
          quantity: firstItem.quantity,
          supplierName: sq.supplierName,
          unitPurchasePrice: sq.unitPurchasePrice,
          unitLandedCost: sq.calculatedUnitLandedCost,
          unitSellingPrice: firstItem.unitSellingPrice,
          revenue: pm.revenueExTax,
          totalLandedCost: pm.totalLandedCost,
          grossProfit: pm.grossProfit,
          grossMarginPercent: pm.grossMarginPercent,
          status: q.status,
        });
      }
    }

    const overallGrossMargin = totalRevenue > 0
      ? parseFloat(((totalProfit / totalRevenue) * 100).toFixed(2))
      : 0;

    // 3. Supplier Price Comparison Matrix (by enquiry)
    const priceComparisons: Record<string, any[]> = {};
    for (const sq of supplierQuotes) {
      const key = sq.enquiryId?.toString() || "other";
      if (!priceComparisons[key]) {
        priceComparisons[key] = [];
      }
      priceComparisons[key].push({
        supplierName: sq.supplierName,
        supplierReference: sq.supplierReference,
        unitPurchasePrice: sq.unitPurchasePrice,
        allocatedFreight: sq.allocatedFreight,
        allocatedCustomsDuties: sq.allocatedCustomsDuties,
        calculatedUnitLandedCost: sq.calculatedUnitLandedCost,
        leadTimeWeeks: sq.leadTimeWeeks,
        isSelected: sq.isSelected,
      });
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalRevenue,
        totalLandedCost,
        totalGrossProfit: totalProfit,
        overallGrossMarginPercent: overallGrossMargin,
        analyzedQuotesCount: profitabilityList.length,
      },
      profitabilityList,
      supplierLeadTimes,
      priceComparisons,
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (err.message === "FORBIDDEN" || err.message.includes("FORBIDDEN")) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Administrator privileges required for margin analytics" },
        { status: 403 }
      );
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
