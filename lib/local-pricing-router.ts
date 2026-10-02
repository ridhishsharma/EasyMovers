export type LocalPricingReason =
  | "NOT_WITHIN_CITY"
  | "SERVICE_REQUIRES_QUOTATION"
  | "INVENTORY_REQUIRED"
  | "TOO_MANY_ITEM_LINES"
  | "TOO_MANY_UNITS"
  | "FRAGILE_ITEM"
  | "PACKING_REQUIRED"
  | "SPECIAL_HANDLING"
  | "INSTALLATION_REQUIRED"
  | "ACCESS_REVIEW_REQUIRED";

export type LocalPricingPolicy = {
  version: string;
  instantServices: string[];
  maxItemLines: number;
  maxTotalUnits: number;
  allowFragile: boolean;
  allowPacking: boolean;
  maxFloorWithoutLift: number;
};

export type LocalPricingInput = {
  mode: string;
  serviceType: string;
  items: Array<{ quantity: number; fragile?: boolean; requiresPacking?: boolean }>;
  pickupFloor?: string | null;
  pickupLift?: string | null;
  destinationFloor?: string | null;
  destinationLift?: string | null;
  specialItems?: string | null;
  additionalServices?: string | null;
};

const defaultPolicy: LocalPricingPolicy = {
  version: "local-instant-v1",
  instantServices: ["GOODS"],
  maxItemLines: 8,
  maxTotalUnits: 20,
  allowFragile: false,
  allowPacking: false,
  maxFloorWithoutLift: 0,
};

function boundedInteger(value: unknown, fallback: number, maximum: number) {
  return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= maximum
    ? Number(value)
    : fallback;
}

export function readLocalPricingPolicy(raw?: string): LocalPricingPolicy {
  if (!raw) return defaultPolicy;
  const value = JSON.parse(raw) as Partial<LocalPricingPolicy>;
  if (!Array.isArray(value.instantServices) || !value.instantServices.length)
    throw Error("INVALID_LOCAL_PRICING_POLICY");
  const instantServices = value.instantServices.map((item) => String(item).trim().toUpperCase());
  if (instantServices.some((item) => !["GOODS", "VEHICLE"].includes(item)))
    throw Error("INVALID_LOCAL_PRICING_POLICY");
  return {
    version: typeof value.version === "string" && value.version.trim() ? value.version.trim() : defaultPolicy.version,
    instantServices,
    maxItemLines: boundedInteger(value.maxItemLines, defaultPolicy.maxItemLines, 100),
    maxTotalUnits: boundedInteger(value.maxTotalUnits, defaultPolicy.maxTotalUnits, 999),
    allowFragile: value.allowFragile === true,
    allowPacking: value.allowPacking === true,
    maxFloorWithoutLift: boundedInteger(value.maxFloorWithoutLift, defaultPolicy.maxFloorWithoutLift, 100),
  };
}

const floorNumber = (value?: string | null) => {
  if (!value) return 0;
  const match = value.match(/-?\d+/);
  return match ? Math.max(0, Number(match[0])) : 0;
};

export function resolveLocalPricingRoute(input: LocalPricingInput, policy = defaultPolicy) {
  const reasons: LocalPricingReason[] = [];
  if (input.mode !== "LOCAL") reasons.push("NOT_WITHIN_CITY");
  if (!policy.instantServices.includes(input.serviceType.trim().toUpperCase()))
    reasons.push("SERVICE_REQUIRES_QUOTATION");
  if (!input.items.length) reasons.push("INVENTORY_REQUIRED");
  if (input.items.length > policy.maxItemLines) reasons.push("TOO_MANY_ITEM_LINES");
  const totalUnits = input.items.reduce((sum, item) => sum + (Number.isInteger(item.quantity) ? item.quantity : 0), 0);
  if (totalUnits > policy.maxTotalUnits) reasons.push("TOO_MANY_UNITS");
  if (!policy.allowFragile && input.items.some((item) => item.fragile)) reasons.push("FRAGILE_ITEM");
  if (!policy.allowPacking && input.items.some((item) => item.requiresPacking)) reasons.push("PACKING_REQUIRED");
  if (input.specialItems?.trim()) reasons.push("SPECIAL_HANDLING");
  if (/install|uninstall|dismantl|assemble/i.test(input.additionalServices || "")) reasons.push("INSTALLATION_REQUIRED");
  const inaccessiblePickup = floorNumber(input.pickupFloor) > policy.maxFloorWithoutLift && input.pickupLift !== "Yes";
  const inaccessibleDrop = floorNumber(input.destinationFloor) > policy.maxFloorWithoutLift && input.destinationLift !== "Yes";
  if (inaccessiblePickup || inaccessibleDrop) reasons.push("ACCESS_REVIEW_REQUIRED");
  return {
    route: reasons.length ? "FULL_QUOTATION" as const : "INSTANT_RATE" as const,
    reasons: [...new Set(reasons)],
    policyVersion: policy.version,
    totalUnits,
  };
}

export const localPricingReasonMessage: Record<LocalPricingReason, string> = {
  NOT_WITHIN_CITY: "Instant rates apply only within one supported city.",
  SERVICE_REQUIRES_QUOTATION: "This moving service requires a complete vendor quotation.",
  INVENTORY_REQUIRED: "Add the items being transported before requesting an instant rate.",
  TOO_MANY_ITEM_LINES: "The inventory contains too many different items for instant pricing.",
  TOO_MANY_UNITS: "The total quantity is above the instant-transport limit.",
  FRAGILE_ITEM: "Fragile items require vendor review.",
  PACKING_REQUIRED: "Packing requirements need a complete quotation.",
  SPECIAL_HANDLING: "Special items require vendor review.",
  INSTALLATION_REQUIRED: "Installation or dismantling charges require a complete quotation.",
  ACCESS_REVIEW_REQUIRED: "Floor or lift access requires operational review.",
};
