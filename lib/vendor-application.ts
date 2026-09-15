import { randomBytes } from "node:crypto";

export type PublicVendorApplicationInput = {
  requestId: string;
  companyName: string;
  businessType: "SOLE_PROPRIETOR" | "REGISTERED_BUSINESS";
  operatingCategory: "LOCAL" | "REGIONAL" | "NATIONAL";
  gstNumber?: string;
  panNumber?: string;
  contactName: string;
  mobile: string;
  email: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  consent: true;
  sopConsent: true;
};

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Error("INVALID_REQUEST");
  return value as Record<string, unknown>;
}

function required(data: Record<string, unknown>, key: string, max: number) {
  const value = data[key];
  if (typeof value !== "string") throw Error(`CHECK_${key.toUpperCase()}`);
  const normalized = value.trim();
  if (!normalized || normalized.length > max) throw Error(`CHECK_${key.toUpperCase()}`);
  return normalized;
}

function optional(data: Record<string, unknown>, key: string, max: number) {
  const value = data[key];
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || value.trim().length > max) throw Error(`CHECK_${key.toUpperCase()}`);
  return value.trim().toUpperCase();
}

function placeName(data: Record<string, unknown>, key: "city" | "state") {
  const value = required(data, key, 100);
  if (!/^[\p{L}][\p{L}\p{M} .'-]{1,99}$/u.test(value)) {
    throw Error(`CHECK_${key.toUpperCase()}`);
  }
  return value.replace(/\s+/g, " ");
}

export function parseVendorApplication(value: unknown): PublicVendorApplicationInput {
  const data = object(value);
  const requestId = required(data, "requestId", 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) throw Error("CHECK_REQUESTID");
  const businessType = required(data, "businessType", 30);
  if (businessType !== "SOLE_PROPRIETOR" && businessType !== "REGISTERED_BUSINESS") throw Error("CHECK_BUSINESSTYPE");
  const operatingCategory = required(data, "operatingCategory", 20);
  if (!(["LOCAL", "REGIONAL", "NATIONAL"] as const).includes(operatingCategory as "LOCAL")) throw Error("CHECK_OPERATINGCATEGORY");
  const mobile = required(data, "mobile", 10);
  if (!/^[6-9][0-9]{9}$/.test(mobile)) throw Error("CHECK_MOBILE");
  const email = required(data, "email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Error("CHECK_EMAIL");
  const postalCode = required(data, "postalCode", 6);
  if (!/^[1-9][0-9]{5}$/.test(postalCode)) throw Error("CHECK_POSTALCODE");
  const panNumber = optional(data, "panNumber", 10);
  if (panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNumber)) throw Error("CHECK_PANNUMBER");
  const gstNumber = optional(data, "gstNumber", 15);
  if (gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstNumber)) throw Error("CHECK_GSTNUMBER");
  if (data.consent !== true || data.sopConsent !== true) throw Error("CONSENT_REQUIRED");
  return {
    requestId,
    companyName: required(data, "companyName", 150),
    businessType,
    operatingCategory: operatingCategory as PublicVendorApplicationInput["operatingCategory"],
    gstNumber,
    panNumber,
    contactName: required(data, "contactName", 100),
    mobile,
    email,
    addressLine1: required(data, "addressLine1", 300),
    city: placeName(data, "city"),
    state: placeName(data, "state"),
    postalCode,
    consent: true,
    sopConsent: true,
  };
}

export function vendorApplicationReference(now = new Date()) {
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  return `EMVP-${date}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export function vendorApplicationError(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "CONSENT_REQUIRED") return "Accept the onboarding terms and service standards.";
  if (code.startsWith("CHECK_")) return "Check the highlighted application details.";
  return "Invalid partner application.";
}
