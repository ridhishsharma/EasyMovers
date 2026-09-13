import { resolveApplicationAuthentication } from "@/lib/auth";
import { authorizeInternalQuotation } from "@/lib/quotation-access";

/**
 * ============================================================================
 * EasyMovers
 * Quotation API
 * Individual Quotation Route
 * ============================================================================
 *
 * File:
 * app/api/quotations/[quotationId]/route.ts
 *
 * Supported operations:
 *
 * GET   /api/quotations/:quotationId
 * PATCH /api/quotations/:quotationId
 *
 * Architecture:
 *
 * Next.js Request
 *      ↓
 * Route adapter
 *      ↓
 * QuotationController
 *      ↓
 * QuotationService
 *      ↓
 * QuotationRepository
 *      ↓
 * Prisma
 *
 * IMPORTANT:
 *
 * This route must not:
 *
 * - query Prisma directly
 * - implement quotation business rules
 * - duplicate domain validation
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
  UpdateQuotationControllerBody,
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

export interface QuotationRouteContext {
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

function getQuotationRequestId(
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

function getQuotationRequestIp(
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

/**
 * Temporary adapter until the final authentication/session layer
 * is connected.
 */


/* ============================================================================
 * Headers
 * ============================================================================
 */

function mapQuotationRequestHeaders(
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
 * Common controller request metadata
 * ============================================================================
 */

function createQuotationRouteControllerMetadata(
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
    getQuotationRequestIp(
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
      mapQuotationRequestHeaders(
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

function toNextQuotationResponse<
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

function createInvalidQuotationJsonResponse(
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

function createQuotationRouteErrorResponse(
  requestId:
    string,
  error:
    unknown
): NextResponse {
  console.error(
    "[Quotation API / quotationId]",
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
          "QUOTATION_ROUTE_ERROR",

        message:
          "Unable to process the quotation request.",
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

async function resolveQuotationId(
  context:
    QuotationRouteContext
): Promise<string> {
  const params =
    await context.params;

  return params
    .quotationId
    .trim();
}

/* ============================================================================
 * GET /api/quotations/:quotationId
 * ============================================================================
 */

export async function GET(
  request:
    Request,
  context:
    QuotationRouteContext
): Promise<
  NextResponse
> {
  const requestId =
    getQuotationRequestId(
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
    const quotationId =
      await resolveQuotationId(
        context
      );

    const module =
      getOrCreateQuotationModule({
        prisma,
      });

    const controllerRequest:
      QuotationControllerRequest<
        unknown,
        QuotationControllerRecord
      > = {
      params: {
        quotationId,
      },

      ...createQuotationRouteControllerMetadata(
        request,
        requestId,
        access.userId
      ),
    };

    const response =
      await module
        .controller
        .getById(
          controllerRequest
        );

    return toNextQuotationResponse(
      response,
      requestId
    );
  } catch (
    error
  ) {
    return createQuotationRouteErrorResponse(
      requestId,
      error
    );
  }
}

/* ============================================================================
 * PATCH /api/quotations/:quotationId
 * ============================================================================
 */

/**
 * Updates editable commercial quotation fields.
 *
 * Example:
 *
 * PATCH /api/quotations/:quotationId
 */
export async function PATCH(
  request:
    Request,
  context:
    QuotationRouteContext
): Promise<
  NextResponse
> {
  const requestId =
    getQuotationRequestId(
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
    return createInvalidQuotationJsonResponse(
      requestId
    );
  }

  try {
    const quotationId =
      await resolveQuotationId(
        context
      );

    const module =
      getOrCreateQuotationModule({
        prisma,
      });

    const controllerRequest:
      QuotationControllerRequest<
        UpdateQuotationControllerBody,
        QuotationControllerRecord
      > = {
      body:
        body as
          UpdateQuotationControllerBody,

      params: {
        quotationId,
      },

      ...createQuotationRouteControllerMetadata(
        request,
        requestId,
        access.userId
      ),
    };

    const response =
      await module
        .controller
        .update(
          controllerRequest
        );

    return toNextQuotationResponse(
      response,
      requestId
    );
  } catch (
    error
  ) {
    return createQuotationRouteErrorResponse(
      requestId,
      error
    );
  }
}