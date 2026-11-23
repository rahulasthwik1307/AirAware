/**
 * AirAware — Proactive Guidance API Route Handler
 * POST /api/ai/guidance
 *
 * Server-only endpoint mediating personalized environmental guidance.
 * Protected by layered security, rate limiting, and guaranteed deterministic fallback.
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getPersonalizedGuidance, GuidanceRequestSchema, aiCache } from '@/lib/ai';
import {
  validateRequestSecurity,
  getClientHash,
  localRateLimiter,
  PayloadTooLargeError,
  readJsonBodyWithLimit,
  MAX_AI_PAYLOAD_BYTES,
} from '@/lib/ai/rate-limiter';

export const runtime = 'nodejs';

/**
 * POST /api/ai/guidance
 * Purpose: Evaluates personalized proactive environmental guidance from verified telemetry.
 * Inputs: Validated JSON body satisfying GuidanceRequestSchema.
 * Never: Never exposes internal prompt structures, logs PII, or stores unvalidated client requests.
 */
export async function POST(req: Request) {
  try {
    // 1. Request security check (Origin, Content-Type, Content-Length)
    validateRequestSecurity(req, MAX_AI_PAYLOAD_BYTES);

    // 2. Client rate-limit check
    const clientHash = getClientHash(req);
    const rateCheck = localRateLimiter.check(clientHash);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: 'RATE_LIMIT_EXCEEDED',
          message: rateCheck.reason || 'Too many requests.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)),
          },
        }
      );
    }

    // 3. Body parsing & Zod schema validation
    const body = await readJsonBodyWithLimit<unknown>(req, MAX_AI_PAYLOAD_BYTES);
    const validatedInput = GuidanceRequestSchema.parse(body);

    // 4. Retrieve guidance (Cloudflare AI or Deterministic Fallback)
    const result = await getPersonalizedGuidance(validatedInput);

    const headers: Record<string, string> = {
      'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate',
      Pragma: 'no-cache',
    };

    if (aiCache.isDailyQuotaExhausted()) {
      headers['X-AirAware-Quota-Exhausted'] = 'true';
      headers['X-AirAware-Quota-Reset-Utc'] = String(aiCache.getDailyQuotaResetTimestamp());
    }

    return NextResponse.json(result, { status: 200, headers });
  } catch (error: unknown) {
    if (error instanceof PayloadTooLargeError) {
      return NextResponse.json(
        {
          error: 'PAYLOAD_TOO_LARGE',
          message: 'Request payload exceeds maximum allowed size.',
        },
        { status: 413 }
      );
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Invalid guidance request payload.',
          details: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Invalid guidance request.';
    return NextResponse.json(
      {
        error: 'BAD_REQUEST',
        message,
      },
      { status: 400 }
    );
  }
}
