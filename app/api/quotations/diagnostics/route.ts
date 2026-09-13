import { resolveApplicationAuthentication } from "@/lib/auth";
import { authorizeInternalQuotation } from "@/lib/quotation-access";

/**
 * ============================================================================
 * EasyMovers
 * Quotation Diagnostics Route
 * ============================================================================
 *
 * File:
 * app/api/quotations/diagnostics/route.ts
 *
 * Endpoint:
 * GET /api/quotations/diagnostics
 *
 * Architecture:
 *
 * Next.js Route
 *      ↓
 * QuotationController.getDiagnostics()
 *      ↓
 * QuotationService.getDiagnostics()
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

/* ============================================================================
 * Runtime
 * ============================================================================
 */

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

/* ============================================================================
 * Request ID
 * ============================================================================
 */

function getQuotationDiagnosticsRequestId(
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
 * Unexpected route error
 * ============================================================================
 */

function createQuotationDiagnosticsRouteErrorResponse(
  requestId:
    string,
  error:
    unknown
): NextResponse {
  console.error(
    "[Quotation Diagnostics API]",
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
          "QUOTATION_DIAGNOSTICS_ROUTE_ERROR",

        message:
          "Unable to retrieve quotation diagnostics.",
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
 * GET /api/quotations/diagnostics
 * ============================================================================
 */

export async function GET(
  request:
    Request
): Promise<
  NextResponse
> {
  const requestId =
    getQuotationDiagnosticsRequestId(
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
     * 1. Resolve Quotation module
     * ------------------------------------------------------------------------
     */

    const module =
      getOrCreateQuotationModule({
        prisma,
      });

    /* ------------------------------------------------------------------------
     * 2. Delegate to controller
     * ------------------------------------------------------------------------
     */

    const controllerResponse =
      await module
        .controller
        .getDiagnostics({
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
          },
        });

    /* ------------------------------------------------------------------------
     * 3. Controller response -> NextResponse
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
    return createQuotationDiagnosticsRouteErrorResponse(
      requestId,
      error
    );
  }
}