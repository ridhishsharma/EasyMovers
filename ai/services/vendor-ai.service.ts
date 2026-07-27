/**
 * ============================================================
 * EasyMovers AI Platform
 * Vendor AI Service
 * ============================================================
 *
 * Purpose:
 * Coordinate the deterministic Vendor AI builders and return
 * one complete vendor evaluation result.
 *
 * This service does not duplicate scoring logic.
 * Each builder remains responsible for its own domain.
 * ============================================================
 */

import type {
  VendorAIRequest,
} from "@/ai/models/vendor.model";

import type {
  VendorSource,
} from "@/ai/types/vendor.types";

import {
  buildVendorProfile,
} from "@/ai/builders/vendor-profile.builder";

import {
  buildVendorExperience,
} from "@/ai/builders/vendor-experience.builder";

import {
  buildVendorRatings,
} from "@/ai/builders/vendor-ratings.builder";

import {
  buildVendorCapabilities,
} from "@/ai/builders/vendor-capabilities.builder";

import {
  buildVendorEligibility,
} from "@/ai/builders/vendor-eligibility.builder";

import {
  buildVendorScore,
} from "@/ai/builders/vendor-score.builder";

import {
  buildVendorRecommendation,
} from "@/ai/builders/vendor-recommendation.builder";

/**
 * Complete result produced by the Vendor AI Service.
 */
export interface VendorAIEvaluationResult {
  aiRequest: VendorAIRequest;

  vendorProfile:
    ReturnType<typeof buildVendorProfile>;

  vendorExperience:
    ReturnType<typeof buildVendorExperience>;

  vendorRatings:
    ReturnType<typeof buildVendorRatings>;

  vendorCapabilities:
    ReturnType<typeof buildVendorCapabilities>;

  vendorEligibility:
    ReturnType<typeof buildVendorEligibility>;

  vendorScore:
    ReturnType<typeof buildVendorScore> | null;

  vendorRecommendation:
    ReturnType<typeof buildVendorRecommendation> | null;
}

/**
 * Input required by the Vendor AI Service.
 */
export interface VendorAIEvaluationInput {
  aiRequest: VendorAIRequest;
  vendor: VendorSource;
}

/**
 * ============================================================
 * Vendor AI Service
 * ============================================================
 */
export class VendorAIService {
  /**
   * Evaluate one vendor for one lead or movement request.
   */
  public evaluateVendor(
    input: VendorAIEvaluationInput,
  ): VendorAIEvaluationResult {
    const {
      aiRequest,
      vendor,
    } = input;

    const vendorProfile =
      buildVendorProfile(vendor);

    const vendorExperience =
      buildVendorExperience(vendor);

    const vendorRatings =
      buildVendorRatings(vendor);

    const vendorCapabilities =
      buildVendorCapabilities(vendor);

    const vendorEligibility =
      buildVendorEligibility(
        vendor,
        {
          customerCity:
            aiRequest.customerCity,

          destinationCity:
            aiRequest.destinationCity,

          estimatedWeight:
            aiRequest.estimatedWeight,

          isCorporateMove:
            aiRequest.isCorporateMove ?? false,

          isPremiumMove:
            aiRequest.isPremiumMove ?? false,
        },
      );

    let vendorScore:
      ReturnType<typeof buildVendorScore> | null =
        null;

    let vendorRecommendation:
      ReturnType<
        typeof buildVendorRecommendation
      > | null = null;

    if (vendorEligibility.eligible) {
      vendorScore =
        buildVendorScore(
          vendorExperience,
          vendorRatings,
          vendorCapabilities,
        );

      vendorRecommendation =
        buildVendorRecommendation(
          vendorScore,
        );
    }

    return {
      aiRequest,

      vendorProfile,

      vendorExperience,

      vendorRatings,

      vendorCapabilities,

      vendorEligibility,

      vendorScore,

      vendorRecommendation,
    };
  }
}

/**
 * Singleton service instance.
 */
export const vendorAIService =
  new VendorAIService();