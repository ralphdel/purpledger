// PurpLedger — Proportional Payment Calculation Engine
// All financial calculations are server-side. Client-side amounts are display-only.

export interface PaymentAllocation {
  amountPaid: number;
  kFactor: number;
  taxCollected: number;
  discountApplied: number;
  newOutstandingBalance: number;
  newAmountPaid: number;
  paystackFee: number;
  totalCharge: number; // what customer actually pays (if customer absorbs)
}

/**
 * Calculate proportional allocation for a partial payment.
 * k = P / Outstanding Balance
 * Tax Collected = k × Total Invoice Tax Value
 * Discount Applied = k × Total Invoice Discount Value
 */
export function calculateProportionalPayment(
  paymentAmount: number,
  outstandingBalance: number,
  invoiceTaxValue: number,
  invoiceDiscountValue: number,
  currentAmountPaid: number,
  feeAbsorption: "business" | "customer" = "business"
): PaymentAllocation {
  const k = outstandingBalance > 0 ? paymentAmount / outstandingBalance : 0;
  const taxCollected = roundToTwo(k * invoiceTaxValue);
  const discountApplied = roundToTwo(k * invoiceDiscountValue);

  const paystackFee = calculatePaystackFee(paymentAmount);
  const totalCharge =
    feeAbsorption === "customer"
      ? roundToTwo(paymentAmount + paystackFee)
      : paymentAmount;

  return {
    amountPaid: paymentAmount,
    kFactor: roundToSix(k),
    taxCollected,
    discountApplied,
    newOutstandingBalance: roundToTwo(outstandingBalance - paymentAmount),
    newAmountPaid: roundToTwo(currentAmountPaid + paymentAmount),
    paystackFee,
    totalCharge,
  };
}

/**
 * Paystack standard fee: 1.5% + ₦100 (capped at ₦2,000).
 * International cards: 3.9% + ₦100 (not implemented for MVP).
 */
export function calculatePaystackFee(amount: number): number {
  const fee = amount * 0.015 + 100;
  return roundToTwo(Math.min(fee, 2000));
}

/**
 * Calculate invoice totals from line items.
 */
export function calculateInvoiceTotals(
  lineItems: { quantity: number; unitRate: number }[],
  discountPct: number,
  taxPct: number
) {
  const subtotal = lineItems.reduce(
    (sum, item) => sum + roundToTwo(item.quantity * item.unitRate),
    0
  );
  const discountValue = roundToTwo(subtotal * (discountPct / 100));
  const taxableAmount = roundToTwo(subtotal - discountValue);
  const taxValue = roundToTwo(taxableAmount * (taxPct / 100));
  const grandTotal = roundToTwo(taxableAmount + taxValue);

  return { subtotal, discountValue, taxValue, grandTotal };
}

function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

function roundToSix(num: number): number {
  return Math.round((num + Number.EPSILON) * 1000000) / 1000000;
}

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    open: "bg-blue-100 text-blue-700 border-blue-200",
    partially_paid: "bg-amber-100 text-amber-700 border-amber-200",
    closed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    manually_closed: "bg-purple-100 text-purple-700 border-purple-200",
    expired: "bg-gray-100 text-gray-600 border-gray-200",
    void: "bg-red-100 text-red-700 border-red-200",
  };
  return colors[status] || "bg-gray-100 text-gray-600 border-gray-200";
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    open: "Open",
    partially_paid: "Partially Paid",
    closed: "Closed",
    manually_closed: "Manually Closed",
    expired: "Expired",
    void: "Void",
  };
  return labels[status] || status;
}

/**
 * Calculate the minimum allowed payment amount.
 * Rule: 10% of the invoice grand total, capped at ₦1,000.
 * i.e. min(grandTotal * 0.10, 1000)
 * If the outstanding balance is less than the minimum, allow the full outstanding amount.
 */
export function getMinimumPayment(grandTotal: number, outstandingBalance: number): number {
  const tenPercent = roundToTwo(grandTotal * 0.10);
  const minimum = Math.min(tenPercent, 1000);
  // If outstanding is less than the minimum, allow paying the rest
  return Math.min(minimum, outstandingBalance);
}
