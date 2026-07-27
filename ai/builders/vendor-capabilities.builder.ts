import type {
  VendorCapabilities,
} from "@/ai/models/vendor.model";

import type { VendorSource } from "@/ai/types/vendor.types";

export function buildVendorCapabilities(
    vendor: VendorSource,
): VendorCapabilities {
  return {
    householdService: vendor.householdService,
    officeService: vendor.officeService,
    vehicleService: vendor.vehicleService,

    insuranceAvailable: vendor.insuranceAvailable,

    serviceCities: vendor.serviceCities
      ? vendor.serviceCities
          .split(",")
          .map((city) => city.trim())
          .filter(Boolean)
      : [],

    totalLabours: vendor.totalLabours ?? undefined,
    totalVehicles: vendor.totalVehicles ?? undefined,
  };
}