/**
 * ============================================================
 * Easy Movers AI Platform
 * AI Cache Service
 * ============================================================
 *
 * File
 * ----
 * ai/cache/ai-cache.service.ts
 *
 * Purpose
 * -------
 * Central cache manager for all AI modules.
 *
 * Supported Modules
 * -----------------
 * ✓ Lead AI
 * ✓ Vendor AI
 * ✓ Quotation AI
 * ✓ Inventory AI
 * ✓ Marketing AI
 * ✓ Chatbot AI
 *
 * Future
 * ------
 * Redis
 * Upstash
 * Azure Cache
 * Cloudflare KV
 *
 * Current
 * -------
 * In-memory cache
 *
 * ============================================================
 */

import crypto from "crypto";

import { aiLogger } from "../utils/ai-logger";

import { AILogLevel } from "../utils/ai-logger";

import { AILogModule } from "../utils/ai-logger";

import { AIProvider } from "../config/ai.config";

/**
 * ============================================================
 * Cache Entry
 * ============================================================
 */

export interface AICacheEntry<T = unknown> {

  key: string;

  value: T;

  createdAt: Date;

  expiresAt: Date;

  provider: AIProvider;

  module: AILogModule;

}

/**
 * ============================================================
 * Cache Statistics
 * ============================================================
 */

export interface AICacheStatistics {

  totalEntries: number;

  hits: number;

  misses: number;

  hitRate: number;

}

/**
 * ============================================================
 * Cache Configuration
 * ============================================================
 */

export interface AICacheConfig {

  defaultTTL: number;

  maximumEntries: number;

}

/**
 * ============================================================
 * Default Configuration
 * ============================================================
 */

const DEFAULT_CONFIG: AICacheConfig = {

  defaultTTL: 1000 * 60 * 60,

  maximumEntries: 5000,

};

/**
 * ============================================================
 * AI Cache Service
 * ============================================================
 */

export class AICacheService {

  /**
   * --------------------------------------------------------
   * Internal Cache
   * --------------------------------------------------------
   */

  private cache =

    new Map<string, AICacheEntry>();

  /**
   * --------------------------------------------------------
   * Statistics
   * --------------------------------------------------------
   */

  private hits = 0;

  private misses = 0;

  /**
   * --------------------------------------------------------
   * Configuration
   * --------------------------------------------------------
   */

  constructor(

    private readonly config: AICacheConfig =

      DEFAULT_CONFIG

  ) {}

  /**
   * ========================================================
   * Generate Cache Key
   * ========================================================
   */

  public generateKey(

    module: AILogModule,

    provider: AIProvider,

    payload: unknown

  ): string {

    const hash =

      crypto

        .createHash("sha256")

        .update(

          JSON.stringify(payload)

        )

        .digest("hex");

    return `${module}:${provider}:${hash}`;

  }

  /**
   * ========================================================
   * Get Cache
   * ========================================================
   */

  public get<T>(

    key: string

  ): T | null {

    const entry =

      this.cache.get(key);

    if (!entry) {

      this.misses++;

      return null;

    }

    if (

      new Date() >

      entry.expiresAt

    ) {

      this.cache.delete(key);

      this.misses++;

      return null;

    }

    this.hits++;

    aiLogger.debug({

      timestamp: new Date(),

      module: entry.module,

      level: AILogLevel.DEBUG,

      provider: entry.provider,

      message: "Cache hit.",

      referenceId: key,

    });

    return entry.value as T;

  }

  /**
   * ========================================================
   * Save Cache
   * ========================================================
   */

  public set<T>(

    key: string,

    value: T,

    module: AILogModule,

    provider: AIProvider,

    ttl = this.config.defaultTTL

  ): void {

    if (

      this.cache.size >=

      this.config.maximumEntries

    ) {

      this.removeOldest();

    }

    const entry: AICacheEntry<T> = {

      key,

      value,

      module,

      provider,

      createdAt: new Date(),

      expiresAt: new Date(

        Date.now() + ttl

      ),

    };

    this.cache.set(

      key,

      entry

    );
    aiLogger.info({

      timestamp: new Date(),

      module,

      level: AILogLevel.INFO,

      provider,

      message: "AI response cached.",

      referenceId: key,

    });

  }

  /**
   * ========================================================
   * Delete Cache Entry
   * ========================================================
   */

  public delete(

    key: string

  ): boolean {

    return this.cache.delete(key);

  }

  /**
   * ========================================================
   * Clear Cache
   * ========================================================
   */

  public clear(): void {

    this.cache.clear();

    this.hits = 0;

    this.misses = 0;

    aiLogger.info({

      timestamp: new Date(),

      module: AILogModule.LEAD,

      level: AILogLevel.INFO,

      provider: AIProvider.OPENAI,

      message: "AI cache cleared.",

    });

  }

  /**
   * ========================================================
   * Remove Oldest Entry
   * ========================================================
   */

  private removeOldest(): void {

    const iterator =

      this.cache.keys();

    const oldestKey =

      iterator.next().value;

    if (oldestKey) {

      this.cache.delete(oldestKey);

    }

  }

  /**
   * ========================================================
   * Cleanup Expired Cache
   * ========================================================
   */

  public cleanupExpired(): number {

    let removed = 0;

    const now = new Date();

    for (const [

      key,

      value,

    ] of this.cache.entries()) {

      if (now > value.expiresAt) {

        this.cache.delete(key);

        removed++;

      }

    }

    return removed;

  }

  /**
   * ========================================================
   * Cache Exists
   * ========================================================
   */

  public has(

    key: string

  ): boolean {

    return this.get(key) !== null;

  }

  /**
   * ========================================================
   * Cache Size
   * ========================================================
   */

  public size(): number {

    return this.cache.size;

  }

  /**
   * ========================================================
   * Cache Statistics
   * ========================================================
   */

  public statistics():

    AICacheStatistics {

    const total =

      this.hits +

      this.misses;

    return {

      totalEntries:

        this.cache.size,

      hits:

        this.hits,

      misses:

        this.misses,

      hitRate:

        total === 0

          ? 0

          : Number(

              (

                (this.hits /

                  total) *

                100

              ).toFixed(2)

            ),

    };

  }

  /**
   * ========================================================
   * Cache Keys
   * ========================================================
   */

  public keys(): string[] {

    return [

      ...this.cache.keys(),

    ];

  }

  /**
   * ========================================================
   * Cache Values
   * ========================================================
   */

  public values():

    AICacheEntry[] {

    return [

      ...this.cache.values(),

    ];

  }

  /**
   * ========================================================
   * Cache Entries
   * ========================================================
   */

  public entries():

    [string, AICacheEntry][] {

    return [

      ...this.cache.entries(),

    ];

  }

  /**
   * ========================================================
   * Warm Cache
   * ========================================================
   */

  public warm<T>(

    key: string,

    value: T,

    module: AILogModule,

    provider: AIProvider

  ): void {

    this.set(

      key,

      value,

      module,

      provider

    );

  }

  /**
   * ========================================================
   * Persist Cache
   * ========================================================
   *
   * Future
   *
   * Redis
   * Upstash
   * Azure Cache
   *
   * ========================================================
   */

  public async persist(): Promise<void> {

    return;

  }

  /**
   * ========================================================
   * Restore Cache
   * ========================================================
   */

  public async restore(): Promise<void> {

    return;

  }

  /**
   * ========================================================
   * Export Cache
   * ========================================================
   */

  public export(): string {

    return JSON.stringify(

      [...this.cache.entries()].map(([key, entry]) => [

        key,

        {

          ...entry,

          createdAt: entry.createdAt.toISOString(),

          expiresAt: entry.expiresAt.toISOString(),

        },

      ]),

      null,

      2

    );

  }

  /**
   * ========================================================
   * Import Cache
   * ========================================================
   */

  public import(json: string): void {

    try {

      const parsed = JSON.parse(json) as Array<[string, AICacheEntry<unknown>]>;

      if (!Array.isArray(parsed)) {

        throw new Error("Invalid cache payload.");

      }

      this.cache.clear();

      for (const [key, entry] of parsed) {

        const restoredEntry: AICacheEntry<unknown> = {

          ...entry,

          createdAt: new Date(entry.createdAt),

          expiresAt: new Date(entry.expiresAt),

        };

        this.cache.set(key, restoredEntry);

      }

    } catch {

      aiLogger.warning({

        timestamp: new Date(),

        module: AILogModule.LEAD,

        level: AILogLevel.WARNING,

        provider: AIProvider.OPENAI,

        message: "Unable to import cache.",

      });

    }

  }

}

/**
 * ============================================================
 * Singleton
 * ============================================================
 */

export const aiCacheService =

  new AICacheService();

/**
 * ============================================================
 * Version
 * ============================================================
 */

export const AI_CACHE_VERSION =

  "1.0.0";