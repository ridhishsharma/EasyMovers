/**
 * ============================================================
 * EasyMovers AI Platform
 * Vendor AI Models
 * ============================================================
 */

/**
 * Vendor AI Request
 */
export interface VendorAIRequest {
  referenceId: string;
  vendorId: string;
  leadId: string;
  customerCity: string;
  destinationCity: string;
  moveDistance: number;
  estimatedWeight: number;
  moveDate: string;
  isCorporateMove: boolean;
  isPremiumMove: boolean;
}

/**
 * Vendor Category
 */
export enum VendorCategory {
  HOUSEHOLD = "HOUSEHOLD",
  OFFICE = "OFFICE",
  VEHICLE = "VEHICLE",
  MULTI_SERVICE = "MULTI_SERVICE",
}

/**
 * Vendor Status
 */
export enum VendorStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING = "PENDING",
  SUSPENDED = "SUSPENDED",
}

/**
 * Vendor Profile
 */
export interface VendorProfile {
  vendorId: string;
  companyName: string;
  ownerName: string;
  registrationNumber?: string;
  gstNumber?: string;
  city: string;
  state: string;
  category: VendorCategory;
  status: VendorStatus;
  establishedYear?: number;
}
/**
 * ============================================================
 * Vendor Experience
 * ============================================================
 */
export interface VendorExperience {

  totalYears: number;

  totalBookings: number;

  successfulBookings: number;

  cancelledBookings: number;

  damagedClaims: number;

}
/**
 * ============================================================
 * Vendor Ratings
 * ============================================================
 */
export interface VendorRatings {
  googleRating?: number;
  platformRating?: number;
  customerRating?: number;
  reviewCount?: number;
}

/**
 * ============================================================
 * Vendor Capabilities
 * ============================================================
 */
export interface VendorCapabilities {
  householdService: boolean;
  officeService: boolean;
  vehicleService: boolean;

  insuranceAvailable: boolean;

  serviceCities: string[];

  totalLabours?: number;
  totalVehicles?: number;
}

/**
 * ============================================================
 * Vendor Score
 * ============================================================
 */
export interface VendorScore {
  experienceScore: number;
  ratingScore: number;
  capacityScore: number;
  capabilityScore: number;

  totalScore: number;
}

/**
 * ============================================================
 * Vendor Recommendation
 * ============================================================
 */

export enum VendorRecommendationLevel {
  PREFERRED = "PREFERRED",
  RECOMMENDED = "RECOMMENDED",
  REVIEW = "REVIEW",
  REJECT = "REJECT",
}

export interface VendorRecommendation {
  level: VendorRecommendationLevel;
  reason: string;
}