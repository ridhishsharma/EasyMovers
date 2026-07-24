/**
 * ============================================================
 * EasyMovers AI Platform
 * Vendor AI Service
 * ============================================================
 *
 * File:
 * ai/vendor/vendor-ai.service.ts
 *
 * Purpose:
 * Evaluate, score, rank, and recommend moving vendors.
 *
 * Development approach:
 * Each section is compiled before the next section is added.
 *
 * ============================================================
 */

import {
  AIProvider,
} from "../config/ai.config";

import {
  aiLogger,
  AILogLevel,
  AILogModule,
} from "../utils/ai-logger";


import {
  aiCacheService,
} from "../cache/ai-cache.service";

import { 
VendorAIRequest,
  VendorAIResponse,
VendorExperience,
VendorRatings,
VendorPricing,
VendorCompliance,
VendorFleet,
VendorPerformance,
VendorProfile,
  VendorRecommendation,
  VendorRecommendationResult,
  VendorAIScore,
} from "../vendor/vendor.model";
/**
 * ============================================================
 * Vendor AI Service Configuration
 * ============================================================
 */

interface VendorAIServiceConfiguration {

  provider: AIProvider;

  cachePrefix: string;

  cacheDurationSeconds: number;

  maximumAlternativeVendors: number;

}

/**
 * ============================================================
 * Default Service Configuration
 * ============================================================
 */

const DEFAULT_VENDOR_AI_SERVICE_CONFIGURATION:
  VendorAIServiceConfiguration = {

    provider: AIProvider.OPENAI,

    cachePrefix: "vendor-ai",

    cacheDurationSeconds: 60 * 60,

    maximumAlternativeVendors: 3,

  };

/**
 * ============================================================
 * Vendor AI Health Result
 * ============================================================
 */

export interface VendorAIHealthResult {

  success: boolean;

  provider: AIProvider;

  service: string;

  version: string;

  checkedAt: Date;

  message: string;

}

/**
 * ============================================================
 * Vendor AI Service
 * ============================================================
 */

export class VendorAIService {

  private readonly provider: AIProvider;

  private readonly cachePrefix: string;

  private readonly cacheDurationSeconds: number;

  private readonly maximumAlternativeVendors: number;

  /**
   * ==========================================================
   * Constructor
   * ==========================================================
   */

  constructor(
    configuration:
      Partial<VendorAIServiceConfiguration> = {}
  ) {

    const resolvedConfiguration = {

      ...DEFAULT_VENDOR_AI_SERVICE_CONFIGURATION,

      ...configuration,

    };

    this.provider =
      resolvedConfiguration.provider;

    this.cachePrefix =
      resolvedConfiguration.cachePrefix;

    this.cacheDurationSeconds =
      resolvedConfiguration.cacheDurationSeconds;

    this.maximumAlternativeVendors =
      resolvedConfiguration.maximumAlternativeVendors;

    aiLogger.info({

      timestamp: new Date(),

      module: AILogModule.VENDOR,

      level: AILogLevel.INFO,

      provider: this.provider,

      message:
        "Vendor AI Service initialized.",

      metadata: {

        cachePrefix:
          this.cachePrefix,

        cacheDurationSeconds:
          this.cacheDurationSeconds,

        maximumAlternativeVendors:
          this.maximumAlternativeVendors,

      },

    });

  }

  /**
   * ==========================================================
   * Health Check
   * ==========================================================
   */

  public async healthCheck():
    Promise<VendorAIHealthResult> {

    try {

      const apiKeyAvailable =

        this.provider !== AIProvider.OPENAI ||

        Boolean(
          process.env.OPENAI_API_KEY
        );

      if (!apiKeyAvailable) {

        return {

          success: false,

          provider: this.provider,

          service: "Vendor AI Service",

          version: "1.0.0",

          checkedAt: new Date(),

          message:
            "OPENAI_API_KEY is not configured.",

        };

      }

      return {

        success: true,

        provider: this.provider,

        service: "Vendor AI Service",

        version: "1.0.0",

        checkedAt: new Date(),

        message:
          "Vendor AI Service is available.",

      };

    } catch (error) {

      aiLogger.error({

        timestamp: new Date(),

        module: AILogModule.VENDOR,

        level: AILogLevel.ERROR,

        provider: this.provider,

        message:
          "Vendor AI Service health check failed.",

        error,

      });

      return {

        success: false,

        provider: this.provider,

        service: "Vendor AI Service",

        version: "1.0.0",

        checkedAt: new Date(),

        message:

          error instanceof Error

            ? error.message

            : "Unknown health-check error.",

      };

    }

  }

  /**
   * ==========================================================
   * Build Cache Key
   * ==========================================================
   */

  private buildCacheKey(

    referenceId: string,

    vendorId: string

  ): string {

    return [

      this.cachePrefix,

      referenceId.trim(),

      vendorId.trim(),

    ].join(":");

  }


/**
 * ==========================================================
 * Validate Vendor AI Request
 * ==========================================================
 */

private validateRequest(
  request: VendorAIRequest,
): void {

  if (!request.referenceId?.trim()) {
    throw new Error("Reference ID is required.");
  }

  if (!request.leadId?.trim()) {
    throw new Error("Lead ID is required.");
  }

  if (!request.vendorId?.trim()) {
    throw new Error("Vendor ID is required.");
  }

  if (request.estimatedWeight <= 0) {
    throw new Error(
      "Estimated weight must be greater than zero.",
    );
  }

  if (request.moveDistance < 0) {
    throw new Error(
      "Move distance cannot be negative.",
    );
  }

}

/**
 * ==========================================================
 * Empty Response
 * ==========================================================
 */

private emptyResponse(
  message: string,
): VendorAIResponse {

  return {

    success: false,

    message,

  };

}

/**
 * ==========================================================
 * Read Cached Evaluation
 * ==========================================================
 */

private async getCachedEvaluation(
  referenceId: string,
  vendorId: string,
): Promise<VendorAIResponse | null> {

  try {

    const cacheKey =
      this.buildCacheKey(
        referenceId,
        vendorId,
      );

    const cached =
      await aiCacheService.get<VendorAIResponse>(
        cacheKey,
      );

    return cached;

  } catch {

    return null;

  }

}

/**
 * ==========================================================
 * Store Cached Evaluation
 * ==========================================================
 */

private async cacheEvaluation(
  referenceId: string,
  vendorId: string,
  response: VendorAIResponse,
): Promise<void> {

  try {

    const cacheKey =
      this.buildCacheKey(
        referenceId,
        vendorId,
      );

await aiCacheService.set(

  cacheKey,

  response,

  AILogModule.VENDOR,

  this.provider,

);

  } catch (error) {

    aiLogger.warning({

      timestamp: new Date(),

      module: AILogModule.VENDOR,

      level: AILogLevel.WARNING,

      provider: this.provider,

      message:
        "Unable to cache Vendor AI response.",

      error,

    });

  }

}

/**
 * ==========================================================
 * Normalize Score
 * ==========================================================
 */

private normalizeScore(
  value: number,
): number {

  if (!Number.isFinite(value)) {
    return 0;
  }

  return Number(
    Math.max(
      0,
      Math.min(100, value),
    ).toFixed(2),
  );

}

/**
 * ==========================================================
 * Calculate Trust Score
 * ==========================================================
 */

private calculateTrustScore(
  experience: VendorExperience,
  compliance: VendorCompliance,
  ratings: VendorRatings,
): number {

  let score = 0;

  if (compliance.aadhaarVerified) score += 5;
  if (compliance.panVerified) score += 5;
  if (compliance.gstVerified) score += 10;
  if (compliance.policeVerified) score += 10;
  if (compliance.insuranceAvailable) score += 10;

  if (experience.totalYears >= 15) score += 30;
  else if (experience.totalYears >= 10) score += 25;
  else if (experience.totalYears >= 5) score += 18;
  else if (experience.totalYears >= 2) score += 10;

  const customerRating =
  ratings.customerRating ?? 0;

const reviewCount =
  ratings.reviewCount ?? 0;

score += Math.min(
  20,
  customerRating * 4,
);

if (reviewCount >= 500) score += 10;
else if (reviewCount >= 200) score += 8;
else if (reviewCount >= 100) score += 6;
else if (reviewCount >= 50) score += 4;
else if (reviewCount >= 20) score += 2;

  return this.normalizeScore(score);

}

/**
 * ==========================================================
 * Calculate Pricing Score
 * ==========================================================
 */

private calculatePricingScore(
  pricing: VendorPricing,
): number {

  let score = 100;

  const averageQuotation =
    Math.max(0, pricing.averageQuotation);

  const minimumQuotation =
    Math.max(0, pricing.minimumQuotation);

  const maximumQuotation =
    Math.max(0, pricing.maximumQuotation);

  const lastQuotation =
    Math.max(0, pricing.lastQuotation);

  if (averageQuotation === 0) {
    return 0;
  }

  const quotationSpread =
    maximumQuotation - minimumQuotation;

  const spreadPercentage =
    (
      quotationSpread /
      averageQuotation
    ) * 100;

  if (spreadPercentage > 60) {
    score -= 35;
  } else if (spreadPercentage > 40) {
    score -= 25;
  } else if (spreadPercentage > 25) {
    score -= 15;
  } else if (spreadPercentage > 10) {
    score -= 5;
  }

  const lastQuotationDifference =
    (
      Math.abs(
        lastQuotation -
        averageQuotation,
      ) /
      averageQuotation
    ) * 100;

  if (lastQuotationDifference > 40) {
    score -= 25;
  } else if (lastQuotationDifference > 25) {
    score -= 15;
  } else if (lastQuotationDifference > 15) {
    score -= 8;
  }

  if (
    lastQuotation >= minimumQuotation &&
    lastQuotation <= maximumQuotation
  ) {
    score += 5;
  }

  return this.normalizeScore(score);

}

/**
 * ==========================================================
 * Calculate Experience Score
 * ==========================================================
 */

private calculateExperienceScore(
  experience: VendorExperience,
): number {

  let score = 0;

  if (experience.totalYears >= 20) score += 40;
  else if (experience.totalYears >= 15) score += 35;
  else if (experience.totalYears >= 10) score += 30;
  else if (experience.totalYears >= 7) score += 25;
  else if (experience.totalYears >= 5) score += 20;
  else if (experience.totalYears >= 3) score += 15;
  else if (experience.totalYears >= 1) score += 10;

  if (experience.totalBookings >= 5000) score += 20;
  else if (experience.totalBookings >= 2500) score += 18;
  else if (experience.totalBookings >= 1000) score += 15;
  else if (experience.totalBookings >= 500) score += 12;
  else if (experience.totalBookings >= 100) score += 8;

  const successRate =
    experience.totalBookings === 0
      ? 0
      : (
          experience.successfulBookings /
          experience.totalBookings
        ) * 100;

  if (successRate >= 99) score += 30;
  else if (successRate >= 97) score += 27;
  else if (successRate >= 95) score += 24;
  else if (successRate >= 90) score += 18;
  else if (successRate >= 80) score += 12;

  if (experience.damagedClaims === 0) score += 10;
  else if (experience.damagedClaims <= 2) score += 8;
  else if (experience.damagedClaims <= 5) score += 5;
  else if (experience.damagedClaims <= 10) score += 2;

  if (experience.cancelledBookings > 100) score -= 10;
  else if (experience.cancelledBookings > 50) score -= 5;

  return this.normalizeScore(score);

}

/**
 * ==========================================================
 * Calculate Fleet Score
 * ==========================================================
 */

private calculateFleetScore(
  fleet: VendorFleet,
): number {

  let score = 0;

  const calculatedVehicleCount =
    fleet.miniTruck +
    fleet.pickupTruck +
    fleet.containerTruck +
    fleet.trailerTruck;

  const totalVehicles =
    Math.max(
      fleet.totalVehicles,
      calculatedVehicleCount,
    );

  if (totalVehicles >= 50) score += 50;
  else if (totalVehicles >= 30) score += 45;
  else if (totalVehicles >= 20) score += 40;
  else if (totalVehicles >= 10) score += 32;
  else if (totalVehicles >= 5) score += 22;
  else if (totalVehicles >= 1) score += 10;

  score += Math.min(
    fleet.miniTruck * 2,
    10,
  );

  score += Math.min(
    fleet.pickupTruck * 2,
    10,
  );

  score += Math.min(
    fleet.containerTruck * 3,
    18,
  );

  score += Math.min(
    fleet.trailerTruck * 4,
    12,
  );

  return this.normalizeScore(score);

}

/**
 * ==========================================================
 * Calculate Response Score
 * ==========================================================
 */
private calculateResponseScore(
  performance: VendorPerformance,
): number {

  let score = 100;

  const responseTimeHours =
    Math.max(
      0,
      performance.responseTimeHours,
    );

  const averageDeliveryDays =
    Math.max(
      0,
      performance.averageDeliveryDays,
    );

  const complaintPercentage =
    this.normalizeScore(
      performance.complaintPercentage,
    );

  const repeatCustomerPercentage =
    this.normalizeScore(
      performance.repeatCustomerPercentage,
    );

  if (responseTimeHours > 24) {
    score -= 35;
  } else if (responseTimeHours > 12) {
    score -= 25;
  } else if (responseTimeHours > 6) {
    score -= 15;
  } else if (responseTimeHours > 3) {
    score -= 8;
  }

  if (averageDeliveryDays > 10) {
    score -= 20;
  } else if (averageDeliveryDays > 7) {
    score -= 12;
  } else if (averageDeliveryDays > 5) {
    score -= 6;
  }

  score -=
    complaintPercentage * 0.5;

  score +=
    repeatCustomerPercentage * 0.25;

  return this.normalizeScore(score);

}

/**
 * ==========================================================
 * Calculate Overall Score
 * ==========================================================
 */

private calculateOverallScore(
  trustScore: number,
  pricingScore: number,
  experienceScore: number,
  fleetScore: number,
  responseScore: number,
): number {

  const overall =

    trustScore * 0.30 +

    pricingScore * 0.20 +

    experienceScore * 0.20 +

    fleetScore * 0.10 +

    responseScore * 0.20;

  return this.normalizeScore(overall);

}
/**
 * ==========================================================
 * Evaluate Vendor
 * ==========================================================
 */

public async evaluateVendor(
  request: VendorAIRequest,
  profile: VendorProfile,
  experience: VendorExperience,
  ratings: VendorRatings,
  pricing: VendorPricing,
  compliance: VendorCompliance,
  fleet: VendorFleet,
  performance: VendorPerformance,
): Promise<VendorAIResponse> {

  try {

    this.validateRequest(request);

    const cached =
      await this.getCachedEvaluation(
        request.referenceId,
        request.vendorId,
      );

    if (cached) {

      aiLogger.info({

        timestamp: new Date(),

        module: AILogModule.VENDOR,

        level: AILogLevel.INFO,

        provider: this.provider,

        message:
          "Vendor AI response returned from cache.",

      });

      return cached;

    }

    const trustScore =
      this.calculateTrustScore(
        experience,
        compliance,
        ratings,
      );

    const pricingScore =
      this.calculatePricingScore(
        pricing,
      );

    const experienceScore =
      this.calculateExperienceScore(
        experience,
      );

    const fleetScore =
      this.calculateFleetScore(
        fleet,
      );

    const responseScore =
      this.calculateResponseScore(
        performance,
      );

    const overallScore =
      this.calculateOverallScore(
        trustScore,
        pricingScore,
        experienceScore,
        fleetScore,
        responseScore,
      );

    let recommendation =
      VendorRecommendation.AVERAGE;

    if (overallScore >= 90) {

      recommendation =
        VendorRecommendation.HIGHLY_RECOMMENDED;

    } else if (overallScore >= 75) {

      recommendation =
        VendorRecommendation.RECOMMENDED;

    } else if (overallScore < 50) {

      recommendation =
        VendorRecommendation.NOT_RECOMMENDED;

    }

    const recommendedVendor: VendorAIScore = {

      vendorId: profile.vendorId,

      trustScore,

      pricingScore,

      experienceScore,

      serviceQualityScore: fleetScore,

      responseScore,

      availabilityScore: 100,

      overallScore,

      recommendation,

    };

    const result: VendorRecommendationResult = {

      referenceId: request.referenceId,

      leadId: request.leadId,

      generatedAt: new Date(),

      recommendedVendor,

      alternativeVendors: [],

      strengths: [],

      weaknesses: [],

      warnings: [],

      recommendationReasons: [],

      businessInsights: [],

      fraudRisk: {

        score: 0,

        level: "LOW",

        reasons: [],

      },

      statistics: {

        totalBookings:
          experience.totalBookings,

        successfulBookings:
          experience.successfulBookings,

        cancelledBookings:
          experience.cancelledBookings,

        damagedClaims:
          experience.damagedClaims,

        averageQuotation:
          pricing.averageQuotation,

        averageResponseHours:
          performance.responseTimeHours,

      },

      prediction: {

        expectedDeliveryDays:
          performance.averageDeliveryDays,

        expectedCustomerRating:
          ratings.customerRating ?? 0,

        expectedSuccessProbability:
          overallScore,

      },

      audit: {

        requestId:
          request.referenceId,

        provider:
          this.provider,

        model: "Vendor AI",

        generatedAt:
          new Date(),

        promptTokens: 0,

        completionTokens: 0,

        totalTokens: 0,

        estimatedCost: 0,

      },

    };

    const response: VendorAIResponse = {

      success: true,

      message:
        "Vendor evaluation completed successfully.",

      data: result,

    };

    await this.cacheEvaluation(
      request.referenceId,
      request.vendorId,
      response,
    );

    return response;

  } catch (error) {

    aiLogger.error({

      timestamp: new Date(),

      module: AILogModule.VENDOR,

      level: AILogLevel.ERROR,

      provider: this.provider,

      message:
        "Vendor evaluation failed.",

      error,

    });

    return this.emptyResponse(

      error instanceof Error
        ? error.message
        : "Vendor evaluation failed.",

    );

  }

}
}

/**
 * ============================================================
 * Singleton Export
 * ============================================================
 */

export const vendorAIService =
  new VendorAIService();