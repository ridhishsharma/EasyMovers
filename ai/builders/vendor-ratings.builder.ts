import type {
  VendorRatings,
} from "@/ai/models/vendor.model";

import type { VendorSource } from "@/ai/types/vendor.types";

export function buildVendorRatings(
    vendor: VendorSource,
): VendorRatings {
  const platformRating = vendor.rating;

  return {
    googleRating: undefined,
    platformRating,
    customerRating: platformRating,
    reviewCount: vendor.reviewCount,
  };
}