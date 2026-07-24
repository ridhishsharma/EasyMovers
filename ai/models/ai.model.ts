/**
 * ============================================================
 * EasyMovers AI Platform
 * Central AI Models & Interfaces
 * ============================================================
 *
 * File:
 * ai/models/ai.model.ts
 *
 * Purpose:
 * Shared AI request / response models used by every AI module.
 *
 * Used By:
 * - Lead AI
 * - Vendor AI
 * - Pricing AI
 * - Fraud AI
 * - Chat AI
 * - Route Handlers
 * - Analytics
 *
 * Author:
 * EasyMovers AI Platform
 * ============================================================
 */

import {
  AIProvider,
  AIModel,
} from "../config/ai.config";

/* ============================================================
 * AI Token Usage
 * ============================================================
 */

export interface AIUsage {

  promptTokens: number;

  completionTokens: number;

  totalTokens: number;

  estimatedCost?: number;

  executionTimeMs?: number;

}

/* ============================================================
 * AI Request
 * ============================================================
 */

export interface AIRequest {

  prompt: string;

  systemPrompt?: string;

  temperature?: number;

  maxTokens?: number;

  provider?: AIProvider;

  model?: AIModel;

  metadata?: Record<string, unknown>;

}

/* ============================================================
 * Generic AI Response
 * ============================================================
 */

export interface AIResponse<T = unknown> {

  success: boolean;

  provider: AIProvider;

  model: AIModel;

  data: T;

  usage?: AIUsage;

  warnings?: string[];

  error?: string;

}

/* ============================================================
 * JSON Response
 * ============================================================
 */

export interface AIJSONResponse<T = unknown>
  extends AIResponse<T> {}

/* ============================================================
 * AI Validation Result
 * ============================================================
 */

export interface AIValidationResult {

  valid: boolean;

  score: number;

  warnings: string[];

  errors: string[];

}

/* ============================================================
 * AI Provider Response
 * ============================================================
 */

export interface AIProviderResponse {

  provider: AIProvider;

  model: AIModel;

  rawResponse: string;

  usage: AIUsage;

}

/* ============================================================
 * AI Cache Entry
 * ============================================================
 */

export interface AICacheEntry<T = unknown> {

  key: string;

  value: T;

  createdAt: Date;

  expiresAt: Date;

}

/* ============================================================
 * AI Execution Context
 * ============================================================
 */

export interface AIExecutionContext {

  userId?: string;

  leadId?: string;

  vendorId?: string;

  quotationId?: string;

  sessionId?: string;

  referenceId?: string;

  ipAddress?: string;

}
/* ============================================================
 * AI Retry Configuration
 * ============================================================
 */

export interface AIRetryConfiguration {

  maxRetries: number;

  retryDelayMs: number;

  exponentialBackoff: boolean;

}

/* ============================================================
 * AI Retry Result
 * ============================================================
 */

export interface AIRetryResult<T = unknown> {

  success: boolean;

  attempts: number;

  lastAttempt: Date;

  response?: T;

  error?: string;

}

/* ============================================================
 * AI Performance Metrics
 * ============================================================
 */

export interface AIPerformanceMetrics {

  requestId: string;

  provider: AIProvider;

  model: AIModel;

  startTime: Date;

  endTime: Date;

  executionTimeMs: number;

  tokenUsage: AIUsage;

  cacheHit: boolean;

}

/* ============================================================
 * AI Health Status
 * ============================================================
 */

export interface AIHealthStatus {

  provider: AIProvider;

  available: boolean;

  latencyMs: number;

  lastChecked: Date;

  message?: string;

}

/* ============================================================
 * AI Error Information
 * ============================================================
 */

export interface AIErrorInformation {

  provider: AIProvider;

  model?: AIModel;

  code?: string;

  message: string;

  stack?: string;

  timestamp: Date;

  recoverable: boolean;

}

/* ============================================================
 * AI Audit Record
 * ============================================================
 */

export interface AIAuditRecord {

  requestId: string;

  provider: AIProvider;

  model: AIModel;

  userId?: string;

  referenceId?: string;

  operation: string;

  success: boolean;

  executionTimeMs: number;

  createdAt: Date;

}

/* ============================================================
 * AI History Record
 * ============================================================
 */

export interface AIHistoryRecord<T = unknown> {

  id: string;

  provider: AIProvider;

  model: AIModel;

  request: AIRequest;

  response: AIResponse<T>;

  createdAt: Date;

}

/* ============================================================
 * AI Analytics Summary
 * ============================================================
 */

export interface AIAnalyticsSummary {

  totalRequests: number;

  successfulRequests: number;

  failedRequests: number;

  averageExecutionTimeMs: number;

  totalPromptTokens: number;

  totalCompletionTokens: number;

  totalCost: number;

}

/* ============================================================
 * AI Cost Breakdown
 * ============================================================
 */

export interface AICostBreakdown {

  provider: AIProvider;

  model: AIModel;

  inputCost: number;

  outputCost: number;

  totalCost: number;

}

/* ============================================================
 * AI Cache Statistics
 * ============================================================
 */

export interface AICacheStatistics {

  totalEntries: number;

  cacheHits: number;

  cacheMisses: number;

  hitRate: number;

  lastUpdated: Date;

}

/* ============================================================
 * AI Model Capability
 * ============================================================
 */

export interface AIModelCapability {

  provider: AIProvider;

  model: AIModel;

  supportsVision: boolean;

  supportsJSON: boolean;

  supportsStreaming: boolean;

  supportsFunctionCalling: boolean;

  maxContextTokens: number;

}
/* ============================================================
 * AI Request Priority
 * ============================================================
 */

export enum AIRequestPriority {

  LOW = "LOW",

  NORMAL = "NORMAL",

  HIGH = "HIGH",

  CRITICAL = "CRITICAL",

}

/* ============================================================
 * AI Execution Status
 * ============================================================
 */

export enum AIExecutionStatus {

  PENDING = "PENDING",

  RUNNING = "RUNNING",

  SUCCESS = "SUCCESS",

  FAILED = "FAILED",

  CANCELLED = "CANCELLED",

  TIMEOUT = "TIMEOUT",

}

/* ============================================================
 * AI Provider Configuration
 * ============================================================
 */

export interface AIProviderConfiguration {

  provider: AIProvider;

  enabled: boolean;

  defaultModel: AIModel;

  timeoutMs: number;

  retryConfiguration: AIRetryConfiguration;

}

/* ============================================================
 * AI Prompt Metadata
 * ============================================================
 */

export interface AIPromptMetadata {

  category: string;

  version: string;

  language?: string;

  createdBy?: string;

  tags?: string[];

}

/* ============================================================
 * AI Prompt Record
 * ============================================================
 */

export interface AIPromptRecord {

  id: string;

  name: string;

  prompt: string;

  systemPrompt?: string;

  metadata: AIPromptMetadata;

  createdAt: Date;

  updatedAt: Date;

}

/* ============================================================
 * AI Queue Item
 * ============================================================
 */

export interface AIQueueItem {

  id: string;

  priority: AIRequestPriority;

  request: AIRequest;

  status: AIExecutionStatus;

  createdAt: Date;

  startedAt?: Date;

  completedAt?: Date;

}

/* ============================================================
 * AI Queue Statistics
 * ============================================================
 */

export interface AIQueueStatistics {

  pending: number;

  running: number;

  completed: number;

  failed: number;

}

/* ============================================================
 * AI Streaming Chunk
 * ============================================================
 */

export interface AIStreamingChunk {

  index: number;

  content: string;

  completed: boolean;

}

/* ============================================================
 * AI Streaming Response
 * ============================================================
 */

export interface AIStreamingResponse {

  requestId: string;

  provider: AIProvider;

  model: AIModel;

  chunks: AIStreamingChunk[];

  usage?: AIUsage;

}

/* ============================================================
 * AI Provider Usage Summary
 * ============================================================
 */

export interface AIProviderUsageSummary {

  provider: AIProvider;

  requests: number;

  promptTokens: number;

  completionTokens: number;

  estimatedCost: number;

}

/* ============================================================
 * AI Model Usage Summary
 * ============================================================
 */

export interface AIModelUsageSummary {

  model: AIModel;

  requests: number;

  averageExecutionTime: number;

  averagePromptTokens: number;

  averageCompletionTokens: number;

}

/* ============================================================
 * AI Rate Limit
 * ============================================================
 */

export interface AIRateLimit {

  provider: AIProvider;

  requestsPerMinute: number;

  requestsPerHour: number;

  requestsPerDay: number;

}

/* ============================================================
 * AI Rate Limit Status
 * ============================================================
 */

export interface AIRateLimitStatus {

  provider: AIProvider;

  currentMinuteRequests: number;

  currentHourRequests: number;

  currentDayRequests: number;

  blocked: boolean;

}
/* ============================================================
 * AI Provider Fallback
 * ============================================================
 */

export interface AIProviderFallback {

  primaryProvider: AIProvider;

  fallbackProviders: AIProvider[];

  enabled: boolean;

}

/* ============================================================
 * AI Execution Result
 * ============================================================
 */

export interface AIExecutionResult<T = unknown> {

  requestId: string;

  provider: AIProvider;

  model: AIModel;

  status: AIExecutionStatus;

  startedAt: Date;

  completedAt?: Date;

  durationMs?: number;

  response?: AIResponse<T>;

  error?: AIErrorInformation;

}

/* ============================================================
 * AI Prompt Version
 * ============================================================
 */

export interface AIPromptVersion {

  version: string;

  prompt: string;

  systemPrompt?: string;

  createdAt: Date;

  createdBy?: string;

  active: boolean;

}

/* ============================================================
 * AI Conversation Message
 * ============================================================
 */

export interface AIConversationMessage {

  role: "system" | "user" | "assistant";

  content: string;

  createdAt: Date;

}

/* ============================================================
 * AI Conversation
 * ============================================================
 */

export interface AIConversation {

  id: string;

  provider: AIProvider;

  model: AIModel;

  messages: AIConversationMessage[];

  createdAt: Date;

  updatedAt: Date;

}

/* ============================================================
 * AI Confidence Score
 * ============================================================
 */

export interface AIConfidenceScore {

  score: number;

  explanation?: string;

}

/* ============================================================
 * AI Recommendation
 * ============================================================
 */

export interface AIRecommendation {

  title: string;

  description: string;

  confidence: AIConfidenceScore;

}

/* ============================================================
 * AI Recommendation Response
 * ============================================================
 */

export interface AIRecommendationResponse {

  recommendations: AIRecommendation[];

  generatedAt: Date;

}

/* ============================================================
 * AI Validation Error
 * ============================================================
 */

export interface AIValidationError {

  field: string;

  message: string;

}

/* ============================================================
 * AI Validation Response
 * ============================================================
 */

export interface AIValidationResponse {

  valid: boolean;

  errors: AIValidationError[];

  warnings: string[];

}

/* ============================================================
 * AI Batch Request
 * ============================================================
 */

export interface AIBatchRequest {

  requests: AIRequest[];

}

/* ============================================================
 * AI Batch Response
 * ============================================================
 */

export interface AIBatchResponse<T = unknown> {

  responses: AIResponse<T>[];

  totalRequests: number;

  successfulRequests: number;

  failedRequests: number;

}

/**
 * ============================================================
 * AI Request Context
 * ============================================================
 */

export interface AIRequestContext<TRequest = unknown, TEntity = unknown> {

  request: TRequest;

  entity: TEntity;

  timestamp: Date;

  requestId: string;

  referenceId: string;

}

/**
 * ============================================================
 * AI Execution Result
 * ============================================================
 */

export interface AIExecutionResult<T = unknown> {

  success: boolean;

  provider: AIProvider;

  requestId: string;

  executionTime: number;

  tokensUsed: number;

  estimatedCost: number;

  data: T;

  rawResponse?: string;

error?: AIErrorInformation;

}

/**
 * ============================================================
 * AI Provider Response
 * ============================================================
 */

export interface AIProviderResponse {

  success: boolean;

  model: AIModel;

  provider: AIProvider;

  content: string;

  promptTokens: number;

  completionTokens: number;

  totalTokens: number;

  finishReason?: string;

  executionTime: number;

}

/**
 * ============================================================
 * AI Model Response
 * ============================================================
 */

export interface AIModelResponse<T = unknown> {

  provider: AIProvider;

  model: string;

  parsed: T;

  raw: string;

}

/**
 * ============================================================
 * AI Service Health
 * ============================================================
 */

export interface AIServiceHealth {

  provider: AIProvider;

  status: AIHealthStatus;

  responseTime: number;

  lastChecked: Date;

  message?: string;

}

/**
 * ============================================================
 * AI Usage Summary
 * ============================================================
 */

export interface AIUsageSummary {

  totalRequests: number;

  successfulRequests: number;

  failedRequests: number;

  totalTokens: number;

  totalCost: number;

  averageExecutionTime: number;

}

/**
 * ============================================================
 * AI Validation Result
 * ============================================================
 */

export interface AIValidationResult {

  valid: boolean;

  warnings: string[];

  errors: string[];

}

/**
 * ============================================================
 * AI Batch Request
 * ============================================================
 */

export interface AIBatchRequest<T = unknown> {

  requestId: string;

  provider: AIProvider;

  items: T[];

  createdAt: Date;

}

/**
 * ============================================================
 * AI Batch Response
 * ============================================================
 */

export interface AIBatchResult<T = unknown> {

  requestId: string;

  totalItems: number;

  processedItems: number;

  failedItems: number;

  results: T[];

}

/* ============================================================
 * AI Embedding Request
 * ============================================================
 */

export interface AIEmbeddingRequest {

  input: string;

  provider: AIProvider;

  model: AIModel;

}

/* ============================================================
 * AI Embedding Response
 * ============================================================
 */

export interface AIEmbeddingResponse {

  embedding: number[];

  dimensions: number;

  usage?: AIUsage;

}
/* ============================================================
 * EasyMovers Domain AI Models
 * Shared Across Lead AI / Vendor AI / Pricing AI
 * ============================================================
 */

/* ============================================================
 * Lead AI Request
 * ============================================================
 */

export interface LeadAIRequest {

  leadId: string;

  referenceId: string;

  customerName?: string;

  movingDate?: Date;

  pickupCity?: string;

  deliveryCity?: string;

  goodsDescription?: string;

  estimatedWeight?: number;

  remarks?: string;

}

/* ============================================================
 * Lead AI Summary
 * ============================================================
 */

export interface LeadAISummary {

  leadScore: number;

  priority: "LOW" | "MEDIUM" | "HIGH";

  conversionProbability: number;

  expectedRevenue: number;

}

/* ============================================================
 * Lead AI Response
 * ============================================================
 */

export interface LeadAIResponse {

  summary: LeadAISummary;

  recommendations: AIRecommendation[];

  insights: BusinessInsight[];

}

/* ============================================================
 * Vendor AI Request
 * ============================================================
 */

export interface VendorAIRequest {

  vendorId: string;

  quotationId?: string;

  leadId?: string;

  referenceId?: string;

}

/* ============================================================
 * Vendor Overall Score
 * ============================================================
 */

export interface VendorAIScore {

  overallScore: number;

  pricingScore: number;

  experienceScore: number;

  fleetScore: number;

  responseScore: number;

  trustScore: number;

}

/* ============================================================
 * Vendor Recommendation
 * ============================================================
 */

export interface VendorRecommendation {

  vendorId: string;

  vendorCode: string;

  companyName: string;

  score: VendorAIScore;

  reasons: RecommendationReason[];

}

/* ============================================================
 * Pricing AI Request
 * ============================================================
 */

export interface PricingAIRequest {

  leadId: string;

  vendorId: string;

  quotationAmount: number;

}

/* ============================================================
 * Pricing Recommendation
 * ============================================================
 */

export interface PricingRecommendation {

  suggestedPrice: number;

  minimumPrice: number;

  maximumPrice: number;

  confidence: number;

}

/* ============================================================
 * Fraud Risk
 * ============================================================
 */

export interface FraudRiskAssessment {

  riskScore: number;

  level: "LOW" | "MEDIUM" | "HIGH";

  reasons: string[];

}

/* ============================================================
 * Business Insight
 * ============================================================
 */

export interface BusinessInsight {

  title: string;

  description: string;

  importance: number;

}

/* ============================================================
 * Recommendation Reason
 * ============================================================
 */

export interface RecommendationReason {

  category: string;

  message: string;

  scoreImpact: number;

}

/* ============================================================
 * AI Comparison Result
 * ============================================================
 */

export interface AIComparisonResult {

  winnerVendorId: string;

  comparedVendors: number;

  comparisonSummary: string;

}

/* ============================================================
 * Generic Pagination
 * ============================================================
 */

export interface AIPagination {

  page: number;

  pageSize: number;

  totalRecords: number;

  totalPages: number;

}

/* ============================================================
 * Generic List Response
 * ============================================================
 */

export interface AIListResponse<T> {

  items: T[];

  pagination?: AIPagination;

}

/* ============================================================
 * Generic Operation Result
 * ============================================================
 */

export interface AIOperationResult {

  success: boolean;

  message?: string;

  error?: string;

}

/* ============================================================
 * AI Metadata
 * ============================================================
 */

export interface AIMetadata {

  requestId: string;

  provider: AIProvider;

  model: AIModel;

  generatedAt: Date;

  generatedBy?: string;

}

/* ============================================================
 * AI Version Information
 * ============================================================
 */

export interface AIVersionInfo {

  platform: string;

  version: string;

  buildDate?: Date;

}

/* ============================================================
 * AI Constants
 * ============================================================
 */

export const AI_MODEL_VERSION = "1.0.0";

export const AI_PLATFORM_NAME = "EasyMovers AI Platform";

/* ============================================================
 * End of Shared AI Models
 * ============================================================
 *
 * This file contains ONLY reusable AI contracts shared by
 * all AI modules.
 *
 * Domain-specific models belong in:
 *
 *  ai/models/lead.model.ts
 *  ai/models/vendor.model.ts
 *  ai/models/pricing.model.ts
 *  ai/models/fraud.model.ts
 *  ai/models/analytics.model.ts
 *
 * ============================================================
 */