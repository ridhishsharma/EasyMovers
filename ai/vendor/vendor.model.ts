/**
 * ============================================================
 * Easy Movers AI Platform
 * Vendor AI Models
 * ============================================================
 *
 * File
 * ----
 * ai/vendor/vendor.model.ts
 *
 * Purpose
 * -------
 * Central data models for Vendor AI.
 *
 * Used By
 * -------
 * vendor-ai.service.ts
 * vendor-ranking.service.ts
 * app/api/ai/vendor/route.ts
 *
 * ============================================================
 */

/**
 * ============================================================
 * Vendor Status
 * ============================================================
 */

export enum VendorStatus {

  ACTIVE = "ACTIVE",

  INACTIVE = "INACTIVE",

  SUSPENDED = "SUSPENDED",

  PENDING = "PENDING",

}

/**
 * ============================================================
 * Vendor Category
 * ============================================================
 */

export enum VendorCategory {

  LOCAL = "LOCAL",

  REGIONAL = "REGIONAL",

  NATIONAL = "NATIONAL",

}

/**
 * ============================================================
 * AI Recommendation
 * ============================================================
 */

export enum VendorRecommendation {

  HIGHLY_RECOMMENDED = "HIGHLY_RECOMMENDED",

  RECOMMENDED = "RECOMMENDED",

  AVERAGE = "AVERAGE",

  NOT_RECOMMENDED = "NOT_RECOMMENDED",

}

/**
 * ============================================================
 * Vendor Request
 * ============================================================
 */

export interface VendorAIRequest {

  referenceId: string;

  leadId: string;

  vendorId: string;

  customerCity: string;

  destinationCity: string;

  moveDistance: number;

  estimatedWeight: number;

  moveDate: string;

isCorporateMove?: boolean;
isPremiumMove?: boolean;

}

/**
 * ============================================================
 * Vendor Profile
 * ============================================================
 */

export interface VendorProfile {

  vendorId: string;

  companyName: string;

  ownerName: string;

  registrationNumber?: string;

  gstNumber?: string;

  city: string;

  state: string;

  category: VendorCategory;

  status: VendorStatus;

  establishedYear?: number;

}

/**
 * ============================================================
 * Vendor Experience
 * ============================================================
 */

export interface VendorExperience {

  totalYears: number;

  totalBookings: number;

  successfulBookings: number;

  cancelledBookings: number;

  damagedClaims: number;

}

/**
 * ============================================================
 * Vendor Ratings
 * ============================================================
 */

export interface VendorRatings {

  googleRating?: number;

  platformRating?: number;

  customerRating?: number;

  reviewCount?: number;

}

/**
 * ============================================================
 * Vendor Pricing
 * ============================================================
 */

export interface VendorPricing {

  averageQuotation: number;

  minimumQuotation: number;

  maximumQuotation: number;

  lastQuotation: number;

}

/**
 * ============================================================
 * Vendor Compliance
 * ============================================================
 */

export interface VendorCompliance {

  gstVerified: boolean;

  aadhaarVerified: boolean;

  panVerified: boolean;

  insuranceAvailable: boolean;

  policeVerified: boolean;

}

/**
 * ============================================================
 * Vendor Fleet
 * ============================================================
 */

export interface VendorFleet {

  totalVehicles: number;

  miniTruck: number;

  pickupTruck: number;

  containerTruck: number;

  trailerTruck: number;

}

/**
 * ============================================================
 * Vendor Performance
 * ============================================================
 */

export interface VendorPerformance {

  responseTimeHours: number;

  averageDeliveryDays: number;

  complaintPercentage: number;

  repeatCustomerPercentage: number;

}
/**
 * ============================================================
 * Vendor Trust Score
 * ============================================================
 */

export interface VendorTrustScore {

  overallScore: number;

  experienceScore: number;

  complianceScore: number;

  customerSatisfactionScore: number;

  deliveryScore: number;

  documentScore: number;

}

/**
 * ============================================================
 * Vendor Risk Assessment
 * ============================================================
 */

export interface VendorRiskAssessment {

  riskScore: number;

  fraudRisk: number;

  cancellationRisk: number;

  complaintRisk: number;

  delayRisk: number;

  recommendation: VendorRecommendation;

}

/**
 * ============================================================
 * Vendor AI Score
 * ============================================================
 */

export interface VendorAIScore {

  vendorId: string;

  trustScore: number;

  pricingScore: number;

  experienceScore: number;

  serviceQualityScore: number;

  responseScore: number;

  availabilityScore: number;

  overallScore: number;

  recommendation: VendorRecommendation;

}

/**
 * ============================================================
 * Vendor Ranking
 * ============================================================
 */

export interface VendorRanking {

  vendorId: string;

  rank: number;

  score: number;

  reason: string;

}

/**
 * ============================================================
 * Vendor Recommendation Result
 * ============================================================
 */

export interface VendorRecommendationResult {

  referenceId: string;

  leadId: string;

  generatedAt: Date;

  recommendedVendor: VendorAIScore;

  alternativeVendors: VendorAIScore[];

}

/**
 * ============================================================
 * Vendor AI Response
 * ============================================================
 */

export interface VendorAIResponse {

  success: boolean;

  message: string;

  data?: VendorRecommendationResult;

}

/**
 * ============================================================
 * Vendor Dashboard Statistics
 * ============================================================
 */

export interface VendorDashboardStatistics {

  totalVendors: number;

  activeVendors: number;

  inactiveVendors: number;

  suspendedVendors: number;

  averageTrustScore: number;

  averagePricingScore: number;

  averageCustomerRating: number;

}

/**
 * ============================================================
 * Vendor Search Filter
 * ============================================================
 */

export interface VendorSearchFilter {

  city?: string;

  state?: string;

  category?: VendorCategory;

  minimumRating?: number;

  minimumTrustScore?: number;

  status?: VendorStatus;

}

/**
 * ============================================================
 * Vendor Ranking Configuration
 * ============================================================
 */

export interface VendorRankingConfiguration {

  experienceWeight: number;

  pricingWeight: number;

  trustWeight: number;

  responseWeight: number;

  customerRatingWeight: number;

}

/**
 * ============================================================
 * Default Vendor Ranking Configuration
 * ============================================================
 */

export const DEFAULT_VENDOR_RANKING_CONFIGURATION:

VendorRankingConfiguration = {

  experienceWeight: 25,

  pricingWeight: 20,

  trustWeight: 25,

  responseWeight: 15,

  customerRatingWeight: 15,

};

/**
 * ============================================================
 * Vendor AI Version
 * ============================================================
 */

export const VENDOR_AI_MODEL_VERSION =

  "1.0.0";

/**
 * ============================================================
 * Vendor Recommendation Reason
 * ============================================================
 */

export interface VendorRecommendationReason {

  title: string;

  description: string;

  scoreImpact: number;

}

/**
 * ============================================================
 * Vendor Warning
 * ============================================================
 */

export interface VendorWarning {

  severity:

    | "LOW"

    | "MEDIUM"

    | "HIGH"

    | "CRITICAL";

  title: string;

  description: string;

}

/**
 * ============================================================
 * Vendor Strength
 * ============================================================
 */

export interface VendorStrength {

  title: string;

  description: string;

  score: number;

}

/**
 * ============================================================
 * Vendor Weakness
 * ============================================================
 */

export interface VendorWeakness {

  title: string;

  description: string;

  scorePenalty: number;

}

/**
 * ============================================================
 * Vendor Business Insight
 * ============================================================
 */

export interface VendorBusinessInsight {

  title: string;

  description: string;

  priority:

    | "LOW"

    | "MEDIUM"

    | "HIGH";

}

/**
 * ============================================================
 * Vendor Fraud Risk
 * ============================================================
 */

export interface VendorFraudRisk {

  score: number;

  level:

    | "LOW"

    | "MEDIUM"

    | "HIGH";

  reasons: string[];

}

/**
 * ============================================================
 * Vendor Statistics
 * ============================================================
 */

export interface VendorStatistics {

  totalBookings: number;

  successfulBookings: number;

  cancelledBookings: number;

  damagedClaims: number;

  averageQuotation: number;

  averageResponseHours: number;

}

/**
 * ============================================================
 * Vendor Prediction
 * ============================================================
 */

export interface VendorPrediction {

  expectedDeliveryDays: number;

  expectedCustomerRating: number;

  expectedSuccessProbability: number;

}

/**
 * ============================================================
 * Vendor AI Audit
 * ============================================================
 */

export interface VendorAIAudit {

  requestId: string;

  provider: string;

  model: string;

  generatedAt: Date;

  promptTokens: number;

  completionTokens: number;

  totalTokens: number;

  estimatedCost: number;

}

/**
 * ============================================================
 * Extended Vendor Recommendation Result
 * ============================================================
 */

export interface VendorRecommendationResult {

  referenceId: string;

  leadId: string;

  generatedAt: Date;

  recommendedVendor: VendorAIScore;

  alternativeVendors: VendorAIScore[];

  strengths: VendorStrength[];

  weaknesses: VendorWeakness[];

  warnings: VendorWarning[];

  recommendationReasons: VendorRecommendationReason[];

  businessInsights: VendorBusinessInsight[];

  fraudRisk: VendorFraudRisk;

  statistics: VendorStatistics;

  prediction: VendorPrediction;

  audit: VendorAIAudit;

}

/**
 * ============================================================
 * Vendor AI Summary
 * ============================================================
 */

export interface VendorAISummary {

  totalEvaluatedVendors: number;

  highestScore: number;

  lowestScore: number;

  averageScore: number;

  recommendation: VendorRecommendation;

}

/**
 * ============================================================
 * Vendor AI Ranking Result
 * ============================================================
 */

export interface VendorRankingResult {

  referenceId: string;

  generatedAt: Date;

  vendors: VendorAIScore[];

  bestVendor: VendorAIScore;

  summary: VendorAISummary;

}

/**
 * ============================================================
 * Vendor AI Cache
 * ============================================================
 */

export interface VendorAICache {

  cacheKey: string;

  createdAt: Date;

  expiresAt: Date;

  data: VendorRecommendationResult;

}

/**
 * ============================================================
 * Vendor AI History
 * ============================================================
 */

export interface VendorAIHistory {

  requestId: string;

  referenceId: string;

  vendorId: string;

  provider: string;

  model: string;

  prompt: string;

  response: string;

  success: boolean;

  generatedAt: Date;

}

/**
 * ============================================================
 * Vendor AI Token Usage
 * ============================================================
 */

export interface VendorAITokenUsage {

  promptTokens: number;

  completionTokens: number;

  totalTokens: number;

  estimatedCost: number;

}

/**
 * ============================================================
 * Vendor AI Health
 * ============================================================
 */

export interface VendorAIHealth {

  provider: string;

  model: string;

  version: string;

  status:

    | "ONLINE"

    | "OFFLINE"

    | "DEGRADED";

  lastChecked: Date;

}

/**
 * ============================================================
 * Future Enhancements
 * ============================================================
 *
 * Phase 2
 * --------
 *
 * ✓ Dynamic Vendor Trust Engine
 * ✓ AI Fraud Detection
 * ✓ AI Price Prediction
 * ✓ Vendor Behaviour Analytics
 * ✓ AI Complaint Prediction
 * ✓ AI Route Performance
 * ✓ Vehicle Availability Prediction
 * ✓ AI Capacity Planning
 *
 * ============================================================
 */