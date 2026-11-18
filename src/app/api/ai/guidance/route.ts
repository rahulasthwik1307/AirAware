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
} from '@/lib/ai/rate-limiter';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    // 1. Request security check (Origin, Content-Type, Content-Length)
    validateRequestSecurity(req);

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
    const body = await req.json();
    const validatedInput = GuidanceRequestSchema.parse(body);

    // 4. Retrieve guidance (Cloudflare AI or Deterministic Fallback)
    const result = await getPersonalizedGuidance(validatedInput);

    const headers: Record<string, string> = {
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=600',
    };

    if (aiCache.isDailyQuotaExhausted()) {
      headers['X-AirAware-Quota-Exhausted'] = 'true';
      headers['X-AirAware-Quota-Reset-Utc'] = String(aiCache.getDailyQuotaResetTimestamp());
    }

    return NextResponse.json(result, { status: 200, headers });
  } catch (error: unknown) {
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

    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      {
        error: 'BAD_REQUEST',
        message,
      },
      { status: 400 }
    );
  }
}
