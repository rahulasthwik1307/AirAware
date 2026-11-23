/**
 * AirAware — Air Copilot Conversational API Route Handler
 * POST /api/ai/copilot
 *
 * Server-only endpoint mediating the interactive Air Copilot assistant (30 requests/10-min window).
 * Conforms to Master Specification §4.4 (7-part response structure).
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { askAirCopilot, CopilotRequestSchema, aiCache } from '@/lib/ai';
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
 * POST /api/ai/copilot
 * Purpose: Answers natural-language environmental inquiries conforming to Master Specification §4.4.
 * Inputs: Validated JSON body satisfying CopilotRequestSchema.
 * Never: Never retains chat transcripts on the server or exposes raw unhandled inference failures.
 */
export async function POST(req: Request) {
  try {
    if (process.env.NODE_ENV !== 'production' && req.url.includes('reset=1')) {
      localRateLimiter.clear();
    }

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
    const validatedInput = CopilotRequestSchema.parse(body);

    // 4. Retrieve Copilot answer (Cloudflare AI or Deterministic Fallback)
    const result = await askAirCopilot(validatedInput);

    const headers: Record<string, string> = {
      'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate',
      Pragma: 'no-cache',
      'X-AirAware-Response-Source': result.isDeterministicFallback ? 'deterministic' : 'cloudflare-ai',
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
          message: 'Invalid Copilot request payload.',
          details: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Invalid Copilot request.';
    return NextResponse.json(
      {
        error: 'BAD_REQUEST',
        message,
      },
      { status: 400 }
    );
  }
}
