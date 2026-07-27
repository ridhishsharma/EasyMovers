import {
  VendorCategory,
  VendorStatus,
} from "@/ai/models/vendor.model";

import type {
  VendorProfile,
} from "@/ai/models/vendor.model";

import type { VendorSource } from "@/ai/types/vendor.types";

function resolveVendorCategory(
  vendor: Pick<
    VendorSource,
    | "householdService"
    | "officeService"
    | "vehicleService"
  >,
): VendorCategory {
  const activeServices = [
    vendor.householdService,
    vendor.officeService,
    vendor.vehicleService,
  ].filter(Boolean).length;

  if (activeServices > 1) {
    return VendorCategory.MULTI_SERVICE;
  }

  if (vendor.officeService) {
    return VendorCategory.OFFICE;
  }

  if (vendor.vehicleService) {
    return VendorCategory.VEHICLE;
  }

  return VendorCategory.HOUSEHOLD;
}

function resolveVendorStatus(
  status: string,
): VendorStatus {
  switch (status.trim().toUpperCase()) {
    case "ACTIVE":
    case "APPROVED":
    case "VERIFIED":
      return VendorStatus.ACTIVE;

    case "INACTIVE":
    case "DISABLED":
      return VendorStatus.INACTIVE;

    case "SUSPENDED":
    case "BLOCKED":
    case "REJECTED":
      return VendorStatus.SUSPENDED;

    case "PENDING":
    case "UNDER_REVIEW":
    default:
      return VendorStatus.PENDING;
  }
}

export function buildVendorProfile(
    vendor: VendorSource,
): VendorProfile {
  const currentYear = new Date().getFullYear();

  const establishedYear =
    vendor.experienceYears !== null
      ? currentYear - vendor.experienceYears
      : undefined;

  return {
    vendorId: vendor.id,
    companyName: vendor.companyName,
    ownerName: vendor.ownerName,
    registrationNumber: vendor.vendorCode,
    gstNumber: vendor.gstNumber ?? undefined,
    city: vendor.city ?? "",
    state: vendor.state ?? "",
    category: resolveVendorCategory(vendor),
    status: resolveVendorStatus(vendor.status),
    establishedYear,
  };
}