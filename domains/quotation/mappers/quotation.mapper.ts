/**
 * ============================================================================
 * EasyMovers
 * Quotation Mapper
 * Part A
 * ============================================================================
 *
 * File:
 * domains/quotation/mappers/quotation.mapper.ts
 *
 * Prisma model compatibility:
 *
 * Quotation
 * - id
 * - quotationNumber
 * - referenceId
 * - leadId / lead
 * - bookingId / booking
 * - vendorId / vendor
 * - userId / user
 * - Decimal pricing fields
 * - pickupDate / deliveryDate / transitDays
 * - status
 * - validUntil
 * - pricingBreakdown
 * - termsJson
 * - inclusionsJson
 * - exclusionsJson
 * - remarks
 * - internalRemarks
 * - selectedForBooking
 * - payments
 * - createdAt / updatedAt
 *
 * Responsibilities of Part A:
 * - Define mapper persistence contracts
 * - Decimal -> number conversion
 * - Date conversion
 * - JSON conversion helpers
 * - Status / currency conversion
 * - Relation snapshot mapping
 * - Cost / schedule / commercial-detail mapping
 * - Selection-state mapping
 *
 * IMPORTANT:
 * - No Prisma database calls
 * - No business validation
 * - No repository logic
 * - No HTTP logic
 * ============================================================================
 */

import {
  QuotationCurrency,
  QuotationStatus,
} from "../models/quotation.model";

import type {
  BookingId,
  CreateQuotationInput,
  CustomerSafeQuotation,
  LeadId,
  Quotation,
  QuotationAudit,
  QuotationBookingReference,
  QuotationCommercialDetails,
  QuotationCostSummary,
  QuotationExclusions,
  QuotationId,
  QuotationInclusions,
  QuotationLeadReference,
  QuotationListItem,
  QuotationPricingBreakdown,
  QuotationSchedule,
  QuotationTerms,
  QuotationUserReference,
  QuotationVendorReference,
  UpdateQuotationInput,
  UserId,
  VendorId,
} from "../models/quotation.model";
import {
  Prisma,
  QuotationStatus as PrismaQuotationStatus,
} from "@prisma/client";

/* ============================================================================
 * Decimal-like persistence contract
 * ============================================================================
 */

/**
 * Compatible with Prisma.Decimal without coupling this mapper
 * directly to Prisma in Part A.
 */
export interface QuotationDecimalLike {
  toNumber?():
    number;

  toString?():
    string;
}

export type QuotationAmountSource =
  | number
  | string
  | bigint
  | QuotationDecimalLike
  | null
  | undefined;

/* ============================================================================
 * JSON contracts
 * ============================================================================
 */

export type QuotationJsonObject =
  Record<
    string,
    unknown
  >;

export type QuotationJsonValue =
  | string
  | number
  | boolean
  | null
  | QuotationJsonObject
  | QuotationJsonValue[];

/* ============================================================================
 * Hydrated Prisma relation contracts
 * ============================================================================
 */

/**
 * Minimum Lead relation data required by the Quotation domain.
 */
export interface QuotationMapperLeadInput {
  id:
    LeadId;

  referenceId:
    string;
}

/**
 * Minimum Booking relation data required by the Quotation domain.
 */
export interface QuotationMapperBookingInput {
  id:
    BookingId;

  bookingNumber?:
    string | null;
}

/**
 * Minimum Vendor relation data needed internally.
 *
 * These values MUST later be omitted from customer-safe responses.
 */
export interface QuotationMapperVendorInput {
  id:
    VendorId;

  referenceId?:
    string | null;

  companyName?:
    string | null;
}

/**
 * Optional User relation.
 *
 * The Prisma schema does not guarantee a particular display-name
 * field through this mapper contract, so displayName remains optional.
 */
export interface QuotationMapperUserInput {
  id:
    UserId;

  displayName?:
    string | null;
}

/**
 * Reverse relation of Booking.selectedQuotation.
 *
 * If this relation is hydrated and non-null, this quotation is
 * currently selected by that Booking.
 */
export interface QuotationMapperSelectedBookingInput {
  id:
    BookingId;

  bookingNumber?:
    string | null;
}

/* ============================================================================
 * Prisma-compatible quotation persistence shape
 * ============================================================================
 */

/**
 * Prisma-independent structural representation of the current
 * Prisma Quotation model.
 *
 * Actual Prisma records can satisfy this contract without importing
 * Prisma-generated types into the domain mapper yet.
 */
export interface QuotationMapperPersistenceInput {
  id:
    string;

  quotationNumber:
    string;

  referenceId:
    string;

  /* ------------------------------------------------------------------------
   * Relations
   * ------------------------------------------------------------------------
   */

  leadId:
    string;

  bookingId:
    string;

  vendorId:
    string;

  userId?:
    string | null;

  /* ------------------------------------------------------------------------
   * Pricing
   * ------------------------------------------------------------------------
   */

  transportationCost:
    QuotationAmountSource;

  packingCost:
    QuotationAmountSource;

  unpackingCost:
    QuotationAmountSource;

  labourCost:
    QuotationAmountSource;

  insuranceCost:
    QuotationAmountSource;

  otherCost:
    QuotationAmountSource;

  discountAmount:
    QuotationAmountSource;

  taxAmount:
    QuotationAmountSource;

  totalAmount:
    QuotationAmountSource;

  currency:
    string;

  /* ------------------------------------------------------------------------
   * Schedule
   * ------------------------------------------------------------------------
   */

  pickupDate?:
    Date | string | null;

  deliveryDate?:
    Date | string | null;

  transitDays?:
    number | null;

  /* ------------------------------------------------------------------------
   * Workflow
   * ------------------------------------------------------------------------
   */

  status:
    string;

  validUntil?:
    Date | string | null;

  /* ------------------------------------------------------------------------
   * Commercial JSON
   *
   * Names exactly match schema.prisma.
   * ------------------------------------------------------------------------
   */

  pricingBreakdown?:
    unknown;

  termsJson?:
    unknown;

  inclusionsJson?:
    unknown;

  exclusionsJson?:
    unknown;

  /* ------------------------------------------------------------------------
   * Remarks
   * ------------------------------------------------------------------------
   */

  remarks?:
    string | null;

  internalRemarks?:
    string | null;

  /* ------------------------------------------------------------------------
   * Audit timestamps
   *
   * Current Prisma model has no createdBy / updatedBy fields.
   * ------------------------------------------------------------------------
   */

  createdAt:
    Date | string;

  updatedAt:
    Date | string;

  /* ------------------------------------------------------------------------
   * Optional hydrated relations
   * ------------------------------------------------------------------------
   */

  lead?:
    QuotationMapperLeadInput;

  booking?:
    QuotationMapperBookingInput;

  vendor?:
    QuotationMapperVendorInput;

  user?:
    QuotationMapperUserInput | null;

  selectedForBooking?:
    QuotationMapperSelectedBookingInput | null;
}

/* ============================================================================
 * Mapper result contracts
 * ============================================================================
 */

export interface QuotationMapperSuccess<
  T
> {
  success:
    true;

  value:
    T;

  warnings:
    string[];
}

export interface QuotationMapperFailure {
  success:
    false;

  error:
    string;

  warnings:
    string[];
}

export type QuotationMapperResult<
  T
> =
  | QuotationMapperSuccess<T>
  | QuotationMapperFailure;

/* ============================================================================
 * Mapper result factories
 * ============================================================================
 */

export function createQuotationMapperSuccess<
  T
>(
  value:
    T,
  warnings:
    string[] =
      []
): QuotationMapperSuccess<T> {
  return {
    success:
      true,

    value,

    warnings,
  };
}

export function createQuotationMapperFailure(
  error:
    string,
  warnings:
    string[] =
      []
): QuotationMapperFailure {
  return {
    success:
      false,

    error,

    warnings,
  };
}

/* ============================================================================
 * Primitive guards
 * ============================================================================
 */

export function isQuotationMapperObject(
  value:
    unknown
): value is QuotationJsonObject {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value
    )
  );
}

export function isQuotationMapperNonEmptyString(
  value:
    unknown
): value is string {
  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  );
}

export function isQuotationMapperFiniteNumber(
  value:
    unknown
): value is number {
  return (
    typeof value ===
      "number" &&
    Number.isFinite(
      value
    )
  );
}

/* ============================================================================
 * String normalization
 * ============================================================================
 */

export function normalizeQuotationMapperString(
  value:
    unknown
): string | undefined {
  if (
    typeof value !==
    "string"
  ) {
    return undefined;
  }

  const normalized =
    value.trim();

  return normalized.length >
    0
    ? normalized
    : undefined;
}

export function normalizeQuotationMapperNullableString(
  value:
    unknown
): string | null | undefined {
  if (
    value ===
      null
  ) {
    return null;
  }

  return normalizeQuotationMapperString(
    value
  );
}

/* ============================================================================
 * Decimal / monetary conversion
 * ============================================================================
 */

/**
 * Converts a Prisma Decimal-compatible value into a domain number.
 */
export function quotationAmountToNumber(
  value:
    QuotationAmountSource,
  fallback =
    0
): number {
  if (
    value ===
      null ||
    value ===
      undefined
  ) {
    return fallback;
  }

  if (
    typeof value ===
      "number"
  ) {
    return Number.isFinite(
      value
    )
      ? value
      : fallback;
  }

  if (
    typeof value ===
      "string"
  ) {
    const converted =
      Number(
        value
      );

    return Number.isFinite(
      converted
    )
      ? converted
      : fallback;
  }

  if (
    typeof value ===
      "bigint"
  ) {
    const converted =
      Number(
        value
      );

    return Number.isFinite(
      converted
    )
      ? converted
      : fallback;
  }

  if (
    typeof value ===
      "object" &&
    value !==
      null
  ) {
    if (
      typeof value.toNumber ===
        "function"
    ) {
      const converted =
        value.toNumber();

      if (
        Number.isFinite(
          converted
        )
      ) {
        return converted;
      }
    }

    if (
      typeof value.toString ===
        "function"
    ) {
      const converted =
        Number(
          value.toString()
        );

      if (
        Number.isFinite(
          converted
        )
      ) {
        return converted;
      }
    }
  }

  return fallback;
}

/**
 * Domain monetary values are normalized to two decimal places.
 */
export function normalizeQuotationMapperAmount(
  value:
    QuotationAmountSource,
  fallback =
    0
): number {
  const amount =
    quotationAmountToNumber(
      value,
      fallback
    );

  return Math.round(
    (
      amount +
      Number.EPSILON
    ) *
      100
  ) /
    100;
}

/* ============================================================================
 * Date conversion
 * ============================================================================
 */

/**
 * Converts Prisma DateTime / ISO input into a full ISO timestamp.
 */
export function quotationDateToIso(
  value:
    Date | string | null | undefined
): string | undefined {
  if (
    value ===
      null ||
    value ===
      undefined
  ) {
    return undefined;
  }

  if (
    value instanceof
      Date
  ) {
    if (
      Number.isNaN(
        value.getTime()
      )
    ) {
      return undefined;
    }

    return value.toISOString();
  }

  if (
    typeof value ===
      "string"
  ) {
    const normalized =
      value.trim();

    if (
      normalized.length ===
        0
    ) {
      return undefined;
    }

    const parsed =
      new Date(
        normalized
      );

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return undefined;
    }

    return parsed.toISOString();
  }

  return undefined;
}

/**
 * Converts Prisma DateTime into the YYYY-MM-DD representation used
 * by quotation schedule contracts.
 */
export function quotationDateToDateOnly(
  value:
    Date | string | null | undefined
): string | undefined {
  const iso =
    quotationDateToIso(
      value
    );

  return iso
    ? iso.slice(
        0,
        10
      )
    : undefined;
}

/**
 * Converts domain date strings into Date objects for later Prisma writes.
 */
export function quotationStringToDate(
  value:
    string | null | undefined
): Date | null | undefined {
  if (
    value ===
      undefined
  ) {
    return undefined;
  }

  if (
    value ===
      null
  ) {
    return null;
  }

  const normalized =
    value.trim();

  if (
    normalized.length ===
      0
  ) {
    return undefined;
  }

  const parsed =
    new Date(
      normalized
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return undefined;
  }

  return parsed;
}

/* ============================================================================
 * Quotation status mapping
 * ============================================================================
 */

/**
 * Maps Prisma/persisted quotation status to the domain enum.
 *
 * Prisma default is SUBMITTED, therefore SUBMITTED is also used
 * as the defensive persistence fallback.
 */
export function mapQuotationStatus(
  value:
    unknown
): QuotationStatus {
  if (
    typeof value ===
      "string" &&
    Object.values(
      QuotationStatus
    ).includes(
      value as
        QuotationStatus
    )
  ) {
    return value as
      QuotationStatus;
  }

  return QuotationStatus
    .SUBMITTED;
}

/* ============================================================================
 * Currency mapping
 * ============================================================================
 */

/**
 * Current EasyMovers QuotationCurrency supports INR.
 */
export function mapQuotationCurrency(
  value:
    unknown
): QuotationCurrency {
  if (
    value ===
      QuotationCurrency.INR
  ) {
    return QuotationCurrency
      .INR;
  }

  return QuotationCurrency
    .INR;
}

/* ============================================================================
 * JSON helpers
 * ============================================================================
 */

/**
 * Deep-clones JSON-compatible persistence data.
 */
export function cloneQuotationJson<
  T
>(
  value:
    T
): T {
  if (
    value ===
      undefined ||
    value ===
      null
  ) {
    return value;
  }

  try {
    return JSON.parse(
      JSON.stringify(
        value
      )
    ) as T;
  } catch {
    return value;
  }
}

/**
 * Reads an optional JSON object.
 */
export function readQuotationJsonObject<
  T
>(
  value:
    unknown
): T | undefined {
  if (
    !isQuotationMapperObject(
      value
    )
  ) {
    return undefined;
  }

  return cloneQuotationJson(
    value
  ) as T;
}

/* ============================================================================
 * Commercial JSON readers
 * ============================================================================
 */

export function readQuotationPricingBreakdown(
  value:
    unknown
): QuotationPricingBreakdown | undefined {
  return readQuotationJsonObject<
    QuotationPricingBreakdown
  >(
    value
  );
}

export function readQuotationTerms(
  value:
    unknown
): QuotationTerms | undefined {
  return readQuotationJsonObject<
    QuotationTerms
  >(
    value
  );
}

export function readQuotationInclusions(
  value:
    unknown
): QuotationInclusions | undefined {
  return readQuotationJsonObject<
    QuotationInclusions
  >(
    value
  );
}

export function readQuotationExclusions(
  value:
    unknown
): QuotationExclusions | undefined {
  return readQuotationJsonObject<
    QuotationExclusions
  >(
    value
  );
}

/* ============================================================================
 * Relation reference mapping
 * ============================================================================
 */

export function mapQuotationLeadReference(
  input:
    QuotationMapperLeadInput
): QuotationLeadReference {
  return {
    leadId:
      input.id,

    leadReferenceId:
      input.referenceId,
  };
}

export function mapQuotationBookingReference(
  input:
    QuotationMapperBookingInput
): QuotationBookingReference {
  return {
    bookingId:
      input.id,

    ...(input.bookingNumber
      ? {
          bookingNumber:
            input.bookingNumber,
        }
      : {}),
  };
}

export function mapQuotationVendorReference(
  input:
    QuotationMapperVendorInput
): QuotationVendorReference {
  return {
    vendorId:
      input.id,

    ...(input.referenceId
      ? {
          vendorCode:
            input.referenceId,
        }
      : {}),

    ...(input.companyName
      ? {
          companyName:
            input.companyName,
        }
      : {}),
  };
}

export function mapQuotationUserReference(
  input:
    QuotationMapperUserInput | null | undefined
): QuotationUserReference | undefined {
  if (
    !input
  ) {
    return undefined;
  }

  return {
    userId:
      input.id,

    ...(input.displayName
      ? {
          displayName:
            input.displayName,
        }
      : {}),
  };
}

/* ============================================================================
 * Pricing mapping
 * ============================================================================
 */

/**
 * Converts Prisma Decimal-compatible pricing fields into
 * QuotationCostSummary.
 */
export function mapQuotationCostSummary(
  input: {
    transportationCost:
      QuotationAmountSource;

    packingCost:
      QuotationAmountSource;

    unpackingCost:
      QuotationAmountSource;

    labourCost:
      QuotationAmountSource;

    insuranceCost:
      QuotationAmountSource;

    otherCost:
      QuotationAmountSource;

    discountAmount:
      QuotationAmountSource;

    taxAmount:
      QuotationAmountSource;

    totalAmount:
      QuotationAmountSource;

    currency:
      unknown;
  }
): QuotationCostSummary {
  return {
    transportationCost:
      normalizeQuotationMapperAmount(
        input.transportationCost
      ),

    packingCost:
      normalizeQuotationMapperAmount(
        input.packingCost
      ),

    unpackingCost:
      normalizeQuotationMapperAmount(
        input.unpackingCost
      ),

    labourCost:
      normalizeQuotationMapperAmount(
        input.labourCost
      ),

    insuranceCost:
      normalizeQuotationMapperAmount(
        input.insuranceCost
      ),

    otherCost:
      normalizeQuotationMapperAmount(
        input.otherCost
      ),

    discountAmount:
      normalizeQuotationMapperAmount(
        input.discountAmount
      ),

    taxAmount:
      normalizeQuotationMapperAmount(
        input.taxAmount
      ),

    totalAmount:
      normalizeQuotationMapperAmount(
        input.totalAmount
      ),

    currency:
      mapQuotationCurrency(
        input.currency
      ),
  };
}

/* ============================================================================
 * Schedule mapping
 * ============================================================================
 */

export function mapQuotationSchedule(
  input: {
    pickupDate?:
      Date | string | null;

    deliveryDate?:
      Date | string | null;

    transitDays?:
      number | null;
  }
): QuotationSchedule {
  const pickupDate =
    quotationDateToDateOnly(
      input.pickupDate
    );

  const deliveryDate =
    quotationDateToDateOnly(
      input.deliveryDate
    );

  return {
    ...(pickupDate
      ? {
          pickupDate,
        }
      : {}),

    ...(deliveryDate
      ? {
          deliveryDate,
        }
      : {}),

    ...(typeof input.transitDays ===
        "number" &&
      Number.isInteger(
        input.transitDays
      )
      ? {
          transitDays:
            input.transitDays,
        }
      : {}),
  };
}

/* ============================================================================
 * Commercial detail mapping
 * ============================================================================
 */

/**
 * Names correspond exactly to schema.prisma:
 *
 * pricingBreakdown
 * termsJson
 * inclusionsJson
 * exclusionsJson
 */
export function mapQuotationCommercialDetails(
  input: {
    pricingBreakdown?:
      unknown;

    termsJson?:
      unknown;

    inclusionsJson?:
      unknown;

    exclusionsJson?:
      unknown;

    remarks?:
      string | null;

    internalRemarks?:
      string | null;
  }
): QuotationCommercialDetails {
  const pricingBreakdown =
    readQuotationPricingBreakdown(
      input.pricingBreakdown
    );

  const terms =
    readQuotationTerms(
      input.termsJson
    );

  const inclusions =
    readQuotationInclusions(
      input.inclusionsJson
    );

  const exclusions =
    readQuotationExclusions(
      input.exclusionsJson
    );

  const remarks =
    normalizeQuotationMapperString(
      input.remarks
    );

  const internalRemarks =
    normalizeQuotationMapperString(
      input.internalRemarks
    );

  return {
    ...(pricingBreakdown
      ? {
          pricingBreakdown,
        }
      : {}),

    ...(terms
      ? {
          terms,
        }
      : {}),

    ...(inclusions
      ? {
          inclusions,
        }
      : {}),

    ...(exclusions
      ? {
          exclusions,
        }
      : {}),

    ...(remarks
      ? {
          remarks,
        }
      : {}),

    ...(internalRemarks
      ? {
          internalRemarks,
        }
      : {}),
  };
}

/* ============================================================================
 * Audit mapping
 * ============================================================================
 */

/**
 * Current Prisma Quotation only persists:
 *
 * createdAt
 * updatedAt
 *
 * createdBy / updatedBy are intentionally NOT invented here.
 */
export function mapQuotationAudit(
  input: {
    createdAt:
      Date | string;

    updatedAt:
      Date | string;
  }
): QuotationAudit {
  const createdAt =
    quotationDateToIso(
      input.createdAt
    ) ??
    new Date(
      0
    ).toISOString();

  const updatedAt =
    quotationDateToIso(
      input.updatedAt
    ) ??
    createdAt;

  return {
    createdAt,
    updatedAt,
  };
}

/* ============================================================================
 * Selected quotation mapping
 * ============================================================================
 */

/**
 * Prisma relation:
 *
 * selectedForBooking Booking?
 *   @relation("SelectedBookingQuotation")
 *
 * Therefore a non-null reverse Booking relation means this
 * quotation is currently selected.
 */
export function isQuotationSelectedForBooking(
  selectedForBooking:
    QuotationMapperSelectedBookingInput |
    null |
    undefined
): boolean {
  return Boolean(
    selectedForBooking
  );
}

/* ============================================================================
 * Persistence requirement helpers
 * ============================================================================
 */

/**
 * Lead relation must normally be hydrated before constructing
 * the complete Quotation domain aggregate because the domain
 * requires leadReferenceId in addition to leadId.
 */
export function hasQuotationLeadRelation(
  input:
    QuotationMapperPersistenceInput
): input is
  QuotationMapperPersistenceInput & {
    lead:
      QuotationMapperLeadInput;
  } {
  return Boolean(
    input.lead &&
    isQuotationMapperNonEmptyString(
      input.lead.id
    ) &&
    isQuotationMapperNonEmptyString(
      input.lead.referenceId
    )
  );
}

/**
 * Booking relation must normally be hydrated for the aggregate.
 */
export function hasQuotationBookingRelation(
  input:
    QuotationMapperPersistenceInput
): input is
  QuotationMapperPersistenceInput & {
    booking:
      QuotationMapperBookingInput;
  } {
  return Boolean(
    input.booking &&
    isQuotationMapperNonEmptyString(
      input.booking.id
    )
  );
}

/**
 * Vendor relation must normally be hydrated for internal responses.
 */
export function hasQuotationVendorRelation(
  input:
    QuotationMapperPersistenceInput
): input is
  QuotationMapperPersistenceInput & {
    vendor:
      QuotationMapperVendorInput;
  } {
  return Boolean(
    input.vendor &&
    isQuotationMapperNonEmptyString(
      input.vendor.id
    )
  );
}

/* ============================================================================
 * Future mapper signatures
 * ============================================================================
 */

/**
 * These signatures establish the remaining mapper responsibilities.
 *
 * Implementations will be added in subsequent parts.
 */
export type MapQuotationPersistenceToDomain =
  (
    input:
      QuotationMapperPersistenceInput
  ) => QuotationMapperResult<
    Quotation
  >;

export type MapCreateQuotationToPersistence =
  (
    input:
      CreateQuotationInput
  ) => unknown;

export type MapUpdateQuotationToPersistence =
  (
    input:
      UpdateQuotationInput
  ) => unknown;

export type MapQuotationToCustomerSafe =
  (
    quotation:
      Quotation
  ) => CustomerSafeQuotation;

export type MapQuotationToListItem =
  (
    quotation:
      Quotation
  ) => QuotationListItem;

/* ============================================================================
 * End of Part A
 * ============================================================================
 */
/* ============================================================================
 * EasyMovers
 * Quotation Mapper
 * Part B
 * ============================================================================
 *
 * Responsibilities:
 * - Map persisted Quotation records into domain Quotation aggregates
 * - Require critical hydrated relation snapshots
 * - Map internal Quotation into CustomerSafeQuotation
 * - Map Quotation into lightweight list items
 * - Protect Vendor identity in customer-facing mappings
 * - Preserve Booking-selected quotation state
 * ============================================================================
 */

/* ============================================================================
 * Persistence relation fallback helpers
 * ============================================================================
 */

/**
 * Builds the Lead reference required by the Quotation aggregate.
 *
 * leadReferenceId does not exist directly on the Prisma Quotation row,
 * therefore the Lead relation must be hydrated by the repository.
 */
export function resolveQuotationLeadReference(
  input:
    QuotationMapperPersistenceInput
): QuotationMapperResult<
  QuotationLeadReference
> {
  if (
    !hasQuotationLeadRelation(
      input
    )
  ) {
    return createQuotationMapperFailure(
      "Quotation Lead relation is required to map the complete Quotation aggregate."
    );
  }

  return createQuotationMapperSuccess(
    mapQuotationLeadReference(
      input.lead
    )
  );
}

/**
 * Builds the Booking reference required by the domain aggregate.
 */
export function resolveQuotationBookingReference(
  input:
    QuotationMapperPersistenceInput
): QuotationMapperResult<
  QuotationBookingReference
> {
  if (
    !hasQuotationBookingRelation(
      input
    )
  ) {
    return createQuotationMapperFailure(
      "Quotation Booking relation is required to map the complete Quotation aggregate."
    );
  }

  return createQuotationMapperSuccess(
    mapQuotationBookingReference(
      input.booking
    )
  );
}

/**
 * Builds the internal Vendor reference.
 *
 * Customer-facing mappings MUST NOT expose the result of this helper.
 */
export function resolveQuotationVendorReference(
  input:
    QuotationMapperPersistenceInput
): QuotationMapperResult<
  QuotationVendorReference
> {
  if (
    !hasQuotationVendorRelation(
      input
    )
  ) {
    return createQuotationMapperFailure(
      "Quotation Vendor relation is required to map the complete internal Quotation aggregate."
    );
  }

  return createQuotationMapperSuccess(
    mapQuotationVendorReference(
      input.vendor
    )
  );
}

/* ============================================================================
 * Persisted quotation identity guards
 * ============================================================================
 */

export function validateQuotationMapperPersistenceIdentity(
  input:
    QuotationMapperPersistenceInput
): string[] {
  const errors:
    string[] =
      [];

  if (
    !isQuotationMapperNonEmptyString(
      input.id
    )
  ) {
    errors.push(
      "Quotation id is missing."
    );
  }

  if (
    !isQuotationMapperNonEmptyString(
      input.quotationNumber
    )
  ) {
    errors.push(
      "Quotation quotationNumber is missing."
    );
  }

  if (
    !isQuotationMapperNonEmptyString(
      input.referenceId
    )
  ) {
    errors.push(
      "Quotation referenceId is missing."
    );
  }

  if (
    !isQuotationMapperNonEmptyString(
      input.leadId
    )
  ) {
    errors.push(
      "Quotation leadId is missing."
    );
  }

  if (
    !isQuotationMapperNonEmptyString(
      input.bookingId
    )
  ) {
    errors.push(
      "Quotation bookingId is missing."
    );
  }

  if (
    !isQuotationMapperNonEmptyString(
      input.vendorId
    )
  ) {
    errors.push(
      "Quotation vendorId is missing."
    );
  }

  return errors;
}

/* ============================================================================
 * Relation consistency checks
 * ============================================================================
 */

/**
 * Verifies that hydrated relation IDs agree with the scalar foreign keys
 * persisted on the Quotation record.
 */
export function validateQuotationMapperRelationConsistency(
  input:
    QuotationMapperPersistenceInput
): string[] {
  const warnings:
    string[] =
      [];

  if (
    input.lead &&
    input.lead.id !==
      input.leadId
  ) {
    warnings.push(
      "Hydrated Lead relation ID does not match quotation.leadId."
    );
  }

  if (
    input.booking &&
    input.booking.id !==
      input.bookingId
  ) {
    warnings.push(
      "Hydrated Booking relation ID does not match quotation.bookingId."
    );
  }

  if (
    input.vendor &&
    input.vendor.id !==
      input.vendorId
  ) {
    warnings.push(
      "Hydrated Vendor relation ID does not match quotation.vendorId."
    );
  }

  if (
    input.user &&
    input.userId &&
    input.user.id !==
      input.userId
  ) {
    warnings.push(
      "Hydrated User relation ID does not match quotation.userId."
    );
  }

  if (
    input.selectedForBooking &&
    input.selectedForBooking.id !==
      input.bookingId
  ) {
    warnings.push(
      "selectedForBooking relation does not reference the quotation's Booking."
    );
  }

  return warnings;
}

/* ============================================================================
 * Full persistence -> domain Quotation mapping
 * ============================================================================
 */

/**
 * Maps one hydrated persisted Quotation into the complete
 * internal Quotation domain aggregate.
 *
 * Required hydrated relations:
 * - Lead
 * - Booking
 * - Vendor
 *
 * Optional:
 * - User
 * - selectedForBooking
 */
export function mapQuotationPersistenceToDomain(
  input:
    QuotationMapperPersistenceInput
): QuotationMapperResult<
  Quotation
> {
  const identityErrors =
    validateQuotationMapperPersistenceIdentity(
      input
    );

  if (
    identityErrors.length >
      0
  ) {
    return createQuotationMapperFailure(
      identityErrors.join(
        " "
      )
    );
  }

  const leadResult =
    resolveQuotationLeadReference(
      input
    );

  if (
    !leadResult.success
  ) {
    return leadResult;
  }

  const bookingResult =
    resolveQuotationBookingReference(
      input
    );

  if (
    !bookingResult.success
  ) {
    return bookingResult;
  }

  const vendorResult =
    resolveQuotationVendorReference(
      input
    );

  if (
    !vendorResult.success
  ) {
    return vendorResult;
  }

  const warnings =
    validateQuotationMapperRelationConsistency(
      input
    );

  const costs =
    mapQuotationCostSummary({
      transportationCost:
        input.transportationCost,

      packingCost:
        input.packingCost,

      unpackingCost:
        input.unpackingCost,

      labourCost:
        input.labourCost,

      insuranceCost:
        input.insuranceCost,

      otherCost:
        input.otherCost,

      discountAmount:
        input.discountAmount,

      taxAmount:
        input.taxAmount,

      totalAmount:
        input.totalAmount,

      currency:
        input.currency,
    });

  const schedule =
    mapQuotationSchedule({
      pickupDate:
        input.pickupDate,

      deliveryDate:
        input.deliveryDate,

      transitDays:
        input.transitDays,
    });

  const commercialDetails =
    mapQuotationCommercialDetails({
      pricingBreakdown:
        input.pricingBreakdown,

      termsJson:
        input.termsJson,

      inclusionsJson:
        input.inclusionsJson,

      exclusionsJson:
        input.exclusionsJson,

      remarks:
        input.remarks,

      internalRemarks:
        input.internalRemarks,
    });

  const audit =
    mapQuotationAudit({
      createdAt:
        input.createdAt,

      updatedAt:
        input.updatedAt,
    });

  const submittedByUser =
    mapQuotationUserReference(
      input.user
    );

  const validUntil =
    quotationDateToDateOnly(
      input.validUntil
    );

  const quotation:
    Quotation = {
      quotationId:
        input.id,

      quotationNumber:
        input.quotationNumber,

      referenceId:
        input.referenceId,

      lead:
        leadResult.value,

      booking:
        bookingResult.value,

      vendor:
        vendorResult.value,

      ...(submittedByUser
        ? {
            submittedByUser,
          }
        : {}),

      costs,

      schedule,

      status:
        mapQuotationStatus(
          input.status
        ),

      ...(validUntil
        ? {
            validUntil,
          }
        : {}),

      commercialDetails,

      selectedForBooking:
        isQuotationSelectedForBooking(
          input.selectedForBooking
        ),

      audit,
    };

  return createQuotationMapperSuccess(
    quotation,
    warnings
  );
}

/* ============================================================================
 * Strict domain mapping convenience helper
 * ============================================================================
 */

/**
 * Convenience helper for callers that require a Quotation directly.
 *
 * Repository code may prefer mapQuotationPersistenceToDomain()
 * when it wants to preserve mapper warnings without throwing.
 */
export function requireMappedQuotation(
  input:
    QuotationMapperPersistenceInput
): Quotation {
  const result =
    mapQuotationPersistenceToDomain(
      input
    );

  if (
    !result.success
  ) {
    throw new Error(
      result.error
    );
  }

  return result.value;
}

/* ============================================================================
 * Customer-safe mapping
 * ============================================================================
 */

/**
 * Maps the internal Quotation aggregate into a customer-facing quotation.
 *
 * SECURITY / BRD RULE:
 *
 * The following internal fields are intentionally excluded:
 *
 * - quotation.vendor.vendorId
 * - quotation.vendor.vendorCode
 * - quotation.vendor.companyName
 * - quotation.commercialDetails.internalRemarks
 * - quotation.submittedByUser
 * - quotation.lead
 *
 * Customer quotation comparison must not reveal Vendor identity before
 * the relevant EasyMovers workflow permits it.
 */
export function mapQuotationToCustomerSafe(
  quotation:
    Quotation
): CustomerSafeQuotation {
  const {
    pricingBreakdown,
    terms,
    inclusions,
    exclusions,
    remarks,
  } =
    quotation
      .commercialDetails;

  return {
    quotationId:
      quotation.quotationId,

    quotationNumber:
      quotation.quotationNumber,

    referenceId:
      quotation.referenceId,

    bookingId:
      quotation.booking
        .bookingId,

    costs:
      cloneQuotationJson(
        quotation.costs
      ),

    schedule:
      cloneQuotationJson(
        quotation.schedule
      ),

    status:
      quotation.status,

    ...(quotation.validUntil
      ? {
          validUntil:
            quotation.validUntil,
        }
      : {}),

    ...(pricingBreakdown
      ? {
          pricingBreakdown:
            cloneQuotationJson(
              pricingBreakdown
            ),
        }
      : {}),

    ...(terms
      ? {
          terms:
            cloneQuotationJson(
              terms
            ),
        }
      : {}),

    ...(inclusions
      ? {
          inclusions:
            cloneQuotationJson(
              inclusions
            ),
        }
      : {}),

    ...(exclusions
      ? {
          exclusions:
            cloneQuotationJson(
              exclusions
            ),
        }
      : {}),

     selectedForBooking:
      quotation
        .selectedForBooking,

    createdAt:
      quotation.audit
        .createdAt,

    updatedAt:
      quotation.audit
        .updatedAt,
  };
}

/* ============================================================================
 * Batch customer-safe mapping
 * ============================================================================
 */

export function mapQuotationsToCustomerSafe(
  quotations:
    Quotation[]
): CustomerSafeQuotation[] {
  return quotations.map(
    (
      quotation
    ) =>
      mapQuotationToCustomerSafe(
        quotation
      )
  );
}

/* ============================================================================
 * Internal list-item mapping
 * ============================================================================
 */

/**
 * Maps an internal Quotation aggregate into a lightweight list row.
 *
 * Internal/admin/vendor callers may receive vendorId.
 *
 * For customer-facing listing use:
 * mapQuotationToCustomerSafeListItem()
 */
export function mapQuotationToListItem(
  quotation:
    Quotation
): QuotationListItem {
  return {
    quotationId:
      quotation.quotationId,

    quotationNumber:
      quotation.quotationNumber,

    referenceId:
      quotation.referenceId,

    leadId:
      quotation.lead
        .leadId,

    bookingId:
      quotation.booking
        .bookingId,

    vendorId:
      quotation.vendor
        .vendorId,

    totalAmount:
      quotation.costs
        .totalAmount,

    currency:
      quotation.costs
        .currency,

    status:
      quotation.status,

    ...(quotation.validUntil
      ? {
          validUntil:
            quotation.validUntil,
        }
      : {}),

    ...(quotation.schedule
      .pickupDate
      ? {
          pickupDate:
            quotation.schedule
              .pickupDate,
        }
      : {}),

    ...(quotation.schedule
      .deliveryDate
      ? {
          deliveryDate:
            quotation.schedule
              .deliveryDate,
        }
      : {}),

    ...(quotation.schedule
      .transitDays !==
      undefined
      ? {
          transitDays:
            quotation.schedule
              .transitDays,
        }
      : {}),

    selectedForBooking:
      quotation
        .selectedForBooking,

    createdAt:
      quotation.audit
        .createdAt,

    updatedAt:
      quotation.audit
        .updatedAt,
  };
}

/* ============================================================================
 * Customer-safe list item
 * ============================================================================
 */

/**
 * QuotationListItem technically allows vendorId to be omitted.
 *
 * This mapper uses that capability to enforce Vendor masking for
 * customer-facing quotation lists.
 */
export function mapQuotationToCustomerSafeListItem(
  quotation:
    Quotation
): QuotationListItem {
  return {
    quotationId:
      quotation.quotationId,

    quotationNumber:
      quotation.quotationNumber,

    referenceId:
      quotation.referenceId,

    leadId:
      quotation.lead
        .leadId,

    bookingId:
      quotation.booking
        .bookingId,

    totalAmount:
      quotation.costs
        .totalAmount,

    currency:
      quotation.costs
        .currency,

    status:
      quotation.status,

    ...(quotation.validUntil
      ? {
          validUntil:
            quotation.validUntil,
        }
      : {}),

    ...(quotation.schedule
      .pickupDate
      ? {
          pickupDate:
            quotation.schedule
              .pickupDate,
        }
      : {}),

    ...(quotation.schedule
      .deliveryDate
      ? {
          deliveryDate:
            quotation.schedule
              .deliveryDate,
        }
      : {}),

    ...(quotation.schedule
      .transitDays !==
      undefined
      ? {
          transitDays:
            quotation.schedule
              .transitDays,
        }
      : {}),

    selectedForBooking:
      quotation
        .selectedForBooking,

    createdAt:
      quotation.audit
        .createdAt,

    updatedAt:
      quotation.audit
        .updatedAt,
  };
}

/* ============================================================================
 * Batch list mapping
 * ============================================================================
 */

export function mapQuotationsToListItems(
  quotations:
    Quotation[]
): QuotationListItem[] {
  return quotations.map(
    (
      quotation
    ) =>
      mapQuotationToListItem(
        quotation
      )
  );
}

export function mapQuotationsToCustomerSafeListItems(
  quotations:
    Quotation[]
): QuotationListItem[] {
  return quotations.map(
    (
      quotation
    ) =>
      mapQuotationToCustomerSafeListItem(
        quotation
      )
  );
}

/* ============================================================================
 * Direct persistence -> customer-safe mapping
 * ============================================================================
 */

/**
 * Useful when an API/repository receives one hydrated Prisma record
 * and needs a customer-safe response immediately.
 */
export function mapQuotationPersistenceToCustomerSafe(
  input:
    QuotationMapperPersistenceInput
): QuotationMapperResult<
  CustomerSafeQuotation
> {
  const mapped =
    mapQuotationPersistenceToDomain(
      input
    );

  if (
    !mapped.success
  ) {
    return mapped;
  }

  return createQuotationMapperSuccess(
    mapQuotationToCustomerSafe(
      mapped.value
    ),
    mapped.warnings
  );
}

/* ============================================================================
 * Direct persistence -> list-item mapping
 * ============================================================================
 */

export function mapQuotationPersistenceToListItem(
  input:
    QuotationMapperPersistenceInput
): QuotationMapperResult<
  QuotationListItem
> {
  const mapped =
    mapQuotationPersistenceToDomain(
      input
    );

  if (
    !mapped.success
  ) {
    return mapped;
  }

  return createQuotationMapperSuccess(
    mapQuotationToListItem(
      mapped.value
    ),
    mapped.warnings
  );
}

/**
 * Customer-safe persistence -> list mapping.
 */
export function mapQuotationPersistenceToCustomerSafeListItem(
  input:
    QuotationMapperPersistenceInput
): QuotationMapperResult<
  QuotationListItem
> {
  const mapped =
    mapQuotationPersistenceToDomain(
      input
    );

  if (
    !mapped.success
  ) {
    return mapped;
  }

  return createQuotationMapperSuccess(
    mapQuotationToCustomerSafeListItem(
      mapped.value
    ),
    mapped.warnings
  );
}

/* ============================================================================
 * Mapper facade - read side
 * ============================================================================
 */

/**
 * Stable mapper facade for service/repository/controller consumers.
 *
 * Write-side functions will be added in the next mapper part.
 */
export const QuotationReadMapper = {
  fromPersistence:
    mapQuotationPersistenceToDomain,

  requireFromPersistence:
    requireMappedQuotation,

  toCustomerSafe:
    mapQuotationToCustomerSafe,

  toCustomerSafeMany:
    mapQuotationsToCustomerSafe,

  toListItem:
    mapQuotationToListItem,

  toListItems:
    mapQuotationsToListItems,

  toCustomerSafeListItem:
    mapQuotationToCustomerSafeListItem,

  toCustomerSafeListItems:
    mapQuotationsToCustomerSafeListItems,

  persistenceToCustomerSafe:
    mapQuotationPersistenceToCustomerSafe,

  persistenceToListItem:
    mapQuotationPersistenceToListItem,

  persistenceToCustomerSafeListItem:
    mapQuotationPersistenceToCustomerSafeListItem,
} as const;

/* ============================================================================
 * End of Part B
 * ============================================================================
 */
/* ============================================================================
 * EasyMovers
 * Quotation Mapper
 * Part C
 * ============================================================================
 *
 * Responsibilities:
 * - Map CreateQuotationInput -> Prisma.QuotationCreateInput
 * - Map UpdateQuotationInput -> Prisma.QuotationUpdateInput
 * - Map domain QuotationStatus -> Prisma QuotationStatus
 * - Map domain commercial JSON -> Prisma JSON
 * - Handle nullable Prisma JSON updates
 * - Preserve Lead / Booking / Vendor / User relationships
 *
 * IMPORTANT:
 * - createdBy is NOT persisted because Prisma Quotation has no createdBy field
 * - updatedBy is NOT persisted because Prisma Quotation has no updatedBy field
 * - quotationNumber and referenceId must be generated by the service layer
 * ============================================================================
 */

/* ============================================================================
 * Create mapping context
 * ============================================================================
 */

/**
 * Identity fields generated before persistence.
 *
 * quotationNumber and referenceId are mandatory in schema.prisma
 * but are intentionally not customer-supplied CreateQuotationInput fields.
 *
 * quotationId is optional because Prisma can generate id through @default(cuid()).
 */
export interface QuotationCreatePersistenceContext {
  quotationNumber:
    string;

  referenceId:
    string;

  quotationId?:
    string;
}

/* ============================================================================
 * Prisma status mapping
 * ============================================================================
 */

/**
 * Converts the Quotation domain workflow status into the Prisma enum.
 */
export function mapQuotationStatusToPrisma(
  status:
    QuotationStatus | undefined
): PrismaQuotationStatus {
  switch (
    status
  ) {
    case QuotationStatus.DRAFT:
      return PrismaQuotationStatus.DRAFT;

    case QuotationStatus.SUBMITTED:
      return PrismaQuotationStatus.SUBMITTED;

    case QuotationStatus.REVISED:
      return PrismaQuotationStatus.REVISED;

    case QuotationStatus.SHORTLISTED:
      return PrismaQuotationStatus.SHORTLISTED;

    case QuotationStatus.ACCEPTED:
      return PrismaQuotationStatus.ACCEPTED;

    case QuotationStatus.REJECTED:
      return PrismaQuotationStatus.REJECTED;

    case QuotationStatus.EXPIRED:
      return PrismaQuotationStatus.EXPIRED;

    case QuotationStatus.WITHDRAWN:
      return PrismaQuotationStatus.WITHDRAWN;

    case QuotationStatus.CANCELLED:
      return PrismaQuotationStatus.CANCELLED;

    default:
      /**
       * Prisma Quotation default is SUBMITTED.
       *
       * The service normally supplies an already-normalized status,
       * but this defensive fallback keeps persistence aligned with
       * schema.prisma.
       */
      return PrismaQuotationStatus.SUBMITTED;
  }
}

/* ============================================================================
 * Prisma monetary mapping
 * ============================================================================
 */

/**
 * Prisma Decimal fields accept numeric input.
 *
 * Validation and normalization occur before the mapper. This helper
 * only converts a domain number into a persistence-safe number.
 */
export function mapQuotationAmountToPrisma(
  value:
    number | undefined,
  fallback =
    0
): number {
  if (
    typeof value !==
      "number" ||
    !Number.isFinite(
      value
    )
  ) {
    return fallback;
  }

  return Math.round(
    (
      value +
      Number.EPSILON
    ) *
      100
  ) /
    100;
}

/* ============================================================================
 * Required total amount mapping
 * ============================================================================
 */

/**
 * Prisma requires totalAmount.
 *
 * Normally validateCompleteCreateQuotationInput() has already produced
 * totalAmount. This fallback prevents an incomplete trusted caller from
 * producing invalid Prisma create-data.
 */
export function resolveQuotationCreateTotalAmount(
  input:
    CreateQuotationInput
): number {
  if (
    typeof input.totalAmount ===
      "number" &&
    Number.isFinite(
      input.totalAmount
    )
  ) {
    return mapQuotationAmountToPrisma(
      input.totalAmount
    );
  }

  const transportationCost =
    mapQuotationAmountToPrisma(
      input.transportationCost
    );

  const packingCost =
    mapQuotationAmountToPrisma(
      input.packingCost
    );

  const unpackingCost =
    mapQuotationAmountToPrisma(
      input.unpackingCost
    );

  const labourCost =
    mapQuotationAmountToPrisma(
      input.labourCost
    );

  const insuranceCost =
    mapQuotationAmountToPrisma(
      input.insuranceCost
    );

  const otherCost =
    mapQuotationAmountToPrisma(
      input.otherCost
    );

  const discountAmount =
    mapQuotationAmountToPrisma(
      input.discountAmount
    );

  const taxAmount =
    mapQuotationAmountToPrisma(
      input.taxAmount
    );

  return Math.round(
    (
      transportationCost +
      packingCost +
      unpackingCost +
      labourCost +
      insuranceCost +
      otherCost -
      discountAmount +
      taxAmount +
      Number.EPSILON
    ) *
      100
  ) /
    100;
}

/* ============================================================================
 * Prisma JSON conversion
 * ============================================================================
 */

/**
 * Converts domain structured JSON into Prisma InputJsonValue.
 *
 * JSON.stringify/parse deliberately strips undefined properties,
 * which Prisma JSON does not support.
 */
export function mapQuotationJsonToPrisma(
  value:
    unknown
): Prisma.InputJsonValue | undefined {
  if (
    value ===
      undefined ||
    value ===
      null
  ) {
    return undefined;
  }

  try {
    return JSON.parse(
      JSON.stringify(
        value
      )
    ) as
      Prisma.InputJsonValue;
  } catch {
    return undefined;
  }
}

/**
 * Used specifically for update operations.
 *
 * undefined:
 *   field was not supplied -> do not update
 *
 * null:
 *   caller explicitly clears the nullable JSON database column
 *
 * object:
 *   persist JSON value
 */
export function mapNullableQuotationJsonToPrisma(
  value:
    unknown
):
  | Prisma.InputJsonValue
  | typeof Prisma.DbNull
  | undefined {
  if (
    value ===
      undefined
  ) {
    return undefined;
  }

  if (
    value ===
      null
  ) {
    return Prisma.DbNull;
  }

  return mapQuotationJsonToPrisma(
    value
  );
}

/* ============================================================================
 * Prisma date mapping
 * ============================================================================
 */

/**
 * Create fields do not support explicit null through CreateQuotationInput,
 * therefore undefined means omit the optional DateTime column.
 */
export function mapCreateQuotationDateToPrisma(
  value:
    string | undefined
): Date | undefined {
  const mapped =
    quotationStringToDate(
      value
    );

  return mapped instanceof
    Date
    ? mapped
    : undefined;
}

/**
 * UpdateQuotationInput supports null so callers can clear optional dates.
 */
export function mapUpdateQuotationDateToPrisma(
  value:
    string | null | undefined
): Date | null | undefined {
  return quotationStringToDate(
    value
  );
}

/* ============================================================================
 * CreateQuotationInput -> Prisma create data
 * ============================================================================
 */

/**
 * Maps validated CreateQuotationInput into the current
 * Prisma.QuotationCreateInput.
 *
 * Relations use Prisma connect syntax rather than unchecked
 * scalar foreign-key assignment.
 */
export function mapCreateQuotationToPrismaData(
  input:
    CreateQuotationInput,
  context:
    QuotationCreatePersistenceContext
): Prisma.QuotationCreateInput {
  const quotationNumber =
    context.quotationNumber
      .trim();

  const referenceId =
    context.referenceId
      .trim();

  const pickupDate =
    mapCreateQuotationDateToPrisma(
      input.pickupDate
    );

  const deliveryDate =
    mapCreateQuotationDateToPrisma(
      input.deliveryDate
    );

  const validUntil =
    mapCreateQuotationDateToPrisma(
      input.validUntil
    );

  const pricingBreakdown =
    mapQuotationJsonToPrisma(
      input.pricingBreakdown
    );

  const termsJson =
    mapQuotationJsonToPrisma(
      input.terms
    );

  const inclusionsJson =
    mapQuotationJsonToPrisma(
      input.inclusions
    );

  const exclusionsJson =
    mapQuotationJsonToPrisma(
      input.exclusions
    );

  const data:
    Prisma.QuotationCreateInput = {
      ...(context.quotationId
        ? {
            id:
              context.quotationId,
          }
        : {}),

      quotationNumber,

      referenceId,

      /* --------------------------------------------------------------------
       * Required relations
       * --------------------------------------------------------------------
       */

      lead: {
        connect: {
          id:
            input.leadId,
        },
      },

      booking: {
        connect: {
          id:
            input.bookingId,
        },
      },

      vendor: {
        connect: {
          id:
            input.vendorId,
        },
      },

      /* --------------------------------------------------------------------
       * Optional User relation
       * --------------------------------------------------------------------
       */

      ...(input.userId
        ? {
            user: {
              connect: {
                id:
                  input.userId,
              },
            },
          }
        : {}),

      /* --------------------------------------------------------------------
       * Pricing
       * --------------------------------------------------------------------
       */

      transportationCost:
        mapQuotationAmountToPrisma(
          input.transportationCost
        ),

      packingCost:
        mapQuotationAmountToPrisma(
          input.packingCost
        ),

      unpackingCost:
        mapQuotationAmountToPrisma(
          input.unpackingCost
        ),

      labourCost:
        mapQuotationAmountToPrisma(
          input.labourCost
        ),

      insuranceCost:
        mapQuotationAmountToPrisma(
          input.insuranceCost
        ),

      otherCost:
        mapQuotationAmountToPrisma(
          input.otherCost
        ),

      discountAmount:
        mapQuotationAmountToPrisma(
          input.discountAmount
        ),

      taxAmount:
        mapQuotationAmountToPrisma(
          input.taxAmount
        ),

      totalAmount:
        resolveQuotationCreateTotalAmount(
          input
        ),

      currency:
        input.currency ??
        QuotationCurrency.INR,

      /* --------------------------------------------------------------------
       * Schedule
       * --------------------------------------------------------------------
       */

      ...(pickupDate
        ? {
            pickupDate,
          }
        : {}),

      ...(deliveryDate
        ? {
            deliveryDate,
          }
        : {}),

      ...(input.transitDays !==
      undefined
        ? {
            transitDays:
              input.transitDays,
          }
        : {}),

      /* --------------------------------------------------------------------
       * Workflow
       * --------------------------------------------------------------------
       */

      status:
        mapQuotationStatusToPrisma(
          input.status
        ),

      ...(validUntil
        ? {
            validUntil,
          }
        : {}),

      /* --------------------------------------------------------------------
       * Structured commercial JSON
       *
       * Exact Prisma column names:
       * pricingBreakdown
       * termsJson
       * inclusionsJson
       * exclusionsJson
       * --------------------------------------------------------------------
       */

      ...(pricingBreakdown !==
      undefined
        ? {
            pricingBreakdown,
          }
        : {}),

      ...(termsJson !==
      undefined
        ? {
            termsJson,
          }
        : {}),

      ...(inclusionsJson !==
      undefined
        ? {
            inclusionsJson,
          }
        : {}),

      ...(exclusionsJson !==
      undefined
        ? {
            exclusionsJson,
          }
        : {}),

      /* --------------------------------------------------------------------
       * Remarks
       * --------------------------------------------------------------------
       */

      ...(input.remarks
        ? {
            remarks:
              input.remarks
                .trim(),
          }
        : {}),

      ...(input.internalRemarks
        ? {
            internalRemarks:
              input.internalRemarks
                .trim(),
          }
        : {}),
    };

  return data;
}

/* ============================================================================
 * UpdateQuotationInput -> Prisma update data
 * ============================================================================
 */

/**
 * Maps validated UpdateQuotationInput into Prisma.QuotationUpdateInput.
 *
 * Identity and relationships are deliberately not editable through
 * UpdateQuotationInput.
 */
export function mapUpdateQuotationToPrismaData(
  input:
    UpdateQuotationInput
): Prisma.QuotationUpdateInput {
  const data:
    Prisma.QuotationUpdateInput = {};

  /* ------------------------------------------------------------------------
   * Pricing
   * ------------------------------------------------------------------------
   */

  if (
    input.transportationCost !==
      undefined
  ) {
    data.transportationCost =
      mapQuotationAmountToPrisma(
        input.transportationCost
      );
  }

  if (
    input.packingCost !==
      undefined
  ) {
    data.packingCost =
      mapQuotationAmountToPrisma(
        input.packingCost
      );
  }

  if (
    input.unpackingCost !==
      undefined
  ) {
    data.unpackingCost =
      mapQuotationAmountToPrisma(
        input.unpackingCost
      );
  }

  if (
    input.labourCost !==
      undefined
  ) {
    data.labourCost =
      mapQuotationAmountToPrisma(
        input.labourCost
      );
  }

  if (
    input.insuranceCost !==
      undefined
  ) {
    data.insuranceCost =
      mapQuotationAmountToPrisma(
        input.insuranceCost
      );
  }

  if (
    input.otherCost !==
      undefined
  ) {
    data.otherCost =
      mapQuotationAmountToPrisma(
        input.otherCost
      );
  }

  if (
    input.discountAmount !==
      undefined
  ) {
    data.discountAmount =
      mapQuotationAmountToPrisma(
        input.discountAmount
      );
  }

  if (
    input.taxAmount !==
      undefined
  ) {
    data.taxAmount =
      mapQuotationAmountToPrisma(
        input.taxAmount
      );
  }

  if (
    input.totalAmount !==
      undefined
  ) {
    data.totalAmount =
      mapQuotationAmountToPrisma(
        input.totalAmount
      );
  }

  if (
    input.currency !==
      undefined
  ) {
    data.currency =
      input.currency;
  }

  /* ------------------------------------------------------------------------
   * Schedule
   * ------------------------------------------------------------------------
   */

  if (
    input.pickupDate !==
      undefined
  ) {
    data.pickupDate =
      mapUpdateQuotationDateToPrisma(
        input.pickupDate
      );
  }

  if (
    input.deliveryDate !==
      undefined
  ) {
    data.deliveryDate =
      mapUpdateQuotationDateToPrisma(
        input.deliveryDate
      );
  }

  if (
    input.transitDays !==
      undefined
  ) {
    data.transitDays =
      input.transitDays;
  }

  if (
    input.validUntil !==
      undefined
  ) {
    data.validUntil =
      mapUpdateQuotationDateToPrisma(
        input.validUntil
      );
  }

  /* ------------------------------------------------------------------------
   * Structured JSON
   * ------------------------------------------------------------------------
   */

  if (
    input.pricingBreakdown !==
      undefined
  ) {
    data.pricingBreakdown =
      mapNullableQuotationJsonToPrisma(
        input.pricingBreakdown
      );
  }

  if (
    input.terms !==
      undefined
  ) {
    data.termsJson =
      mapNullableQuotationJsonToPrisma(
        input.terms
      );
  }

  if (
    input.inclusions !==
      undefined
  ) {
    data.inclusionsJson =
      mapNullableQuotationJsonToPrisma(
        input.inclusions
      );
  }

  if (
    input.exclusions !==
      undefined
  ) {
    data.exclusionsJson =
      mapNullableQuotationJsonToPrisma(
        input.exclusions
      );
  }

  /* ------------------------------------------------------------------------
   * Remarks
   * ------------------------------------------------------------------------
   */

  if (
    input.remarks !==
      undefined
  ) {
    data.remarks =
      input.remarks ===
        null
        ? null
        : input.remarks.trim();
  }

  if (
    input.internalRemarks !==
      undefined
  ) {
    data.internalRemarks =
      input.internalRemarks ===
        null
        ? null
        : input.internalRemarks
            .trim();
  }

  /**
   * input.updatedBy is intentionally NOT mapped.
   *
   * Current Prisma Quotation has no updatedBy column.
   */

  return data;
}

/* ============================================================================
 * Status-only Prisma update mapping
 * ============================================================================
 */

/**
 * Produces a small update object for workflow status operations.
 */
export function mapQuotationStatusUpdateToPrismaData(
  status:
    QuotationStatus
): Prisma.QuotationUpdateInput {
  return {
    status:
      mapQuotationStatusToPrisma(
        status
      ),
  };
}

/* ============================================================================
 * User relation update mapping
 * ============================================================================
 */

/**
 * Optional helper for future authorized workflows that explicitly
 * change the user associated with a quotation.
 *
 * This is deliberately not part of UpdateQuotationInput.
 */
export function mapQuotationUserRelationToPrisma(
  userId:
    string | null
): Pick<
  Prisma.QuotationUpdateInput,
  "user"
> {
  if (
    userId ===
      null
  ) {
    return {
      user: {
        disconnect:
          true,
      },
    };
  }

  return {
    user: {
      connect: {
        id:
          userId,
      },
    },
  };
}

/* ============================================================================
 * Selected quotation relation helpers
 * ============================================================================
 */

/**
 * IMPORTANT:
 *
 * Selection is controlled from Booking.selectedQuotation.
 *
 * The Quotation.selectedForBooking field is the reverse relation and
 * should not independently own selection state.
 *
 * Therefore Part C does NOT provide a general quotation-update mapper
 * that mutates selectedForBooking.
 */

/* ============================================================================
 * Write mapper facade
 * ============================================================================
 */

export const QuotationWriteMapper = {
  toCreateData:
    mapCreateQuotationToPrismaData,

  toUpdateData:
    mapUpdateQuotationToPrismaData,

  toStatusUpdateData:
    mapQuotationStatusUpdateToPrismaData,

  userRelation:
    mapQuotationUserRelationToPrisma,

  amount:
    mapQuotationAmountToPrisma,

  json:
    mapQuotationJsonToPrisma,

  nullableJson:
    mapNullableQuotationJsonToPrisma,

  createDate:
    mapCreateQuotationDateToPrisma,

  updateDate:
    mapUpdateQuotationDateToPrisma,

  status:
    mapQuotationStatusToPrisma,
} as const;

/* ============================================================================
 * Complete mapper facade
 * ============================================================================
 */

/**
 * Unified facade for future repository/service consumers.
 */
export const QuotationMapper = {
  read:
    QuotationReadMapper,

  write:
    QuotationWriteMapper,

  fromPersistence:
    mapQuotationPersistenceToDomain,

  toCustomerSafe:
    mapQuotationToCustomerSafe,

  toListItem:
    mapQuotationToListItem,

  toCreateData:
    mapCreateQuotationToPrismaData,

  toUpdateData:
    mapUpdateQuotationToPrismaData,

  toStatusUpdateData:
    mapQuotationStatusUpdateToPrismaData,
} as const;

/* ============================================================================
 * End of Part C
 * ============================================================================
 */
/* ============================================================================
 * EasyMovers
 * Quotation Mapper
 * Part D
 * ============================================================================
 *
 * Responsibilities:
 * - Map QuotationSearchCriteria -> Prisma.QuotationWhereInput
 * - Map QuotationSort -> Prisma.QuotationOrderByWithRelationInput
 * - Map pagination -> skip/take
 * - Map paginated domain results
 * - Build Booking quotation comparison
 * - Preserve customer-safe Vendor masking
 * ============================================================================
 */

import type {
  BookingQuotationComparison,
  PaginatedQuotationResult,
  QuotationComparisonItem,
  QuotationListQuery,
  QuotationPaginationInput,
  QuotationPaginationMetadata,
  QuotationSearchCriteria,
  QuotationSort,
} from "../models/quotation.model";

/* ============================================================================
 * Pagination persistence contract
 * ============================================================================
 */

export interface QuotationPrismaPagination {
  skip:
    number;

  take:
    number;
}

/* ============================================================================
 * Pagination mapper
 * ============================================================================
 */

/**
 * Converts domain pagination into Prisma skip/take.
 */
export function mapQuotationPaginationToPrisma(
  pagination:
    QuotationPaginationInput
): QuotationPrismaPagination {
  const page =
    Number.isInteger(
      pagination.page
    ) &&
    pagination.page >
      0
      ? pagination.page
      : 1;

  const pageSize =
    Number.isInteger(
      pagination.pageSize
    ) &&
    pagination.pageSize >
      0
      ? pagination.pageSize
      : 20;

  return {
    skip:
      (
        page -
        1
      ) *
      pageSize,

    take:
      pageSize,
  };
}

/* ============================================================================
 * Pagination metadata
 * ============================================================================
 */

/**
 * Builds response pagination metadata.
 */
export function mapQuotationPaginationMetadata(
  pagination:
    QuotationPaginationInput,
  totalItems:
    number
): QuotationPaginationMetadata {
  const page =
    pagination.page;

  const pageSize =
    pagination.pageSize;

  const normalizedTotalItems =
    Math.max(
      0,
      totalItems
    );

  const totalPages =
    pageSize >
      0
      ? Math.ceil(
          normalizedTotalItems /
          pageSize
        )
      : 0;

  return {
    page,

    pageSize,

    totalItems:
      normalizedTotalItems,

    totalPages,

    hasNextPage:
      page <
      totalPages,

    hasPreviousPage:
      page >
      1,
  };
}

/* ============================================================================
 * Prisma date filter helpers
 * ============================================================================
 */

/**
 * Creates a Prisma DateTimeFilter from optional date range strings.
 */
export function mapQuotationDateRangeToPrisma(
  from?:
    string,
  until?:
    string
): Prisma.DateTimeFilter | undefined {
  const filter:
    Prisma.DateTimeFilter =
      {};

  const fromDate =
    mapCreateQuotationDateToPrisma(
      from
    );

  const untilDate =
    mapCreateQuotationDateToPrisma(
      until
    );

  if (
    fromDate
  ) {
    filter.gte =
      fromDate;
  }

  if (
    untilDate
  ) {
    filter.lte =
      untilDate;
  }

  return Object.keys(
    filter
  ).length >
    0
    ? filter
    : undefined;
}

/* ============================================================================
 * Prisma amount filter helper
 * ============================================================================
 */

export function mapQuotationAmountRangeToPrisma(
  minimumAmount?:
    number,
  maximumAmount?:
    number
): Prisma.DecimalFilter | undefined {
  const filter:
    Prisma.DecimalFilter =
      {};

  if (
    minimumAmount !==
      undefined
  ) {
    filter.gte =
      mapQuotationAmountToPrisma(
        minimumAmount
      );
  }

  if (
    maximumAmount !==
      undefined
  ) {
    filter.lte =
      mapQuotationAmountToPrisma(
        maximumAmount
      );
  }

  return Object.keys(
    filter
  ).length >
    0
    ? filter
    : undefined;
}

/* ============================================================================
 * Search criteria -> Prisma where
 * ============================================================================
 */
export function mapQuotationCreatedAtRangeToPrisma(
  createdFrom?:
    string,
  createdUntil?:
    string
): Prisma.DateTimeFilter | undefined {
  if (
    !createdFrom &&
    !createdUntil
  ) {
    return undefined;
  }

  const filter:
    Prisma.DateTimeFilter = {};

  if (
    createdFrom
  ) {
    const from =
      /^\d{4}-\d{2}-\d{2}$/.test(
        createdFrom
      )
        ? new Date(
            `${createdFrom}T00:00:00.000Z`
          )
        : new Date(
            createdFrom
          );

    if (
      !Number.isNaN(
        from.getTime()
      )
    ) {
      filter.gte =
        from;
    }
  }

  if (
    createdUntil
  ) {
    /*
     * A date-only upper boundary must include the entire calendar day.
     *
     * Example:
     * createdUntil=2026-08-14
     *
     * means:
     * createdAt < 2026-08-15T00:00:00.000Z
     *
     * Using an exclusive next-day boundary is safer than relying on
     * 23:59:59.999 precision.
     */
    if (
      /^\d{4}-\d{2}-\d{2}$/.test(
        createdUntil
      )
    ) {
      const nextDay =
        new Date(
          `${createdUntil}T00:00:00.000Z`
        );

      if (
        !Number.isNaN(
          nextDay.getTime()
        )
      ) {
        nextDay.setUTCDate(
          nextDay.getUTCDate() +
            1
        );

        filter.lt =
          nextDay;
      }
    } else {
      const until =
        new Date(
          createdUntil
        );

      if (
        !Number.isNaN(
          until.getTime()
        )
      ) {
        filter.lte =
          until;
      }
    }
  }

  return Object.keys(
    filter
  ).length >
    0
    ? filter
    : undefined;
}
export function mapQuotationSearchCriteriaToPrisma(
  criteria:
    QuotationSearchCriteria
): Prisma.QuotationWhereInput {
  const where:
    Prisma.QuotationWhereInput =
      {};

  if (
    criteria.quotationId
  ) {
    where.id =
      criteria.quotationId;
  }

  if (
    criteria.quotationNumber
  ) {
    where.quotationNumber =
      criteria.quotationNumber;
  }

  if (
    criteria.referenceId
  ) {
    where.referenceId =
      criteria.referenceId;
  }

  if (
    criteria.leadId
  ) {
    where.leadId =
      criteria.leadId;
  }

  if (
    criteria.bookingId
  ) {
    where.bookingId =
      criteria.bookingId;
  }

  if (
    criteria.vendorId
  ) {
    where.vendorId =
      criteria.vendorId;
  }

  if (
    criteria.userId
  ) {
    where.userId =
      criteria.userId;
  }

  if (
    criteria.status
  ) {
    where.status =
      mapQuotationStatusToPrisma(
        criteria.status
      );
  }

  if (
    criteria.statuses &&
    criteria.statuses.length >
      0
  ) {
    where.status = {
      in:
        criteria.statuses.map(
          (
            status
          ) =>
            mapQuotationStatusToPrisma(
              status
            )
        ),
    };
  }

  const totalAmountFilter =
    mapQuotationAmountRangeToPrisma(
      criteria.minimumAmount,
      criteria.maximumAmount
    );

  if (
    totalAmountFilter
  ) {
    where.totalAmount =
      totalAmountFilter;
  }

  const validUntilFilter =
    mapQuotationDateRangeToPrisma(
      criteria.validFrom,
      criteria.validUntil
    );

  if (
    validUntilFilter
  ) {
    where.validUntil =
      validUntilFilter;
  }

  const pickupDateFilter =
    mapQuotationDateRangeToPrisma(
      criteria.pickupDateFrom,
      criteria.pickupDateTo
    );

  if (
    pickupDateFilter
  ) {
    where.pickupDate =
      pickupDateFilter;
  }

 const createdAtFilter =
  mapQuotationCreatedAtRangeToPrisma(
    criteria.createdFrom,
    criteria.createdUntil
  );

if (
  createdAtFilter
) {
  where.createdAt =
    createdAtFilter;
}
  /* ------------------------------------------------------------------------
   * selectedForBooking filter
   * ------------------------------------------------------------------------
   */

  if (
    criteria.selectedForBooking ===
      true
  ) {
    where.selectedForBooking = {
      isNot:
        null,
    };
  }

  if (
    criteria.selectedForBooking ===
      false
  ) {
    where.selectedForBooking = {
      is:
        null,
    };
  }

  /* ------------------------------------------------------------------------
   * Free-text search
   * ------------------------------------------------------------------------
   */

  if (
    criteria.search
  ) {
    const search =
      criteria.search
        .trim();

    if (
      search
    ) {
      const textSearch:
        Prisma.QuotationWhereInput = {
        OR: [
          {
            quotationNumber: {
              contains:
                search,

              mode:
                "insensitive",
            },
          },

          {
            referenceId: {
              contains:
                search,

              mode:
                "insensitive",
            },
          },

          {
            remarks: {
              contains:
                search,

              mode:
                "insensitive",
            },
          },

          {
            internalRemarks: {
              contains:
                search,

              mode:
                "insensitive",
            },
          },
        ],
      };

      if (
        Array.isArray(
          where.AND
        )
      ) {
        where.AND.push(
          textSearch
        );
      } else if (
        where.AND
      ) {
        where.AND = [
          where.AND,
          textSearch,
        ];
      } else {
        where.AND = [
          textSearch,
        ];
      }
    }
  }

  return where;
}

/* ============================================================================
 * Sort -> Prisma orderBy
 * ============================================================================
 */

export function mapQuotationSortToPrisma(
  sort:
    QuotationSort
): Prisma.QuotationOrderByWithRelationInput {
  const direction =
    sort.direction;

  switch (
    sort.field
  ) {
    case "updatedAt":
      return {
        updatedAt:
          direction,
      };

    case "totalAmount":
      return {
        totalAmount:
          direction,
      };

    case "validUntil":
      return {
        validUntil:
          direction,
      };

    case "pickupDate":
      return {
        pickupDate:
          direction,
      };

    case "deliveryDate":
      return {
        deliveryDate:
          direction,
      };

    case "status":
      return {
        status:
          direction,
      };

    case "createdAt":
    default:
      return {
        createdAt:
          direction,
      };
  }
}

/* ============================================================================
 * Complete list query -> Prisma query options
 * ============================================================================
 */

export interface QuotationPrismaListQuery {
  where:
    Prisma.QuotationWhereInput;

  orderBy:
    Prisma.QuotationOrderByWithRelationInput;

  skip:
    number;

  take:
    number;
}

export function mapQuotationListQueryToPrisma(
  query:
    QuotationListQuery
): QuotationPrismaListQuery {
  const pagination =
    query.pagination ?? {
      page:
        1,

      pageSize:
        20,
    };

  const sort =
    query.sort ?? {
      field:
        "createdAt",

      direction:
        "desc",
    };

  const prismaPagination =
    mapQuotationPaginationToPrisma(
      pagination
    );

  return {
    where:
      mapQuotationSearchCriteriaToPrisma(
        query.criteria ??
          {}
      ),

    orderBy:
      mapQuotationSortToPrisma(
        sort
      ),

    skip:
      prismaPagination
        .skip,

    take:
      prismaPagination
        .take,
  };
}

/* ============================================================================
 * Paginated result mapping
 * ============================================================================
 */

export function mapPaginatedQuotationResult<
  T
>(
  items:
    T[],
  pagination:
    QuotationPaginationInput,
  totalItems:
    number
): PaginatedQuotationResult<
  T
> {
  return {
    items,

    pagination:
      mapQuotationPaginationMetadata(
        pagination,
        totalItems
      ),
  };
}

/* ============================================================================
 * Quotation comparison item mapping
 * ============================================================================
 */

/**
 * Converts a customer-safe quotation into a comparison row.
 *
 * Vendor identity is not present in CustomerSafeQuotation,
 * therefore this mapping remains safe by construction.
 */
export function mapQuotationToComparisonItem(
  quotation:
    CustomerSafeQuotation
): QuotationComparisonItem {
  return {
    quotationId:
      quotation.quotationId,

    quotationNumber:
      quotation.quotationNumber,

    totalAmount:
      quotation.costs
        .totalAmount,

    currency:
      quotation.costs
        .currency,

    ...(quotation.schedule
      .pickupDate
      ? {
          pickupDate:
            quotation.schedule
              .pickupDate,
        }
      : {}),

    ...(quotation.schedule
      .deliveryDate
      ? {
          deliveryDate:
            quotation.schedule
              .deliveryDate,
        }
      : {}),

    ...(quotation.schedule
      .transitDays !==
      undefined
      ? {
          transitDays:
            quotation.schedule
              .transitDays,
        }
      : {}),

    ...(quotation.validUntil
      ? {
          validUntil:
            quotation.validUntil,
        }
      : {}),

    ...(quotation.inclusions
      ? {
          inclusions:
            [
              ...quotation
                .inclusions
                .items,
            ],
        }
      : {}),

    ...(quotation.exclusions
      ? {
          exclusions:
            [
              ...quotation
                .exclusions
                .items,
            ],
        }
      : {}),

    selected:
      quotation
        .selectedForBooking,
  };
}

/* ============================================================================
 * Booking comparison mapping
 * ============================================================================
 */

/**
 * Builds one customer-safe Booking quotation comparison.
 *
 * The function accepts internal Quotation aggregates but immediately
 * passes them through the customer-safe mapper so Vendor information
 * cannot leak into the comparison response.
 */
export function mapBookingQuotationComparison(
  bookingId:
    BookingId,
  quotations:
    Quotation[]
): BookingQuotationComparison {
  const bookingQuotations =
    quotations.filter(
      (
        quotation
      ) =>
        quotation.booking
          .bookingId ===
        bookingId
    );

  const customerSafe =
    mapQuotationsToCustomerSafe(
      bookingQuotations
    );

  const comparisonItems =
    customerSafe.map(
      (
        quotation
      ) =>
        mapQuotationToComparisonItem(
          quotation
        )
    );

  const amounts =
    comparisonItems.map(
      (
        quotation
      ) =>
        quotation.totalAmount
    );

  const selectedQuotation =
    comparisonItems.find(
      (
        quotation
      ) =>
        quotation.selected
    );

  return {
    bookingId,

    totalQuotations:
      comparisonItems.length,

    ...(amounts.length >
      0
      ? {
          lowestAmount:
            Math.min(
              ...amounts
            ),

          highestAmount:
            Math.max(
              ...amounts
            ),
        }
      : {}),

    ...(selectedQuotation
      ? {
          selectedQuotationId:
            selectedQuotation
              .quotationId,
        }
      : {}),

    quotations:
      comparisonItems,
  };
}

/* ============================================================================
 * Persistence records -> Booking comparison
 * ============================================================================
 */

export function mapQuotationPersistenceManyToComparison(
  bookingId:
    BookingId,
  records:
    QuotationMapperPersistenceInput[]
): QuotationMapperResult<
  BookingQuotationComparison
> {
  const quotations:
    Quotation[] =
      [];

  const warnings:
    string[] =
      [];

  for (
    const record
    of records
  ) {
    const mapped =
      mapQuotationPersistenceToDomain(
        record
      );

    if (
      !mapped.success
    ) {
      return createQuotationMapperFailure(
        mapped.error,
        [
          ...warnings,
          ...mapped.warnings,
        ]
      );
    }

    quotations.push(
      mapped.value
    );

    warnings.push(
      ...mapped.warnings
    );
  }

  return createQuotationMapperSuccess(
    mapBookingQuotationComparison(
      bookingId,
      quotations
    ),
    warnings
  );
}

/* ============================================================================
 * Search mapper facade
 * ============================================================================
 */

export const QuotationQueryMapper = {
  criteriaToWhere:
    mapQuotationSearchCriteriaToPrisma,

  sortToOrderBy:
    mapQuotationSortToPrisma,

  paginationToPrisma:
    mapQuotationPaginationToPrisma,

  listQueryToPrisma:
    mapQuotationListQueryToPrisma,

  paginationMetadata:
    mapQuotationPaginationMetadata,

  paginatedResult:
    mapPaginatedQuotationResult,

  toComparisonItem:
    mapQuotationToComparisonItem,

  toBookingComparison:
    mapBookingQuotationComparison,

  persistenceManyToComparison:
    mapQuotationPersistenceManyToComparison,
} as const;

/* ============================================================================
 * Extend unified mapper facade
 * ============================================================================
 */

/**
 * Full Quotation mapper facade after Parts A-D.
 */
export const CompleteQuotationMapper = {
  read:
    QuotationReadMapper,

  write:
    QuotationWriteMapper,

  query:
    QuotationQueryMapper,

  fromPersistence:
    mapQuotationPersistenceToDomain,

  toCustomerSafe:
    mapQuotationToCustomerSafe,

  toListItem:
    mapQuotationToListItem,

  toCreateData:
    mapCreateQuotationToPrismaData,

  toUpdateData:
    mapUpdateQuotationToPrismaData,

  toStatusUpdateData:
    mapQuotationStatusUpdateToPrismaData,

  searchCriteriaToPrisma:
    mapQuotationSearchCriteriaToPrisma,

  listQueryToPrisma:
    mapQuotationListQueryToPrisma,

  toBookingComparison:
    mapBookingQuotationComparison,
} as const;

/* ============================================================================
 * End of quotation.mapper.ts
 * ============================================================================
 */