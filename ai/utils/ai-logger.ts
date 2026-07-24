/**
 * ============================================================
 * Easy Movers AI Platform
 * AI Logger
 * ============================================================
 *
 * File
 * ----
 * ai/utils/ai-logger.ts
 *
 * Purpose
 * -------
 * Central logging utility for every AI module.
 *
 * Responsibilities
 * ----------------
 * ✓ Request Logging
 * ✓ Response Logging
 * ✓ Error Logging
 * ✓ Execution Time
 * ✓ Token Usage
 * ✓ Cost Tracking
 * ✓ Debug Logs
 *
 * Future
 * ------
 * Database Logging
 * Elastic Search
 * Azure Monitor
 * CloudWatch
 * Grafana
 *
 * ============================================================
 */

import { AIProvider } from "../config/ai.config";

/**
 * ============================================================
 * Log Level
 * ============================================================
 */

export enum AILogLevel {

  INFO = "INFO",

  WARNING = "WARNING",

  ERROR = "ERROR",

  DEBUG = "DEBUG",

  SUCCESS = "SUCCESS",

}

/**
 * ============================================================
 * AI Module
 * ============================================================
 */

export enum AILogModule {

  LEAD = "LEAD",

  INVENTORY = "INVENTORY",

  QUOTATION = "QUOTATION",

  VENDOR = "VENDOR",

  ROUTE = "ROUTE",

  CHATBOT = "CHATBOT",

  MARKETING = "MARKETING",

  FRAUD = "FRAUD",

  AI_PROVIDER = "AI_PROVIDER",

}

/**
 * ============================================================
 * Log Entry
 * ============================================================
 */

export interface AILogEntry {

  timestamp?: Date;

  module: AILogModule;

  level?: AILogLevel;

  provider?: AIProvider;

  requestId?: string;

  referenceId?: string;

  message: string;

  executionTime?: number;

  tokensUsed?: number;

  estimatedCost?: number;
  metadata?: Record<string, unknown>;

   payload?: unknown;

error?: unknown;
}

/**
 * ============================================================
 * Request Log
 * ============================================================
 */

export interface AIRequestLog {

  requestId: string;

  module: AILogModule;

  provider: AIProvider;

  prompt: string;

  timestamp: Date;

}

/**
 * ============================================================
 * Response Log
 * ============================================================
 */

export interface AIResponseLog {

  requestId: string;

  timestamp: Date;

  executionTime: number;

  tokens: number;

  responseLength: number;

}

/**
 * ============================================================
 * Error Log
 * ============================================================
 */

export interface AIErrorLog {

  requestId: string;

  timestamp: Date;

  module: AILogModule;

  error: string;

  stack?: string;

}

/**
 * ============================================================
 * Logger Class
 * ============================================================
 */

export class AILogger {

  /**
   * --------------------------------------------------------
   * Info
   * --------------------------------------------------------
   */

  public info(

    entry: AILogEntry

  ): void {

    console.log(

      this.format(entry)

    );

  }

  /**
   * --------------------------------------------------------
   * Success
   * --------------------------------------------------------
   */

  public success(

    entry: AILogEntry

  ): void {

    console.log(

      this.format({

        ...entry,

        level: AILogLevel.SUCCESS,

      })

    );

  }

  /**
   * --------------------------------------------------------
   * Warning
   * --------------------------------------------------------
   */

  public warning(

    entry: AILogEntry

  ): void {

    console.warn(

      this.format({

        ...entry,

        level: AILogLevel.WARNING,

      })

    );

  }

/**
 * --------------------------------------------------------
 * Warn Alias
 * --------------------------------------------------------
 */

public warn(
  entry: AILogEntry
): void {

  this.warning(entry);

}

  /**
   * --------------------------------------------------------
   * Error
   * --------------------------------------------------------
   */

  public error(

    entry: AILogEntry

  ): void {

    console.error(

      this.format({

        ...entry,

        level: AILogLevel.ERROR,

      })

    );

  }

  /**
   * --------------------------------------------------------
   * Debug
   * --------------------------------------------------------
   */

  public debug(

    entry: AILogEntry

  ): void {

    console.debug(

      this.format({

        ...entry,

        level: AILogLevel.DEBUG,

      })

    );

  }
  /**
   * --------------------------------------------------------
   * Log AI Request
   * --------------------------------------------------------
   */

  public logRequest(

    request: AIRequestLog

  ): void {

    console.log(

      "========== AI REQUEST =========="

    );

    console.log(

      "Request Id :", request.requestId

    );

    console.log(

      "Module     :", request.module

    );

    console.log(

      "Provider   :", request.provider

    );

    console.log(

      "Timestamp  :",

      request.timestamp.toISOString()

    );

    console.log(

      "Prompt Size:",

      request.prompt.length

    );

    console.log(

      "================================"

    );

  }

  /**
   * --------------------------------------------------------
   * Log AI Response
   * --------------------------------------------------------
   */

  public logResponse(

    response: AIResponseLog

  ): void {

    console.log(

      "========== AI RESPONSE ========="

    );

    console.log(

      "Request Id :", response.requestId

    );

    console.log(

      "Timestamp  :",

      response.timestamp.toISOString()

    );

    console.log(

      "Execution  :",

      `${response.executionTime} ms`

    );

    console.log(

      "Tokens     :",

      response.tokens

    );

    console.log(

      "Characters :",

      response.responseLength

    );

    console.log(

      "================================"

    );

  }

  /**
   * --------------------------------------------------------
   * Log Error
   * --------------------------------------------------------
   */

  public logError(

    errorLog: AIErrorLog

  ): void {

    console.error(

      "========== AI ERROR =========="

    );

    console.error(

      "Request Id :",

      errorLog.requestId

    );

    console.error(

      "Module     :",

      errorLog.module

    );

    console.error(

      "Timestamp  :",

      errorLog.timestamp.toISOString()

    );

    console.error(

      "Error      :",

      errorLog.error

    );

    if (errorLog.stack) {

      console.error(

        errorLog.stack

      );

    }

    console.error(

      "==============================="

    );

  }

  /**
   * --------------------------------------------------------
   * Estimate Cost
   * --------------------------------------------------------
   */

  public estimateCost(

    tokens: number,

    pricePerMillion = 5

  ): number {

    return Number(

      (

        (tokens / 1000000) *

        pricePerMillion

      ).toFixed(6)

    );

  }

  /**
   * --------------------------------------------------------
   * Execution Timer
   * --------------------------------------------------------
   */

  public startTimer(): number {

    return Date.now();

  }

  /**
   * --------------------------------------------------------
   * Stop Timer
   * --------------------------------------------------------
   */

  public stopTimer(

    startedAt: number

  ): number {

    return Date.now() - startedAt;

  }

  /**
   * --------------------------------------------------------
   * Format Log
   * --------------------------------------------------------
   */

  private format(

    entry: AILogEntry

  ): string {

    return [

      `[${entry.level}]`,

      `[${entry.module}]`,

    entry.provider

  ? `[${entry.provider}]`
    : "",
      entry.referenceId

        ? `[${entry.referenceId}]`

        : "",

      entry.message,

      entry.executionTime

        ? `(${entry.executionTime} ms)`

        : "",

    ]

      .filter(Boolean)

      .join(" ");

  }

  /**
   * --------------------------------------------------------
   * JSON Logger
   * --------------------------------------------------------
   */

 public toJSON(

  entry: AILogEntry

) {

  return {

    timestamp:
      entry.timestamp,

    level:
      entry.level,

    module:
      entry.module,

    provider:
      entry.provider,

    referenceId:
      entry.referenceId,

    requestId:
      entry.requestId,

    message:
      entry.message,

    executionTime:
      entry.executionTime,

    tokensUsed:
      entry.tokensUsed,

    estimatedCost:
      entry.estimatedCost,

    metadata:
      entry.metadata,

    payload:
      entry.payload,

  };

}
}

/**
 * ============================================================
 * Singleton Logger
 * ============================================================
 */

export const aiLogger =

  new AILogger();

/**
 * ============================================================
 * Helper
 * ============================================================
 */

export function createRequestId(): string {

  return `AI-${Date.now()}-${Math.random()

    .toString(36)

    .substring(2, 8)

    .toUpperCase()}`;

}

/**
 * ============================================================
 * Logger Version
 * ============================================================
 */

export const AI_LOGGER_VERSION =

  "1.0.0";