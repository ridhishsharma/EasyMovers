import { VendorRecommendationLevel } from "@/ai/models/vendor.model";

import type {
  VendorRecommendation,
  VendorScore,
} from "@/ai/models/vendor.model";

export function buildVendorRecommendation(
  score: VendorScore,
): VendorRecommendation {

  if (score.totalScore >= 80) {
    return {
      level: VendorRecommendationLevel.PREFERRED,
      reason: "Excellent overall vendor profile.",
    };
  }

  if (score.totalScore >= 65) {
    return {
      level: VendorRecommendationLevel.RECOMMENDED,
      reason: "Reliable vendor with good performance.",
    };
  }

  if (score.totalScore >= 45) {
    return {
      level: VendorRecommendationLevel.REVIEW,
      reason: "Needs manual review before assignment.",
    };
  }

  return {
    level: VendorRecommendationLevel.REJECT,
    reason: "Vendor score is below the minimum threshold.",
  };
}