/**
 * AirAware — Cloudflare Workers AI Client & Model Failover Engine
 *
 * Implements:
 * 1. Native fetch to Cloudflare Workers AI endpoint.
 * 2. Approved model hierarchy: Gemma 4 -> GLM-4.7 Flash -> Granite 4.0 Micro.
 * 3. Strict 5,000ms AbortController timeout.
 * 4. Error classification: distinguishes daily quota 429 from burst 429.
 * 5. Strict Zod schema validation of model output (zero regex repairs).
 */

import { ZodType } from 'zod';
import { getCloudflareAiConfig } from './config';
import { AiServiceError } from './types';
import { aiCache } from './cache';

const TIMEOUT_MS = 5000;
const RETRY_DELAY_MS = 200;

export interface InferenceOptions<T> {
  payloadBuilder: (modelId: string) => Record<string, unknown>;
  schema: ZodType<T, any, any>;
  customFetch?: typeof fetch; // For unit testing and mocking
}

/**
 * Executes inference against Cloudflare Workers AI with verified failover logic.
 */
export async function executeWorkersAiInference<T>(options: InferenceOptions<T>): Promise<T> {
  const { payloadBuilder, schema, customFetch = fetch } = options;

  // 1. Check if daily quota is already known to be exhausted
  if (aiCache.isDailyQuotaExhausted()) {
    throw new AiServiceError(
      'QUOTA_EXHAUSTED_DAILY',
      'Daily Cloudflare Workers AI 10,000 Neuron quota is exhausted.',
      429,
      true
    );
  }

  const config = getCloudflareAiConfig();
  const models = [
    config.models.primary,
    config.models.secondary,
    config.models.tertiary,
  ];

  let lastError: Error | null = null;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const isPrimary = i === 0;

    try {
      return await attemptModelInference<T>({
        model,
        payload: payloadBuilder(model),
        schema,
        config,
        customFetch,
      });
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (err instanceof AiServiceError) {
        // Daily quota exhaustion or ambiguous 429: STOP all model attempts immediately!
        if (err.isDailyQuota || err.code === 'QUOTA_EXHAUSTED_DAILY') {
          aiCache.setDailyQuotaExhausted();
          throw err;
        }

        // Burst rate limit: fail safely without switching models
        if (err.code === 'RATE_LIMITED_BURST') {
          throw err;
        }

        // Schema validation error: do NOT retry or burn additional Neurons
        if (err.code === 'SCHEMA_VALIDATION_ERROR') {
          throw err;
        }

        // Timeout on primary: do NOT chain slow models
        if (err.code === 'TIMEOUT') {
          throw err;
        }

        // Auth error: do not retry other models
        if (err.code === 'CONFIG_MISSING') {
          throw err;
        }

        // If it's a transient overload (3040/500/503), retry once with jitter if primary
        if ((err.code === 'PROVIDER_OVERLOAD' || err.code === 'NETWORK_ERROR') && isPrimary) {
          try {
            await sleep(RETRY_DELAY_MS + Math.random() * 100);
            return await attemptModelInference<T>({
              model,
              payload: payloadBuilder(model),
              schema,
              config,
              customFetch,
            });
          } catch (retryErr) {
            // Retry failed; fall through to next model in loop
            lastError = retryErr instanceof Error ? retryErr : new Error(String(retryErr));
          }
        }
      }

      // If we reach here, proceed to next model in hierarchy (Secondary -> Tertiary)
    }
  }

  throw lastError || new AiServiceError('PROVIDER_OVERLOAD', 'All approved Workers AI models failed.');
}

interface AttemptParams<T> {
  model: string;
  payload: Record<string, unknown>;
  schema: ZodType<T, any, any>;
  config: ReturnType<typeof getCloudflareAiConfig>;
  customFetch: typeof fetch;
}

async function attemptModelInference<T>(params: AttemptParams<T>): Promise<T> {
  const { model, payload, schema, config, customFetch } = params;
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/ai/run/${encodeURIComponent(model)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await customFetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new AiServiceError('TIMEOUT', `Workers AI request to ${model} timed out after ${TIMEOUT_MS}ms`, 504);
    }
    throw new AiServiceError('NETWORK_ERROR', `Network failure calling Workers AI: ${(err as Error).message}`, 500);
  } finally {
    clearTimeout(timeoutId);
  }

  // Handle HTTP status codes
  if (!response.ok) {
    const errorBody = await response.text();
    const status = response.status;

    // 401/403 Authentication failure
    if (status === 401 || status === 403) {
      throw new AiServiceError('CONFIG_MISSING', 'Cloudflare Workers AI authentication failed.', status);
    }

    // 429 Rate Limiting / Quota Exhaustion
    if (status === 429) {
      const retryAfterHeader = response.headers.get('retry-after');
      const retryAfterSec = retryAfterHeader ? parseInt(retryAfterHeader, 10) : null;

      const isDailyExhausted =
        errorBody.toLowerCase().includes('quota') ||
        errorBody.toLowerCase().includes('daily') ||
        errorBody.toLowerCase().includes('neuron') ||
        errorBody.toLowerCase().includes('limit reached');

      // Fail-safe rule: If body signals daily quota OR Retry-After is absent/excessive,
      // fail safely as account quota exhaustion (zero model switching).
      if (isDailyExhausted || retryAfterSec === null || retryAfterSec > 2) {
        throw new AiServiceError('QUOTA_EXHAUSTED_DAILY', 'Daily 10,000 Neuron quota reached or ambiguous rate limit.', 429, true);
      } else {
        throw new AiServiceError('RATE_LIMITED_BURST', 'Workers AI transient burst limit with Retry-After.', 429, false);
      }
    }

    // 404 / 410 Model Retired / Unavailable
    if (status === 404 || status === 410) {
      throw new AiServiceError('MODEL_UNAVAILABLE', `Model ${model} is retired or unavailable.`, status);
    }

    // 3040 / 500 / 503 Provider Overload
    throw new AiServiceError(
      'PROVIDER_OVERLOAD',
      `Workers AI provider overload (HTTP ${status}): ${errorBody.slice(0, 100)}`,
      status
    );
  }

  // Extract text completion from JSON envelope
  const jsonEnvelope = await response.json();
  const rawCompletion = extractCompletionText(jsonEnvelope);

  if (!rawCompletion) {
    throw new AiServiceError('SCHEMA_VALIDATION_ERROR', 'Model returned empty completion payload.', 500);
  }

  // Parse structured JSON
  let parsedObject: unknown;
  try {
    parsedObject = JSON.parse(rawCompletion);
  } catch {
    throw new AiServiceError('SCHEMA_VALIDATION_ERROR', 'Model response is not valid JSON.', 500);
  }

  // Validate with strict Zod schema
  const validationResult = schema.safeParse(parsedObject);
  if (!validationResult.success) {
    throw new AiServiceError(
      'SCHEMA_VALIDATION_ERROR',
      `Zod validation failed: ${validationResult.error.message}`,
      500
    );
  }

  return validationResult.data;
}

/**
 * Safely extracts completion content from Cloudflare's supported response envelopes:
 * 1. Standard OpenAI format: { choices: [{ message: { content: string } }] }
 * 2. Cloudflare result wrapper: { result: { response: string } }
 * 3. Bare response format: { response: string }
 */
function extractCompletionText(json: unknown): string | null {
  if (!json || typeof json !== 'object') return null;

  const obj = json as Record<string, unknown>;

  // Format 1: OpenAI-compatible choices array
  if (Array.isArray(obj.choices) && obj.choices.length > 0) {
    const choice = obj.choices[0] as Record<string, unknown>;
    const message = choice.message as Record<string, unknown> | undefined;
    if (message && typeof message.content === 'string') {
      return message.content.trim();
    }
  }

  // Format 2: Cloudflare result envelope
  if (obj.result && typeof obj.result === 'object') {
    const result = obj.result as Record<string, unknown>;
    if (typeof result.response === 'string') {
      return result.response.trim();
    }
    if (Array.isArray(result.choices) && result.choices.length > 0) {
      const choice = result.choices[0] as Record<string, unknown>;
      const message = choice.message as Record<string, unknown> | undefined;
      if (message && typeof message.content === 'string') {
        return message.content.trim();
      }
    }
  }

  // Format 3: Direct response field
  if (typeof obj.response === 'string') {
    return obj.response.trim();
  }

  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
