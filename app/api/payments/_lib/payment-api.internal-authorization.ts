/**
 * ============================================================================
 * EasyMovers
 * Payment API Internal Authorization
 * ============================================================================
 *
 * Provides constant-time secret verification for protected Payment operational
 * endpoints.
 *
 * IMPORTANT:
 *
 * - Secrets are read only from server-side environment variables.
 * - Raw secrets are never returned or logged.
 * - SHA-256 digests provide equal-length buffers for timingSafeEqual().
 * - Missing configuration is distinguished from invalid authorization.
 * ============================================================================
 */

import {
  createHash,
  timingSafeEqual,
} from "node:crypto";

/* ============================================================================
 * Configuration
 * ============================================================================
 */

export const PAYMENT_SYNC_SECRET_ENVIRONMENT_VARIABLE =
  "PAYMENT_SYNC_RETRY_SECRET";

export const PAYMENT_SYNC_SECRET_HEADER =
  "x-payment-sync-retry-secret";

/* ============================================================================
 * Authorization result
 * ============================================================================
 */

export type PaymentApiInternalAuthorizationStatus =
  | "AUTHORIZED"
  | "NOT_CONFIGURED"
  | "UNAUTHORIZED";

export interface PaymentApiInternalAuthorizationResult {
  authorized:
    boolean;

  status:
    PaymentApiInternalAuthorizationStatus;
}

/* ============================================================================
 * Digest helper
 * ============================================================================
 */

function createSecretDigest(
  value:
    string
): Buffer {
  return createHash(
    "sha256"
  )
    .update(
      value,
      "utf8"
    )
    .digest();
}

/* ============================================================================
 * Constant-time comparison
 * ============================================================================
 */

function secretsMatch(
  suppliedSecret:
    string,
  configuredSecret:
    string
): boolean {
  return timingSafeEqual(
    createSecretDigest(
      suppliedSecret
    ),
    createSecretDigest(
      configuredSecret
    )
  );
}

/* ============================================================================
 * Authorize Payment synchronization operational request
 * ============================================================================
 */

export function authorizePaymentSyncRequest(
  request:
    Request
): PaymentApiInternalAuthorizationResult {
  const configuredSecret =
    process.env[
      PAYMENT_SYNC_SECRET_ENVIRONMENT_VARIABLE
    ]
      ?.trim();

  if (
    !configuredSecret
  ) {
    return {
      authorized:
        false,

      status:
        "NOT_CONFIGURED",
    };
  }

  const suppliedSecret =
    request.headers
      .get(
        PAYMENT_SYNC_SECRET_HEADER
      )
      ?.trim();

  if (
    !suppliedSecret ||
    !secretsMatch(
      suppliedSecret,
      configuredSecret
    )
  ) {
    return {
      authorized:
        false,

      status:
        "UNAUTHORIZED",
    };
  }

  return {
    authorized:
      true,

    status:
      "AUTHORIZED",
  };
}

/* ============================================================================
 * End of Payment API Internal Authorization
 * ============================================================================
 */