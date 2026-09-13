import { resolveApplicationAuthentication } from "@/lib/auth";
import { authorizeInternalQuotation } from "@/lib/quotation-access";

/**
 * ============================================================================
 * EasyMovers
 * Quotation Expiry Route
 * ============================================================================
 *
 * File:
 * app/api/quotations/expire/route.ts
 *
 * Endpoint:
 * POST /api/quotations/expire
 *
 * Architecture:
 *
 * Next.js Route
 *      ↓
 * QuotationController.expireDue()
 *      ↓
 * QuotationService.expireDue()
 *      ↓
 * QuotationRepository
 *
 * ============================================================================
 */

import {
  NextResponse,
} from "next/server";

import {
  randomUUID,
} from "crypto";

import {
  prisma,
} from "@/lib/prisma";

import {
  getOrCreateQuotationModule,
} from "@/domains/quotation/quotation.module";

import type {
  ExpireDueQuotationsServiceInput,
} from "@/domains/quotation/services/quotation.service";

/* ============================================================================
 * Runtime
 * ============================================================================
 */

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

/* ============================================================================
 * Request body
 * ============================================================================
 */

interface ExpireQuotationsRouteBody {
  expiredBy?:
    unknown;

  cutoff?:
    unknown;

  batchSize?:
    unknown;
}

/* ============================================================================
 * Request ID
 * ============================================================================
 */

function getQuotationExpiryRequestId(
  request:
    Request
): string {
  const existing =
    request.headers
      .get(
        "x-request-id"
      )
      ?.trim();

  return (
    existing ||
    randomUUID()
  );
}

/* ============================================================================
 * Optional string
 * ============================================================================
 */

function normalizeQuotationExpiryString(
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

/* ============================================================================
 * Optional positive integer
 * ============================================================================
 */

function normalizeQuotationExpiryBatchSize(
  value:
    unknown
): number | undefined {
  if (
    typeof value ===
      "number"
  ) {
    return Number.isInteger(
      value
    ) &&
      value >
        0
      ? value
      : undefined;
  }

  if (
    typeof value !==
      "string" ||
    value.trim()
      .length ===
      0
  ) {
    return undefined;
  }

  const parsed =
    Number(
      value
    );

  return Number.isInteger(
    parsed
  ) &&
    parsed >
      0
    ? parsed
    : undefined;
}

/* ============================================================================
 * Optional cutoff
 * ============================================================================
 */

function normalizeQuotationExpiryCutoff(
  value:
    unknown
): Date | undefined {
  if (
    value ===
      undefined ||
    value ===
      null ||
    value ===
      ""
  ) {
    return undefined;
  }

  if (
    value instanceof
      Date
  ) {
    return value;
  }

  if (
    typeof value !==
      "string"
  ) {
    return new Date(
      Number.NaN
    );
  }

  return new Date(
    value
  );
}

/* ============================================================================
 * JSON parser
 * ============================================================================
 */

async function readQuotationExpiryBody(
  request:
    Request
): Promise<
  ExpireQuotationsRouteBody
> {
  const text =
    await request.text();

  if (
    text.trim()
      .length ===
      0
  ) {
    return {};
  }

  const parsed =
    JSON.parse(
      text
    ) as unknown;

  if (
    typeof parsed !==
      "object" ||
    parsed ===
      null ||
    Array.isArray(
      parsed
    )
  ) {
    throw new Error(
      "Request body must be a JSON object."
    );
  }

  return parsed as
    ExpireQuotationsRouteBody;
}

/* ============================================================================
 * Bad request
 * ============================================================================
 */

function createQuotationExpiryBadRequest(
  requestId:
    string,
  message:
    string,
  details?:
    unknown
): NextResponse {
  return NextResponse.json(
    {
      success:
        false,

      error: {
        code:
          "INVALID_REQUEST",

        message,

        ...(details !==
        undefined
          ? {
              details,
            }
          : {}),
      },

      meta: {
        requestId,

        timestamp:
          new Date()
            .toISOString(),
      },
    },
    {
      status:
        400,

      headers: {
        "x-request-id":
          requestId,
      },
    }
  );
}

/* ============================================================================
 * Unexpected route error
 * ============================================================================
 */

function createQuotationExpiryRouteError(
  requestId:
    string,
  error:
    unknown
): NextResponse {
  console.error(
    "[Quotation Expiry API]",
    {
      requestId,
      error,
    }
  );

  return NextResponse.json(
    {
      success:
        false,

      error: {
        code:
          "QUOTATION_EXPIRY_ROUTE_ERROR",

        message:
          "Unable to process quotation expiry.",
      },

      meta: {
        requestId,

        timestamp:
          new Date()
            .toISOString(),
      },
    },
    {
      status:
        500,

      headers: {
        "x-request-id":
          requestId,
      },
    }
  );
}

/* ============================================================================
 * POST /api/quotations/expire
 * ============================================================================
 */

export async function POST(
  request:
    Request
): Promise<
  NextResponse
> {
  const requestId =
    getQuotationExpiryRequestId(
      request
    );

  const access = await authorizeInternalQuotation(request, resolveApplicationAuthentication);
  if (!access.allowed) {
    return NextResponse.json(
      { success: false, error: { code: access.code, message: access.message },
        meta: { requestId, timestamp: new Date().toISOString() } },
      { status: access.status, headers: { "x-request-id": requestId, "Cache-Control": "no-store" } }
    );
  }

  try {
    /* ------------------------------------------------------------------------
     * 1. Parse body
     * ------------------------------------------------------------------------
     */

    let body:
      ExpireQuotationsRouteBody;

    try {
      body =
        await readQuotationExpiryBody(
          request
        );
    } catch (
      error
    ) {
      return createQuotationExpiryBadRequest(
        requestId,
        error instanceof Error
          ? error.message
          : "Invalid JSON request body."
      );
    }

    /* ------------------------------------------------------------------------
     * 2. Resolve actor
     * ------------------------------------------------------------------------
     */

    const expiredBy =
      normalizeQuotationExpiryString(
        body.expiredBy
      ) ??
      normalizeQuotationExpiryString(
        request.headers.get(
          "x-user-id"
        )
      ) ??
      "SYSTEM";

    /* ------------------------------------------------------------------------
     * 3. Resolve optional cutoff
     * ------------------------------------------------------------------------
     */

    const cutoff =
      normalizeQuotationExpiryCutoff(
        body.cutoff
      );

    /* ------------------------------------------------------------------------
     * 4. Resolve optional batch size
     * ------------------------------------------------------------------------
     */

    const batchSize =
      normalizeQuotationExpiryBatchSize(
        body.batchSize
      );

    /* ------------------------------------------------------------------------
     * 5. Build service input
     * ------------------------------------------------------------------------
     */

    const serviceInput:
      ExpireDueQuotationsServiceInput = {
      expiredBy,

      ...(cutoff !==
      undefined
        ? {
            cutoff,
          }
        : {}),

      ...(batchSize !==
      undefined
        ? {
            batchSize,
          }
        : {}),
    };

    /* ------------------------------------------------------------------------
     * 6. Resolve module
     * ------------------------------------------------------------------------
     */

    const module =
      getOrCreateQuotationModule({
        prisma,
      });

    /* ------------------------------------------------------------------------
     * 7. Delegate to controller
     * ------------------------------------------------------------------------
     */

    const controllerResponse =
      await module
        .controller
        .expireDue({
          body:
            serviceInput,

          method:
            request.method,

          path:
            new URL(
              request.url
            ).pathname,

          requestId,

          headers: {
            "x-request-id":
              requestId,

            ...(request.headers.get(
              "x-user-id"
            )
              ? {
                  "x-user-id":
                    request.headers.get(
                      "x-user-id"
                    )!,
                }
              : {}),
          },
        });

    /* ------------------------------------------------------------------------
     * 8. Controller response -> NextResponse
     * ------------------------------------------------------------------------
     */

    const headers =
      new Headers();

    headers.set(
      "x-request-id",
      requestId
    );

    if (
      controllerResponse
        .headers
    ) {
      for (
        const [
          key,
          value,
        ] of Object.entries(
          controllerResponse
            .headers
        )
      ) {
        headers.set(
          key,
          value
        );
      }
    }

    return NextResponse.json(
      controllerResponse.body,
      {
        status:
          controllerResponse.status,

        headers,
      }
    );
  } catch (
    error
  ) {
    return createQuotationExpiryRouteError(
      requestId,
      error
    );
  }
}