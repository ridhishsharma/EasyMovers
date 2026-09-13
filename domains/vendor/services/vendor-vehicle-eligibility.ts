import type { VendorDocument, VendorVehicle, VendorService } from "../models/vendor.model";

const transportServices = new Set([
  "HOUSEHOLD_RELOCATION", "OFFICE_RELOCATION", "CORPORATE_RELOCATION",
  "VEHICLE_TRANSPORT", "COMMERCIAL_GOODS",
]);

function normalizeNumber(value: unknown): string {
  return typeof value === "string"
    ? value.trim().toUpperCase().replace(/[\s-]/g, "")
    : "";
}

function validFutureDate(value: unknown, observedTime: number): boolean {
  return value instanceof Date && Number.isFinite(value.getTime())
    && value.getTime() > observedTime;
}

function matchingEvidence(
  documents: readonly VendorDocument[],
  type: VendorDocument["documentType"],
  number: string,
  observedTime: number,
  requireExpiry: boolean
): boolean {
  if (!number) return false;
  return documents.some(document => {
    if (document.documentType !== type || document.status !== "VERIFIED"
      || normalizeNumber(document.documentNumber) !== number
      || typeof document.documentUrl !== "string" || !document.documentUrl.trim()) {
      return false;
    }
    if (document.issuedAt !== undefined
      && (!(document.issuedAt instanceof Date)
        || !Number.isFinite(document.issuedAt.getTime())
        || document.issuedAt.getTime() > observedTime)) return false;
    if (document.expiresAt === undefined) return !requireExpiry;
    return validFutureDate(document.expiresAt, observedTime);
  });
}

/** Activation prerequisite, not a substitute for assignment-time compliance. */
export function hasActivationEligibleTransportVehicle(
  vehicles: readonly VendorVehicle[],
  documents: readonly VendorDocument[],
  observedAt: Date = new Date()
): boolean {
  const observedTime = observedAt.getTime();
  if (!Number.isFinite(observedTime)) return false;
  return vehicles.some(vehicle =>
    vehicle.active === true && vehicle.status === "AVAILABLE"
    && matchingEvidence(documents, "VEHICLE_REGISTRATION" as VendorDocument["documentType"],
      normalizeNumber(vehicle.registrationNumber), observedTime, false)
    && normalizeNumber(vehicle.insuranceNumber) !== ""
    && validFutureDate(vehicle.insuranceExpiryDate, observedTime)
    && matchingEvidence(documents, "INSURANCE_POLICY" as VendorDocument["documentType"],
      normalizeNumber(vehicle.insuranceNumber), observedTime, true)
  );
}

export function requiresTransportVehicle(services: readonly VendorService[]): boolean {
  return services.some(service => service.active === true
    && transportServices.has(service.serviceType));
}
