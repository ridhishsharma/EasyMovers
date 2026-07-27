export interface VendorEligibilityRequest {
  customerCity: string;
  destinationCity: string;
  estimatedWeight: number;
  isCorporateMove: boolean;
  isPremiumMove: boolean;
}

export interface VendorEligibilityCheck {
  vendorActive: boolean;
  originCitySupported: boolean;
  destinationCitySupported: boolean;
  insuranceAvailable: boolean;
  capacityAvailable: boolean;
}

export interface VendorEligibilityResult {
  eligible: boolean;
  checks: VendorEligibilityCheck;
  reasons: string[];
}