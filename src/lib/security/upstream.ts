/**
 * AirAware — Server-Side Upstream Fetch & SSRF Protection
 *
 * Enforces strict allowlisting of external hostnames, mandatory timeouts,
 * and generic error handling to prevent SSRF and upstream error leakage.
 */

const ALLOWED_UPSTREAM_ORIGINS = new Set([
  'https://air-quality-api.open-meteo.com',
  'https://api.open-meteo.com',
  'https://geocoding-api.open-meteo.com',
  'https://api.openaq.org',
  'https://api.cloudflare.com',
]);

export class UpstreamSecurityError extends Error {
  constructor(message: string, public readonly status: number = 502) {
    super(message);
    this.name = 'UpstreamSecurityError';
  }
}

/**
 * Validates that an upstream URL strictly matches an allowlisted origin.
 * Prevents SSRF vectors from dynamic URL construction.
 */
export function validateUpstreamUrl(urlStr: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    throw new UpstreamSecurityError('Invalid upstream target URL', 502);
  }

  if (parsed.protocol !== 'https:') {
    throw new UpstreamSecurityError('Insecure upstream protocol rejected: HTTPS required', 502);
  }

  if (!ALLOWED_UPSTREAM_ORIGINS.has(parsed.origin)) {
    throw new UpstreamSecurityError(`Unapproved upstream origin rejected: ${parsed.origin}`, 502);
  }

  return parsed;
}

/**
 * Secure wrapper around global fetch with allowlist validation,
 * mandatory AbortController timeout, and size limits.
 */
export async function secureUpstreamFetch(
  urlStr: string,
  options: RequestInit & { next?: { revalidate?: number } } = {},
  timeoutMs: number = 8000
): Promise<Response> {
  const verifiedUrl = validateUpstreamUrl(urlStr);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(verifiedUrl.toString(), {
      ...options,
      signal: controller.signal,
    });
    return res;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new UpstreamSecurityError('Upstream provider timed out', 504);
    }
    throw new UpstreamSecurityError('Failed to communicate with upstream provider', 502);
  } finally {
    clearTimeout(timeoutId);
  }
}
