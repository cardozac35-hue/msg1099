import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { dbService } from "@/lib/store";
import { calculateProfitAndMargin } from "@/lib/pricing";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const quotation = await dbService.getQuotationById(params.id);

    if (!quotation) {
      return NextResponse.json({ success: false, error: "Quotation not found" }, { status: 404 });
    }

    // Role-dependent field sanitization
    let marginAnalysis = null;
    if (user.role === "admin") {
      // Admin gets supplier cost and margin breakdown
      try {
        const supplierQuotes = await dbService.listSupplierQuotesForEnquiry(
          quotation.enquiryId?.toString() || quotation.enquiryId,
          user.role
        );
        const selectedQuote = supplierQuotes.find((sq: any) => sq.isSelected) || supplierQuotes[0];

        if (selectedQuote && quotation.items?.[0]) {
          const item = quotation.items[0];
          const profit = calculateProfitAndMargin({
            unitSellingPrice: item.unitSellingPrice,
            quantity: item.quantity,
            discountPercent: item.discountPercent || 0,
            unitLandedCost: selectedQuote.calculatedUnitLandedCost,
          });

          marginAnalysis = {
            supplierName: selectedQuote.supplierName,
            supplierReference: selectedQuote.supplierReference,
            unitPurchasePrice: selectedQuote.unitPurchasePrice,
            unitLandedCost: selectedQuote.calculatedUnitLandedCost,
            totalLandedCost: selectedQuote.calculatedTotalLandedCost,
            grossProfit: profit.grossProfit,
            grossMarginPercent: profit.grossMarginPercent,
          };
        }
      } catch {
        // Ignored if no supplier quote recorded
      }
    }

    return NextResponse.json({
      success: true,
      quotation,
      marginAnalysis, // null for salespeople, populated for admin
      userRole: user.role,
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
