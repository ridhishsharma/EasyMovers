/**
 * ============================================================
 * EasyMovers AI Platform
 * Vendor AI Route
 * ============================================================
 *
 * File:
 * app/api/ai/vendor/route.ts
 *
 * Purpose:
 * Validate a Vendor AI request and load the corresponding
 * vendor from the database.
 *
 * Rebuild stage:
 * Stage 1 — Request validation and vendor lookup
 *
 * ============================================================
 */

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  PrismaClient,
} from "@prisma/client";

/**
 * ============================================================
 * Prisma Client
 * ============================================================
 */

const prisma = new PrismaClient();

/**
 * ============================================================
 * Request Body
 * ============================================================
 */

interface VendorAIRouteRequest {

  referenceId: string;

}

/**
 * ============================================================
 * Error Response
 * ============================================================
 */

interface VendorAIRouteErrorResponse {

  success: false;

  message: string;

}

/**
 * ============================================================
 * Success Response
 * ============================================================
 */

interface VendorLookupResponse {

  success: true;

  message: string;

  vendor: {

    id: string;

    vendorCode: string;

    companyName: string;

    ownerName: string;

    status: string;

  };

}

/**
 * ============================================================
 * POST /api/ai/vendor
 * ============================================================
 */

export async function POST(
  request: NextRequest,
): Promise<
  NextResponse<
    VendorLookupResponse |
    VendorAIRouteErrorResponse
  >
> {

  try {

    /**
     * --------------------------------------------------------
     * Parse request body
     * --------------------------------------------------------
     */

    const rawBody: unknown =
      await request.json();

    const body =
      parseRequestBody(rawBody);

    /**
     * --------------------------------------------------------
     * Normalize reference ID
     * --------------------------------------------------------
     */

    const referenceId =
      body.referenceId.trim();

    /**
     * --------------------------------------------------------
     * Load vendor
     * --------------------------------------------------------
     *
     * The API accepts either:
     *
     * • Vendor database ID
     * • Vendor code
     */

    const vendor =
      await prisma.vendor.findFirst({

        where: {

          OR: [

            {

              id: referenceId,

            },

            {

              vendorCode: referenceId,

            },

          ],

        },

      });

    /**
     * --------------------------------------------------------
     * Vendor not found
     * --------------------------------------------------------
     */

    if (!vendor) {

      return NextResponse.json(

        {

          success: false,

          message:
            `Vendor not found for reference ID: ${referenceId}`,

        },

        {

          status: 404,

        },

      );

    }

    /**
     * --------------------------------------------------------
     * Temporary success response
     * --------------------------------------------------------
     *
     * Vendor AI model preparation and evaluation will be added
     * in the next stage.
     */

    return NextResponse.json(

      {

        success: true,

        message:
          "Vendor loaded successfully.",

        vendor: {

          id:
            vendor.id,

          vendorCode:
            vendor.vendorCode,

          companyName:
            vendor.companyName,

          ownerName:
            vendor.ownerName,

          status:
            vendor.status,

        },

      },

      {

        status: 200,

      },

    );

  } catch (error) {

    /**
     * --------------------------------------------------------
     * Request validation errors
     * --------------------------------------------------------
     */

    if (
      error instanceof VendorAIRouteValidationError
    ) {

      return NextResponse.json(

        {

          success: false,

          message:
            error.message,

        },

        {

          status: 400,

        },

      );

    }

    /**
     * --------------------------------------------------------
     * Unexpected errors
     * --------------------------------------------------------
     */

    console.error(
      "Vendor AI route failed:",
      error,
    );

    return NextResponse.json(

      {

        success: false,

        message:

          error instanceof Error

            ? error.message

            : "An unexpected error occurred while processing the vendor.",

      },

      {

        status: 500,

      },

    );

  }

}

/**
 * ============================================================
 * Parse and Validate Request Body
 * ============================================================
 */

function parseRequestBody(
  value: unknown,
): VendorAIRouteRequest {

  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {

    throw new VendorAIRouteValidationError(
      "Request body must be a valid JSON object.",
    );

  }

  const body =
    value as Record<string, unknown>;

  const referenceId =
    body.referenceId;

  if (
    typeof referenceId !== "string" ||
    !referenceId.trim()
  ) {

    throw new VendorAIRouteValidationError(
      "referenceId is required.",
    );

  }

  return {

    referenceId:
      referenceId.trim(),

  };

}

/**
 * ============================================================
 * Validation Error
 * ============================================================
 */

class VendorAIRouteValidationError
  extends Error {

  constructor(
    message: string,
  ) {

    super(message);

    this.name =
      "VendorAIRouteValidationError";

  }

}