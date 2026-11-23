# AirAware Test Suite

Comprehensive automated test specifications for the AirAware environmental intelligence platform.

## Test Organization

Tests mirror the application structure under `src/` and are organized by functional area:

- `tests/unit/aqi/`: AQI mathematics, CPCB NAQI breakpoints, EPA sub-indices, European AQI, and daytime exposure window calculations.
- `tests/unit/choices/`: DEFRA emission factor calculators, commute comparisons, and `useCleanerChoices` reactivity.
- `tests/unit/community/`: Civic alerts generator, Sameer dossier formatting, and `useCommunityAlerts`.
- `tests/unit/indoor/`: CADR sizing, room volume formulas, ventilation advisor, and microclimate storage.
- `tests/unit/planner/`: Actionable recommendation engine, household member limits, and daily routine schedules.
- `tests/unit/ai/`: Cloudflare Workers AI client, failover cascade, deterministic fallbacks, prompt builders, and `useAirCopilot`.
- `tests/unit/components/`: User-facing component flows (onboarding walkthrough, location search, Copilot drawer, household profile management, hero view switcher).
- `tests/unit/security/`: Route input validation, strict parameter checking, payload limits, SSRF prevention, and rate limiting.
- `tests/unit/architecture-invariants.test.ts`: Architectural protections guaranteeing `src/domain` purity (zero React/Next imports) and strict 400 rejection of unknown query/body fields across all API endpoints.

## How to Run Tests

```bash
# Run the complete test suite
npm test

# Run tests with V8 coverage report and threshold verification
npm run test:coverage

# Run watch mode during development
npm run test:watch

# Run the complete CI verification pipeline (lint + typecheck + test)
npm run check
```

## Mocking & Environment Strategy

1. **100% Mocked Network Boundaries**: Real external APIs (OpenAQ, Open-Meteo CAMS, Cloudflare Workers AI, BigDataCloud reverse geocoding) are strictly mocked using Vitest spies (`vi.fn()`) and standard `Response` mocks. Tests never touch the internet or require live secrets.
2. **Dual Environment**: Tests run in `node` by default for maximum speed; UI component and hook tests declare `// @vitest-environment jsdom` at the top of the file to access DOM and browser APIs.
3. **Storage Isolation**: Browser `localStorage` is completely mocked and cleared between test cases to ensure complete test isolation and prevent cross-suite contamination.
4. **Deterministic Time**: Tests evaluating diurnal windows or timestamp logic use Vitest fake timers (`vi.useFakeTimers()`) and fixed epoch timestamps.
