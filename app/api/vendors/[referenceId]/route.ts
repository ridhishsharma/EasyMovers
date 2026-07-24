/**
 * ============================================================
 * Easy Movers
 * Vendor AI Recommendation API
 * ============================================================
 *
 * Route
 * -----
 * GET /api/ai/vendor/[referenceId]
 *
 * Purpose
 * -------
 * Return AI recommendation for a specific lead.
 *
 * ============================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { vendorAIService } from "@/ai/vendor/vendor-ai.service";

import {
  aiLogger,
  AILogLevel,
  AILogModule,
} from "@/ai/utils/ai-logger";

/* ============================================================
 * GET
 * ============================================================
 */

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      referenceId: string;
    }>;
  }
) {
  try {
    /**
     * --------------------------------------------------------
     * Extract Reference ID
     * --------------------------------------------------------
     */

    const { referenceId } = await params;

    if (!referenceId) {
      return NextResponse.json(
        {
          success: false,
          message: "Reference ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * --------------------------------------------------------
     * Load Lead
    * --------------------------------------------------------
     */

    const lead = await prisma.lead.findFirst({
      where: {
        referenceId,
      },
    });

    if (!lead) {
      return NextResponse.json(
        {
          success: false,
          message: "Lead not found.",
        },
        {
          status: 404,
        }
      );
    }

    /**
     * --------------------------------------------------------
     * Load Quotations
     * --------------------------------------------------------
     */

    const quotations =
      await prisma.quotation.findMany({
        where: {
          leadId: lead.id,
        },
        include: {
          vendor: {
            include: {
              ratingSummary: true,
              vehicles: true,
              documents: true,
            },
          },
        },
        orderBy: {
          totalAmount: "asc",
        },
      });

    /**
     * --------------------------------------------------------
     * No Quotations
     * --------------------------------------------------------
     */

    if (quotations.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No quotations available for this lead.",
        },
        {
          status: 404,
        }
      );
    }

    /**
     * --------------------------------------------------------
     * Logging
     * --------------------------------------------------------
     */

    aiLogger.info({
      timestamp: new Date(),
      module: AILogModule.VENDOR,
      level: AILogLevel.INFO,
      referenceId,
      message:
        "Vendor recommendation requested.",
    });

    /**
     * --------------------------------------------------------
     * Continue
     * --------------------------------------------------------
     *
     * Next Section
     * ------------
     * • Build Vendor AI Scores
     * • Rank Vendors
     * • Detect Best Vendor
     * • Return Recommendation
     */
    /**
     * --------------------------------------------------------
     * Build Vendor Recommendation List
     * --------------------------------------------------------
     */

    const recommendations = quotations.map((quotation) => {

      const vendor = quotation.vendor;

      const trustScore =
        Math.min(
          100,
          (vendor.rating * 20) +
          Math.min(vendor.experienceYears ?? 0, 20) +
          (vendor.insuranceAvailable ? 10 : 0)
        );

      const fleetScore =
        Math.min(
          100,
          (vendor.totalVehicles ?? 0) * 2
        );

      const experienceScore =
        Math.min(
          100,
          (vendor.experienceYears ?? 0) * 5
        );

      const overallScore =
        Math.round(
          (trustScore * 0.40) +
          (fleetScore * 0.20) +
          (experienceScore * 0.20) +
          ((100 - quotation.totalAmount / 1000) * 0.20)
        );

      return {

        vendorId: vendor.id,

        vendorCode: vendor.vendorCode,

        companyName: vendor.companyName,

        totalAmount: quotation.totalAmount,

        trustScore,

        fleetScore,

        experienceScore,

        overallScore,

        insuranceAvailable:
          vendor.insuranceAvailable,

        totalVehicles:
          vendor.totalVehicles,

        experienceYears:
          vendor.experienceYears,

        rating:
          vendor.rating,

      };

    });

    /**
     * --------------------------------------------------------
     * Rank Vendors
     * --------------------------------------------------------
     */

    recommendations.sort(

      (a, b) =>

        b.overallScore -

        a.overallScore

    );

    /**
     * --------------------------------------------------------
     * Best Vendor
     * --------------------------------------------------------
     */

    const bestVendor =
      recommendations[0];

    /**
     * --------------------------------------------------------
     * Alternative Vendors
     * --------------------------------------------------------
     */

    const alternatives =
      recommendations.slice(1);

    /**
     * --------------------------------------------------------
     * Response
     * --------------------------------------------------------
     */

    return NextResponse.json({

  success: true,

  referenceId,

  leadId: lead.id,

  bestVendor,

  alternatives,

  totalVendors: recommendations.length,

  generatedAt: new Date(),

});

} catch (error) {

  console.error(error);

  return NextResponse.json(

    {

      success: false,

      message: "Internal Server Error",

      error:
        error instanceof Error
          ? error.message
          : "Unknown error",

    },

    {

      status: 500,

    }

  );

}

}