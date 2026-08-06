/**
 * ============================================================================
 * EasyMovers
 * Quotation Domain Model
 * ============================================================================
 *
 * File:
 * domains/quotation/models/quotation.model.ts
 *
 * Responsibilities:
 * - Define Quotation domain types and workflow states
 * - Define pricing, validity, commercial-detail and audit contracts
 * - Define create, update, selection, search and pagination inputs
 * - Separate internal Vendor-aware views from customer-safe views
 *
 * This file does not:
 * - Access Prisma
 * - Validate input
 * - Perform calculations
 * - Call repositories or external services
 * - Return HTTP responses
 * ============================================================================
 */

/* ============================================================================
 * Identifier aliases
 * ============================================================================
 */

export type QuotationId =
  string;

export type QuotationNumber =
  string;

export type QuotationReferenceId =
  string;

export type LeadId =
  string;

export type BookingId =
  string;

export type VendorId =
  string;

export type UserId =
  string;

/* ============================================================================
 * Core enums
 * ============================================================================
 */

/**
 * Must remain synchronized with the Prisma QuotationStatus enum.
 */
export enum QuotationStatus {
  DRAFT =
    "DRAFT",

  SUBMITTED =
    "SUBMITTED",

  REVISED =
    "REVISED",

  SHORTLISTED =
    "SHORTLISTED",

  ACCEPTED =
    "ACCEPTED",

  REJECTED =
    "REJECTED",

  EXPIRED =
    "EXPIRED",

  WITHDRAWN =
    "WITHDRAWN",

  CANCELLED =
    "CANCELLED",
}

/**
 * Supported quotation currency codes.
 *
 * EasyMovers currently operates in INR, while this contract remains
 * future-ready for additional currencies.
 */
export enum QuotationCurrency {
  INR =
    "INR",
}

/**
 * Supported commercial charge categories.
 */
export enum QuotationChargeType {
  TRANSPORTATION =
    "TRANSPORTATION",

  PACKING =
    "PACKING",

  UNPACKING =
    "UNPACKING",

  LABOUR =
    "LABOUR",

  INSURANCE =
    "INSURANCE",

  TAX =
    "TAX",

  DISCOUNT =
    "DISCOUNT",

  OTHER =
    "OTHER",
}

/**
 * Identifies the actor responsible for a quotation action.
 */
export enum QuotationActorType {
  VENDOR =
    "VENDOR",

  ADMIN =
    "ADMIN",

  USER =
    "USER",

  SYSTEM =
    "SYSTEM",
}

/* ============================================================================
 * Shared value contracts
 * ============================================================================
 */

/**
 * Monetary value used by the Quotation domain.
 *
 * Amounts are represented as JavaScript numbers in the domain layer.
 * Prisma mappers must convert them to and from Decimal.
 */
export interface QuotationMoney {
  amount: number;

  currency:
    QuotationCurrency;
}

/**
 * Optional tax configuration used to explain the persisted tax amount.
 */
export interface QuotationTaxDetails {
  taxName?: string;

  taxRatePercent?: number;

  taxableAmount?: number;

  taxAmount: number;
}

/**
 * Optional discount configuration used to explain the persisted discount.
 */
export interface QuotationDiscountDetails {
  discountName?: string;

  discountType?:
    | "FIXED"
    | "PERCENTAGE";

  discountValue?: number;

  discountAmount: number;

  reason?: string;
}

/**
 * One detailed quotation charge.
 */
export interface QuotationChargeItem {
  chargeType:
    QuotationChargeType;

  label: string;

  description?: string;

  quantity?: number;

  unit?: string;

  unitRate?: number;

  amount: number;

  taxable?: boolean;
}

/**
 * Structured pricing data stored in pricingBreakdown JSON.
 */
export interface QuotationPricingBreakdown {
  items:
    QuotationChargeItem[];

  subtotalAmount:
    number;

  discount?:
    QuotationDiscountDetails;

  tax?:
    QuotationTaxDetails;

  totalAmount:
    number;

  currency:
    QuotationCurrency;
}

/**
 * Commercial terms stored in termsJson.
 */
export interface QuotationTerms {
  paymentTerms?: string[];

  cancellationTerms?: string[];

  liabilityTerms?: string[];

  insuranceTerms?: string[];

  validityTerms?: string[];

  additionalTerms?: string[];
}

/**
 * Items or services included in the quotation.
 */
export interface QuotationInclusions {
  items:
    string[];
}

/**
 * Items or services excluded from the quotation.
 */
export interface QuotationExclusions {
  items:
    string[];
}

/**
 * Timeline/audit event for quotation workflow operations.
 *
 * This is a domain contract for future event persistence and response
 * composition. The current Prisma model stores top-level timestamps.
 */
export interface QuotationTimelineEvent {
  event: string;

  description: string;

  timestamp: string;

  actorId?: string;

  actorType?:
    QuotationActorType;
}

/**
 * Quotation audit metadata.
 */
export interface QuotationAudit {
  createdAt: string;

  updatedAt: string;

  createdBy?: string;

  updatedBy?: string;
}

/* ============================================================================
 * Reference snapshots
 * ============================================================================
 */

/**
 * Minimal Lead reference required by a Quotation.
 */
export interface QuotationLeadReference {
  leadId:
    LeadId;

  leadReferenceId:
    string;
}

/**
 * Minimal Booking reference required by a Quotation.
 */
export interface QuotationBookingReference {
  bookingId:
    BookingId;

  bookingNumber?:
    string;
}

/**
 * Internal Vendor reference.
 *
 * Vendor identity must not be exposed through customer-safe responses.
 */
export interface QuotationVendorReference {
  vendorId:
    VendorId;

  vendorCode?:
    string;

  companyName?:
    string;
}

/**
 * Optional User reference for the actor who created or submitted
 * the quotation.
 */
export interface QuotationUserReference {
  userId:
    UserId;

  displayName?:
    string;
}

/* ============================================================================
 * Pricing contracts
 * ============================================================================
 */

/**
 * Persisted quotation cost components.
 *
 * These fields correspond directly to the current Prisma Quotation model.
 */
export interface QuotationCostSummary {
  transportationCost:
    number;

  packingCost:
    number;

  unpackingCost:
    number;

  labourCost:
    number;

  insuranceCost:
    number;

  otherCost:
    number;

  discountAmount:
    number;

  taxAmount:
    number;

  totalAmount:
    number;

  currency:
    QuotationCurrency;
}

/**
 * Move dates and transit information proposed by the Vendor.
 */
export interface QuotationSchedule {
  pickupDate?: string;

  deliveryDate?: string;

  transitDays?: number;
}

/**
 * Commercial information attached to a quotation.
 */
export interface QuotationCommercialDetails {
  pricingBreakdown?:
    QuotationPricingBreakdown;

  terms?:
    QuotationTerms;

  inclusions?:
    QuotationInclusions;

  exclusions?:
    QuotationExclusions;

  remarks?: string;

  internalRemarks?: string;
}

/* ============================================================================
 * Main Quotation aggregate
 * ============================================================================
 */

/**
 * Complete internal Quotation aggregate.
 *
 * This model may be used by admin, repository and service layers.
 * It contains internal Vendor identity and internal remarks.
 */
export interface Quotation {
  quotationId:
    QuotationId;

  quotationNumber:
    QuotationNumber;

  referenceId:
    QuotationReferenceId;

  lead:
    QuotationLeadReference;

  booking:
    QuotationBookingReference;

  vendor:
    QuotationVendorReference;

  submittedByUser?:
    QuotationUserReference;

  costs:
    QuotationCostSummary;

  schedule:
    QuotationSchedule;

  status:
    QuotationStatus;

  validUntil?: string;

  commercialDetails:
    QuotationCommercialDetails;

  /**
   * True when this quotation is selected by its Booking.
   */
  selectedForBooking:
    boolean;

  audit:
    QuotationAudit;
}

/* ============================================================================
 * Customer-safe response contracts
 * ============================================================================
 */

/**
 * Customer-facing quotation.
 *
 * Vendor ID, Vendor code, company name and internal remarks are deliberately
 * excluded to support EasyMovers Vendor-identity masking requirements.
 */
export interface CustomerSafeQuotation {
  quotationId:
    QuotationId;

  quotationNumber:
    QuotationNumber;

  referenceId:
    QuotationReferenceId;

  bookingId:
    BookingId;

  costs:
    QuotationCostSummary;

  schedule:
    QuotationSchedule;

  status:
    QuotationStatus;

  validUntil?: string;

  pricingBreakdown?:
    QuotationPricingBreakdown;

  terms?:
    QuotationTerms;

  inclusions?:
    QuotationInclusions;

  exclusions?:
    QuotationExclusions;

  remarks?: string;

  selectedForBooking:
    boolean;

  createdAt:
    string;

  updatedAt:
    string;
}

/**
 * Lightweight quotation summary for Booking, customer, Vendor and admin lists.
 */
export interface QuotationListItem {
  quotationId:
    QuotationId;

  quotationNumber:
    QuotationNumber;

  referenceId:
    QuotationReferenceId;

  leadId:
    LeadId;

  bookingId:
    BookingId;

  vendorId?:
    VendorId;

  totalAmount:
    number;

  currency:
    QuotationCurrency;

  status:
    QuotationStatus;

  validUntil?: string;

  pickupDate?: string;

  deliveryDate?: string;

  transitDays?: number;

  selectedForBooking:
    boolean;

  createdAt:
    string;

  updatedAt:
    string;
}

/* ============================================================================
 * Create and update inputs
 * ============================================================================
 */

/**
 * Creates one Vendor quotation for an existing Lead and Booking.
 *
 * The service layer must confirm:
 * - Lead exists
 * - Booking exists
 * - Vendor exists
 * - Booking belongs to the supplied Lead
 * - Vendor is eligible to quote
 */
export interface CreateQuotationInput {
  leadId:
    LeadId;

  bookingId:
    BookingId;

  vendorId:
    VendorId;

  userId?: UserId;

  transportationCost?:
    number;

  packingCost?:
    number;

  unpackingCost?:
    number;

  labourCost?:
    number;

  insuranceCost?:
    number;

  otherCost?:
    number;

  discountAmount?:
    number;

  taxAmount?:
    number;

  /**
   * May be supplied by trusted callers.
   * Otherwise, the service calculates it from components.
   */
  totalAmount?:
    number;

  currency?:
    QuotationCurrency;

  pickupDate?: string;

  deliveryDate?: string;

  transitDays?: number;

  status?:
    QuotationStatus;

  validUntil?: string;

  pricingBreakdown?:
    QuotationPricingBreakdown;

  terms?:
    QuotationTerms;

  inclusions?:
    QuotationInclusions;

  exclusions?:
    QuotationExclusions;

  remarks?: string;

  internalRemarks?: string;

  createdBy?: string;
}

/**
 * Editable quotation fields.
 *
 * Identity and relation fields are intentionally excluded.
 */
export interface UpdateQuotationInput {
  transportationCost?:
    number;

  packingCost?:
    number;

  unpackingCost?:
    number;

  labourCost?:
    number;

  insuranceCost?:
    number;

  otherCost?:
    number;

  discountAmount?:
    number;

  taxAmount?:
    number;

  totalAmount?:
    number;

  currency?:
    QuotationCurrency;

  pickupDate?:
    string | null;

  deliveryDate?:
    string | null;

  transitDays?:
    number | null;

  validUntil?:
    string | null;

  pricingBreakdown?:
    QuotationPricingBreakdown | null;

  terms?:
    QuotationTerms | null;

  inclusions?:
    QuotationInclusions | null;

  exclusions?:
    QuotationExclusions | null;

  remarks?:
    string | null;

  internalRemarks?:
    string | null;

  updatedBy:
    string;
}

/**
 * Changes quotation workflow status.
 */
export interface UpdateQuotationStatusInput {
  quotationId:
    QuotationId;

  status:
    QuotationStatus;

  changedBy:
    string;

  reason?: string;
}

/**
 * Selects one quotation for its Booking.
 */
export interface SelectQuotationInput {
  bookingId:
    BookingId;

  quotationId:
    QuotationId;

  selectedBy:
    string;

  remarks?: string;
}

/**
 * Clears the currently selected quotation from a Booking.
 */
export interface UnselectQuotationInput {
  bookingId:
    BookingId;

  unselectedBy:
    string;

  reason: string;
}

/**
 * Withdraws a quotation by the Vendor or an authorized actor.
 */
export interface WithdrawQuotationInput {
  quotationId:
    QuotationId;

  withdrawnBy:
    string;

  reason: string;
}

/**
 * Rejects a quotation for a Booking.
 */
export interface RejectQuotationInput {
  quotationId:
    QuotationId;

  rejectedBy:
    string;

  reason?: string;
}

/* ============================================================================
 * Search, sort and pagination
 * ============================================================================
 */

export type QuotationSortField =
  | "createdAt"
  | "updatedAt"
  | "totalAmount"
  | "validUntil"
  | "pickupDate"
  | "deliveryDate"
  | "status";

export type QuotationSortDirection =
  | "asc"
  | "desc";

export interface QuotationSort {
  field:
    QuotationSortField;

  direction:
    QuotationSortDirection;
}

export interface QuotationSearchCriteria {
  quotationId?:
    QuotationId;

  quotationNumber?:
    QuotationNumber;

  referenceId?:
    QuotationReferenceId;

  leadId?:
    LeadId;

  bookingId?:
    BookingId;

  vendorId?:
    VendorId;

  userId?:
    UserId;

  status?:
    QuotationStatus;

  statuses?:
    QuotationStatus[];

  selectedForBooking?:
    boolean;

  minimumAmount?:
    number;

  maximumAmount?:
    number;

  validFrom?:
    string;

  validUntil?:
    string;

  pickupDateFrom?:
    string;

  pickupDateTo?:
    string;

  createdFrom?:
    string;

  createdUntil?:
    string;

  search?: string;
}

export interface QuotationPaginationInput {
  page:
    number;

  pageSize:
    number;
}

export interface QuotationPaginationMetadata {
  page:
    number;

  pageSize:
    number;

  totalItems:
    number;

  totalPages:
    number;

  hasNextPage:
    boolean;

  hasPreviousPage:
    boolean;
}

export interface QuotationListQuery {
  criteria?:
    QuotationSearchCriteria;

  pagination?:
    QuotationPaginationInput;

  sort?:
    QuotationSort;
}

export interface PaginatedQuotationResult<T = QuotationListItem> {
  items:
    T[];

  pagination:
    QuotationPaginationMetadata;
}

/* ============================================================================
 * Comparison and selection contracts
 * ============================================================================
 */

/**
 * Customer-safe comparison row.
 */
export interface QuotationComparisonItem {
  quotationId:
    QuotationId;

  quotationNumber:
    QuotationNumber;

  totalAmount:
    number;

  currency:
    QuotationCurrency;

  pickupDate?: string;

  deliveryDate?: string;

  transitDays?: number;

  validUntil?: string;

  inclusions?:
    string[];

  exclusions?:
    string[];

  selected:
    boolean;
}

/**
 * Comparison result for one Booking.
 */
export interface BookingQuotationComparison {
  bookingId:
    BookingId;

  totalQuotations:
    number;

  lowestAmount?:
    number;

  highestAmount?:
    number;

  selectedQuotationId?:
    QuotationId;

  quotations:
    QuotationComparisonItem[];
}

/* ============================================================================
 * Statistics
 * ============================================================================
 */

export interface QuotationStatistics {
  totalQuotations:
    number;

  draftQuotations:
    number;

  submittedQuotations:
    number;

  shortlistedQuotations:
    number;

  acceptedQuotations:
    number;

  rejectedQuotations:
    number;

  expiredQuotations:
    number;

  withdrawnQuotations:
    number;

  cancelledQuotations:
    number;

  averageQuotationAmount?:
    number;

  lowestQuotationAmount?:
    number;

  highestQuotationAmount?:
    number;
}

/* ============================================================================
 * Domain utility types
 * ============================================================================
 */

/**
 * Fields generated by the service or repository while creating a quotation.
 */
export interface GeneratedQuotationIdentity {
  quotationId:
    QuotationId;

  quotationNumber:
    QuotationNumber;

  referenceId:
    QuotationReferenceId;
}

/**
 * Input for calculating the quotation total.
 */
export interface CalculateQuotationTotalInput {
  transportationCost?:
    number;

  packingCost?:
    number;

  unpackingCost?:
    number;

  labourCost?:
    number;

  insuranceCost?:
    number;

  otherCost?:
    number;

  discountAmount?:
    number;

  taxAmount?:
    number;
}

/**
 * Result of quotation total calculation.
 */
export interface CalculateQuotationTotalResult
  extends QuotationCostSummary {
  subtotalAmount:
    number;
}

/**
 * Determines whether a status is terminal.
 */
export function isTerminalQuotationStatus(
  status:
    QuotationStatus
): boolean {
  return [
    QuotationStatus.ACCEPTED,
    QuotationStatus.REJECTED,
    QuotationStatus.EXPIRED,
    QuotationStatus.WITHDRAWN,
    QuotationStatus.CANCELLED,
  ].includes(
    status
  );
}

/**
 * Determines whether a quotation remains commercially active.
 */
export function isActiveQuotationStatus(
  status:
    QuotationStatus
): boolean {
  return [
    QuotationStatus.SUBMITTED,
    QuotationStatus.REVISED,
    QuotationStatus.SHORTLISTED,
  ].includes(
    status
  );
}

/**
 * Determines whether a quotation may still be edited.
 */
export function isEditableQuotationStatus(
  status:
    QuotationStatus
): boolean {
  return [
    QuotationStatus.DRAFT,
    QuotationStatus.SUBMITTED,
    QuotationStatus.REVISED,
  ].includes(
    status
  );
}