# AGENTS.md — Contributor & Coding Agent Instructions

AirAware is a local-first environmental intelligence assistant for winter smog navigation, personalized family routines, indoor air quality hacks, and sustainable alternatives.

## Operational Commands
- `npm run dev`: Start Next.js development server
- `npm run build`: Compile production Next.js build
- `npm run lint`: Run ESLint checks
- `npm run typecheck`: Run TypeScript compiler validation
- `npm test`: Run Vitest unit & integration test suites
- `npm run check`: Run lint, typecheck, and test sequence

## Repository Folder Map
- `src/app/`: Next.js App Router pages, layouts, and API route handlers (`/api/*`)
- `src/components/`: Modular React components (dashboard, planner, indoor, choices, community, shell)
- `src/domain/`: Pure domain logic (AQI normalization, CPCB benchmarks, household, indoor, choices)
- `src/lib/`: Infrastructure helpers (Cloudflare AI client, prompt builder, rate limiting, security)
- `src/tokens/`: Authoritative design tokens and accessible color palette
- `public/`: Static WebP graphics, vector textures, and GeoJSON boundaries
- `tests/unit/`: Comprehensive Vitest unit and integration test specifications

## Non-Negotiable Invariants
1. **Never AI-Generate AQI**: Telemetry comes solely from OpenAQ ground stations or CAMS models.
2. **Explicit Provenance**: Every AQI metric must display its source type (`station` vs `model`) and timestamp.
3. **CPCB First**: Prioritize Indian CPCB NAQI for Indian locations; label particulate sub-indices clearly.
4. **Plain Language**: Avoid medical jargon; use actionable, reassuring, and evidence-grounded guidance.
5. **Zero Secrets in Client**: All API keys remain server-side; never use `NEXT_PUBLIC_` for credentials.
6. **Isolated Tests**: Mock all network calls in tests; never invoke real upstream APIs during CI.
7. **Consistent Panel Heights**: Keep Overview and Globe panels on `HERO_RIGHT_PANEL_HEIGHT_CLASS`.
8. **Dependency Control**: Do not install new dependencies without an architectural justification.
9. **Strict Input Validation**: Parse and validate all API and storage payloads with Zod schemas.

## Definition of Done
Code is complete when `npm run check` (ESLint, TypeScript `tsc --noEmit`, and Vitest) and `npm run build` pass with zero errors.
