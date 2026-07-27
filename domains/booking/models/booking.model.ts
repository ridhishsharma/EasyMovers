/**
 * EasyMovers Booking Domain Model
 * Business models only—no Prisma, API, UI, or validation logic.
 */


export enum BookingStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  UNDER_REVIEW = "UNDER_REVIEW",
  QUOTATION_PENDING = "QUOTATION_PENDING",
  QUOTATION_RECEIVED = "QUOTATION_RECEIVED",
  VENDOR_SELECTED = "VENDOR_SELECTED",
  CONFIRMED = "CONFIRMED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}
export enum ServiceType {
  HOUSEHOLD_SHIFTING = "HOUSEHOLD_SHIFTING",
  LOCAL_GOODS_TRANSPORT = "LOCAL_GOODS_TRANSPORT",
  OFFICE_RELOCATION = "OFFICE_RELOCATION",
  CORPORATE_RELOCATION = "CORPORATE_RELOCATION",
  LOGISTICS = "LOGISTICS",
}
export enum MoveType {
  WITHIN_CITY = "WITHIN_CITY",
  INTERCITY = "INTERCITY",
  INTERSTATE = "INTERSTATE",
}
export enum PropertyType {
  APARTMENT = "APARTMENT",
  INDEPENDENT_HOUSE = "INDEPENDENT_HOUSE",
  VILLA = "VILLA",
  HOSTEL = "HOSTEL",
  PG = "PG",
  OTHER = "OTHER",
}
export enum AddressType {
  PICKUP = "PICKUP",
  DROP = "DROP",
}
export enum LiftAvailability {
  AVAILABLE = "AVAILABLE",
  NOT_AVAILABLE = "NOT_AVAILABLE",
  NOT_REQUIRED = "NOT_REQUIRED",
  UNKNOWN = "UNKNOWN",
}
export enum ParkingAccess {
  DIRECT = "DIRECT",
  NEARBY = "NEARBY",
  RESTRICTED = "RESTRICTED",
  NOT_AVAILABLE = "NOT_AVAILABLE",
  UNKNOWN = "UNKNOWN",
}
export enum ContactPreference {
  PHONE = "PHONE",
  WHATSAPP = "WHATSAPP",
  EMAIL = "EMAIL",
}
export enum BookingSource {
  WEB = "WEB",
  ANDROID = "ANDROID",
  IOS = "IOS",
  ADMIN = "ADMIN",
  CORPORATE = "CORPORATE",
  API = "API",
}
export enum InventoryCategory {
  FURNITURE = "FURNITURE",
  APPLIANCE = "APPLIANCE",
  ELECTRONICS = "ELECTRONICS",
  KITCHEN = "KITCHEN",
  BOX = "BOX",
  VEHICLE = "VEHICLE",
  FRAGILE = "FRAGILE",
  PLANT = "PLANT",
  OTHER = "OTHER",
}
export enum SpecialHandlingType {
  FRAGILE = "FRAGILE",
  HEAVY = "HEAVY",
  OVERSIZED = "OVERSIZED",
  DISASSEMBLY_REQUIRED = "DISASSEMBLY_REQUIRED",
  INSTALLATION_REQUIRED = "INSTALLATION_REQUIRED",
  HIGH_VALUE = "HIGH_VALUE",
}
export type BookingId = string;
export type CustomerId = string;
export type VendorId = string;
export type BookingCode = string;
export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}
export interface BookingAddress {
  type: AddressType;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  locality?: string;
  city: string;
  district?: string;
  state: string;
  postalCode: string;
  country: string;
  propertyType: PropertyType;
  floorNumber?: number;
  totalFloors?: number;
  liftAvailability: LiftAvailability;
  parkingAccess: ParkingAccess;
  walkingDistanceMeters?: number;
  coordinates?: GeoCoordinates;
  accessNotes?: string;
}
export interface BookingSchedule {
  preferredMoveDate: string;
  preferredTimeSlot?: string;
  flexibleDate: boolean;
  alternateMoveDate?: string;
  surveyRequired?: boolean;
  surveyPreferredDate?: string;
}
export interface BookingContact {
  fullName: string;
  mobileNumber: string;
  alternateMobileNumber?: string;
  email?: string;
  preferredContactMethod: ContactPreference;
  whatsappConsent?: boolean;
}
export interface InventoryItem {
  itemId: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  description?: string;
  estimatedWeightKg?: number;
  estimatedVolumeCubicFeet?: number;
  handlingRequirements?: SpecialHandlingType[];
  isFragile?: boolean;
  isHighValue?: boolean;
  declaredValue?: number;
}
/**
 * Inventory Summary
 */
export interface InventorySummary {
  totalItems: number;
  estimatedWeightKg?: number;
  estimatedVolumeCubicFeet?: number;

  furnitureCount?: number;
  applianceCount?: number;
  electronicsCount?: number;
  fragileItemCount?: number;
  vehicleCount?: number;
  boxCount?: number;
}

/**
 * Optional Services
 */
export interface BookingServices {
  packingRequired: boolean;
  unpackingRequired: boolean;

  loadingRequired: boolean;
  unloadingRequired: boolean;

  furnitureDisassemblyRequired: boolean;
  furnitureAssemblyRequired: boolean;

  acDismantlingRequired: boolean;
  acInstallationRequired: boolean;

  tvDismantlingRequired: boolean;
  tvInstallationRequired: boolean;

  geyserDismantlingRequired: boolean;
  geyserInstallationRequired: boolean;

  washingMachineInstallationRequired: boolean;

  electricianRequired: boolean;
  carpenterRequired: boolean;

  storageRequired: boolean;
  insuranceRequired: boolean;
}

/**
 * AI Analysis
 */
export interface AIInventoryAnalysis {
  analyzed: boolean;

  confidenceScore?: number;

  estimatedWeightKg?: number;

  estimatedVolumeCubicFeet?: number;

  recommendedVehicle?: string;

  recommendedCrewSize?: number;

  packingDifficulty?: "LOW" | "MEDIUM" | "HIGH";

  estimatedPackingTimeHours?: number;

  remarks?: string[];
}

/**
 * Customer Requirements
 */
export interface BookingRequirements {
  specialInstructions?: string;

  preferredLanguage?: string;

  requiresSeniorHandling?: boolean;

  requiresWomenCrew?: boolean;

  requiresExpressDelivery?: boolean;

  requiresTemperatureSensitiveHandling?: boolean;

  petPresent?: boolean;

  childrenPresent?: boolean;
}

/**
 * Vendor Assignment
 */
export interface VendorAssignment {
  vendorId: VendorId;

  vendorCode?: string;

  vendorName?: string;

  assignedAt?: string;

  assignedBy?: string;
}

/**
 * Quotation Summary
 */
export interface BookingQuotationSummary {
  totalQuotations: number;

  lowestQuote?: number;

  highestQuote?: number;

  selectedQuoteAmount?: number;

  quotationExpiryDate?: string;
}

/**
 * Payment Summary
 */
export interface BookingPaymentSummary {
  totalAmount?: number;

  advanceAmount?: number;

  balanceAmount?: number;

  paidAmount?: number;

  paymentPending?: number;
}

/**
 * Tracking Summary
 */
export interface BookingTrackingSummary {
  currentStage?: string;

  expectedPickupTime?: string;

  expectedDeliveryTime?: string;

  liveTrackingEnabled: boolean;
}
/**
 * Booking Audit Information
 */
export interface BookingAudit {
  createdAt: string;
  updatedAt: string;

  createdBy?: string;
  updatedBy?: string;

  source: BookingSource;

  ipAddress?: string;
  userAgent?: string;
}

/**
 * Booking Timeline
 */
export interface BookingTimelineEvent {
  event: string;
  description: string;

  timestamp: string;

  performedBy?: string;
}

/**
 * Main Booking Model
 */
export interface BookingRequest {
  /**
   * System Identifiers
   */
  bookingId: BookingId;
  bookingCode: BookingCode;

  /**
   * Customer
   */
  customerId: CustomerId;

  /**
   * Booking Information
   */
  serviceType: ServiceType;
  moveType: MoveType;
  status: BookingStatus;

  /**
   * Contact
   */
  contact: BookingContact;

  /**
   * Addresses
   */
  pickupAddress: BookingAddress;
  dropAddress: BookingAddress;

  /**
   * Schedule
   */
  schedule: BookingSchedule;

  /**
   * Inventory
   */
  inventory: InventoryItem[];

  inventorySummary: InventorySummary;

  /**
   * Optional Services
   */
  services: BookingServices;

  /**
   * AI Suggestions
   */
  aiAnalysis?: AIInventoryAnalysis;

  /**
   * Customer Requirements
   */
  requirements?: BookingRequirements;

  /**
   * Vendor Information
   */
  vendor?: VendorAssignment;

  /**
   * Quotation
   */
  quotation?: BookingQuotationSummary;

  /**
   * Payment
   */
  payment?: BookingPaymentSummary;

  /**
   * Tracking
   */
  tracking?: BookingTrackingSummary;

  /**
   * Timeline
   */
  timeline?: BookingTimelineEvent[];

  /**
   * Audit
   */
  audit: BookingAudit;
}

/**
 * Booking Search Criteria
 */
export interface BookingSearchCriteria {
  bookingCode?: string;

  customerId?: CustomerId;

  vendorId?: VendorId;

  mobileNumber?: string;

  city?: string;

  state?: string;

  bookingStatus?: BookingStatus;

  serviceType?: ServiceType;

  moveType?: MoveType;

  moveDateFrom?: string;

  moveDateTo?: string;
}

/**
 * Booking Statistics
 */
export interface BookingStatistics {
  totalBookings: number;

  draftBookings: number;

  activeBookings: number;

  completedBookings: number;

  cancelledBookings: number;

  totalQuotationReceived: number;

  confirmedBookings: number;
}
/**
 * Input used when creating a new booking.
 *
 * System-generated fields such as bookingId, bookingCode, status,
 * audit information, vendor assignment and payment details are excluded.
 */
export interface CreateBookingInput {
  customerId: CustomerId;

  serviceType: ServiceType;
  moveType: MoveType;

  contact: BookingContact;

  pickupAddress: BookingAddress;
  dropAddress: BookingAddress;

  schedule: BookingSchedule;

  inventory: InventoryItem[];
  inventorySummary: InventorySummary;

  services: BookingServices;

  requirements?: BookingRequirements;

  source: BookingSource;
}

/**
 * Fields that may be changed while a booking is still editable.
 *
 * Booking identity, ownership and audit fields must not be modified
 * through this input.
 */
export interface UpdateBookingInput {
  contact?: BookingContact;

  pickupAddress?: BookingAddress;
  dropAddress?: BookingAddress;

  schedule?: BookingSchedule;

  inventory?: InventoryItem[];
  inventorySummary?: InventorySummary;

  services?: BookingServices;

  requirements?: BookingRequirements;
}

/**
 * Input used to change the booking workflow status.
 */
export interface UpdateBookingStatusInput {
  bookingId: BookingId;
  status: BookingStatus;

  changedBy: string;
  reason?: string;
  remarks?: string;
}

/**
 * Input used when assigning a vendor to a booking.
 */
export interface AssignVendorInput {
  bookingId: BookingId;

  vendorId: VendorId;
  vendorCode?: string;
  vendorName?: string;

  assignedBy: string;
}

/**
 * Input used when removing an assigned vendor.
 */
export interface UnassignVendorInput {
  bookingId: BookingId;

  unassignedBy: string;
  reason: string;
}

/**
 * Input used to cancel a booking.
 */
export interface CancelBookingInput {
  bookingId: BookingId;

  cancelledBy: string;
  cancellationReason: string;

  customerRemarks?: string;
  internalRemarks?: string;
}

/**
 * Lightweight booking representation for tables, search results
 * and dashboard lists.
 */
export interface BookingListItem {
  bookingId: BookingId;
  bookingCode: BookingCode;

  customerId: CustomerId;
  customerName: string;
  mobileNumber: string;

  serviceType: ServiceType;
  moveType: MoveType;
  status: BookingStatus;

  pickupCity: string;
  dropCity: string;

  preferredMoveDate: string;

  assignedVendorCode?: string;
  selectedQuoteAmount?: number;

  createdAt: string;
  updatedAt: string;
}

/**
 * Pagination request used for booking searches.
 */
export interface BookingPagination {
  page: number;
  pageSize: number;

  sortBy?: BookingSortField;
  sortDirection?: SortDirection;
}

/**
 * Supported booking sorting fields.
 */
export enum BookingSortField {
  CREATED_AT = "CREATED_AT",
  UPDATED_AT = "UPDATED_AT",
  MOVE_DATE = "MOVE_DATE",
  BOOKING_CODE = "BOOKING_CODE",
  STATUS = "STATUS",
}

/**
 * Generic sorting direction.
 */
export enum SortDirection {
  ASC = "ASC",
  DESC = "DESC",
}

/**
 * Paginated booking search result.
 */
export interface PaginatedBookingResult {
  items: BookingListItem[];

  page: number;
  pageSize: number;

  totalItems: number;
  totalPages: number;

  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Standard result returned by booking operations.
 */
export interface BookingOperationResult {
  success: boolean;

  booking?: BookingRequest;

  message?: string;
  errorCode?: string;
}

/**
 * Result returned when deleting or archiving a booking.
 */
export interface BookingRemovalResult {
  success: boolean;

  bookingId: BookingId;
  bookingCode?: BookingCode;

  archived: boolean;

  message?: string;
  errorCode?: string;
}