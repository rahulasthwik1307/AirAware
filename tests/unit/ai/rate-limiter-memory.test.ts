import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { LocalRateLimiter, localRateLimiter, regionalHotspotsLimiter } from '@/lib/ai/rate-limiter';
import { aiCache } from '@/lib/ai/cache';
import { GuidanceResponse, CopilotResponse } from '@/lib/ai/types';

describe('rate-limiter and cache memory safety', () => {
  describe('LocalRateLimiter bounded memory and eviction', () => {
    let testLimiter: LocalRateLimiter;

    beforeEach(() => {
      // Create a small capacity limiter: max 5 requests, 60s window, max 3 buckets
      testLimiter = new LocalRateLimiter(5, 60000, 3);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('enforces maximum bucket capacity by evicting oldest entries', () => {
      expect(testLimiter.getBucketCount()).toBe(0);

      // Add 3 clients (reaches capacity 3)
      testLimiter.check('client-1');
      testLimiter.check('client-2');
      testLimiter.check('client-3');
      expect(testLimiter.getBucketCount()).toBe(3);

      // Adding client-4 should evict client-1 (the oldest) and keep count at 3
      const res4 = testLimiter.check('client-4');
      expect(res4.allowed).toBe(true);
      expect(testLimiter.getBucketCount()).toBe(3);

      // Adding client-5 should evict client-2 and keep count at 3
      const res5 = testLimiter.check('client-5');
      expect(res5.allowed).toBe(true);
      expect(testLimiter.getBucketCount()).toBe(3);
    });

    it('prunes expired buckets and evicts overflow on manual prune()', () => {
      vi.useFakeTimers();
      const startTime = new Date('2026-11-24T00:00:00Z').getTime();
      vi.setSystemTime(startTime);

      testLimiter.check('client-old');

      // Advance time past the 60s window
      vi.setSystemTime(startTime + 70000);
      testLimiter.check('client-active');

      expect(testLimiter.getBucketCount()).toBe(2);

      testLimiter.prune();
      expect(testLimiter.getBucketCount()).toBe(1);
    });

    it('production singleton rate limiters have bounded maxBuckets', () => {
      expect(localRateLimiter.getBucketCount()).toBeLessThanOrEqual(1000);
      expect(regionalHotspotsLimiter.getBucketCount()).toBeLessThanOrEqual(1000);
    });
  });

  describe('aiCache memory bounding and deduplication', () => {
    beforeEach(() => {
      aiCache.clear();
    });

    it('stores and retrieves guidance caching with TTL expiration', () => {
      const mockGuidance: GuidanceResponse = {
        headline: 'Clear Morning Air',
        healthSummary: 'Air quality is favorable across all zones.',
        actionRecommendations: ['Open windows for 30 minutes.', 'Safe for morning jogging.'],
        sensitiveGroupAdvisory: 'Safe baseline conditions.',
        ventilationRecommendation: 'open_windows',
        isDeterministicFallback: false,
      };

      aiCache.setGuidance('key-1', mockGuidance, 1000);
      expect(aiCache.getGuidance('key-1')).toEqual(mockGuidance);

      // Test nonexistent key
      expect(aiCache.getGuidance('key-nonexistent')).toBeNull();
    });

    it('never caches deterministic fallback answers for guidance or copilot', () => {
      const fallbackGuidance: GuidanceResponse = {
        headline: 'Rule-Based Fallback Headline',
        healthSummary: 'Deterministic air advisory.',
        actionRecommendations: ['Check local forecasts.', 'Stay indoors if sensitive.'],
        sensitiveGroupAdvisory: 'Caution for sensitive individuals.',
        ventilationRecommendation: 'ventilate_briefly',
        isDeterministicFallback: true,
      };

      aiCache.setGuidance('fallback-key', fallbackGuidance);
      expect(aiCache.getGuidance('fallback-key')).toBeNull();

      const fallbackCopilot: CopilotResponse = {
        directAnswer: 'Deterministic fallback answer',
        environmentalConditions: 'Conditions estimated from baseline.',
        recommendedAction: 'Limit exposure.',
        explanation: 'Local rules applied.',
        practicalAlternatives: ['Stay indoors'],
        dataSourceAndFreshness: 'Offline fallback rules',
        limitationsOrUncertainty: 'AI model offline',
        isDeterministicFallback: true,
      };

      aiCache.setCopilot('copilot-fallback', fallbackCopilot);
      expect(aiCache.getCopilot('copilot-fallback')).toBeNull();
    });

    it('deduplicates concurrent in-flight requests and cleans up in finally', async () => {
      let callCount = 0;
      const factory = async (): Promise<GuidanceResponse> => {
        callCount++;
        await new Promise((resolve) => setTimeout(resolve, 20));
        return {
          headline: 'Deduplicated Headline',
          healthSummary: 'Summary of conditions',
          actionRecommendations: ['Action 1', 'Action 2'],
          sensitiveGroupAdvisory: 'Safe conditions',
          ventilationRecommendation: 'open_windows',
          isDeterministicFallback: false,
        };
      };

      // Trigger two concurrent calls with identical key
      const [res1, res2] = await Promise.all([
        aiCache.deduplicateGuidance('dedup-key', factory),
        aiCache.deduplicateGuidance('dedup-key', factory),
      ]);

      expect(callCount).toBe(1); // Factory only invoked once!
      expect(res1).toEqual(res2);

      // Verify in-flight map is cleaned up after completion
      expect(aiCache.getInFlightGuidanceSize()).toBe(0);
    });

    it('cleans up in-flight map even if factory throws an error', async () => {
      const failingFactory = async (): Promise<GuidanceResponse> => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        throw new Error('API failure');
      };

      await expect(
        aiCache.deduplicateGuidance('failing-key', failingFactory)
      ).rejects.toThrow('API failure');

      expect(aiCache.getInFlightGuidanceSize()).toBe(0);
    });
  });
});
