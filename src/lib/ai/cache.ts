/**
 * AirAware — AI Response Cache & In-Flight Request Deduplication
 *
 * Implements token & Neuron frugality:
 * 1. Normalized category-based response caching (30-minute TTL).
 * 2. In-flight Promise deduplication (single-flight pattern).
 * 3. Daily quota exhaustion suppression tracking.
 */

import { GuidanceRequest, GuidanceResponse, CopilotRequest, CopilotResponse } from './types';
import { sanitizeUserQuery } from './prompt-builder';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// 30 minutes cache TTL (aligned with sensor refresh frequency)
const DEFAULT_TTL_MS = 30 * 60 * 1000;

class AiCacheManager {
  private guidanceCache = new Map<string, CacheEntry<GuidanceResponse>>();
  private copilotCache = new Map<string, CacheEntry<CopilotResponse>>();
  private inFlightGuidance = new Map<string, Promise<GuidanceResponse>>();
  private inFlightCopilot = new Map<string, Promise<CopilotResponse>>();
  private dailyQuotaExhaustedUntil: number = 0;

  /**
   * Generates a normalized cache key for proactive guidance.
   * Groups requests by category, dominant pollutant, and persona rather than raw numbers.
   */
  public getGuidanceKey(req: GuidanceRequest): string {
    return [
      req.category,
      req.dominantPollutant,
      req.userContext.isSensitiveGroup ? 'sens:1' : 'sens:0',
      req.userContext.primaryActivity,
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
    this.copilotCache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Executes or shares an in-flight Promise for identical concurrent guidance requests.
   */
  public async deduplicateGuidance(
    key: string,
    factory: () => Promise<GuidanceResponse>
  ): Promise<GuidanceResponse> {
    const existing = this.inFlightGuidance.get(key);
    if (existing) return existing;

    const promise = factory().finally(() => {
      this.inFlightGuidance.delete(key);
    });

    this.inFlightGuidance.set(key, promise);
    return promise;
  }

  /**
   * Executes or shares an in-flight Promise for identical concurrent Copilot requests.
   */
  public async deduplicateCopilot(
    key: string,
    factory: () => Promise<CopilotResponse>
  ): Promise<CopilotResponse> {
    const existing = this.inFlightCopilot.get(key);
    if (existing) return existing;

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

  public clear(): void {
    this.guidanceCache.clear();
    this.copilotCache.clear();
    this.inFlightGuidance.clear();
    this.inFlightCopilot.clear();
    this.dailyQuotaExhaustedUntil = 0;
  }
}

export const aiCache = new AiCacheManager();
