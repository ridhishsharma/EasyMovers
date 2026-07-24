/**
 * ============================================================
 * Easy Movers AI Platform
 * OpenAI Client Configuration
 * ============================================================
 *
 * File:
 * ai/config/openai.ts
 *
 * Purpose
 * -------
 * Initializes and manages the OpenAI client.
 *
 * Responsibilities
 * ----------------
 * ✓ Validate environment variables
 * ✓ Create singleton OpenAI client
 * ✓ Health check
 * ✓ Model selection
 * ✓ Request defaults
 * ✓ Error handling
 *
 * NOTE:
 * No business logic belongs here.
 * Business logic belongs in:
 * ai/services/*
 *
 * ============================================================
 */

import OpenAI from "openai";

import {
  AIModel,
  AI_DEFAULT_TIMEOUT,
  AI_DEFAULT_RETRIES,
} from "./ai.config";

/**
 * ============================================================
 * Environment Variables
 * ============================================================
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const OPENAI_ORGANIZATION =
  process.env.OPENAI_ORGANIZATION;

const OPENAI_PROJECT =
  process.env.OPENAI_PROJECT;

/**
 * ============================================================
 * Validate Environment
 * ============================================================
 */

if (!OPENAI_API_KEY) {

  throw new Error(
    "OPENAI_API_KEY is missing. Please configure your environment variables."
  );

}

/**
 * ============================================================
 * Default AI Model
 * ============================================================
 */

export const DEFAULT_OPENAI_MODEL =
  AIModel.GPT_5;

/**
 * ============================================================
 * OpenAI Client
 * ============================================================
 */

export const openAIClient = new OpenAI({

  apiKey: OPENAI_API_KEY,

  organization: OPENAI_ORGANIZATION,

  project: OPENAI_PROJECT,

  timeout: AI_DEFAULT_TIMEOUT,

  maxRetries: AI_DEFAULT_RETRIES,

});

/**
 * ============================================================
 * Client Factory
 * ============================================================
 */

export function getOpenAIClient(): OpenAI {

  return openAIClient;

}

/**
 * ============================================================
 * Supported Models
 * ============================================================
 */

export type OpenAIModel =

  | AIModel.GPT_5
  | AIModel.GPT_5_MINI
  | AIModel.GPT_4_1
  | AIModel.GPT_4O
  | AIModel.GPT_4O_MINI;

export const SUPPORTED_OPENAI_MODELS: OpenAIModel[] = [

  AIModel.GPT_5,

  AIModel.GPT_5_MINI,

  AIModel.GPT_4_1,

  AIModel.GPT_4O,

  AIModel.GPT_4O_MINI,

];

/**
 * ============================================================
 * Request Configuration
 * ============================================================
 */

export interface OpenAIRequestOptions {

  model?: AIModel;

  temperature?: number;

  maxTokens?: number;

  topP?: number;

  frequencyPenalty?: number;

  presencePenalty?: number;

}

/**
 * ============================================================
 * Default Request Options
 * ============================================================
 */

export const DEFAULT_REQUEST_OPTIONS: OpenAIRequestOptions = {

  model: DEFAULT_OPENAI_MODEL,

  temperature: 0.2,

  maxTokens: 1200,

  topP: 1,

  frequencyPenalty: 0,

  presencePenalty: 0,

};

/**
 * ============================================================
 * Health Status
 * ============================================================
 */

export interface OpenAIHealthStatus {

  connected: boolean;

  model: string;

  timeout: number;

  retries: number;

}

/**
 * ============================================================
 * Health Check
 * ============================================================
 */

export async function checkOpenAIHealth():

Promise<OpenAIHealthStatus> {

  try {

    await openAIClient.models.list();

    return {

      connected: true,

      model: DEFAULT_OPENAI_MODEL,

      timeout: AI_DEFAULT_TIMEOUT,

      retries: AI_DEFAULT_RETRIES,

    };

  } catch {

    return {

      connected: false,

      model: DEFAULT_OPENAI_MODEL,

      timeout: AI_DEFAULT_TIMEOUT,

      retries: AI_DEFAULT_RETRIES,

    };

  }

}

/**
 * ============================================================
 * Validate Model
 * ============================================================
 */

export function isSupportedModel(
  model: string
): boolean {

  return (
    SUPPORTED_OPENAI_MODELS as readonly AIModel[]
  ).includes(
    model as AIModel
  );

}
/**
 * ============================================================
 * Get Default Model
 * ============================================================
 */

export function getDefaultModel(): AIModel {

  return DEFAULT_OPENAI_MODEL as AIModel ;

}