# Security Policy

## Scope & Architectural Posture

AirAware is an open-source environmental intelligence web application built with Next.js 16 and TypeScript. It processes atmospheric telemetry and provides personalized family routine adjustments, indoor air guidance, and sustainable transport alternatives. The application architecture operates without a server-side database or user authentication; all user profiles, schedules, and custom preferences persist exclusively in browser `localStorage`.

## Secrets Handling

All third-party API credentials are strictly server-side and never exposed to client bundles:
- `OPENAQ_API_KEY`: Server-side OpenAQ v3 ground station queries.
- `CLOUDFLARE_ACCOUNT_ID` & `CLOUDFLARE_API_TOKEN`: Server-side Cloudflare Workers AI execution.
- No client-facing environment variables (`NEXT_PUBLIC_*`) contain secrets or tokens.
- Source control hygiene: `.env.local` is excluded via `.gitignore`, with `.env.example` providing configuration names and instructions without real credentials.

## Input Validation & Route Hardening

All Next.js API route handlers validate inputs using strict Zod schemas (`.strict()`):
- `GET /api/air-quality`: Validates latitude (-90 to 90), longitude (-180 to 180), and timezone regex; rejects unapproved query parameters with HTTP 400.
- `GET /api/weather`: Validates coordinates and timezone bounds; rejects extraneous parameters.
- `GET /api/locations/search`: Enforces name lengths (2–100 characters) and result count caps (1–10).
- `POST /api/ai/guidance` & `POST /api/ai/copilot`: Enforces JSON payload ceilings (`MAX_AI_PAYLOAD_BYTES = 32768`), validates payloads against `GuidanceRequestSchema` and `CopilotRequestSchema`, and rejects non-JSON or oversized requests.

## Rate Limiting & Denial-of-Service Defense

- Endpoint protection: `localRateLimiter` enforces a sliding window limit of 30 requests per 10-minute window on AI routes, returning HTTP 429 with a `Retry-After` header when exceeded.
- Architectural limitation: In serverless deployments (such as Vercel), in-memory rate limiting operates on a best-effort basis per isolated container instance rather than via a distributed global Redis cluster.

## Upstream Network Allowlist & Timeouts

Outbound server requests run through `secureUpstreamFetch` (`src/lib/security/upstream.ts`):
- Mandatory origin allowlist: `https://air-quality-api.open-meteo.com`, `https://api.open-meteo.com`, `https://geocoding-api.open-meteo.com`, `https://api.openaq.org`, and `https://api.cloudflare.com`.
- SSRF prevention: Strict protocol checks (HTTPS required) and unapproved host rejection.
- Timeouts: 8,000ms mandatory AbortController timeout prevents upstream connection exhaustion.

## Prompt Injection & LLM Output Defenses

- Input sanitization: `sanitizeUserQuery` enforces a 200-character maximum cap, strips control characters (`[\x00-\x1F\x7F-\x9F]`), and removes angle brackets (`<` and `>`) to prevent prompt structure breakout.
- Output validation: Raw LLM responses from Cloudflare Workers AI are parsed directly with Zod schemas (`GuidanceResponseSchema`, `CopilotResponseSchema`). Responses failing validation immediately fail closed to `getDeterministicGuidance` or `getDeterministicCopilotAnswer`.

## Security Headers

Configured in `next.config.ts`:
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`
- `Permissions-Policy: geolocation=(self), camera=(), microphone=(), payment=()`
- `Cross-Origin-Opener-Policy: same-origin`
- `poweredByHeader: false` (removes `X-Powered-By: Next.js`)
- `Content-Security-Policy-Report-Only`: CSP policy directives deployed in report-only mode.

## Client Storage Safety

- User data (household profiles, indoor parameters, habit selections) resides only in client `localStorage`.
- No session cookies or sensitive tokens are stored in the browser.
- "Clear my data" executes `clearAllAirAwareData()`, which purges all registered `airaware_*` keys and clears `sessionStorage`.

## Dependency Hygiene

Dependencies are audited regularly. Run `npm audit` to inspect dependency advisories.

## Reporting a Vulnerability

Please report security issues responsibly. Open a private security advisory on GitHub or create a confidential issue at {{REPO_URL}}. Do not disclose vulnerabilities in public forums until an assessment has been completed.
