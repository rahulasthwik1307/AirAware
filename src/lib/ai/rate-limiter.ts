/**
 * AirAware — Server-Side Route Rate Limiting & Origin Security
 *
 * Implements layered request protection:
 * 1. Payload size enforcement (max 2KB).
 * 2. Origin & Same-Site header verification.
 * 3. Hashed client identifier tracking (zero raw IP persistence).
 * 4. Local burst protection without paid dependencies.
 */

import { createHash } from 'crypto';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  reason?: string;
}

// 30 requests allowed per 10-minute sliding window per client (fluid human conversation)
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;
const MAX_PAYLOAD_BYTES = 2048; // 2KB payload ceiling

interface RateLimitBucket {
  count: number;
  windowStart: number;
}

class LocalRateLimiter {
  private buckets = new Map<string, RateLimitBucket>();

  /**
   * Hashes client identity (IP or session) to prevent logging or storing raw PII.
   */
  public hashClientId(rawIdentifier: string): string {
    return createHash('sha256')
      .update(rawIdentifier || 'anonymous')
      .digest('hex')
      .slice(0, 16);
  }

  /**
   * Evaluates rate limit for a client hash.
   */
  public check(clientHash: string): RateLimitResult {
    const now = Date.now();
    let bucket = this.buckets.get(clientHash);

    if (!bucket || now - bucket.windowStart > WINDOW_MS) {
      bucket = { count: 1, windowStart: now };
      this.buckets.set(clientHash, bucket);
      return {
        allowed: true,
        remaining: MAX_REQUESTS_PER_WINDOW - 1,
        resetAt: now + WINDOW_MS,
      };
    }

    if (bucket.count >= MAX_REQUESTS_PER_WINDOW) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: bucket.windowStart + WINDOW_MS,
        reason: 'Rate limit exceeded: maximum 30 guidance requests per 10-minute window.',
      };
    }

    bucket.count += 1;
    return {
      allowed: true,
      remaining: MAX_REQUESTS_PER_WINDOW - bucket.count,
      resetAt: bucket.windowStart + WINDOW_MS,
    };
  }

  /**
   * Cleans up expired rate-limit buckets to prevent memory leaks.
   */
  public prune(): void {
    const now = Date.now();
    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.windowStart > WINDOW_MS) {
        this.buckets.delete(key);
      }
    }
  }

  public clear(): void {
    this.buckets.clear();
  }
}

export const localRateLimiter = new LocalRateLimiter();

/**
 * Validates request size and origin headers.
 * Throws a sanitized Error if the request fails security verification.
 */
export function validateRequestSecurity(req: Request): void {
  // 1. Content-Type verification
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error('Unsupported Content-Type: application/json is required.');
  }

  // 2. Content-Length ceiling
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
    throw new Error(`Payload too large: maximum allowed size is ${MAX_PAYLOAD_BYTES} bytes.`);
  }

  // 3. Same-origin protection (Sec-Fetch-Site)
  const fetchSite = req.headers.get('sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'same-site' && fetchSite !== 'none') {
    throw new Error('Cross-origin request rejected.');
  }
}

/**
 * Extracts a privacy-safe hashed client identifier from standard request headers.
 */
export function getClientHash(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for') || '';
  const realIp = req.headers.get('x-real-ip') || '';
  const cfConnectingIp = req.headers.get('cf-connecting-ip') || '';
  const userAgent = req.headers.get('user-agent') || '';

  const raw = `${cfConnectingIp || realIp || forwardedFor.split(',')[0].trim() || 'unknown'}-${userAgent}`;
  return localRateLimiter.hashClientId(raw);
}
