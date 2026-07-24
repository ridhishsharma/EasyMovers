/**
 * ============================================================
 * EasyMovers AI Platform
 * Lead AI Service
 * ============================================================
 *
 * File:
 * ai/services/lead-ai.service.ts
 *
 * Purpose:
 * Analyze, score, and recommend actions for customer leads.
 *
 * Development approach:
 * Add and compile one module at a time.
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

/**
 * ============================================================
 * Lead AI Service Configuration
 * ============================================================
 */

interface LeadAIServiceConfiguration {

  provider: AIProvider;

  cachePrefix: string;

  cacheDurationSeconds: number;

}

/**
 * ============================================================
 * Default Configuration
 * ============================================================
 */

const DEFAULT_LEAD_AI_SERVICE_CONFIGURATION:
  LeadAIServiceConfiguration = {

    provider: AIProvider.OPENAI,

    cachePrefix: "lead-ai",

    cacheDurationSeconds: 60 * 60,

  };

/**
 * ============================================================
 * Lead AI Health Result
 * ============================================================
 */

export interface LeadAIHealthResult {

  success: boolean;

  provider: AIProvider;

  service: string;

  version: string;

  checkedAt: Date;

  message: string;

}

/**
 * ============================================================
 * Initial Lead Analysis Result
 * ============================================================
 *
 * This is the first public service contract.
 * It will be extended when scoring and recommendations
 * are added.
 */

export interface LeadAnalysisResult {

  success: boolean;

  referenceId: string;

  message: string;

  generatedAt: Date;

}

/**
 * ============================================================
 * Lead AI Service
 * ============================================================
 */

export class LeadAIService {

  
  private readonly provider: AIProvider;

  private readonly cachePrefix: string;

  private readonly cacheDurationSeconds: number;

  /**
   * ==========================================================
   * Constructor
   * ==========================================================
   */

  constructor(
    configuration:
      Partial<LeadAIServiceConfiguration> = {},
  ) {

    const resolvedConfiguration = {

      ...DEFAULT_LEAD_AI_SERVICE_CONFIGURATION,

      ...configuration,

    };

    this.provider =
      resolvedConfiguration.provider;

    this.cachePrefix =
      resolvedConfiguration.cachePrefix;

    this.cacheDurationSeconds =
      resolvedConfiguration.cacheDurationSeconds;

        aiLogger.info({

      timestamp: new Date(),

      module: AILogModule.LEAD,

      level: AILogLevel.INFO,

      provider: this.provider,

      message:
        "Lead AI Service initialized.",

      metadata: {

        cachePrefix:
          this.cachePrefix,

        cacheDurationSeconds:
          this.cacheDurationSeconds,

      },

    });

  }

private createOpenAIClient() {

  if (!process.env.OPENAI_API_KEY) {

    throw new Error(
      "OPENAI_API_KEY is not configured.",
    );

  }

  const OpenAI = require("openai").default;

  return new OpenAI({

    apiKey: process.env.OPENAI_API_KEY,

  });

}
  /**
   * ==========================================================
   * Health Check
   * ==========================================================
   */

  public async healthCheck():
    Promise<LeadAIHealthResult> {

    try {

      const apiKeyAvailable =

        this.provider !== AIProvider.OPENAI ||

        Boolean(
          process.env.OPENAI_API_KEY,
        );

      if (!apiKeyAvailable) {

        return {

          success: false,

          provider:
            this.provider,

          service:
            "Lead AI Service",

          version:
            "1.0.0",

          checkedAt:
            new Date(),

          message:
            "OPENAI_API_KEY is not configured.",

        };

      }

      return {

        success: true,

        provider:
          this.provider,

        service:
          "Lead AI Service",

        version:
          "1.0.0",

        checkedAt:
          new Date(),

        message:
          "Lead AI Service is available.",

      };

    } catch (error) {

      aiLogger.error({

        timestamp:
          new Date(),

        module:
          AILogModule.LEAD,

        level:
          AILogLevel.ERROR,

        provider:
          this.provider,

        message:
          "Lead AI Service health check failed.",

        error,

      });

      return {

        success: false,

        provider:
          this.provider,

        service:
          "Lead AI Service",

        version:
          "1.0.0",

        checkedAt:
          new Date(),

        message:

          error instanceof Error

            ? error.message

            : "Unknown health-check error.",

      };

    }

  }

  /**
   * ==========================================================
   * Analyze Lead
   * ==========================================================
   *
   * Initial public entry point used by:
   *
   * app/api/ai/lead-source/route.ts
   *
   * Scoring, database context, cache, security, and provider
   * execution will be added in the next modules.
   */

  public async analyzeLead(
    referenceId: string,
  ): Promise<LeadAnalysisResult> {

    try {

      this.validateReferenceId(
        referenceId,
      );

      aiLogger.info({

        timestamp:
          new Date(),

        module:
          AILogModule.LEAD,

        level:
          AILogLevel.INFO,

        provider:
          this.provider,

        message:
          "Lead analysis started.",

        metadata: {

          referenceId,

        },

      });

      return {

        success: true,

        referenceId:
          referenceId.trim(),

        message:
          "Lead analysis request accepted.",

        generatedAt:
          new Date(),

      };

    } catch (error) {

      aiLogger.error({

        timestamp:
          new Date(),

        module:
          AILogModule.LEAD,

        level:
          AILogLevel.ERROR,

        provider:
          this.provider,

        message:
          "Lead analysis failed.",

        error,

        metadata: {

          referenceId,

        },

      });

      throw error;

    }

  }

  /**
   * ==========================================================
   * Validate Reference ID
   * ==========================================================
   */

  private validateReferenceId(
    referenceId: string,
  ): void {

    if (
      typeof referenceId !== "string" ||
      !referenceId.trim()
    ) {

      throw new Error(
        "Reference ID is required.",
      );

    }

  }

  /**
   * ==========================================================
   * Build Cache Key
   * ==========================================================
   */

  private buildCacheKey(
    referenceId: string,
  ): string {

    return [

      this.cachePrefix,

      referenceId.trim(),

    ].join(":");

  }

}

/**
 * ============================================================
 * Singleton Export
 * ============================================================
 */

export const leadAIService =
  new LeadAIService();