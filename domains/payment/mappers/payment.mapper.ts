/**
 * ============================================================================
 * EasyMovers
 * Payment Domain Mapper
 * ============================================================================
 *
 * File:
 * domains/payment/mappers/payment.mapper.ts
 *
 * Responsibilities:
 * - Provide Payment-domain normalization and conversion helpers
 * - Convert Payment amounts into Prisma-safe monetary values
 * - Convert structured domain values into Prisma-safe JSON
 * - Normalize dates, strings, identifiers and metadata
 * - Map Payment-domain enums defensively
 * - Provide reusable transaction/gateway/failure mapping helpers
 *
 * Important:
 * - This mapper does not access PrismaClient
 * - This mapper does not perform repository operations
 * - This mapper does not call Razorpay or another provider
 * - This mapper does not perform Payment business validation
 * - Domain validation must occur before persistence mapping
 *
 * Later parts will add:
 * - Payment aggregate -> persistence mapping
 * - persistence -> Payment aggregate mapping
 * - PaymentTransaction persistence mapping
 * - search/filter mapping
 * - list/summary mapping
 * ============================================================================
 */

import {
  Prisma,
} from "@prisma/client";

import {
  PaymentActorType,
  PaymentCurrency,
  PaymentMethod,
  PaymentProvider,
  PaymentPurpose,
  PaymentSource,
  PaymentStatus,
  PaymentTransactionStatus,
  PaymentTransactionType,
PaymentWebhookEventType,
} from "../models/payment.model";

import type {
  PaymentActor,
  PaymentAudit,
  PaymentCommercialReference,
  PaymentFailure,
  PaymentGatewayReference,
  PaymentMoney,
  PaymentPayableSummary,
  PaymentRefundSummary,
  PaymentTransaction,
} from "../models/payment.model";

/* ============================================================================
 * Primitive normalization helpers
 * ============================================================================
 */

/**
 * Returns a trimmed non-empty string.
 *
 * Empty or non-string values become undefined.
 */
export function normalizePaymentMapperString(
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
 * Returns a required string using the supplied fallback when necessary.
 *
 * Validation should normally guarantee required identifiers before this
 * mapper is called. This helper exists as defensive persistence protection.
 */
export function normalizeRequiredPaymentMapperString(
  value:
    unknown,
  fallback =
    ""
): string {
  return normalizePaymentMapperString(
    value
  ) ??
    fallback;
}

/**
 * Returns a finite numeric value.
 */
export function normalizePaymentMapperNumber(
  value:
    unknown,
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

  return value;
}

/**
 * Returns a non-negative finite numeric value.
 */
export function normalizeNonNegativePaymentMapperNumber(
  value:
    unknown,
  fallback =
    0
): number {
  const normalized =
    normalizePaymentMapperNumber(
      value,
      fallback
    );

  return normalized >=
    0
    ? normalized
    : fallback;
}

/* ============================================================================
 * Monetary mapping
 * ============================================================================
 */

/**
 * Normalizes Payment-domain money to two decimal places.
 *
 * Prisma Decimal fields accept numbers as input, while persistence records
 * may later expose Decimal instances when read.
 */
export function mapPaymentAmountToPrisma(
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

/**
 * Converts a Prisma Decimal/number/string-compatible value into a domain
 * number.
 *
 * This intentionally accepts unknown so the helper can be reused with
 * repository projections and compatibility persistence records.
 */
export function mapPaymentAmountFromPrisma(
  value:
    unknown,
  fallback =
    0
): number {
  if (
    typeof value ===
      "number"
  ) {
    return Number.isFinite(
      value
    )
      ? mapPaymentAmountToPrisma(
          value,
          fallback
        )
      : fallback;
  }

  if (
    typeof value ===
      "string"
  ) {
    const parsed =
      Number(
        value
      );

    return Number.isFinite(
      parsed
    )
      ? mapPaymentAmountToPrisma(
          parsed,
          fallback
        )
      : fallback;
  }

  if (
    value instanceof
      Prisma.Decimal
  ) {
    const parsed =
      value.toNumber();

    return Number.isFinite(
      parsed
    )
      ? mapPaymentAmountToPrisma(
          parsed,
          fallback
        )
      : fallback;
  }

  if (
    typeof value ===
      "object" &&
    value !==
      null &&
    "toString" in
      value &&
    typeof (
      value as {
        toString?:
          unknown;
      }
    ).toString ===
      "function"
  ) {
    const parsed =
      Number(
        String(
          value
        )
      );

    if (
      Number.isFinite(
        parsed
      )
    ) {
      return mapPaymentAmountToPrisma(
        parsed,
        fallback
      );
    }
  }

  return fallback;
}

/**
 * Maps a domain PaymentMoney value into a plain persistence-safe structure.
 */
export interface PaymentMappedMoney {
  amount:
    number;

  currency:
    PaymentCurrency;
}

export function mapPaymentMoneyToPersistence(
  money:
    PaymentMoney
): PaymentMappedMoney {
  return {
    amount:
      mapPaymentAmountToPrisma(
        money.amount
      ),

    currency:
      mapPaymentCurrency(
        money.currency
      ),
  };
}

/* ============================================================================
 * Date conversion
 * ============================================================================
 */

/**
 * Converts a domain ISO/date string into Date.
 *
 * Invalid values return the optional fallback.
 */
export function mapPaymentDateToPrisma(
  value:
    string | undefined,
  fallback?:
    Date
): Date | undefined {
  if (
    !value
  ) {
    return fallback;
  }

  const parsed =
    new Date(
      value
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return fallback;
  }

  return parsed;
}

/**
 * Required date mapper.
 */
export function mapRequiredPaymentDateToPrisma(
  value:
    string | undefined,
  fallback =
    new Date()
): Date {
  return mapPaymentDateToPrisma(
    value,
    fallback
  ) ??
    fallback;
}

/**
 * Converts persistence Date/string values into ISO strings.
 */
export function mapPaymentDateFromPrisma(
  value:
    unknown
): string | undefined {
  if (
    value instanceof
      Date
  ) {
    return Number.isNaN(
      value.getTime()
    )
      ? undefined
      : value.toISOString();
  }

  if (
    typeof value ===
      "string"
  ) {
    const parsed =
      new Date(
        value
      );

    return Number.isNaN(
      parsed.getTime()
    )
      ? undefined
      : parsed.toISOString();
  }

  return undefined;
}

/* ============================================================================
 * JSON conversion
 * ============================================================================
 */

/**
 * Converts structured domain data into Prisma JSON.
 *
 * stringify/parse intentionally removes undefined properties because Prisma
 * JSON values do not support undefined.
 */
export function mapPaymentJsonToPrisma(
  value:
    unknown
): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify(
      value
    )
  ) as Prisma.InputJsonValue;
}

/**
 * Converts optional structured data into nullable Prisma JSON.
 */
export function mapNullablePaymentJsonToPrisma(
  value:
    unknown
):
  | Prisma.InputJsonValue
  | Prisma.JsonNullValueInput {
  if (
    value ===
      undefined ||
    value ===
      null
  ) {
    return Prisma.JsonNull;
  }

  return mapPaymentJsonToPrisma(
    value
  );
}

/**
 * Converts a JSON-compatible persistence value into an object.
 */
export function mapPaymentJsonObjectFromPrisma(
  value:
    unknown
): Record<
  string,
  unknown
> | undefined {
  if (
    typeof value !==
      "object" ||
    value ===
      null ||
    Array.isArray(
      value
    )
  ) {
    return undefined;
  }

  return {
    ...(
      value as Record<
        string,
        unknown
      >
    ),
  };
}

/**
 * Safely converts a persistence JSON array.
 */
export function mapPaymentJsonArrayFromPrisma(
  value:
    unknown
): unknown[] {
  return Array.isArray(
    value
  )
    ? [
        ...value,
      ]
    : [];
}

/* ============================================================================
 * Currency mapping
 * ============================================================================
 */

export function mapPaymentCurrency(
  value:
    unknown
): PaymentCurrency {
  switch (
    value
  ) {
    case PaymentCurrency.INR:
    case "INR":
      return PaymentCurrency.INR;

    default:
      return PaymentCurrency.INR;
  }
}

/* ============================================================================
 * Payment status mapping
 * ============================================================================
 */

export function mapPaymentStatus(
  value:
    unknown
): PaymentStatus {
  switch (
    value
  ) {
    case PaymentStatus.PENDING:
      return PaymentStatus.PENDING;

    case PaymentStatus.PARTIALLY_PAID:
      return PaymentStatus.PARTIALLY_PAID;

    case PaymentStatus.PAID:
      return PaymentStatus.PAID;

    case PaymentStatus.FAILED:
      return PaymentStatus.FAILED;

    case PaymentStatus.CANCELLED:
      return PaymentStatus.CANCELLED;

    case PaymentStatus.REFUND_PENDING:
      return PaymentStatus.REFUND_PENDING;

    case PaymentStatus.PARTIALLY_REFUNDED:
      return PaymentStatus.PARTIALLY_REFUNDED;

    case PaymentStatus.REFUNDED:
      return PaymentStatus.REFUNDED;

    default:
      return PaymentStatus.PENDING;
  }
}

/* ============================================================================
 * Transaction status mapping
 * ============================================================================
 */

export function mapPaymentTransactionStatus(
  value:
    unknown
): PaymentTransactionStatus {
  switch (
    value
  ) {
    case PaymentTransactionStatus.INITIATED:
      return PaymentTransactionStatus.INITIATED;

    case PaymentTransactionStatus.PENDING:
      return PaymentTransactionStatus.PENDING;

    case PaymentTransactionStatus.AUTHORIZED:
      return PaymentTransactionStatus.AUTHORIZED;

    case PaymentTransactionStatus.CAPTURED:
      return PaymentTransactionStatus.CAPTURED;

    case PaymentTransactionStatus.SUCCESS:
      return PaymentTransactionStatus.SUCCESS;

    case PaymentTransactionStatus.FAILED:
      return PaymentTransactionStatus.FAILED;

    case PaymentTransactionStatus.CANCELLED:
      return PaymentTransactionStatus.CANCELLED;

    case PaymentTransactionStatus.REFUNDED:
      return PaymentTransactionStatus.REFUNDED;

    default:
      return PaymentTransactionStatus.PENDING;
  }
}

/* ============================================================================
 * Transaction type mapping
 * ============================================================================
 */

export function mapPaymentTransactionType(
  value:
    unknown
): PaymentTransactionType {
  switch (
    value
  ) {
    case PaymentTransactionType.COLLECTION:
      return PaymentTransactionType.COLLECTION;

    case PaymentTransactionType.REFUND:
      return PaymentTransactionType.REFUND;

    case PaymentTransactionType.ADJUSTMENT:
      return PaymentTransactionType.ADJUSTMENT;

    default:
      return PaymentTransactionType.COLLECTION;
  }
}

/* ============================================================================
 * Payment purpose mapping
 * ============================================================================
 */

export function mapPaymentPurpose(
  value:
    unknown
): PaymentPurpose | undefined {
  switch (
    value
  ) {
    case PaymentPurpose.ADVANCE:
      return PaymentPurpose.ADVANCE;

    case PaymentPurpose.BALANCE:
      return PaymentPurpose.BALANCE;

    case PaymentPurpose.FULL_PAYMENT:
      return PaymentPurpose.FULL_PAYMENT;

    case PaymentPurpose.ADDITIONAL:
      return PaymentPurpose.ADDITIONAL;

    default:
      return undefined;
  }
}

/* ============================================================================
 * Payment method mapping
 * ============================================================================
 */

export function mapPaymentMethod(
  value:
    unknown
): PaymentMethod | undefined {
  switch (
    value
  ) {
    case PaymentMethod.UPI:
      return PaymentMethod.UPI;

    case PaymentMethod.CARD:
      return PaymentMethod.CARD;

    case PaymentMethod.NET_BANKING:
      return PaymentMethod.NET_BANKING;

    case PaymentMethod.WALLET:
      return PaymentMethod.WALLET;

    case PaymentMethod.BANK_TRANSFER:
      return PaymentMethod.BANK_TRANSFER;

    case PaymentMethod.CASH:
      return PaymentMethod.CASH;

    case PaymentMethod.CHEQUE:
      return PaymentMethod.CHEQUE;

    case PaymentMethod.OTHER:
      return PaymentMethod.OTHER;

    default:
      return undefined;
  }
}

/* ============================================================================
 * Payment provider mapping
 * ============================================================================
 */

export function mapPaymentProvider(
  value:
    unknown
): PaymentProvider {
  switch (
    value
  ) {
    case PaymentProvider.RAZORPAY:
      return PaymentProvider.RAZORPAY;

    case PaymentProvider.MANUAL:
      return PaymentProvider.MANUAL;

    case PaymentProvider.BANK:
      return PaymentProvider.BANK;

    case PaymentProvider.OTHER:
      return PaymentProvider.OTHER;

    default:
      return PaymentProvider.OTHER;
  }
}

/* ============================================================================
 * Payment source mapping
 * ============================================================================
 */

export function mapPaymentSource(
  value:
    unknown
): PaymentSource {
  switch (
    value
  ) {
    case PaymentSource.WEB:
      return PaymentSource.WEB;

    case PaymentSource.ANDROID:
      return PaymentSource.ANDROID;

    case PaymentSource.IOS:
      return PaymentSource.IOS;

    case PaymentSource.ADMIN:
      return PaymentSource.ADMIN;

    case PaymentSource.CORPORATE:
      return PaymentSource.CORPORATE;

    case PaymentSource.API:
      return PaymentSource.API;

    case PaymentSource.WEBHOOK:
      return PaymentSource.WEBHOOK;

    default:
      return PaymentSource.API;
  }
}

/* ============================================================================
 * Payment actor type mapping
 * ============================================================================
 */

export function mapPaymentActorType(
  value:
    unknown
): PaymentActorType {
  switch (
    value
  ) {
    case PaymentActorType.CUSTOMER:
      return PaymentActorType.CUSTOMER;

    case PaymentActorType.CORPORATE:
      return PaymentActorType.CORPORATE;

    case PaymentActorType.ADMIN:
      return PaymentActorType.ADMIN;

    case PaymentActorType.VENDOR:
      return PaymentActorType.VENDOR;

    case PaymentActorType.SYSTEM:
      return PaymentActorType.SYSTEM;

    default:
      return PaymentActorType.SYSTEM;
  }
}

/* ============================================================================
 * Payment actor mapping
 * ============================================================================
 */

export function mapPaymentActor(
  value:
    unknown
): PaymentActor | undefined {
  if (
    typeof value !==
      "object" ||
    value ===
      null ||
    Array.isArray(
      value
    )
  ) {
    return undefined;
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  return {
    actorType:
      mapPaymentActorType(
        record.actorType
      ),

    ...(normalizePaymentMapperString(
      record.actorId
    )
      ? {
          actorId:
            normalizePaymentMapperString(
              record.actorId
            ),
        }
      : {}),

    ...(normalizePaymentMapperString(
      record.displayName
    )
      ? {
          displayName:
            normalizePaymentMapperString(
              record.displayName
            ),
        }
      : {}),
  };
}

/* ============================================================================
 * Gateway reference mapping
 * ============================================================================
 */

export function mapPaymentGatewayReference(
  value:
    unknown
): PaymentGatewayReference | undefined {
  if (
    typeof value !==
      "object" ||
    value ===
      null ||
    Array.isArray(
      value
    )
  ) {
    return undefined;
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  return {
    provider:
      mapPaymentProvider(
        record.provider
      ),

    ...(normalizePaymentMapperString(
      record.gatewayOrderId
    )
      ? {
          gatewayOrderId:
            normalizePaymentMapperString(
              record.gatewayOrderId
            ),
        }
      : {}),

    ...(normalizePaymentMapperString(
      record.gatewayPaymentId
    )
      ? {
          gatewayPaymentId:
            normalizePaymentMapperString(
              record.gatewayPaymentId
            ),
        }
      : {}),

    ...(normalizePaymentMapperString(
      record.gatewayReferenceId
    )
      ? {
          gatewayReferenceId:
            normalizePaymentMapperString(
              record.gatewayReferenceId
            ),
        }
      : {}),
  };
}

/* ============================================================================
 * Failure mapping
 * ============================================================================
 */

export function mapPaymentFailure(
  value:
    unknown
): PaymentFailure | undefined {
  if (
    typeof value !==
      "object" ||
    value ===
      null ||
    Array.isArray(
      value
    )
  ) {
    return undefined;
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  const failedAt =
    mapPaymentDateFromPrisma(
      record.failedAt
    );

  return {
    ...(normalizePaymentMapperString(
      record.reason
    )
      ? {
          reason:
            normalizePaymentMapperString(
              record.reason
            ),
        }
      : {}),

    ...(normalizePaymentMapperString(
      record.message
    )
      ? {
          message:
            normalizePaymentMapperString(
              record.message
            ),
        }
      : {}),

    ...(normalizePaymentMapperString(
      record.providerCode
    )
      ? {
          providerCode:
            normalizePaymentMapperString(
              record.providerCode
            ),
        }
      : {}),

    ...(failedAt
      ? {
          failedAt,
        }
      : {}),
  };
}

/* ============================================================================
 * Payable-summary mapping
 * ============================================================================
 */

export function mapPaymentPayableSummary(
  value:
    unknown,
  fallbackCurrency =
    PaymentCurrency.INR
): PaymentPayableSummary {
  const record =
    mapPaymentJsonObjectFromPrisma(
      value
    ) ??
    {};

  const totalAmount =
    mapPaymentAmountFromPrisma(
      record.totalAmount
    );

  const paidAmount =
    mapPaymentAmountFromPrisma(
      record.paidAmount
    );

  const balanceAmount =
    mapPaymentAmountFromPrisma(
      record.balanceAmount,
      Math.max(
        0,
        totalAmount -
          paidAmount
      )
    );

  const paymentPending =
    mapPaymentAmountFromPrisma(
      record.paymentPending,
      balanceAmount
    );

  const advanceAmount =
    record.advanceAmount !==
      undefined
      ? mapPaymentAmountFromPrisma(
          record.advanceAmount
        )
      : undefined;

  return {
    totalAmount,

    ...(advanceAmount !==
      undefined
      ? {
          advanceAmount,
        }
      : {}),

    paidAmount,

    balanceAmount,

    paymentPending,

    currency:
      record.currency !==
        undefined
        ? mapPaymentCurrency(
            record.currency
          )
        : fallbackCurrency,
  };
}

/* ============================================================================
 * Refund-summary mapping
 * ============================================================================
 */

export function mapPaymentRefundSummary(
  value:
    unknown,
  fallbackCurrency =
    PaymentCurrency.INR
): PaymentRefundSummary | undefined {
  const record =
    mapPaymentJsonObjectFromPrisma(
      value
    );

  if (
    !record
  ) {
    return undefined;
  }

  const lastRefundedAt =
    mapPaymentDateFromPrisma(
      record.lastRefundedAt
    );

  return {
    totalRefundedAmount:
      mapPaymentAmountFromPrisma(
        record.totalRefundedAmount
      ),

    ...(record.refundPendingAmount !==
      undefined
      ? {
          refundPendingAmount:
            mapPaymentAmountFromPrisma(
              record.refundPendingAmount
            ),
        }
      : {}),

    ...(lastRefundedAt
      ? {
          lastRefundedAt,
        }
      : {}),

    currency:
      record.currency !==
        undefined
        ? mapPaymentCurrency(
            record.currency
          )
        : fallbackCurrency,
  };
}

/* ============================================================================
 * Commercial-reference mapping
 * ============================================================================
 */

export function mapPaymentCommercialReference(
  value:
    unknown,
  fallbackCurrency =
    PaymentCurrency.INR
): PaymentCommercialReference | undefined {
  const record =
    mapPaymentJsonObjectFromPrisma(
      value
    );

  if (
    !record
  ) {
    return undefined;
  }

  return {
    ...(normalizePaymentMapperString(
      record.quotationId
    )
      ? {
          quotationId:
            normalizePaymentMapperString(
              record.quotationId
            ),
        }
      : {}),

    ...(normalizePaymentMapperString(
      record.quotationNumber
    )
      ? {
          quotationNumber:
            normalizePaymentMapperString(
              record.quotationNumber
            ),
        }
      : {}),

    ...(record.customerPayableAmount !==
      undefined
      ? {
          customerPayableAmount:
            mapPaymentAmountFromPrisma(
              record.customerPayableAmount
            ),
        }
      : {}),

    ...(record.vendorQuotedAmount !==
      undefined
      ? {
          vendorQuotedAmount:
            mapPaymentAmountFromPrisma(
              record.vendorQuotedAmount
            ),
        }
      : {}),

    ...(record.platformMarkupAmount !==
      undefined
      ? {
          platformMarkupAmount:
            mapPaymentAmountFromPrisma(
              record.platformMarkupAmount
            ),
        }
      : {}),

    ...(record.platformCommissionAmount !==
      undefined
      ? {
          platformCommissionAmount:
            mapPaymentAmountFromPrisma(
              record.platformCommissionAmount
            ),
        }
      : {}),

    currency:
      record.currency !==
        undefined
        ? mapPaymentCurrency(
            record.currency
          )
        : fallbackCurrency,
  };
}

/* ============================================================================
 * Payment audit mapping
 * ============================================================================
 */

export function mapPaymentAudit(
  value:
    unknown,
  defaults?:
    {
      createdAt?:
        string;

      updatedAt?:
        string;

      source?:
        PaymentSource;
    }
): PaymentAudit {
  const record =
    mapPaymentJsonObjectFromPrisma(
      value
    ) ??
    {};

  const now =
    new Date()
      .toISOString();

  return {
    createdAt:
      mapPaymentDateFromPrisma(
        record.createdAt
      ) ??
      defaults?.createdAt ??
      now,

    updatedAt:
      mapPaymentDateFromPrisma(
        record.updatedAt
      ) ??
      defaults?.updatedAt ??
      defaults?.createdAt ??
      now,

    ...(normalizePaymentMapperString(
      record.createdBy
    )
      ? {
          createdBy:
            normalizePaymentMapperString(
              record.createdBy
            ),
        }
      : {}),

    ...(normalizePaymentMapperString(
      record.updatedBy
    )
      ? {
          updatedBy:
            normalizePaymentMapperString(
              record.updatedBy
            ),
        }
      : {}),

    source:
      record.source !==
        undefined
        ? mapPaymentSource(
            record.source
          )
        : defaults?.source ??
          PaymentSource.API,
  };
}

/* ============================================================================
 * Payment transaction mapping from generic persistence value
 * ============================================================================
 */

/**
 * Converts a generic transaction record into a Payment-domain transaction.
 *
 * This is intentionally persistence-model-neutral for Part A.
 *
 * Once the Prisma PaymentTransaction model is finalized, Part B can add a
 * strongly typed Prisma overload/wrapper around this helper.
 */
export function mapPaymentTransactionFromRecord(
  value:
    unknown
): PaymentTransaction | undefined {
  const record =
    mapPaymentJsonObjectFromPrisma(
      value
    );

  if (
    !record
  ) {
    return undefined;
  }

  const transactionId =
    normalizePaymentMapperString(
      record.transactionId ??
      record.id
    );

  const paymentId =
    normalizePaymentMapperString(
      record.paymentId
    );

  if (
    !transactionId ||
    !paymentId
  ) {
    return undefined;
  }

  const initiatedAt =
    mapPaymentDateFromPrisma(
      record.initiatedAt
    ) ??
    new Date()
      .toISOString();

  const gateway =
    mapPaymentGatewayReference(
      record.gateway
    );

  const failure =
    mapPaymentFailure(
      record.failure
    );

  const recordedBy =
    mapPaymentActor(
      record.recordedBy
    );

  const authorizedAt =
    mapPaymentDateFromPrisma(
      record.authorizedAt
    );

  const capturedAt =
    mapPaymentDateFromPrisma(
      record.capturedAt
    );

  const completedAt =
    mapPaymentDateFromPrisma(
      record.completedAt
    );

  const failedAt =
    mapPaymentDateFromPrisma(
      record.failedAt
    );

  const purpose =
    mapPaymentPurpose(
      record.purpose
    );

  const method =
    mapPaymentMethod(
      record.method
    );

  const amountRecord =
    mapPaymentJsonObjectFromPrisma(
      record.amount
    );

  const amountValue =
    amountRecord
      ? mapPaymentAmountFromPrisma(
          amountRecord.amount
        )
      : mapPaymentAmountFromPrisma(
          record.amount
        );

  const currency =
    amountRecord
      ? mapPaymentCurrency(
          amountRecord.currency
        )
      : mapPaymentCurrency(
          record.currency
        );

  return {
    transactionId,

    paymentId,

    transactionType:
      mapPaymentTransactionType(
        record.transactionType
      ),

    ...(purpose
      ? {
          purpose,
        }
      : {}),

    amount: {
      amount:
        amountValue,

      currency,
    },

    status:
      mapPaymentTransactionStatus(
        record.status
      ),

    ...(method
      ? {
          method,
        }
      : {}),

    provider:
      mapPaymentProvider(
        record.provider
      ),

    ...(gateway
      ? {
          gateway,
        }
      : {}),

    ...(failure
      ? {
          failure,
        }
      : {}),

    initiatedAt,

    ...(authorizedAt
      ? {
          authorizedAt,
        }
      : {}),

    ...(capturedAt
      ? {
          capturedAt,
        }
      : {}),

    ...(completedAt
      ? {
          completedAt,
        }
      : {}),

    ...(failedAt
      ? {
          failedAt,
        }
      : {}),

    ...(normalizePaymentMapperString(
      record.remarks
    )
      ? {
          remarks:
            normalizePaymentMapperString(
              record.remarks
            ),
        }
      : {}),

    ...(recordedBy
      ? {
          recordedBy,
        }
      : {}),
  };
}

/* ============================================================================
 * Transaction-array mapping
 * ============================================================================
 */

export function mapPaymentTransactionsFromPersistence(
  value:
    unknown
): PaymentTransaction[] {
  if (
    !Array.isArray(
      value
    )
  ) {
    return [];
  }

  return value
    .map(
      (
        transaction
      ) =>
        mapPaymentTransactionFromRecord(
          transaction
        )
    )
    .filter(
      (
        transaction
      ): transaction is PaymentTransaction =>
        transaction !==
        undefined
    );
}

/* ============================================================================
 * Metadata mapping
 * ============================================================================
 */

export function mapPaymentMetadata(
  value:
    unknown
): Record<
  string,
  unknown
> | undefined {
  return mapPaymentJsonObjectFromPrisma(
    value
  );
}

/* ============================================================================
 * Persistence JSON builders
 * ============================================================================
 */

export function mapPaymentPayableSummaryToPrismaJson(
  value:
    PaymentPayableSummary
): Prisma.InputJsonValue {
  return mapPaymentJsonToPrisma({
    totalAmount:
      mapPaymentAmountToPrisma(
        value.totalAmount
      ),

    advanceAmount:
      value.advanceAmount !==
        undefined
        ? mapPaymentAmountToPrisma(
            value.advanceAmount
          )
        : undefined,

    paidAmount:
      mapPaymentAmountToPrisma(
        value.paidAmount
      ),

    balanceAmount:
      mapPaymentAmountToPrisma(
        value.balanceAmount
      ),

    paymentPending:
      mapPaymentAmountToPrisma(
        value.paymentPending
      ),

    currency:
      mapPaymentCurrency(
        value.currency
      ),
  });
}

export function mapPaymentRefundSummaryToPrismaJson(
  value:
    PaymentRefundSummary | undefined
):
  | Prisma.InputJsonValue
  | Prisma.JsonNullValueInput {
  if (
    !value
  ) {
    return Prisma.JsonNull;
  }

  return mapPaymentJsonToPrisma({
    totalRefundedAmount:
      mapPaymentAmountToPrisma(
        value.totalRefundedAmount
      ),

    refundPendingAmount:
      value.refundPendingAmount !==
        undefined
        ? mapPaymentAmountToPrisma(
            value.refundPendingAmount
          )
        : undefined,

    lastRefundedAt:
      value.lastRefundedAt,

    currency:
      mapPaymentCurrency(
        value.currency
      ),
  });
}

export function mapPaymentCommercialReferenceToPrismaJson(
  value:
    PaymentCommercialReference | undefined
):
  | Prisma.InputJsonValue
  | Prisma.JsonNullValueInput {
  if (
    !value
  ) {
    return Prisma.JsonNull;
  }

  return mapPaymentJsonToPrisma({
    ...value,

    customerPayableAmount:
      value.customerPayableAmount !==
        undefined
        ? mapPaymentAmountToPrisma(
            value.customerPayableAmount
          )
        : undefined,

    vendorQuotedAmount:
      value.vendorQuotedAmount !==
        undefined
        ? mapPaymentAmountToPrisma(
            value.vendorQuotedAmount
          )
        : undefined,

    platformMarkupAmount:
      value.platformMarkupAmount !==
        undefined
        ? mapPaymentAmountToPrisma(
            value.platformMarkupAmount
          )
        : undefined,

    platformCommissionAmount:
      value.platformCommissionAmount !==
        undefined
        ? mapPaymentAmountToPrisma(
            value.platformCommissionAmount
          )
        : undefined,

    currency:
      mapPaymentCurrency(
        value.currency
      ),
  });
}

export function mapPaymentAuditToPrismaJson(
  value:
    PaymentAudit
): Prisma.InputJsonValue {
  return mapPaymentJsonToPrisma({
    createdAt:
      value.createdAt,

    updatedAt:
      value.updatedAt,

    createdBy:
      value.createdBy,

    updatedBy:
      value.updatedBy,

    source:
      mapPaymentSource(
        value.source
      ),
  });
}

/* ============================================================================
 * Transaction persistence JSON mapping
 * ============================================================================
 */

export function mapPaymentTransactionToPrismaJson(
  transaction:
    PaymentTransaction
): Prisma.InputJsonValue {
  return mapPaymentJsonToPrisma({
    transactionId:
      transaction.transactionId,

    paymentId:
      transaction.paymentId,

    transactionType:
      mapPaymentTransactionType(
        transaction.transactionType
      ),

    purpose:
      transaction.purpose,

    amount: {
      amount:
        mapPaymentAmountToPrisma(
          transaction.amount
            .amount
        ),

      currency:
        mapPaymentCurrency(
          transaction.amount
            .currency
        ),
    },

    status:
      mapPaymentTransactionStatus(
        transaction.status
      ),

    method:
      transaction.method,

    provider:
      mapPaymentProvider(
        transaction.provider
      ),

    gateway:
      transaction.gateway,

    failure:
      transaction.failure,

    initiatedAt:
      transaction.initiatedAt,

    authorizedAt:
      transaction.authorizedAt,

    capturedAt:
      transaction.capturedAt,

    completedAt:
      transaction.completedAt,

    failedAt:
      transaction.failedAt,

    remarks:
      transaction.remarks,

    recordedBy:
      transaction.recordedBy,
  });
}

export function mapPaymentTransactionsToPrismaJson(
  transactions:
    PaymentTransaction[]
): Prisma.InputJsonValue {
  return mapPaymentJsonToPrisma(
    transactions.map(
      (
        transaction
      ) =>
        JSON.parse(
          JSON.stringify(
            mapPaymentTransactionToPrismaJson(
              transaction
            )
          )
        )
    )
  );
}

/* ============================================================================
 * End of Payment Mapper - Part A
 * ============================================================================
 */
/* ============================================================================
 * Payment aggregate persistence contracts
 * ============================================================================
 */

import type {
  Payment,
  PaymentSummary,
} from "../models/payment.model";

/**
 * Persistence-neutral representation of a Payment record.
 *
 * This contract deliberately mirrors the Payment aggregate without depending
 * on a Prisma Payment model that has not yet been finalized.
 *
 * The future Prisma repository may:
 * - use this shape directly as an intermediate representation, or
 * - map an actual Prisma Payment record into this contract first.
 */
export interface PaymentPersistenceRecord {
  id:
    string;

  paymentNumber:
    string;

  referenceId:
    string;

  bookingId:
    string;

  bookingNumber?:
    string | null;

  leadId?:
    string | null;

  customerId?:
    string | null;

  vendorId?:
    string | null;

  quotationId?:
    string | null;

  status:
    unknown;

  totalAmount:
    unknown;

  advanceAmount?:
    unknown;

  paidAmount:
    unknown;

  balanceAmount:
    unknown;

  paymentPending:
    unknown;

  currency:
    unknown;

  payableJson?:
    unknown;

  commercialReferenceJson?:
    unknown;

  transactionsJson?:
    unknown;

  refundSummaryJson?:
    unknown;

  latestSuccessfulTransactionId?:
    string | null;

  remarks?:
    string | null;

  internalRemarks?:
    string | null;

  metadataJson?:
    unknown;

  auditJson?:
    unknown;

  createdAt:
    Date | string;

  updatedAt:
    Date | string;
}

/* ============================================================================
 * Payment persistence write contract
 * ============================================================================
 */

/**
 * Persistence-neutral write representation.
 *
 * Once schema.prisma contains the dedicated Payment model, the Prisma
 * repository may adapt this into Prisma.PaymentUncheckedCreateInput /
 * Prisma.PaymentUncheckedUpdateInput.
 */
export interface PaymentPersistenceWriteData {
  id:
    string;

  paymentNumber:
    string;

  referenceId:
    string;

  bookingId:
    string;

  bookingNumber:
    string | null;

  leadId:
    string | null;

  customerId:
    string | null;

  vendorId:
    string | null;

  quotationId:
    string | null;

  status:
    string;

  totalAmount:
    number;

  advanceAmount:
    number | null;

  paidAmount:
    number;

  balanceAmount:
    number;

  paymentPending:
    number;

  currency:
    string;

  payableJson:
    Prisma.InputJsonValue;

  commercialReferenceJson:
    | Prisma.InputJsonValue
    | Prisma.JsonNullValueInput;

  transactionsJson:
    Prisma.InputJsonValue;

  refundSummaryJson:
    | Prisma.InputJsonValue
    | Prisma.JsonNullValueInput;

  latestSuccessfulTransactionId:
    string | null;

  remarks:
    string | null;

  internalRemarks:
    string | null;

  metadataJson:
    | Prisma.InputJsonValue
    | Prisma.JsonNullValueInput;

  auditJson:
    Prisma.InputJsonValue;

  createdAt:
    Date;

  updatedAt:
    Date;
}

/* ============================================================================
 * Domain Payment -> persistence
 * ============================================================================
 */

/**
 * Maps the complete Payment aggregate into persistence-neutral write data.
 *
 * Important:
 * - No business calculations are performed here
 * - The mapper trusts payable totals already validated by the service
 * - Transactions are preserved as immutable history
 */
export function mapPaymentToPersistence(
  payment:
    Payment
): PaymentPersistenceWriteData {
  return {
    id:
      normalizeRequiredPaymentMapperString(
        payment.paymentId
      ),

    paymentNumber:
      normalizeRequiredPaymentMapperString(
        payment.paymentNumber
      ),

    referenceId:
      normalizeRequiredPaymentMapperString(
        payment.referenceId
      ),

    bookingId:
      normalizeRequiredPaymentMapperString(
        payment.bookingId
      ),

    bookingNumber:
      normalizePaymentMapperString(
        payment.bookingNumber
      ) ??
      null,

    leadId:
      normalizePaymentMapperString(
        payment.leadId
      ) ??
      null,

    customerId:
      normalizePaymentMapperString(
        payment.customerId
      ) ??
      null,

    vendorId:
      normalizePaymentMapperString(
        payment.vendorId
      ) ??
      null,

    quotationId:
      normalizePaymentMapperString(
        payment.quotationId
      ) ??
      null,

    status:
      mapPaymentStatus(
        payment.status
      ),

    totalAmount:
      mapPaymentAmountToPrisma(
        payment.payable
          .totalAmount
      ),

    advanceAmount:
      payment.payable
        .advanceAmount !==
        undefined
        ? mapPaymentAmountToPrisma(
            payment.payable
              .advanceAmount
          )
        : null,

    paidAmount:
      mapPaymentAmountToPrisma(
        payment.payable
          .paidAmount
      ),

    balanceAmount:
      mapPaymentAmountToPrisma(
        payment.payable
          .balanceAmount
      ),

    paymentPending:
      mapPaymentAmountToPrisma(
        payment.payable
          .paymentPending
      ),

    currency:
      mapPaymentCurrency(
        payment.payable
          .currency
      ),

    payableJson:
      mapPaymentPayableSummaryToPrismaJson(
        payment.payable
      ),

    commercialReferenceJson:
      mapPaymentCommercialReferenceToPrismaJson(
        payment.commercialReference
      ),

    transactionsJson:
      mapPaymentTransactionsToPrismaJson(
        payment.transactions
      ),

    refundSummaryJson:
      mapPaymentRefundSummaryToPrismaJson(
        payment.refundSummary
      ),

    latestSuccessfulTransactionId:
      normalizePaymentMapperString(
        payment.latestSuccessfulTransactionId
      ) ??
      null,

    remarks:
      normalizePaymentMapperString(
        payment.remarks
      ) ??
      null,

    internalRemarks:
      normalizePaymentMapperString(
        payment.internalRemarks
      ) ??
      null,

    metadataJson:
      payment.metadata
        ? mapPaymentJsonToPrisma(
            payment.metadata
          )
        : Prisma.JsonNull,

    auditJson:
      mapPaymentAuditToPrismaJson(
        payment.audit
      ),

    createdAt:
      mapRequiredPaymentDateToPrisma(
        payment.audit
          .createdAt
      ),

    updatedAt:
      mapRequiredPaymentDateToPrisma(
        payment.audit
          .updatedAt
      ),
  };
}

/* ============================================================================
 * Persistence -> Payment payable summary
 * ============================================================================
 */

export function mapPaymentPayableFromRecord(
  record:
    PaymentPersistenceRecord
): PaymentPayableSummary {
  const jsonPayable =
    mapPaymentJsonObjectFromPrisma(
      record.payableJson
    );

  if (
    jsonPayable
  ) {
    return mapPaymentPayableSummary(
      jsonPayable,
      mapPaymentCurrency(
        record.currency
      )
    );
  }

  const totalAmount =
    mapPaymentAmountFromPrisma(
      record.totalAmount
    );

  const paidAmount =
    mapPaymentAmountFromPrisma(
      record.paidAmount
    );

  const balanceAmount =
    mapPaymentAmountFromPrisma(
      record.balanceAmount,
      Math.max(
        0,
        totalAmount -
          paidAmount
      )
    );

  return {
    totalAmount,

    ...(record.advanceAmount !==
      undefined &&
    record.advanceAmount !==
      null
      ? {
          advanceAmount:
            mapPaymentAmountFromPrisma(
              record.advanceAmount
            ),
        }
      : {}),

    paidAmount,

    balanceAmount,

    paymentPending:
      mapPaymentAmountFromPrisma(
        record.paymentPending,
        balanceAmount
      ),

    currency:
      mapPaymentCurrency(
        record.currency
      ),
  };
}

/* ============================================================================
 * Persistence -> transactions
 * ============================================================================
 */

export function mapPaymentTransactionsFromRecord(
  record:
    PaymentPersistenceRecord
): PaymentTransaction[] {
  return mapPaymentTransactionsFromPersistence(
    record.transactionsJson
  );
}

/* ============================================================================
 * Persistence -> full Payment aggregate
 * ============================================================================
 */

/**
 * Reconstructs the complete Payment aggregate.
 */
export function mapPaymentFromPersistence(
  record:
    PaymentPersistenceRecord
): Payment {
  const currency =
    mapPaymentCurrency(
      record.currency
    );

  const payable =
    mapPaymentPayableFromRecord(
      record
    );

  const transactions =
    mapPaymentTransactionsFromRecord(
      record
    );

  const createdAt =
    mapPaymentDateFromPrisma(
      record.createdAt
    ) ??
    new Date()
      .toISOString();

  const updatedAt =
    mapPaymentDateFromPrisma(
      record.updatedAt
    ) ??
    createdAt;

  const audit =
    mapPaymentAudit(
      record.auditJson,
      {
        createdAt,
        updatedAt,
        source:
          PaymentSource.API,
      }
    );

  const commercialReference =
    mapPaymentCommercialReference(
      record
        .commercialReferenceJson,
      currency
    );

  const refundSummary =
    mapPaymentRefundSummary(
      record.refundSummaryJson,
      currency
    );

  const metadata =
    mapPaymentMetadata(
      record.metadataJson
    );

  const payment:
    Payment = {
    paymentId:
      normalizeRequiredPaymentMapperString(
        record.id
      ),

    paymentNumber:
      normalizeRequiredPaymentMapperString(
        record.paymentNumber
      ),

    referenceId:
      normalizeRequiredPaymentMapperString(
        record.referenceId
      ),

    bookingId:
      normalizeRequiredPaymentMapperString(
        record.bookingId
      ),

    ...(normalizePaymentMapperString(
      record.bookingNumber
    )
      ? {
          bookingNumber:
            normalizePaymentMapperString(
              record.bookingNumber
            ),
        }
      : {}),

    ...(normalizePaymentMapperString(
      record.leadId
    )
      ? {
          leadId:
            normalizePaymentMapperString(
              record.leadId
            ),
        }
      : {}),

    ...(normalizePaymentMapperString(
      record.customerId
    )
      ? {
          customerId:
            normalizePaymentMapperString(
              record.customerId
            ),
        }
      : {}),

    ...(normalizePaymentMapperString(
      record.vendorId
    )
      ? {
          vendorId:
            normalizePaymentMapperString(
              record.vendorId
            ),
        }
      : {}),

    ...(normalizePaymentMapperString(
      record.quotationId
    )
      ? {
          quotationId:
            normalizePaymentMapperString(
              record.quotationId
            ),
        }
      : {}),

    status:
      mapPaymentStatus(
        record.status
      ),

    payable,

    ...(commercialReference
      ? {
          commercialReference,
        }
      : {}),

    transactions,

    ...(refundSummary
      ? {
          refundSummary,
        }
      : {}),

    ...(normalizePaymentMapperString(
      record.latestSuccessfulTransactionId
    )
      ? {
          latestSuccessfulTransactionId:
            normalizePaymentMapperString(
              record.latestSuccessfulTransactionId
            ),
        }
      : {}),

    ...(normalizePaymentMapperString(
      record.remarks
    )
      ? {
          remarks:
            normalizePaymentMapperString(
              record.remarks
            ),
        }
      : {}),

    ...(normalizePaymentMapperString(
      record.internalRemarks
    )
      ? {
          internalRemarks:
            normalizePaymentMapperString(
              record.internalRemarks
            ),
        }
      : {}),

    ...(metadata
      ? {
          metadata,
        }
      : {}),

    audit,
  };

  return payment;
}

/* ============================================================================
 * Payment -> summary
 * ============================================================================
 */

export function mapPaymentToSummary(
  payment:
    Payment
): PaymentSummary {
  return {
    paymentId:
      payment.paymentId,

    paymentNumber:
      payment.paymentNumber,

    bookingId:
      payment.bookingId,

    status:
      payment.status,

    totalAmount:
      mapPaymentAmountToPrisma(
        payment.payable
          .totalAmount
      ),

    paidAmount:
      mapPaymentAmountToPrisma(
        payment.payable
          .paidAmount
      ),

    balanceAmount:
      mapPaymentAmountToPrisma(
        payment.payable
          .balanceAmount
      ),

    paymentPending:
      mapPaymentAmountToPrisma(
        payment.payable
          .paymentPending
      ),

    refundedAmount:
      mapPaymentAmountToPrisma(
        payment.refundSummary
          ?.totalRefundedAmount ??
        0
      ),

    currency:
      payment.payable
        .currency,

    ...(payment
      .latestSuccessfulTransactionId
      ? {
          latestSuccessfulTransactionId:
            payment
              .latestSuccessfulTransactionId,
        }
      : {}),

    updatedAt:
      payment.audit
        .updatedAt,
  };
}

/* ============================================================================
 * Persistence record -> summary
 * ============================================================================
 */

export function mapPaymentRecordToSummary(
  record:
    PaymentPersistenceRecord
): PaymentSummary {
  return mapPaymentToSummary(
    mapPaymentFromPersistence(
      record
    )
  );
}

/* ============================================================================
 * Payment transaction -> generic persistence record
 * ============================================================================
 */

export interface PaymentTransactionPersistenceRecord {
  id:
    string;

  paymentId:
    string;

  transactionType:
    string;

  purpose:
    string | null;

  amount:
    number;

  currency:
    string;

  status:
    string;

  method:
    string | null;

  provider:
    string;

  gatewayJson:
    | Prisma.InputJsonValue
    | Prisma.JsonNullValueInput;

  failureJson:
    | Prisma.InputJsonValue
    | Prisma.JsonNullValueInput;

  initiatedAt:
    Date;

  authorizedAt:
    Date | null;

  capturedAt:
    Date | null;

  completedAt:
    Date | null;

  failedAt:
    Date | null;

  remarks:
    string | null;

  recordedByJson:
    | Prisma.InputJsonValue
    | Prisma.JsonNullValueInput;
}

/**
 * Converts one domain transaction into a future table-compatible
 * persistence record.
 *
 * Even if transactions initially remain JSON within Payment, this mapper
 * lets us later normalize PaymentTransaction into its own Prisma table
 * without changing the domain.
 */
export function mapPaymentTransactionToPersistenceRecord(
  transaction:
    PaymentTransaction
): PaymentTransactionPersistenceRecord {
  return {
    id:
      normalizeRequiredPaymentMapperString(
        transaction.transactionId
      ),

    paymentId:
      normalizeRequiredPaymentMapperString(
        transaction.paymentId
      ),

    transactionType:
      mapPaymentTransactionType(
        transaction.transactionType
      ),

    purpose:
      transaction.purpose ??
      null,

    amount:
      mapPaymentAmountToPrisma(
        transaction.amount
          .amount
      ),

    currency:
      mapPaymentCurrency(
        transaction.amount
          .currency
      ),

    status:
      mapPaymentTransactionStatus(
        transaction.status
      ),

    method:
      transaction.method ??
      null,

    provider:
      mapPaymentProvider(
        transaction.provider
      ),

    gatewayJson:
      transaction.gateway
        ? mapPaymentJsonToPrisma(
            transaction.gateway
          )
        : Prisma.JsonNull,

    failureJson:
      transaction.failure
        ? mapPaymentJsonToPrisma(
            transaction.failure
          )
        : Prisma.JsonNull,

    initiatedAt:
      mapRequiredPaymentDateToPrisma(
        transaction.initiatedAt
      ),

    authorizedAt:
      transaction.authorizedAt
        ? mapPaymentDateToPrisma(
            transaction.authorizedAt
          ) ??
          null
        : null,

    capturedAt:
      transaction.capturedAt
        ? mapPaymentDateToPrisma(
            transaction.capturedAt
          ) ??
          null
        : null,

    completedAt:
      transaction.completedAt
        ? mapPaymentDateToPrisma(
            transaction.completedAt
          ) ??
          null
        : null,

    failedAt:
      transaction.failedAt
        ? mapPaymentDateToPrisma(
            transaction.failedAt
          ) ??
          null
        : null,

    remarks:
      normalizePaymentMapperString(
        transaction.remarks
      ) ??
      null,

    recordedByJson:
      transaction.recordedBy
        ? mapPaymentJsonToPrisma(
            transaction.recordedBy
          )
        : Prisma.JsonNull,
  };
}

/* ============================================================================
 * Generic persistence transaction -> domain
 * ============================================================================
 */

export function mapPaymentTransactionFromPersistenceRecord(
  record:
    PaymentTransactionPersistenceRecord
): PaymentTransaction {
  const gateway =
    mapPaymentGatewayReference(
      record.gatewayJson
    );

  const failure =
    mapPaymentFailure(
      record.failureJson
    );

  const recordedBy =
    mapPaymentActor(
      record.recordedByJson
    );

  const purpose =
    mapPaymentPurpose(
      record.purpose
    );

  const method =
    mapPaymentMethod(
      record.method
    );

  const authorizedAt =
    mapPaymentDateFromPrisma(
      record.authorizedAt
    );

  const capturedAt =
    mapPaymentDateFromPrisma(
      record.capturedAt
    );

  const completedAt =
    mapPaymentDateFromPrisma(
      record.completedAt
    );

  const failedAt =
    mapPaymentDateFromPrisma(
      record.failedAt
    );

  return {
    transactionId:
      normalizeRequiredPaymentMapperString(
        record.id
      ),

    paymentId:
      normalizeRequiredPaymentMapperString(
        record.paymentId
      ),

    transactionType:
      mapPaymentTransactionType(
        record.transactionType
      ),

    ...(purpose
      ? {
          purpose,
        }
      : {}),

    amount: {
      amount:
        mapPaymentAmountFromPrisma(
          record.amount
        ),

      currency:
        mapPaymentCurrency(
          record.currency
        ),
    },

    status:
      mapPaymentTransactionStatus(
        record.status
      ),

    ...(method
      ? {
          method,
        }
      : {}),

    provider:
      mapPaymentProvider(
        record.provider
      ),

    ...(gateway
      ? {
          gateway,
        }
      : {}),

    ...(failure
      ? {
          failure,
        }
      : {}),

    initiatedAt:
      mapPaymentDateFromPrisma(
        record.initiatedAt
      ) ??
      new Date()
        .toISOString(),

    ...(authorizedAt
      ? {
          authorizedAt,
        }
      : {}),

    ...(capturedAt
      ? {
          capturedAt,
        }
      : {}),

    ...(completedAt
      ? {
          completedAt,
        }
      : {}),

    ...(failedAt
      ? {
          failedAt,
        }
      : {}),

    ...(normalizePaymentMapperString(
      record.remarks
    )
      ? {
          remarks:
            normalizePaymentMapperString(
              record.remarks
            ),
        }
      : {}),

    ...(recordedBy
      ? {
          recordedBy,
        }
      : {}),
  };
}

/* ============================================================================
 * Payment aggregate clone helper
 * ============================================================================
 */

/**
 * Creates a detached Payment-domain copy suitable for service operations.
 */
export function cloneMappedPayment(
  payment:
    Payment
): Payment {
  return structuredClone(
    payment
  );
}

/* ============================================================================
 * Payment collection mapping
 * ============================================================================
 */

export function mapPaymentRecordsToDomain(
  records:
    PaymentPersistenceRecord[]
): Payment[] {
  return records.map(
    (
      record
    ) =>
      mapPaymentFromPersistence(
        record
      )
  );
}

export function mapPaymentRecordsToSummaries(
  records:
    PaymentPersistenceRecord[]
): PaymentSummary[] {
  return records.map(
    (
      record
    ) =>
      mapPaymentRecordToSummary(
        record
      )
  );
}

/* ============================================================================
 * End of Payment Mapper - Part B
 * ============================================================================
 */
/* ============================================================================
 * Payment persistence query contracts
 * ============================================================================
 */

import {
  PaymentSortDirection,
  PaymentSortField,
} from "../models/payment.model";

import type {
  PaymentListResult,
  PaymentPagination,
  PaymentSearchCriteria,
  PaymentTransactionListResult,
  PaymentTransactionSearchCriteria,
} from "../models/payment.model";

/**
 * Generic persistence filter operators.
 *
 * The future Prisma repository can translate these directly into
 * Prisma.PaymentWhereInput / Prisma.PaymentTransactionWhereInput.
 */
export interface PaymentPersistenceNumberRange {
  gte?:
    number;

  lte?:
    number;
}

export interface PaymentPersistenceDateRange {
  gte?:
    Date;

  lte?:
    Date;
}

/* ============================================================================
 * Payment persistence filter
 * ============================================================================
 */

export interface PaymentPersistenceFilter {
  paymentId?:
    string;

  paymentNumber?:
    string;

  referenceId?:
    string;

  bookingId?:
    string;

  quotationId?:
    string;

  leadId?:
    string;

  customerId?:
    string;

  vendorId?:
    string;

  status?:
    PaymentStatus;

  statuses?:
    PaymentStatus[];

  currency?:
    PaymentCurrency;

  totalAmount?:
    PaymentPersistenceNumberRange;

  paidAmount?:
    PaymentPersistenceNumberRange;

  createdAt?:
    PaymentPersistenceDateRange;

  updatedAt?:
    PaymentPersistenceDateRange;

  hasOutstandingBalance?:
    boolean;

  hasRefund?:
    boolean;

  provider?:
    PaymentProvider;

  transactionStatus?:
    PaymentTransactionStatus;

  source?:
    PaymentSource;
}

/* ============================================================================
 * Transaction persistence filter
 * ============================================================================
 */

export interface PaymentTransactionPersistenceFilter {
  paymentId?:
    string;

  transactionId?:
    string;

  transactionType?:
    PaymentTransactionType;

  purpose?:
    PaymentPurpose;

  status?:
    PaymentTransactionStatus;

  provider?:
    PaymentProvider;

  method?:
    PaymentMethod;

  gatewayOrderId?:
    string;

  gatewayPaymentId?:
    string;

  amount?:
    PaymentPersistenceNumberRange;

  initiatedAt?:
    PaymentPersistenceDateRange;
}

/* ============================================================================
 * Persistence sorting
 * ============================================================================
 */

export interface PaymentPersistenceSort {
  field:
    | "createdAt"
    | "updatedAt"
    | "totalAmount"
    | "paidAmount"
    | "balanceAmount"
    | "status";

  direction:
    "asc" | "desc";
}

/* ============================================================================
 * Persistence pagination
 * ============================================================================
 */

export interface PaymentPersistencePagination {
  page:
    number;

  pageSize:
    number;

  skip:
    number;

  take:
    number;
}

/* ============================================================================
 * Payment query mapping
 * ============================================================================
 */

export function mapPaymentSearchCriteriaToPersistenceFilter(
  criteria:
    PaymentSearchCriteria
): PaymentPersistenceFilter {
  const filter:
    PaymentPersistenceFilter = {};

  const paymentId =
    normalizePaymentMapperString(
      criteria.paymentId
    );

  if (
    paymentId
  ) {
    filter.paymentId =
      paymentId;
  }

  const paymentNumber =
    normalizePaymentMapperString(
      criteria.paymentNumber
    );

  if (
    paymentNumber
  ) {
    filter.paymentNumber =
      paymentNumber;
  }

  const referenceId =
    normalizePaymentMapperString(
      criteria.referenceId
    );

  if (
    referenceId
  ) {
    filter.referenceId =
      referenceId;
  }

  const bookingId =
    normalizePaymentMapperString(
      criteria.bookingId
    );

  if (
    bookingId
  ) {
    filter.bookingId =
      bookingId;
  }

  const quotationId =
    normalizePaymentMapperString(
      criteria.quotationId
    );

  if (
    quotationId
  ) {
    filter.quotationId =
      quotationId;
  }

  const leadId =
    normalizePaymentMapperString(
      criteria.leadId
    );

  if (
    leadId
  ) {
    filter.leadId =
      leadId;
  }

  const customerId =
    normalizePaymentMapperString(
      criteria.customerId
    );

  if (
    customerId
  ) {
    filter.customerId =
      customerId;
  }

  const vendorId =
    normalizePaymentMapperString(
      criteria.vendorId
    );

  if (
    vendorId
  ) {
    filter.vendorId =
      vendorId;
  }

  if (
    criteria.status
  ) {
    filter.status =
      mapPaymentStatus(
        criteria.status
      );
  }

  if (
    criteria.statuses &&
    criteria.statuses.length >
      0
  ) {
    filter.statuses =
      criteria.statuses.map(
        (
          status
        ) =>
          mapPaymentStatus(
            status
          )
      );
  }

  if (
    criteria.currency
  ) {
    filter.currency =
      mapPaymentCurrency(
        criteria.currency
      );
  }

  const totalAmountRange =
    mapPaymentNumberRange(
      criteria.minimumAmount,
      criteria.maximumAmount
    );

  if (
    totalAmountRange
  ) {
    filter.totalAmount =
      totalAmountRange;
  }

  const paidAmountRange =
    mapPaymentNumberRange(
      criteria.minimumPaidAmount,
      criteria.maximumPaidAmount
    );

  if (
    paidAmountRange
  ) {
    filter.paidAmount =
      paidAmountRange;
  }

  const createdAtRange =
    mapPaymentDateRange(
      criteria.createdFrom,
      criteria.createdUntil
    );

  if (
    createdAtRange
  ) {
    filter.createdAt =
      createdAtRange;
  }

  const updatedAtRange =
    mapPaymentDateRange(
      criteria.updatedFrom,
      criteria.updatedUntil
    );

  if (
    updatedAtRange
  ) {
    filter.updatedAt =
      updatedAtRange;
  }

  if (
    criteria.hasOutstandingBalance !==
      undefined
  ) {
    filter.hasOutstandingBalance =
      criteria.hasOutstandingBalance;
  }

  if (
    criteria.hasRefund !==
      undefined
  ) {
    filter.hasRefund =
      criteria.hasRefund;
  }

  if (
    criteria.provider
  ) {
    filter.provider =
      mapPaymentProvider(
        criteria.provider
      );
  }

  if (
    criteria.transactionStatus
  ) {
    filter.transactionStatus =
      mapPaymentTransactionStatus(
        criteria.transactionStatus
      );
  }

  if (
    criteria.source
  ) {
    filter.source =
      mapPaymentSource(
        criteria.source
      );
  }

  return filter;
}

/* ============================================================================
 * Transaction query mapping
 * ============================================================================
 */

export function mapPaymentTransactionSearchCriteriaToPersistenceFilter(
  criteria:
    PaymentTransactionSearchCriteria
): PaymentTransactionPersistenceFilter {
  const filter:
    PaymentTransactionPersistenceFilter = {};

  const paymentId =
    normalizePaymentMapperString(
      criteria.paymentId
    );

  if (
    paymentId
  ) {
    filter.paymentId =
      paymentId;
  }

  const transactionId =
    normalizePaymentMapperString(
      criteria.transactionId
    );

  if (
    transactionId
  ) {
    filter.transactionId =
      transactionId;
  }

  if (
    criteria.transactionType
  ) {
    filter.transactionType =
      mapPaymentTransactionType(
        criteria.transactionType
      );
  }

  if (
    criteria.purpose
  ) {
    const purpose =
      mapPaymentPurpose(
        criteria.purpose
      );

    if (
      purpose
    ) {
      filter.purpose =
        purpose;
    }
  }

  if (
    criteria.status
  ) {
    filter.status =
      mapPaymentTransactionStatus(
        criteria.status
      );
  }

  if (
    criteria.provider
  ) {
    filter.provider =
      mapPaymentProvider(
        criteria.provider
      );
  }

  if (
    criteria.method
  ) {
    const method =
      mapPaymentMethod(
        criteria.method
      );

    if (
      method
    ) {
      filter.method =
        method;
    }
  }

  const gatewayOrderId =
    normalizePaymentMapperString(
      criteria.gatewayOrderId
    );

  if (
    gatewayOrderId
  ) {
    filter.gatewayOrderId =
      gatewayOrderId;
  }

  const gatewayPaymentId =
    normalizePaymentMapperString(
      criteria.gatewayPaymentId
    );

  if (
    gatewayPaymentId
  ) {
    filter.gatewayPaymentId =
      gatewayPaymentId;
  }

  const amountRange =
    mapPaymentNumberRange(
      criteria.minimumAmount,
      criteria.maximumAmount
    );

  if (
    amountRange
  ) {
    filter.amount =
      amountRange;
  }

  const initiatedAtRange =
    mapPaymentDateRange(
      criteria.initiatedFrom,
      criteria.initiatedUntil
    );

  if (
    initiatedAtRange
  ) {
    filter.initiatedAt =
      initiatedAtRange;
  }

  return filter;
}

/* ============================================================================
 * Number range mapping
 * ============================================================================
 */

export function mapPaymentNumberRange(
  minimumValue:
    number | undefined,
  maximumValue:
    number | undefined
): PaymentPersistenceNumberRange | undefined {
  const range:
    PaymentPersistenceNumberRange = {};

  if (
    typeof minimumValue ===
      "number" &&
    Number.isFinite(
      minimumValue
    )
  ) {
    range.gte =
      mapPaymentAmountToPrisma(
        minimumValue
      );
  }

  if (
    typeof maximumValue ===
      "number" &&
    Number.isFinite(
      maximumValue
    )
  ) {
    range.lte =
      mapPaymentAmountToPrisma(
        maximumValue
      );
  }

  return Object.keys(
    range
  ).length >
    0
    ? range
    : undefined;
}

/* ============================================================================
 * Date range mapping
 * ============================================================================
 */

export function mapPaymentDateRange(
  from:
    string | undefined,
  until:
    string | undefined
): PaymentPersistenceDateRange | undefined {
  const range:
    PaymentPersistenceDateRange = {};

  const fromDate =
    mapPaymentDateToPrisma(
      from
    );

  if (
    fromDate
  ) {
    range.gte =
      fromDate;
  }

  const untilDate =
    mapPaymentDateToPrisma(
      until
    );

  if (
    untilDate
  ) {
    range.lte =
      untilDate;
  }

  return Object.keys(
    range
  ).length >
    0
    ? range
    : undefined;
}

/* ============================================================================
 * Sort mapping
 * ============================================================================
 */

export function mapPaymentSortToPersistence(
  sortField:
    PaymentSortField | undefined,
  sortDirection:
    PaymentSortDirection | undefined
): PaymentPersistenceSort {
  const direction:
    "asc" | "desc" =
      sortDirection ===
        PaymentSortDirection.ASC
        ? "asc"
        : "desc";

  switch (
    sortField
  ) {
    case PaymentSortField.UPDATED_AT:
      return {
        field:
          "updatedAt",

        direction,
      };

    case PaymentSortField.TOTAL_AMOUNT:
      return {
        field:
          "totalAmount",

        direction,
      };

    case PaymentSortField.PAID_AMOUNT:
      return {
        field:
          "paidAmount",

        direction,
      };

    case PaymentSortField.BALANCE_AMOUNT:
      return {
        field:
          "balanceAmount",

        direction,
      };

    case PaymentSortField.STATUS:
      return {
        field:
          "status",

        direction,
      };

    case PaymentSortField.CREATED_AT:
    default:
      return {
        field:
          "createdAt",

        direction,
      };
  }
}

/* ============================================================================
 * Pagination mapping
 * ============================================================================
 */

export const DEFAULT_PAYMENT_PAGE =
  1;

export const DEFAULT_PAYMENT_PAGE_SIZE =
  20;

export const MAX_PAYMENT_PAGE_SIZE =
  100;

export function mapPaymentPagination(
  page:
    number | undefined,
  pageSize:
    number | undefined
): PaymentPersistencePagination {
  const normalizedPage =
    Number.isInteger(
      page
    ) &&
    (
      page ??
      0
    ) >
      0
      ? page as number
      : DEFAULT_PAYMENT_PAGE;

  const normalizedPageSize =
    Number.isInteger(
      pageSize
    ) &&
    (
      pageSize ??
      0
    ) >
      0
      ? Math.min(
          pageSize as number,
          MAX_PAYMENT_PAGE_SIZE
        )
      : DEFAULT_PAYMENT_PAGE_SIZE;

  return {
    page:
      normalizedPage,

    pageSize:
      normalizedPageSize,

    skip:
      (
        normalizedPage -
        1
      ) *
      normalizedPageSize,

    take:
      normalizedPageSize,
  };
}

/* ============================================================================
 * Pagination result mapping
 * ============================================================================
 */

export function createPaymentPagination(
  page:
    number,
  pageSize:
    number,
  totalItems:
    number
): PaymentPagination {
  const safePage =
    page >
      0
      ? page
      : DEFAULT_PAYMENT_PAGE;

  const safePageSize =
    pageSize >
      0
      ? pageSize
      : DEFAULT_PAYMENT_PAGE_SIZE;

  const safeTotalItems =
    totalItems >=
      0
      ? totalItems
      : 0;

  const totalPages =
    safeTotalItems ===
      0
      ? 0
      : Math.ceil(
          safeTotalItems /
            safePageSize
        );

  return {
    page:
      safePage,

    pageSize:
      safePageSize,

    totalItems:
      safeTotalItems,

    totalPages,

    hasNextPage:
      totalPages >
        0 &&
      safePage <
        totalPages,

    hasPreviousPage:
      safePage >
        1,
  };
}

/* ============================================================================
 * Payment list result mapping
 * ============================================================================
 */

export function createPaymentListResult(
  payments:
    Payment[],
  page:
    number,
  pageSize:
    number,
  totalItems:
    number
): PaymentListResult {
  return {
    items:
      payments.map(
        (
          payment
        ) =>
          mapPaymentToSummary(
            payment
          )
      ),

    pagination:
      createPaymentPagination(
        page,
        pageSize,
        totalItems
      ),
  };
}

/* ============================================================================
 * Payment record list result mapping
 * ============================================================================
 */

export function createPaymentRecordListResult(
  records:
    PaymentPersistenceRecord[],
  page:
    number,
  pageSize:
    number,
  totalItems:
    number
): PaymentListResult {
  return {
    items:
      mapPaymentRecordsToSummaries(
        records
      ),

    pagination:
      createPaymentPagination(
        page,
        pageSize,
        totalItems
      ),
  };
}

/* ============================================================================
 * Payment transaction list result mapping
 * ============================================================================
 */

export function createPaymentTransactionListResult(
  transactions:
    PaymentTransaction[],
  page:
    number,
  pageSize:
    number,
  totalItems:
    number
): PaymentTransactionListResult {
  return {
    items:
      transactions,

    pagination:
      createPaymentPagination(
        page,
        pageSize,
        totalItems
      ),
  };
}

/* ============================================================================
 * Payment transaction record list mapping
 * ============================================================================
 */

export function createPaymentTransactionRecordListResult(
  records:
    PaymentTransactionPersistenceRecord[],
  page:
    number,
  pageSize:
    number,
  totalItems:
    number
): PaymentTransactionListResult {
  return {
    items:
      records.map(
        (
          record
        ) =>
          mapPaymentTransactionFromPersistenceRecord(
            record
          )
      ),

    pagination:
      createPaymentPagination(
        page,
        pageSize,
        totalItems
      ),
  };
}

/* ============================================================================
 * Payment query bundle
 * ============================================================================
 */

/**
 * Complete normalized persistence query produced from PaymentSearchCriteria.
 */
export interface PaymentPersistenceListQuery {
  filter:
    PaymentPersistenceFilter;

  sort:
    PaymentPersistenceSort;

  pagination:
    PaymentPersistencePagination;
}

export function mapPaymentSearchCriteriaToPersistenceQuery(
  criteria:
    PaymentSearchCriteria
): PaymentPersistenceListQuery {
  return {
    filter:
      mapPaymentSearchCriteriaToPersistenceFilter(
        criteria
      ),

    sort:
      mapPaymentSortToPersistence(
        criteria.sortBy,
        criteria.sortDirection
      ),

    pagination:
      mapPaymentPagination(
        criteria.page,
        criteria.pageSize
      ),
  };
}

/* ============================================================================
 * Payment transaction query bundle
 * ============================================================================
 */

export interface PaymentTransactionPersistenceListQuery {
  filter:
    PaymentTransactionPersistenceFilter;

  pagination:
    PaymentPersistencePagination;
}

export function mapPaymentTransactionSearchCriteriaToPersistenceQuery(
  criteria:
    PaymentTransactionSearchCriteria
): PaymentTransactionPersistenceListQuery {
  return {
    filter:
      mapPaymentTransactionSearchCriteriaToPersistenceFilter(
        criteria
      ),

    pagination:
      mapPaymentPagination(
        criteria.page,
        criteria.pageSize
      ),
  };
}

/* ============================================================================
 * End of Payment Mapper - Part C
 * ============================================================================
 */
/* ============================================================================
 * Payment statistics mapping
 * ============================================================================
 */

import type {
  GatewayPaymentOrder,
  PaymentReconciliationObserved,
  PaymentReconciliationResult,
  PaymentStatistics,
  PaymentTransactionStatistics,
  PaymentVerificationResult,
  PaymentWebhookEvent,
  PaymentWebhookProcessingResult,
} from "../models/payment.model";

/**
 * Aggregates Payment statistics from domain Payments.
 *
 * Repository implementations may later replace this with database-level
 * aggregation for efficiency.
 */
export function mapPaymentsToStatistics(
  payments:
    Payment[],
  currency =
    PaymentCurrency.INR
): PaymentStatistics {
  let pendingPayments =
    0;

  let partiallyPaidPayments =
    0;

  let paidPayments =
    0;

  let failedPayments =
    0;

  let cancelledPayments =
    0;

  let refundPendingPayments =
    0;

  let partiallyRefundedPayments =
    0;

  let refundedPayments =
    0;

  let totalPayableAmount =
    0;

  let totalCollectedAmount =
    0;

  let totalOutstandingAmount =
    0;

  let totalRefundedAmount =
    0;

  for (
    const payment
    of payments
  ) {
    switch (
      payment.status
    ) {
      case PaymentStatus.PENDING:
        pendingPayments +=
          1;
        break;

      case PaymentStatus.PARTIALLY_PAID:
        partiallyPaidPayments +=
          1;
        break;

      case PaymentStatus.PAID:
        paidPayments +=
          1;
        break;

      case PaymentStatus.FAILED:
        failedPayments +=
          1;
        break;

      case PaymentStatus.CANCELLED:
        cancelledPayments +=
          1;
        break;

      case PaymentStatus.REFUND_PENDING:
        refundPendingPayments +=
          1;
        break;

      case PaymentStatus.PARTIALLY_REFUNDED:
        partiallyRefundedPayments +=
          1;
        break;

      case PaymentStatus.REFUNDED:
        refundedPayments +=
          1;
        break;
    }

    totalPayableAmount +=
      payment.payable
        .totalAmount;

    totalCollectedAmount +=
      payment.payable
        .paidAmount;

    totalOutstandingAmount +=
      payment.payable
        .balanceAmount;

    totalRefundedAmount +=
      payment.refundSummary
        ?.totalRefundedAmount ??
      0;
  }

  return {
    totalPayments:
      payments.length,

    pendingPayments,

    partiallyPaidPayments,

    paidPayments,

    failedPayments,

    cancelledPayments,

    refundPendingPayments,

    partiallyRefundedPayments,

    refundedPayments,

    totalPayableAmount:
      mapPaymentAmountToPrisma(
        totalPayableAmount
      ),

    totalCollectedAmount:
      mapPaymentAmountToPrisma(
        totalCollectedAmount
      ),

    totalOutstandingAmount:
      mapPaymentAmountToPrisma(
        totalOutstandingAmount
      ),

    totalRefundedAmount:
      mapPaymentAmountToPrisma(
        totalRefundedAmount
      ),

    currency,
  };
}

/* ============================================================================
 * Transaction statistics mapping
 * ============================================================================
 */

export function mapPaymentTransactionsToStatistics(
  transactions:
    PaymentTransaction[],
  currency =
    PaymentCurrency.INR
): PaymentTransactionStatistics {
  let successfulTransactions =
    0;

  let failedTransactions =
    0;

  let pendingTransactions =
    0;

  let refundTransactions =
    0;

  let totalCollectionAmount =
    0;

  let totalRefundAmount =
    0;

  for (
    const transaction
    of transactions
  ) {
    if (
      transaction.status ===
        PaymentTransactionStatus.SUCCESS ||
      transaction.status ===
        PaymentTransactionStatus.CAPTURED
    ) {
      successfulTransactions +=
        1;
    }

    if (
      transaction.status ===
        PaymentTransactionStatus.FAILED
    ) {
      failedTransactions +=
        1;
    }

    if (
      transaction.status ===
        PaymentTransactionStatus.PENDING ||
      transaction.status ===
        PaymentTransactionStatus.INITIATED ||
      transaction.status ===
        PaymentTransactionStatus.AUTHORIZED
    ) {
      pendingTransactions +=
        1;
    }

    if (
      transaction.transactionType ===
        PaymentTransactionType.REFUND
    ) {
      refundTransactions +=
        1;
    }

    if (
      transaction.transactionType ===
        PaymentTransactionType.COLLECTION &&
      (
        transaction.status ===
          PaymentTransactionStatus.SUCCESS ||
        transaction.status ===
          PaymentTransactionStatus.CAPTURED
      )
    ) {
      totalCollectionAmount +=
        transaction.amount
          .amount;
    }

    if (
      transaction.transactionType ===
        PaymentTransactionType.REFUND &&
      transaction.status ===
        PaymentTransactionStatus.REFUNDED
    ) {
      totalRefundAmount +=
        transaction.amount
          .amount;
    }
  }

  return {
    totalTransactions:
      transactions.length,

    successfulTransactions,

    failedTransactions,

    pendingTransactions,

    refundTransactions,

    totalCollectionAmount:
      mapPaymentAmountToPrisma(
        totalCollectionAmount
      ),

    totalRefundAmount:
      mapPaymentAmountToPrisma(
        totalRefundAmount
      ),

    currency,
  };
}

/* ============================================================================
 * Reconciliation mapping
 * ============================================================================
 */

export function mapPaymentToReconciliationExpected(
  payment:
    Payment
) {
  return {
    paymentId:
      payment.paymentId,

    totalAmount:
      mapPaymentAmountToPrisma(
        payment.payable
          .totalAmount
      ),

    paidAmount:
      mapPaymentAmountToPrisma(
        payment.payable
          .paidAmount
      ),

    refundedAmount:
      mapPaymentAmountToPrisma(
        payment.refundSummary
          ?.totalRefundedAmount ??
        0
      ),

    balanceAmount:
      mapPaymentAmountToPrisma(
        payment.payable
          .balanceAmount
      ),

    currency:
      payment.payable
        .currency,
  };
}

export function mapPaymentReconciliationResult(
  payment:
    Payment,
  observed:
    PaymentReconciliationObserved,
  reconciledAt =
    new Date()
      .toISOString(),
  reconciledBy?:
    string
): PaymentReconciliationResult {
  const expected =
    mapPaymentToReconciliationExpected(
      payment
    );

  const differences:
    PaymentReconciliationResult["differences"] =
      [];

  const collectionDifference =
    mapPaymentAmountToPrisma(
      observed.collectedAmount -
        expected.paidAmount
    );

  if (
    collectionDifference !==
      0
  ) {
    differences.push({
      field:
        "collectedAmount",

      expected:
        expected.paidAmount,

      observed:
        mapPaymentAmountToPrisma(
          observed.collectedAmount
        ),

      difference:
        collectionDifference,
    });
  }

  const refundDifference =
    mapPaymentAmountToPrisma(
      observed.refundedAmount -
        expected.refundedAmount
    );

  if (
    refundDifference !==
      0
  ) {
    differences.push({
      field:
        "refundedAmount",

      expected:
        expected.refundedAmount,

      observed:
        mapPaymentAmountToPrisma(
          observed.refundedAmount
        ),

      difference:
        refundDifference,
    });
  }

  if (
    observed.currency !==
      expected.currency
  ) {
    differences.push({
      field:
        "currency",

      expected:
        0,

      observed:
        0,

      difference:
        0,
    });
  }

  return {
    paymentId:
      payment.paymentId,

    reconciled:
      differences.length ===
        0,

    expected,

    observed: {
      ...observed,

      collectedAmount:
        mapPaymentAmountToPrisma(
          observed.collectedAmount
        ),

      refundedAmount:
        mapPaymentAmountToPrisma(
          observed.refundedAmount
        ),
    },

    differences,

    reconciledAt,

    ...(normalizePaymentMapperString(
      reconciledBy
    )
      ? {
          reconciledBy:
            normalizePaymentMapperString(
              reconciledBy
            ),
        }
      : {}),
  };
}

/* ============================================================================
 * Gateway order mapping
 * ============================================================================
 */

export interface PaymentGatewayOrderRecord {
  provider:
    unknown;

  gatewayOrderId:
    unknown;

  amount:
    unknown;

  currency:
    unknown;

  status?:
    unknown;

  receiptReference?:
    unknown;

  createdAt?:
    unknown;
}

export function mapGatewayPaymentOrderFromRecord(
  record:
    PaymentGatewayOrderRecord
): GatewayPaymentOrder {
  const gatewayOrderId =
    normalizeRequiredPaymentMapperString(
      record.gatewayOrderId
    );

  const status =
    normalizePaymentMapperString(
      record.status
    );

  const receiptReference =
    normalizePaymentMapperString(
      record.receiptReference
    );

  const createdAt =
    mapPaymentDateFromPrisma(
      record.createdAt
    );

  return {
    provider:
      mapPaymentProvider(
        record.provider
      ),

    gatewayOrderId,

    amount:
      mapPaymentAmountFromPrisma(
        record.amount
      ),

    currency:
      mapPaymentCurrency(
        record.currency
      ),

    ...(status
      ? {
          status,
        }
      : {}),

    ...(receiptReference
      ? {
          receiptReference,
        }
      : {}),

    ...(createdAt
      ? {
          createdAt,
        }
      : {}),
  };
}

/* ============================================================================
 * Verification result mapping
 * ============================================================================
 */

export interface PaymentVerificationRecord {
  verified:
    boolean;

  provider:
    unknown;

  gatewayOrderId:
    unknown;

  gatewayPaymentId:
    unknown;

  transactionStatus?:
    unknown;

  message?:
    unknown;
}

export function mapPaymentVerificationResultFromRecord(
  record:
    PaymentVerificationRecord
): PaymentVerificationResult {
  const transactionStatus =
    record.transactionStatus !==
      undefined
      ? mapPaymentTransactionStatus(
          record.transactionStatus
        )
      : undefined;

  const message =
    normalizePaymentMapperString(
      record.message
    );

  return {
    verified:
      record.verified ===
        true,

    provider:
      mapPaymentProvider(
        record.provider
      ),

    gatewayOrderId:
      normalizeRequiredPaymentMapperString(
        record.gatewayOrderId
      ),

    gatewayPaymentId:
      normalizeRequiredPaymentMapperString(
        record.gatewayPaymentId
      ),

    ...(transactionStatus
      ? {
          transactionStatus,
        }
      : {}),

    ...(message
      ? {
          message,
        }
      : {}),
  };
}

/* ============================================================================
 * Webhook normalization
 * ============================================================================
 */

export interface PaymentWebhookRawRecord {
  provider:
    unknown;

  eventType:
    unknown;

  gatewayOrderId?:
    unknown;

  gatewayPaymentId?:
    unknown;

  gatewayReferenceId?:
    unknown;

  amount?:
    unknown;

  currency?:
    unknown;

  occurredAt?:
    unknown;

  receivedAt?:
    unknown;

  metadata?:
    unknown;
}

export function mapPaymentWebhookEventFromRecord(
  record:
    PaymentWebhookRawRecord
): PaymentWebhookEvent {
  const occurredAt =
    mapPaymentDateFromPrisma(
      record.occurredAt
    ) ??
    new Date()
      .toISOString();

  const receivedAt =
    mapPaymentDateFromPrisma(
      record.receivedAt
    ) ??
    new Date()
      .toISOString();

  const gatewayOrderId =
    normalizePaymentMapperString(
      record.gatewayOrderId
    );

  const gatewayPaymentId =
    normalizePaymentMapperString(
      record.gatewayPaymentId
    );

  const gatewayReferenceId =
    normalizePaymentMapperString(
      record.gatewayReferenceId
    );

  const metadata =
    mapPaymentMetadata(
      record.metadata
    );

  return {
    provider:
      mapPaymentProvider(
        record.provider
      ),

    eventType:
      mapPaymentWebhookEventType(
        record.eventType
      ),

    ...(gatewayOrderId
      ? {
          gatewayOrderId,
        }
      : {}),

    ...(gatewayPaymentId
      ? {
          gatewayPaymentId,
        }
      : {}),

    ...(gatewayReferenceId
      ? {
          gatewayReferenceId,
        }
      : {}),

    ...(record.amount !==
      undefined
      ? {
          amount:
            mapPaymentAmountFromPrisma(
              record.amount
            ),
        }
      : {}),

    ...(record.currency !==
      undefined
      ? {
          currency:
            mapPaymentCurrency(
              record.currency
            ),
        }
      : {}),

    occurredAt,

    receivedAt,

    ...(metadata
      ? {
          metadata,
        }
      : {}),
  };
}

/* ============================================================================
 * Webhook event type mapping
 * ============================================================================
 */

export function mapPaymentWebhookEventType(
  value:
    unknown
): PaymentWebhookEventType {
  switch (
    value
  ) {
    case PaymentWebhookEventType.ORDER_CREATED:
      return PaymentWebhookEventType.ORDER_CREATED;

    case PaymentWebhookEventType.PAYMENT_AUTHORIZED:
      return PaymentWebhookEventType.PAYMENT_AUTHORIZED;

    case PaymentWebhookEventType.PAYMENT_CAPTURED:
      return PaymentWebhookEventType.PAYMENT_CAPTURED;

    case PaymentWebhookEventType.PAYMENT_SUCCESS:
      return PaymentWebhookEventType.PAYMENT_SUCCESS;

    case PaymentWebhookEventType.PAYMENT_FAILED:
      return PaymentWebhookEventType.PAYMENT_FAILED;

    case PaymentWebhookEventType.PAYMENT_REFUNDED:
      return PaymentWebhookEventType.PAYMENT_REFUNDED;

    case PaymentWebhookEventType.REFUND_FAILED:
      return PaymentWebhookEventType.REFUND_FAILED;

    default:
      return PaymentWebhookEventType.UNKNOWN;
  }
}

/* ============================================================================
 * Webhook processing result mapping
 * ============================================================================
 */

export interface PaymentWebhookProcessingRecord {
  success:
    boolean;

  duplicate?:
    boolean;

  paymentId?:
    unknown;

  transactionId?:
    unknown;

  eventType?:
    unknown;

  message?:
    unknown;

  errorCode?:
    unknown;
}

export function mapPaymentWebhookProcessingResult(
  record:
    PaymentWebhookProcessingRecord
): PaymentWebhookProcessingResult {
  const paymentId =
    normalizePaymentMapperString(
      record.paymentId
    );

  const transactionId =
    normalizePaymentMapperString(
      record.transactionId
    );

  const message =
    normalizePaymentMapperString(
      record.message
    );

  const errorCode =
    normalizePaymentMapperString(
      record.errorCode
    );

  return {
    success:
      record.success ===
        true,

    duplicate:
      record.duplicate ===
        true,

    ...(paymentId
      ? {
          paymentId,
        }
      : {}),

    ...(transactionId
      ? {
          transactionId,
        }
      : {}),

    ...(record.eventType !==
      undefined
      ? {
          eventType:
            mapPaymentWebhookEventType(
              record.eventType
            ),
        }
      : {}),

    ...(message
      ? {
          message,
        }
      : {}),

    ...(errorCode
      ? {
          errorCode,
        }
      : {}),
  };
}

/* ============================================================================
 * Consolidated mapper facade
 * ============================================================================
 */

/**
 * Optional facade for callers that prefer grouped mapper access.
 *
 * Existing named functions remain exported and are the canonical
 * implementation.
 */
export const PaymentMapper = {
  money: {
    toPersistence:
      mapPaymentAmountToPrisma,

    fromPersistence:
      mapPaymentAmountFromPrisma,

    moneyToPersistence:
      mapPaymentMoneyToPersistence,
  },

  dates: {
    toPersistence:
      mapPaymentDateToPrisma,

    requiredToPersistence:
      mapRequiredPaymentDateToPrisma,

    fromPersistence:
      mapPaymentDateFromPrisma,
  },

  json: {
    toPersistence:
      mapPaymentJsonToPrisma,

    nullableToPersistence:
      mapNullablePaymentJsonToPrisma,

    objectFromPersistence:
      mapPaymentJsonObjectFromPrisma,

    arrayFromPersistence:
      mapPaymentJsonArrayFromPrisma,
  },

  transaction: {
    fromRecord:
      mapPaymentTransactionFromRecord,

    toPersistence:
      mapPaymentTransactionToPersistenceRecord,

    fromPersistence:
      mapPaymentTransactionFromPersistenceRecord,

    toJson:
      mapPaymentTransactionToPrismaJson,
  },

  payment: {
    toPersistence:
      mapPaymentToPersistence,

    fromPersistence:
      mapPaymentFromPersistence,

    toSummary:
      mapPaymentToSummary,

    clone:
      cloneMappedPayment,
  },

  query: {
    paymentFilter:
      mapPaymentSearchCriteriaToPersistenceFilter,

    paymentQuery:
      mapPaymentSearchCriteriaToPersistenceQuery,

    transactionFilter:
      mapPaymentTransactionSearchCriteriaToPersistenceFilter,

    transactionQuery:
      mapPaymentTransactionSearchCriteriaToPersistenceQuery,

    pagination:
      mapPaymentPagination,

    sort:
      mapPaymentSortToPersistence,
  },

  statistics: {
    payments:
      mapPaymentsToStatistics,

    transactions:
      mapPaymentTransactionsToStatistics,
  },

  reconciliation: {
    expected:
      mapPaymentToReconciliationExpected,

    result:
      mapPaymentReconciliationResult,
  },

  gateway: {
    orderFromRecord:
      mapGatewayPaymentOrderFromRecord,

    verificationFromRecord:
      mapPaymentVerificationResultFromRecord,
  },

  webhook: {
    eventFromRecord:
      mapPaymentWebhookEventFromRecord,

    processingResult:
      mapPaymentWebhookProcessingResult,
  },
} as const;

/* ============================================================================
 * End of Payment Mapper - Part D
 * ============================================================================
 */