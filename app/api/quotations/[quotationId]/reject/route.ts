import { resolveApplicationAuthentication } from "@/lib/auth";
import { authorizeInternalQuotation } from "@/lib/quotation-access";

/**
 * ============================================================================
 * EasyMovers
 * Quotation Rejection Route
 * ============================================================================
 *
 * File:
 * app/api/quotations/[quotationId]/reject/route.ts
 *
 * Supported operation:
 *
 * POST /api/quotations/:quotationId/reject
 *
 * Architecture:
 *
 * Next.js Request
 *      ↓
 * Route adapter
 *      ↓
 * QuotationController.reject()
 *      ↓
 * QuotationService.reject()
 *      ↓
 * rejection/status validation
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
 * - change quotation status directly
 * - duplicate rejection business rules
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
  RejectQuotationControllerBody,
} from "@/domains/quotation/controllers/quotation.controller";

/* ============================================================================
 * Runtime
 * ============================================================================
 */

export const runtime =
  "nodejs";

/* ============================================================================
 * Route context
 * ============================================================================
 */

export interface RejectQuotationRouteContext {
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

function getRejectQuotationRequestId(
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

function getRejectQuotationRequestIp(
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
 * Request headers
 * ============================================================================
 */

function mapRejectQuotationRequestHeaders(
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
 * Controller metadata
 * ============================================================================
 */

function createRejectQuotationControllerMetadata(
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
    getRejectQuotationRequestIp(
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
      mapRejectQuotationRequestHeaders(
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
 * Controller -> NextResponse adapter
 * ============================================================================
 */

function toNextRejectQuotationResponse<
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

function createInvalidRejectQuotationJsonResponse(
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

function createRejectQuotationRouteErrorResponse(
  requestId:
    string,
  error:
    unknown
): NextResponse {
  console.error(
    "[Quotation Rejection API]",
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
          "QUOTATION_REJECTION_ROUTE_ERROR",

        message:
          "Unable to process the quotation rejection request.",
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

async function resolveRejectQuotationId(
  context:
    RejectQuotationRouteContext
): Promise<string> {
  const params =
    await context.params;

  return params
    .quotationId
    .trim();
}

/* ============================================================================
 * POST /api/quotations/:quotationId/reject
 * ============================================================================
 */

export async function POST(
  request:
    Request,
  context:
    RejectQuotationRouteContext
): Promise<
  NextResponse
> {
  const requestId =
    getRejectQuotationRequestId(
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
    return createInvalidRejectQuotationJsonResponse(
      requestId
    );
  }

  try {
    const quotationId =
      await resolveRejectQuotationId(
        context
      );

    const module =
      getOrCreateQuotationModule({
        prisma,
      });

    const controllerRequest:
      QuotationControllerRequest<
        RejectQuotationControllerBody,
        QuotationControllerRecord
      > = {
      body:
        body as
          RejectQuotationControllerBody,

      params: {
        quotationId,
      },

      ...createRejectQuotationControllerMetadata(
        request,
        requestId,
        access.userId
      ),
    };

    const response =
      await module
        .controller
        .reject(
          controllerRequest
        );

    return toNextRejectQuotationResponse(
      response,
      requestId
    );
  } catch (
    error
  ) {
    return createRejectQuotationRouteErrorResponse(
      requestId,
      error
    );
  }
}