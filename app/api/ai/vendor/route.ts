/**
 * ============================================================
 * EasyMovers AI Platform
 * Vendor AI Route
 * ============================================================
 *
 * Stage 1 — Module 1
 * Validate the request, load the vendor, and create the
 * VendorAIRequest object.
 */

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  PrismaClient,
} from "@prisma/client";

/**
 * In a later step, import VendorAIRequest from your existing
 * vendor.model.ts file.
 *
 * Example:
 *
 * import type {
 *   VendorAIRequest,
 * } from "@/ai/models/vendor.model";
 *
 * For Module 1, it is defined here temporarily so this file
 * can compile without guessing your actual model import path.
 */
interface VendorAIRequest {
  referenceId: string;
  vendorId: string;
  leadId: string;
  customerCity: string;
  destinationCity: string;
  moveDistance: number;
  estimatedWeight: number;
  moveDate: string;
  isCorporateMove?: boolean;
  isPremiumMove?: boolean;
}

/**
 * Incoming API request body.
 */
interface VendorEvaluationBody {
  referenceId: string;
  vendorId: string;
  leadId: string;
  customerCity: string;
  destinationCity: string;
  moveDistance: number;
  estimatedWeight: number;
  moveDate: string;
  isCorporateMove?: boolean;
  isPremiumMove?: boolean;
}

/**
 * Successful Module 1 response.
 */
interface VendorAIRequestResponse {
  success: true;
  message: string;
  data: VendorAIRequest;
}

/**
 * Error response.
 */
interface VendorAIRouteErrorResponse {
  success: false;
  message: string;
}

const prisma = new PrismaClient();

/**
 * ============================================================
 * POST /api/ai/vendor
 * ============================================================
 */

export async function POST(
  request: NextRequest,
): Promise<
  NextResponse<
    VendorAIRequestResponse |
    VendorAIRouteErrorResponse
  >
> {
  try {
    /**
     * Parse the JSON body only once.
     */
    const rawBody: unknown =
      await request.json();

    /**
     * Validate and normalize the complete Module 1 request.
     */
    const body =
      parseRequestBody(rawBody);

    /**
     * Load the vendor only once.
     */
    const vendor =
      await prisma.vendor.findUnique({
        where: {
          id: body.vendorId,
        },
      });

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Vendor not found for vendor ID: ${body.vendorId}`,
        },
        {
          status: 404,
        },
      );
    }

    /**
     * Build the VendorAIRequest.
     */
    const aiRequest: VendorAIRequest = {
      referenceId:
        body.referenceId,

      vendorId:
        vendor.id,

      leadId:
        body.leadId,

      customerCity:
        body.customerCity,

      destinationCity:
        body.destinationCity,

      moveDistance:
        body.moveDistance,

      estimatedWeight:
        body.estimatedWeight,

      moveDate:
        body.moveDate,

      isCorporateMove:
        body.isCorporateMove,

      isPremiumMove:
        body.isPremiumMove,
    };

    /**
     * Temporary Module 1 response.
     */
    return NextResponse.json(
      {
        success: true,
        message:
          "Vendor AI request created successfully.",
        data:
          aiRequest,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    if (
      error instanceof
      VendorAIRouteValidationError
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
): VendorEvaluationBody {
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
    requireString(
      body.referenceId,
      "referenceId",
    );

  const vendorId =
    requireString(
      body.vendorId,
      "vendorId",
    );

  const leadId =
    requireString(
      body.leadId,
      "leadId",
    );

  const customerCity =
    requireString(
      body.customerCity,
      "customerCity",
    );

  const destinationCity =
    requireString(
      body.destinationCity,
      "destinationCity",
    );

  const moveDistance =
    requireNonNegativeNumber(
      body.moveDistance,
      "moveDistance",
    );

  const estimatedWeight =
    requireNonNegativeNumber(
      body.estimatedWeight,
      "estimatedWeight",
    );

  const moveDate =
    requireString(
      body.moveDate,
      "moveDate",
    );

  const isCorporateMove =
    optionalBoolean(
      body.isCorporateMove,
      "isCorporateMove",
    );

  const isPremiumMove =
    optionalBoolean(
      body.isPremiumMove,
      "isPremiumMove",
    );

  return {
    referenceId,
    vendorId,
    leadId,
    customerCity,
    destinationCity,
    moveDistance,
    estimatedWeight,
    moveDate,
    isCorporateMove,
    isPremiumMove,
  };
}

/**
 * Validate required strings.
 */
function requireString(
  value: unknown,
  fieldName: string,
): string {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new VendorAIRouteValidationError(
      `${fieldName} is required and must be a non-empty string.`,
    );
  }

  return value.trim();
}

/**
 * Validate numeric fields.
 */
function requireNonNegativeNumber(
  value: unknown,
  fieldName: string,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new VendorAIRouteValidationError(
      `${fieldName} must be a valid non-negative number.`,
    );
  }

  return value;
}

/**
 * Validate optional Boolean fields.
 */
function optionalBoolean(
  value: unknown,
  fieldName: string,
): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw new VendorAIRouteValidationError(
      `${fieldName} must be a boolean.`,
    );
  }

  return value;
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