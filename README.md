# 🌍 AirAware — Smog Navigation & Environmental Intelligence

> A local-first environmental intelligence assistant helping families and communities navigate severe winter smog with personalized routines, indoor air hacks, and sustainable alternatives.

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.4.6-black.svg?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue.svg?logo=typescript)](https://www.typescriptlang.org/)

**Live Demo:** [air-aware-flax.vercel.app](https://air-aware-flax.vercel.app/) • **Source Code:** [github.com/rahulasthwik1307/AirAware](https://github.com/rahulasthwik1307/AirAware)

---

## The Problem & Target Audience

During severe winter smog across northern India and urban centers, ground-level thermal inversions trap industrial emissions, crop residue smoke, and vehicle exhaust between 07:00 AM and 10:00 AM. Standard air quality apps show 24-hour citywide averages that conceal these diurnal exposure windows.

AirAware addresses **PromptWars Challenge 6**:
> *"Create a GenAI-powered assistant that helps families and communities navigate severe winter smog and urban air pollution. It should suggest low-emission daily routines, indoor air quality hacks, and sustainable alternatives tailored to their location and lifestyle, while clearly explaining the direct impact of their choices."*

**Who It Is For:**
- **Families with Children:** Protect developing pediatric airways from ground-level morning smoke.
- **Seniors & Sensitive Individuals:** Minimize cold-air cardiovascular strain during peak smog.
- **Urban Commuters & Students:** Identify cleaner transit windows and avoid high-exposure traffic bottlenecks.
- **Housing Societies & Communities:** Coordinate neighborhood mitigation, draft RWA alerts, and report civic violations.

---

## Landing page artwork

| Artwork | Scene |
|---------|-------|
| ![Winter smog on a city street](public/images/landing/winter_smog_city.webp) | Winter smog on a city street |
| ![The same street on a clean-air day](public/images/landing/clean_sky_city.webp) | The same street on a clean-air day |
| ![A family indoors with an air purifier](public/images/landing/indoor_air_sanctuary.webp) | A family indoors with an air purifier |
| ![Neighbors sharing a clean-air alert](public/images/landing/community_action_alert.webp) | Neighbors sharing a clean-air alert |

---

## Core Features Mapped to Challenge Brief

### 1. Low-Emission Daily Routines
- **Morning / Afternoon / Evening Household Plan** (`src/components/planner/HouseholdTodayPlanCard.tsx`): Chronological daily plan covering routine shifts, indoor purification, and transit alternatives.
- **Cleanest Daytime Window Finder** (`src/domain/aqi/best-window.ts`, `src/components/charts/BestTimeStrip.tsx`): Identifies the lowest-exposure 2–3 hour daytime window (12:30 PM – 03:30 PM) when solar heating lifts stagnant surface smog.
- **Vulnerability-Specific Health Guidance** (`src/domain/planner/recommendation-engine.ts`, `src/components/dashboard/ActionableHealthGuidance.tsx`): Pediatric playground shifts and senior cardiovascular precautions.
- **Commuter Exposure Advice** (`src/domain/planner/recommendation-engine.ts`, `src/components/choices/CommuteComparatorCard.tsx`): Roadside N95 respirator recommendations and vehicle AC recirculation guidance.

### 2. Indoor Air Quality Hacks
- **Room-by-Room CADR Sizer** (`src/domain/indoor/calculations.ts`, `src/components/indoor/CleanAirSizer.tsx`): Computes Clean Air Delivery Rate (CADR) for target Air Changes per Hour (ACH) across custom room dimensions.
- **Solar Ventilation Timing** (`src/domain/indoor/calculations.ts`, `src/components/indoor/VentilationAdvisor.tsx`): Evaluates ambient particulates and ozone to recommend optimal natural airing intervals.
- **Indoor PM2.5 Analysis** (`src/domain/indoor/calculations.ts`, `src/components/indoor/IndoorAirReadingCard.tsx`): Analyzes user-entered sensor measurements, or provides labeled ~60% building infiltration estimates with stated assumptions.
- **Houseplants Reality Check** (`src/components/indoor/CleanAirSizer.tsx`): Explains why decorative houseplants cannot replace mechanical HEPA filtration for particulate smoke.

### 3. Sustainable Alternatives & Impact Accounting
- **Cleaner Choices Transit Comparator** (`src/domain/choices/calculator.ts`, `src/components/choices/CommuteComparatorCard.tsx`): Compares solo driving against electric metro, carpooling, or cycling.
- **Emissions Avoidance Accounting** (`src/domain/choices/constants.ts`, `src/components/choices/DualImpactDashboardCard.tsx`): Quantifies weekly/monthly avoided CO2e (kg), NOx (g), and tailpipe PM2.5 (g) using DEFRA and CEA benchmarks.
- **Structured Rationale on Every Recommendation** (`src/components/planner/RecommendationCard.tsx`): Every recommendation presents what to do, the scientific reason ("Why"), and the expected impact.

### 4. Local-First Personalization & Civic Tools
- **Household Profiles** (`src/components/planner/HouseholdProfilesManager.tsx`): Local profiles for up to 4 members with sensitivity tiers (`PEDIATRIC`, `SENIOR`, `RESPIRATORY`, `NONE`).
- **All-India Coverage** (`src/components/dashboard/LocationSearch.tsx`): Geocoding search across India, GPS coordinate detection, and quick presets (New Delhi, Noida, Mumbai, Kolkata, Bengaluru).
- **Community Incident Logging** (`src/components/community/CommunityAlertsWorkspace.tsx`): Local incident reporting, CPCB grievance formatting, and WhatsApp RWA bulletins.
- **Complete Data Erasure** (`src/components/shell/AirAwareShell.tsx`): "Clear my data" button purges all browser storage via `clearAllAirAwareData()`.

---

## How Data Works: Sources & Provenance

AirAware separates physical sensor measurements from numerical atmospheric models:

| Source | What It Provides | Update Frequency | UI Labeling & Freshness Rule |
|--------|------------------|------------------|------------------------------|
| **OpenAQ v3 API** | Nearest CPCB / official ground monitor within 25 km; real-time PM2.5 and PM10 | Real-time (in-situ) | Labeled `"Ground station"` with station name, distance in km, observation time, and 3-hour freshness rule. |
| **Copernicus CAMS via Open-Meteo** | Atmospheric grid (~45 km); 6 criteria pollutants and hourly forecast | Updated 4x daily | Labeled `"Modeled estimate"` with explicit fallback reason (e.g. `"no recent station within 25 km"`). |
| **Open-Meteo Geocoding** | Indian city, district, and coordinate search | 24-hour cache | Location dropdown with state/region and geographic coordinates. |

---

## Grounded GenAI Architecture

AirAware uses Cloudflare Workers AI with a 3-tier fallback chain:
1. **Primary:** `@cf/google/gemma-4-26b-a4b-it`
2. **Secondary:** `@cf/zai-org/glm-4.7-flash`
3. **Tertiary:** `@cf/ibm-granite/granite-4.0-h-micro`

- **The AI Never Generates AQI Numbers:** Telemetry is injected as immutable context into `buildGuidancePayload()` and `buildCopilotPayload()`. The model only interprets, schedules, and explains.
- **Strict Output Validation:** Model responses are parsed via Zod schemas (`GuidanceResponseSchema`, `CopilotResponseSchema`). Responses that fail schema validation fail closed immediately.
- **Deterministic Rule-Based Fallback:** If inference fails, times out (12s), or credentials are unset, `getDeterministicGuidance()` or `getDeterministicCopilotAnswer()` serves verified guidance labeled with a green `"Rule-based fallback"` badge.
- **Prompt Injection Hardening:** `sanitizeUserQuery()` strips control characters, removes angle brackets, and truncates queries to 200 characters.
- **Cache Integrity:** In-memory `aiCache` (30-min TTL) never stores rule-based fallback responses.

---

## Architecture Overview

```
Browser Client (React 19 / Next.js 16) ──> Next.js API Routes (/api/*)
    ├── /api/air-quality ──> OpenAQ v3 (In-Situ) + Copernicus CAMS (Model)
    ├── /api/weather     ──> Open-Meteo Forecast
    └── /api/ai/*        ──> Cloudflare Workers AI (Gemma 4 / GLM-4.7 / Granite)
                              └── Fail-closed to Deterministic Rule Engine
```
*See [ARCHITECTURE.md](ARCHITECTURE.md) for complete data flow diagrams, API schemas, and storage specifications.*

---

## Tech Stack

| Layer | Technologies | Version |
|-------|--------------|---------|
| **Framework** | Next.js (App Router), React, React DOM | `16.4.6`, `19.3.1`, `19.3.1` |
| **Language & Validation** | TypeScript, Zod | `5.7.3`, `4.6.7` |
| **Styling & Design Tokens** | Tailwind CSS, Astryx Core Tokens | `4.0.0`, `^0.7.16` |
| **Mapping & Visuals** | MapLibre GL, Three.js | `6.19.0`, `0.187.0` |
| **Testing & Quality** | Vitest, Testing Library (React, Jest-DOM, User-Event), ESLint | `5.1.0`, `^16.3.3`, `9.39.5` |
| **AI Inference** | Cloudflare Workers AI (Server-Side REST) | Serverless |

---

## Getting Started

### Prerequisites
- Node.js 20+ and npm

### Installation & Setup
```bash
git clone https://github.com/rahulasthwik1307/AirAware.git
cd AirAware
npm install
cp .env.example .env.local
```

Configure the following variables in `.env.local` (names only):
- `OPENAQ_API_KEY`: Server-side OpenAQ v3 API key for physical monitor telemetry.
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare dashboard account identifier.
- `CLOUDFLARE_API_TOKEN`: Cloudflare API token with `Workers AI: Run` permissions.
- `CLOUDFLARE_AI_MODEL_PRIMARY`, `CLOUDFLARE_AI_MODEL_SECONDARY`, `CLOUDFLARE_AI_MODEL_TERTIARY` (optional model overrides).

### Development & Build
```bash
npm run dev      # Start development server on http://localhost:3000
npm run build    # Compile production Next.js build
npm start        # Launch production server
```

---

## Testing & Quality Assurance

Run test, lint, and validation scripts configured in `package.json`:
```bash
npm test              # Run unit and integration test suites via Vitest
npm run test:coverage # Run Vitest test suite with V8 code coverage report
npm run typecheck     # Run TypeScript compiler validation (tsc --noEmit)
npm run lint          # Run ESLint validation
npm run check         # Run lint, typecheck, and test sequence
```
Continuous integration is automated on all pushes and pull requests via GitHub Actions (`.github/workflows/ci.yml`).

---

## Security & Accessibility

### Security
- **Server-Only Credentials:** Zero client-side API keys; `.env.local` excluded via `.gitignore`.
- **SSRF Allowlist & Timeouts:** Outbound requests restricted to 5 origins with 8,000ms timeouts (`src/lib/security/upstream.ts`).
- **Input Bounds & Schema Validation:** Strict Zod parsing on all route handlers and storage inputs.
- **Client Storage:** Zero authentication cookies or cloud databases; data cleared via `clearAllAirAwareData()`.
- *See [SECURITY.md](SECURITY.md) for full security disclosures.*

### Accessibility (WCAG 2.2 AA)
- **Skip Link:** Accessible skip navigation link targeting `#main-content` in root layout.
- **Focus Trapping & Escape Handlers:** Drawers and dialogs manage keyboard focus and restore focus on close.
- **Accessible Charts:** Data visualizations expose `role="img"` with descriptive labels and toggleable data tables.
- **Reduced Motion & Contrast:** Smooth motion respects `prefers-reduced-motion`; color tokens meet AA contrast.

---

## Deployment Note (Vercel)

When deploying to Vercel:
- Set environment variables in the project settings (`OPENAQ_API_KEY`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`).
- AI route handlers (`/api/ai/guidance` and `/api/ai/copilot`) configure `export const maxDuration = 30;` to prevent serverless function timeouts.

---

## Known Limitations

1. **Station Density:** OpenAQ physical ground stations are concentrated in major urban centers; rural locations automatically fall back to the Copernicus CAMS ~45 km grid with explicit labeling.
2. **CPCB Sub-Index Scope:** The displayed CPCB index is a PM2.5/PM10 particulate sub-index, not the full 8-pollutant regulatory NAQI.
3. **Indoor Estimation:** When a user lacks an indoor sensor, indoor PM2.5 is labeled as an estimate (~60% ambient building shell infiltration).
4. **Community Incident Metrics:** The Neighborhood Action summary card in `src/components/community/AirshedSourceAttributionCard.tsx` displays counters derived strictly from the user's locally stored actions on this device (`src/domain/community/storage.ts`), with an empty state when no incidents have been logged. Winter smog source categories display qualitative general knowledge labeled as not measured for the user's area.
5. **Serverless Rate Limiting:** Rate limiting runs in-memory per serverless instance (best-effort local burst suppression).
6. **CSP Mode:** Content Security Policy in `next.config.ts` is configured in Report-Only mode (`Content-Security-Policy-Report-Only`).

---

## Future Roadmap

- Integration with localized low-cost sensor meshes (e.g. PurpleAir / sensor.community) with calibration flags.
- Native multi-lingual support for major Indian regional languages (Hindi, Bengali, Marathi, Telugu).
- Automated CAQM GRAP stage push notifications via Web Push API.

---

## License & Data Attribution

- **License:** Open-source software released under the [MIT License](LICENSE).
- **Data Attribution:**
  - Ground station telemetry: [OpenAQ](https://openaq.org/) (CPCB / State Pollution Control Boards).
  - Atmospheric modeling: Copernicus Atmosphere Monitoring Service (CAMS) via [Open-Meteo](https://open-meteo.com/).
  - Environmental standards: Central Pollution Control Board (CPCB) NAQI (2014) and WHO Global Air Quality Guidelines (2021).
  - AI inference: [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/).
