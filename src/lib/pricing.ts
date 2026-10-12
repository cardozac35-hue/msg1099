/**
 * Oil & Gas Sales Hub - Pricing & Landed Cost Engine
 * 
 * Implements industrial B2B cost calculation rules:
 * - Landed Cost = Unit Purchase Price + (Freight / Qty) + (Customs & Handling / Qty) + Other Costs
 * - Gross Profit = Revenue (ex-tax) - Landed Cost
 * - Gross Margin % = (Gross Profit / Revenue) * 100
 */

export interface LandedCostCalculationInput {
  unitPurchasePrice: number;
  quantity: number;
  allocatedFreight: number;
  allocatedCustomsAndDuties: number;
  otherApplicableCosts: number;
}

export interface LandedCostResult {
  unitLandedCost: number;
  totalLandedCost: number;
  unitFreightAllocation: number;
  unitCustomsAllocation: number;
}

export interface ProfitMarginCalculationInput {
  unitSellingPrice: number;
  quantity: number;
  discountPercent?: number; // e.g. 5 for 5%
  unitLandedCost: number;
}

export interface ProfitMarginResult {
  revenueExTax: number;
  totalLandedCost: number;
  grossProfit: number;
  grossMarginPercent: number;
  unitGrossProfit: number;
}

export interface QuotationCalculationInput {
  items: Array<{
    quantity: number;
    unitPrice: number;
    discountPercent?: number;
  }>;
  overallDiscountPercent?: number;
  taxPercent?: number; // e.g. 5 for 5% VAT
}

export interface QuotationCalculationResult {
  itemsCalculated: Array<{
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    lineSubtotal: number;
    lineDiscountAmount: number;
    lineTotal: number;
  }>;
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
}

// Fixed standard conversion rates to USD base for multi-currency comparison
export const EXCHANGE_RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  EUR: 1.08,
  GBP: 1.28,
  AED: 0.272,
  SAR: 0.267,
  SGD: 0.76,
  QAR: 0.274,
};

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string = "USD"
): number {
  if (fromCurrency === toCurrency) return roundToDecimal(amount, 2);
  const fromRate = EXCHANGE_RATES_TO_USD[fromCurrency.toUpperCase()] || 1.0;
  const toRate = EXCHANGE_RATES_TO_USD[toCurrency.toUpperCase()] || 1.0;
  const amountInUSD = amount * fromRate;
  const converted = amountInUSD / toRate;
  return roundToDecimal(converted, 2);
}

export function roundToDecimal(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Calculates per-unit and total landed cost according to documented industrial formula
 */
export function calculateLandedCost(input: LandedCostCalculationInput): LandedCostResult {
  const qty = Math.max(input.quantity, 1);
  const unitFreight = roundToDecimal(input.allocatedFreight / qty, 4);
  const unitCustoms = roundToDecimal(input.allocatedCustomsAndDuties / qty, 4);
  const otherCosts = roundToDecimal(input.otherApplicableCosts / qty, 4);

  const unitLandedCost = roundToDecimal(
    input.unitPurchasePrice + unitFreight + unitCustoms + otherCosts,
    2
  );
  const totalLandedCost = roundToDecimal(unitLandedCost * input.quantity, 2);

  return {
    unitLandedCost,
    totalLandedCost,
    unitFreightAllocation: unitFreight,
    unitCustomsAllocation: unitCustoms,
  };
}

/**
 * Computes Gross Profit and Gross Margin Percentage
 * Revenue is strictly evaluated EXCLUDING tax.
 */
export function calculateProfitAndMargin(input: ProfitMarginCalculationInput): ProfitMarginResult {
  const discountRate = (input.discountPercent || 0) / 100;
  const effectiveUnitPrice = input.unitSellingPrice * (1 - discountRate);
  const revenueExTax = roundToDecimal(effectiveUnitPrice * input.quantity, 2);
  const totalLandedCost = roundToDecimal(input.unitLandedCost * input.quantity, 2);

  const grossProfit = roundToDecimal(revenueExTax - totalLandedCost, 2);
  const grossMarginPercent = revenueExTax > 0 
    ? roundToDecimal((grossProfit / revenueExTax) * 100, 2)
    : 0;

  const unitGrossProfit = input.quantity > 0 
    ? roundToDecimal(grossProfit / input.quantity, 2)
    : 0;

  return {
    revenueExTax,
    totalLandedCost,
    grossProfit,
    grossMarginPercent,
    unitGrossProfit,
  };
}

/**
 * Server-side validated quotation calculation engine
 * Never trusts client-supplied mathematical totals
 */
export function calculateQuotationTotals(input: QuotationCalculationInput): QuotationCalculationResult {
  let subtotal = 0;

  const itemsCalculated = input.items.map((item) => {
    const rawLine = roundToDecimal(item.quantity * item.unitPrice, 2);
    const discPct = item.discountPercent || 0;
    const discAmount = roundToDecimal((rawLine * discPct) / 100, 2);
    const lineTotal = roundToDecimal(rawLine - discAmount, 2);

    subtotal += lineTotal;

    return {
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountPercent: discPct,
      lineSubtotal: rawLine,
      lineDiscountAmount: discAmount,
      lineTotal,
    };
  });

  subtotal = roundToDecimal(subtotal, 2);

  // Overall discount applied to subtotal
  const overallDiscountPct = input.overallDiscountPercent || 0;
  const discountAmount = roundToDecimal((subtotal * overallDiscountPct) / 100, 2);
  const taxableAmount = roundToDecimal(subtotal - discountAmount, 2);

  // Tax applied on taxable amount
  const taxPct = input.taxPercent || 0;
  const taxAmount = roundToDecimal((taxableAmount * taxPct) / 100, 2);
  const totalAmount = roundToDecimal(taxableAmount + taxAmount, 2);

  return {
    itemsCalculated,
    subtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    totalAmount,
  };
}
