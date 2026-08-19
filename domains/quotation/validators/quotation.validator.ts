/**
 * ============================================================================
 * EasyMovers
 * Quotation Validator
 * Part A
 * ============================================================================
 *
 * File:
 * domains/quotation/validators/quotation.validator.ts
 *
 * Responsibilities:
 * - Define Quotation validation contracts
 * - Provide reusable validation helpers
 * - Validate primitive identifiers, strings, numbers and dates
 * - Validate Quotation enum values
 * - Build normalized validation success / failure results
 *
 * Later parts will add:
 * - CreateQuotationInput validation
 * - UpdateQuotationInput validation
 * - Quotation status transition validation
 * - Selection / rejection / withdrawal validation
 * - Search and pagination validation
 * - Commercial JSON validation
 * ============================================================================
 */

import {
  QuotationActorType,
  QuotationChargeType,
  QuotationCurrency,
  QuotationStatus,
} from "../models/quotation.model";

import type {
  BookingQuotationComparison,
  CreateQuotationInput,
  QuotationChargeItem,
  QuotationDiscountDetails,
  QuotationExclusions,
  QuotationInclusions,
  QuotationListQuery,
  QuotationPaginationInput,
  QuotationPricingBreakdown,
  QuotationSearchCriteria,
  QuotationSort,
  QuotationSortDirection,
  QuotationSortField,
  QuotationTaxDetails,
  QuotationTerms,
  RejectQuotationInput,
  SelectQuotationInput,
  UnselectQuotationInput,
  UpdateQuotationInput,
  UpdateQuotationStatusInput,
  WithdrawQuotationInput,
} from "../models/quotation.model";

/* ============================================================================
 * Validation error codes
 * ============================================================================
 */

/**
 * Stable validation codes returned by the Quotation domain.
 *
 * These codes are deliberately independent from HTTP status codes.
 * Controllers may later translate them into 400 / 404 / 409 responses.
 */
export enum QuotationValidationErrorCode {
  REQUIRED =
    "REQUIRED",

  INVALID =
    "INVALID",

  INVALID_TYPE =
    "INVALID_TYPE",

  INVALID_FORMAT =
    "INVALID_FORMAT",

  INVALID_VALUE =
    "INVALID_VALUE",

  INVALID_LENGTH =
    "INVALID_LENGTH",

  OUT_OF_RANGE =
    "OUT_OF_RANGE",

  NEGATIVE_AMOUNT =
    "NEGATIVE_AMOUNT",

  INVALID_DATE =
    "INVALID_DATE",

  INVALID_DATE_RANGE =
    "INVALID_DATE_RANGE",

  INVALID_STATUS =
    "INVALID_STATUS",

  INVALID_STATUS_TRANSITION =
    "INVALID_STATUS_TRANSITION",

  INVALID_CURRENCY =
    "INVALID_CURRENCY",

  INVALID_CHARGE_TYPE =
    "INVALID_CHARGE_TYPE",

  INVALID_ACTOR_TYPE =
    "INVALID_ACTOR_TYPE",

  DUPLICATE =
    "DUPLICATE",

  BUSINESS_RULE =
    "BUSINESS_RULE",
}

/* ============================================================================
 * Validation issue contracts
 * ============================================================================
 */

/**
 * One validation issue.
 */
export interface QuotationValidationError {
  field:
    string;

  code:
    QuotationValidationErrorCode;

  message:
    string;

  value?:
    unknown;
}

/**
 * Optional non-blocking validation warning.
 */
export interface QuotationValidationWarning {
  field:
    string;

  code:
    string;

  message:
    string;

  value?:
    unknown;
}

/**
 * Successful validation result.
 */
export interface QuotationValidationSuccess<
  T
> {
  valid:
    true;

  value:
    T;

  errors:
    [];

  warnings:
    QuotationValidationWarning[];
}

/**
 * Failed validation result.
 */
export interface QuotationValidationFailure {
  valid:
    false;

  errors:
    QuotationValidationError[];

  warnings:
    QuotationValidationWarning[];
}

/**
 * Shared validator result.
 */
export type QuotationValidationResult<
  T
> =
  | QuotationValidationSuccess<T>
  | QuotationValidationFailure;

/* ============================================================================
 * Validation options
 * ============================================================================
 */

export interface StringValidationOptions {
  required?:
    boolean;

  minimumLength?:
    number;

  maximumLength?:
    number;

  trim?:
    boolean;

  allowEmpty?:
    boolean;
}

export interface NumberValidationOptions {
  required?:
    boolean;

  minimum?:
    number;

  maximum?:
    number;

  integer?:
    boolean;

  allowZero?:
    boolean;
}

export interface DateValidationOptions {
  required?:
    boolean;

  allowPast?:
    boolean;

  allowToday?:
    boolean;
}

/* ============================================================================
 * Constants
 * ============================================================================
 */

/**
 * General identifier limit.
 *
 * Prisma-generated IDs are normally far shorter than this,
 * but keeping the validator generous avoids unnecessary coupling.
 */
export const QUOTATION_IDENTIFIER_MAX_LENGTH =
  191;

/**
 * General free-text limits.
 */
export const QUOTATION_SHORT_TEXT_MAX_LENGTH =
  255;

export const QUOTATION_LONG_TEXT_MAX_LENGTH =
  5000;

/**
 * Maximum commercially reasonable amount accepted by the
 * domain validator.
 *
 * This is intentionally generous and is not a pricing rule.
 */
export const QUOTATION_MAX_AMOUNT =
  100_000_000;

/**
 * Pagination protection.
 */
export const QUOTATION_DEFAULT_PAGE =
  1;

export const QUOTATION_DEFAULT_PAGE_SIZE =
  20;

export const QUOTATION_MAX_PAGE_SIZE =
  100;

/* ============================================================================
 * Enum value collections
 * ============================================================================
 */

const QUOTATION_STATUS_VALUES =
  new Set<string>(
    Object.values(
      QuotationStatus
    )
  );

const QUOTATION_CURRENCY_VALUES =
  new Set<string>(
    Object.values(
      QuotationCurrency
    )
  );

const QUOTATION_CHARGE_TYPE_VALUES =
  new Set<string>(
    Object.values(
      QuotationChargeType
    )
  );

const QUOTATION_ACTOR_TYPE_VALUES =
  new Set<string>(
    Object.values(
      QuotationActorType
    )
  );

/* ============================================================================
 * Result factories
 * ============================================================================
 */

/**
 * Creates a successful validation result.
 */
export function createQuotationValidationSuccess<
  T
>(
  value:
    T,
  warnings:
    QuotationValidationWarning[] =
      []
): QuotationValidationSuccess<T> {
  return {
    valid:
      true,

    value,

    errors:
      [],

    warnings,
  };
}

/**
 * Creates a failed validation result.
 */
export function createQuotationValidationFailure(
  errors:
    QuotationValidationError[],
  warnings:
    QuotationValidationWarning[] =
      []
): QuotationValidationFailure {
  return {
    valid:
      false,

    errors,

    warnings,
  };
}

/**
 * Creates one validation error.
 */
export function quotationValidationError(
  field:
    string,
  code:
    QuotationValidationErrorCode,
  message:
    string,
  value?:
    unknown
): QuotationValidationError {
  return {
    field,
    code,
    message,

    ...(value !==
    undefined
      ? {
          value,
        }
      : {}),
  };
}

/**
 * Creates one non-blocking warning.
 */
export function quotationValidationWarning(
  field:
    string,
  code:
    string,
  message:
    string,
  value?:
    unknown
): QuotationValidationWarning {
  return {
    field,
    code,
    message,

    ...(value !==
    undefined
      ? {
          value,
        }
      : {}),
  };
}

/* ============================================================================
 * General guards
 * ============================================================================
 */

/**
 * Determines whether a value is a plain JSON-style object.
 */
export function isQuotationObject(
  value:
    unknown
): value is Record<
  string,
  unknown
> {
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

/**
 * Determines whether a value is undefined or null.
 */
export function isQuotationMissing(
  value:
    unknown
): boolean {
  return (
    value ===
      undefined ||
    value ===
      null
  );
}

/**
 * Determines whether a value is an empty string after trimming.
 */
export function isQuotationEmptyString(
  value:
    unknown
): boolean {
  return (
    typeof value ===
      "string" &&
    value.trim()
      .length ===
      0
  );
}

/**
 * Determines whether a value is effectively absent.
 */
export function isQuotationBlank(
  value:
    unknown
): boolean {
  return (
    isQuotationMissing(
      value
    ) ||
    isQuotationEmptyString(
      value
    )
  );
}

/* ============================================================================
 * String normalization
 * ============================================================================
 */

/**
 * Returns a trimmed non-empty string or undefined.
 */
export function normalizeQuotationString(
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

/**
 * Returns a trimmed string while preserving explicit null.
 *
 * Useful for UpdateQuotationInput fields where null means
 * "clear this persisted value".
 */
export function normalizeNullableQuotationString(
  value:
    unknown
): string | null | undefined {
  if (
    value ===
      null
  ) {
    return null;
  }

  return normalizeQuotationString(
    value
  );
}

/* ============================================================================
 * Primitive validators
 * ============================================================================
 */

/**
 * Validates one string field.
 */
export function validateQuotationString(
  field:
    string,
  value:
    unknown,
  options:
    StringValidationOptions =
      {}
): QuotationValidationError[] {
  const errors:
    QuotationValidationError[] =
      [];

  const {
    required =
      false,

    minimumLength =
      0,

    maximumLength =
      QUOTATION_LONG_TEXT_MAX_LENGTH,

    allowEmpty =
      false,
  } =
    options;

  if (
    isQuotationMissing(
      value
    )
  ) {
    if (
      required
    ) {
      errors.push(
        quotationValidationError(
          field,
          QuotationValidationErrorCode
            .REQUIRED,
          `${field} is required.`
        )
      );
    }

    return errors;
  }

  if (
    typeof value !==
    "string"
  ) {
    errors.push(
      quotationValidationError(
        field,
        QuotationValidationErrorCode
          .INVALID_TYPE,
        `${field} must be a string.`,
        value
      )
    );

    return errors;
  }

  const normalized =
    value.trim();

  if (
    normalized.length ===
      0 &&
    !allowEmpty
  ) {
    errors.push(
      quotationValidationError(
        field,
        required
          ? QuotationValidationErrorCode
              .REQUIRED
          : QuotationValidationErrorCode
              .INVALID_VALUE,
        required
          ? `${field} is required.`
          : `${field} cannot be empty.`,
        value
      )
    );

    return errors;
  }

  if (
    normalized.length <
    minimumLength
  ) {
    errors.push(
      quotationValidationError(
        field,
        QuotationValidationErrorCode
          .INVALID_LENGTH,
        `${field} must contain at least ${minimumLength} characters.`,
        value
      )
    );
  }

  if (
    normalized.length >
    maximumLength
  ) {
    errors.push(
      quotationValidationError(
        field,
        QuotationValidationErrorCode
          .INVALID_LENGTH,
        `${field} cannot exceed ${maximumLength} characters.`,
        value
      )
    );
  }

  return errors;
}

/**
 * Validates one system identifier.
 */
export function validateQuotationIdentifier(
  field:
    string,
  value:
    unknown,
  required =
    true
): QuotationValidationError[] {
  return validateQuotationString(
    field,
    value,
    {
      required,

      minimumLength:
        required
          ? 1
          : 0,

      maximumLength:
        QUOTATION_IDENTIFIER_MAX_LENGTH,
    }
  );
}

/**
 * Validates one numeric value.
 */
export function validateQuotationNumber(
  field:
    string,
  value:
    unknown,
  options:
    NumberValidationOptions =
      {}
): QuotationValidationError[] {
  const errors:
    QuotationValidationError[] =
      [];

  const {
    required =
      false,

    minimum,

    maximum,

    integer =
      false,

    allowZero =
      true,
  } =
    options;

  if (
    isQuotationMissing(
      value
    )
  ) {
    if (
      required
    ) {
      errors.push(
        quotationValidationError(
          field,
          QuotationValidationErrorCode
            .REQUIRED,
          `${field} is required.`
        )
      );
    }

    return errors;
  }

  if (
    typeof value !==
      "number" ||
    !Number.isFinite(
      value
    )
  ) {
    errors.push(
      quotationValidationError(
        field,
        QuotationValidationErrorCode
          .INVALID_TYPE,
        `${field} must be a finite number.`,
        value
      )
    );

    return errors;
  }

  if (
    !allowZero &&
    value ===
      0
  ) {
    errors.push(
      quotationValidationError(
        field,
        QuotationValidationErrorCode
          .INVALID_VALUE,
        `${field} must be greater than zero.`,
        value
      )
    );
  }

  if (
    integer &&
    !Number.isInteger(
      value
    )
  ) {
    errors.push(
      quotationValidationError(
        field,
        QuotationValidationErrorCode
          .INVALID_VALUE,
        `${field} must be an integer.`,
        value
      )
    );
  }

  if (
    minimum !==
      undefined &&
    value <
      minimum
  ) {
    errors.push(
      quotationValidationError(
        field,
        value <
          0
          ? QuotationValidationErrorCode
              .NEGATIVE_AMOUNT
          : QuotationValidationErrorCode
              .OUT_OF_RANGE,
        `${field} must be greater than or equal to ${minimum}.`,
        value
      )
    );
  }

  if (
    maximum !==
      undefined &&
    value >
      maximum
  ) {
    errors.push(
      quotationValidationError(
        field,
        QuotationValidationErrorCode
          .OUT_OF_RANGE,
        `${field} cannot exceed ${maximum}.`,
        value
      )
    );
  }

  return errors;
}

/**
 * Validates a monetary amount.
 */
export function validateQuotationAmount(
  field:
    string,
  value:
    unknown,
  required =
    false
): QuotationValidationError[] {
  return validateQuotationNumber(
    field,
    value,
    {
      required,

      minimum:
        0,

      maximum:
        QUOTATION_MAX_AMOUNT,

      allowZero:
        true,
    }
  );
}

/* ============================================================================
 * Date helpers
 * ============================================================================
 */

/**
 * Parses a supported quotation date string.
 *
 * The validator accepts any valid ISO-compatible date string.
 * Date-only values such as 2026-08-22 are supported.
 */
export function parseQuotationDate(
  value:
    unknown
): Date | undefined {
  if (
    typeof value !==
    "string"
  ) {
    return undefined;
  }

  const normalized =
    value.trim();

  if (
    normalized.length ===
      0
  ) {
    return undefined;
  }

  const timestamp =
    Date.parse(
      normalized
    );

  if (
    Number.isNaN(
      timestamp
    )
  ) {
    return undefined;
  }

  return new Date(
    timestamp
  );
}

/**
 * Returns UTC midnight for date-only comparisons.
 */
export function toQuotationDateOnly(
  value:
    Date
): Date {
  return new Date(
    Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate()
    )
  );
}

/**
 * Validates one quotation date.
 */
export function validateQuotationDate(
  field:
    string,
  value:
    unknown,
  options:
    DateValidationOptions =
      {}
): QuotationValidationError[] {
  const errors:
    QuotationValidationError[] =
      [];

  const {
    required =
      false,

    allowPast =
      true,

    allowToday =
      true,
  } =
    options;

  if (
    isQuotationMissing(
      value
    )
  ) {
    if (
      required
    ) {
      errors.push(
        quotationValidationError(
          field,
          QuotationValidationErrorCode
            .REQUIRED,
          `${field} is required.`
        )
      );
    }

    return errors;
  }

  if (
    typeof value !==
    "string"
  ) {
    errors.push(
      quotationValidationError(
        field,
        QuotationValidationErrorCode
          .INVALID_TYPE,
        `${field} must be a date string.`,
        value
      )
    );

    return errors;
  }

  const parsed =
    parseQuotationDate(
      value
    );

  if (
    !parsed
  ) {
    errors.push(
      quotationValidationError(
        field,
        QuotationValidationErrorCode
          .INVALID_DATE,
        `${field} must contain a valid date.`,
        value
      )
    );

    return errors;
  }

  if (
    !allowPast
  ) {
    const suppliedDate =
      toQuotationDateOnly(
        parsed
      );

    const today =
      toQuotationDateOnly(
        new Date()
      );

    if (
      suppliedDate <
        today ||
      (
        !allowToday &&
        suppliedDate.getTime() ===
          today.getTime()
      )
    ) {
      errors.push(
        quotationValidationError(
          field,
          QuotationValidationErrorCode
            .INVALID_DATE_RANGE,
          allowToday
            ? `${field} cannot be in the past.`
            : `${field} must be after today.`,
          value
        )
      );
    }
  }

  return errors;
}

/**
 * Validates chronological ordering between two optional dates.
 */
export function validateQuotationDateRange(
  fromField:
    string,
  fromValue:
    unknown,
  toField:
    string,
  toValue:
    unknown
): QuotationValidationError[] {
  if (
    isQuotationBlank(
      fromValue
    ) ||
    isQuotationBlank(
      toValue
    )
  ) {
    return [];
  }

  const fromDate =
    parseQuotationDate(
      fromValue
    );

  const toDate =
    parseQuotationDate(
      toValue
    );

  if (
    !fromDate ||
    !toDate
  ) {
    return [];
  }

  if (
    toDate.getTime() <
    fromDate.getTime()
  ) {
    return [
      quotationValidationError(
        toField,
        QuotationValidationErrorCode
          .INVALID_DATE_RANGE,
        `${toField} cannot be earlier than ${fromField}.`,
        toValue
      ),
    ];
  }

  return [];
}

/* ============================================================================
 * Enum guards
 * ============================================================================
 */

/**
 * Runtime QuotationStatus guard.
 */
export function isQuotationStatus(
  value:
    unknown
): value is QuotationStatus {
  return (
    typeof value ===
      "string" &&
    QUOTATION_STATUS_VALUES.has(
      value
    )
  );
}

/**
 * Runtime QuotationCurrency guard.
 */
export function isQuotationCurrency(
  value:
    unknown
): value is QuotationCurrency {
  return (
    typeof value ===
      "string" &&
    QUOTATION_CURRENCY_VALUES.has(
      value
    )
  );
}

/**
 * Runtime QuotationChargeType guard.
 */
export function isQuotationChargeType(
  value:
    unknown
): value is QuotationChargeType {
  return (
    typeof value ===
      "string" &&
    QUOTATION_CHARGE_TYPE_VALUES.has(
      value
    )
  );
}

/**
 * Runtime QuotationActorType guard.
 */
export function isQuotationActorType(
  value:
    unknown
): value is QuotationActorType {
  return (
    typeof value ===
      "string" &&
    QUOTATION_ACTOR_TYPE_VALUES.has(
      value
    )
  );
}

/* ============================================================================
 * Enum validators
 * ============================================================================
 */

/**
 * Validates QuotationStatus.
 */
export function validateQuotationStatusValue(
  field:
    string,
  value:
    unknown,
  required =
    false
): QuotationValidationError[] {
  if (
    isQuotationMissing(
      value
    )
  ) {
    return required
      ? [
          quotationValidationError(
            field,
            QuotationValidationErrorCode
              .REQUIRED,
            `${field} is required.`
          ),
        ]
      : [];
  }

  if (
    !isQuotationStatus(
      value
    )
  ) {
    return [
      quotationValidationError(
        field,
        QuotationValidationErrorCode
          .INVALID_STATUS,
        `${field} contains an unsupported Quotation status.`,
        value
      ),
    ];
  }

  return [];
}

/**
 * Validates QuotationCurrency.
 */
export function validateQuotationCurrencyValue(
  field:
    string,
  value:
    unknown,
  required =
    false
): QuotationValidationError[] {
  if (
    isQuotationMissing(
      value
    )
  ) {
    return required
      ? [
          quotationValidationError(
            field,
            QuotationValidationErrorCode
              .REQUIRED,
            `${field} is required.`
          ),
        ]
      : [];
  }

  if (
    !isQuotationCurrency(
      value
    )
  ) {
    return [
      quotationValidationError(
        field,
        QuotationValidationErrorCode
          .INVALID_CURRENCY,
        `${field} contains an unsupported currency.`,
        value
      ),
    ];
  }

  return [];
}

/**
 * Validates QuotationChargeType.
 */
export function validateQuotationChargeTypeValue(
  field:
    string,
  value:
    unknown,
  required =
    false
): QuotationValidationError[] {
  if (
    isQuotationMissing(
      value
    )
  ) {
    return required
      ? [
          quotationValidationError(
            field,
            QuotationValidationErrorCode
              .REQUIRED,
            `${field} is required.`
          ),
        ]
      : [];
  }

  if (
    !isQuotationChargeType(
      value
    )
  ) {
    return [
      quotationValidationError(
        field,
        QuotationValidationErrorCode
          .INVALID_CHARGE_TYPE,
        `${field} contains an unsupported charge type.`,
        value
      ),
    ];
  }

  return [];
}

/**
 * Validates QuotationActorType.
 */
export function validateQuotationActorTypeValue(
  field:
    string,
  value:
    unknown,
  required =
    false
): QuotationValidationError[] {
  if (
    isQuotationMissing(
      value
    )
  ) {
    return required
      ? [
          quotationValidationError(
            field,
            QuotationValidationErrorCode
              .REQUIRED,
            `${field} is required.`
          ),
        ]
      : [];
  }

  if (
    !isQuotationActorType(
      value
    )
  ) {
    return [
      quotationValidationError(
        field,
        QuotationValidationErrorCode
          .INVALID_ACTOR_TYPE,
        `${field} contains an unsupported actor type.`,
        value
      ),
    ];
  }

  return [];
}

/* ============================================================================
 * Shared utility helpers
 * ============================================================================
 */

/**
 * Appends validation errors without repetitive spread syntax.
 */
export function appendQuotationValidationErrors(
  target:
    QuotationValidationError[],
  errors:
    QuotationValidationError[]
): void {
  if (
    errors.length >
    0
  ) {
    target.push(
      ...errors
    );
  }
}

/**
 * Determines whether an error collection is empty.
 */
export function hasQuotationValidationErrors(
  errors:
    QuotationValidationError[]
): boolean {
  return errors.length >
    0;
}

/**
 * Safely reads a property from an unknown JSON object.
 */
export function readQuotationField(
  record:
    Record<
      string,
      unknown
    >,
  field:
    string
): unknown {
  return record[
    field
  ];
}

/**
 * Validates that the incoming payload itself is a JSON object.
 */
export function validateQuotationPayloadObject(
  value:
    unknown
): QuotationValidationError[] {
  if (
    !isQuotationObject(
      value
    )
  ) {
    return [
      quotationValidationError(
        "payload",
        QuotationValidationErrorCode
          .INVALID_TYPE,
        "Quotation request payload must be a JSON object.",
        value
      ),
    ];
  }

  return [];
}

/* ============================================================================
 * End of Part A
 * ============================================================================
 */
/* ============================================================================
 * EasyMovers
 * Quotation Validator
 * Part B
 * ============================================================================
 *
 * CreateQuotationInput validation.
 *
 * Responsibilities:
 * - Validate Lead / Booking / Vendor identifiers
 * - Validate component pricing
 * - Validate discount, tax and supplied total
 * - Validate currency
 * - Validate pickup / delivery schedule
 * - Validate quotation validity
 * - Validate initial status
 * - Validate audit actor and remarks
 * - Normalize CreateQuotationInput
 * ============================================================================
 */

/* ============================================================================
 * Create quotation constants
 * ============================================================================
 */

/**
 * Decimal tolerance used when comparing a caller-supplied total
 * against the total calculated from quotation components.
 */
export const QUOTATION_TOTAL_TOLERANCE =
  0.01;

/**
 * Maximum supported transit duration.
 *
 * This protects against obviously invalid input while remaining
 * generous enough for long-distance relocations.
 */
export const QUOTATION_MAX_TRANSIT_DAYS =
  365;

/* ============================================================================
 * Pricing calculations
 * ============================================================================
 */

/**
 * Converts an optional unknown numeric value into a safe quotation
 * amount for internal calculations.
 *
 * Invalid values intentionally become zero here because primitive
 * validation reports the actual error separately.
 */
export function normalizeQuotationAmount(
  value:
    unknown
): number {
  return (
    typeof value ===
      "number" &&
    Number.isFinite(
      value
    )
  )
    ? value
    : 0;
}

/**
 * Rounds monetary calculations to two decimal places.
 */
export function roundQuotationAmount(
  value:
    number
): number {
  return Math.round(
    (
      value +
      Number.EPSILON
    ) *
      100
  ) /
    100;
}

/**
 * Calculates quotation subtotal before discount and tax.
 */
export function calculateQuotationSubtotal(
  input: {
    transportationCost?:
      unknown;

    packingCost?:
      unknown;

    unpackingCost?:
      unknown;

    labourCost?:
      unknown;

    insuranceCost?:
      unknown;

    otherCost?:
      unknown;
  }
): number {
  return roundQuotationAmount(
    normalizeQuotationAmount(
      input.transportationCost
    ) +
      normalizeQuotationAmount(
        input.packingCost
      ) +
      normalizeQuotationAmount(
        input.unpackingCost
      ) +
      normalizeQuotationAmount(
        input.labourCost
      ) +
      normalizeQuotationAmount(
        input.insuranceCost
      ) +
      normalizeQuotationAmount(
        input.otherCost
      )
  );
}

/**
 * Calculates the final commercial quotation amount.
 *
 * Formula:
 *
 * subtotal
 * - discountAmount
 * + taxAmount
 */
export function calculateQuotationTotal(
  input: {
    transportationCost?:
      unknown;

    packingCost?:
      unknown;

    unpackingCost?:
      unknown;

    labourCost?:
      unknown;

    insuranceCost?:
      unknown;

    otherCost?:
      unknown;

    discountAmount?:
      unknown;

    taxAmount?:
      unknown;
  }
): number {
  const subtotal =
    calculateQuotationSubtotal(
      input
    );

  const discount =
    normalizeQuotationAmount(
      input.discountAmount
    );

  const tax =
    normalizeQuotationAmount(
      input.taxAmount
    );

  return roundQuotationAmount(
    subtotal -
      discount +
      tax
  );
}

/* ============================================================================
 * Create quotation pricing validation
 * ============================================================================
 */

/**
 * Validates all persisted cost components.
 */
export function validateCreateQuotationPricing(
  input:
    CreateQuotationInput
): QuotationValidationError[] {
  const errors:
    QuotationValidationError[] =
      [];

  appendQuotationValidationErrors(
    errors,
    validateQuotationAmount(
      "transportationCost",
      input.transportationCost
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationAmount(
      "packingCost",
      input.packingCost
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationAmount(
      "unpackingCost",
      input.unpackingCost
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationAmount(
      "labourCost",
      input.labourCost
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationAmount(
      "insuranceCost",
      input.insuranceCost
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationAmount(
      "otherCost",
      input.otherCost
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationAmount(
      "discountAmount",
      input.discountAmount
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationAmount(
      "taxAmount",
      input.taxAmount
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationAmount(
      "totalAmount",
      input.totalAmount
    )
  );

  return errors;
}

/**
 * Validates the commercial relationship between subtotal,
 * discount, tax and final amount.
 */
export function validateCreateQuotationTotalConsistency(
  input:
    CreateQuotationInput
): QuotationValidationError[] {
  const errors:
    QuotationValidationError[] =
      [];

  const subtotal =
    calculateQuotationSubtotal(
      input
    );

  const discountAmount =
    normalizeQuotationAmount(
      input.discountAmount
    );

  if (
    discountAmount >
    subtotal
  ) {
    errors.push(
      quotationValidationError(
        "discountAmount",
        QuotationValidationErrorCode
          .BUSINESS_RULE,
        "discountAmount cannot exceed the quotation subtotal.",
        input.discountAmount
      )
    );
  }

  const calculatedTotal =
    calculateQuotationTotal(
      input
    );

  if (
    calculatedTotal <
    0
  ) {
    errors.push(
      quotationValidationError(
        "totalAmount",
        QuotationValidationErrorCode
          .BUSINESS_RULE,
        "Calculated quotation total cannot be negative.",
        calculatedTotal
      )
    );
  }

  /**
   * totalAmount is optional in the domain contract.
   *
   * When supplied by a trusted caller it must agree with
   * component calculations.
   */
  if (
    typeof input.totalAmount ===
      "number" &&
    Number.isFinite(
      input.totalAmount
    )
  ) {
    const suppliedTotal =
      roundQuotationAmount(
        input.totalAmount
      );

    const difference =
      Math.abs(
        suppliedTotal -
          calculatedTotal
      );

    if (
      difference >
      QUOTATION_TOTAL_TOLERANCE
    ) {
      errors.push(
        quotationValidationError(
          "totalAmount",
          QuotationValidationErrorCode
            .BUSINESS_RULE,
          `totalAmount must equal the calculated quotation total of ${calculatedTotal}.`,
          input.totalAmount
        )
      );
    }
  }

  return errors;
}

/* ============================================================================
 * Create quotation schedule validation
 * ============================================================================
 */

/**
 * Validates pickup, delivery, transit and validity dates.
 */
export function validateCreateQuotationSchedule(
  input:
    CreateQuotationInput
): QuotationValidationError[] {
  const errors:
    QuotationValidationError[] =
      [];

  appendQuotationValidationErrors(
    errors,
    validateQuotationDate(
      "pickupDate",
      input.pickupDate,
      {
        required:
          false,

        allowPast:
          false,

        allowToday:
          true,
      }
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationDate(
      "deliveryDate",
      input.deliveryDate,
      {
        required:
          false,

        allowPast:
          false,

        allowToday:
          true,
      }
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationDate(
      "validUntil",
      input.validUntil,
      {
        required:
          false,

        allowPast:
          false,

        allowToday:
          true,
      }
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationNumber(
      "transitDays",
      input.transitDays,
      {
        required:
          false,

        minimum:
          0,

        maximum:
          QUOTATION_MAX_TRANSIT_DAYS,

        integer:
          true,

        allowZero:
          true,
      }
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationDateRange(
      "pickupDate",
      input.pickupDate,
      "deliveryDate",
      input.deliveryDate
    )
  );

  return errors;
}

/**
 * Validates logical consistency between pickupDate,
 * deliveryDate and transitDays.
 */
export function validateCreateQuotationTransitConsistency(
  input:
    CreateQuotationInput
): QuotationValidationError[] {
  const errors:
    QuotationValidationError[] =
      [];

  if (
    isQuotationBlank(
      input.pickupDate
    ) ||
    isQuotationBlank(
      input.deliveryDate
    )
  ) {
    return errors;
  }

  const pickupDate =
    parseQuotationDate(
      input.pickupDate
    );

  const deliveryDate =
    parseQuotationDate(
      input.deliveryDate
    );

  if (
    !pickupDate ||
    !deliveryDate
  ) {
    return errors;
  }

  if (
    deliveryDate <
    pickupDate
  ) {
    return errors;
  }

  if (
    typeof input.transitDays !==
      "number" ||
    !Number.isFinite(
      input.transitDays
    ) ||
    !Number.isInteger(
      input.transitDays
    )
  ) {
    return errors;
  }

  const millisecondsPerDay =
    24 *
    60 *
    60 *
    1000;

  const pickupOnly =
    toQuotationDateOnly(
      pickupDate
    );

  const deliveryOnly =
    toQuotationDateOnly(
      deliveryDate
    );

  const calculatedTransitDays =
    Math.round(
      (
        deliveryOnly.getTime() -
        pickupOnly.getTime()
      ) /
        millisecondsPerDay
    );

  if (
    input.transitDays !==
    calculatedTransitDays
  ) {
    errors.push(
      quotationValidationError(
        "transitDays",
        QuotationValidationErrorCode
          .BUSINESS_RULE,
        `transitDays must match the pickup-to-delivery duration of ${calculatedTransitDays} day(s).`,
        input.transitDays
      )
    );
  }

  return errors;
}

/* ============================================================================
 * Create quotation identity validation
 * ============================================================================
 */

/**
 * Validates required relational identifiers.
 *
 * Database existence checks deliberately belong to the
 * service/repository layer, not this validator.
 */
export function validateCreateQuotationIdentifiers(
  input:
    CreateQuotationInput
): QuotationValidationError[] {
  const errors:
    QuotationValidationError[] =
      [];

  appendQuotationValidationErrors(
    errors,
    validateQuotationIdentifier(
      "leadId",
      input.leadId,
      true
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationIdentifier(
      "bookingId",
      input.bookingId,
      true
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationIdentifier(
      "vendorId",
      input.vendorId,
      true
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationIdentifier(
      "userId",
      input.userId,
      false
    )
  );

  return errors;
}

/* ============================================================================
 * Create quotation metadata validation
 * ============================================================================
 */

/**
 * Validates status, currency, actors and text metadata.
 */
export function validateCreateQuotationMetadata(
  input:
    CreateQuotationInput
): QuotationValidationError[] {
  const errors:
    QuotationValidationError[] =
      [];

  appendQuotationValidationErrors(
    errors,
    validateQuotationCurrencyValue(
      "currency",
      input.currency,
      false
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationStatusValue(
      "status",
      input.status,
      false
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationIdentifier(
      "createdBy",
      input.createdBy,
      false
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationString(
      "remarks",
      input.remarks,
      {
        required:
          false,

        maximumLength:
          QUOTATION_LONG_TEXT_MAX_LENGTH,
      }
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationString(
      "internalRemarks",
      input.internalRemarks,
      {
        required:
          false,

        maximumLength:
          QUOTATION_LONG_TEXT_MAX_LENGTH,
      }
    )
  );

  return errors;
}

/* ============================================================================
 * Initial status business rules
 * ============================================================================
 */

/**
 * Statuses that may legitimately be supplied while initially
 * creating a quotation.
 *
 * ACCEPTED / REJECTED / EXPIRED / WITHDRAWN / CANCELLED
 * are workflow outcomes and therefore cannot be initial states.
 */
const CREATE_QUOTATION_ALLOWED_STATUSES =
  new Set<
    QuotationStatus
  >([
    QuotationStatus.DRAFT,
    QuotationStatus.SUBMITTED,
  ]);

/**
 * Validates initial quotation workflow status.
 */
export function validateCreateQuotationInitialStatus(
  input:
    CreateQuotationInput
): QuotationValidationError[] {
  if (
    input.status ===
      undefined
  ) {
    return [];
  }

  if (
    !isQuotationStatus(
      input.status
    )
  ) {
    /**
     * Primitive status validator reports the invalid enum.
     */
    return [];
  }

  if (
    !CREATE_QUOTATION_ALLOWED_STATUSES.has(
      input.status
    )
  ) {
    return [
      quotationValidationError(
        "status",
        QuotationValidationErrorCode
          .BUSINESS_RULE,
        "A new quotation may only start in DRAFT or SUBMITTED status.",
        input.status
      ),
    ];
  }

  return [];
}

/* ============================================================================
 * Create quotation normalization
 * ============================================================================
 */

/**
 * Normalizes one optional amount.
 */
export function normalizeOptionalQuotationAmount(
  value:
    number | undefined
): number | undefined {
  return value ===
    undefined
    ? undefined
    : roundQuotationAmount(
        value
      );
}

/**
 * Produces the normalized CreateQuotationInput after successful
 * primitive validation.
 *
 * Defaults:
 * - Currency => INR
 * - Status   => DRAFT
 * - Missing component costs => 0
 * - Missing discount/tax => 0
 * - Missing total => calculated total
 */
export function normalizeCreateQuotationInput(
  input:
    CreateQuotationInput
): CreateQuotationInput {
  const normalizedInput:
    CreateQuotationInput = {
      leadId:
        input.leadId.trim(),

      bookingId:
        input.bookingId.trim(),

      vendorId:
        input.vendorId.trim(),

      ...(input.userId
        ? {
            userId:
              input.userId.trim(),
          }
        : {}),

      transportationCost:
        roundQuotationAmount(
          input.transportationCost ??
            0
        ),

      packingCost:
        roundQuotationAmount(
          input.packingCost ??
            0
        ),

      unpackingCost:
        roundQuotationAmount(
          input.unpackingCost ??
            0
        ),

      labourCost:
        roundQuotationAmount(
          input.labourCost ??
            0
        ),

      insuranceCost:
        roundQuotationAmount(
          input.insuranceCost ??
            0
        ),

      otherCost:
        roundQuotationAmount(
          input.otherCost ??
            0
        ),

      discountAmount:
        roundQuotationAmount(
          input.discountAmount ??
            0
        ),

      taxAmount:
        roundQuotationAmount(
          input.taxAmount ??
            0
        ),

      totalAmount:
        input.totalAmount !==
          undefined
          ? roundQuotationAmount(
              input.totalAmount
            )
          : calculateQuotationTotal(
              input
            ),

      currency:
        input.currency ??
        QuotationCurrency.INR,

      status:
        input.status ??
        QuotationStatus.DRAFT,

      ...(input.pickupDate
        ? {
            pickupDate:
              input.pickupDate.trim(),
          }
        : {}),

      ...(input.deliveryDate
        ? {
            deliveryDate:
              input.deliveryDate.trim(),
          }
        : {}),

      ...(input.transitDays !==
      undefined
        ? {
            transitDays:
              input.transitDays,
          }
        : {}),

      ...(input.validUntil
        ? {
            validUntil:
              input.validUntil.trim(),
          }
        : {}),

      ...(input.pricingBreakdown
        ? {
            pricingBreakdown:
              input.pricingBreakdown,
          }
        : {}),

      ...(input.terms
        ? {
            terms:
              input.terms,
          }
        : {}),

      ...(input.inclusions
        ? {
            inclusions:
              input.inclusions,
          }
        : {}),

      ...(input.exclusions
        ? {
            exclusions:
              input.exclusions,
          }
        : {}),

      ...(input.remarks
        ? {
            remarks:
              input.remarks.trim(),
          }
        : {}),

      ...(input.internalRemarks
        ? {
            internalRemarks:
              input.internalRemarks.trim(),
          }
        : {}),

      ...(input.createdBy
        ? {
            createdBy:
              input.createdBy.trim(),
          }
        : {}),
    };

  return normalizedInput;
}

/* ============================================================================
 * Main CreateQuotationInput validator
 * ============================================================================
 */

/**
 * Validates one CreateQuotationInput.
 *
 * This validator performs domain/input validation only.
 *
 * The service layer must later verify:
 * - Lead exists
 * - Booking exists
 * - Vendor exists
 * - Booking belongs to Lead
 * - Vendor is eligible to quote
 * - Duplicate Vendor quotation rules
 */
export function validateCreateQuotationInput(
  input:
    CreateQuotationInput
): QuotationValidationResult<
  CreateQuotationInput
> {
  const errors:
    QuotationValidationError[] =
      [];

  const warnings:
    QuotationValidationWarning[] =
      [];

  appendQuotationValidationErrors(
    errors,
    validateCreateQuotationIdentifiers(
      input
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateCreateQuotationPricing(
      input
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateCreateQuotationTotalConsistency(
      input
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateCreateQuotationSchedule(
      input
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateCreateQuotationTransitConsistency(
      input
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateCreateQuotationMetadata(
      input
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateCreateQuotationInitialStatus(
      input
    )
  );

  /**
   * Commercial structured JSON validation comes in the next part.
   *
   * For now, provide warnings when supplied totals inside
   * pricingBreakdown do not match the top-level total.
   */
  if (
    input.pricingBreakdown &&
    typeof input.pricingBreakdown
        .totalAmount ===
      "number"
  ) {
    const expectedTotal =
      input.totalAmount ??
      calculateQuotationTotal(
        input
      );

    const difference =
      Math.abs(
        roundQuotationAmount(
          input.pricingBreakdown
            .totalAmount
        ) -
          roundQuotationAmount(
            expectedTotal
          )
      );

    if (
      difference >
      QUOTATION_TOTAL_TOLERANCE
    ) {
      warnings.push(
        quotationValidationWarning(
          "pricingBreakdown.totalAmount",
          "PRICING_BREAKDOWN_TOTAL_MISMATCH",
          "pricingBreakdown.totalAmount differs from the quotation total and will require commercial-detail validation.",
          input.pricingBreakdown
            .totalAmount
        )
      );
    }
  }

  if (
    hasQuotationValidationErrors(
      errors
    )
  ) {
    return createQuotationValidationFailure(
      errors,
      warnings
    );
  }

  return createQuotationValidationSuccess(
    normalizeCreateQuotationInput(
      input
    ),
    warnings
  );
}

/* ============================================================================
 * Unknown payload adapter
 * ============================================================================
 */

/**
 * Validates an unknown request payload before passing it into
 * the strongly typed create validator.
 *
 * A request mapper will eventually perform richer field-by-field
 * conversion. This adapter provides a safe domain boundary meanwhile.
 */
export function validateCreateQuotationPayload(
  payload:
    unknown
): QuotationValidationResult<
  CreateQuotationInput
> {
  const payloadErrors =
    validateQuotationPayloadObject(
      payload
    );

  if (
    payloadErrors.length >
    0
  ) {
    return createQuotationValidationFailure(
      payloadErrors
    );
  }

  const record =
    payload as Record<
      string,
      unknown
    >;

  /**
   * Constructing this candidate is intentionally permissive.
   *
   * The field validators below determine whether each runtime
   * value is actually acceptable.
   */
  const candidate =
    record as unknown as
      CreateQuotationInput;

  return validateCreateQuotationInput(
    candidate
  );
}

/* ============================================================================
 * End of Part B
 * ============================================================================
 */
/* ============================================================================
 * EasyMovers
 * Quotation Validator
 * Part C
 * ============================================================================
 *
 * Structured commercial-detail validation.
 *
 * Responsibilities:
 * - Validate pricingBreakdown
 * - Validate individual charge items
 * - Validate discount details
 * - Validate tax details
 * - Validate quotation terms
 * - Validate inclusions
 * - Validate exclusions
 * - Cross-check structured pricing against top-level pricing
 * ============================================================================
 */

/* ============================================================================
 * Commercial validation constants
 * ============================================================================
 */

export const QUOTATION_MAX_CHARGE_ITEMS =
  100;

export const QUOTATION_MAX_TERM_ITEMS =
  50;

export const QUOTATION_MAX_INCLUSION_ITEMS =
  100;

export const QUOTATION_MAX_EXCLUSION_ITEMS =
  100;

export const QUOTATION_MAX_LIST_ITEM_LENGTH =
  1000;

export const QUOTATION_MAX_QUANTITY =
  1_000_000;

export const QUOTATION_MAX_TAX_RATE_PERCENT =
  100;

export const QUOTATION_MAX_DISCOUNT_PERCENT =
  100;

/* ============================================================================
 * Shared array helpers
 * ============================================================================
 */

/**
 * Validates an array of non-empty text values.
 */
export function validateQuotationStringArray(
  field:
    string,
  value:
    unknown,
  options: {
    required?:
      boolean;

    maximumItems?:
      number;

    maximumItemLength?:
      number;
  } =
    {}
): QuotationValidationError[] {
  const errors:
    QuotationValidationError[] =
      [];

  const {
    required =
      false,

    maximumItems =
      QUOTATION_MAX_TERM_ITEMS,

    maximumItemLength =
      QUOTATION_MAX_LIST_ITEM_LENGTH,
  } =
    options;

  if (
    isQuotationMissing(
      value
    )
  ) {
    if (
      required
    ) {
      errors.push(
        quotationValidationError(
          field,
          QuotationValidationErrorCode
            .REQUIRED,
          `${field} is required.`
        )
      );
    }

    return errors;
  }

  if (
    !Array.isArray(
      value
    )
  ) {
    errors.push(
      quotationValidationError(
        field,
        QuotationValidationErrorCode
          .INVALID_TYPE,
        `${field} must be an array.`,
        value
      )
    );

    return errors;
  }

  if (
    value.length >
    maximumItems
  ) {
    errors.push(
      quotationValidationError(
        field,
        QuotationValidationErrorCode
          .OUT_OF_RANGE,
        `${field} cannot contain more than ${maximumItems} items.`,
        value.length
      )
    );
  }

  value.forEach(
    (
      item,
      index
    ) => {
      appendQuotationValidationErrors(
        errors,
        validateQuotationString(
          `${field}[${index}]`,
          item,
          {
            required:
              true,

            minimumLength:
              1,

            maximumLength:
              maximumItemLength,
          }
        )
      );
    }
  );

  return errors;
}

/* ============================================================================
 * Charge item validation
 * ============================================================================
 */

/**
 * Validates one structured quotation charge.
 */
export function validateQuotationChargeItem(
  item:
    unknown,
  index:
    number
): QuotationValidationError[] {
  const errors:
    QuotationValidationError[] =
      [];

  const fieldPrefix =
    `pricingBreakdown.items[${index}]`;

  if (
    !isQuotationObject(
      item
    )
  ) {
    return [
      quotationValidationError(
        fieldPrefix,
        QuotationValidationErrorCode
          .INVALID_TYPE,
        `${fieldPrefix} must be a JSON object.`,
        item
      ),
    ];
  }

  appendQuotationValidationErrors(
    errors,
    validateQuotationChargeTypeValue(
      `${fieldPrefix}.chargeType`,
      item.chargeType,
      true
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationString(
      `${fieldPrefix}.label`,
      item.label,
      {
        required:
          true,

        minimumLength:
          1,

        maximumLength:
          QUOTATION_SHORT_TEXT_MAX_LENGTH,
      }
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationString(
      `${fieldPrefix}.description`,
      item.description,
      {
        required:
          false,

        maximumLength:
          QUOTATION_LONG_TEXT_MAX_LENGTH,
      }
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationNumber(
      `${fieldPrefix}.quantity`,
      item.quantity,
      {
        required:
          false,

        minimum:
          0,

        maximum:
          QUOTATION_MAX_QUANTITY,

        allowZero:
          true,
      }
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationString(
      `${fieldPrefix}.unit`,
      item.unit,
      {
        required:
          false,

        maximumLength:
          QUOTATION_SHORT_TEXT_MAX_LENGTH,
      }
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationAmount(
      `${fieldPrefix}.unitRate`,
      item.unitRate,
      false
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationAmount(
      `${fieldPrefix}.amount`,
      item.amount,
      true
    )
  );

  if (
    !isQuotationMissing(
      item.taxable
    ) &&
    typeof item.taxable !==
      "boolean"
  ) {
    errors.push(
      quotationValidationError(
        `${fieldPrefix}.taxable`,
        QuotationValidationErrorCode
          .INVALID_TYPE,
        `${fieldPrefix}.taxable must be a boolean.`,
        item.taxable
      )
    );
  }

  return errors;
}

/**
 * Validates all charge items.
 */
export function validateQuotationChargeItems(
  value:
    unknown
): QuotationValidationError[] {
  const errors:
    QuotationValidationError[] =
      [];

  if (
    !Array.isArray(
      value
    )
  ) {
    return [
      quotationValidationError(
        "pricingBreakdown.items",
        QuotationValidationErrorCode
          .INVALID_TYPE,
        "pricingBreakdown.items must be an array.",
        value
      ),
    ];
  }

  if (
    value.length >
    QUOTATION_MAX_CHARGE_ITEMS
  ) {
    errors.push(
      quotationValidationError(
        "pricingBreakdown.items",
        QuotationValidationErrorCode
          .OUT_OF_RANGE,
        `pricingBreakdown.items cannot contain more than ${QUOTATION_MAX_CHARGE_ITEMS} entries.`,
        value.length
      )
    );
  }

  value.forEach(
    (
      item,
      index
    ) => {
      appendQuotationValidationErrors(
        errors,
        validateQuotationChargeItem(
          item,
          index
        )
      );
    }
  );

  return errors;
}

/* ============================================================================
 * Discount validation
 * ============================================================================
 */

/**
 * Validates structured discount metadata.
 */
export function validateQuotationDiscountDetails(
  value:
    unknown
): QuotationValidationError[] {
  const errors:
    QuotationValidationError[] =
      [];

  if (
    isQuotationMissing(
      value
    )
  ) {
    return errors;
  }

  if (
    !isQuotationObject(
      value
    )
  ) {
    return [
      quotationValidationError(
        "pricingBreakdown.discount",
        QuotationValidationErrorCode
          .INVALID_TYPE,
        "pricingBreakdown.discount must be a JSON object.",
        value
      ),
    ];
  }

  appendQuotationValidationErrors(
    errors,
    validateQuotationString(
      "pricingBreakdown.discount.discountName",
      value.discountName,
      {
        required:
          false,

        maximumLength:
          QUOTATION_SHORT_TEXT_MAX_LENGTH,
      }
    )
  );

  if (
    !isQuotationMissing(
      value.discountType
    ) &&
    value.discountType !==
      "FIXED" &&
    value.discountType !==
      "PERCENTAGE"
  ) {
    errors.push(
      quotationValidationError(
        "pricingBreakdown.discount.discountType",
        QuotationValidationErrorCode
          .INVALID_VALUE,
        "discountType must be FIXED or PERCENTAGE.",
        value.discountType
      )
    );
  }

  appendQuotationValidationErrors(
    errors,
    validateQuotationNumber(
      "pricingBreakdown.discount.discountValue",
      value.discountValue,
      {
        required:
          false,

        minimum:
          0,

        maximum:
          value.discountType ===
            "PERCENTAGE"
            ? QUOTATION_MAX_DISCOUNT_PERCENT
            : QUOTATION_MAX_AMOUNT,

        allowZero:
          true,
      }
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationAmount(
      "pricingBreakdown.discount.discountAmount",
      value.discountAmount,
      true
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationString(
      "pricingBreakdown.discount.reason",
      value.reason,
      {
        required:
          false,

        maximumLength:
          QUOTATION_LONG_TEXT_MAX_LENGTH,
      }
    )
  );

  return errors;
}

/* ============================================================================
 * Tax validation
 * ============================================================================
 */

/**
 * Validates structured tax metadata.
 */
export function validateQuotationTaxDetails(
  value:
    unknown
): QuotationValidationError[] {
  const errors:
    QuotationValidationError[] =
      [];

  if (
    isQuotationMissing(
      value
    )
  ) {
    return errors;
  }

  if (
    !isQuotationObject(
      value
    )
  ) {
    return [
      quotationValidationError(
        "pricingBreakdown.tax",
        QuotationValidationErrorCode
          .INVALID_TYPE,
        "pricingBreakdown.tax must be a JSON object.",
        value
      ),
    ];
  }

  appendQuotationValidationErrors(
    errors,
    validateQuotationString(
      "pricingBreakdown.tax.taxName",
      value.taxName,
      {
        required:
          false,

        maximumLength:
          QUOTATION_SHORT_TEXT_MAX_LENGTH,
      }
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationNumber(
      "pricingBreakdown.tax.taxRatePercent",
      value.taxRatePercent,
      {
        required:
          false,

        minimum:
          0,

        maximum:
          QUOTATION_MAX_TAX_RATE_PERCENT,

        allowZero:
          true,
      }
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationAmount(
      "pricingBreakdown.tax.taxableAmount",
      value.taxableAmount,
      false
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationAmount(
      "pricingBreakdown.tax.taxAmount",
      value.taxAmount,
      true
    )
  );

  return errors;
}

/* ============================================================================
 * Pricing breakdown validation
 * ============================================================================
 */

/**
 * Calculates the sum of valid charge item amounts.
 */
export function calculateQuotationChargeItemTotal(
  items:
    QuotationChargeItem[]
): number {
  return roundQuotationAmount(
    items.reduce(
      (
        total,
        item
      ) =>
        total +
        (
          typeof item.amount ===
            "number" &&
          Number.isFinite(
            item.amount
          )
            ? item.amount
            : 0
        ),
      0
    )
  );
}

/**
 * Validates one complete pricing breakdown object.
 */
export function validateQuotationPricingBreakdown(
  value:
    unknown
): QuotationValidationError[] {
  const errors:
    QuotationValidationError[] =
      [];

  if (
    isQuotationMissing(
      value
    )
  ) {
    return errors;
  }

  if (
    !isQuotationObject(
      value
    )
  ) {
    return [
      quotationValidationError(
        "pricingBreakdown",
        QuotationValidationErrorCode
          .INVALID_TYPE,
        "pricingBreakdown must be a JSON object.",
        value
      ),
    ];
  }

  appendQuotationValidationErrors(
    errors,
    validateQuotationChargeItems(
      value.items
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationAmount(
      "pricingBreakdown.subtotalAmount",
      value.subtotalAmount,
      true
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationDiscountDetails(
      value.discount
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationTaxDetails(
      value.tax
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationAmount(
      "pricingBreakdown.totalAmount",
      value.totalAmount,
      true
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationCurrencyValue(
      "pricingBreakdown.currency",
      value.currency,
      true
    )
  );

  /**
   * Only perform arithmetic cross-checks when required
   * numeric structures are valid enough to calculate.
   */
  if (
    Array.isArray(
      value.items
    )
  ) {
    const chargeItems =
      value.items.filter(
        (
          item
        ): item is QuotationChargeItem =>
          isQuotationObject(
            item
          ) &&
          typeof item.amount ===
            "number" &&
          Number.isFinite(
            item.amount
          )
      );

    const calculatedSubtotal =
      calculateQuotationChargeItemTotal(
        chargeItems
      );

    if (
      typeof value.subtotalAmount ===
        "number" &&
      Number.isFinite(
        value.subtotalAmount
      )
    ) {
      const difference =
        Math.abs(
          calculatedSubtotal -
            roundQuotationAmount(
              value.subtotalAmount
            )
        );

      if (
        difference >
        QUOTATION_TOTAL_TOLERANCE
      ) {
        errors.push(
          quotationValidationError(
            "pricingBreakdown.subtotalAmount",
            QuotationValidationErrorCode
              .BUSINESS_RULE,
            `pricingBreakdown.subtotalAmount must equal the sum of charge items (${calculatedSubtotal}).`,
            value.subtotalAmount
          )
        );
      }
    }
  }

  const subtotal =
    typeof value.subtotalAmount ===
      "number" &&
    Number.isFinite(
      value.subtotalAmount
    )
      ? value.subtotalAmount
      : undefined;

  const discountAmount =
    isQuotationObject(
      value.discount
    ) &&
    typeof value.discount
        .discountAmount ===
      "number" &&
    Number.isFinite(
      value.discount
        .discountAmount
    )
      ? value.discount
          .discountAmount
      : 0;

  const taxAmount =
    isQuotationObject(
      value.tax
    ) &&
    typeof value.tax
        .taxAmount ===
      "number" &&
    Number.isFinite(
      value.tax
        .taxAmount
    )
      ? value.tax
          .taxAmount
      : 0;

  if (
    subtotal !==
      undefined &&
    typeof value.totalAmount ===
      "number" &&
    Number.isFinite(
      value.totalAmount
    )
  ) {
    const calculatedTotal =
      roundQuotationAmount(
        subtotal -
          discountAmount +
          taxAmount
      );

    const difference =
      Math.abs(
        calculatedTotal -
          roundQuotationAmount(
            value.totalAmount
          )
      );

    if (
      difference >
      QUOTATION_TOTAL_TOLERANCE
    ) {
      errors.push(
        quotationValidationError(
          "pricingBreakdown.totalAmount",
          QuotationValidationErrorCode
            .BUSINESS_RULE,
          `pricingBreakdown.totalAmount must equal subtotal - discount + tax (${calculatedTotal}).`,
          value.totalAmount
        )
      );
    }
  }

  return errors;
}

/* ============================================================================
 * Terms validation
 * ============================================================================
 */

/**
 * Validates quotation commercial terms.
 */
export function validateQuotationTerms(
  value:
    unknown
): QuotationValidationError[] {
  const errors:
    QuotationValidationError[] =
      [];

  if (
    isQuotationMissing(
      value
    )
  ) {
    return errors;
  }

  if (
    !isQuotationObject(
      value
    )
  ) {
    return [
      quotationValidationError(
        "terms",
        QuotationValidationErrorCode
          .INVALID_TYPE,
        "terms must be a JSON object.",
        value
      ),
    ];
  }

  const termFields = [
    "paymentTerms",
    "cancellationTerms",
    "liabilityTerms",
    "insuranceTerms",
    "validityTerms",
    "additionalTerms",
  ] as const;

  termFields.forEach(
    (
      field
    ) => {
      appendQuotationValidationErrors(
        errors,
        validateQuotationStringArray(
          `terms.${field}`,
          value[
            field
          ],
          {
            required:
              false,

            maximumItems:
              QUOTATION_MAX_TERM_ITEMS,

            maximumItemLength:
              QUOTATION_MAX_LIST_ITEM_LENGTH,
          }
        )
      );
    }
  );

  return errors;
}

/* ============================================================================
 * Inclusion validation
 * ============================================================================
 */

/**
 * Validates quotation inclusions.
 */
export function validateQuotationInclusions(
  value:
    unknown
): QuotationValidationError[] {
  if (
    isQuotationMissing(
      value
    )
  ) {
    return [];
  }

  if (
    !isQuotationObject(
      value
    )
  ) {
    return [
      quotationValidationError(
        "inclusions",
        QuotationValidationErrorCode
          .INVALID_TYPE,
        "inclusions must be a JSON object.",
        value
      ),
    ];
  }

  return validateQuotationStringArray(
    "inclusions.items",
    value.items,
    {
      required:
        true,

      maximumItems:
        QUOTATION_MAX_INCLUSION_ITEMS,

      maximumItemLength:
        QUOTATION_MAX_LIST_ITEM_LENGTH,
    }
  );
}

/* ============================================================================
 * Exclusion validation
 * ============================================================================
 */

/**
 * Validates quotation exclusions.
 */
export function validateQuotationExclusions(
  value:
    unknown
): QuotationValidationError[] {
  if (
    isQuotationMissing(
      value
    )
  ) {
    return [];
  }

  if (
    !isQuotationObject(
      value
    )
  ) {
    return [
      quotationValidationError(
        "exclusions",
        QuotationValidationErrorCode
          .INVALID_TYPE,
        "exclusions must be a JSON object.",
        value
      ),
    ];
  }

  return validateQuotationStringArray(
    "exclusions.items",
    value.items,
    {
      required:
        true,

      maximumItems:
        QUOTATION_MAX_EXCLUSION_ITEMS,

      maximumItemLength:
        QUOTATION_MAX_LIST_ITEM_LENGTH,
    }
  );
}

/* ============================================================================
 * Cross-field structured pricing validation
 * ============================================================================
 */

/**
 * Ensures structured pricing does not contradict top-level
 * persisted quotation amounts.
 */
export function validateQuotationPricingConsistency(
  input:
    CreateQuotationInput
): QuotationValidationError[] {
  const errors:
    QuotationValidationError[] =
      [];

  const pricingBreakdown =
    input.pricingBreakdown;

  if (
    !pricingBreakdown
  ) {
    return errors;
  }

  if (
    typeof pricingBreakdown
        .totalAmount ===
      "number"
  ) {
    const topLevelTotal =
      input.totalAmount ??
      calculateQuotationTotal(
        input
      );

    const difference =
      Math.abs(
        roundQuotationAmount(
          pricingBreakdown
            .totalAmount
        ) -
          roundQuotationAmount(
            topLevelTotal
          )
      );

    if (
      difference >
      QUOTATION_TOTAL_TOLERANCE
    ) {
      errors.push(
        quotationValidationError(
          "pricingBreakdown.totalAmount",
          QuotationValidationErrorCode
            .BUSINESS_RULE,
          "pricingBreakdown.totalAmount must match the quotation totalAmount.",
          pricingBreakdown
            .totalAmount
        )
      );
    }
  }

  if (
    pricingBreakdown.currency !==
      undefined &&
    input.currency !==
      undefined &&
    pricingBreakdown.currency !==
      input.currency
  ) {
    errors.push(
      quotationValidationError(
        "pricingBreakdown.currency",
        QuotationValidationErrorCode
          .BUSINESS_RULE,
        "pricingBreakdown.currency must match the quotation currency.",
        pricingBreakdown.currency
      )
    );
  }

  if (
    pricingBreakdown.discount
  ) {
    const structuredDiscount =
      roundQuotationAmount(
        pricingBreakdown
          .discount
          .discountAmount
      );

    const topLevelDiscount =
      roundQuotationAmount(
        input.discountAmount ??
          0
      );

    if (
      Math.abs(
        structuredDiscount -
          topLevelDiscount
      ) >
      QUOTATION_TOTAL_TOLERANCE
    ) {
      errors.push(
        quotationValidationError(
          "pricingBreakdown.discount.discountAmount",
          QuotationValidationErrorCode
            .BUSINESS_RULE,
          "Structured discountAmount must match the top-level discountAmount.",
          pricingBreakdown
            .discount
            .discountAmount
        )
      );
    }
  }

  if (
    pricingBreakdown.tax
  ) {
    const structuredTax =
      roundQuotationAmount(
        pricingBreakdown
          .tax
          .taxAmount
      );

    const topLevelTax =
      roundQuotationAmount(
        input.taxAmount ??
          0
      );

    if (
      Math.abs(
        structuredTax -
          topLevelTax
      ) >
      QUOTATION_TOTAL_TOLERANCE
    ) {
      errors.push(
        quotationValidationError(
          "pricingBreakdown.tax.taxAmount",
          QuotationValidationErrorCode
            .BUSINESS_RULE,
          "Structured taxAmount must match the top-level taxAmount.",
          pricingBreakdown
            .tax
            .taxAmount
        )
      );
    }
  }

  return errors;
}

/* ============================================================================
 * Complete commercial-detail validation
 * ============================================================================
 */

/**
 * Validates every structured commercial field on
 * CreateQuotationInput.
 */
export function validateCreateQuotationCommercialDetails(
  input:
    CreateQuotationInput
): QuotationValidationError[] {
  const errors:
    QuotationValidationError[] =
      [];

  appendQuotationValidationErrors(
    errors,
    validateQuotationPricingBreakdown(
      input.pricingBreakdown
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationTerms(
      input.terms
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationInclusions(
      input.inclusions
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationExclusions(
      input.exclusions
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationPricingConsistency(
      input
    )
  );

  return errors;
}

/* ============================================================================
 * Typed commercial object guards
 * ============================================================================
 */

export function isQuotationPricingBreakdown(
  value:
    unknown
): value is QuotationPricingBreakdown {
  return (
    isQuotationObject(
      value
    ) &&
    Array.isArray(
      value.items
    ) &&
    typeof value.subtotalAmount ===
      "number" &&
    typeof value.totalAmount ===
      "number" &&
    isQuotationCurrency(
      value.currency
    )
  );
}

export function isQuotationTaxDetails(
  value:
    unknown
): value is QuotationTaxDetails {
  return (
    isQuotationObject(
      value
    ) &&
    typeof value.taxAmount ===
      "number" &&
    Number.isFinite(
      value.taxAmount
    )
  );
}

export function isQuotationDiscountDetails(
  value:
    unknown
): value is QuotationDiscountDetails {
  return (
    isQuotationObject(
      value
    ) &&
    typeof value.discountAmount ===
      "number" &&
    Number.isFinite(
      value.discountAmount
    )
  );
}

export function isQuotationTerms(
  value:
    unknown
): value is QuotationTerms {
  return isQuotationObject(
    value
  );
}

export function isQuotationInclusions(
  value:
    unknown
): value is QuotationInclusions {
  return (
    isQuotationObject(
      value
    ) &&
    Array.isArray(
      value.items
    )
  );
}

export function isQuotationExclusions(
  value:
    unknown
): value is QuotationExclusions {
  return (
    isQuotationObject(
      value
    ) &&
    Array.isArray(
      value.items
    )
  );
}

/* ============================================================================
 * Part B integration helper
 * ============================================================================
 */

/**
 * Extended CreateQuotationInput validator.
 *
 * Part B's validateCreateQuotationInput remains available,
 * while this function adds the complete structured commercial
 * validation introduced in Part C.
 *
 * Later, when the controller/service layer is created, this
 * should be the preferred create validator.
 */
export function validateCompleteCreateQuotationInput(
  input:
    CreateQuotationInput
): QuotationValidationResult<
  CreateQuotationInput
> {
  const baseValidation =
    validateCreateQuotationInput(
      input
    );

  if (
    !baseValidation.valid
  ) {
    return baseValidation;
  }

  const commercialErrors =
    validateCreateQuotationCommercialDetails(
      baseValidation.value
    );

  if (
    commercialErrors.length >
    0
  ) {
    return createQuotationValidationFailure(
      commercialErrors,
      baseValidation.warnings
    );
  }

  return createQuotationValidationSuccess(
    baseValidation.value,
    baseValidation.warnings
  );
}

/* ============================================================================
 * End of Part C
 * ============================================================================
 */
/* ============================================================================
 * EasyMovers
 * Quotation Validator
 * Part D
 * ============================================================================
 *
 * Responsibilities:
 * - Validate quotation updates
 * - Validate quotation status changes
 * - Enforce quotation status transitions
 * - Validate quotation selection
 * - Validate quotation unselection
 * - Validate quotation withdrawal
 * - Validate quotation rejection
 * ============================================================================
 */

/* ============================================================================
 * Update quotation helpers
 * ============================================================================
 */

/**
 * Determines whether an UpdateQuotationInput contains at least
 * one editable business field.
 */
export function hasQuotationUpdateFields(
  input:
    UpdateQuotationInput
): boolean {
  return (
    input.transportationCost !==
      undefined ||
    input.packingCost !==
      undefined ||
    input.unpackingCost !==
      undefined ||
    input.labourCost !==
      undefined ||
    input.insuranceCost !==
      undefined ||
    input.otherCost !==
      undefined ||
    input.discountAmount !==
      undefined ||
    input.taxAmount !==
      undefined ||
    input.totalAmount !==
      undefined ||
    input.currency !==
      undefined ||
    input.pickupDate !==
      undefined ||
    input.deliveryDate !==
      undefined ||
    input.transitDays !==
      undefined ||
    input.validUntil !==
      undefined ||
    input.pricingBreakdown !==
      undefined ||
    input.terms !==
      undefined ||
    input.inclusions !==
      undefined ||
    input.exclusions !==
      undefined ||
    input.remarks !==
      undefined ||
    input.internalRemarks !==
      undefined
  );
}

/**
 * Validates nullable date values used during quotation updates.
 */
export function validateNullableQuotationDate(
  field:
    string,
  value:
    unknown
): QuotationValidationError[] {
  if (
    value ===
      undefined ||
    value ===
      null
  ) {
    return [];
  }

  return validateQuotationDate(
    field,
    value,
    {
      required:
        false,

      allowPast:
        false,

      allowToday:
        true,
    }
  );
}

/* ============================================================================
 * Update quotation pricing validation
 * ============================================================================
 */

export function validateUpdateQuotationPricing(
  input:
    UpdateQuotationInput
): QuotationValidationError[] {
  const errors:
    QuotationValidationError[] =
      [];

  appendQuotationValidationErrors(
    errors,
    validateQuotationAmount(
      "transportationCost",
      input.transportationCost
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationAmount(
      "packingCost",
      input.packingCost
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationAmount(
      "unpackingCost",
      input.unpackingCost
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationAmount(
      "labourCost",
      input.labourCost
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationAmount(
      "insuranceCost",
      input.insuranceCost
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationAmount(
      "otherCost",
      input.otherCost
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationAmount(
      "discountAmount",
      input.discountAmount
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationAmount(
      "taxAmount",
      input.taxAmount
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationAmount(
      "totalAmount",
      input.totalAmount
    )
  );

  return errors;
}

/* ============================================================================
 * Update quotation schedule validation
 * ============================================================================
 */

export function validateUpdateQuotationSchedule(
  input:
    UpdateQuotationInput
): QuotationValidationError[] {
  const errors:
    QuotationValidationError[] =
      [];

  appendQuotationValidationErrors(
    errors,
    validateNullableQuotationDate(
      "pickupDate",
      input.pickupDate
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateNullableQuotationDate(
      "deliveryDate",
      input.deliveryDate
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateNullableQuotationDate(
      "validUntil",
      input.validUntil
    )
  );

  if (
    input.transitDays !==
      null
  ) {
    appendQuotationValidationErrors(
      errors,
      validateQuotationNumber(
        "transitDays",
        input.transitDays,
        {
          required:
            false,

          minimum:
            0,

          maximum:
            QUOTATION_MAX_TRANSIT_DAYS,

          integer:
            true,

          allowZero:
            true,
        }
      )
    );
  }

  if (
    input.pickupDate !==
      null &&
    input.deliveryDate !==
      null
  ) {
    appendQuotationValidationErrors(
      errors,
      validateQuotationDateRange(
        "pickupDate",
        input.pickupDate,
        "deliveryDate",
        input.deliveryDate
      )
    );
  }

  return errors;
}

/* ============================================================================
 * Update commercial JSON validation
 * ============================================================================
 */

export function validateUpdateQuotationCommercialDetails(
  input:
    UpdateQuotationInput
): QuotationValidationError[] {
  const errors:
    QuotationValidationError[] =
      [];

  if (
    input.pricingBreakdown !==
      null
  ) {
    appendQuotationValidationErrors(
      errors,
      validateQuotationPricingBreakdown(
        input.pricingBreakdown
      )
    );
  }

  if (
    input.terms !==
      null
  ) {
    appendQuotationValidationErrors(
      errors,
      validateQuotationTerms(
        input.terms
      )
    );
  }

  if (
    input.inclusions !==
      null
  ) {
    appendQuotationValidationErrors(
      errors,
      validateQuotationInclusions(
        input.inclusions
      )
    );
  }

  if (
    input.exclusions !==
      null
  ) {
    appendQuotationValidationErrors(
      errors,
      validateQuotationExclusions(
        input.exclusions
      )
    );
  }

  return errors;
}

/* ============================================================================
 * Main UpdateQuotationInput validator
 * ============================================================================
 */

export function validateUpdateQuotationInput(
  input:
    UpdateQuotationInput
): QuotationValidationResult<
  UpdateQuotationInput
> {
  const errors:
    QuotationValidationError[] =
      [];

  appendQuotationValidationErrors(
    errors,
    validateQuotationIdentifier(
      "updatedBy",
      input.updatedBy,
      true
    )
  );

  if (
    !hasQuotationUpdateFields(
      input
    )
  ) {
    errors.push(
      quotationValidationError(
        "payload",
        QuotationValidationErrorCode
          .BUSINESS_RULE,
        "At least one quotation field must be supplied for update."
      )
    );
  }

  appendQuotationValidationErrors(
    errors,
    validateUpdateQuotationPricing(
      input
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateUpdateQuotationSchedule(
      input
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationCurrencyValue(
      "currency",
      input.currency,
      false
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationString(
      "remarks",
      input.remarks,
      {
        required:
          false,

        maximumLength:
          QUOTATION_LONG_TEXT_MAX_LENGTH,
      }
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationString(
      "internalRemarks",
      input.internalRemarks,
      {
        required:
          false,

        maximumLength:
          QUOTATION_LONG_TEXT_MAX_LENGTH,
      }
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateUpdateQuotationCommercialDetails(
      input
    )
  );

  if (
    errors.length >
    0
  ) {
    return createQuotationValidationFailure(
      errors
    );
  }

  return createQuotationValidationSuccess(
    input
  );
}

/* ============================================================================
 * Quotation status transition rules
 * ============================================================================
 */

/**
 * Allowed workflow transitions.
 *
 * These rules keep terminal states immutable and prevent
 * commercially impossible jumps.
 */
const QUOTATION_STATUS_TRANSITIONS:
  Record<
    QuotationStatus,
    readonly QuotationStatus[]
  > = {
    [QuotationStatus.DRAFT]: [
      QuotationStatus.SUBMITTED,
      QuotationStatus.CANCELLED,
    ],

    [QuotationStatus.SUBMITTED]: [
      QuotationStatus.REVISED,
      QuotationStatus.SHORTLISTED,
      QuotationStatus.ACCEPTED,
      QuotationStatus.REJECTED,
      QuotationStatus.EXPIRED,
      QuotationStatus.WITHDRAWN,
      QuotationStatus.CANCELLED,
    ],

    [QuotationStatus.REVISED]: [
      QuotationStatus.SUBMITTED,
      QuotationStatus.SHORTLISTED,
      QuotationStatus.ACCEPTED,
      QuotationStatus.REJECTED,
      QuotationStatus.EXPIRED,
      QuotationStatus.WITHDRAWN,
      QuotationStatus.CANCELLED,
    ],

    [QuotationStatus.SHORTLISTED]: [
      QuotationStatus.ACCEPTED,
      QuotationStatus.REJECTED,
      QuotationStatus.EXPIRED,
      QuotationStatus.WITHDRAWN,
      QuotationStatus.CANCELLED,
    ],

    [QuotationStatus.ACCEPTED]: [],

    [QuotationStatus.REJECTED]: [],

    [QuotationStatus.EXPIRED]: [],

    [QuotationStatus.WITHDRAWN]: [],

    [QuotationStatus.CANCELLED]: [],
  };

/**
 * Determines whether one Quotation status transition is allowed.
 */
export function canTransitionQuotationStatus(
  currentStatus:
    QuotationStatus,
  nextStatus:
    QuotationStatus
): boolean {
  if (
    currentStatus ===
      nextStatus
  ) {
    return true;
  }

  return QUOTATION_STATUS_TRANSITIONS[
    currentStatus
  ].includes(
    nextStatus
  );
}

/**
 * Validates a status transition.
 */
export function validateQuotationStatusTransition(
  currentStatus:
    QuotationStatus,
  nextStatus:
    QuotationStatus
): QuotationValidationError[] {
  if (
    canTransitionQuotationStatus(
      currentStatus,
      nextStatus
    )
  ) {
    return [];
  }

  return [
    quotationValidationError(
      "status",
      QuotationValidationErrorCode
        .INVALID_STATUS_TRANSITION,
      `Quotation status cannot change from ${currentStatus} to ${nextStatus}.`,
      nextStatus
    ),
  ];
}

/* ============================================================================
 * UpdateQuotationStatusInput validation
 * ============================================================================
 */

export function validateUpdateQuotationStatusInput(
  input:
    UpdateQuotationStatusInput,
  currentStatus?:
    QuotationStatus
): QuotationValidationResult<
  UpdateQuotationStatusInput
> {
  const errors:
    QuotationValidationError[] =
      [];

  appendQuotationValidationErrors(
    errors,
    validateQuotationIdentifier(
      "quotationId",
      input.quotationId,
      true
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationStatusValue(
      "status",
      input.status,
      true
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationIdentifier(
      "changedBy",
      input.changedBy,
      true
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationString(
      "reason",
      input.reason,
      {
        required:
          false,

        maximumLength:
          QUOTATION_LONG_TEXT_MAX_LENGTH,
      }
    )
  );

  if (
    currentStatus &&
    isQuotationStatus(
      input.status
    )
  ) {
    appendQuotationValidationErrors(
      errors,
      validateQuotationStatusTransition(
        currentStatus,
        input.status
      )
    );
  }

  if (
    errors.length >
    0
  ) {
    return createQuotationValidationFailure(
      errors
    );
  }

  return createQuotationValidationSuccess(
    input
  );
}

/* ============================================================================
 * Selection validation
 * ============================================================================
 */

export function validateSelectQuotationInput(
  input:
    SelectQuotationInput
): QuotationValidationResult<
  SelectQuotationInput
> {
  const errors:
    QuotationValidationError[] =
      [];

  appendQuotationValidationErrors(
    errors,
    validateQuotationIdentifier(
      "bookingId",
      input.bookingId,
      true
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationIdentifier(
      "quotationId",
      input.quotationId,
      true
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationIdentifier(
      "selectedBy",
      input.selectedBy,
      true
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationString(
      "remarks",
      input.remarks,
      {
        required:
          false,

        maximumLength:
          QUOTATION_LONG_TEXT_MAX_LENGTH,
      }
    )
  );

  if (
    errors.length >
    0
  ) {
    return createQuotationValidationFailure(
      errors
    );
  }

  return createQuotationValidationSuccess(
    input
  );
}

/* ============================================================================
 * Unselection validation
 * ============================================================================
 */

export function validateUnselectQuotationInput(
  input:
    UnselectQuotationInput
): QuotationValidationResult<
  UnselectQuotationInput
> {
  const errors:
    QuotationValidationError[] =
      [];

  appendQuotationValidationErrors(
    errors,
    validateQuotationIdentifier(
      "bookingId",
      input.bookingId,
      true
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationIdentifier(
      "unselectedBy",
      input.unselectedBy,
      true
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationString(
      "reason",
      input.reason,
      {
        required:
          true,

        minimumLength:
          3,

        maximumLength:
          QUOTATION_LONG_TEXT_MAX_LENGTH,
      }
    )
  );

  if (
    errors.length >
    0
  ) {
    return createQuotationValidationFailure(
      errors
    );
  }

  return createQuotationValidationSuccess(
    input
  );
}

/* ============================================================================
 * Withdrawal validation
 * ============================================================================
 */

export function validateWithdrawQuotationInput(
  input:
    WithdrawQuotationInput
): QuotationValidationResult<
  WithdrawQuotationInput
> {
  const errors:
    QuotationValidationError[] =
      [];

  appendQuotationValidationErrors(
    errors,
    validateQuotationIdentifier(
      "quotationId",
      input.quotationId,
      true
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationIdentifier(
      "withdrawnBy",
      input.withdrawnBy,
      true
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationString(
      "reason",
      input.reason,
      {
        required:
          true,

        minimumLength:
          3,

        maximumLength:
          QUOTATION_LONG_TEXT_MAX_LENGTH,
      }
    )
  );

  if (
    errors.length >
    0
  ) {
    return createQuotationValidationFailure(
      errors
    );
  }

  return createQuotationValidationSuccess(
    input
  );
}

/* ============================================================================
 * Rejection validation
 * ============================================================================
 */

export function validateRejectQuotationInput(
  input:
    RejectQuotationInput
): QuotationValidationResult<
  RejectQuotationInput
> {
  const errors:
    QuotationValidationError[] =
      [];

  appendQuotationValidationErrors(
    errors,
    validateQuotationIdentifier(
      "quotationId",
      input.quotationId,
      true
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationIdentifier(
      "rejectedBy",
      input.rejectedBy,
      true
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationString(
      "reason",
      input.reason,
      {
        required:
          false,

        maximumLength:
          QUOTATION_LONG_TEXT_MAX_LENGTH,
      }
    )
  );

  if (
    errors.length >
    0
  ) {
    return createQuotationValidationFailure(
      errors
    );
  }

  return createQuotationValidationSuccess(
    input
  );
}

/* ============================================================================
 * Workflow-specific status guards
 * ============================================================================
 */

/**
 * A quotation may only be selected while commercially active.
 */
export function validateQuotationSelectableStatus(
  status:
    QuotationStatus
): QuotationValidationError[] {
  if (
    status ===
      QuotationStatus.SUBMITTED ||
    status ===
      QuotationStatus.REVISED ||
    status ===
      QuotationStatus.SHORTLISTED
  ) {
    return [];
  }

  return [
    quotationValidationError(
      "status",
      QuotationValidationErrorCode
        .BUSINESS_RULE,
      `Quotation cannot be selected while its status is ${status}.`,
      status
    ),
  ];
}

/**
 * Determines whether the current quotation can be withdrawn.
 */
export function validateQuotationWithdrawableStatus(
  status:
    QuotationStatus
): QuotationValidationError[] {
  if (
    status ===
      QuotationStatus.DRAFT ||
    status ===
      QuotationStatus.SUBMITTED ||
    status ===
      QuotationStatus.REVISED ||
    status ===
      QuotationStatus.SHORTLISTED
  ) {
    return [];
  }

  return [
    quotationValidationError(
      "status",
      QuotationValidationErrorCode
        .BUSINESS_RULE,
      `Quotation cannot be withdrawn while its status is ${status}.`,
      status
    ),
  ];
}

/**
 * Determines whether the current quotation can be rejected.
 */
export function validateQuotationRejectableStatus(
  status:
    QuotationStatus
): QuotationValidationError[] {
  if (
    status ===
      QuotationStatus.SUBMITTED ||
    status ===
      QuotationStatus.REVISED ||
    status ===
      QuotationStatus.SHORTLISTED
  ) {
    return [];
  }

  return [
    quotationValidationError(
      "status",
      QuotationValidationErrorCode
        .BUSINESS_RULE,
      `Quotation cannot be rejected while its status is ${status}.`,
      status
    ),
  ];
}

/* ============================================================================
 * Unknown payload adapters
 * ============================================================================
 */

export function validateUpdateQuotationPayload(
  payload:
    unknown
): QuotationValidationResult<
  UpdateQuotationInput
> {
  const payloadErrors =
    validateQuotationPayloadObject(
      payload
    );

  if (
    payloadErrors.length >
    0
  ) {
    return createQuotationValidationFailure(
      payloadErrors
    );
  }

  return validateUpdateQuotationInput(
    payload as
      UpdateQuotationInput
  );
}

export function validateQuotationStatusPayload(
  payload:
    unknown,
  currentStatus?:
    QuotationStatus
): QuotationValidationResult<
  UpdateQuotationStatusInput
> {
  const payloadErrors =
    validateQuotationPayloadObject(
      payload
    );

  if (
    payloadErrors.length >
    0
  ) {
    return createQuotationValidationFailure(
      payloadErrors
    );
  }

  return validateUpdateQuotationStatusInput(
    payload as
      UpdateQuotationStatusInput,
    currentStatus
  );
}

export function validateSelectQuotationPayload(
  payload:
    unknown
): QuotationValidationResult<
  SelectQuotationInput
> {
  const payloadErrors =
    validateQuotationPayloadObject(
      payload
    );

  if (
    payloadErrors.length >
    0
  ) {
    return createQuotationValidationFailure(
      payloadErrors
    );
  }

  return validateSelectQuotationInput(
    payload as
      SelectQuotationInput
  );
}

export function validateUnselectQuotationPayload(
  payload:
    unknown
): QuotationValidationResult<
  UnselectQuotationInput
> {
  const payloadErrors =
    validateQuotationPayloadObject(
      payload
    );

  if (
    payloadErrors.length >
    0
  ) {
    return createQuotationValidationFailure(
      payloadErrors
    );
  }

  return validateUnselectQuotationInput(
    payload as
      UnselectQuotationInput
  );
}

export function validateWithdrawQuotationPayload(
  payload:
    unknown
): QuotationValidationResult<
  WithdrawQuotationInput
> {
  const payloadErrors =
    validateQuotationPayloadObject(
      payload
    );

  if (
    payloadErrors.length >
    0
  ) {
    return createQuotationValidationFailure(
      payloadErrors
    );
  }

  return validateWithdrawQuotationInput(
    payload as
      WithdrawQuotationInput
  );
}

export function validateRejectQuotationPayload(
  payload:
    unknown
): QuotationValidationResult<
  RejectQuotationInput
> {
  const payloadErrors =
    validateQuotationPayloadObject(
      payload
    );

  if (
    payloadErrors.length >
    0
  ) {
    return createQuotationValidationFailure(
      payloadErrors
    );
  }

  return validateRejectQuotationInput(
    payload as
      RejectQuotationInput
  );
}

/* ============================================================================
 * End of Part D
 * ============================================================================
 */
/* ============================================================================
 * EasyMovers
 * Quotation Validator
 * Part E
 * ============================================================================
 *
 * Final validator section.
 *
 * Responsibilities:
 * - Validate quotation search criteria
 * - Validate amount ranges
 * - Validate date ranges
 * - Validate status collections
 * - Validate sorting
 * - Validate pagination
 * - Validate quotation list queries
 * - Validate Booking quotation comparison results
 * - Provide final convenience validators
 * ============================================================================
 */

/* ============================================================================
 * Search / sort constants
 * ============================================================================
 */

const QUOTATION_SORT_FIELDS =
  new Set<
    QuotationSortField
  >([
    "createdAt",
    "updatedAt",
    "totalAmount",
    "validUntil",
    "pickupDate",
    "deliveryDate",
    "status",
  ]);

const QUOTATION_SORT_DIRECTIONS =
  new Set<
    QuotationSortDirection
  >([
    "asc",
    "desc",
  ]);

/* ============================================================================
 * Boolean validation
 * ============================================================================
 */

/**
 * Validates an optional boolean field.
 */
export function validateQuotationBoolean(
  field:
    string,
  value:
    unknown,
  required =
    false
): QuotationValidationError[] {
  if (
    isQuotationMissing(
      value
    )
  ) {
    return required
      ? [
          quotationValidationError(
            field,
            QuotationValidationErrorCode
              .REQUIRED,
            `${field} is required.`
          ),
        ]
      : [];
  }

  if (
    typeof value !==
    "boolean"
  ) {
    return [
      quotationValidationError(
        field,
        QuotationValidationErrorCode
          .INVALID_TYPE,
        `${field} must be a boolean.`,
        value
      ),
    ];
  }

  return [];
}

/* ============================================================================
 * Status collection validation
 * ============================================================================
 */

/**
 * Validates a collection of quotation statuses.
 */
export function validateQuotationStatusArray(
  field:
    string,
  value:
    unknown
): QuotationValidationError[] {
  const errors:
    QuotationValidationError[] =
      [];

  if (
    isQuotationMissing(
      value
    )
  ) {
    return errors;
  }

  if (
    !Array.isArray(
      value
    )
  ) {
    return [
      quotationValidationError(
        field,
        QuotationValidationErrorCode
          .INVALID_TYPE,
        `${field} must be an array.`,
        value
      ),
    ];
  }

  value.forEach(
    (
      status,
      index
    ) => {
      appendQuotationValidationErrors(
        errors,
        validateQuotationStatusValue(
          `${field}[${index}]`,
          status,
          true
        )
      );
    }
  );

  const validStatuses =
    value.filter(
      (
        status
      ): status is QuotationStatus =>
        isQuotationStatus(
          status
        )
    );

  const uniqueStatuses =
    new Set(
      validStatuses
    );

  if (
    uniqueStatuses.size !==
    validStatuses.length
  ) {
    errors.push(
      quotationValidationError(
        field,
        QuotationValidationErrorCode
          .DUPLICATE,
        `${field} cannot contain duplicate quotation statuses.`,
        value
      )
    );
  }

  return errors;
}

/* ============================================================================
 * Amount range validation
 * ============================================================================
 */

/**
 * Validates minimum and maximum quotation amount criteria.
 */
export function validateQuotationAmountRange(
  minimumAmount:
    unknown,
  maximumAmount:
    unknown
): QuotationValidationError[] {
  const errors:
    QuotationValidationError[] =
      [];

  appendQuotationValidationErrors(
    errors,
    validateQuotationAmount(
      "minimumAmount",
      minimumAmount,
      false
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationAmount(
      "maximumAmount",
      maximumAmount,
      false
    )
  );

  if (
    typeof minimumAmount ===
      "number" &&
    Number.isFinite(
      minimumAmount
    ) &&
    typeof maximumAmount ===
      "number" &&
    Number.isFinite(
      maximumAmount
    ) &&
    minimumAmount >
      maximumAmount
  ) {
    errors.push(
      quotationValidationError(
        "maximumAmount",
        QuotationValidationErrorCode
          .OUT_OF_RANGE,
        "maximumAmount cannot be lower than minimumAmount.",
        maximumAmount
      )
    );
  }

  return errors;
}

/* ============================================================================
 * Search date validation
 * ============================================================================
 */

/**
 * Validates optional search date criteria.
 *
 * Historical dates are allowed because search filters may query
 * previous quotations.
 */
export function validateQuotationSearchDate(
  field:
    string,
  value:
    unknown
): QuotationValidationError[] {
  return validateQuotationDate(
    field,
    value,
    {
      required:
        false,

      allowPast:
        true,

      allowToday:
        true,
    }
  );
}

/**
 * Validates one search date range.
 */
export function validateQuotationSearchDateRange(
  fromField:
    string,
  fromValue:
    unknown,
  untilField:
    string,
  untilValue:
    unknown
): QuotationValidationError[] {
  const errors:
    QuotationValidationError[] =
      [];

  appendQuotationValidationErrors(
    errors,
    validateQuotationSearchDate(
      fromField,
      fromValue
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationSearchDate(
      untilField,
      untilValue
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationDateRange(
      fromField,
      fromValue,
      untilField,
      untilValue
    )
  );

  return errors;
}

/* ============================================================================
 * Search criteria validation
 * ============================================================================
 */

/**
 * Validates QuotationSearchCriteria.
 */
export function validateQuotationSearchCriteria(
  criteria:
    QuotationSearchCriteria
): QuotationValidationResult<
  QuotationSearchCriteria
> {
  const errors:
    QuotationValidationError[] =
      [];

  appendQuotationValidationErrors(
    errors,
    validateQuotationIdentifier(
      "quotationId",
      criteria.quotationId,
      false
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationIdentifier(
      "quotationNumber",
      criteria.quotationNumber,
      false
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationIdentifier(
      "referenceId",
      criteria.referenceId,
      false
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationIdentifier(
      "leadId",
      criteria.leadId,
      false
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationIdentifier(
      "bookingId",
      criteria.bookingId,
      false
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationIdentifier(
      "vendorId",
      criteria.vendorId,
      false
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationIdentifier(
      "userId",
      criteria.userId,
      false
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationStatusValue(
      "status",
      criteria.status,
      false
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationStatusArray(
      "statuses",
      criteria.statuses
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationBoolean(
      "selectedForBooking",
      criteria.selectedForBooking,
      false
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationAmountRange(
      criteria.minimumAmount,
      criteria.maximumAmount
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationSearchDateRange(
      "validFrom",
      criteria.validFrom,
      "validUntil",
      criteria.validUntil
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationSearchDateRange(
      "pickupDateFrom",
      criteria.pickupDateFrom,
      "pickupDateTo",
      criteria.pickupDateTo
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationSearchDateRange(
      "createdFrom",
      criteria.createdFrom,
      "createdUntil",
      criteria.createdUntil
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationString(
      "search",
      criteria.search,
      {
        required:
          false,

        minimumLength:
          1,

        maximumLength:
          QUOTATION_SHORT_TEXT_MAX_LENGTH,
      }
    )
  );

  /**
   * status and statuses can technically coexist, but doing so creates
   * ambiguous repository semantics.
   */
  if (
    criteria.status !==
      undefined &&
    criteria.statuses !==
      undefined &&
    criteria.statuses.length >
      0
  ) {
    errors.push(
      quotationValidationError(
        "statuses",
        QuotationValidationErrorCode
          .BUSINESS_RULE,
        "Use either status or statuses when searching quotations, not both."
      )
    );
  }

  if (
    errors.length >
    0
  ) {
    return createQuotationValidationFailure(
      errors
    );
  }

  return createQuotationValidationSuccess(
    criteria
  );
}

/* ============================================================================
 * Pagination validation
 * ============================================================================
 */

/**
 * Validates quotation pagination.
 */
export function validateQuotationPagination(
  pagination:
    QuotationPaginationInput
): QuotationValidationResult<
  QuotationPaginationInput
> {
  const errors:
    QuotationValidationError[] =
      [];

  appendQuotationValidationErrors(
    errors,
    validateQuotationNumber(
      "page",
      pagination.page,
      {
        required:
          true,

        minimum:
          1,

        integer:
          true,

        allowZero:
          false,
      }
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationNumber(
      "pageSize",
      pagination.pageSize,
      {
        required:
          true,

        minimum:
          1,

        maximum:
          QUOTATION_MAX_PAGE_SIZE,

        integer:
          true,

        allowZero:
          false,
      }
    )
  );

  if (
    errors.length >
    0
  ) {
    return createQuotationValidationFailure(
      errors
    );
  }

  return createQuotationValidationSuccess(
    pagination
  );
}

/**
 * Creates safe default pagination.
 */
export function createDefaultQuotationPagination():
  QuotationPaginationInput {
  return {
    page:
      QUOTATION_DEFAULT_PAGE,

    pageSize:
      QUOTATION_DEFAULT_PAGE_SIZE,
  };
}

/* ============================================================================
 * Sort validation
 * ============================================================================
 */

/**
 * Runtime QuotationSortField guard.
 */
export function isQuotationSortField(
  value:
    unknown
): value is QuotationSortField {
  return (
    typeof value ===
      "string" &&
    QUOTATION_SORT_FIELDS.has(
      value as
        QuotationSortField
    )
  );
}

/**
 * Runtime QuotationSortDirection guard.
 */
export function isQuotationSortDirection(
  value:
    unknown
): value is QuotationSortDirection {
  return (
    typeof value ===
      "string" &&
    QUOTATION_SORT_DIRECTIONS.has(
      value as
        QuotationSortDirection
    )
  );
}

/**
 * Validates quotation sorting.
 */
export function validateQuotationSort(
  sort:
    QuotationSort
): QuotationValidationResult<
  QuotationSort
> {
  const errors:
    QuotationValidationError[] =
      [];

  if (
    !isQuotationSortField(
      sort.field
    )
  ) {
    errors.push(
      quotationValidationError(
        "sort.field",
        QuotationValidationErrorCode
          .INVALID_VALUE,
        "sort.field contains an unsupported quotation sort field.",
        sort.field
      )
    );
  }

  if (
    !isQuotationSortDirection(
      sort.direction
    )
  ) {
    errors.push(
      quotationValidationError(
        "sort.direction",
        QuotationValidationErrorCode
          .INVALID_VALUE,
        "sort.direction must be asc or desc.",
        sort.direction
      )
    );
  }

  if (
    errors.length >
    0
  ) {
    return createQuotationValidationFailure(
      errors
    );
  }

  return createQuotationValidationSuccess(
    sort
  );
}

/**
 * Default quotation ordering.
 */
export function createDefaultQuotationSort():
  QuotationSort {
  return {
    field:
      "createdAt",

    direction:
      "desc",
  };
}

/* ============================================================================
 * List query validation
 * ============================================================================
 */

/**
 * Validates a complete quotation listing/search query.
 */
export function validateQuotationListQuery(
  query:
    QuotationListQuery
): QuotationValidationResult<
  QuotationListQuery
> {
  const errors:
    QuotationValidationError[] =
      [];

  const warnings:
    QuotationValidationWarning[] =
      [];

  if (
    query.criteria
  ) {
    const criteriaValidation =
      validateQuotationSearchCriteria(
        query.criteria
      );

    if (
      !criteriaValidation.valid
    ) {
      errors.push(
        ...criteriaValidation.errors
      );

      warnings.push(
        ...criteriaValidation.warnings
      );
    }
  }

  if (
    query.pagination
  ) {
    const paginationValidation =
      validateQuotationPagination(
        query.pagination
      );

    if (
      !paginationValidation.valid
    ) {
      errors.push(
        ...paginationValidation.errors
      );

      warnings.push(
        ...paginationValidation.warnings
      );
    }
  }

  if (
    query.sort
  ) {
    const sortValidation =
      validateQuotationSort(
        query.sort
      );

    if (
      !sortValidation.valid
    ) {
      errors.push(
        ...sortValidation.errors
      );

      warnings.push(
        ...sortValidation.warnings
      );
    }
  }

  if (
    errors.length >
    0
  ) {
    return createQuotationValidationFailure(
      errors,
      warnings
    );
  }

  return createQuotationValidationSuccess(
    {
      criteria:
        query.criteria,

      pagination:
        query.pagination ??
        createDefaultQuotationPagination(),

      sort:
        query.sort ??
        createDefaultQuotationSort(),
    },
    warnings
  );
}

/* ============================================================================
 * Comparison validation
 * ============================================================================
 */

/**
 * Validates a Booking quotation comparison result.
 *
 * This primarily protects service/controller composition rather than
 * incoming request data.
 */
export function validateBookingQuotationComparison(
  comparison:
    BookingQuotationComparison
): QuotationValidationResult<
  BookingQuotationComparison
> {
  const errors:
    QuotationValidationError[] =
      [];

  appendQuotationValidationErrors(
    errors,
    validateQuotationIdentifier(
      "bookingId",
      comparison.bookingId,
      true
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationNumber(
      "totalQuotations",
      comparison.totalQuotations,
      {
        required:
          true,

        minimum:
          0,

        integer:
          true,

        allowZero:
          true,
      }
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationAmount(
      "lowestAmount",
      comparison.lowestAmount,
      false
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationAmount(
      "highestAmount",
      comparison.highestAmount,
      false
    )
  );

  appendQuotationValidationErrors(
    errors,
    validateQuotationIdentifier(
      "selectedQuotationId",
      comparison.selectedQuotationId,
      false
    )
  );

  if (
    !Array.isArray(
      comparison.quotations
    )
  ) {
    errors.push(
      quotationValidationError(
        "quotations",
        QuotationValidationErrorCode
          .INVALID_TYPE,
        "quotations must be an array.",
        comparison.quotations
      )
    );

    return createQuotationValidationFailure(
      errors
    );
  }

  if (
    comparison.totalQuotations !==
      comparison.quotations.length
  ) {
    errors.push(
      quotationValidationError(
        "totalQuotations",
        QuotationValidationErrorCode
          .BUSINESS_RULE,
        "totalQuotations must equal the number of comparison quotations.",
        comparison.totalQuotations
      )
    );
  }

  const amounts =
    comparison.quotations
      .map(
        (
          quotation
        ) =>
          quotation.totalAmount
      )
      .filter(
        (
          amount
        ): amount is number =>
          typeof amount ===
            "number" &&
          Number.isFinite(
            amount
          )
      );

  comparison.quotations.forEach(
    (
      quotation,
      index
    ) => {
      appendQuotationValidationErrors(
        errors,
        validateQuotationIdentifier(
          `quotations[${index}].quotationId`,
          quotation.quotationId,
          true
        )
      );

      appendQuotationValidationErrors(
        errors,
        validateQuotationIdentifier(
          `quotations[${index}].quotationNumber`,
          quotation.quotationNumber,
          true
        )
      );

      appendQuotationValidationErrors(
        errors,
        validateQuotationAmount(
          `quotations[${index}].totalAmount`,
          quotation.totalAmount,
          true
        )
      );

      appendQuotationValidationErrors(
        errors,
        validateQuotationCurrencyValue(
          `quotations[${index}].currency`,
          quotation.currency,
          true
        )
      );

      appendQuotationValidationErrors(
        errors,
        validateQuotationBoolean(
          `quotations[${index}].selected`,
          quotation.selected,
          true
        )
      );

      appendQuotationValidationErrors(
        errors,
        validateQuotationSearchDate(
          `quotations[${index}].pickupDate`,
          quotation.pickupDate
        )
      );

      appendQuotationValidationErrors(
        errors,
        validateQuotationSearchDate(
          `quotations[${index}].deliveryDate`,
          quotation.deliveryDate
        )
      );

      appendQuotationValidationErrors(
        errors,
        validateQuotationSearchDate(
          `quotations[${index}].validUntil`,
          quotation.validUntil
        )
      );

      appendQuotationValidationErrors(
        errors,
        validateQuotationNumber(
          `quotations[${index}].transitDays`,
          quotation.transitDays,
          {
            required:
              false,

            minimum:
              0,

            maximum:
              QUOTATION_MAX_TRANSIT_DAYS,

            integer:
              true,

            allowZero:
              true,
          }
        )
      );
    }
  );

  if (
    amounts.length >
      0
  ) {
    const calculatedLowest =
      Math.min(
        ...amounts
      );

    const calculatedHighest =
      Math.max(
        ...amounts
      );

    if (
      comparison.lowestAmount !==
        undefined &&
      Math.abs(
        comparison.lowestAmount -
          calculatedLowest
      ) >
        QUOTATION_TOTAL_TOLERANCE
    ) {
      errors.push(
        quotationValidationError(
          "lowestAmount",
          QuotationValidationErrorCode
            .BUSINESS_RULE,
          `lowestAmount must equal ${calculatedLowest}.`,
          comparison.lowestAmount
        )
      );
    }

    if (
      comparison.highestAmount !==
        undefined &&
      Math.abs(
        comparison.highestAmount -
          calculatedHighest
      ) >
        QUOTATION_TOTAL_TOLERANCE
    ) {
      errors.push(
        quotationValidationError(
          "highestAmount",
          QuotationValidationErrorCode
            .BUSINESS_RULE,
          `highestAmount must equal ${calculatedHighest}.`,
          comparison.highestAmount
        )
      );
    }
  }

  const selectedQuotations =
    comparison.quotations.filter(
      (
        quotation
      ) =>
        quotation.selected
    );

  if (
    selectedQuotations.length >
      1
  ) {
    errors.push(
      quotationValidationError(
        "quotations",
        QuotationValidationErrorCode
          .BUSINESS_RULE,
        "Only one quotation may be selected for a Booking."
      )
    );
  }

  if (
    comparison.selectedQuotationId
  ) {
    const selectedQuotation =
      comparison.quotations.find(
        (
          quotation
        ) =>
          quotation.quotationId ===
          comparison.selectedQuotationId
      );

    if (
      !selectedQuotation
    ) {
      errors.push(
        quotationValidationError(
          "selectedQuotationId",
          QuotationValidationErrorCode
            .BUSINESS_RULE,
          "selectedQuotationId must reference a quotation contained in this Booking comparison.",
          comparison.selectedQuotationId
        )
      );
    } else if (
      !selectedQuotation.selected
    ) {
      errors.push(
        quotationValidationError(
          "selectedQuotationId",
          QuotationValidationErrorCode
            .BUSINESS_RULE,
          "selectedQuotationId must reference the quotation marked as selected.",
          comparison.selectedQuotationId
        )
      );
    }
  } else if (
    selectedQuotations.length >
      0
  ) {
    errors.push(
      quotationValidationError(
        "selectedQuotationId",
        QuotationValidationErrorCode
          .BUSINESS_RULE,
        "selectedQuotationId is required when a comparison quotation is marked as selected."
      )
    );
  }

  if (
    errors.length >
    0
  ) {
    return createQuotationValidationFailure(
      errors
    );
  }

  return createQuotationValidationSuccess(
    comparison
  );
}

/* ============================================================================
 * Unknown search payload adapters
 * ============================================================================
 */

export function validateQuotationSearchPayload(
  payload:
    unknown
): QuotationValidationResult<
  QuotationSearchCriteria
> {
  const payloadErrors =
    validateQuotationPayloadObject(
      payload
    );

  if (
    payloadErrors.length >
    0
  ) {
    return createQuotationValidationFailure(
      payloadErrors
    );
  }

  return validateQuotationSearchCriteria(
    payload as
      QuotationSearchCriteria
  );
}

export function validateQuotationListQueryPayload(
  payload:
    unknown
): QuotationValidationResult<
  QuotationListQuery
> {
  const payloadErrors =
    validateQuotationPayloadObject(
      payload
    );

  if (
    payloadErrors.length >
    0
  ) {
    return createQuotationValidationFailure(
      payloadErrors
    );
  }

  return validateQuotationListQuery(
    payload as
      QuotationListQuery
  );
}

/* ============================================================================
 * Convenience defaults
 * ============================================================================
 */

/**
 * Provides the standard query used when GET /api/quotations is
 * called without explicit search options.
 */
export function createDefaultQuotationListQuery():
  QuotationListQuery {
  return {
    pagination:
      createDefaultQuotationPagination(),

    sort:
      createDefaultQuotationSort(),
  };
}

/* ============================================================================
 * Final validator facade
 * ============================================================================
 */

/**
 * Central export facade.
 *
 * This gives future controller/service files one predictable
 * object to consume while all named exports remain available.
 */
export const QuotationValidator = {
  /* Create */

  validateCreate:
    validateCompleteCreateQuotationInput,

  validateCreatePayload:
    validateCreateQuotationPayload,

  /* Update */

  validateUpdate:
    validateUpdateQuotationInput,

  validateUpdatePayload:
    validateUpdateQuotationPayload,

  /* Status */

  validateStatusUpdate:
    validateUpdateQuotationStatusInput,

  validateStatusPayload:
    validateQuotationStatusPayload,

  validateStatusTransition:
    validateQuotationStatusTransition,

  canTransitionStatus:
    canTransitionQuotationStatus,

  /* Selection */

  validateSelection:
    validateSelectQuotationInput,

  validateSelectionPayload:
    validateSelectQuotationPayload,

  validateUnselection:
    validateUnselectQuotationInput,

  validateUnselectionPayload:
    validateUnselectQuotationPayload,

  validateSelectableStatus:
    validateQuotationSelectableStatus,

  /* Withdrawal */

  validateWithdrawal:
    validateWithdrawQuotationInput,

  validateWithdrawalPayload:
    validateWithdrawQuotationPayload,

  validateWithdrawableStatus:
    validateQuotationWithdrawableStatus,

  /* Rejection */

  validateRejection:
    validateRejectQuotationInput,

  validateRejectionPayload:
    validateRejectQuotationPayload,

  validateRejectableStatus:
    validateQuotationRejectableStatus,

  /* Search */

  validateSearch:
    validateQuotationSearchCriteria,

  validateSearchPayload:
    validateQuotationSearchPayload,

  validateListQuery:
    validateQuotationListQuery,

  validateListQueryPayload:
    validateQuotationListQueryPayload,

  /* Pagination / sorting */

  validatePagination:
    validateQuotationPagination,

  validateSort:
    validateQuotationSort,

  createDefaultPagination:
    createDefaultQuotationPagination,

  createDefaultSort:
    createDefaultQuotationSort,

  createDefaultListQuery:
    createDefaultQuotationListQuery,

  /* Commercial */

  validatePricingBreakdown:
    validateQuotationPricingBreakdown,

  validateCommercialDetails:
    validateCreateQuotationCommercialDetails,

  calculateSubtotal:
    calculateQuotationSubtotal,

  calculateTotal:
    calculateQuotationTotal,

  /* Comparison */

  validateComparison:
    validateBookingQuotationComparison,
} as const;

/* ============================================================================
 * End of quotation.validator.ts
 * ============================================================================
 */