/**
 * ============================================================================
 * EasyMovers
 * Payment Domain Validator
 * ============================================================================
 *
 * File:
 * domains/payment/validators/payment.validator.ts
 *
 * Responsibilities:
 * - Define Payment-domain validation result contracts
 * - Provide reusable validation helpers
 * - Validate identifiers, strings, numbers, money and dates
 * - Validate Payment-domain enums and shared value objects
 * - Provide foundations for command/business validation
 *
 * This file does not:
 * - Access Prisma
 * - Access repositories
 * - Call payment gateways
 * - Map HTTP requests
 * - Mutate Payment aggregates
 * - Calculate markup, commission or settlement
 * ============================================================================
 */

import {
  PaymentActorType,
  PaymentCurrency,
  PaymentMethod,
  PaymentProvider,
  PaymentPurpose,
  PaymentSortDirection,
  PaymentSortField,
  PaymentSource,
  PaymentStatus,
  PaymentTransactionStatus,
  PaymentTransactionType,
  PaymentWebhookEventType,
  isPaymentCurrency,
  isPaymentMethod,
  isPaymentProvider,
  isPaymentPurpose,
  isPaymentStatus,
  isPaymentTransactionStatus,
  isPaymentTransactionType,
} from "../models/payment.model";

import type {
  PaymentActor,
  PaymentFailure,
  PaymentGatewayReference,
  PaymentMoney,
} from "../models/payment.model";

/* ============================================================================
 * Validation error codes
 * ============================================================================
 */

/**
 * Normalized Payment-domain validation error codes.
 *
 * These codes are intentionally stable because controllers/mappers may later
 * expose them through API error responses.
 */
export enum PaymentValidationErrorCode {
  REQUIRED_FIELD_MISSING =
    "REQUIRED_FIELD_MISSING",

  INVALID_VALUE =
    "INVALID_VALUE",

  INVALID_FORMAT =
    "INVALID_FORMAT",

  INVALID_ENUM_VALUE =
    "INVALID_ENUM_VALUE",

  INVALID_NUMBER =
    "INVALID_NUMBER",

  OUT_OF_RANGE =
    "OUT_OF_RANGE",

  INVALID_DATE =
    "INVALID_DATE",

  INVALID_DATE_RANGE =
    "INVALID_DATE_RANGE",

  CURRENCY_MISMATCH =
    "CURRENCY_MISMATCH",

  AMOUNT_MISMATCH =
    "AMOUNT_MISMATCH",

  BUSINESS_RULE =
    "BUSINESS_RULE",

  DUPLICATE_TRANSACTION =
    "DUPLICATE_TRANSACTION",

  INVALID_STATUS_TRANSITION =
    "INVALID_STATUS_TRANSITION",

  PAYMENT_ALREADY_PAID =
    "PAYMENT_ALREADY_PAID",

  PAYMENT_CANCELLED =
    "PAYMENT_CANCELLED",

  REFUND_EXCEEDS_AVAILABLE_AMOUNT =
    "REFUND_EXCEEDS_AVAILABLE_AMOUNT",

  TRANSACTION_NOT_ELIGIBLE =
    "TRANSACTION_NOT_ELIGIBLE",
}

/* ============================================================================
 * Validation result contracts
 * ============================================================================
 */

export interface PaymentValidationError {
  field:
    string;

  code:
    PaymentValidationErrorCode;

  message:
    string;

  value?:
    unknown;
}

export interface PaymentValidationResult {
  valid:
    boolean;

  errors:
    PaymentValidationError[];
}

/* ============================================================================
 * Validation result helpers
 * ============================================================================
 */

function success():
  PaymentValidationResult {
  return {
    valid:
      true,

    errors:
      [],
  };
}

function failure(
  errors:
    PaymentValidationError[]
): PaymentValidationResult {
  return {
    valid:
      false,

    errors,
  };
}

/**
 * Combines multiple validation results into one result.
 */
export function combinePaymentValidationResults(
  results:
    PaymentValidationResult[]
): PaymentValidationResult {
  const errors =
    results.flatMap(
      (
        result
      ) =>
        result.errors
    );

  return errors.length >
    0
    ? failure(
        errors
      )
    : success();
}

/* ============================================================================
 * Error factory helpers
 * ============================================================================
 */

function requiredError(
  field:
    string,
  message:
    string
): PaymentValidationError {
  return {
    field,

    code:
      PaymentValidationErrorCode
        .REQUIRED_FIELD_MISSING,

    message,
  };
}

function invalidValueError(
  field:
    string,
  message:
    string,
  value?:
    unknown
): PaymentValidationError {
  return {
    field,

    code:
      PaymentValidationErrorCode
        .INVALID_VALUE,

    message,

    ...(value !== undefined
      ? {
          value,
        }
      : {}),
  };
}

function invalidEnumError(
  field:
    string,
  value:
    unknown
): PaymentValidationError {
  return {
    field,

    code:
      PaymentValidationErrorCode
        .INVALID_ENUM_VALUE,

    message:
      `${field} contains an unsupported value.`,

    value,
  };
}

function invalidNumberError(
  field:
    string,
  value:
    unknown
): PaymentValidationError {
  return {
    field,

    code:
      PaymentValidationErrorCode
        .INVALID_NUMBER,

    message:
      `${field} must contain a valid finite number.`,

    value,
  };
}

function outOfRangeError(
  field:
    string,
  message:
    string,
  value?:
    unknown
): PaymentValidationError {
  return {
    field,

    code:
      PaymentValidationErrorCode
        .OUT_OF_RANGE,

    message,

    ...(value !== undefined
      ? {
          value,
        }
      : {}),
  };
}

function invalidDateError(
  field:
    string,
  value:
    unknown
): PaymentValidationError {
  return {
    field,

    code:
      PaymentValidationErrorCode
        .INVALID_DATE,

    message:
      `${field} must contain a valid date.`,

    value,
  };
}

/* ============================================================================
 * Primitive helpers
 * ============================================================================
 */

export function isEmptyPaymentValue(
  value:
    unknown
): boolean {
  if (
    value ===
      undefined ||
    value ===
      null
  ) {
    return true;
  }

  if (
    typeof value ===
      "string" &&
    value.trim()
      .length ===
      0
  ) {
    return true;
  }

  return false;
}

export function isNonEmptyPaymentString(
  value:
    unknown
): value is string {
  return (
    typeof value ===
      "string" &&
    value.trim()
      .length >
      0
  );
}

export function normalizePaymentString(
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

export function isFinitePaymentNumber(
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

export function isNonNegativePaymentNumber(
  value:
    unknown
): value is number {
  return (
    isFinitePaymentNumber(
      value
    ) &&
    value >=
      0
  );
}

export function isPositivePaymentNumber(
  value:
    unknown
): value is number {
  return (
    isFinitePaymentNumber(
      value
    ) &&
    value >
      0
  );
}

/* ============================================================================
 * Date helpers
 * ============================================================================
 */

/**
 * Returns true for a valid ISO/date-compatible value.
 *
 * Exact date-format requirements may be tightened later by request mappers.
 */
export function isValidPaymentDate(
  value:
    unknown
): value is string {
  if (
    !isNonEmptyPaymentString(
      value
    )
  ) {
    return false;
  }

  return !Number.isNaN(
    Date.parse(
      value
    )
  );
}

/* ============================================================================
 * Identifier validation
 * ============================================================================
 */

export function validatePaymentIdentifier(
  field:
    string,
  value:
    unknown,
  required =
    true
): PaymentValidationResult {
  if (
    isEmptyPaymentValue(
      value
    )
  ) {
    return required
      ? failure([
          requiredError(
            field,
            `${field} is required.`
          ),
        ])
      : success();
  }

  if (
    !isNonEmptyPaymentString(
      value
    )
  ) {
    return failure([
      invalidValueError(
        field,
        `${field} must contain a valid non-empty string.`,
        value
      ),
    ]);
  }

  return success();
}

/* ============================================================================
 * Amount validation
 * ============================================================================
 */

export interface ValidatePaymentAmountOptions {
  required?:
    boolean;

  allowZero?:
    boolean;

  maximumAmount?:
    number;
}

/**
 * Validates one monetary numeric amount.
 */
export function validatePaymentAmount(
  field:
    string,
  value:
    unknown,
  options?:
    ValidatePaymentAmountOptions
): PaymentValidationResult {
  const required =
    options?.required ??
    true;

  const allowZero =
    options?.allowZero ??
    true;

  if (
    value ===
      undefined ||
    value ===
      null
  ) {
    return required
      ? failure([
          requiredError(
            field,
            `${field} is required.`
          ),
        ])
      : success();
  }

  if (
    !isFinitePaymentNumber(
      value
    )
  ) {
    return failure([
      invalidNumberError(
        field,
        value
      ),
    ]);
  }

  if (
    value <
      0
  ) {
    return failure([
      outOfRangeError(
        field,
        `${field} cannot be negative.`,
        value
      ),
    ]);
  }

  if (
    !allowZero &&
    value ===
      0
  ) {
    return failure([
      outOfRangeError(
        field,
        `${field} must be greater than zero.`,
        value
      ),
    ]);
  }

  if (
    options
      ?.maximumAmount !==
      undefined &&
    value >
      options
        .maximumAmount
  ) {
    return failure([
      outOfRangeError(
        field,
        `${field} cannot exceed ${options.maximumAmount}.`,
        value
      ),
    ]);
  }

  return success();
}

/* ============================================================================
 * Currency validation
 * ============================================================================
 */

export function validatePaymentCurrency(
  value:
    unknown,
  field =
    "currency",
  required =
    true
): PaymentValidationResult {
  if (
    isEmptyPaymentValue(
      value
    )
  ) {
    return required
      ? failure([
          requiredError(
            field,
            `${field} is required.`
          ),
        ])
      : success();
  }

  if (
    !isPaymentCurrency(
      value
    )
  ) {
    return failure([
      invalidEnumError(
        field,
        value
      ),
    ]);
  }

  return success();
}

/* ============================================================================
 * Payment status validation
 * ============================================================================
 */

export function validatePaymentStatus(
  value:
    unknown,
  field =
    "status",
  required =
    true
): PaymentValidationResult {
  if (
    isEmptyPaymentValue(
      value
    )
  ) {
    return required
      ? failure([
          requiredError(
            field,
            `${field} is required.`
          ),
        ])
      : success();
  }

  if (
    !isPaymentStatus(
      value
    )
  ) {
    return failure([
      invalidEnumError(
        field,
        value
      ),
    ]);
  }

  return success();
}

/* ============================================================================
 * Transaction-status validation
 * ============================================================================
 */

export function validatePaymentTransactionStatus(
  value:
    unknown,
  field =
    "status",
  required =
    true
): PaymentValidationResult {
  if (
    isEmptyPaymentValue(
      value
    )
  ) {
    return required
      ? failure([
          requiredError(
            field,
            `${field} is required.`
          ),
        ])
      : success();
  }

  if (
    !isPaymentTransactionStatus(
      value
    )
  ) {
    return failure([
      invalidEnumError(
        field,
        value
      ),
    ]);
  }

  return success();
}

/* ============================================================================
 * Transaction-type validation
 * ============================================================================
 */

export function validatePaymentTransactionType(
  value:
    unknown,
  field =
    "transactionType",
  required =
    true
): PaymentValidationResult {
  if (
    isEmptyPaymentValue(
      value
    )
  ) {
    return required
      ? failure([
          requiredError(
            field,
            `${field} is required.`
          ),
        ])
      : success();
  }

  if (
    !isPaymentTransactionType(
      value
    )
  ) {
    return failure([
      invalidEnumError(
        field,
        value
      ),
    ]);
  }

  return success();
}

/* ============================================================================
 * Payment-purpose validation
 * ============================================================================
 */

export function validatePaymentPurpose(
  value:
    unknown,
  field =
    "purpose",
  required =
    false
): PaymentValidationResult {
  if (
    isEmptyPaymentValue(
      value
    )
  ) {
    return required
      ? failure([
          requiredError(
            field,
            `${field} is required.`
          ),
        ])
      : success();
  }

  if (
    !isPaymentPurpose(
      value
    )
  ) {
    return failure([
      invalidEnumError(
        field,
        value
      ),
    ]);
  }

  return success();
}

/* ============================================================================
 * Payment-method validation
 * ============================================================================
 */

export function validatePaymentMethod(
  value:
    unknown,
  field =
    "method",
  required =
    false
): PaymentValidationResult {
  if (
    isEmptyPaymentValue(
      value
    )
  ) {
    return required
      ? failure([
          requiredError(
            field,
            `${field} is required.`
          ),
        ])
      : success();
  }

  if (
    !isPaymentMethod(
      value
    )
  ) {
    return failure([
      invalidEnumError(
        field,
        value
      ),
    ]);
  }

  return success();
}

/* ============================================================================
 * Provider validation
 * ============================================================================
 */

export function validatePaymentProvider(
  value:
    unknown,
  field =
    "provider",
  required =
    true
): PaymentValidationResult {
  if (
    isEmptyPaymentValue(
      value
    )
  ) {
    return required
      ? failure([
          requiredError(
            field,
            `${field} is required.`
          ),
        ])
      : success();
  }

  if (
    !isPaymentProvider(
      value
    )
  ) {
    return failure([
      invalidEnumError(
        field,
        value
      ),
    ]);
  }

  return success();
}

/* ============================================================================
 * Payment source validation
 * ============================================================================
 */

export function validatePaymentSource(
  value:
    unknown,
  field =
    "source",
  required =
    true
): PaymentValidationResult {
  if (
    isEmptyPaymentValue(
      value
    )
  ) {
    return required
      ? failure([
          requiredError(
            field,
            `${field} is required.`
          ),
        ])
      : success();
  }

  if (
    !Object.values(
      PaymentSource
    ).includes(
      value as PaymentSource
    )
  ) {
    return failure([
      invalidEnumError(
        field,
        value
      ),
    ]);
  }

  return success();
}

/* ============================================================================
 * Actor validation
 * ============================================================================
 */

export function validatePaymentActor(
  actor:
    PaymentActor | undefined,
  field =
    "actor",
  required =
    false
): PaymentValidationResult {
  if (
    actor ===
      undefined
  ) {
    return required
      ? failure([
          requiredError(
            field,
            `${field} is required.`
          ),
        ])
      : success();
  }

  const errors:
    PaymentValidationError[] =
      [];

  if (
    !Object.values(
      PaymentActorType
    ).includes(
      actor.actorType
    )
  ) {
    errors.push(
      invalidEnumError(
        `${field}.actorType`,
        actor.actorType
      )
    );
  }

  if (
    actor.actorId !==
      undefined &&
    !isNonEmptyPaymentString(
      actor.actorId
    )
  ) {
    errors.push(
      invalidValueError(
        `${field}.actorId`,
        `${field}.actorId must contain a valid non-empty string.`,
        actor.actorId
      )
    );
  }

  if (
    actor.displayName !==
      undefined &&
    !isNonEmptyPaymentString(
      actor.displayName
    )
  ) {
    errors.push(
      invalidValueError(
        `${field}.displayName`,
        `${field}.displayName must contain a valid non-empty string.`,
        actor.displayName
      )
    );
  }

  return errors.length >
    0
    ? failure(
        errors
      )
    : success();
}

/* ============================================================================
 * Money contract validation
 * ============================================================================
 */

export function validatePaymentMoney(
  money:
    PaymentMoney | undefined,
  field =
    "amount",
  required =
    true,
  allowZero =
    false
): PaymentValidationResult {
  if (
    money ===
      undefined
  ) {
    return required
      ? failure([
          requiredError(
            field,
            `${field} is required.`
          ),
        ])
      : success();
  }

  return combinePaymentValidationResults([
    validatePaymentAmount(
      `${field}.amount`,
      money.amount,
      {
        required:
          true,

        allowZero,
      }
    ),

    validatePaymentCurrency(
      money.currency,
      `${field}.currency`,
      true
    ),
  ]);
}

/* ============================================================================
 * Gateway-reference validation
 * ============================================================================
 */

export function validatePaymentGatewayReference(
  gateway:
    PaymentGatewayReference | undefined,
  field =
    "gateway",
  required =
    false
): PaymentValidationResult {
  if (
    gateway ===
      undefined
  ) {
    return required
      ? failure([
          requiredError(
            field,
            `${field} is required.`
          ),
        ])
      : success();
  }

  const errors:
    PaymentValidationError[] =
      [];

  const providerValidation =
    validatePaymentProvider(
      gateway.provider,
      `${field}.provider`,
      true
    );

  errors.push(
    ...providerValidation.errors
  );

  const optionalIdentifiers:
    Array<[
      string,
      unknown
    ]> = [
      [
        `${field}.gatewayOrderId`,
        gateway.gatewayOrderId,
      ],
      [
        `${field}.gatewayPaymentId`,
        gateway.gatewayPaymentId,
      ],
      [
        `${field}.gatewayReferenceId`,
        gateway.gatewayReferenceId,
      ],
    ];

  for (
    const [
      identifierField,
      identifierValue,
    ]
    of optionalIdentifiers
  ) {
    if (
      identifierValue !==
        undefined &&
      !isNonEmptyPaymentString(
        identifierValue
      )
    ) {
      errors.push(
        invalidValueError(
          identifierField,
          `${identifierField} must contain a valid non-empty string.`,
          identifierValue
        )
      );
    }
  }

  return errors.length >
    0
    ? failure(
        errors
      )
    : success();
}

/* ============================================================================
 * Failure-contract validation
 * ============================================================================
 */

export function validatePaymentFailure(
  paymentFailure:
    PaymentFailure | undefined,
  field =
    "failure",
  required =
    false
): PaymentValidationResult {
  if (
    paymentFailure ===
      undefined
  ) {
    return required
      ? failure([
          requiredError(
            field,
            `${field} is required.`
          ),
        ])
      : success();
  }

  const errors:
    PaymentValidationError[] =
      [];

  const optionalStrings:
    Array<[
      string,
      unknown
    ]> = [
      [
        `${field}.reason`,
        paymentFailure.reason,
      ],
      [
        `${field}.message`,
        paymentFailure.message,
      ],
      [
        `${field}.providerCode`,
        paymentFailure.providerCode,
      ],
    ];

  for (
    const [
      stringField,
      stringValue,
    ]
    of optionalStrings
  ) {
    if (
      stringValue !==
        undefined &&
      !isNonEmptyPaymentString(
        stringValue
      )
    ) {
      errors.push(
        invalidValueError(
          stringField,
          `${stringField} must contain a valid non-empty string.`,
          stringValue
        )
      );
    }
  }

  if (
    paymentFailure.failedAt !==
      undefined &&
    !isValidPaymentDate(
      paymentFailure.failedAt
    )
  ) {
    errors.push(
      invalidDateError(
        `${field}.failedAt`,
        paymentFailure.failedAt
      )
    );
  }

  return errors.length >
    0
    ? failure(
        errors
      )
    : success();
}

/* ============================================================================
 * Webhook event-type validation
 * ============================================================================
 */

export function validatePaymentWebhookEventType(
  value:
    unknown,
  field =
    "eventType",
  required =
    true
): PaymentValidationResult {
  if (
    isEmptyPaymentValue(
      value
    )
  ) {
    return required
      ? failure([
          requiredError(
            field,
            `${field} is required.`
          ),
        ])
      : success();
  }

  if (
    !Object.values(
      PaymentWebhookEventType
    ).includes(
      value as PaymentWebhookEventType
    )
  ) {
    return failure([
      invalidEnumError(
        field,
        value
      ),
    ]);
  }

  return success();
}

/* ============================================================================
 * End of Payment Validator - Part A
 * ============================================================================
 */
/* ============================================================================
 * Create Payment validation
 * ============================================================================
 */

import type {
  CreateGatewayPaymentOrderInput,
  CreatePaymentInput,
  RecordPaymentTransactionInput,
  UpdatePaymentInput,
  VerifyPaymentInput,
} from "../models/payment.model";

/**
 * Validates Payment creation input.
 *
 * Important:
 * - totalAmount must be greater than zero
 * - advanceAmount cannot exceed totalAmount
 * - commercial-reference currency must match Payment currency
 * - commercial-reference customer payable must match totalAmount when supplied
 */
export function validateCreatePaymentInput(
  input:
    CreatePaymentInput
): PaymentValidationResult {
  const results:
    PaymentValidationResult[] = [
      validatePaymentIdentifier(
        "bookingId",
        input.bookingId,
        true
      ),

      validatePaymentAmount(
        "totalAmount",
        input.totalAmount,
        {
          required:
            true,

          allowZero:
            false,
        }
      ),

      validatePaymentCurrency(
        input.currency,
        "currency",
        true
      ),

      validatePaymentSource(
        input.source,
        "source",
        true
      ),
    ];

  if (
    input.bookingNumber !==
      undefined
  ) {
    results.push(
      validatePaymentIdentifier(
        "bookingNumber",
        input.bookingNumber,
        false
      )
    );
  }

  if (
    input.leadId !==
      undefined
  ) {
    results.push(
      validatePaymentIdentifier(
        "leadId",
        input.leadId,
        false
      )
    );
  }

  if (
    input.customerId !==
      undefined
  ) {
    results.push(
      validatePaymentIdentifier(
        "customerId",
        input.customerId,
        false
      )
    );
  }

  if (
    input.vendorId !==
      undefined
  ) {
    results.push(
      validatePaymentIdentifier(
        "vendorId",
        input.vendorId,
        false
      )
    );
  }

  if (
    input.quotationId !==
      undefined
  ) {
    results.push(
      validatePaymentIdentifier(
        "quotationId",
        input.quotationId,
        false
      )
    );
  }

  if (
    input.advanceAmount !==
      undefined
  ) {
    results.push(
      validatePaymentAmount(
        "advanceAmount",
        input.advanceAmount,
        {
          required:
            false,

          allowZero:
            true,
        }
      )
    );
  }

  const errors:
    PaymentValidationError[] =
      combinePaymentValidationResults(
        results
      ).errors;

  if (
    isFinitePaymentNumber(
      input.advanceAmount
    ) &&
    isFinitePaymentNumber(
      input.totalAmount
    ) &&
    input.advanceAmount >
      input.totalAmount
  ) {
    errors.push(
      outOfRangeError(
        "advanceAmount",
        "advanceAmount cannot exceed totalAmount.",
        input.advanceAmount
      )
    );
  }

  if (
    input.commercialReference
  ) {
    const commercial =
      input.commercialReference;

    const commercialCurrencyValidation =
      validatePaymentCurrency(
        commercial.currency,
        "commercialReference.currency",
        true
      );

    errors.push(
      ...commercialCurrencyValidation.errors
    );

    if (
      commercial.currency !==
        input.currency
    ) {
      errors.push({
        field:
          "commercialReference.currency",

        code:
          PaymentValidationErrorCode
            .CURRENCY_MISMATCH,

        message:
          "commercialReference.currency must match Payment currency.",

        value:
          commercial.currency,
      });
    }

    const commercialAmounts:
      Array<[
        string,
        number | undefined
      ]> = [
        [
          "commercialReference.customerPayableAmount",
          commercial.customerPayableAmount,
        ],
        [
          "commercialReference.vendorQuotedAmount",
          commercial.vendorQuotedAmount,
        ],
        [
          "commercialReference.platformMarkupAmount",
          commercial.platformMarkupAmount,
        ],
        [
          "commercialReference.platformCommissionAmount",
          commercial.platformCommissionAmount,
        ],
      ];

    for (
      const [
        field,
        amount,
      ]
      of commercialAmounts
    ) {
      if (
        amount !==
          undefined
      ) {
        errors.push(
          ...validatePaymentAmount(
            field,
            amount,
            {
              required:
                false,

              allowZero:
                true,
            }
          ).errors
        );
      }
    }

    if (
      commercial.customerPayableAmount !==
        undefined &&
      isFinitePaymentNumber(
        commercial.customerPayableAmount
      ) &&
      isFinitePaymentNumber(
        input.totalAmount
      ) &&
      commercial.customerPayableAmount !==
        input.totalAmount
    ) {
      errors.push({
        field:
          "commercialReference.customerPayableAmount",

        code:
          PaymentValidationErrorCode
            .AMOUNT_MISMATCH,

        message:
          "commercialReference.customerPayableAmount must match totalAmount.",

        value:
          commercial.customerPayableAmount,
      });
    }

    if (
      commercial.quotationId !==
        undefined &&
      input.quotationId !==
        undefined &&
      commercial.quotationId !==
        input.quotationId
    ) {
      errors.push(
        invalidValueError(
          "commercialReference.quotationId",
          "commercialReference.quotationId must match quotationId.",
          commercial.quotationId
        )
      );
    }
  }

  if (
    input.remarks !==
      undefined &&
    !isNonEmptyPaymentString(
      input.remarks
    )
  ) {
    errors.push(
      invalidValueError(
        "remarks",
        "remarks must contain a valid non-empty string.",
        input.remarks
      )
    );
  }

  if (
    input.internalRemarks !==
      undefined &&
    !isNonEmptyPaymentString(
      input.internalRemarks
    )
  ) {
    errors.push(
      invalidValueError(
        "internalRemarks",
        "internalRemarks must contain a valid non-empty string.",
        input.internalRemarks
      )
    );
  }

  if (
    input.createdBy !==
      undefined &&
    !isNonEmptyPaymentString(
      input.createdBy
    )
  ) {
    errors.push(
      invalidValueError(
        "createdBy",
        "createdBy must contain a valid non-empty string.",
        input.createdBy
      )
    );
  }

  return errors.length >
    0
    ? failure(
        errors
      )
    : success();
}

/* ============================================================================
 * Update Payment validation
 * ============================================================================
 */

/**
 * Validates controlled non-financial Payment updates.
 *
 * Financial totals and transaction state are intentionally not mutable here.
 */
export function validateUpdatePaymentInput(
  input:
    UpdatePaymentInput
): PaymentValidationResult {
  const errors:
    PaymentValidationError[] =
      [];

  if (
    !isNonEmptyPaymentString(
      input.updatedBy
    )
  ) {
    errors.push(
      requiredError(
        "updatedBy",
        "updatedBy is required."
      )
    );
  }

  if (
    input.remarks !==
      undefined &&
    !isNonEmptyPaymentString(
      input.remarks
    )
  ) {
    errors.push(
      invalidValueError(
        "remarks",
        "remarks must contain a valid non-empty string.",
        input.remarks
      )
    );
  }

  if (
    input.internalRemarks !==
      undefined &&
    !isNonEmptyPaymentString(
      input.internalRemarks
    )
  ) {
    errors.push(
      invalidValueError(
        "internalRemarks",
        "internalRemarks must contain a valid non-empty string.",
        input.internalRemarks
      )
    );
  }

  if (
    input.metadata !==
      undefined &&
    (
      typeof input.metadata !==
        "object" ||
      input.metadata ===
        null ||
      Array.isArray(
        input.metadata
      )
    )
  ) {
    errors.push(
      invalidValueError(
        "metadata",
        "metadata must contain a valid object.",
        input.metadata
      )
    );
  }

  const hasUpdate =
    input.remarks !==
      undefined ||
    input.internalRemarks !==
      undefined ||
    input.metadata !==
      undefined;

  if (
    !hasUpdate
  ) {
    errors.push({
      field:
        "payload",

      code:
        PaymentValidationErrorCode
          .BUSINESS_RULE,

      message:
        "At least one Payment field must be supplied for update.",
    });
  }

  return errors.length >
    0
    ? failure(
        errors
      )
    : success();
}

/* ============================================================================
 * Record Payment transaction validation
 * ============================================================================
 */

/**
 * Validates one normalized transaction command.
 *
 * Transaction-history and Payment-state business rules that require the
 * existing Payment aggregate will be added in Part C.
 */
export function validateRecordPaymentTransactionInput(
  input:
    RecordPaymentTransactionInput
): PaymentValidationResult {
  const results:
    PaymentValidationResult[] = [
      validatePaymentIdentifier(
        "paymentId",
        input.paymentId,
        true
      ),

      validatePaymentTransactionType(
        input.transactionType,
        "transactionType",
        true
      ),

      validatePaymentAmount(
        "amount",
        input.amount,
        {
          required:
            true,

          allowZero:
            false,
        }
      ),

      validatePaymentCurrency(
        input.currency,
        "currency",
        true
      ),

      validatePaymentTransactionStatus(
        input.status,
        "status",
        true
      ),

      validatePaymentProvider(
        input.provider,
        "provider",
        true
      ),

      validatePaymentPurpose(
        input.purpose,
        "purpose",
        false
      ),

      validatePaymentMethod(
        input.method,
        "method",
        false
      ),

      validatePaymentGatewayReference(
        input.gateway,
        "gateway",
        false
      ),

      validatePaymentFailure(
        input.failure,
        "failure",
        false
      ),

      validatePaymentActor(
        input.recordedBy,
        "recordedBy",
        false
      ),
    ];

  const errors =
    combinePaymentValidationResults(
      results
    ).errors;

  const dateFields:
    Array<[
      string,
      string | undefined
    ]> = [
      [
        "initiatedAt",
        input.initiatedAt,
      ],
      [
        "authorizedAt",
        input.authorizedAt,
      ],
      [
        "capturedAt",
        input.capturedAt,
      ],
      [
        "completedAt",
        input.completedAt,
      ],
      [
        "failedAt",
        input.failedAt,
      ],
    ];

  for (
    const [
      field,
      value,
    ]
    of dateFields
  ) {
    if (
      value !==
        undefined &&
      !isValidPaymentDate(
        value
      )
    ) {
      errors.push(
        invalidDateError(
          field,
          value
        )
      );
    }
  }

  if (
    input.status ===
      PaymentTransactionStatus
        .FAILED &&
    !input.failure
  ) {
    errors.push({
      field:
        "failure",

      code:
        PaymentValidationErrorCode
          .REQUIRED_FIELD_MISSING,

      message:
        "failure details are required for a failed Payment transaction.",
    });
  }

  if (
    input.failure &&
    input.status !==
      PaymentTransactionStatus
        .FAILED
  ) {
    errors.push({
      field:
        "failure",

      code:
        PaymentValidationErrorCode
          .BUSINESS_RULE,

      message:
        "failure details can only be supplied for a failed Payment transaction.",
    });
  }

  if (
    input.transactionType ===
      PaymentTransactionType
        .REFUND &&
    input.purpose !==
      undefined
  ) {
    errors.push({
      field:
        "purpose",

      code:
        PaymentValidationErrorCode
          .BUSINESS_RULE,

      message:
        "Payment purpose is not applicable to refund transactions.",
    });
  }

  if (
    input.provider ===
      PaymentProvider
        .RAZORPAY &&
    !input.gateway
  ) {
    errors.push({
      field:
        "gateway",

      code:
        PaymentValidationErrorCode
          .REQUIRED_FIELD_MISSING,

      message:
        "gateway reference is required for Razorpay transactions.",
    });
  }

  if (
    input.gateway &&
    input.gateway.provider !==
      input.provider
  ) {
    errors.push({
      field:
        "gateway.provider",

      code:
        PaymentValidationErrorCode
          .INVALID_VALUE,

      message:
        "gateway.provider must match transaction provider.",

      value:
        input.gateway.provider,
    });
  }

  if (
    input.remarks !==
      undefined &&
    !isNonEmptyPaymentString(
      input.remarks
    )
  ) {
    errors.push(
      invalidValueError(
        "remarks",
        "remarks must contain a valid non-empty string.",
        input.remarks
      )
    );
  }

  return errors.length >
    0
    ? failure(
        errors
      )
    : success();
}

/* ============================================================================
 * Gateway order creation validation
 * ============================================================================
 */

/**
 * Validates a request to create a provider-side Payment order.
 */
export function validateCreateGatewayPaymentOrderInput(
  input:
    CreateGatewayPaymentOrderInput
): PaymentValidationResult {
  const results:
    PaymentValidationResult[] = [
      validatePaymentIdentifier(
        "paymentId",
        input.paymentId,
        true
      ),

      validatePaymentAmount(
        "amount",
        input.amount,
        {
          required:
            true,

          allowZero:
            false,
        }
      ),

      validatePaymentCurrency(
        input.currency,
        "currency",
        true
      ),

      validatePaymentProvider(
        input.provider,
        "provider",
        true
      ),

      validatePaymentPurpose(
        input.purpose,
        "purpose",
        false
      ),
    ];

  if (
    input.customerId !==
      undefined
  ) {
    results.push(
      validatePaymentIdentifier(
        "customerId",
        input.customerId,
        false
      )
    );
  }

  if (
    input.receiptReference !==
      undefined
  ) {
    results.push(
      validatePaymentIdentifier(
        "receiptReference",
        input.receiptReference,
        false
      )
    );
  }

  const errors =
    combinePaymentValidationResults(
      results
    ).errors;

  if (
    input.provider ===
      PaymentProvider
        .MANUAL
  ) {
    errors.push({
      field:
        "provider",

      code:
        PaymentValidationErrorCode
          .BUSINESS_RULE,

      message:
        "MANUAL provider cannot create a gateway Payment order.",

      value:
        input.provider,
    });
  }

  if (
    input.provider ===
      PaymentProvider
        .BANK
  ) {
    errors.push({
      field:
        "provider",

      code:
        PaymentValidationErrorCode
          .BUSINESS_RULE,

      message:
        "BANK provider cannot create a gateway Payment order.",

      value:
        input.provider,
    });
  }

  if (
    input.notes !==
      undefined
  ) {
    if (
      typeof input.notes !==
        "object" ||
      input.notes ===
        null ||
      Array.isArray(
        input.notes
      )
    ) {
      errors.push(
        invalidValueError(
          "notes",
          "notes must contain a valid key-value object.",
          input.notes
        )
      );
    } else {
      for (
        const [
          key,
          value,
        ]
        of Object.entries(
          input.notes
        )
      ) {
        if (
          !isNonEmptyPaymentString(
            key
          ) ||
          !isNonEmptyPaymentString(
            value
          )
        ) {
          errors.push(
            invalidValueError(
              "notes",
              "Payment-order notes must contain non-empty string keys and values.",
              input.notes
            )
          );

          break;
        }
      }
    }
  }

  return errors.length >
    0
    ? failure(
        errors
      )
    : success();
}

/* ============================================================================
 * Verify Payment validation
 * ============================================================================
 */

/**
 * Validates provider Payment verification input.
 */
export function validateVerifyPaymentInput(
  input:
    VerifyPaymentInput
): PaymentValidationResult {
  const errors:
    PaymentValidationError[] =
      [];

  errors.push(
    ...validatePaymentIdentifier(
      "paymentId",
      input.paymentId,
      true
    ).errors
  );

  errors.push(
    ...validatePaymentProvider(
      input.provider,
      "provider",
      true
    ).errors
  );

  errors.push(
    ...validatePaymentIdentifier(
      "gatewayOrderId",
      input.gatewayOrderId,
      true
    ).errors
  );

  errors.push(
    ...validatePaymentIdentifier(
      "gatewayPaymentId",
      input.gatewayPaymentId,
      true
    ).errors
  );

  if (
    input.provider ===
      PaymentProvider
        .RAZORPAY &&
    !isNonEmptyPaymentString(
      input.gatewaySignature
    )
  ) {
    errors.push(
      requiredError(
        "gatewaySignature",
        "gatewaySignature is required for Razorpay Payment verification."
      )
    );
  }

  if (
    input.gatewaySignature !==
      undefined &&
    !isNonEmptyPaymentString(
      input.gatewaySignature
    )
  ) {
    errors.push(
      invalidValueError(
        "gatewaySignature",
        "gatewaySignature must contain a valid non-empty string.",
        input.gatewaySignature
      )
    );
  }

  if (
    input.verifiedBy !==
      undefined &&
    !isNonEmptyPaymentString(
      input.verifiedBy
    )
  ) {
    errors.push(
      invalidValueError(
        "verifiedBy",
        "verifiedBy must contain a valid non-empty string.",
        input.verifiedBy
      )
    );
  }

  if (
    input.provider ===
      PaymentProvider
        .MANUAL ||
    input.provider ===
      PaymentProvider
        .BANK
  ) {
    errors.push({
      field:
        "provider",

      code:
        PaymentValidationErrorCode
          .BUSINESS_RULE,

      message:
        `${input.provider} provider does not support gateway Payment verification.`,

      value:
        input.provider,
    });
  }

  return errors.length >
    0
    ? failure(
        errors
      )
    : success();
}

/* ============================================================================
 * End of Payment Validator - Part B
 * ============================================================================
 */
/* ============================================================================
 * Aggregate-aware Payment business validation
 * ============================================================================
 */

import type {
  Payment,
  RefundPaymentInput,
  PaymentWebhookEvent,
  PaymentReconciliationObserved,
} from "../models/payment.model";

/* ============================================================================
 * Payment aggregate validation
 * ============================================================================
 */

/**
 * Validates the current Payment aggregate structure.
 *
 * This is useful before performing state-changing operations when Payment data
 * has been reconstructed from persistence.
 */
export function validatePaymentAggregate(
  payment:
    Payment
): PaymentValidationResult {
  const errors:
    PaymentValidationError[] =
      [];

  errors.push(
    ...validatePaymentIdentifier(
      "paymentId",
      payment.paymentId,
      true
    ).errors
  );

  errors.push(
    ...validatePaymentIdentifier(
      "paymentNumber",
      payment.paymentNumber,
      true
    ).errors
  );

  errors.push(
    ...validatePaymentIdentifier(
      "referenceId",
      payment.referenceId,
      true
    ).errors
  );

  errors.push(
    ...validatePaymentIdentifier(
      "bookingId",
      payment.bookingId,
      true
    ).errors
  );

  errors.push(
    ...validatePaymentStatus(
      payment.status,
      "status",
      true
    ).errors
  );

  errors.push(
    ...validatePaymentCurrency(
      payment.payable.currency,
      "payable.currency",
      true
    ).errors
  );

  const payableAmountFields:
    Array<[
      string,
      number | undefined
    ]> = [
      [
        "payable.totalAmount",
        payment.payable.totalAmount,
      ],
      [
        "payable.advanceAmount",
        payment.payable.advanceAmount,
      ],
      [
        "payable.paidAmount",
        payment.payable.paidAmount,
      ],
      [
        "payable.balanceAmount",
        payment.payable.balanceAmount,
      ],
      [
        "payable.paymentPending",
        payment.payable.paymentPending,
      ],
    ];

  for (
    const [
      field,
      value,
    ]
    of payableAmountFields
  ) {
    if (
      value !==
        undefined
    ) {
      errors.push(
        ...validatePaymentAmount(
          field,
          value,
          {
            required:
              true,

            allowZero:
              true,
          }
        ).errors
      );
    }
  }

  if (
    payment.payable.paidAmount >
      payment.payable.totalAmount
  ) {
    errors.push({
      field:
        "payable.paidAmount",

      code:
        PaymentValidationErrorCode
          .AMOUNT_MISMATCH,

      message:
        "paidAmount cannot exceed totalAmount.",

      value:
        payment.payable.paidAmount,
    });
  }

  const expectedBalance =
    Math.max(
      0,
      payment.payable
        .totalAmount -
        payment.payable
          .paidAmount
    );

  if (
    payment.payable
      .balanceAmount !==
      expectedBalance
  ) {
    errors.push({
      field:
        "payable.balanceAmount",

      code:
        PaymentValidationErrorCode
          .AMOUNT_MISMATCH,

      message:
        "balanceAmount must equal totalAmount minus paidAmount.",

      value:
        payment.payable
          .balanceAmount,
    });
  }

  if (
    payment.payable
      .paymentPending !==
      payment.payable
        .balanceAmount
  ) {
    errors.push({
      field:
        "payable.paymentPending",

      code:
        PaymentValidationErrorCode
          .AMOUNT_MISMATCH,

      message:
        "paymentPending must match balanceAmount.",

      value:
        payment.payable
          .paymentPending,
    });
  }

  if (
    payment.status ===
      PaymentStatus.PAID &&
    payment.payable
      .balanceAmount !==
      0
  ) {
    errors.push({
      field:
        "status",

      code:
        PaymentValidationErrorCode
          .BUSINESS_RULE,

      message:
        "A PAID Payment must have zero outstanding balance.",

      value:
        payment.status,
    });
  }

  if (
    payment.status ===
      PaymentStatus.PARTIALLY_PAID &&
    (
      payment.payable
        .paidAmount <=
        0 ||
      payment.payable
        .balanceAmount <=
        0
    )
  ) {
    errors.push({
      field:
        "status",

      code:
        PaymentValidationErrorCode
          .BUSINESS_RULE,

      message:
        "A PARTIALLY_PAID Payment must have both collected and outstanding amounts.",

      value:
        payment.status,
    });
  }

  if (
    payment.status ===
      PaymentStatus.PENDING &&
    payment.payable
      .paidAmount >
      0
  ) {
    errors.push({
      field:
        "status",

      code:
        PaymentValidationErrorCode
          .BUSINESS_RULE,

      message:
        "A PENDING Payment cannot contain a positive paidAmount.",

      value:
        payment.status,
    });
  }

  return errors.length >
    0
    ? failure(
        errors
      )
    : success();
}

/* ============================================================================
 * Transaction against existing Payment validation
 * ============================================================================
 */

/**
 * Validates a transaction command against the current Payment.
 */
export function validateTransactionAgainstPayment(
  input:
    RecordPaymentTransactionInput,
  payment:
    Payment
): PaymentValidationResult {
  const errors:
    PaymentValidationError[] =
      [];

  errors.push(
    ...validateRecordPaymentTransactionInput(
      input
    ).errors
  );

  if (
    input.paymentId !==
      payment.paymentId
  ) {
    errors.push(
      invalidValueError(
        "paymentId",
        "Transaction paymentId must match the target Payment.",
        input.paymentId
      )
    );
  }

  if (
    input.currency !==
      payment.payable
        .currency
  ) {
    errors.push({
      field:
        "currency",

      code:
        PaymentValidationErrorCode
          .CURRENCY_MISMATCH,

      message:
        "Transaction currency must match Payment currency.",

      value:
        input.currency,
    });
  }

  if (
    payment.status ===
      PaymentStatus.CANCELLED
  ) {
    errors.push({
      field:
        "status",

      code:
        PaymentValidationErrorCode
          .PAYMENT_CANCELLED,

      message:
        "Transactions cannot be recorded against a cancelled Payment.",

      value:
        payment.status,
    });
  }

  if (
    input.transactionType ===
      PaymentTransactionType
        .COLLECTION &&
    payment.status ===
      PaymentStatus.PAID
  ) {
    errors.push({
      field:
        "status",

      code:
        PaymentValidationErrorCode
          .PAYMENT_ALREADY_PAID,

      message:
        "Additional collection cannot be recorded because the Payment is already fully paid.",

      value:
        payment.status,
    });
  }

  if (
    input.transactionType ===
      PaymentTransactionType
        .COLLECTION &&
    (
      input.status ===
        PaymentTransactionStatus.SUCCESS ||
      input.status ===
        PaymentTransactionStatus.CAPTURED
    )
  ) {
    const remainingAmount =
      payment.payable
        .balanceAmount;

    if (
      input.amount >
        remainingAmount
    ) {
      errors.push({
        field:
          "amount",

        code:
          PaymentValidationErrorCode
            .AMOUNT_MISMATCH,

        message:
          "Successful collection amount cannot exceed the outstanding Payment balance.",

        value:
          input.amount,
      });
    }
  }

  if (
    input.transactionType ===
      PaymentTransactionType
        .REFUND
  ) {
    const refundableAmount =
      Math.max(
        0,
        payment.payable
          .paidAmount -
          (
            payment.refundSummary
              ?.totalRefundedAmount ??
            0
          )
      );

    if (
      input.amount >
        refundableAmount
    ) {
      errors.push({
        field:
          "amount",

        code:
          PaymentValidationErrorCode
            .REFUND_EXCEEDS_AVAILABLE_AMOUNT,

        message:
          "Refund amount cannot exceed the currently refundable amount.",

        value:
          input.amount,
      });
    }
  }

  if (
    input.gateway
      ?.gatewayPaymentId
  ) {
    const duplicate =
      payment.transactions.some(
        (
          transaction
        ) =>
          transaction.gateway
            ?.gatewayPaymentId ===
          input.gateway
            ?.gatewayPaymentId
      );

    if (
      duplicate
    ) {
      errors.push({
        field:
          "gateway.gatewayPaymentId",

        code:
          PaymentValidationErrorCode
            .DUPLICATE_TRANSACTION,

        message:
          "A transaction with this gatewayPaymentId already exists.",

        value:
          input.gateway
            .gatewayPaymentId,
      });
    }
  }

  return errors.length >
    0
    ? failure(
        errors
      )
    : success();
}

/* ============================================================================
 * Refund validation
 * ============================================================================
 */

export function validateRefundPaymentInput(
  input:
    RefundPaymentInput,
  payment:
    Payment
): PaymentValidationResult {
  const errors:
    PaymentValidationError[] =
      [];

  errors.push(
    ...validatePaymentIdentifier(
      "paymentId",
      input.paymentId,
      true
    ).errors
  );

  errors.push(
    ...validatePaymentAmount(
      "amount",
      input.amount,
      {
        required:
          true,

        allowZero:
          false,
      }
    ).errors
  );

  errors.push(
    ...validatePaymentCurrency(
      input.currency,
      "currency",
      true
    ).errors
  );

  errors.push(
    ...validatePaymentProvider(
      input.provider,
      "provider",
      true
    ).errors
  );

  if (
    !isNonEmptyPaymentString(
      input.reason
    )
  ) {
    errors.push(
      requiredError(
        "reason",
        "reason is required."
      )
    );
  }

  if (
    !isNonEmptyPaymentString(
      input.requestedBy
    )
  ) {
    errors.push(
      requiredError(
        "requestedBy",
        "requestedBy is required."
      )
    );
  }

  if (
    input.paymentId !==
      payment.paymentId
  ) {
    errors.push(
      invalidValueError(
        "paymentId",
        "Refund paymentId must match the target Payment.",
        input.paymentId
      )
    );
  }

  if (
    input.currency !==
      payment.payable
        .currency
  ) {
    errors.push({
      field:
        "currency",

      code:
        PaymentValidationErrorCode
          .CURRENCY_MISMATCH,

      message:
        "Refund currency must match Payment currency.",

      value:
        input.currency,
    });
  }

  if (
    payment.payable
      .paidAmount <=
      0
  ) {
    errors.push({
      field:
        "payment",

      code:
        PaymentValidationErrorCode
          .TRANSACTION_NOT_ELIGIBLE,

      message:
        "Refund cannot be requested because no successful Payment has been collected.",
    });
  }

  const alreadyRefunded =
    payment.refundSummary
      ?.totalRefundedAmount ??
    0;

  const refundableAmount =
    Math.max(
      0,
      payment.payable
        .paidAmount -
        alreadyRefunded
    );

  if (
    input.amount >
      refundableAmount
  ) {
    errors.push({
      field:
        "amount",

      code:
        PaymentValidationErrorCode
          .REFUND_EXCEEDS_AVAILABLE_AMOUNT,

      message:
        "Refund amount exceeds the currently refundable amount.",

      value:
        input.amount,
    });
  }

  if (
    payment.status ===
      PaymentStatus.CANCELLED &&
    payment.payable
      .paidAmount <=
      alreadyRefunded
  ) {
    errors.push({
      field:
        "status",

      code:
        PaymentValidationErrorCode
          .TRANSACTION_NOT_ELIGIBLE,

      message:
        "Cancelled Payment has no remaining refundable amount.",

      value:
        payment.status,
    });
  }

  if (
    input.transactionId !==
      undefined
  ) {
    const transaction =
      payment.transactions.find(
        (
          item
        ) =>
          item.transactionId ===
          input.transactionId
      );

    if (
      !transaction
    ) {
      errors.push(
        invalidValueError(
          "transactionId",
          "Refund transactionId does not belong to this Payment.",
          input.transactionId
        )
      );
    } else if (
      transaction
        .transactionType !==
        PaymentTransactionType
          .COLLECTION
    ) {
      errors.push({
        field:
          "transactionId",

        code:
          PaymentValidationErrorCode
            .TRANSACTION_NOT_ELIGIBLE,

        message:
          "Only collection transactions can be refunded.",

        value:
          input.transactionId,
      });
    } else if (
      transaction.status !==
        PaymentTransactionStatus
          .SUCCESS &&
      transaction.status !==
        PaymentTransactionStatus
          .CAPTURED
    ) {
      errors.push({
        field:
          "transactionId",

        code:
          PaymentValidationErrorCode
            .TRANSACTION_NOT_ELIGIBLE,

        message:
          "Only successful or captured collection transactions can be refunded.",

        value:
          input.transactionId,
      });
    }
  }

  return errors.length >
    0
    ? failure(
        errors
      )
    : success();
}

/* ============================================================================
 * Payment status transition validation
 * ============================================================================
 */

export function validatePaymentStatusTransition(
  currentStatus:
    PaymentStatus,
  nextStatus:
    PaymentStatus
): PaymentValidationResult {
  if (
    currentStatus ===
      nextStatus
  ) {
    return success();
  }

  const allowedTransitions:
    Record<
      PaymentStatus,
      PaymentStatus[]
    > = {
      [PaymentStatus.PENDING]: [
        PaymentStatus
          .PARTIALLY_PAID,
        PaymentStatus
          .PAID,
        PaymentStatus
          .FAILED,
        PaymentStatus
          .CANCELLED,
      ],

      [PaymentStatus.PARTIALLY_PAID]: [
        PaymentStatus
          .PAID,
        PaymentStatus
          .FAILED,
        PaymentStatus
          .CANCELLED,
        PaymentStatus
          .REFUND_PENDING,
        PaymentStatus
          .PARTIALLY_REFUNDED,
      ],

      [PaymentStatus.PAID]: [
        PaymentStatus
          .REFUND_PENDING,
        PaymentStatus
          .PARTIALLY_REFUNDED,
        PaymentStatus
          .REFUNDED,
      ],

      [PaymentStatus.FAILED]: [
        PaymentStatus
          .PENDING,
        PaymentStatus
          .PARTIALLY_PAID,
        PaymentStatus
          .PAID,
        PaymentStatus
          .CANCELLED,
      ],

      [PaymentStatus.CANCELLED]: [],

      [PaymentStatus.REFUND_PENDING]: [
        PaymentStatus
          .PARTIALLY_REFUNDED,
        PaymentStatus
          .REFUNDED,
        PaymentStatus
          .PAID,
      ],

      [PaymentStatus.PARTIALLY_REFUNDED]: [
        PaymentStatus
          .REFUND_PENDING,
        PaymentStatus
          .REFUNDED,
      ],

      [PaymentStatus.REFUNDED]: [],
    };

  const allowed =
    allowedTransitions[
      currentStatus
    ].includes(
      nextStatus
    );

  if (
    !allowed
  ) {
    return failure([
      {
        field:
          "status",

        code:
          PaymentValidationErrorCode
            .INVALID_STATUS_TRANSITION,

        message:
          `Payment status cannot change from ${currentStatus} to ${nextStatus}.`,

        value:
          nextStatus,
      },
    ]);
  }

  return success();
}

/* ============================================================================
 * Webhook validation
 * ============================================================================
 */

export function validatePaymentWebhookEvent(
  event:
    PaymentWebhookEvent
): PaymentValidationResult {
  const errors:
    PaymentValidationError[] =
      [];

  errors.push(
    ...validatePaymentProvider(
      event.provider,
      "provider",
      true
    ).errors
  );

  errors.push(
    ...validatePaymentWebhookEventType(
      event.eventType,
      "eventType",
      true
    ).errors
  );

  if (
    event.amount !==
      undefined
  ) {
    errors.push(
      ...validatePaymentAmount(
        "amount",
        event.amount,
        {
          required:
            false,

          allowZero:
            true,
        }
      ).errors
    );
  }

  if (
    event.currency !==
      undefined
  ) {
    errors.push(
      ...validatePaymentCurrency(
        event.currency,
        "currency",
        false
      ).errors
    );
  }

  if (
    !isValidPaymentDate(
      event.occurredAt
    )
  ) {
    errors.push(
      invalidDateError(
        "occurredAt",
        event.occurredAt
      )
    );
  }

  if (
    !isValidPaymentDate(
      event.receivedAt
    )
  ) {
    errors.push(
      invalidDateError(
        "receivedAt",
        event.receivedAt
      )
    );
  }

  if (
    event.gatewayOrderId !==
      undefined &&
    !isNonEmptyPaymentString(
      event.gatewayOrderId
    )
  ) {
    errors.push(
      invalidValueError(
        "gatewayOrderId",
        "gatewayOrderId must contain a valid non-empty string.",
        event.gatewayOrderId
      )
    );
  }

  if (
    event.gatewayPaymentId !==
      undefined &&
    !isNonEmptyPaymentString(
      event.gatewayPaymentId
    )
  ) {
    errors.push(
      invalidValueError(
        "gatewayPaymentId",
        "gatewayPaymentId must contain a valid non-empty string.",
        event.gatewayPaymentId
      )
    );
  }

  return errors.length >
    0
    ? failure(
        errors
      )
    : success();
}

/* ============================================================================
 * Reconciliation validation
 * ============================================================================
 */

export function validatePaymentReconciliationObserved(
  observed:
    PaymentReconciliationObserved
): PaymentValidationResult {
  const errors:
    PaymentValidationError[] =
      [];

  errors.push(
    ...validatePaymentProvider(
      observed.provider,
      "provider",
      true
    ).errors
  );

  errors.push(
    ...validatePaymentAmount(
      "collectedAmount",
      observed.collectedAmount,
      {
        required:
          true,

        allowZero:
          true,
      }
    ).errors
  );

  errors.push(
    ...validatePaymentAmount(
      "refundedAmount",
      observed.refundedAmount,
      {
        required:
          true,

        allowZero:
          true,
      }
    ).errors
  );

  errors.push(
    ...validatePaymentCurrency(
      observed.currency,
      "currency",
      true
    ).errors
  );

  if (
    !isValidPaymentDate(
      observed.observedAt
    )
  ) {
    errors.push(
      invalidDateError(
        "observedAt",
        observed.observedAt
      )
    );
  }

  if (
    observed.providerReference !==
      undefined &&
    !isNonEmptyPaymentString(
      observed.providerReference
    )
  ) {
    errors.push(
      invalidValueError(
        "providerReference",
        "providerReference must contain a valid non-empty string.",
        observed.providerReference
      )
    );
  }

  if (
    observed.refundedAmount >
      observed.collectedAmount
  ) {
    errors.push({
      field:
        "refundedAmount",

      code:
        PaymentValidationErrorCode
          .AMOUNT_MISMATCH,

      message:
        "refundedAmount cannot exceed collectedAmount.",

      value:
        observed.refundedAmount,
    });
  }

  return errors.length >
    0
    ? failure(
        errors
      )
    : success();
}

/* ============================================================================
 * Payment-order validation against aggregate
 * ============================================================================
 */

export function validateGatewayOrderAgainstPayment(
  input:
    CreateGatewayPaymentOrderInput,
  payment:
    Payment
): PaymentValidationResult {
  const errors =
    validateCreateGatewayPaymentOrderInput(
      input
    ).errors;

  if (
    input.paymentId !==
      payment.paymentId
  ) {
    errors.push(
      invalidValueError(
        "paymentId",
        "Gateway-order paymentId must match the target Payment.",
        input.paymentId
      )
    );
  }

  if (
    input.currency !==
      payment.payable
        .currency
  ) {
    errors.push({
      field:
        "currency",

      code:
        PaymentValidationErrorCode
          .CURRENCY_MISMATCH,

      message:
        "Gateway-order currency must match Payment currency.",

      value:
        input.currency,
    });
  }

  if (
    payment.status ===
      PaymentStatus.PAID
  ) {
    errors.push({
      field:
        "status",

      code:
        PaymentValidationErrorCode
          .PAYMENT_ALREADY_PAID,

      message:
        "A gateway order cannot be created for a fully paid Payment.",

      value:
        payment.status,
    });
  }

  if (
    payment.status ===
      PaymentStatus.CANCELLED
  ) {
    errors.push({
      field:
        "status",

      code:
        PaymentValidationErrorCode
          .PAYMENT_CANCELLED,

      message:
        "A gateway order cannot be created for a cancelled Payment.",

      value:
        payment.status,
    });
  }

  if (
    input.amount >
      payment.payable
        .balanceAmount
  ) {
    errors.push({
      field:
        "amount",

      code:
        PaymentValidationErrorCode
          .AMOUNT_MISMATCH,

      message:
        "Gateway-order amount cannot exceed the outstanding Payment balance.",

      value:
        input.amount,
    });
  }

  return errors.length >
    0
    ? failure(
        errors
      )
    : success();
}

/* ============================================================================
 * Payment verification against aggregate
 * ============================================================================
 */

export function validateVerificationAgainstPayment(
  input:
    VerifyPaymentInput,
  payment:
    Payment
): PaymentValidationResult {
  const errors =
    validateVerifyPaymentInput(
      input
    ).errors;

  if (
    input.paymentId !==
      payment.paymentId
  ) {
    errors.push(
      invalidValueError(
        "paymentId",
        "Verification paymentId must match the target Payment.",
        input.paymentId
      )
    );
  }

  const matchingOrder =
    payment.transactions.some(
      (
        transaction
      ) =>
        transaction.gateway
          ?.gatewayOrderId ===
        input.gatewayOrderId
    );

  if (
    !matchingOrder
  ) {
    errors.push({
      field:
        "gatewayOrderId",

      code:
        PaymentValidationErrorCode
          .TRANSACTION_NOT_ELIGIBLE,

      message:
        "gatewayOrderId is not associated with this Payment.",

      value:
        input.gatewayOrderId,
    });
  }

  const duplicateVerifiedPayment =
    payment.transactions.some(
      (
        transaction
      ) =>
        transaction.gateway
          ?.gatewayPaymentId ===
          input.gatewayPaymentId &&
        (
          transaction.status ===
            PaymentTransactionStatus
              .SUCCESS ||
          transaction.status ===
            PaymentTransactionStatus
              .CAPTURED
        )
    );

  if (
    duplicateVerifiedPayment
  ) {
    errors.push({
      field:
        "gatewayPaymentId",

      code:
        PaymentValidationErrorCode
          .DUPLICATE_TRANSACTION,

      message:
        "gatewayPaymentId has already been successfully recorded for this Payment.",

      value:
        input.gatewayPaymentId,
    });
  }

  return errors.length >
    0
    ? failure(
        errors
      )
    : success();
}

/* ============================================================================
 * End of Payment Validator - Part C
 * ============================================================================
 */
/* ============================================================================
 * Payment search validation
 * ============================================================================
 */

import type {
  PaymentSearchCriteria,
  PaymentTransactionSearchCriteria,
} from "../models/payment.model";

/**
 * Validates Payment list/search criteria.
 */
export function validatePaymentSearchCriteria(
  criteria:
    PaymentSearchCriteria
): PaymentValidationResult {
  const errors:
    PaymentValidationError[] =
      [];

  const optionalIdentifiers:
    Array<[
      string,
      unknown
    ]> = [
      [
        "paymentId",
        criteria.paymentId,
      ],
      [
        "paymentNumber",
        criteria.paymentNumber,
      ],
      [
        "referenceId",
        criteria.referenceId,
      ],
      [
        "bookingId",
        criteria.bookingId,
      ],
      [
        "quotationId",
        criteria.quotationId,
      ],
      [
        "leadId",
        criteria.leadId,
      ],
      [
        "customerId",
        criteria.customerId,
      ],
      [
        "vendorId",
        criteria.vendorId,
      ],
    ];

  for (
    const [
      field,
      value,
    ]
    of optionalIdentifiers
  ) {
    if (
      value !==
        undefined
    ) {
      errors.push(
        ...validatePaymentIdentifier(
          field,
          value,
          false
        ).errors
      );
    }
  }

  if (
    criteria.status !==
      undefined
  ) {
    errors.push(
      ...validatePaymentStatus(
        criteria.status,
        "status",
        false
      ).errors
    );
  }

  if (
    criteria.statuses !==
      undefined
  ) {
    if (
      !Array.isArray(
        criteria.statuses
      ) ||
      criteria.statuses.length ===
        0
    ) {
      errors.push(
        invalidValueError(
          "statuses",
          "statuses must contain at least one Payment status.",
          criteria.statuses
        )
      );
    } else {
      for (
        const status
        of criteria.statuses
      ) {
        errors.push(
          ...validatePaymentStatus(
            status,
            "statuses",
            true
          ).errors
        );
      }
    }
  }

  if (
    criteria.currency !==
      undefined
  ) {
    errors.push(
      ...validatePaymentCurrency(
        criteria.currency,
        "currency",
        false
      ).errors
    );
  }

  if (
    criteria.provider !==
      undefined
  ) {
    errors.push(
      ...validatePaymentProvider(
        criteria.provider,
        "provider",
        false
      ).errors
    );
  }

  if (
    criteria.transactionStatus !==
      undefined
  ) {
    errors.push(
      ...validatePaymentTransactionStatus(
        criteria.transactionStatus,
        "transactionStatus",
        false
      ).errors
    );
  }

  if (
    criteria.source !==
      undefined
  ) {
    errors.push(
      ...validatePaymentSource(
        criteria.source,
        "source",
        false
      ).errors
    );
  }

  validateOptionalRangeAmount(
    errors,
    "minimumAmount",
    criteria.minimumAmount
  );

  validateOptionalRangeAmount(
    errors,
    "maximumAmount",
    criteria.maximumAmount
  );

  validateOptionalRangeAmount(
    errors,
    "minimumPaidAmount",
    criteria.minimumPaidAmount
  );

  validateOptionalRangeAmount(
    errors,
    "maximumPaidAmount",
    criteria.maximumPaidAmount
  );

  validateNumericRange(
    errors,
    "minimumAmount",
    criteria.minimumAmount,
    "maximumAmount",
    criteria.maximumAmount
  );

  validateNumericRange(
    errors,
    "minimumPaidAmount",
    criteria.minimumPaidAmount,
    "maximumPaidAmount",
    criteria.maximumPaidAmount
  );

  validateOptionalDate(
    errors,
    "createdFrom",
    criteria.createdFrom
  );

  validateOptionalDate(
    errors,
    "createdUntil",
    criteria.createdUntil
  );

  validateOptionalDate(
    errors,
    "updatedFrom",
    criteria.updatedFrom
  );

  validateOptionalDate(
    errors,
    "updatedUntil",
    criteria.updatedUntil
  );

  validateDateRange(
    errors,
    "createdFrom",
    criteria.createdFrom,
    "createdUntil",
    criteria.createdUntil
  );

  validateDateRange(
    errors,
    "updatedFrom",
    criteria.updatedFrom,
    "updatedUntil",
    criteria.updatedUntil
  );

  if (
    criteria.hasOutstandingBalance !==
      undefined &&
    typeof criteria
      .hasOutstandingBalance !==
      "boolean"
  ) {
    errors.push(
      invalidValueError(
        "hasOutstandingBalance",
        "hasOutstandingBalance must be a boolean.",
        criteria.hasOutstandingBalance
      )
    );
  }

  if (
    criteria.hasRefund !==
      undefined &&
    typeof criteria
      .hasRefund !==
      "boolean"
  ) {
    errors.push(
      invalidValueError(
        "hasRefund",
        "hasRefund must be a boolean.",
        criteria.hasRefund
      )
    );
  }

  validatePaginationValue(
    errors,
    "page",
    criteria.page,
    1,
    undefined
  );

  validatePaginationValue(
    errors,
    "pageSize",
    criteria.pageSize,
    1,
    100
  );

  if (
    criteria.sortBy !==
      undefined &&
    !Object.values(
      PaymentSortField
    ).includes(
      criteria.sortBy
    )
  ) {
    errors.push(
      invalidEnumError(
        "sortBy",
        criteria.sortBy
      )
    );
  }

  if (
    criteria.sortDirection !==
      undefined &&
    !Object.values(
      PaymentSortDirection
    ).includes(
      criteria.sortDirection
    )
  ) {
    errors.push(
      invalidEnumError(
        "sortDirection",
        criteria.sortDirection
      )
    );
  }

  return errors.length >
    0
    ? failure(
        errors
      )
    : success();
}

/* ============================================================================
 * Transaction search validation
 * ============================================================================
 */

export function validatePaymentTransactionSearchCriteria(
  criteria:
    PaymentTransactionSearchCriteria
): PaymentValidationResult {
  const errors:
    PaymentValidationError[] =
      [];

  const identifierFields:
    Array<[
      string,
      unknown
    ]> = [
      [
        "paymentId",
        criteria.paymentId,
      ],
      [
        "transactionId",
        criteria.transactionId,
      ],
      [
        "gatewayOrderId",
        criteria.gatewayOrderId,
      ],
      [
        "gatewayPaymentId",
        criteria.gatewayPaymentId,
      ],
    ];

  for (
    const [
      field,
      value,
    ]
    of identifierFields
  ) {
    if (
      value !==
        undefined
    ) {
      errors.push(
        ...validatePaymentIdentifier(
          field,
          value,
          false
        ).errors
      );
    }
  }

  if (
    criteria.transactionType !==
      undefined
  ) {
    errors.push(
      ...validatePaymentTransactionType(
        criteria.transactionType,
        "transactionType",
        false
      ).errors
    );
  }

  if (
    criteria.purpose !==
      undefined
  ) {
    errors.push(
      ...validatePaymentPurpose(
        criteria.purpose,
        "purpose",
        false
      ).errors
    );
  }

  if (
    criteria.status !==
      undefined
  ) {
    errors.push(
      ...validatePaymentTransactionStatus(
        criteria.status,
        "status",
        false
      ).errors
    );
  }

  if (
    criteria.provider !==
      undefined
  ) {
    errors.push(
      ...validatePaymentProvider(
        criteria.provider,
        "provider",
        false
      ).errors
    );
  }

  if (
    criteria.method !==
      undefined
  ) {
    errors.push(
      ...validatePaymentMethod(
        criteria.method,
        "method",
        false
      ).errors
    );
  }

  validateOptionalRangeAmount(
    errors,
    "minimumAmount",
    criteria.minimumAmount
  );

  validateOptionalRangeAmount(
    errors,
    "maximumAmount",
    criteria.maximumAmount
  );

  validateNumericRange(
    errors,
    "minimumAmount",
    criteria.minimumAmount,
    "maximumAmount",
    criteria.maximumAmount
  );

  validateOptionalDate(
    errors,
    "initiatedFrom",
    criteria.initiatedFrom
  );

  validateOptionalDate(
    errors,
    "initiatedUntil",
    criteria.initiatedUntil
  );

  validateDateRange(
    errors,
    "initiatedFrom",
    criteria.initiatedFrom,
    "initiatedUntil",
    criteria.initiatedUntil
  );

  validatePaginationValue(
    errors,
    "page",
    criteria.page,
    1,
    undefined
  );

  validatePaginationValue(
    errors,
    "pageSize",
    criteria.pageSize,
    1,
    100
  );

  return errors.length >
    0
    ? failure(
        errors
      )
    : success();
}

/* ============================================================================
 * Search helper methods
 * ============================================================================
 */

function validateOptionalRangeAmount(
  errors:
    PaymentValidationError[],
  field:
    string,
  value:
    unknown
): void {
  if (
    value ===
      undefined
  ) {
    return;
  }

  errors.push(
    ...validatePaymentAmount(
      field,
      value,
      {
        required:
          false,

        allowZero:
          true,
      }
    ).errors
  );
}

function validateNumericRange(
  errors:
    PaymentValidationError[],
  minimumField:
    string,
  minimumValue:
    number | undefined,
  maximumField:
    string,
  maximumValue:
    number | undefined
): void {
  if (
    !isFinitePaymentNumber(
      minimumValue
    ) ||
    !isFinitePaymentNumber(
      maximumValue
    )
  ) {
    return;
  }

  if (
    maximumValue <
      minimumValue
  ) {
    errors.push({
      field:
        maximumField,

      code:
        PaymentValidationErrorCode
          .OUT_OF_RANGE,

      message:
        `${maximumField} cannot be lower than ${minimumField}.`,

      value:
        maximumValue,
    });
  }
}

function validateOptionalDate(
  errors:
    PaymentValidationError[],
  field:
    string,
  value:
    unknown
): void {
  if (
    value ===
      undefined
  ) {
    return;
  }

  if (
    !isValidPaymentDate(
      value
    )
  ) {
    errors.push(
      invalidDateError(
        field,
        value
      )
    );
  }
}

function validateDateRange(
  errors:
    PaymentValidationError[],
  fromField:
    string,
  fromValue:
    string | undefined,
  untilField:
    string,
  untilValue:
    string | undefined
): void {
  if (
    !isValidPaymentDate(
      fromValue
    ) ||
    !isValidPaymentDate(
      untilValue
    )
  ) {
    return;
  }

  const from =
    new Date(
      fromValue
    ).getTime();

  const until =
    new Date(
      untilValue
    ).getTime();

  if (
    until <
      from
  ) {
    errors.push({
      field:
        untilField,

      code:
        PaymentValidationErrorCode
          .INVALID_DATE_RANGE,

      message:
        `${untilField} cannot be earlier than ${fromField}.`,

      value:
        untilValue,
    });
  }
}

function validatePaginationValue(
  errors:
    PaymentValidationError[],
  field:
    string,
  value:
    unknown,
  minimum:
    number,
  maximum:
    number | undefined
): void {
  if (
    value ===
      undefined
  ) {
    return;
  }

  if (
    typeof value !==
      "number" ||
    !Number.isInteger(
      value
    )
  ) {
    errors.push(
      invalidNumberError(
        field,
        value
      )
    );

    return;
  }

  if (
    value <
      minimum
  ) {
    errors.push(
      outOfRangeError(
        field,
        `${field} cannot be lower than ${minimum}.`,
        value
      )
    );

    return;
  }

  if (
    maximum !==
      undefined &&
    value >
      maximum
  ) {
    errors.push(
      outOfRangeError(
        field,
        `${field} cannot exceed ${maximum}.`,
        value
      )
    );
  }
}

/* ============================================================================
 * Payment financial status derivation
 * ============================================================================
 */

/**
 * Determines the expected Payment status from the current financial summary.
 *
 * Refund state is intentionally handled separately because the same
 * paid/balance values may coexist with refund operations.
 */
export function derivePaymentCollectionStatus(
  totalAmount:
    number,
  paidAmount:
    number
): PaymentStatus {
  if (
    paidAmount <=
      0
  ) {
    return PaymentStatus
      .PENDING;
  }

  if (
    paidAmount <
      totalAmount
  ) {
    return PaymentStatus
      .PARTIALLY_PAID;
  }

  return PaymentStatus
    .PAID;
}

/**
 * Validates that the current collection-oriented Payment status agrees with
 * the financial totals.
 *
 * Refund-related statuses are excluded because they require refund context.
 */
export function validatePaymentStatusAgainstAmounts(
  payment:
    Payment
): PaymentValidationResult {
  const collectionStatuses:
    PaymentStatus[] = [
      PaymentStatus.PENDING,
      PaymentStatus.PARTIALLY_PAID,
      PaymentStatus.PAID,
  ];

  if (
    !collectionStatuses.includes(
      payment.status
    )
  ) {
    return success();
  }

  const expectedStatus =
    derivePaymentCollectionStatus(
      payment.payable
        .totalAmount,
      payment.payable
        .paidAmount
    );

  if (
    expectedStatus !==
      payment.status
  ) {
    return failure([
      {
        field:
          "status",

        code:
          PaymentValidationErrorCode
            .BUSINESS_RULE,

        message:
          `Payment status ${payment.status} does not match the current financial amounts. Expected ${expectedStatus}.`,

        value:
          payment.status,
      },
    ]);
  }

  return success();
}

/* ============================================================================
 * Refund-state validation
 * ============================================================================
 */

export function validatePaymentRefundState(
  payment:
    Payment
): PaymentValidationResult {
  const errors:
    PaymentValidationError[] =
      [];

  const refundedAmount =
    payment.refundSummary
      ?.totalRefundedAmount ??
    0;

  const refundPendingAmount =
    payment.refundSummary
      ?.refundPendingAmount ??
    0;

  if (
    refundedAmount <
      0
  ) {
    errors.push(
      outOfRangeError(
        "refundSummary.totalRefundedAmount",
        "totalRefundedAmount cannot be negative.",
        refundedAmount
      )
    );
  }

  if (
    refundPendingAmount <
      0
  ) {
    errors.push(
      outOfRangeError(
        "refundSummary.refundPendingAmount",
        "refundPendingAmount cannot be negative.",
        refundPendingAmount
      )
    );
  }

  if (
    refundedAmount >
      payment.payable
        .paidAmount
  ) {
    errors.push({
      field:
        "refundSummary.totalRefundedAmount",

      code:
        PaymentValidationErrorCode
          .REFUND_EXCEEDS_AVAILABLE_AMOUNT,

      message:
        "totalRefundedAmount cannot exceed paidAmount.",

      value:
        refundedAmount,
    });
  }

  const remainingRefundable =
    Math.max(
      0,
      payment.payable
        .paidAmount -
        refundedAmount
    );

  if (
    refundPendingAmount >
      remainingRefundable
  ) {
    errors.push({
      field:
        "refundSummary.refundPendingAmount",

      code:
        PaymentValidationErrorCode
          .REFUND_EXCEEDS_AVAILABLE_AMOUNT,

      message:
        "refundPendingAmount cannot exceed the remaining refundable amount.",

      value:
        refundPendingAmount,
    });
  }

  if (
    payment.status ===
      PaymentStatus.REFUNDED &&
    refundedAmount !==
      payment.payable
        .paidAmount
  ) {
    errors.push({
      field:
        "status",

      code:
        PaymentValidationErrorCode
          .BUSINESS_RULE,

      message:
        "REFUNDED Payment must have totalRefundedAmount equal to paidAmount.",

      value:
        payment.status,
    });
  }

  if (
    payment.status ===
      PaymentStatus.PARTIALLY_REFUNDED &&
    (
      refundedAmount <=
        0 ||
      refundedAmount >=
        payment.payable
          .paidAmount
    )
  ) {
    errors.push({
      field:
        "status",

      code:
        PaymentValidationErrorCode
          .BUSINESS_RULE,

      message:
        "PARTIALLY_REFUNDED Payment must have a positive refunded amount lower than paidAmount.",

      value:
        payment.status,
    });
  }

  if (
    payment.status ===
      PaymentStatus.REFUND_PENDING &&
    refundPendingAmount <=
      0
  ) {
    errors.push({
      field:
        "status",

      code:
        PaymentValidationErrorCode
          .BUSINESS_RULE,

      message:
        "REFUND_PENDING Payment must contain a positive refundPendingAmount.",

      value:
        payment.status,
    });
  }

  return errors.length >
    0
    ? failure(
        errors
      )
    : success();
}

/* ============================================================================
 * Full aggregate business validation
 * ============================================================================
 */

/**
 * Runs all currently defined aggregate-level Payment checks.
 */
export function validatePaymentBusinessState(
  payment:
    Payment
): PaymentValidationResult {
  return combinePaymentValidationResults([
    validatePaymentAggregate(
      payment
    ),

    validatePaymentStatusAgainstAmounts(
      payment
    ),

    validatePaymentRefundState(
      payment
    ),
  ]);
}

/* ============================================================================
 * End of Payment Validator - Part D
 * ============================================================================
 */