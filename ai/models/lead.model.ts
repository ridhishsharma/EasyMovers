/**
 * ============================================================
 * Easy Movers AI Platform
 * Lead Intelligence Models
 * ============================================================
 *
 * File
 * ----
 * ai/models/lead.model.ts
 *
 * Purpose
 * -------
 * Defines all Lead AI interfaces.
 *
 * Used By
 * -------
 * ✓ Lead AI Service
 * ✓ CRM
 * ✓ Sales Dashboard
 * ✓ API
 * ✓ Analytics
 *
 * ============================================================
 */

/**
 * ============================================================
 * Lead Source
 * ============================================================
 */

export enum LeadSource {

  WEBSITE = "website",

  MOBILE_APP = "mobile_app",

  WHATSAPP = "whatsapp",

  TELEPHONE = "telephone",

  CORPORATE = "corporate",

  FRANCHISE = "franchise",

  FACEBOOK = "facebook",

  INSTAGRAM = "instagram",

  GOOGLE = "google",

  REFERRAL = "referral",

  WALK_IN = "walk_in",

}

/**
 * ============================================================
 * Lead Segment
 * ============================================================
 */

export enum LeadSegment {

  INDIVIDUAL = "individual",

  FAMILY = "family",

  STUDENT = "student",

  CORPORATE = "corporate",

  GOVERNMENT = "government",

  SME = "sme",

  ENTERPRISE = "enterprise",

}

/**
 * ============================================================
 * Lead Priority
 * ============================================================
 */

export enum LeadPriority {

  LOW = "low",

  NORMAL = "normal",

  HIGH = "high",

  URGENT = "urgent",

}

/**
 * ============================================================
 * Lead Probability
 * ============================================================
 */

export enum LeadProbability {

  VERY_LOW = "very_low",

  LOW = "low",

  MEDIUM = "medium",

  HIGH = "high",

  VERY_HIGH = "very_high",

}

/**
 * ============================================================
 * Follow Up Action
 * ============================================================
 */

export enum FollowUpAction {

  CALL_IMMEDIATELY = "call_immediately",

  CALL_TODAY = "call_today",

  CALL_TOMORROW = "call_tomorrow",

  SEND_WHATSAPP = "send_whatsapp",

  SEND_EMAIL = "send_email",

  WAIT = "wait",

}

/**
 * ============================================================
 * Customer Behaviour
 * ============================================================
 */

export enum CustomerBehaviour {

  HOT = "hot",

  WARM = "warm",

  COLD = "cold",

}

/**
 * ============================================================
 * AI Recommendation Type
 * ============================================================
 */

export enum RecommendationType {

  SALES = "sales",

  PRICING = "pricing",

  FOLLOWUP = "followup",

  MARKETING = "marketing",

}

/**
 * ============================================================
 * Lead Input
 * ============================================================
 */

export interface LeadAIRequest {
  requestId: string;
  referenceId: string;

  leadId: string;

  customerName: string;

  mobile: string;

  source: LeadSource;

  segment: LeadSegment;

  pickupCity: string;

  destinationCity: string;

  moveDate: Date;

  estimatedWeight: number;

  estimatedVolume: number;

  budget?: number;

  previousCustomer: boolean;

  corporateCustomer: boolean;

}

/**
 * ============================================================
 * Lead Score
 * ============================================================
 */

export interface LeadScore {

  score: number;

  probability: LeadProbability;

  priority: LeadPriority;

}

/**
 * ============================================================
 * Lead Recommendation
 * ============================================================
 */

export interface LeadRecommendation {

  action: FollowUpAction;

  reason: string;

  recommendationType: RecommendationType;

}
/**
 * ============================================================
 * Lead Risk Assessment
 * ============================================================
 */

export interface LeadRiskAssessment {

  riskScore: number;

  riskLevel: CustomerBehaviour;

  riskReason: string;

  requiresVerification: boolean;

  duplicateLead: boolean;

  fraudProbability: number;

}

/**
 * ============================================================
 * Lead Opportunity
 * ============================================================
 */

export interface LeadOpportunity {

  estimatedRevenue: number;

  expectedMargin: number;

  lifetimeValue: number;

  upsellProbability: number;

  crossSellProbability: number;

}

/**
 * ============================================================
 * Sales Script
 * ============================================================
 */

export interface SalesScript {

  greeting: string;

  openingStatement: string;

  valueProposition: string;

  objectionHandling: string[];

  closingStatement: string;

}

/**
 * ============================================================
 * Marketing Suggestion
 * ============================================================
 */

export interface MarketingSuggestion {

  campaignName: string;

  message: string;

  communicationChannel: string;

  recommendedOffer?: string;

}

/**
 * ============================================================
 * Call Recommendation
 * ============================================================
 */

export interface CallRecommendation {

  bestTime: string;

  estimatedDuration: number;

  action: FollowUpAction;

  remarks: string;

}

/**
 * ============================================================
 * Lead Insight
 * ============================================================
 */

export interface LeadInsight {

  title: string;

  description: string;

  importance: number;

}

/**
 * ============================================================
 * AI Prediction
 * ============================================================
 */

export interface LeadPrediction {

  bookingProbability: number;

  cancellationProbability: number;

  expectedDecisionDays: number;

  confidenceScore: number;

}

/**
 * ============================================================
 * AI Follow-up
 * ============================================================
 */

export interface LeadFollowUpPlan {

  firstFollowUp: string;

  secondFollowUp: string;

  thirdFollowUp: string;

  recommendedChannel: string;

}

/**
 * ============================================================
 * AI Summary
 * ============================================================
 */

export interface LeadAISummary {

  score: LeadScore;

  recommendation: LeadRecommendation;

  opportunity: LeadOpportunity;

  prediction: LeadPrediction;

  risk: LeadRiskAssessment;

}

/**
 * ============================================================
 * Complete AI Response
 * ============================================================
 */

export interface LeadAIResponse {

  requestId: string;

  referenceId: string;

  generatedAt: Date;

  summary: LeadAISummary;

  insights: LeadInsight[];

  followUp: LeadFollowUpPlan;

  salesScript: SalesScript;

  marketingSuggestion: MarketingSuggestion;

}

/**
 * ============================================================
 * Dashboard Card
 * ============================================================
 */

export interface LeadDashboardCard {

  referenceId: string;

  customerName: string;

  score: number;

  priority: LeadPriority;

  probability: LeadProbability;

  action: FollowUpAction;

}

/**
 * ============================================================
 * AI Statistics
 * ============================================================
 */

export interface LeadAIStatistics {

  totalLeadsAnalysed: number;

  averageScore: number;

  highPriorityLeads: number;

  convertedLeads: number;

  totalExpectedRevenue: number;

}

/**
 * ============================================================
 * Batch Processing
 * ============================================================
 */

export interface LeadBatchRequest {

  referenceIds: string[];

}

/**
 * ============================================================
 * Batch Response
 * ============================================================
 */

export interface LeadBatchResponse {

  total: number;

  completed: number;

  failed: number;

  results: LeadAIResponse[];

}

/**
 * ============================================================
 * Lead Category
 * ============================================================
 */

export enum LeadCategory {
  HOT = "HOT",
  WARM = "WARM",
  COLD = "COLD",
  CORPORATE = "CORPORATE",
  RETURNING = "RETURNING",
  HIGH_VALUE = "HIGH_VALUE",
}

/**
 * ============================================================
 * Customer Profile
 * ============================================================
 */

export interface LeadCustomerProfile {
  customerType: LeadSegment;
  previousCustomer: boolean;
  corporateCustomer: boolean;
  estimatedBudget?: number;
  estimatedWeight: number;
  estimatedVolume: number;
  pickupCity: string;
  destinationCity: string;
}

/**
 * ============================================================
 * Business Metrics
 * ============================================================
 */

export interface LeadBusinessMetrics {
  estimatedRevenue: number;
  estimatedMargin: number;
  expectedConversionRate: number;
  lifetimeValue: number;
  acquisitionCost?: number;
}

/**
 * ============================================================
 * AI Score
 * ============================================================
 */

export interface LeadAIScore {

  overallScore: number;

  priority: LeadPriority;

  probability: LeadProbability;

  category: LeadCategory;

  confidence: number;

}

/**
 * ============================================================
 * Lead Recommendation Result
 * ============================================================
 */

export interface LeadRecommendationResult {

  requestId: string;

  referenceId: string;

  score: LeadAIScore;

  recommendation: LeadRecommendation;

  customerProfile: LeadCustomerProfile;

  businessMetrics: LeadBusinessMetrics;

  generatedAt: Date;

}

/**
 * ============================================================
 * Lead Scoring Configuration
 * ============================================================
 */

export interface LeadScoringConfiguration {

  budgetWeight: number;

  volumeWeight: number;

  distanceWeight: number;

  customerWeight: number;

  corporateWeight: number;

  returningWeight: number;

  priorityWeight: number;

}

/**
 * ============================================================
 * Default Lead Scoring Configuration
 * ============================================================
 */

export const DEFAULT_LEAD_SCORING_CONFIGURATION: LeadScoringConfiguration = {

  budgetWeight: 20,

  volumeWeight: 15,

  distanceWeight: 15,

  customerWeight: 15,

  corporateWeight: 15,

  returningWeight: 10,

  priorityWeight: 10,

};

/**
 * ============================================================
 * AI Request Context
 * ============================================================
 */

export interface AIRequestContext {

  request: LeadAIRequest;

  lead: unknown;

  timestamp: Date;

}