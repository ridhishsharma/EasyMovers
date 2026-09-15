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

function personName(data: Record<string, unknown>, key: string) {
  const value = required(data, key, 100).replace(/\s+/g, " ");
  if (!/^[\p{L}][\p{L}\p{M} .'-]{1,99}$/u.test(value)) {
    throw Error(`CHECK_${key.toUpperCase()}`);
  }
  return value;
}

function address(data: Record<string, unknown>) {
  const value = required(data, "addressLine1", 300).replace(/\s+/g, " ");
  if (
    value.length < 5 ||
    !/\p{L}/u.test(value) ||
    !/^[\p{L}\p{M}\p{N}\s,.'#&/()\-:]+$/u.test(value)
  ) {
    throw Error("CHECK_ADDRESSLINE1");
  }
  return value;
}

type PostalOffice = {
  Name?: string;
  District?: string;
  State?: string;
  Block?: string;
  Division?: string;
  Country?: string;
  Pincode?: string;
};

const comparable = (value: string | undefined) =>
  value?.normalize("NFKC").toLocaleLowerCase("en-IN").replace(/[^\p{L}\p{N}]+/gu, " ").trim() ?? "";

export async function verifyVendorPostalLocation(input: PublicVendorApplicationInput) {
  let response: Response;
  try {
    response = await fetch(`https://api.postalpincode.in/pincode/${input.postalCode}`, {
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
  } catch {
    throw Error("POSTAL_LOOKUP_UNAVAILABLE");
  }
  if (!response.ok) throw Error("POSTAL_LOOKUP_UNAVAILABLE");
  const result = (await response.json())?.[0];
  const offices: PostalOffice[] = Array.isArray(result?.PostOffice)
    ? result.PostOffice.filter((office: PostalOffice) =>
        office.Pincode === input.postalCode && office.Country === "India")
    : [];
  if (result?.Status !== "Success" || !offices.length) {
    throw Error("CHECK_POSTALLOCATION");
  }
  const city = comparable(input.city);
  const state = comparable(input.state);
  const stateMatches = offices.some((office) => comparable(office.State) === state);
  const cityMatches = offices.some((office) =>
    [office.District, office.Name, office.Block, office.Division].some((candidate) => {
      const normalized = comparable(candidate);
      return normalized === city || normalized.startsWith(`${city} `) || city.startsWith(`${normalized} `);
    }),
  );
  if (!stateMatches || !cityMatches) throw Error("CHECK_POSTALLOCATION");
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
    contactName: personName(data, "contactName"),
    mobile,
    email,
    addressLine1: address(data),
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
  if (code === "CHECK_POSTALLOCATION") return "The city and state do not match this Indian PIN code.";
  if (code === "POSTAL_LOOKUP_UNAVAILABLE") return "PIN verification is temporarily unavailable. Please retry.";
  if (code.startsWith("CHECK_")) return "Check the highlighted application details.";
  return "Invalid partner application.";
}
