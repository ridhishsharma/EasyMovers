/**
 * ============================================================
 * Easy Movers AI Platform
 * Central AI Service
 * ============================================================
 *
 * File:
 * ai/services/ai.service.ts
 *
 * Purpose
 * -------
 * Single AI Gateway used by
 * Lead AI
 * Vendor AI
 * Inventory AI
 * Quotation AI
 * Pricing AI
 *
 * ============================================================
 */

import OpenAI from "openai";

import {

  ChatCompletionMessageParam,

} from "openai/resources/chat/completions";

import {

  openAIClient,

  DEFAULT_REQUEST_OPTIONS,

  getDefaultModel,

} from "../config/openai";

import {

  AIProvider,

  AIModel,

  AIResponseStatus,

} from "../config/ai.config";

/* ============================================================
 * Request Interface
 * ============================================================
 */

export interface AIRequest {

  systemPrompt: string;

  userPrompt: string;

  provider?: AIProvider;

  model?: AIModel;

  temperature?: number;

  maxTokens?: number;

}

/* ============================================================
 * AI Response
 * ============================================================
 */

export interface AIResponse {

  success: boolean;

  provider: AIProvider;

  model: AIModel;

  response: string;

  status: AIResponseStatus;

  error?: string;

  promptTokens?: number;

  completionTokens?: number;

  totalTokens?: number;

  responseTime?: number;

}

/* ============================================================
 * Generic JSON Response
 * ============================================================
 */

export interface AIJSONResponse<T> {

  success: boolean;

  data?: T;

  rawResponse: string;

  provider: AIProvider;

  status: AIResponseStatus;

  error?: string;

}

/* ============================================================
 * AI Service
 * ============================================================
 */

export class AIService {

  /**
   * Current Provider
   */

  private provider: AIProvider;

  /**
   * Constructor
   */

  constructor(

    provider: AIProvider =

      AIProvider.OPENAI

  ) {

    this.provider = provider;

  }

  /**
   * ========================================================
   * Chat
   * ========================================================
   */

  public async chat(

    request: AIRequest

  ): Promise<AIResponse> {

    const started = Date.now();

    try {

      this.validateRequest(request);

      const model =

        request.model ??

        getDefaultModel();

      const messages:

      ChatCompletionMessageParam[] = [

        {

          role: "system",

          content:

            request.systemPrompt,

        },

        {

          role: "user",

          content:

            request.userPrompt,

        },

      ];

      const completion =

        await openAIClient.chat.completions.create({

          model,

          messages,

          temperature:

            request.temperature ??

            DEFAULT_REQUEST_OPTIONS.temperature,

          max_tokens:

            request.maxTokens ??

            DEFAULT_REQUEST_OPTIONS.maxTokens,

        });

      const content =

        completion.choices[0]?.message

          ?.content ?? "";

      return {

        success: true,

        provider: this.provider,

        model,

        response: content,

        status:

          AIResponseStatus.SUCCESS,

        promptTokens:

          completion.usage?.prompt_tokens ?? 0,

        completionTokens:

          completion.usage?.completion_tokens ?? 0,

        totalTokens:

          completion.usage?.total_tokens ?? 0,

        responseTime:

          Date.now() - started,

      };

    } catch (error) {

      return {

        success: false,

        provider: this.provider,

        model:

          request.model ??

          getDefaultModel(),

        response: "",

        status:

          AIResponseStatus.FAILED,

        error:

          error instanceof Error

            ? error.message

            : "Unknown AI Error",

        responseTime:

          Date.now() - started,

      };

    }

  }

  /**
   * ========================================================
   * Retry Chat
   * ========================================================
   */

  public async retryChat(

    request: AIRequest,

    retries: number = 3

  ): Promise<AIResponse> {

    let lastError: AIResponse | null = null;

    for (

      let attempt = 1;

      attempt <= retries;

      attempt++

    ) {

      const result =

        await this.chat(request);

      if (result.success) {

        return result;

      }

      lastError = result;

      await this.delay(

        attempt * 1000

      );

    }

    return (

      lastError ?? {

        success: false,

        provider: this.provider,

        model:

          request.model ??

          getDefaultModel(),

        response: "",

        status:

          AIResponseStatus.FAILED,

        error:

          "Retry failed.",

      }

    );

  }

  /**
   * ========================================================
   * Validate Request
   * ========================================================
   */

  private validateRequest(

    request: AIRequest

  ): void {

    if (

      !request.systemPrompt ||

      request.systemPrompt.trim() === ""

    ) {

      throw new Error(

        "System prompt is required."

      );

    }

    if (

      !request.userPrompt ||

      request.userPrompt.trim() === ""

    ) {

      throw new Error(

        "User prompt is required."

      );

    }

    if (

      request.temperature !== undefined

    ) {

      if (

        request.temperature < 0 ||

        request.temperature > 2

      ) {

        throw new Error(

          "Temperature must be between 0 and 2."

        );

      }

    }

    if (

      request.maxTokens !== undefined

    ) {

      if (

        request.maxTokens <= 0

      ) {

        throw new Error(

          "maxTokens must be greater than zero."

        );

      }

    }

  }

  /**
   * ========================================================
   * Estimate Tokens
   * ========================================================
   */

  public estimateTokens(

    text: string

  ): number {

    if (!text) {

      return 0;

    }

    /**
     * Approximation
     * 1 Token ≈ 4 Characters
     */

    return Math.ceil(

      text.length / 4

    );

  }

  /**
   * ========================================================
   * Estimate AI Cost
   * ========================================================
   */

  public estimateCost(

    promptTokens: number,

    completionTokens: number,

    inputRate: number = 0.000005,

    outputRate: number = 0.000015

  ): number {

    const inputCost =

      (promptTokens / 1000) *

      inputRate;

    const outputCost =

      (completionTokens / 1000) *

      outputRate;

    return Number(

      (

        inputCost +

        outputCost

      ).toFixed(6)

    );

  }

  /**
   * ========================================================
   * Validate JSON Response
   * ========================================================
   */

  public validateJSONResponse<T>(

    response: string

  ): AIJSONResponse<T> {

    try {

      const parsed =

        JSON.parse(response);

      return {

        success: true,

        data: parsed,

        rawResponse: response,

        provider: this.provider,

        status:

          AIResponseStatus.SUCCESS,

      };

    } catch (error) {

      return {

        success: false,

        rawResponse: response,

        provider: this.provider,

        status:

          AIResponseStatus.FAILED,

        error:

          error instanceof Error

            ? error.message

            : "Invalid JSON",

      };

    }

  }
  /**
   * ========================================================
   * Delay
   * ========================================================
   */

  private async delay(

    milliseconds: number

  ): Promise<void> {

    return new Promise(

      (resolve) =>

        setTimeout(

          resolve,

          milliseconds

        )

    );

  }

  /**
   * ========================================================
   * AI Health Check
   * ========================================================
   */

  public async health(): Promise<boolean> {

    try {

      const models =

        await openAIClient.models.list();

      return (

        models.data.length > 0

      );

    } catch {

      return false;

    }

  }

  /**
   * ========================================================
   * Get Service Information
   * ========================================================
   */

  public info() {

    return {

      provider:

        this.provider,

      defaultModel:

        getDefaultModel(),

      version: "1.0.0",

      requestOptions:

        DEFAULT_REQUEST_OPTIONS,

    };

  }

  /**
   * ========================================================
   * Change Provider
   * ========================================================
   */

  public setProvider(

    provider: AIProvider

  ): void {

    this.provider = provider;

  }

  /**
   * ========================================================
   * Current Provider
   * ========================================================
   */

  public getProvider(): AIProvider {

    return this.provider;

  }

  /**
   * ========================================================
   * Current Default Model
   * ========================================================
   */

  public getModel(): AIModel {

    return getDefaultModel();

  }

  /**
   * ========================================================
   * Simple Text Completion
   * ========================================================
   */

  public async complete(

    systemPrompt: string,

    userPrompt: string

  ): Promise<string> {

    const result = await this.chat({

      systemPrompt,

      userPrompt,

    });

    if (!result.success) {

      throw new Error(

        result.error ??

        "AI completion failed."

      );

    }

    return result.response;

  }

  /**
   * ========================================================
   * Generic JSON Completion
   * ========================================================
   */

  public async completeJSON<T>(

    systemPrompt: string,

    userPrompt: string

  ): Promise<AIJSONResponse<T>> {

    const result = await this.chat({

      systemPrompt,

      userPrompt,

    });

    if (!result.success) {

      return {

        success: false,

        rawResponse: "",

        provider: this.provider,

        status:

          AIResponseStatus.FAILED,

        error:

          result.error,

      };

    }

    return this.validateJSONResponse<T>(

      result.response

    );

  }

}

/**
 * ============================================================
 * Singleton Instance
 * ============================================================
 */

export const aiService =

  new AIService();

/**
 * ============================================================
 * Factory
 * ============================================================
 */

export function createAIService(

  provider: AIProvider

): AIService {

  return new AIService(

    provider

  );

}