/**
 * AirAware — AI Environmental Guidance Subsystem (Deep Module Facade)
 *
 * Implements codebase-design principle: deep module hiding all complexity:
 * - Caching and request deduplication.
 * - Cloudflare Workers AI model orchestration & failover.
 * - Prompt building & prompt injection sanitization.
 * - Guaranteed deterministic fallback on any failure.
 */

import {
  GuidanceRequest,
  GuidanceRequestSchema,
  GuidanceResponse,
  GuidanceResponseSchema,
  CopilotRequest,
  CopilotRequestSchema,
  CopilotResponse,
  CopilotResponseSchema,
} from './types';
import { isCloudflareConfigured } from './config';
import { aiCache } from './cache';
import { buildGuidancePayload, buildCopilotPayload } from './prompt-builder';
import { executeWorkersAiInference } from './cloudflare-client';
import { getDeterministicGuidance, getDeterministicCopilotAnswer } from './deterministic-fallback';

export * from './types';
export * from './config';
export { aiCache } from './cache';
export { getDeterministicGuidance, getDeterministicCopilotAnswer } from './deterministic-fallback';

/**
 * Retrieves personalized proactive guidance for environmental conditions.
 * Guaranteed to return a valid GuidanceResponse (via Cloudflare AI or deterministic fallback).
 */
export async function getPersonalizedGuidance(
  input: GuidanceRequest,
  customFetch?: typeof fetch
): Promise<GuidanceResponse> {
  // 1. Strict input validation
  const validatedInput = GuidanceRequestSchema.parse(input);
  const cacheKey = aiCache.getGuidanceKey(validatedInput);

  // 2. Check cache
  const cached = aiCache.getGuidance(cacheKey);
  if (cached) {
    return cached;
  }

  // 3. If credentials are not yet configured or quota is exhausted, use deterministic fallback
  if (!isCloudflareConfigured() || aiCache.isDailyQuotaExhausted()) {
    const fallback = getDeterministicGuidance(validatedInput);
    aiCache.setGuidance(cacheKey, fallback);
    return fallback;
  }

  // 4. Deduplicate concurrent identical requests
  return aiCache.deduplicateGuidance(cacheKey, async () => {
    try {
      const aiResponse = await executeWorkersAiInference<GuidanceResponse>({
        payloadBuilder: (modelId) => buildGuidancePayload(validatedInput, modelId),
        schema: GuidanceResponseSchema,
        customFetch,
      });

      const result: GuidanceResponse = {
        ...aiResponse,
        modelName: aiResponse.modelName || '@cf/google/gemma-4-26b-a4b-it',
        isDeterministicFallback: false,
      };

      aiCache.setGuidance(cacheKey, result);
      return result;
    } catch {
      // Any AI failure gracefully degrades to deterministic guidance
      const fallback = getDeterministicGuidance(validatedInput);
      aiCache.setGuidance(cacheKey, fallback);
      return fallback;
    }
  });
}

/**
 * Evaluates an interactive user question with the Air Copilot.
 * Strictly conforms to Master Specification §4.4 (7-part response).
 */
export async function askAirCopilot(
  input: CopilotRequest,
  customFetch?: typeof fetch
): Promise<CopilotResponse> {
  // 1. Strict input validation & sanitization
  const validatedInput = CopilotRequestSchema.parse(input);
  const cacheKey = aiCache.getCopilotKey(validatedInput);

  // 2. Check cache
  const cached = aiCache.getCopilot(cacheKey);
  if (cached) {
    return cached;
  }

  // 3. If credentials are not configured or quota is exhausted, use deterministic fallback
  if (!isCloudflareConfigured() || aiCache.isDailyQuotaExhausted()) {
    const fallbackReason = aiCache.isDailyQuotaExhausted()
      ? 'Daily AI allowance reached, showing a standard answer'
      : 'Cloudflare credentials not configured, showing a standard answer';
    const fallback: CopilotResponse = {
      ...getDeterministicCopilotAnswer(validatedInput),
      fallbackReason,
    };
    aiCache.setCopilot(cacheKey, fallback);
    return fallback;
  }

  // 4. Deduplicate concurrent identical requests
  return aiCache.deduplicateCopilot(cacheKey, async () => {
    try {
      const aiResponse = await executeWorkersAiInference<CopilotResponse>({
        payloadBuilder: (modelId) => buildCopilotPayload(validatedInput, modelId),
        schema: CopilotResponseSchema,
        customFetch,
      });

      const result: CopilotResponse = {
        ...aiResponse,
        modelName: aiResponse.modelName || 'Cloudflare Workers AI',
        isDeterministicFallback: false,
      };

      aiCache.setCopilot(cacheKey, result);
      return result;
    } catch (err: unknown) {
      console.warn('[Copilot Workers AI Fallback]:', err instanceof Error ? err.message : String(err));
      let fallbackReason = 'AI service busy, showing a standard answer';
      if (err instanceof Error) {
        const errorWithCode = err as { code?: string; isDailyQuota?: boolean };
        if (errorWithCode.code === 'TIMEOUT') {
          fallbackReason = 'AI service busy, showing a standard answer';
        } else if (errorWithCode.code === 'QUOTA_EXHAUSTED_DAILY' || errorWithCode.isDailyQuota) {
          fallbackReason = 'Daily AI allowance reached, showing a standard answer';
        } else if (errorWithCode.code === 'RATE_LIMITED_BURST') {
          fallbackReason = 'Rate limit reached, showing a standard answer';
        }
      }
      // Graceful degradation to deterministic 7-part response
      const fallback: CopilotResponse = {
        ...getDeterministicCopilotAnswer(validatedInput),
        fallbackReason,
      };
      aiCache.setCopilot(cacheKey, fallback);
      return fallback;
    }
  });
}
