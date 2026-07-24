/**
 * ============================================================
 * Easy Movers AI Platform Configuration
 * ============================================================
 *
 * File:
 * ai/config/ai.config.ts
 *
 * Purpose
 * -------
 * Central configuration for every AI module.
 *
 * No business logic should be written in this file.
 *
 * Used By
 * -------
 * ✓ Lead AI
 * ✓ Inventory AI
 * ✓ Vendor AI
 * ✓ Quotation AI
 * ✓ Marketing AI
 * ✓ Chat AI
 * ✓ Fraud Detection
 * ✓ Route Optimization
 *
 * ============================================================
 */

export const AI_PLATFORM_NAME = "Easy Movers AI";

export const AI_PLATFORM_VERSION = "1.0.0";

export const AI_DEFAULT_TIMEOUT = 60000;

export const AI_DEFAULT_RETRIES = 3;

export const AI_DEFAULT_RETRY_DELAY = 2000;

export const AI_CACHE_TTL = 1000 * 60 * 30;

export const AI_HISTORY_LIMIT = 25;

export const AI_MAX_CONCURRENT_REQUESTS = 5;

export const AI_LOG_RETENTION_DAYS = 90;

/**
 * ============================================================
 * AI Providers
 * ============================================================
 */

export enum AIProvider {

  OPENAI = "openai",

  GEMINI = "gemini",

  CLAUDE = "claude",

  AZURE_OPENAI = "azure-openai",

  OLLAMA = "ollama",

  CUSTOM = "custom",

}

/**
 * ============================================================
 * AI Models
 * ============================================================
 */

export enum AIModel {

  GPT_4_1 = "gpt-4.1",

  GPT_4O = "gpt-4o",

  GPT_4O_MINI = "gpt-4o-mini",

  GPT_5 = "gpt-5",

  GPT_5_MINI = "gpt-5-mini",

  GEMINI_PRO = "gemini-pro",

  GEMINI_FLASH = "gemini-flash",

  CLAUDE_SONNET = "claude-sonnet",

  CLAUDE_OPUS = "claude-opus",

}

/**
 * ============================================================
 * AI Modules
 * ============================================================
 */

export enum AIModule {

  LEAD = "lead",

  INVENTORY = "inventory",

  QUOTATION = "quotation",

  PRICING = "pricing",

  VENDOR = "vendor",

  ROUTE = "route",

  CHATBOT = "chatbot",

  MARKETING = "marketing",

  FRAUD = "fraud",

  ANALYTICS = "analytics",

}

/**
 * ============================================================
 * AI Environment
 * ============================================================
 */

export enum AIEnvironment {

  DEVELOPMENT = "development",

  TEST = "test",

  STAGING = "staging",

  PRODUCTION = "production",

}

/**
 * ============================================================
 * AI Request Priority
 * ============================================================
 */

export enum AIRequestPriority {

  LOW = "low",

  NORMAL = "normal",

  HIGH = "high",

  CRITICAL = "critical",

}

/**
 * ============================================================
 * AI Response Status
 * ============================================================
 */

export enum AIResponseStatus {

  SUCCESS = "success",

  FAILED = "failed",

  TIMEOUT = "timeout",

  RETRY = "retry",

  CACHED = "cached",

}

/**
 * ============================================================
 * Cost Tracking
 * ============================================================
 */

export interface AICostConfiguration {

  enabled: boolean;

  storeHistory: boolean;

  calculateTokens: boolean;

  monthlyBudget: number;

  warningThreshold: number;

}

/**
 * ============================================================
 * Cache Configuration
 * ============================================================
 */

export interface AICacheConfiguration {

  enabled: boolean;

  ttl: number;

  useRedis: boolean;

  keyPrefix: string;

}

/**
 * ============================================================
 * Logging Configuration
 * ============================================================
 */

export interface AILogConfiguration {

  enabled: boolean;

  savePrompt: boolean;

  saveResponse: boolean;

  saveTokens: boolean;

  saveExecutionTime: boolean;

  saveCost: boolean;

}

/**
 * ============================================================
 * Retry Configuration
 * ============================================================
 */

export interface AIRetryConfiguration {

  retries: number;

  delay: number;

  exponentialBackoff: boolean;

}

/**
 * ============================================================
 * Timeout Configuration
 * ============================================================
 */

export interface AITimeoutConfiguration {

  requestTimeout: number;

  streamTimeout: number;

}