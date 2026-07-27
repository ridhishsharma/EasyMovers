import type {
  VendorCapabilities,
  VendorExperience,
  VendorRatings,
  VendorScore,
} from "@/ai/models/vendor.model";

export function buildVendorScore(
  experience: VendorExperience,
  ratings: VendorRatings,
  capabilities: VendorCapabilities,
): VendorScore {

  const experienceScore =
    Math.min(experience.totalYears * 2, 20);

  const ratingScore =
    ((ratings.platformRating ?? 0) / 5) * 40;

  const capacityScore =
    Math.min(
      ((capabilities.totalVehicles ?? 0) * 2) +
      (capabilities.totalLabours ?? 0),
      20,
    );

  const capabilityScore =
    [
      capabilities.householdService,
      capabilities.officeService,
      capabilities.vehicleService,
      capabilities.insuranceAvailable,
    ].filter(Boolean).length * 5;

  const totalScore =
    experienceScore +
    ratingScore +
    capacityScore +
    capabilityScore;

  return {
    experienceScore,
    ratingScore,
    capacityScore,
    capabilityScore,
    totalScore,
  };
}