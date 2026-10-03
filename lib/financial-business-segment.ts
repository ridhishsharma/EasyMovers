import { FinancialBusinessSegment, Prisma } from "@prisma/client";

const record = (value: Prisma.JsonValue | null | undefined) => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, Prisma.JsonValue> : {};
const normalized = (value: unknown) => typeof value === "string" ? value.trim().toUpperCase().replace(/[ -]+/g, "_") : "";
const containsInstantEvidence = (value: Prisma.JsonValue | null | undefined): boolean => {
  if (typeof value === "string") return ["INSTANT_RATE", "INSTANT", "SYSTEM_RATE"].includes(normalized(value));
  if (Array.isArray(value)) return value.some(containsInstantEvidence);
  if (value && typeof value === "object") return Object.values(record(value)).some(containsInstantEvidence);
  return false;
};
const evidence = (...values: Array<Prisma.JsonValue | null | undefined>) => values.some(containsInstantEvidence);

export function deriveFinancialBusinessSegment(input: {
  serviceType: string;
  moveType: string;
  requirementsJson?: Prisma.JsonValue | null;
  paymentMetadata?: Prisma.JsonValue | null;
  pricingBreakdown?: Prisma.JsonValue | null;
}) {
  const service = normalized(input.serviceType);
  const movement = normalized(input.moveType);
  if (service.includes("CORPORATE")) return FinancialBusinessSegment.CORPORATE_RELOCATION;
  if (["PACKING_ONLY", "LOADING_UNLOADING", "INSTALLATION_UNINSTALLATION"].includes(service)) return FinancialBusinessSegment.ADD_ON_SERVICE;
  const withinCity = ["WITHIN_CITY", "LOCAL", "INTRACITY", "INTRA_CITY"].includes(movement);
  if (!withinCity) return FinancialBusinessSegment.INTERCITY_QUOTATION;
  return evidence(input.requirementsJson, input.paymentMetadata, input.pricingBreakdown)
    ? FinancialBusinessSegment.WITHIN_CITY_INSTANT
    : FinancialBusinessSegment.WITHIN_CITY_QUOTATION;
}
