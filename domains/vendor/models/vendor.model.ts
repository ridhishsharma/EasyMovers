/**
 * ============================================================
 * EasyMovers
 * Vendor Domain Models
 * ============================================================
 *
 * Purpose
 * -------
 * Defines the operational Vendor domain.
 *
 * This file contains business data only.
 * AI ranking, prediction, fraud scoring, and recommendations
 * must remain inside the separate AI Vendor module.
 * ============================================================
 */

/**
 * Vendor account status.
 */
export enum VendorStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
  REJECTED = "REJECTED",
}

/**
 * Vendor onboarding and verification status.
 */
export enum VendorVerificationStatus {
  NOT_SUBMITTED = "NOT_SUBMITTED",
  PENDING = "PENDING",
  UNDER_REVIEW = "UNDER_REVIEW",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
}

/**
 * Vendor business coverage category.
 */
export enum VendorCategory {
  LOCAL = "LOCAL",
  REGIONAL = "REGIONAL",
  NATIONAL = "NATIONAL",
}
export enum VendorBusinessType {
  UNSPECIFIED = "UNSPECIFIED",
  INDIVIDUAL_OWNER_DRIVER = "INDIVIDUAL_OWNER_DRIVER",
  SOLE_PROPRIETOR = "SOLE_PROPRIETOR",
  REGISTERED_BUSINESS = "REGISTERED_BUSINESS",
}
/**
 * Vendor service coverage.
 */
export enum VendorServiceScope {
  WITHIN_CITY = "WITHIN_CITY",
  WITHIN_STATE = "WITHIN_STATE",
  PAN_INDIA = "PAN_INDIA",
}

/**
 * Supported customer movement categories.
 */
export enum VendorServiceType {
  HOUSEHOLD_RELOCATION = "HOUSEHOLD_RELOCATION",
  OFFICE_RELOCATION = "OFFICE_RELOCATION",
  CORPORATE_RELOCATION = "CORPORATE_RELOCATION",
  VEHICLE_TRANSPORT = "VEHICLE_TRANSPORT",
  COMMERCIAL_GOODS = "COMMERCIAL_GOODS",
  WAREHOUSING = "WAREHOUSING",
  PACKING_ONLY = "PACKING_ONLY",
  LOADING_UNLOADING = "LOADING_UNLOADING",
  INSTALLATION_UNINSTALLATION =
    "INSTALLATION_UNINSTALLATION",
}

/**
 * Vendor document type.
 */
export enum VendorDocumentType {
  GST_CERTIFICATE = "GST_CERTIFICATE",
  PAN_CARD = "PAN_CARD",
  AADHAAR_CARD = "AADHAAR_CARD",
  BUSINESS_REGISTRATION =
    "BUSINESS_REGISTRATION",
  SHOP_ESTABLISHMENT =
    "SHOP_ESTABLISHMENT",
  POLICE_VERIFICATION =
    "POLICE_VERIFICATION",
  INSURANCE_POLICY = "INSURANCE_POLICY",
  CANCELLED_CHEQUE = "CANCELLED_CHEQUE",
  BANK_STATEMENT = "BANK_STATEMENT",
  VEHICLE_REGISTRATION =
    "VEHICLE_REGISTRATION",
  DRIVING_LICENSE = "DRIVING_LICENSE",
  OTHER = "OTHER",
}

/**
 * Document review status.
 */
export enum VendorDocumentStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
}

/**
 * Vendor vehicle type.
 */
export enum VendorVehicleType {
  TWO_WHEELER = "TWO_WHEELER",
  THREE_WHEELER = "THREE_WHEELER",
  PICKUP_TRUCK = "PICKUP_TRUCK",
  MINI_TRUCK = "MINI_TRUCK",
  CONTAINER_TRUCK = "CONTAINER_TRUCK",
  LARGE_TRUCK = "LARGE_TRUCK",
  TRAILER = "TRAILER",
  OTHER = "OTHER",
}

/**
 * Vehicle operational status.
 */
export enum VendorVehicleStatus {
  AVAILABLE = "AVAILABLE",
  ASSIGNED = "ASSIGNED",
  MAINTENANCE = "MAINTENANCE",
  INACTIVE = "INACTIVE",
}

/**
 * Vendor bank account type.
 */
export enum VendorBankAccountType {
  SAVINGS = "SAVINGS",
  CURRENT = "CURRENT",
}

/**
 * Pricing calculation method.
 */
export enum VendorPricingType {
  FIXED = "FIXED",
  PER_KILOMETRE = "PER_KILOMETRE",
  PER_ITEM = "PER_ITEM",
  PER_KILOGRAM = "PER_KILOGRAM",
  CUSTOM_QUOTATION = "CUSTOM_QUOTATION",
}

/**
 * Physical or registered address.
 */
export interface VendorAddress {
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  district?: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Primary vendor contact details.
 */
export interface VendorContact {
  primaryPhone: string;
  alternatePhone?: string;
  landline?: string;
  email: string;
  website?: string;
  whatsappNumber?: string;
}

/**
 * Vendor business information.
 */
export interface VendorBusinessDetails {
  companyName: string;
  legalName?: string;
  tradeName?: string;
  registrationNumber?: string;
  gstNumber?: string;
  panNumber?: string;
  establishedYear?: number;
  category: VendorCategory;
  businessType?: VendorBusinessType;
}

/**
 * Vendor owner or authorised representative.
 */
export interface VendorOwnerDetails {
  fullName: string;
  fatherName?: string;
  dateOfBirth?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  phone: string;
  email?: string;
}

/**
 * Vendor compliance information.
 */
export interface VendorCompliance {
  gstVerified: boolean;
  panVerified: boolean;
  aadhaarVerified: boolean;
  businessRegistrationVerified: boolean;
  policeVerificationCompleted: boolean;
  insuranceAvailable: boolean;
  insuranceExpiryDate?: Date;
  lastVerifiedAt?: Date;
  verifiedBy?: string;
}

/**
 * Vendor bank details.
 *
 * Store sensitive bank details securely and expose only masked
 * values through public API responses.
 */
export interface VendorBankDetails {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  accountType: VendorBankAccountType;
  ifscCode: string;
  branchName?: string;
  upiId?: string;
  verified: boolean;
  verifiedAt?: Date;
}

/**
 * Vendor service area.
 */
export interface VendorServiceArea {
  id: string;
  scope: VendorServiceScope;
  originCity?: string;
  originState?: string;
  destinationCity?: string;
  destinationState?: string;
  serviceablePostalCodes?: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Vendor service offering.
 */
export interface VendorService {
  id: string;
  serviceType: VendorServiceType;
  title: string;
  description?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Vendor pricing configuration.
 */
export interface VendorPricing {
  id: string;
  serviceType: VendorServiceType;
  pricingType: VendorPricingType;
  basePrice?: number;
  minimumPrice?: number;
  pricePerKilometre?: number;
  pricePerKilogram?: number;
  pricePerItem?: number;
  labourCharge?: number;
  packingCharge?: number;
  loadingCharge?: number;
  unloadingCharge?: number;
  insuranceChargePercentage?: number;
  taxPercentage?: number;
  currency: string;
  active: boolean;
  effectiveFrom?: Date;
  effectiveUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Vendor vehicle or fleet record.
 */
export interface VendorVehicle {
  id: string;
  registrationNumber: string;
  vehicleType: VendorVehicleType;
  manufacturer?: string;
  model?: string;
  manufacturingYear?: number;
  capacityInKilograms?: number;
  capacityInCubicFeet?: number;
  insuranceNumber?: string;
  insuranceExpiryDate?: Date;
  permitNumber?: string;
  permitExpiryDate?: Date;
  pollutionCertificateExpiryDate?: Date;
  status: VendorVehicleStatus;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Uploaded vendor document.
 */
export interface VendorDocument {
  id: string;
  documentType: VendorDocumentType;
  documentNumber?: string;
  documentUrl: string;
  fileName?: string;
  mimeType?: string;
  status: VendorDocumentStatus;
  issuedAt?: Date;
  expiresAt?: Date;
  rejectionReason?: string;
  verifiedAt?: Date;
  verifiedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Aggregated operational performance.
 */
export interface VendorPerformance {
  totalBookings: number;
  acceptedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  rejectedBookings: number;
  delayedBookings: number;
  damagedClaims: number;
  complaintCount: number;
  averageCustomerRating: number;
  totalReviews: number;
  averageResponseMinutes: number;
  onTimeDeliveryPercentage: number;
  completionPercentage: number;
  lastBookingAt?: Date;
}

/**
 * Main Vendor aggregate.
 */
export interface Vendor {
  id: string;
  vendorCode: string;

  business: VendorBusinessDetails;
  owner: VendorOwnerDetails;
  contact: VendorContact;

  registeredAddress: VendorAddress;
  operationalAddress?: VendorAddress;

  status: VendorStatus;
  verificationStatus: VendorVerificationStatus;

  compliance: VendorCompliance;
  bankDetails?: VendorBankDetails;

  serviceAreas: VendorServiceArea[];
  services: VendorService[];
  pricing: VendorPricing[];
  fleet: VendorVehicle[];
  documents: VendorDocument[];

  performance: VendorPerformance;

  onboardingCompleted: boolean;
  profileCompletionPercentage: number;

  rejectionReason?: string;
  suspensionReason?: string;

  approvedAt?: Date;
  approvedBy?: string;
  suspendedAt?: Date;
  suspendedBy?: string;

  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Input used to register a vendor.
 */
export interface CreateVendorInput {
  business: VendorBusinessDetails;
  owner: VendorOwnerDetails;
  contact: VendorContact;
  registeredAddress: VendorAddress;
  operationalAddress?: VendorAddress;
  serviceScopes?: VendorServiceScope[];
  serviceTypes?: VendorServiceType[];
  createdBy?: string;
}

/**
 * Input used to update the vendor profile.
 */
export interface UpdateVendorInput {
  business?: Partial<VendorBusinessDetails>;
  owner?: Partial<VendorOwnerDetails>;
  contact?: Partial<VendorContact>;
  registeredAddress?: Partial<VendorAddress>;
  operationalAddress?: Partial<VendorAddress>;
  updatedBy: string;
}

/**
 * Input used to change vendor status.
 */
export interface ChangeVendorStatusInput {
  status: VendorStatus;
  reason?: string;
  updatedBy: string;
}

/**
 * Input used to update vendor verification.
 */
export interface UpdateVendorVerificationInput {
  verificationStatus: VendorVerificationStatus;
  reason?: string;
  verifiedBy: string;
}

/**
 * Input used to add a service area.
 */
export interface AddVendorServiceAreaInput {
  scope: VendorServiceScope;
  originCity?: string;
  originState?: string;
  destinationCity?: string;
  destinationState?: string;
  serviceablePostalCodes?: string[];
  active?: boolean;
  updatedBy: string;
}

/**
 * Input used to update a service area.
 */
export interface UpdateVendorServiceAreaInput {
  scope?: VendorServiceScope;
  originCity?: string;
  originState?: string;
  destinationCity?: string;
  destinationState?: string;
  serviceablePostalCodes?: string[];
  active?: boolean;
  updatedBy: string;
}

/**
 * Input used to add or update a vendor service.
 */
export interface UpsertVendorServiceInput {
  serviceType: VendorServiceType;
  title: string;
  description?: string;
  active?: boolean;
  updatedBy: string;
}

/**
 * Input used to add vendor pricing.
 */
export interface AddVendorPricingInput {
  serviceType: VendorServiceType;
  pricingType: VendorPricingType;
  basePrice?: number;
  minimumPrice?: number;
  pricePerKilometre?: number;
  pricePerKilogram?: number;
  pricePerItem?: number;
  labourCharge?: number;
  packingCharge?: number;
  loadingCharge?: number;
  unloadingCharge?: number;
  insuranceChargePercentage?: number;
  taxPercentage?: number;
  currency?: string;
  active?: boolean;
  effectiveFrom?: Date;
  effectiveUntil?: Date;
  updatedBy: string;
}

/**
 * Input used to add a vehicle.
 */
export interface AddVendorVehicleInput {
  registrationNumber: string;
  vehicleType: VendorVehicleType;
  manufacturer?: string;
  model?: string;
  manufacturingYear?: number;
  capacityInKilograms?: number;
  capacityInCubicFeet?: number;
  insuranceNumber?: string;
  insuranceExpiryDate?: Date;
  permitNumber?: string;
  permitExpiryDate?: Date;
  pollutionCertificateExpiryDate?: Date;
  status?: VendorVehicleStatus;
  active?: boolean;
  updatedBy: string;
}

/**
 * Input used to upload document metadata.
 */
export interface AddVendorDocumentInput {
  documentType: VendorDocumentType;
  documentNumber?: string;
  documentUrl: string;
  fileName?: string;
  mimeType?: string;
  issuedAt?: Date;
  expiresAt?: Date;
  updatedBy: string;
}

/**
 * Input used to review a document.
 */
export interface ReviewVendorDocumentInput {
  status: VendorDocumentStatus;
  rejectionReason?: string;
  verifiedBy: string;
}

/**
 * Input used to update vendor bank details.
 */
export interface UpdateVendorBankDetailsInput {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  accountType: VendorBankAccountType;
  ifscCode: string;
  branchName?: string;
  upiId?: string;
  updatedBy: string;
}

/**
 * Vendor search and filtering options.
 */
export interface VendorSearchFilter {
  query?: string;
  vendorCode?: string;
  companyName?: string;
  city?: string;
  state?: string;
  category?: VendorCategory;
  status?: VendorStatus;
  verificationStatus?: VendorVerificationStatus;
  serviceScope?: VendorServiceScope;
  serviceType?: VendorServiceType;
  minimumRating?: number;
  onboardingCompleted?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Paginated vendor search response.
 */
export interface VendorSearchResult {
  vendors: Vendor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Vendor dashboard statistics.
 */
export interface VendorStatistics {
  totalVendors: number;
  pendingVendors: number;
  activeVendors: number;
  inactiveVendors: number;
  suspendedVendors: number;
  rejectedVendors: number;
  verifiedVendors: number;
  pendingVerificationVendors: number;
  onboardingCompletedVendors: number;
  averageCustomerRating: number;
}

/**
 * Common result returned by vendor write operations.
 */
export interface VendorOperationResult {
  success: boolean;
  message: string;
  vendor?: Vendor;
  errorCode?: string;
}