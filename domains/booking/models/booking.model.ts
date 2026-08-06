/**
 * ============================================================================
 * EasyMovers
 * Booking Domain Model
 * ============================================================================
 *
 * File:
 * domains/booking/models/booking.model.ts
 *
 * Business-domain contracts only.
 *
 * This file intentionally contains no Prisma, API-route, UI, repository,
 * service, mapper, or validation implementation.
 * ============================================================================
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
  OFFICE = "OFFICE",
  WAREHOUSE = "WAREHOUSE",
  SHOP = "SHOP",
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
  CALL_CENTER = "CALL_CENTER",
  WHATSAPP = "WHATSAPP",
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
export type BookingCode = string;
export type LeadId = string;
export type LeadReferenceId = string;
export type UserId = string;
export type VendorId = string;
export type QuotationId = string;

/**
 * Compatibility alias retained only for external code that still imports
 * CustomerId. New Booking code must use LeadId or UserId explicitly.
 */
export type CustomerId = UserId;

export interface BookingCustomerReference {
  leadId: LeadId;
  leadReferenceId: LeadReferenceId;
  userId?: UserId;
}

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
  digipin?: string;
  coordinates?: GeoCoordinates;
  propertyType: PropertyType;
  floorNumber?: number;
  totalFloors?: number;
  liftAvailability: LiftAvailability;
  parkingAccess: ParkingAccess;
  walkingDistanceMeters?: number;
  accessNotes?: string;
}

export interface BookingContact {
  fullName: string;
  mobileNumber: string;
  alternateMobileNumber?: string;
  email?: string;
  preferredContactMethod: ContactPreference;
  whatsappConsent?: boolean;
}

export interface BookingSchedule {
  preferredMoveDate: string;
  preferredTimeSlot?: string;
  flexibleDate: boolean;
  alternateMoveDate?: string;
  surveyRequired?: boolean;
  surveyPreferredDate?: string;
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

export interface VendorAssignment {
  vendorId: VendorId;
  vendorCode?: string;
  vendorName?: string;
  assignedAt?: string;
  assignedBy?: string;
}

export interface BookingQuotationSummary {
  totalQuotations: number;
  lowestQuote?: number;
  highestQuote?: number;
  selectedQuotationId?: QuotationId;
  selectedQuoteAmount?: number;
  quotationExpiryDate?: string;
}

export interface BookingPaymentSummary {
  totalAmount?: number;
  advanceAmount?: number;
  balanceAmount?: number;
  paidAmount?: number;
  paymentPending?: number;
}

export interface BookingTrackingSummary {
  currentStage?: string;
  expectedPickupTime?: string;
  expectedDeliveryTime?: string;
  liveTrackingEnabled: boolean;
}

export interface BookingAudit {
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  source: BookingSource;
  ipAddress?: string;
  userAgent?: string;
}

export interface BookingTimelineEvent {
  event: string;
  description: string;
  timestamp: string;
  performedBy?: string;
}

export interface BookingRequest {
  bookingId: BookingId;
  bookingCode: BookingCode;
  customer: BookingCustomerReference;
  serviceType: ServiceType;
  moveType: MoveType;
  status: BookingStatus;
  contact: BookingContact;
  pickupAddress: BookingAddress;
  dropAddress: BookingAddress;
  schedule: BookingSchedule;
  inventory: InventoryItem[];
  inventorySummary: InventorySummary;
  services: BookingServices;
  aiAnalysis?: AIInventoryAnalysis;
  requirements?: BookingRequirements;
  vendor?: VendorAssignment;
  quotation?: BookingQuotationSummary;
  payment?: BookingPaymentSummary;
  tracking?: BookingTrackingSummary;
  timeline?: BookingTimelineEvent[];
  audit: BookingAudit;
}

export interface BookingSearchCriteria {
  bookingCode?: string;
  leadId?: LeadId;
  leadReferenceId?: LeadReferenceId;
  userId?: UserId;
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

export interface BookingStatistics {
  totalBookings: number;
  draftBookings: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalQuotationReceived: number;
  confirmedBookings: number;
}

export interface CreateBookingInput {
  leadId: LeadId;
  leadReferenceId: LeadReferenceId;
  userId?: UserId;
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
  createdBy?: string;
}

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

export interface UpdateBookingStatusInput {
  bookingId: BookingId;
  status: BookingStatus;
  changedBy: string;
  reason?: string;
  remarks?: string;
}

export interface AssignVendorInput {
  bookingId: BookingId;
  vendorId: VendorId;
  vendorCode?: string;
  vendorName?: string;
  assignedBy: string;
}

export interface UnassignVendorInput {
  bookingId: BookingId;
  unassignedBy: string;
  reason: string;
}

export interface CancelBookingInput {
  bookingId: BookingId;
  cancelledBy: string;
  cancellationReason: string;
  customerRemarks?: string;
  internalRemarks?: string;
}

export interface BookingListItem {
  bookingId: BookingId;
  bookingCode: BookingCode;
  leadId: LeadId;
  leadReferenceId: LeadReferenceId;
  userId?: UserId;
  customerName: string;
  mobileNumber: string;
  serviceType: ServiceType;
  moveType: MoveType;
  status: BookingStatus;
  pickupCity: string;
  dropCity: string;
  preferredMoveDate: string;
  assignedVendorCode?: string;
  selectedQuotationId?: QuotationId;
  selectedQuoteAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookingPagination {
  page: number;
  pageSize: number;
  sortBy?: BookingSortField;
  sortDirection?: SortDirection;
}

export enum BookingSortField {
  CREATED_AT = "CREATED_AT",
  UPDATED_AT = "UPDATED_AT",
  MOVE_DATE = "MOVE_DATE",
  BOOKING_CODE = "BOOKING_CODE",
  STATUS = "STATUS",
}

export enum SortDirection {
  ASC = "ASC",
  DESC = "DESC",
}

export interface PaginatedBookingResult {
  items: BookingListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface BookingOperationResult {
  success: boolean;
  booking?: BookingRequest;
  message?: string;
  errorCode?: string;
}

export interface BookingRemovalResult {
  success: boolean;
  bookingId: BookingId;
  bookingCode?: BookingCode;
  archived: boolean;
  message?: string;
  errorCode?: string;
}