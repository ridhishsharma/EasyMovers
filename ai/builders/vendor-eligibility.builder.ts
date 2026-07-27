import {
  VendorEligibilityRequest,
  VendorEligibilityResult,
} from "@/ai/models/vendor-eligibility.model";

import { VendorSource } from "@/ai/types/vendor.types";

export function buildVendorEligibility(
  vendor: VendorSource,
  request: VendorEligibilityRequest
): VendorEligibilityResult {

  const reasons: string[] = [];

  const vendorActive =
    vendor.status === "ACTIVE";

  if (!vendorActive)
    reasons.push("Vendor is not active.");

  const serviceCities =
    vendor.serviceCities
      ?.split(",")
      .map(city => city.trim().toLowerCase()) ?? [];

  const originCitySupported =
    serviceCities.includes(
      request.customerCity.toLowerCase()
    );

  if (!originCitySupported)
    reasons.push(
      `Origin city ${request.customerCity} is not supported.`
    );

  const destinationCitySupported =
    serviceCities.includes(
      request.destinationCity.toLowerCase()
    );

  if (!destinationCitySupported)
    reasons.push(
      `Destination city ${request.destinationCity} is not supported.`
    );

  const insuranceAvailable =
    request.isPremiumMove
      ? vendor.insuranceAvailable
      : true;

  if (!insuranceAvailable)
    reasons.push(
      "Insurance is required."
    );

  const capacityAvailable =
    (vendor.totalLabours ?? 0) > 0 &&
    (vendor.totalVehicles ?? 0) > 0;

  if (!capacityAvailable)
    reasons.push(
      "Insufficient manpower or vehicles."
    );

  return {

    eligible:
      vendorActive &&
      originCitySupported &&
      destinationCitySupported &&
      insuranceAvailable &&
      capacityAvailable,

    checks: {
      vendorActive,
      originCitySupported,
      destinationCitySupported,
      insuranceAvailable,
      capacityAvailable,
    },

    reasons,
  };
}