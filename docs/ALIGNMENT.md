# AirAware — Hackathon Challenge Alignment & Audit Dossier

> **Challenge 6 (PromptWars):** *"Create a GenAI-powered assistant that helps families and communities navigate severe winter smog and urban air pollution. It should suggest low-emission daily routines, indoor air quality hacks, and sustainable alternatives tailored to their location and lifestyle, while clearly explaining the direct impact of their choices."*

This document provides traceable verification mapping every requirement from the challenge brief to concrete files, functions, and user interface elements in the repository.

---

## 1. Traceability Matrix: Challenge Requirements vs. Repository Implementation

| # | Challenge Requirement | Status | Implementing Files & Functions | How to Verify in UI |
|---|----------------------|--------|--------------------------------|---------------------|
| 1 | **Real-time telemetry & verified local data** (no mock/random data for air quality or community actions) | **MET** | `src/domain/aqi/openaq-adapter.ts` (`selectNearestStation`, `getNearestOpenAqStationDetailed`)<br>`src/app/api/air-quality/route.ts` (`GET`)<br>`src/domain/community/storage.ts`<br>`src/lib/security/upstream.ts` (`secureUpstreamFetch`) | Check Source Ribbon in Overview Panel or Provenance Footer. Displays physical ground station name and distance when within 25 km, or Copernicus CAMS modeled estimate with exact fallback reason. Community counters derive strictly from user device actions; winter sources display qualitative general knowledge without invented percentages. |
| 2 | **LLM never generates AQI numbers** (AI explains, never fabricates telemetry) | **MET** | `src/domain/aqi/primary-aqi.ts` (`getPrimaryAqiFacts`)<br>`src/lib/ai/prompt-builder.ts` (`buildGuidancePayload`, `buildCopilotPayload`)<br>`src/lib/ai/deterministic-fallback.ts` (`getDeterministicGuidance`) | Open Copilot or Today's Plan. The AQI number shown in the AI response is bound to the exact telemetry in the hero card. The system prompt explicitly forbids the model from calculating or altering AQI values. |
| 3 | **Data source and timestamp shown everywhere** | **MET** | `src/components/dashboard/hero/SourceRibbon.tsx`<br>`src/components/dashboard/ProvenanceFooter.tsx`<br>`src/components/copilot/CopilotRichResponse.tsx`<br>`src/components/planner/HouseholdTodayPlanCard.tsx` | Look at the Source Ribbon at top of Dashboard, the Provenance Footer at the bottom, and the "Data Source & Freshness" section inside every Copilot response. |
| 4 | **All-India location support** (search, GPS, quick presets) | **MET** | `src/components/dashboard/LocationSearch.tsx` (`QUICK_PICK_CITIES`, GPS geolocation)<br>`src/app/api/locations/search/route.ts`<br>`src/hooks/aqi/useAirQuality.ts` | Open location selector in AppHeader or Dashboard. Click presets (New Delhi, Noida, Mumbai, Kolkata, Bengaluru), type any Indian town, or click "Use Current Location" for GPS coordinate lookup. |
| 5 | **Criteria pollutants & dual indices** (PM2.5, PM10, CPCB NAQI, US EPA) | **MET** | `src/domain/aqi/normalizer.ts` (`normalizeAirQualityReport`)<br>`src/domain/aqi/cpcb-benchmark.ts` (`calculateCompositeCpcbAqi`)<br>`src/components/dashboard/PollutantGrid.tsx` | In Air Intelligence Studio, view the 6-pollutant grid (PM2.5, PM10, NO2, SO2, CO, O3) with WHO 2021 comparison ratios, and toggle between Indian CPCB NAQI and US EPA AQI. |
| 6 | **Personalization by household profile** (vulnerabilities & schedules) | **MET** | `src/domain/household/types.ts` (`HouseholdArchetype`, `SensitivityTier`)<br>`src/domain/household/storage.ts` (`loadHouseholdState`, `saveHouseholdState`)<br>`src/components/planner/HouseholdProfilesManager.tsx` | Open Family Planner workspace. Add up to 4 members with specific archetypes (`CHILD_STUDENT`, `WORKING_COMMUTER`, `SENIOR_VULNERABLE`, `OUTDOOR_ENTHUSIAST`) and sensitivity tiers. |
| 7 | **Child outdoor-play guidance** (inversion avoidance & pediatric safety) | **MET** | `src/domain/planner/recommendation-engine.ts` (pediatric checks in `generateMemberRecommendations`)<br>`src/lib/ai/deterministic-fallback.ts` (child-specific schedule shifts) | Add a child member in Family Planner. Recommendations advise shifting morning playground activities to afternoon solar dispersion windows and wearing pediatric N95 respirators. |
| 8 | **Senior caution & morning routine shifts** | **MET** | `src/domain/planner/recommendation-engine.ts`<br>`src/lib/ai/deterministic-fallback.ts` (senior morning walk time shifts)<br>`src/components/dashboard/ActionableHealthGuidance.tsx` | Add a senior member. Planner advises postponing morning park walks past 08:30 AM/09:30 AM to avoid shallow boundary layer cold smog and cardiovascular strain. |
| 9 | **Commute, trip, and mask guidance** | **MET** | `src/domain/planner/recommendation-engine.ts` (`COMMUTE` and `SCHOOL_TRAVEL` handlers)<br>`src/domain/choices/calculator.ts` (`calculateCommuteComparison`)<br>`src/components/choices/CommuteComparatorCard.tsx` | CommuteComparatorCard evaluates solo car vs electric metro, bus, or carpool; recommendations include N95 masking for roadside walking and vehicle ventilation recirculation. |
| 10 | **Indoor air quality hacks** (CADR purifier sizing, ventilation, plants check) | **MET** | `src/domain/indoor/calculations.ts` (`calculateCadr`, `analyzeIndoorAir`, `estimateIndoorPm25`)<br>`src/components/indoor/CleanAirSizer.tsx`<br>`src/components/indoor/VentilationAdvisor.tsx`<br>`src/components/indoor/IndoorAirReadingCard.tsx` | Open Indoor Air Sanctuary workspace: calculate room CADR/ACH based on dimensions, view afternoon solar ventilation windows, review the plant filtration reality check, or enter a home monitor reading. |
| 11 | **Sustainable alternatives & emissions accounting** | **MET** | `src/domain/choices/calculator.ts` (`calculateCommuteComparison`, `calculateDualImpactSummary`)<br>`src/domain/choices/constants.ts` (UK DEFRA 2023, EEA 2023, CEA India factors)<br>`src/components/choices/CleanerChoicesWorkspace.tsx` | Cleaner Choices workspace computes weekly/monthly avoided CO2e (kg), avoided NOx (g), avoided tailpipe PM2.5 (g), and equivalent urban car kilometers avoided. |
| 12 | **Every recommendation explains "Why" + "Expected Impact"** | **MET** | `src/domain/planner/recommendation-engine.ts` (`scientificReason`, `practicalAction`, `deltaC`, `transportImpact`)<br>`src/domain/indoor/calculations.ts` (`IndoorActionItem`: `action`, `why`, `expectedImpact`)<br>`src/lib/ai/prompt-builder.ts` | Every card in Family Planner, Indoor Air, and Today's Plan displays three distinct fields: what to do (Action), the scientific rationale (Why), and the quantified result (Expected Impact). |
| 13 | **Morning, afternoon, and evening daily planner** | **MET** | `src/components/planner/HouseholdTodayPlanCard.tsx`<br>`src/lib/ai/types.ts` (`TodayHouseholdPlanSchema`: morning, afternoon, evening)<br>`src/lib/ai/prompt-builder.ts`<br>`src/lib/ai/deterministic-fallback.ts` | At the top of Family Planner, "Today's Plan for Your Household" renders three chronological cards covering morning low-emission routine, afternoon indoor hack, and evening sustainable transit. |
| 14 | **Simple, accessible user experience** | **MET** | `src/components/shell/AirAwareShell.tsx` (5 workspace tabs, responsive layout)<br>`src/components/shell/AppHeader.tsx`<br>`src/components/shell/MobileBottomNav.tsx`<br>`src/tokens/tokens.css` (WCAG 2.2 AA palette) | Top navigation bar switches between 5 modular workspaces, provides 1-tap Copilot drawer access, and adapts to mobile screen sizes with bottom navigation. |
| 15 | **Graceful error handling & deterministic fallback** | **MET** | `src/lib/ai/cloudflare-client.ts` (3-tier model fallback)<br>`src/lib/ai/deterministic-fallback.ts` (offline scientific engine)<br>`src/components/common/ComponentErrorBoundary.tsx` | If Cloudflare Workers AI credentials are unset or rate limits are reached, the app automatically serves instant verified guidance labeled with a green "Rule-based answer" badge. |
| 16 | **No unrelated or out-of-scope features** | **MET** | `src/` directory inspection | No e-commerce stores, paid affiliate banners, crypto widgets, or irrelevant social feeds. The entire project is dedicated to smog defense and air quality navigation. |

---

## 2. Evidence Against Six Evaluation Criteria

### 1. Code Quality & Modularity
- **Deep Modules**: Pure domain logic in `src/domain/` has zero React dependencies (`src/domain/aqi/`, `src/domain/indoor/`, `src/domain/planner/`, `src/domain/choices/`, `src/domain/community/`).
- **Single Source of Truth**: Primary AQI resolved centrally in `src/domain/aqi/primary-aqi.ts` (`getPrimaryAqiFacts`), eliminating synchronization drift between Dashboard, Copilot, and Planner.
- **Strict Typing**: Full TypeScript coverage with strict compiler configuration (`tsconfig.json`), strict Zod schemas for all network requests, and zero `any` casts in domain code.

### 2. Security & Privacy
- **Zero Cloud PII**: User profiles, schedules, and indoor measurements are stored exclusively in browser `localStorage` (`src/domain/household/storage.ts`, `src/domain/constants/storage-keys.ts`).
- **Server-Side API Credentials**: `OPENAQ_API_KEY`, `CLOUDFLARE_ACCOUNT_ID`, and `CLOUDFLARE_API_TOKEN` are server-only (`src/lib/ai/config.ts`, `src/lib/openaq/config.ts`).
- **SSRF Guard & Allowlist**: Outbound requests are locked to 5 verified hostnames with mandatory 8,000ms timeouts (`src/lib/security/upstream.ts`).
- **Prompt Injection Defense**: Inputs sanitized via `sanitizeUserQuery` (200-character cap, control character removal, bracket stripping).
- **Security Headers**: Configured in `next.config.ts` (`nosniff`, `strict-origin-when-cross-origin`, `DENY`, `same-origin`, and `Content-Security-Policy-Report-Only`).

### 3. Efficiency & Performance
- **Bundle Separation & Lazy Loading**: Heavy 3D MapLibre globe (`LazyGlobePanel`), Regional Compare (`LazyRegionalComparePanel`), Copilot (`CopilotDrawerShell`), and Onboarding (`OnboardingModal`) are dynamically imported with `next/dynamic({ ssr: false })`.
- **In-Memory Caching & SWR**: 10-minute Next.js CDN caching (`s-maxage=600, stale-while-revalidate=300`) on `/api/air-quality`; 15-minute memory cache on `/api/regional-hotspots`; 24-hour cache on `/api/locations/search`.
- **In-Flight Request Deduplication**: Single-flight Promise deduplication in `src/lib/ai/cache.ts` prevents redundant inference calls during concurrent UI requests.

### 4. Testing & Verification
- **Automated Test Suites**: **577 automated tests across 86 suites** located in `tests/unit/`, covering AQI normalization, CPCB calculation benchmarks, indoor CADR formulas, planner recommendations, security headers, rate limiting, and prompt injection hardening.
- **Mocked Network Boundaries**: All test suites isolate network boundaries using Vi global stubs (`vi.stubGlobal('fetch', ...)`), ensuring reproducible offline testing.
- **Accessibility Verification Suite**: `tests/unit/a11y/accessibility.test.tsx` validates skip links, button accessible names, modal focus trapping and Escape-key restoration, and chart role="img" attributes with data table alternatives.
- **Architectural Protections**: `tests/unit/architecture-invariants.test.ts` validates zero React/Next dependencies in `src/domain` and strict HTTP 400 rejection for unknown fields across all API endpoints.

### 5. Accessibility (WCAG 2.2 AA)
- **Skip Link**: `<a href="#main-content" className="skip-link">` in `src/app/layout.tsx` targeting `<main id="main-content">`.
- **Focus Management**: Dialogs and drawers (`src/components/shell/CopilotDrawerShell.tsx`, `src/components/welcome/OnboardingModal.tsx`, `src/components/shell/AirAwareShell.tsx` clear confirm dialog) trap focus, close on `Escape`, and return focus to the opener element.
- **Accessible Charts**: Svg charts in `src/components/charts/UnifiedAnalyticsCard.tsx` expose `role="img"` with descriptive labels and provide toggleable data tables for screen readers.
- **Reduced Motion & Contrast Tokens**: `@media (prefers-reduced-motion: reduce)` in `src/app/globals.css`; verified high-contrast tokens in `src/tokens/tokens.css`.

### 6. Problem-Statement Alignment
- Solves winter smog challenges in the Indo-Gangetic Plains and urban India by explicitly modeling the **nocturnal boundary-layer thermal inversion trap** (concentrating smoke between 07:00 AM – 10:00 AM) and guiding users toward **solar thermal dispersion windows** (12:30 PM – 03:30 PM).

---

## 3. "Two Users, Same City": Personalization in Action

> **Illustrative example (wording condensed from the real rule branches)**

To demonstrate how AirAware personalizes advice for different lifestyles in the exact same atmospheric conditions, consider two households in New Delhi experiencing an ambient CPCB AQI in the Very Poor range:

```
                                 [ New Delhi Telemetry: AQI Very Poor ]
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       ▼                                                             ▼
         [ User A: Commuter Household ]                                [ User B: Family with Young Child ]
         Archetype: WORKING_COMMUTER                                   Archetype: CHILD_STUDENT
         Sensitivity: NONE                                             Sensitivity: PEDIATRIC
                       │                                                             │
        src/domain/planner/recommendation-engine.ts                   src/domain/planner/recommendation-engine.ts
        src/lib/ai/deterministic-fallback.ts                          src/lib/ai/deterministic-fallback.ts
                       │                                                             │
                       ▼                                                             ▼
         • Morning: Shift commute departure past                       • Morning: Postpone school transit past
           9:30 AM; switch car AC to internal                            9:30 AM; cancel outdoor morning recess;
           recirculation mode. Avoid roadside walking                    fitted pediatric N95 mask required.
           during heavy diesel traffic hours.                            Avoids peak ground-level smoke inversion.
                       │                                                             │
         • Afternoon: Cross-ventilate home office                      • Afternoon: Seal nursery/bedroom; run
           for 15 minutes between 1:00 PM and 2:30 PM                    HEPA filtration on medium/turbo to achieve
           to clear CO2 buildup and maintain focus;                      ≥4.8 ACH. Keep child breathing zone PM2.5
           reseal and run desktop purifier.                              strictly below 25 µg/m³.
                       │                                                             │
         • Evening: Switch from solo petrol car to                     • Evening: Coordinate shared neighborhood
           Delhi Metro (electric rail) or carpool for                    school carpools or electric bus transit;
           return trip. Cuts personal exposure and avoids                strictly eliminate cold engine idling at
           peak evening ground smog pooling.                             school pickup gates.
```

### Traceable Code Paths
1. **Household State Ingestion**: Stored in `localStorage` under `airaware_household_v1` and loaded via `loadHouseholdState()` (`src/domain/household/storage.ts`).
2. **Deterministic Fallback Branching**: `src/lib/ai/deterministic-fallback.ts` inspects `householdMembers`:
   - If `hasChildren` is true, branches to pediatric morning routines, nursery HEPA air turnover targets, and school carpooling.
   - If `hasCommuter` is true and no pediatric members are registered, branches to traffic bottleneck avoidance, vehicle AC recirculation, and public transit emission calculations.
3. **AI Grounding Prompt Construction**: `src/lib/ai/prompt-builder.ts` (`buildGuidancePayload`) passes member profiles into the system prompt:
   - *"Only mention children or school transit if household members specifically include children/pediatric members; otherwise tailor exclusively to the adult, senior, respiratory, or commuter members specified."*
