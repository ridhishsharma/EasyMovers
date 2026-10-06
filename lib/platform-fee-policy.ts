export const PLATFORM_FEE_RATE_PERCENT = 10;
export const PLATFORM_FEE_MINIMUM = 499;
// Introductory launch protection. This is an internal commercial control, not a permanent entitlement.
export const PLATFORM_FEE_LAUNCH_CAP = 2500;

const money = (value: unknown) => {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? Math.max(0, amount) : 0;
};

const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export type PlatformFeeQuotation = {
  transportationCost?: unknown;
  packingCost?: unknown;
  unpackingCost?: unknown;
  labourCost?: unknown;
  otherCost?: unknown;
  discountAmount?: unknown;
  totalAmount?: unknown;
};

export function platformFeeBase(quotation: PlatformFeeQuotation) {
  const hasComponents = [quotation.transportationCost, quotation.packingCost, quotation.unpackingCost, quotation.labourCost, quotation.otherCost, quotation.discountAmount].some(value => value !== undefined && value !== null);
  const componentBase =
    money(quotation.transportationCost) +
    money(quotation.packingCost) +
    money(quotation.unpackingCost) +
    money(quotation.labourCost) +
    money(quotation.otherCost) -
    money(quotation.discountAmount);
  return round(Math.max(0, hasComponents ? componentBase : money(quotation.totalAmount)));
}

export function calculatePlatformFee(quotation: PlatformFeeQuotation) {
  const base = platformFeeBase(quotation);
  const percentageFee = round(base * PLATFORM_FEE_RATE_PERCENT / 100);
  const fee = base > 0
    ? Math.min(money(quotation.totalAmount) || base, PLATFORM_FEE_LAUNCH_CAP, Math.max(PLATFORM_FEE_MINIMUM, percentageFee))
    : 0;
  return {
    base,
    rate: PLATFORM_FEE_RATE_PERCENT,
    fee: round(fee),
    estimatedVendorPayoutBeforeTaxes: round(Math.max(0, money(quotation.totalAmount) - fee)),
  };
}
