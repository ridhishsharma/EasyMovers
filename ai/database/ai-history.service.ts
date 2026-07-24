/**
 * ============================================================
 * Easy Movers AI Platform
 * AI History Service
 * ============================================================
 *
 * File
 * ----
 * ai/database/ai-history.service.ts
 *
 * Purpose
 * -------
 * Stores AI execution history.
 *
 * Responsibilities
 * ----------------
 * ✓ Store Prompt
 * ✓ Store Response
 * ✓ Store Provider
 * ✓ Store Module
 * ✓ Store Tokens
 * ✓ Store Cost
 * ✓ Store Execution Time
 * ✓ Store Reference Id
 *
 * Future
 * ------
 * Prisma Model
 * AIHistory
 *
 * ============================================================
 */

import { AIProvider } from "../config/ai.config";

import { AILogModule } from "../utils/ai-logger";

import { aiLogger } from "../utils/ai-logger";

import { AILogLevel } from "../utils/ai-logger";

/**
 * ============================================================
 * AI History Record
 * ============================================================
 */

export interface AIHistoryRecord {

  id: string;

  requestId: string;

  referenceId?: string;

  module: AILogModule;

  provider: AIProvider;

  prompt: string;

  response: string;

  tokensUsed: number;

  estimatedCost: number;

  executionTime: number;

  success: boolean;

  createdAt: Date;

}

/**
 * ============================================================
 * AI Usage Statistics
 * ============================================================
 */

export interface AIUsageStatistics {

  totalRequests: number;

  successfulRequests: number;

  failedRequests: number;

  totalTokens: number;

  totalCost: number;

  averageExecutionTime: number;

}

/**
 * ============================================================
 * AI Search Filter
 * ============================================================
 */

export interface AIHistoryFilter {

  module?: AILogModule;

  provider?: AIProvider;

  referenceId?: string;

  requestId?: string;

  success?: boolean;

}

/**
 * ============================================================
 * AI History Service
 * ============================================================
 */

export class AIHistoryService {

  /**
   * --------------------------------------------------------
   * Temporary Memory Storage
   * --------------------------------------------------------
   *
   * Later this will be Prisma.
   *
   */

  private history: AIHistoryRecord[] = [];

  /**
   * ========================================================
   * Save Record
   * ========================================================
   */

  public async save(

    record: AIHistoryRecord

  ): Promise<void> {

    this.history.push(record);

aiLogger.info({

  timestamp: new Date(),

  module: record.module,

  level: AILogLevel.INFO,

  provider: record.provider,

  referenceId: record.referenceId,

  requestId: record.requestId,

  executionTime: record.executionTime,

  tokensUsed: record.tokensUsed,

  estimatedCost: record.estimatedCost,

  message: "AI history saved.",

});
}
  /**
   * ========================================================
   * Find By Request Id
   * ========================================================
   */

  public async findByRequestId(

    requestId: string

  ): Promise<AIHistoryRecord | null> {

    const record =

      this.history.find(

        (item) =>

          item.requestId === requestId

      );

    return record ?? null;

  }

  /**
   * ========================================================
   * Find By Reference
   * ========================================================
   */

  public async findByReferenceId(

    referenceId: string

  ): Promise<AIHistoryRecord[]> {

    return this.history.filter(

      (item) =>

        item.referenceId === referenceId

    );

  }

  /**
   * ========================================================
   * Get Complete History
   * ========================================================
   */

  public async getAll()

    : Promise<AIHistoryRecord[]> {

    return this.history;

  }

  /**
   * ========================================================
   * Count
   * ========================================================
   */

  public async count()

    : Promise<number> {

    return this.history.length;

  }

  /**
   * ========================================================
   * Latest
   * ========================================================
   */

  public async latest(

    limit = 10

  ): Promise<AIHistoryRecord[]> {

    return [...this.history]

      .reverse()

      .slice(0, limit);

  }
  /**
   * ========================================================
   * Search
   * ========================================================
   */

  public async search(

    filter: AIHistoryFilter

  ): Promise<AIHistoryRecord[]> {

    return this.history.filter((record) => {

      if (

        filter.module &&

        record.module !== filter.module

      ) {

        return false;

      }

      if (

        filter.provider &&

        record.provider !== filter.provider

      ) {

        return false;

      }

      if (

        filter.referenceId &&

        record.referenceId !== filter.referenceId

      ) {

        return false;

      }

      if (

        filter.requestId &&

        record.requestId !== filter.requestId

      ) {

        return false;

      }

      if (

        filter.success !== undefined &&

        record.success !== filter.success

      ) {

        return false;

      }

      return true;

    });

  }

  /**
   * ========================================================
   * Statistics
   * ========================================================
   */

  public async statistics()

    : Promise<AIUsageStatistics> {

    const totalRequests =

      this.history.length;

    const successfulRequests =

      this.history.filter(

        r => r.success

      ).length;

    const failedRequests =

      totalRequests -

      successfulRequests;

    const totalTokens =

      this.history.reduce(

        (sum, r) =>

          sum + r.tokensUsed,

        0

      );

    const totalCost =

      this.history.reduce(

        (sum, r) =>

          sum + r.estimatedCost,

        0

      );

    const averageExecutionTime =

      totalRequests === 0

        ? 0

        : Number(

            (

              this.history.reduce(

                (sum, r) =>

                  sum +

                  r.executionTime,

                0

              ) /

              totalRequests

            ).toFixed(2)

          );

    return {

      totalRequests,

      successfulRequests,

      failedRequests,

      totalTokens,

      totalCost,

      averageExecutionTime,

    };

  }

  /**
   * ========================================================
   * Total Cost
   * ========================================================
   */

  public async totalCost()

    : Promise<number> {

    return this.history.reduce(

      (sum, r) =>

        sum +

        r.estimatedCost,

      0

    );

  }

  /**
   * ========================================================
   * Total Tokens
   * ========================================================
   */

  public async totalTokens()

    : Promise<number> {

    return this.history.reduce(

      (sum, r) =>

        sum +

        r.tokensUsed,

      0

    );

  }

  /**
   * ========================================================
   * Delete
   * ========================================================
   */

  public async delete(

    requestId: string

  ): Promise<boolean> {

    const index =

      this.history.findIndex(

        r =>

          r.requestId === requestId

      );

    if (index === -1) {

      return false;

    }

    this.history.splice(

      index,

      1

    );

    return true;

  }

  /**
   * ========================================================
   * Clear History
   * ========================================================
   */

  public async clear()

    : Promise<void> {

    this.history = [];

  }

  /**
   * ========================================================
   * Export History
   * ========================================================
   */

  public export()

    : string {

    return JSON.stringify(

      this.history,

      null,

      2

    );

  }

  /**
   * ========================================================
   * Import History
   * ========================================================
   */

  public import(

    json: string

  ): void {

    try {

      this.history =

        JSON.parse(json);

    } catch {

      aiLogger.warning({

        timestamp: new Date(),

        module: AILogModule.LEAD,

        level: AILogLevel.WARNING,

        provider: AIProvider.OPENAI,

        message:

          "History import failed.",

      });

    }

  }

  /**
   * ========================================================
   * Database Placeholder
   * ========================================================
   *
   * Future Prisma
   *
   * prisma.aiHistory.create()
   *
   */

  private async saveToDatabase(

    record: AIHistoryRecord

  ): Promise<void> {

    return;

  }

}

/**
 * ============================================================
 * Singleton
 * ============================================================
 */

export const aiHistoryService =

  new AIHistoryService();

/**
 * ============================================================
 * Version
 * ============================================================
 */

export const AI_HISTORY_VERSION =

  "1.0.0";