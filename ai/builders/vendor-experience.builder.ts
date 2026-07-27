import type {
  VendorExperience,
} from "@/ai/models/vendor.model";

import type { VendorSource } from "@/ai/types/vendor.types";

export function buildVendorExperience(
    vendor: VendorSource,
): VendorExperience {

  const totalBookings =
    vendor.completedMoves ?? 0;

  return {

    totalYears:
      vendor.experienceYears ?? 0,

    totalBookings,

    successfulBookings:
      totalBookings,

    cancelledBookings:
      0,

    damagedClaims:
      0,

  };

}