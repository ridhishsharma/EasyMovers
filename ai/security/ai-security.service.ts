/**
 * ============================================================
 * Easy Movers AI Platform
 * AI Security Service
 * ============================================================
 *
 * File
 * ----
 * ai/security/ai-security.service.ts
 *
 * Purpose
 * -------
 * Security layer before every AI request.
 *
 * Responsibilities
 * ----------------
 * ✓ Prompt Injection Detection
 * ✓ Prompt Sanitization
 * ✓ Sensitive Data Masking
 * ✓ Toxic Content Detection
 * ✓ Output Validation
 * ✓ PII Protection
 *
 * Used By
 * -------
 * Lead AI
 * Vendor AI
 * Quotation AI
 * Chatbot AI
 * Marketing AI
 *
 * ============================================================
 */

import {

  aiLogger,

  AILogLevel,

  AILogModule,

} from "../utils/ai-logger";

import { AIProvider } from "../config/ai.config";

/**
 * ============================================================
 * Validation Result
 * ============================================================
 */

export interface AISecurityResult {

  success: boolean;

  sanitizedPrompt: string;

  warnings: string[];

  blocked: boolean;

  reason?: string;
}

/**
 * ============================================================
 * Sensitive Data Result
 * ============================================================
 */

export interface PIIDetectionResult {

  phoneNumbers: string[];

  emailAddresses: string[];

  aadhaarNumbers: string[];

  panNumbers: string[];

}

/**
 * ============================================================
 * Security Configuration
 * ============================================================
 */

export interface AISecurityConfig {

  enablePromptInjectionCheck: boolean;

  enablePIIMasking: boolean;

  enableToxicContentCheck: boolean;

  enablePromptLengthValidation: boolean;

  maximumPromptLength: number;

}

/**
 * ============================================================
 * Default Configuration
 * ============================================================
 */

const DEFAULT_SECURITY_CONFIG:

AISecurityConfig = {

  enablePromptInjectionCheck: true,

  enablePIIMasking: true,

  enableToxicContentCheck: true,

  enablePromptLengthValidation: true,

  maximumPromptLength: 25000,

};

/**
 * ============================================================
 * Prompt Injection Keywords
 * ============================================================
 */

const PROMPT_INJECTION_PATTERNS = [

  "ignore previous instructions",

  "forget previous instructions",

  "system prompt",

  "developer message",

  "show hidden prompt",

  "reveal prompt",

  "act as system",

  "ignore safety",

  "disable safety",

  "bypass security",

];

/**
 * ============================================================
 * Toxic Words
 * ============================================================
 */

const TOXIC_PATTERNS = [

  "kill",

  "bomb",

  "terrorist",

  "hack account",

  "credit card fraud",

  "steal password",

];

/**
 * ============================================================
 * AI Security Service
 * ============================================================
 */

export class AISecurityService {

  constructor(

    private readonly config:

      AISecurityConfig =

      DEFAULT_SECURITY_CONFIG

  ) {}

  /**
   * ========================================================
   * Validate Prompt
   * ========================================================
   */

  public validate(

    prompt: string

  ): AISecurityResult {

    let sanitized = prompt;

    const warnings: string[] = [];

    let blocked = false;

    /**
     * ----------------------------------------
     * Length Validation
     * ----------------------------------------
     */

    if (

      this.config

        .enablePromptLengthValidation &&

      prompt.length >

      this.config.maximumPromptLength

    ) {

      blocked = true;

      warnings.push(

        "Prompt exceeds maximum allowed size."

      );

    }

    /**
     * ----------------------------------------
     * Prompt Injection
     * ----------------------------------------
     */

    if (

      this.config

        .enablePromptInjectionCheck

    ) {

      const injection =

        this.detectPromptInjection(

          prompt

        );

      if (injection.length > 0) {

        blocked = true;

        warnings.push(

          ...injection

        );

      }

    }

    /**
     * ----------------------------------------
     * Mask Sensitive Data
     * ----------------------------------------
     */

    if (

      this.config.enablePIIMasking

    ) {

      sanitized =

        this.maskSensitiveData(

          sanitized

        );

    }

    /**
     * ----------------------------------------
     * Toxic Content
     * ----------------------------------------
     */
if (
  this.config.enableToxicContentCheck
) {

  const toxic =
    this.detectToxicContent(sanitized);

  if (toxic.length > 0) {

    blocked = true;

    warnings.push(...toxic);

  }

}

return {

  success: !blocked,

  sanitizedPrompt: sanitized,

  warnings,

  blocked,

  reason:

    warnings.length > 0

      ? warnings.join("; ")

      : undefined,

};

}
/**
 * ========================================================
 * Detect Prompt Injection
 * ========================================================
 */

private detectPromptInjection(
  prompt: string
): string[] {

  const warnings: string[] = [];

  const normalized = prompt.toLowerCase();

  for (const pattern of PROMPT_INJECTION_PATTERNS) {

    if (normalized.includes(pattern)) {

      warnings.push(
        `Prompt injection detected: "${pattern}"`
      );

    }

  }

  return warnings;

}

/**
 * ========================================================
 * Detect Toxic Content
 * ========================================================
 */

private detectToxicContent(

  prompt: string

): string[] {

  const warnings: string[] = [];

  const normalized =

    prompt.toLowerCase();

  for (const pattern of TOXIC_PATTERNS) {

    if (

      normalized.includes(pattern)

    ) {

      warnings.push(

        `Restricted content detected: "${pattern}"`

      );

    }

  }

  return warnings;

}

/**
 * ========================================================
 * Detect PII
 * ========================================================
 */

public detectPII(

  text: string

): PIIDetectionResult {

  const phoneRegex =

    /\b(?:\+91[- ]?)?[6-9]\d{9}\b/g;

  const emailRegex =

    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

  const aadhaarRegex =

    /\b\d{4}\s?\d{4}\s?\d{4}\b/g;

  const panRegex =

    /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g;

  return {

    phoneNumbers:

      text.match(phoneRegex) ?? [],

    emailAddresses:

      text.match(emailRegex) ?? [],

    aadhaarNumbers:

      text.match(aadhaarRegex) ?? [],

    panNumbers:

      text.match(panRegex) ?? [],

  };

}

/**
 * ========================================================
 * Mask Sensitive Data
 * ========================================================
 */

public maskSensitiveData(

  text: string

): string {

  let masked = text;

  /**
   * Phone
   */

  masked = masked.replace(

    /\b(?:\+91[- ]?)?([6-9])\d{8}(\d)\b/g,

    "$1********$2"

  );

  /**
   * Email
   */

  masked = masked.replace(

    /\b([A-Za-z0-9._%+-]{2})[A-Za-z0-9._%+-]*(@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g,

    "$1******$2"

  );

  /**
   * Aadhaar
   */

  masked = masked.replace(

    /\b\d{4}\s?\d{4}\s?(\d{4})\b/g,

    "XXXX XXXX $1"

  );

  /**
   * PAN
   */

  masked = masked.replace(

    /\b([A-Z]{2})[A-Z]{3}([0-9]{4})([A-Z])\b/g,

    "$2XXX$2$3"

  );

  return masked;

}

/**
 * ========================================================
 * Validate Output
 * ========================================================
 */

public validateOutput(

  output: string

): boolean {

  const toxic =

    this.detectToxicContent(output);

  return toxic.length === 0;

}

/**
 * ========================================================
 * Log Security Event
 * ========================================================
 */

private logSecurity(

  message: string,

  provider: AIProvider

): void {

  aiLogger.warning({

    timestamp: new Date(),

    module: AILogModule.LEAD,

    level: AILogLevel.WARNING,

    provider,

    message,

  });

}

/**
 * ========================================================
 * Security Health
 * ========================================================
 */

public health(): boolean {

  return true;

}
/**
 * ========================================================
 * Get Configuration
 * ========================================================
 */

public getConfiguration(): AISecurityConfig {

  return this.config;

}

/**
 * ========================================================
 * Enable Prompt Injection Protection
 * ========================================================
 */

public enablePromptInjectionProtection(): void {

  this.config.enablePromptInjectionCheck = true;

}

/**
 * ========================================================
 * Disable Prompt Injection Protection
 * ========================================================
 */

public disablePromptInjectionProtection(): void {

  this.config.enablePromptInjectionCheck = false;

}

/**
 * ========================================================
 * Enable PII Masking
 * ========================================================
 */

public enablePIIMasking(): void {

  this.config.enablePIIMasking = true;

}

/**
 * ========================================================
 * Disable PII Masking
 * ========================================================
 */

public disablePIIMasking(): void {

  this.config.enablePIIMasking = false;

}

/**
 * ========================================================
 * Enable Toxic Detection
 * ========================================================
 */

public enableToxicDetection(): void {

  this.config.enableToxicContentCheck = true;

}

/**
 * ========================================================
 * Disable Toxic Detection
 * ========================================================
 */

public disableToxicDetection(): void {

  this.config.enableToxicContentCheck = false;

}

/**
 * ========================================================
 * Set Maximum Prompt Length
 * ========================================================
 */

public setMaximumPromptLength(

  length: number

): void {

  this.config.maximumPromptLength = length;

}

/**
 * ========================================================
 * Get Maximum Prompt Length
 * ========================================================
 */

public getMaximumPromptLength(): number {

  return this.config.maximumPromptLength;

}

/**
 * ========================================================
 * Security Summary
 * ========================================================
 */

public securitySummary() {

  return {

    promptInjectionProtection:

      this.config.enablePromptInjectionCheck,

    piiMasking:

      this.config.enablePIIMasking,

    toxicContentProtection:

      this.config.enableToxicContentCheck,

    maximumPromptLength:

      this.config.maximumPromptLength,

  };

}

/**
 * ========================================================
 * Future Database Security Log
 * ========================================================
 *
 * prisma.aiSecurityLog.create()
 *
 */

private async saveSecurityEvent(

  message: string,

  module: AILogModule,

  provider: AIProvider

): Promise<void> {

  /**
   * Future Prisma Model
   *
   * AISecurityLog
   */

  void message;

  void module;

  void provider;

  return;

}

/**
 * ========================================================
 * Future Threat Counter
 * ========================================================
 */

private securityThreats = 0;

/**
 * ========================================================
 * Increase Threat Counter
 * ========================================================
 */

private increaseThreatCounter(): void {

  this.securityThreats++;

}

/**
 * ========================================================
 * Threat Count
 * ========================================================
 */

public getThreatCount(): number {

  return this.securityThreats;

}

/**
 * ========================================================
 * Reset Threat Counter
 * ========================================================
 */

public resetThreatCounter(): void {

  this.securityThreats = 0;

}

/**
 * ========================================================
 * Security Version
 * ========================================================
 */

public version(): string {

  return AI_SECURITY_VERSION;

}

}

/**
 * ============================================================
 * Singleton
 * ============================================================
 */

export const aiSecurityService =

  new AISecurityService();

/**
 * ============================================================
 * Version
 * ============================================================
 */

export const AI_SECURITY_VERSION =

  "1.0.0";

/**
 * ============================================================
 * Future Roadmap
 * ============================================================
 *
 * Phase-2
 * --------
 *
 * ✓ Prisma Security Logs
 *
 * ✓ Redis Attack Detection
 *
 * ✓ OpenAI Moderation API
 *
 * ✓ Google Perspective API
 *
 * ✓ Azure Content Safety
 *
 * ✓ Rate Limiter Integration
 *
 * ✓ API Key Abuse Detection
 *
 * ✓ Prompt Fingerprinting
 *
 * ✓ AI Fraud Detection
 *
 * ============================================================
 */