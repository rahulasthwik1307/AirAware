import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { executeWorkersAiInference } from '@/lib/ai/cloudflare-client';
import { GuidanceResponseSchema, GuidanceResponse } from '@/lib/ai/types';
import { aiCache } from '@/lib/ai/cache';
import { CLOUDFLARE_DEFAULTS } from '@/lib/ai/config';

describe('Cloudflare Workers AI Client & Failover', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      CLOUDFLARE_ACCOUNT_ID: CLOUDFLARE_DEFAULTS.ACCOUNT_ID,
      CLOUDFLARE_API_TOKEN: 'mock_test_token_123',
    };
    aiCache.clear();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  const validResponseData: GuidanceResponse = {
    headline: 'Air Quality is Great',
    healthSummary: 'Clean air with low particulate levels.',
    actionRecommendations: ['Enjoy running outside.', 'Keep windows open.'],
    sensitiveGroupAdvisory: 'Safe for everyone.',
    ventilationRecommendation: 'open_windows',
    isDeterministicFallback: false,
  };

  it('successfully parses OpenAI-compatible response envelope', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify(validResponseData),
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await executeWorkersAiInference({
      payloadBuilder: () => ({ test: true }),
      schema: GuidanceResponseSchema,
      customFetch: mockFetch,
    });

    expect(result).toEqual(validResponseData);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toContain(CLOUDFLARE_DEFAULTS.MODEL_PRIMARY);
  });

  it('fails over to secondary model when primary returns HTTP 503 overload (error 3040)', async () => {
    const mockFetch = vi.fn()
      // Primary attempt 1: 503 overload (Cloudflare 3040)
      .mockResolvedValueOnce(new Response(JSON.stringify({ errors: [{ code: 3040, message: 'Out of capacity' }] }), { status: 503 }))
      // Primary retry: 503 overload
      .mockResolvedValueOnce(new Response(JSON.stringify({ errors: [{ code: 3040, message: 'Out of capacity' }] }), { status: 503 }))
      // Secondary attempt: 200 OK
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            result: {
              response: JSON.stringify(validResponseData),
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

    const result = await executeWorkersAiInference({
      payloadBuilder: () => ({ test: true }),
      schema: GuidanceResponseSchema,
      customFetch: mockFetch,
    });

    expect(result).toEqual(validResponseData);
    expect(mockFetch).toHaveBeenCalledTimes(3);
    // 3rd call must target secondary model
    expect(mockFetch.mock.calls[2][0]).toContain(CLOUDFLARE_DEFAULTS.MODEL_SECONDARY);
  });

  it('fails over to tertiary model when primary and secondary both fail', async () => {
    const mockFetch = vi.fn()
      // Primary attempt 1 + retry
      .mockResolvedValueOnce(new Response('Internal Server Error', { status: 500 }))
      .mockResolvedValueOnce(new Response('Internal Server Error', { status: 500 }))
      // Secondary attempt
      .mockResolvedValueOnce(new Response('Internal Server Error', { status: 500 }))
      // Tertiary attempt: 200 OK
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            response: JSON.stringify(validResponseData),
          }),
          { status: 200 }
        )
      );

    const result = await executeWorkersAiInference({
      payloadBuilder: () => ({ test: true }),
      schema: GuidanceResponseSchema,
      customFetch: mockFetch,
    });

    expect(result).toEqual(validResponseData);
    expect(mockFetch).toHaveBeenCalledTimes(4);
    expect(mockFetch.mock.calls[3][0]).toContain(CLOUDFLARE_DEFAULTS.MODEL_TERTIARY);
  });

  it('stops immediately and DOES NOT switch models on daily quota exhaustion', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          errors: [{ message: 'Daily limit reached: 10,000 Neurons exhausted', code: 1000 }],
        }),
        { status: 429 }
      )
    );

    await expect(
      executeWorkersAiInference({
        payloadBuilder: () => ({ test: true }),
        schema: GuidanceResponseSchema,
        customFetch: mockFetch,
      })
    ).rejects.toThrow(/Daily 10,000 Neuron quota/);

    // CRITICAL: Must be called only ONCE! Never retry secondary on daily quota
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(aiCache.isDailyQuotaExhausted()).toBe(true);
  });

  it('fails safely and DOES NOT switch models on ambiguous HTTP 429 without Retry-After', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response('Rate limit reached', { status: 429 })
    );

    await expect(
      executeWorkersAiInference({
        payloadBuilder: () => ({ test: true }),
        schema: GuidanceResponseSchema,
        customFetch: mockFetch,
      })
    ).rejects.toThrow(/Daily 10,000 Neuron quota reached or ambiguous rate limit/);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(aiCache.isDailyQuotaExhausted()).toBe(true);
  });

  it('aborts on timeout and does NOT start a chain of slow model calls', async () => {
    const mockFetch = vi.fn().mockImplementation(() => {
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      return Promise.reject(error);
    });

    await expect(
      executeWorkersAiInference({
        payloadBuilder: () => ({ test: true }),
        schema: GuidanceResponseSchema,
        customFetch: mockFetch,
      })
    ).rejects.toThrow(/timed out/);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('rejects on invalid JSON without attempting regex repairs', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'Sorry, I cannot produce valid JSON: { broken' } }],
        }),
        { status: 200 }
      )
    );

    await expect(
      executeWorkersAiInference({
        payloadBuilder: () => ({ test: true }),
        schema: GuidanceResponseSchema,
        customFetch: mockFetch,
      })
    ).rejects.toThrow(/not valid JSON/);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('rejects on Zod validation failure without re-querying', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  headline: 'Missing required fields',
                }),
              },
            },
          ],
        }),
        { status: 200 }
      )
    );

    await expect(
      executeWorkersAiInference({
        payloadBuilder: () => ({ test: true }),
        schema: GuidanceResponseSchema,
        customFetch: mockFetch,
      })
    ).rejects.toThrow(/Zod validation failed/);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('successfully cleans markdown code fences from completion payload', async () => {
    const fencedContent = '```json\n' + JSON.stringify(validResponseData) + '\n```';
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: fencedContent } }],
        }),
        { status: 200 }
      )
    );

    const result = await executeWorkersAiInference({
      payloadBuilder: () => ({ test: true }),
      schema: GuidanceResponseSchema,
      customFetch: mockFetch,
    });

    expect(result).toEqual(validResponseData);
  });

  it('supports direct text completion format in choices[0].text', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ text: JSON.stringify(validResponseData) }],
        }),
        { status: 200 }
      )
    );

    const result = await executeWorkersAiInference({
      payloadBuilder: () => ({ test: true }),
      schema: GuidanceResponseSchema,
      customFetch: mockFetch,
    });

    expect(result).toEqual(validResponseData);
  });
});
