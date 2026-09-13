import { resolveApplicationAuthentication } from "@/lib/auth";
import { authorizeInternalQuotation } from "@/lib/quotation-access";

/**
 * ============================================================================
 * EasyMovers
 * Quotation Statistics API Route
 * ============================================================================
 *
 * File:
 * app/api/quotations/statistics/route.ts
 *
 * Endpoint:
 * GET /api/quotations/statistics
 *
 * Architecture:
 *
 * Next.js Route
 *      ↓
 * QuotationController.getStatistics()
 *      ↓
 * QuotationService.getStatistics()
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
  GetQuotationStatisticsServiceInput,
} from "@/domains/quotation/services/quotation.service";

import type {
  QuotationListQuery,
} from "@/domains/quotation/models/quotation.model";

import {
  QuotationStatus,
} from "@/domains/quotation/models/quotation.model";

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

function getQuotationStatisticsRequestId(
  request:
    Request
): string {
  const suppliedRequestId =
    request.headers
      .get(
        "x-request-id"
      )
      ?.trim();

  return (
    suppliedRequestId ||
    randomUUID()
  );
}

/* ============================================================================
 * Basic normalization
 * ============================================================================
 */

function normalizeString(
  value:
    string | null
): string | undefined {
  if (
    value === null
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

function normalizeNumber(
  value:
    string | null
): number | undefined {
  const normalized =
    normalizeString(
      value
    );

  if (
    normalized ===
      undefined
  ) {
    return undefined;
  }

  const parsed =
    Number(
      normalized
    );

  return Number.isFinite(
    parsed
  )
    ? parsed
    : undefined;
}

function normalizeBoolean(
  value:
    string | null
): boolean | undefined {
  const normalized =
    normalizeString(
      value
    )?.toLowerCase();

  if (
    normalized ===
      "true"
  ) {
    return true;
  }

  if (
    normalized ===
      "false"
  ) {
    return false;
  }

  return undefined;
}

function normalizeDate(
  value:
    string | null
): string | undefined {
  const normalized =
    normalizeString(
      value
    );

  if (
    !normalized
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

  return normalized;
}

/* ============================================================================
 * Status normalization
 * ============================================================================
 */

function normalizeStatus(
  value:
    string | null
): QuotationStatus | undefined {
  const normalized =
    normalizeString(
      value
    )?.toUpperCase();

  if (
    !normalized
  ) {
    return undefined;
  }

  const statuses =
    Object.values(
      QuotationStatus
    ) as string[];

  return statuses.includes(
    normalized
  )
    ? normalized as
        QuotationStatus
    : undefined;
}

function normalizeStatuses(
  searchParams:
    URLSearchParams
): QuotationStatus[] | undefined {
  const rawValues = [
    ...searchParams
      .getAll(
        "statuses"
      ),

    ...searchParams
      .getAll(
        "status"
      ),
  ];

  const expanded =
    rawValues
      .flatMap(
        (
          value
        ) =>
          value.split(
            ","
          )
      )
      .map(
        (
          value
        ) =>
          value.trim()
      )
      .filter(
        Boolean
      );

  const statuses =
    expanded
      .map(
        (
          value
        ) =>
          normalizeStatus(
            value
          )
      )
      .filter(
        (
          status
        ): status is
          QuotationStatus =>
          Boolean(
            status
          )
      );

  if (
    statuses.length ===
      0
  ) {
    return undefined;
  }

  return [
    ...new Set(
      statuses
    ),
  ];
}

/* ============================================================================
 * Statistics query mapper
 * ============================================================================
 */

function mapQuotationStatisticsQuery(
  request:
    Request
): NonNullable<
  QuotationListQuery[
    "criteria"
  ]
> {
  const url =
    new URL(
      request.url
    );

  const searchParams =
    url.searchParams;

  const quotationId =
    normalizeString(
      searchParams.get(
        "quotationId"
      )
    );

  const quotationNumber =
    normalizeString(
      searchParams.get(
        "quotationNumber"
      )
    );

  const referenceId =
    normalizeString(
      searchParams.get(
        "referenceId"
      )
    );

  const leadId =
    normalizeString(
      searchParams.get(
        "leadId"
      )
    );

  const bookingId =
    normalizeString(
      searchParams.get(
        "bookingId"
      )
    );

  const vendorId =
    normalizeString(
      searchParams.get(
        "vendorId"
      )
    );

  const userId =
    normalizeString(
      searchParams.get(
        "userId"
      )
    );

  const statuses =
    normalizeStatuses(
      searchParams
    );

  const selectedForBooking =
    normalizeBoolean(
      searchParams.get(
        "selectedForBooking"
      )
    );

  const minimumAmount =
    normalizeNumber(
      searchParams.get(
        "minimumAmount"
      )
    );

  const maximumAmount =
    normalizeNumber(
      searchParams.get(
        "maximumAmount"
      )
    );

  const validFrom =
    normalizeDate(
      searchParams.get(
        "validFrom"
      )
    );

  const validUntil =
    normalizeDate(
      searchParams.get(
        "validUntil"
      )
    );

  const pickupDateFrom =
    normalizeDate(
      searchParams.get(
        "pickupDateFrom"
      )
    );

  const pickupDateTo =
    normalizeDate(
      searchParams.get(
        "pickupDateTo"
      )
    );

  const createdFrom =
    normalizeDate(
      searchParams.get(
        "createdFrom"
      )
    );

  const createdUntil =
    normalizeDate(
      searchParams.get(
        "createdUntil"
      )
    );

  const search =
    normalizeString(
      searchParams.get(
        "search"
      )
    );

  return {
    ...(quotationId
      ? {
          quotationId,
        }
      : {}),

    ...(quotationNumber
      ? {
          quotationNumber,
        }
      : {}),

    ...(referenceId
      ? {
          referenceId,
        }
      : {}),

    ...(leadId
      ? {
          leadId,
        }
      : {}),

    ...(bookingId
      ? {
          bookingId,
        }
      : {}),

    ...(vendorId
      ? {
          vendorId,
        }
      : {}),

    ...(userId
      ? {
          userId,
        }
      : {}),

    ...(statuses
      ? {
          statuses,
        }
      : {}),

    ...(selectedForBooking !==
    undefined
      ? {
          selectedForBooking,
        }
      : {}),

    ...(minimumAmount !==
    undefined
      ? {
          minimumAmount,
        }
      : {}),

    ...(maximumAmount !==
    undefined
      ? {
          maximumAmount,
        }
      : {}),

    ...(validFrom
      ? {
          validFrom,
        }
      : {}),

    ...(validUntil
      ? {
          validUntil,
        }
      : {}),

    ...(pickupDateFrom
      ? {
          pickupDateFrom,
        }
      : {}),

    ...(pickupDateTo
      ? {
          pickupDateTo,
        }
      : {}),

    ...(createdFrom
      ? {
          createdFrom,
        }
      : {}),

    ...(createdUntil
      ? {
          createdUntil,
        }
      : {}),

    ...(search
      ? {
          search,
        }
      : {}),
  };
}

/* ============================================================================
 * Unexpected route error
 * ============================================================================
 */

function createQuotationStatisticsRouteErrorResponse(
  requestId:
    string,
  error:
    unknown
): NextResponse {
  console.error(
    "[Quotation Statistics API]",
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
          "QUOTATION_STATISTICS_ROUTE_ERROR",

        message:
          "Unable to retrieve quotation statistics.",
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
 * GET /api/quotations/statistics
 * ============================================================================
 */

export async function GET(
  request:
    Request
): Promise<
  NextResponse
> {
  const requestId =
    getQuotationStatisticsRequestId(
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
    const module =
      getOrCreateQuotationModule({
        prisma,
      });

    const criteria =
      mapQuotationStatisticsQuery(
        request
      );

    const serviceInput:
      GetQuotationStatisticsServiceInput =
      Object.keys(
        criteria
      ).length >
        0
        ? {
            query: {
              criteria,
            },
          }
        : {};

    const controllerResponse =
      await module
        .controller
        .getStatistics({
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
          },
        });

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
    return createQuotationStatisticsRouteErrorResponse(
      requestId,
      error
    );
  }
}