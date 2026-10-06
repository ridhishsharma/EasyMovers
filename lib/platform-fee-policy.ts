export const PLATFORM_FEE_RATE_PERCENT = 10;

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
  // Customer promotions are an independent EasyMovers-funded control. They
  // must never silently alter the vendor quotation or settlement margin.
  const fee = base > 0 ? Math.min(money(quotation.totalAmount) || base, percentageFee) : 0;
  return {
    base,
    rate: PLATFORM_FEE_RATE_PERCENT,
    fee: round(fee),
    estimatedVendorPayoutBeforeTaxes: round(Math.max(0, money(quotation.totalAmount) - fee)),
  };
}
