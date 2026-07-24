/**
 * ============================================================
 * Easy Movers AI Platform
 * AI Token Management Service
 * ============================================================
 *
 * File
 * ----
 * ai/tokens/ai-token.service.ts
 *
 * Purpose
 * -------
 * Central AI Token Manager
 *
 * Responsibilities
 * ----------------
 * ✓ Count Tokens
 * ✓ Estimate Cost
 * ✓ Daily Usage
 * ✓ Monthly Usage
 * ✓ Provider Statistics
 * ✓ Spending Limits
 *
 * Future
 * ------
 * Prisma Database
 * Dashboard
 * Billing
 * Analytics
 *
 * ============================================================
 */

import { AIProvider } from "../config/ai.config";

import { AILogModule } from "../utils/ai-logger";

import { aiLogger } from "../utils/ai-logger";

import { AILogLevel } from "../utils/ai-logger";

/**
 * ============================================================
 * Token Record
 * ============================================================
 */

export interface AITokenRecord {

  requestId: string;

  provider: AIProvider;

  module: AILogModule;

  promptTokens: number;

  completionTokens: number;

  totalTokens: number;

  estimatedCost: number;

  createdAt: Date;

}

/**
 * ============================================================
 * Daily Statistics
 * ============================================================
 */

export interface DailyUsage {

  date: string;

  requests: number;

  totalTokens: number;

  totalCost: number;

}

/**
 * ============================================================
 * Monthly Statistics
 * ============================================================
 */

export interface MonthlyUsage {

  month: string;

  requests: number;

  totalTokens: number;

  totalCost: number;

}

/**
 * ============================================================
 * Provider Statistics
 * ============================================================
 */

export interface ProviderStatistics {

  provider: AIProvider;

  requests: number;

  totalTokens: number;

  totalCost: number;

}

/**
 * ============================================================
 * Cost Configuration
 * ============================================================
 */

export interface ProviderPricing {

  inputPerMillion: number;

  outputPerMillion: number;

}

/**
 * ============================================================
 * Default Pricing
 * ============================================================
 *
 * Approximate
 * Can be changed anytime.
 *
 */
const PROVIDER_PRICING: Record<AIProvider, ProviderPricing> = {

  [AIProvider.OPENAI]: {

    inputPerMillion: 5,

    outputPerMillion: 15,

  },

  [AIProvider.GEMINI]: {

    inputPerMillion: 3,

    outputPerMillion: 10,

  },

  [AIProvider.CLAUDE]: {

    inputPerMillion: 8,

    outputPerMillion: 24,

  },

  [AIProvider.AZURE_OPENAI]: {

    inputPerMillion: 5,

    outputPerMillion: 15,

  },

  [AIProvider.OLLAMA]: {

    inputPerMillion: 0,

    outputPerMillion: 0,

  },

  [AIProvider.CUSTOM]: {

    inputPerMillion: 0,

    outputPerMillion: 0,

  },

};

/**
 * ============================================================
 * Token Service
 * ============================================================
 */

export class AITokenService {

  /**
   * --------------------------------------------------------
   * Memory Storage
   * --------------------------------------------------------
   */

  private records:

    AITokenRecord[] = [];

  /**
   * ========================================================
   * Save Token Record
   * ========================================================
   */

  public async save(

    record: AITokenRecord

  ): Promise<void> {

    this.records.push(record);

    aiLogger.info({

      timestamp: new Date(),

      module: record.module,

      level: AILogLevel.INFO,

      provider: record.provider,

      requestId: record.requestId,

      tokensUsed: record.totalTokens,

      estimatedCost:

        record.estimatedCost,

      message:

        "AI token usage recorded.",

    });

  }

  /**
   * ========================================================
   * Estimate Cost
   * ========================================================
   */

  public estimateCost(

    provider: AIProvider,

    promptTokens: number,

    completionTokens: number

  ): number {

    const pricing =

      PROVIDER_PRICING[provider];

    const inputCost =

      (promptTokens / 1000000) *

      pricing.inputPerMillion;

    const outputCost =

      (completionTokens / 1000000) *

      pricing.outputPerMillion;

    return Number(

      (

        inputCost +

        outputCost

      ).toFixed(6)

    );

  }

  /**
   * ========================================================
   * Total Requests
   * ========================================================
   */

  public totalRequests(): number {

    return this.records.length;

  }

  /**
   * ========================================================
   * Total Tokens
   * ========================================================
   */

  public totalTokens(): number {

    return this.records.reduce(

      (sum, record) =>

        sum +

        record.totalTokens,

      0

    );

  }
  /**
   * ========================================================
   * Total Cost
   * ========================================================
   */

  public totalCost(): number {

    return Number(

      this.records

        .reduce(

          (sum, record) =>

            sum +

            record.estimatedCost,

          0

        )

        .toFixed(6)

    );

  }

  /**
   * ========================================================
   * Daily Usage
   * ========================================================
   */

  public dailyUsage(

    date: Date = new Date()

  ): DailyUsage {

    const day =

      date.toISOString().substring(0, 10);

    const records =

      this.records.filter(

        (r) =>

          r.createdAt

            .toISOString()

            .substring(0, 10) === day

      );

    return {

      date: day,

      requests: records.length,

      totalTokens: records.reduce(

        (sum, r) =>

          sum + r.totalTokens,

        0

      ),

      totalCost: Number(

        records

          .reduce(

            (sum, r) =>

              sum +

              r.estimatedCost,

            0

          )

          .toFixed(6)

      ),

    };

  }

  /**
   * ========================================================
   * Monthly Usage
   * ========================================================
   */

  public monthlyUsage(

    date: Date = new Date()

  ): MonthlyUsage {

    const month =

      date

        .toISOString()

        .substring(0, 7);

    const records =

      this.records.filter(

        (r) =>

          r.createdAt

            .toISOString()

            .substring(0, 7) === month

      );

    return {

      month,

      requests: records.length,

      totalTokens: records.reduce(

        (sum, r) =>

          sum + r.totalTokens,

        0

      ),

      totalCost: Number(

        records

          .reduce(

            (sum, r) =>

              sum +

              r.estimatedCost,

            0

          )

          .toFixed(6)

      ),

    };

  }

  /**
   * ========================================================
   * Provider Statistics
   * ========================================================
   */

  public providerStatistics(

    provider: AIProvider

  ): ProviderStatistics {

    const records =

      this.records.filter(

        (r) =>

          r.provider === provider

      );

    return {

      provider,

      requests: records.length,

      totalTokens: records.reduce(

        (sum, r) =>

          sum + r.totalTokens,

        0

      ),

      totalCost: Number(

        records

          .reduce(

            (sum, r) =>

              sum +

              r.estimatedCost,

            0

          )

          .toFixed(6)

      ),

    };

  }

  /**
   * ========================================================
   * Get All Records
   * ========================================================
   */

  public recordsList()

    : AITokenRecord[] {

    return this.records;

  }

  /**
   * ========================================================
   * Latest Records
   * ========================================================
   */

  public latest(

    limit = 20

  ): AITokenRecord[] {

    return [...this.records]

      .reverse()

      .slice(0, limit);

  }

  /**
   * ========================================================
   * Find Request
   * ========================================================
   */

  public find(

    requestId: string

  ): AITokenRecord | null {

    const record =

      this.records.find(

        (r) =>

          r.requestId === requestId

      );

    return record ?? null;

  }

  /**
   * ========================================================
   * Delete Request
   * ========================================================
   */

  public delete(

    requestId: string

  ): boolean {

    const index =

      this.records.findIndex(

        (r) =>

          r.requestId === requestId

      );

    if (index === -1) {

      return false;

    }

    this.records.splice(index, 1);

    return true;

  }

  /**
   * ========================================================
   * Clear Records
   * ========================================================
   */

  public clear(): void {

    this.records = [];

  }

  /**
   * ========================================================
   * Export
   * ========================================================
   */

  public export(): string {

    return JSON.stringify(

      this.records,

      null,

      2

    );

  }
  /**
   * ========================================================
   * Import Records
   * ========================================================
   */

  public import(

    json: string

  ): void {

    try {

      const records = JSON.parse(json);

      this.records = records.map(

        (record: any) => ({

          ...record,

          createdAt: new Date(record.createdAt),

        })

      );

    } catch {

      aiLogger.warning({

        timestamp: new Date(),

        module: AILogModule.LEAD,

        level: AILogLevel.WARNING,

        provider: AIProvider.OPENAI,

        message:

          "Unable to import AI token history.",

      });

    }

  }

  /**
   * ========================================================
   * Daily Budget Check
   * ========================================================
   */

  public isDailyBudgetExceeded(

    limitUSD: number

  ): boolean {

    const usage =

      this.dailyUsage();

    return usage.totalCost >= limitUSD;

  }

  /**
   * ========================================================
   * Monthly Budget Check
   * ========================================================
   */

  public isMonthlyBudgetExceeded(

    limitUSD: number

  ): boolean {

    const usage =

      this.monthlyUsage();

    return usage.totalCost >= limitUSD;

  }

  /**
   * ========================================================
   * Remaining Daily Budget
   * ========================================================
   */

  public remainingDailyBudget(

    limitUSD: number

  ): number {

    const usage =

      this.dailyUsage();

    return Number(

      Math.max(

        limitUSD - usage.totalCost,

        0

      ).toFixed(6)

    );

  }

  /**
   * ========================================================
   * Remaining Monthly Budget
   * ========================================================
   */

  public remainingMonthlyBudget(

    limitUSD: number

  ): number {

    const usage =

      this.monthlyUsage();

    return Number(

      Math.max(

        limitUSD - usage.totalCost,

        0

      ).toFixed(6)

    );

  }

  /**
   * ========================================================
   * Generate Budget Alert
   * ========================================================
   */

  public budgetAlert(

    limitUSD: number

  ): string | null {

    const usage =

      this.monthlyUsage();

    const percentage =

      (usage.totalCost / limitUSD) * 100;

    if (percentage >= 100) {

      return "Monthly AI budget exceeded.";

    }

    if (percentage >= 90) {

      return "Monthly AI budget reached 90%.";

    }

    if (percentage >= 75) {

      return "Monthly AI budget reached 75%.";

    }

    return null;

  }

  /**
   * ========================================================
   * Future Prisma Save
   * ========================================================
   *
   * prisma.aiTokenUsage.create()
   *
   */

  private async saveToDatabase(

    record: AITokenRecord

  ): Promise<void> {

    /**
     * Future Implementation
     */

    return;

  }

  /**
   * ========================================================
   * Future Prisma Read
   * ========================================================
   */

  private async loadFromDatabase()

    : Promise<void> {

    /**
     * Future Implementation
     */

    return;

  }

  /**
   * ========================================================
   * Reset Statistics
   * ========================================================
   */

  public reset(): void {

    this.records = [];

    aiLogger.info({

      timestamp: new Date(),

      module: AILogModule.LEAD,

      level: AILogLevel.INFO,

      provider: AIProvider.OPENAI,

      message:

        "AI token statistics reset.",

    });

  }

}

/**
 * ============================================================
 * Singleton
 * ============================================================
 */

export const aiTokenService =

  new AITokenService();

/**
 * ============================================================
 * Default Budget
 * ============================================================
 */

export const DEFAULT_DAILY_AI_BUDGET = 10;

export const DEFAULT_MONTHLY_AI_BUDGET = 250;

/**
 * ============================================================
 * Version
 * ============================================================
 */

export const AI_TOKEN_SERVICE_VERSION =

  "1.0.0";