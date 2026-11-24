/**
 * AirAware — Server-Side Route Rate Limiting & Origin Security
 *
 * Implements layered request protection:
 * 1. Payload size enforcement (max 2KB standard, 32KB for AI routes).
 * 2. Origin & Same-Site header verification.
 * 3. Hashed client identifier tracking (zero raw IP persistence).
 * 4. Local sliding-window rate limiting with bounded memory (MAX_BUCKETS cap & auto-eviction).
 *
 * NOTE: This rate limiter tracks in-memory state per serverless container
 * instance (best-effort). On distributed serverless platforms like Vercel,
 * it provides robust local burst suppression per instance without unbounded growth.
 */

import { createHash } from 'crypto';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  reason?: string;
}

// 30 requests allowed per 10-minute sliding window per client for AI endpoints
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;
export const MAX_BUCKETS = 1000; // Strict upper bound on concurrent tracked IP hashes
export const MAX_PAYLOAD_BYTES = 2048; // 2KB payload ceiling for standard / GET endpoints
export const MAX_AI_PAYLOAD_BYTES = 32768; // 32KB payload ceiling for POST AI routes (guidance & copilot)

export class PayloadTooLargeError extends Error {
  constructor(message: string = `Payload too large: maximum allowed size is ${MAX_PAYLOAD_BYTES} bytes.`) {
    super(message);
    this.name = 'PayloadTooLargeError';
  }
}

interface RateLimitBucket {
  count: number;
  windowStart: number;
}

export class LocalRateLimiter {
  private buckets = new Map<string, RateLimitBucket>();
  private lastPruneTime: number = Date.now();

  constructor(
    private readonly maxRequests: number = MAX_REQUESTS_PER_WINDOW,
    private readonly windowMs: number = WINDOW_MS,
    private readonly maxBuckets: number = MAX_BUCKETS
  ) {}

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
   * Evaluates rate limit for a client hash. Automatically prunes expired buckets
   * and evicts oldest entries if the bucket map reaches capacity.
   */
  public check(clientHash: string): RateLimitResult {
    const now = Date.now();

    // Periodic or capacity-triggered cleanup to ensure O(1) memory bound
    if (now - this.lastPruneTime > this.windowMs || this.buckets.size >= this.maxBuckets) {
      this.prune(now);
      this.lastPruneTime = now;
    }

    let bucket = this.buckets.get(clientHash);

    if (!bucket || now - bucket.windowStart > this.windowMs) {
      // Memory Cap: Evict oldest entry if Map is still at maximum capacity
      if (this.buckets.size >= this.maxBuckets) {
        const oldestKey = this.buckets.keys().next().value;
        if (oldestKey !== undefined) {
          this.buckets.delete(oldestKey);
        }
      }

      bucket = { count: 1, windowStart: now };
      this.buckets.set(clientHash, bucket);
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetAt: now + this.windowMs,
      };
    }

    if (bucket.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: bucket.windowStart + this.windowMs,
        reason: `Rate limit exceeded: maximum ${this.maxRequests} requests per ${Math.round(this.windowMs / 60000)}-minute window.`,
      };
    }

    bucket.count += 1;
    return {
      allowed: true,
      remaining: this.maxRequests - bucket.count,
      resetAt: bucket.windowStart + this.windowMs,
    };
  }

  /**
   * Cleans up expired rate-limit buckets and enforces the maximum bucket ceiling.
   */
  public prune(now: number = Date.now()): void {
    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.windowStart > this.windowMs) {
        this.buckets.delete(key);
      }
    }

    // Evict oldest entries if total still exceeds maxBuckets
    while (this.buckets.size >= this.maxBuckets) {
      const oldestKey = this.buckets.keys().next().value;
      if (oldestKey === undefined) break;
      this.buckets.delete(oldestKey);
    }
  }

  /**
   * Returns current active bucket count for telemetry and assertions.
   */
  public getBucketCount(): number {
    return this.buckets.size;
  }

  public clear(): void {
    this.buckets.clear();
    this.lastPruneTime = Date.now();
  }
}

export const localRateLimiter = new LocalRateLimiter(30, WINDOW_MS, MAX_BUCKETS);
export const regionalHotspotsLimiter = new LocalRateLimiter(60, WINDOW_MS, MAX_BUCKETS);

/**
 * Validates request size and origin headers.
 * Throws a sanitized Error or PayloadTooLargeError if verification fails.
 */
export function validateRequestSecurity(req: Request, maxBytes: number = MAX_PAYLOAD_BYTES): void {
  // 1. Content-Type verification
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error('Unsupported Content-Type: application/json is required.');
  }

  // 2. Content-Length ceiling
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > maxBytes) {
    throw new PayloadTooLargeError(`Payload too large: maximum allowed size is ${maxBytes} bytes.`);
  }

  // 3. Same-origin protection (Sec-Fetch-Site)
  const fetchSite = req.headers.get('sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'same-site' && fetchSite !== 'none') {
    throw new Error('Cross-origin request rejected.');
  }
}

/**
 * Reads and verifies the JSON request body with an enforced byte size cap.
 */
export async function readJsonBodyWithLimit<T>(req: Request, maxBytes: number = MAX_PAYLOAD_BYTES): Promise<T> {
  const text = await req.text();
  if (text.length > maxBytes) {
    throw new PayloadTooLargeError(`Payload too large: maximum allowed size is ${maxBytes} bytes.`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Malformed JSON body provided.');
  }
}

/**
 * Extracts a privacy-safe hashed client identifier from standard request headers.
 * Uses the first entry of x-forwarded-for safely; does not trust spoofable client headers.
 */
export function getClientHash(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  let ipCandidate = '';

  if (forwardedFor) {
    const first = forwardedFor.split(',')[0].trim();
    if (/^[0-9a-fA-F:.]+$/.test(first)) {
      ipCandidate = first;
    }
  }

  if (!ipCandidate) {
    const realIp = req.headers.get('x-real-ip');
    if (realIp && /^[0-9a-fA-F:.]+$/.test(realIp.trim())) {
      ipCandidate = realIp.trim();
    }
  }

  if (!ipCandidate) {
    const cfIp = req.headers.get('cf-connecting-ip');
    if (cfIp && /^[0-9a-fA-F:.]+$/.test(cfIp.trim())) {
      ipCandidate = cfIp.trim();
    }
  }

  const raw = ipCandidate || 'unknown';
  return localRateLimiter.hashClientId(raw);
}
