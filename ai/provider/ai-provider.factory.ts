import { AIProvider } from "../config/ai.config";

import { openAIClient } from "../config/openai";

import {
  aiLogger,
  AILogModule,
} from "../utils/ai-logger";

export interface AIProviderRequest {

  systemPrompt?: string;

  prompt: string;

  temperature?: number;

  maxTokens?: number;

  responseFormat?: "json" | "text";

}

export interface AIProviderResponse {

  success: boolean;

  provider: AIProvider;

  model: string;

  content: string;

  promptTokens?: number;

  completionTokens?: number;

  totalTokens?: number;

  finishReason?: string;

  error?: string;

}

export interface IAIProvider {

  generate(

    request: AIProviderRequest

  ): Promise<AIProviderResponse>;

}

class OpenAIProvider implements IAIProvider {

  async generate(

    request: AIProviderRequest

  ): Promise<AIProviderResponse> {

    try {

      const completion = await openAIClient.chat.completions.create({

        model: "gpt-4.1-mini",

        temperature: request.temperature ?? 0.3,

        max_tokens: request.maxTokens ?? 2000,

        messages: [

          ...(request.systemPrompt
            ? [
                {
                  role: "system" as const,
                  content: request.systemPrompt,
                },
              ]
            : []),

          {
            role: "user" as const,
            content: request.prompt,
          },

        ],

      });

      return {

        success: true,

        provider: AIProvider.OPENAI,

        model: completion.model,

        content:

          completion.choices[0]?.message?.content ?? "",

        promptTokens:

          completion.usage?.prompt_tokens,

        completionTokens:

          completion.usage?.completion_tokens,

        totalTokens:

          completion.usage?.total_tokens,

        finishReason:

          completion.choices[0]?.finish_reason ?? undefined,

      };

    } catch (error) {

      aiLogger.error({

        module: AILogModule.AI_PROVIDER,

        message: "OpenAI provider failed.",

        error,

      });

      return {

        success: false,

        provider: AIProvider.OPENAI,

        model: "gpt-4.1-mini",

        content: "",

        error:

          error instanceof Error

            ? error.message

            : "Unknown provider error",

      };

    }

  }

}
/* ============================================================
 * Dummy Provider
 * Used for providers that are not yet implemented.
 * ============================================================
 */

class DummyProvider implements IAIProvider {

  constructor(
    private readonly provider: AIProvider
  ) {}

  async generate(
    request: AIProviderRequest
  ): Promise<AIProviderResponse> {

    aiLogger.warning({

      module: AILogModule.AI_PROVIDER,
      message:
        `${this.provider} provider is not implemented.`,

    });

    return {

      success: false,

      provider: this.provider,

      model: "N/A",

      content: "",

      error:
        `${this.provider} provider is not implemented.`,

    };

  }

}

/* ============================================================
 * AI Provider Factory
 * ============================================================
 */

export class AIProviderFactory {

  private static providers =
    new Map<AIProvider, IAIProvider>();

  /**
   * ----------------------------------------
   * Register Providers
   * ----------------------------------------
   */

  private static initialize(): void {

    if (this.providers.size > 0) {

      return;

    }

    this.providers.set(

      AIProvider.OPENAI,

      new OpenAIProvider()

    );

    this.providers.set(

      AIProvider.GEMINI,

      new DummyProvider(

        AIProvider.GEMINI

      )

    );

    this.providers.set(

      AIProvider.CLAUDE,

      new DummyProvider(

        AIProvider.CLAUDE

      )

    );

    this.providers.set(

      AIProvider.AZURE_OPENAI,

      new DummyProvider(

        AIProvider.AZURE_OPENAI

      )

    );

    this.providers.set(

      AIProvider.OLLAMA,

      new DummyProvider(

        AIProvider.OLLAMA

      )

    );

    this.providers.set(

      AIProvider.CUSTOM,

      new DummyProvider(

        AIProvider.CUSTOM

      )

    );

  }

  /**
   * ----------------------------------------
   * Get Provider
   * ----------------------------------------
   */

  static getProvider(

    provider: AIProvider

  ): IAIProvider {

    this.initialize();

    const service =
      this.providers.get(provider);

    if (!service) {

      throw new Error(

        `Unsupported AI Provider: ${provider}`

      );

    }

    return service;

  }

  /**
   * ----------------------------------------
   * Generate
   * ----------------------------------------
   */

  static async generate(

    provider: AIProvider,

    request: AIProviderRequest

  ): Promise<AIProviderResponse> {

    const service =
      this.getProvider(provider);

    return service.generate(request);

  }

}

/* ============================================================
 * Default Provider
 * ============================================================
 */

export const aiProviderFactory =
  AIProviderFactory;