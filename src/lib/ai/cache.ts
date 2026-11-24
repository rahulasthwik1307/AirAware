/**
 * AirAware — AI Response Cache & In-Flight Request Deduplication
 *
 * Implements token & Neuron frugality with bounded memory guarantees:
 * 1. Normalized category-based response caching (30-minute TTL) with MAX_CACHE_ENTRIES LRU eviction.
 * 2. In-flight Promise deduplication (single-flight pattern) with settle-time cleanup and bounded capacity.
 * 3. Daily quota exhaustion suppression tracking.
 */

import { GuidanceRequest, GuidanceResponse, CopilotRequest, CopilotResponse } from './types';
import { sanitizeUserQuery } from './prompt-builder';
import { AI_CACHE_DEFAULT_TTL_MS } from './constants';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// 30 minutes cache TTL (aligned with sensor refresh frequency)
const DEFAULT_TTL_MS = AI_CACHE_DEFAULT_TTL_MS;
export const MAX_CACHE_ENTRIES = 500;
export const MAX_IN_FLIGHT_REQUESTS = 100;

class AiCacheManager {
  private guidanceCache = new Map<string, CacheEntry<GuidanceResponse>>();
  private copilotCache = new Map<string, CacheEntry<CopilotResponse>>();
  private inFlightGuidance = new Map<string, Promise<GuidanceResponse>>();
  private inFlightCopilot = new Map<string, Promise<CopilotResponse>>();
  private dailyQuotaExhaustedUntil: number = 0;

  /**
   * Generates a normalized cache key for proactive guidance.
   * Caches per (location, profile, hour) to avoid duplicate calls.
   */
  public getGuidanceKey(req: GuidanceRequest): string {
    const currentHour = new Date().getHours();
    const city = req.cityName ? req.cityName.toLowerCase().trim() : 'default';
    const profile =
      req.householdMembers && req.householdMembers.length > 0
        ? req.householdMembers
            .map((m) => `${m.id}_${m.sensitivityTier}`)
            .sort()
            .join(';')
        : req.userContext.primaryActivity;

    return [
      city,
      profile,
      `h:${currentHour}`,
      req.category,
      req.dominantPollutant,
      req.userContext.isSensitiveGroup ? 'sens:1' : 'sens:0',
      req.userContext.locale || 'en',
    ].join('|');
  }

  /**
   * Generates a normalized cache key for Copilot questions.
   */
  public getCopilotKey(req: CopilotRequest): string {
    const sanitized = sanitizeUserQuery(req.question).toLowerCase();
    return [
      sanitized,
      req.category,
      req.dominantPollutant,
      req.userContext?.isSensitiveGroup ? 'sens:1' : 'sens:0',
    ].join('|');
  }

  public getGuidance(key: string): GuidanceResponse | null {
    const entry = this.guidanceCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.guidanceCache.delete(key);
      return null;
    }
    return entry.data;
  }

  public setGuidance(key: string, data: GuidanceResponse, ttlMs = DEFAULT_TTL_MS): void {
    // aiCache must never store rule-based fallback answers or timeout/error results
    if (data.isDeterministicFallback) {
      return;
    }

    // Strict Memory Cap: Evict oldest entry when capacity is reached
    if (this.guidanceCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = this.guidanceCache.keys().next().value;
      if (oldestKey !== undefined) {
        this.guidanceCache.delete(oldestKey);
      }
    }

    this.guidanceCache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  public getCopilot(key: string): CopilotResponse | null {
    const entry = this.copilotCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.copilotCache.delete(key);
      return null;
    }
    return entry.data;
  }

  public setCopilot(key: string, data: CopilotResponse, ttlMs = DEFAULT_TTL_MS): void {
    // aiCache must never store rule-based fallback answers or timeout/error results
    if (data.isDeterministicFallback || data.fallbackReason) {
      return;
    }

    // Strict Memory Cap: Evict oldest entry when capacity is reached
    if (this.copilotCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = this.copilotCache.keys().next().value;
      if (oldestKey !== undefined) {
        this.copilotCache.delete(oldestKey);
      }
    }

    this.copilotCache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Executes or shares an in-flight Promise for identical concurrent guidance requests.
   * Guarantees safe cleanup in finally and bounds maximum concurrent tracking.
   */
  public async deduplicateGuidance(
    key: string,
    factory: () => Promise<GuidanceResponse>
  ): Promise<GuidanceResponse> {
    const existing = this.inFlightGuidance.get(key);
    if (existing) return existing;

    if (this.inFlightGuidance.size >= MAX_IN_FLIGHT_REQUESTS) {
      return factory();
    }

    const promise = factory().finally(() => {
      this.inFlightGuidance.delete(key);
    });

    this.inFlightGuidance.set(key, promise);
    return promise;
  }

  /**
   * Executes or shares an in-flight Promise for identical concurrent Copilot requests.
   * Guarantees safe cleanup in finally and bounds maximum concurrent tracking.
   */
  public async deduplicateCopilot(
    key: string,
    factory: () => Promise<CopilotResponse>
  ): Promise<CopilotResponse> {
    const existing = this.inFlightCopilot.get(key);
    if (existing) return existing;

    if (this.inFlightCopilot.size >= MAX_IN_FLIGHT_REQUESTS) {
      return factory();
    }

    const promise = factory().finally(() => {
      this.inFlightCopilot.delete(key);
    });

    this.inFlightCopilot.set(key, promise);
    return promise;
  }

  /**
   * Marks that the account's 10,000 Neuron quota has been exhausted.
   * Suppresses all AI inference until the next 00:00 UTC.
   */
  public setDailyQuotaExhausted(): void {
    const now = new Date();
    const nextUtcMidnight = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0, 0, 0, 0
    ));
    this.dailyQuotaExhaustedUntil = nextUtcMidnight.getTime();
  }

  public isDailyQuotaExhausted(): boolean {
    if (this.dailyQuotaExhaustedUntil === 0) return false;
    if (Date.now() >= this.dailyQuotaExhaustedUntil) {
      this.dailyQuotaExhaustedUntil = 0; // Reset after midnight UTC
      return false;
    }
    return true;
  }

  public getDailyQuotaResetTimestamp(): number {
    return this.dailyQuotaExhaustedUntil;
  }

  public getGuidanceCacheSize(): number {
    return this.guidanceCache.size;
  }

  public getCopilotCacheSize(): number {
    return this.copilotCache.size;
  }

  public getInFlightGuidanceSize(): number {
    return this.inFlightGuidance.size;
  }

  public getInFlightCopilotSize(): number {
    return this.inFlightCopilot.size;
  }

  public clear(): void {
    this.guidanceCache.clear();
    this.copilotCache.clear();
    this.inFlightGuidance.clear();
    this.inFlightCopilot.clear();
    this.dailyQuotaExhaustedUntil = 0;
  }
}

export const aiCache = new AiCacheManager();
