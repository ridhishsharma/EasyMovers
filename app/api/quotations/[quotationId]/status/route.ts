import { resolveApplicationAuthentication } from "@/lib/auth";
import { authorizeInternalQuotation } from "@/lib/quotation-access";

/**
 * ============================================================================
 * EasyMovers
 * Quotation API
 * Quotation Status Route
 * ============================================================================
 *
 * File:
 * app/api/quotations/[quotationId]/status/route.ts
 *
 * Supported operation:
 *
 * PATCH /api/quotations/:quotationId/status
 *
 * Architecture:
 *
 * Next.js Request
 *      ↓
 * Route adapter
 *      ↓
 * QuotationController.updateStatus()
 *      ↓
 * QuotationService.updateStatus()
 *      ↓
 * status transition validation
 *      ↓
 * QuotationRepository
 *      ↓
 * Prisma
 *
 * IMPORTANT:
 *
 * This route MUST NOT:
 *
 * - query Prisma directly
 * - validate transition rules itself
 * - manually update quotation status
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
  QuotationControllerRecord,
  QuotationControllerRequest,
  QuotationControllerResponse,
  UpdateQuotationStatusControllerBody,
} from "@/domains/quotation/controllers/quotation.controller";

/* ============================================================================
 * Runtime
 * ============================================================================
 */

export const runtime =
  "nodejs";

/* ============================================================================
 * Next.js route context
 * ============================================================================
 */

export interface QuotationStatusRouteContext {
  params:
    Promise<{
      quotationId:
        string;
    }>;
}

/* ============================================================================
 * Request ID
 * ============================================================================
 */

function getQuotationStatusRequestId(
  request:
    Request
): string {
  const existing =
    request.headers
      .get(
        "x-request-id"
      )
      ?.trim();

  return existing ||
    randomUUID();
}

/* ============================================================================
 * Request IP
 * ============================================================================
 */

function getQuotationStatusRequestIp(
  request:
    Request
): string | undefined {
  const forwarded =
    request.headers
      .get(
        "x-forwarded-for"
      );

  if (
    forwarded
  ) {
    return forwarded
      .split(
        ","
      )[0]
      ?.trim() ||
      undefined;
  }

  const realIp =
    request.headers
      .get(
        "x-real-ip"
      )
      ?.trim();

  return realIp ||
    undefined;
}

/* ============================================================================
 * Authenticated user
 * ============================================================================
 */



/* ============================================================================
 * Headers
 * ============================================================================
 */

function mapQuotationStatusRequestHeaders(
  request:
    Request
): Record<
  string,
  string
> {
  const headers:
    Record<
      string,
      string
    > = {};

  request.headers.forEach(
    (
      value,
      key
    ) => {
      headers[key] =
        value;
    }
  );

  return headers;
}

/* ============================================================================
 * Common controller metadata
 * ============================================================================
 */

function createQuotationStatusControllerMetadata(
  request:
    Request,
  requestId:
    string,
  authenticatedUserId: string
): Pick<
  QuotationControllerRequest,
  | "method"
  | "path"
  | "headers"
  | "requestId"
  | "ipAddress"
  | "userAgent"
  | "authenticatedUserId"
> {
  const ipAddress =
    getQuotationStatusRequestIp(
      request
    );

  const userAgent =
    request.headers
      .get(
        "user-agent"
      )
      ?.trim();



  return {
    method:
      request.method,

    path:
      new URL(
        request.url
      ).pathname,

    headers:
      mapQuotationStatusRequestHeaders(
        request
      ),

    requestId,

    ...(ipAddress
      ? {
          ipAddress,
        }
      : {}),

    ...(userAgent
      ? {
          userAgent,
        }
      : {}),

    ...(authenticatedUserId
      ? {
          authenticatedUserId,
        }
      : {}),
  };
}

/* ============================================================================
 * Controller → NextResponse adapter
 * ============================================================================
 */

function toNextQuotationStatusResponse<
  T
>(
  response:
    QuotationControllerResponse<
      T
    >,
  requestId:
    string
): NextResponse {
  const headers =
    new Headers();

  headers.set(
    "x-request-id",
    requestId
  );

  if (
    response.headers
  ) {
    for (
      const [
        key,
        value,
      ]
      of Object.entries(
        response.headers
      )
    ) {
      headers.set(
        key,
        value
      );
    }
  }

  return NextResponse.json(
    response.body,
    {
      status:
        response.status,

      headers,
    }
  );
}

/* ============================================================================
 * Invalid JSON response
 * ============================================================================
 */

function createInvalidQuotationStatusJsonResponse(
  requestId:
    string
): NextResponse {
  return NextResponse.json(
    {
      success:
        false,

      error: {
        code:
          "INVALID_JSON_BODY",

        message:
          "Request body must contain valid JSON.",
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

function createQuotationStatusRouteErrorResponse(
  requestId:
    string,
  error:
    unknown
): NextResponse {
  console.error(
    "[Quotation Status API]",
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
          "QUOTATION_STATUS_ROUTE_ERROR",

        message:
          "Unable to process the quotation status request.",
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
 * Resolve quotationId
 * ============================================================================
 */

async function resolveQuotationStatusQuotationId(
  context:
    QuotationStatusRouteContext
): Promise<string> {
  const params =
    await context.params;

  return params
    .quotationId
    .trim();
}

/* ============================================================================
 * PATCH /api/quotations/:quotationId/status
 * ============================================================================
 */

export async function PATCH(
  request:
    Request,
  context:
    QuotationStatusRouteContext
): Promise<
  NextResponse
> {
  const requestId =
    getQuotationStatusRequestId(
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

  let body:
    unknown;

  try {
    body =
      await request.json();
  } catch {
    return createInvalidQuotationStatusJsonResponse(
      requestId
    );
  }

  try {
    const quotationId =
      await resolveQuotationStatusQuotationId(
        context
      );

    const module =
      getOrCreateQuotationModule({
        prisma,
      });

    const controllerRequest:
      QuotationControllerRequest<
        UpdateQuotationStatusControllerBody,
        QuotationControllerRecord
      > = {
      body:
        body as
          UpdateQuotationStatusControllerBody,

      params: {
        quotationId,
      },

      ...createQuotationStatusControllerMetadata(
        request,
        requestId,
        access.userId
      ),
    };

    const response =
      await module
        .controller
        .updateStatus(
          controllerRequest
        );

    return toNextQuotationStatusResponse(
      response,
      requestId
    );
  } catch (
    error
  ) {
    return createQuotationStatusRouteErrorResponse(
      requestId,
      error
    );
  }
}