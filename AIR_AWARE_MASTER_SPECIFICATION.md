# AIR AWARE — MASTER PROJECT SPECIFICATION

**Project Name:** AirAware  
**Tagline:** Breathe Smarter. Live Better.  
**Challenge:** PromptWars Virtual — Main Challenge 06  
**Repository:** https://github.com/rahulasthwik1307/AirAware  
**Document Purpose:** Single source of truth for all AI coding agents, architecture decisions, design decisions, development workflows, implementation phases, and evaluation requirements.

---

# 1. PROJECT VISION

## 1.1 What is AirAware?

AirAware is a global, GenAI-powered air-quality and environmental intelligence platform designed to help individuals, families, working professionals and communities make better everyday decisions in areas affected by air pollution.

It should not be another application that simply displays AQI numbers.

It should help people understand:

- What is the current air quality around them?
- Which pollutants are affecting their environment?
- What should they change in their daily routine?
- How can they improve the air quality inside their homes?
- Which cleaner alternatives can they choose?
- How can they reduce their environmental footprint?
- Why is a particular recommendation being made?
- What measurable or estimated impact can their choices have?

AirAware must transform environmental information into practical, personalized and understandable daily actions.

## 1.2 Product positioning

AirAware is a complete environmental intelligence assistant.

Its central experience follows this cycle:

1. KNOW YOUR AIR.
2. UNDERSTAND YOUR ENVIRONMENT.
3. RECEIVE PERSONALIZED ACTIONS.
4. MAKE CLEANER CHOICES.
5. UNDERSTAND YOUR IMPACT.

## 1.3 Primary audience

The product must support a global audience:

- Families.
- Individuals.
- Students.
- Working professionals.
- People who exercise outdoors.
- People who commute regularly.
- Communities concerned about urban pollution.

Do not design the application exclusively for one city, country or demographic.

---

# 2. CHALLENGE ALIGNMENT — HIGHEST PRIORITY

The original Challenge 06 brief is:

"Create a GenAI-powered assistant that helps families and communities navigate severe winter smog and urban air pollution. The application should suggest low-emission daily routines, indoor air quality hacks, and sustainable alternatives tailored to their location and lifestyle, while clearly explaining the direct impact of their choices."

Every major feature must map to this brief.

## 2.1 Required capability mapping

| Challenge requirement               | AirAware implementation            |
| ----------------------------------- | ---------------------------------- |
| Navigate severe urban air pollution | Global Air Intelligence            |
| Low-emission daily routines         | Personalized Daily Planner         |
| Indoor air-quality hacks            | Indoor Air Intelligence            |
| Sustainable alternatives            | Cleaner Choices Explorer           |
| Location personalization            | Location Intelligence              |
| Lifestyle personalization           | Household and Lifestyle Profile    |
| Explain direct impact               | Impact Calculator and Explanations |
| GenAI assistance                    | AI Air Copilot                     |

These capabilities are not optional decorative features. They form the central product.

## 2.2 Definition of success

A user must be able to open AirAware, select a location, understand the available air-quality information, receive useful recommendations based on their lifestyle, explore practical indoor improvements, compare sustainable alternatives and understand the estimated impact of their choices.

The application must demonstrate this complete user journey.

Do not sacrifice these capabilities to build unnecessary visual features.

---

# 3. PRODUCT REQUIREMENTS AND CONFIRMED DECISIONS

These decisions have already been approved. Do not repeatedly ask the product owner to reconsider them.

## 3.1 Location selection

- Manual city search is the default.
- Browser GPS is optional.
- Users can save multiple locations.
- One location is designated as primary.
- Users can compare saved locations.
- Location permissions must never be mandatory.
- The application must work when GPS permission is denied.

## 3.2 Global AQI interpretation

Different countries use different AQI standards.

Requirements:

- Preserve the original local AQI standard when provided by the data source.
- Clearly identify which AQI system is being displayed.
- Display pollutant concentrations with units.
- Never compare incompatible AQI scales without explaining the normalization method.
- Distinguish station measurements from modelled estimates and forecasts.
- Display source attribution and data timestamps.

## 3.3 Personalization

Use a short guided onboarding process.

Collect only useful information, such as:

- Primary location.
- Household size.
- Optional children or older adults in the household.
- Typical working or school schedule.
- Outdoor exercise habits.
- Commute type.
- Approximate commute distance.
- Lifestyle preferences.
- Optional self-reported sensitivities.

Detailed preferences should be editable later.

Do not collect unnecessary medical history or sensitive personal information.

## 3.4 AI recommendation architecture

Use a deterministic-first, AI-enhanced architecture.

Environmental data and application rules determine the facts and numerical calculations.

AI explains, contextualizes and personalizes those facts.

AI must not independently invent AQI readings, pollution measurements, forecasts or environmental impact figures.

## 3.5 Environmental impact

Show:

- Estimated CO2e savings.
- Daily, weekly and monthly comparisons where data supports them.
- Calculation assumptions.
- Emission factors.
- Distance and transport assumptions.
- Separate exposure-related guidance.

Never claim that an individual's estimated emissions savings directly reduce the measured AQI of their city.

## 3.6 Unavailable data

When live data is unavailable:

- Show the last available reading if one exists.
- Display its original timestamp.
- Clearly label it as stale.
- Never display stale data as current.
- Explain that the live source is unavailable.
- Provide saved educational and safety guidance.
- Provide a retry option.

Never ask AI to invent current environmental readings.

## 3.7 Additional confirmed decisions

- Multiple saved locations: Yes.
- Editable daily plans: Yes.
- Optional indoor product recommendations: Yes.
- Historical comparisons: Yes, only with reliable data and clear labels.
- English-first, localization-ready architecture.
- Community Intelligence rather than a social network.
- In-app alerts first; browser notifications optional.
- No authentication or login.
- Free services and APIs only.
- No paid fallback.

---

# 4. COMPLETE FEATURE SPECIFICATION

## 4.1 Global Air Intelligence

This is the primary environmental information experience.

Required functionality:

- Search for cities globally.
- Select current location using optional GPS.
- Display current available AQI.
- Display PM2.5, PM10, NO2, O3, SO2 and CO where available.
- Show pollutant units.
- Show data source and freshness.
- Display hourly and daily forecasts when supported.
- Show historical trends when reliable historical information is available.
- Save multiple locations.
- Compare locations.
- Show nearby monitoring stations when available.
- Clearly distinguish measured, modelled and forecast data.

Every value must have an understandable origin.

Do not silently substitute one pollutant or source for another.

## 4.2 Personalized Daily Routine Planner

This is one of the most important challenge-aligned features.

The planner should understand:

- User's daily schedule.
- Work and school timings.
- Outdoor exercise preferences.
- Commute type and distance.
- Household context.
- Selected location.
- Current and forecast environmental conditions.

It should recommend:

- Suitable outdoor activity windows.
- When to avoid strenuous outdoor activity.
- Alternative indoor exercise.
- Cleaner commute choices.
- Better times for errands.
- Ventilation guidance.
- Adjustments when conditions deteriorate.

Recommendations should be editable.

Each recommendation should contain:

1. Current condition.
2. Recommended action.
3. Reason.
4. Expected benefit.
5. Data source.
6. Timestamp or freshness.
7. Confidence or uncertainty where appropriate.

Never promise that an activity is completely safe based on an AQI number.

## 4.3 Indoor Air Intelligence

Help people improve indoor air quality.

Cover:

- Cooking smoke.
- Ventilation.
- Dust accumulation.
- Household cleaning.
- Outdoor pollution entering indoors.
- Filtration.
- Air purifier selection.
- Filter maintenance.
- Room-size considerations.
- Practical low-cost improvements.

Optional room-level planner:

- Living room.
- Bedroom.
- Kitchen.
- Study room.

Allow users to receive suggestions based on room type, approximate room size and available equipment.

Do not claim to measure indoor AQI without actual indoor sensor data.

Clearly distinguish educational recommendations from actual indoor measurements.

Product recommendations must be optional, neutral and useful. Never force purchases.

## 4.4 AI Air Copilot

The AI Air Copilot should act as a knowledgeable, friendly environmental assistant.

Example questions:

- Can I take my child to the park this evening?
- What should I change in my morning routine?
- How can I improve the air inside my bedroom?
- Is cycling a good alternative for my commute today?
- Why is pollution increasing in my location?
- What can I do when outdoor air quality becomes poor?

AI response structure:

1. Direct answer.
2. Relevant environmental conditions.
3. Recommended action.
4. Explanation.
5. Practical alternatives.
6. Data source and freshness.
7. Limitations or uncertainty.

Use simple language. Avoid unnecessarily technical explanations, alarmist messaging and medical diagnosis.

The assistant must use actual application data and relevant user preferences, not fabricated context.

## 4.5 Cleaner Choices Explorer

Help users make more sustainable everyday choices.

Examples:

- Private car versus public transport.
- Carpooling versus solo driving.
- Walking or cycling for suitable journeys.
- Combining errands.
- Reducing unnecessary travel.
- Cleaner household habits.

Provide comparisons using transparent assumptions.

When estimating CO2e:

- Identify the emission factor.
- Identify the distance.
- Identify occupancy assumptions.
- Explain the calculation.
- Show the comparison baseline.
- Identify estimates as estimates.

Do not equate CO2e savings with immediate local AQI improvements.

## 4.6 Personal Impact Dashboard

Track user-selected cleaner habits.

Show:

- Estimated CO2e avoided.
- Weekly and monthly progress.
- Cleaner transport choices.
- Completed recommended habits.
- Personal progress trends.

Use deterministic calculations.

Do not use AI to calculate final numerical impact.

Allow users to inspect the assumptions behind each calculation.

## 4.7 Community Air Intelligence

Start with useful community-level environmental intelligence, not a social networking system.

Features:

- Nearby monitoring station information.
- City and neighborhood comparisons where data supports them.
- Community pollution trends.
- General clean-air recommendations.
- Public educational information.
- Community-level guidance and initiatives.

Do not introduce posts, comments, messaging or social profiles in the initial implementation.

## 4.8 Pollution Alerts

Initial alert types:

- AQI exceeds a user-defined threshold.
- Conditions deteriorate.
- A saved location changes significantly.
- A planned outdoor activity needs reconsideration.

Start with in-app alerts.

Browser notifications should be optional and requested only after explaining their purpose.

Do not promise continuous background monitoring if the application cannot technically provide it.

## 4.9 Historical Comparisons

Show historical data only when supported by the source.

Distinguish:

- Historical observations.
- Historical modelled estimates.
- Current observations.
- Forecasts.

Do not fill missing historical periods with invented values.

## 4.10 Educational and Emergency Guidance

Provide clear educational information about:

- Understanding AQI.
- Understanding pollutants.
- Indoor air improvement.
- General public-health guidance.
- Responding to severe pollution conditions.

Use authoritative public-health sources.

Do not diagnose medical conditions or replace professional medical advice.

---

# 5. USER EXPERIENCE AND APPLICATION STRUCTURE

The application should feel like a complete, connected platform rather than one overcrowded dashboard.

Suggested navigation:

1. Overview
2. Air Intelligence
3. My Daily Plan
4. Family & Lifestyle
5. Indoor Air
6. Exposure Guidance
7. Cleaner Choices
8. AI Air Copilot
9. Community
10. My Impact
11. Learn & Safety
12. Settings

Use a coherent navigation structure. Do not force every section into the first screen.

## 5.1 First-time user journey

1. User opens AirAware.
2. Sees a clear introduction to the product.
3. Selects a city manually or optionally uses GPS.
4. Completes short guided onboarding.
5. Receives a personalized dashboard.
6. Sees current available environmental conditions.
7. Receives actionable daily recommendations.
8. Can explore indoor guidance, cleaner choices and the AI assistant.

Allow users to skip optional profile details.

## 5.2 Returning user journey

1. Restore their saved preferences.
2. Restore primary and saved locations.
3. Load the latest available environmental information.
4. Show freshness and availability clearly.
5. Update recommendations using current context.
6. Preserve editable routines and personal progress.

## 5.3 Dashboard priorities

The overview should prioritize:

- Current location.
- Current air-quality condition.
- Pollutant summary.
- Data freshness.
- Today's recommended actions.
- Upcoming forecast when available.
- Indoor guidance.
- A clear entry point to the AI Copilot.
- Recent personal impact.

The globe should support exploration, not replace the actual environmental information.

---

# 6. VISUAL DESIGN SYSTEM AND DESIGN-SYSTEM REQUIREMENT

## 6.1 Visual identity and design direction

Design direction: **Premium Environmental Intelligence**

The application should feel:

- **Futuristic but approachable:** Advanced scientific capability presented with clean, human warmth.
- **Trustworthy and scientifically credible:** Grounded in real data, precision typography, and honest uncertainty.
- **Modern, sophisticated, and visually distinctive:** Elevated beyond generic software templates and standard dashboard widgets.
- **Visually attractive without looking aggressive:** Engaging, calm, and dignified rather than loud or overwhelming.
- **Easy to understand:** Clear information hierarchy, readable data visualizations, and intuitive navigation.

Avoid generic AI dashboard aesthetics, excessive neon glow effects, and overwhelming visual clutter.

## 6.2 Color direction and theme principles

### 6.2.1 Confirmed color preferences
- **Light, soft, elegant, and sophisticated palette:** Prefer light, soft, elegant, and sophisticated colors across primary backgrounds and major application surfaces.
- **Avoid aggressive saturation:** Avoid unnecessarily thick, extremely bright, oversaturated, or visually aggressive colors that cause sensory fatigue.
- **Selective dark accents:** Dark colors may be used selectively where they improve hierarchy, depth, contrast, grounding, or visual balance (e.g., focused data cards, header elements, high-contrast controls, or visual grounding).
- **No forced theme:** Do NOT force a dark-first theme or a light-first theme. Both modes should be explored and designed thoughtfully, or a flexible theme system should be provided with flawless contrast in all modes.
- **De-authorization of legacy palette:** The previous prescription of a dark-theme-first mandate with midnight navy, deep blue-black, dark charcoal, and heavy cyan/teal accents is **explicitly de-authorized and no longer approved**. The final palette and theme direction must be explored and proposed by the Taste design skill.

### 6.2.2 Environmental status colors and accessible labeling
- Green for suitable conditions according to the selected standard.
- Yellow or amber for caution and moderate conditions.
- Orange and red for progressively unhealthy or severe conditions.
- Purple or maroon for very unhealthy or hazardous states where useful.
- **Mandatory readable labels:** Always combine status colors with clear text labels, numerical values, icons, and contrast meeting the WCAG 2.2 AA target. Never communicate pollution severity through color alone.

## 6.3 Taste as the primary visual design authority

The installed `design-taste-frontend` skill is designated as the **primary visual design authority** for AirAware.

### 6.3.1 Authority scope
Taste has primary authority for:
1. Visual direction and aesthetic tone.
2. Color palette selection (primary, secondary, accent, neutral, surfaces).
3. Theme direction (light, dark, adaptive).
4. Typography selection and font pairing.
5. Visual hierarchy, density, and layout rhythm.
6. Spacing, padding, and layout proportions.
7. Component aesthetics and elevation.
8. Overall brand visual identity.

### 6.3.2 Design governance rules
- **No hard-coded palette before Taste exploration:** No agent may hard-code a fixed color palette into the application until Taste has evaluated product requirements and proposed a coherent, documented design direction.
- **Product owner alignment:** Taste is encouraged to ask the product owner a small number of meaningful, high-leverage design questions when necessary to align on visual direction.
- **Adherence to confirmed preferences:** All proposals by Taste must strictly respect the confirmed preferences: light/soft/elegant primary feel, no aggressive saturation, selective dark accents, and scientific credibility.
- **Single design authority:** No other skill or agent may independently redesign the interface or introduce a competing visual identity. Astryx must follow Taste-approved designs.

## 6.4 Complete design-system requirement

Before major UI and page implementation begins, a comprehensive, documented, and reusable design system must be established. The design system must define centralized design tokens and reusable components covering all 19 required areas:

1. **Primary, secondary, accent, and neutral colors:** Core palette tokens with consistent naming and contrast ratios.
2. **Semantic colors:** Standardized tokens for success, warning, error, and informational messages.
3. **Environmental status colors and readable labels:** Distinct, accessible tokens for all AQI tiers paired with explicit textual indicators.
4. **Light and dark theme decisions:** Token mapping for surface, text, border, and elevation across themes if both are implemented.
5. **Typography and font pairing:** High-quality font pairing (e.g., clean geometric sans-serif for UI paired with a distinguished display or tabular font for figures).
6. **Font sizes, weights, line heights, and hierarchy:** Strict type scale (display, h1, h2, h3, body-lg, body, body-sm, caption) with calibrated line-heights and tabular numerals for measurements.
7. **Spacing scale:** Consistent 4px/8px-based spacing tokens (2, 4, 8, 12, 16, 24, 32, 48, 64px) for margins, padding, and gap spacing.
8. **Grid system and layout widths:** Container max-widths, column grids, and gutter scales for clean visual alignment.
9. **Responsive breakpoints:** Standardized breakpoints (mobile: <640px, tablet: 640–1024px, desktop: 1024–1280px, wide: >1280px).
10. **Border radii and border treatments:** Unified radii scale (none, sm, md, lg, xl, full) and subtle border treatments avoiding harsh outlines.
11. **Shadows and elevation:** Soft, natural elevation tokens (low, medium, high) calibrated for depth without visual clutter.
12. **Iconography:** Cohesive icon system (using `lucide-react`, matching the installed dependency) with consistent stroke-width, sizing, and alignment.
13. **Buttons and interaction states:** Clear variants (primary, secondary, outline, ghost, destructive) with distinct hover, active, focus, and disabled states.
14. **Form controls:** Accessible text inputs, selects, sliders, toggles, checkboxes, and radio buttons with clear validation states.
15. **Cards and data visualizations:** Clean card containers, metric displays, gauge treatments, pollutant breakdowns, and chart containers.
16. **State representations:** Dedicated, consistent designs for loading (skeletons/spinners), empty states, error states, success confirmations, and disabled components.
17. **Interactive states:** Fully specified hover, focus-visible (keyboard focus), active, and selected states for every interactive element.
18. **Motion and animation principles:** Purposeful, subtle motion guidelines prioritizing native CSS transitions and respecting `prefers-reduced-motion`.
19. **Accessibility and contrast requirements:** Targeting WCAG 2.2 AA across all color combinations (minimum 4.5:1 for normal text, 3:1 for large text and UI components), minimum 44×44px tap targets, visible focus rings, and explicit text equivalents. A Lighthouse score alone does not establish WCAG compliance; actual verification with contrast measurement tools, keyboard walks, and accessibility tree inspection is required.

### 6.4.1 Centralized design tokens, visual consistency, and controlled flexibility
1. **Centralized token baseline:** All core design tokens (colors, typography, spacing, radii, elevation) must be centralized in a dedicated design token module (e.g., CSS custom properties, StyleX tokens, or a dedicated theme configuration).
2. **Prohibition of arbitrary styling:** Individual pages and standard components are strictly prohibited from introducing ad-hoc hex codes, arbitrary font families, random margin/padding scales, or uncoordinated one-off styling.
3. **Controlled component-specific styling exceptions:** Justified component-specific styling exceptions are permitted **only when strictly required** for:
   - Specialized visualizations (e.g., custom SVG globe geometries, atmospheric glow layers, complex multi-pollutant gradient dials, micro-gauge ticks, or timeline curves where standard tokens cannot provide the necessary mathematical fidelity).
   - Accessibility enhancements (e.g., custom high-contrast focus rings for composite multi-level controls, bespoke contrast adjustments for complex environmental maps, or specialized screen-reader visual indicators).
   - Unique interactive states (e.g., physics-calibrated gestures, micro-slider thumb adjustments, or drag-and-drop feedback).
4. **Mandatory documented rationale:** Any component-specific styling exception must include an inline code comment or pull-request note documenting the technical or accessibility rationale for the deviation. Arbitrary, undocumented styling deviations remain strictly prohibited.
5. **Astryx alignment:** Astryx components must be styled or customized to strictly adhere to these centralized tokens and justified exceptions. Astryx must never independently decide the product's visual identity.

---

# 7. INTERACTIVE EARTH GLOBE — PERFORMANCE-FIRST

The globe is a signature visual feature, not the core intelligence engine.

## 7.1 Implementation strategy

First implement a lightweight CSS/SVG globe.

Potential techniques:

- CSS radial gradients.
- SVG globe outlines.
- Latitude and longitude curves.
- Animated rotation.
- Atmospheric glow.
- Small location markers.
- Carefully controlled opacity and shadows.
- CSS transitions.

Do not begin with a high-polygon Earth model or expensive WebGL scene.

## 7.2 Required interactions

- Gentle rotation.
- Drag interaction where feasible.
- Clickable location markers.
- Selected-city highlighting.
- Smooth marker transitions.
- Location information preview.
- Zoom or navigation to a location.
- Responsive presentation.

A 2D map or list must remain available for precise geographical navigation and accessibility.

## 7.3 Escalation rule

Only use Three.js or React Three Fiber if a documented requirement cannot be implemented properly with CSS/SVG.

If WebGL is introduced:

- Lazy-load it.
- Use optimized textures.
- Avoid excessive particles.
- Limit rendering work.
- Handle WebGL failure.
- Provide a 2D fallback.
- Test on lower-powered devices.

Do not introduce WebGL merely to make the application look more impressive.

## 7.4 Motion design

Use subtle, purposeful motion:

- Gentle globe rotation.
- Soft atmospheric movement.
- Small marker pulses.
- Smooth page transitions.
- Scroll reveals.
- Animated numerical changes.
- Refined button feedback.
- Smooth chart updates.

Respect prefers-reduced-motion.

Avoid excessive parallax, constant movement, distracting animations or heavy scroll effects.

---

# 8. TECHNICAL ARCHITECTURE AND DEPENDENCY POLICY

## 8.1 Current repository setup

The repository currently contains:

- **Antigravity AI IDE:** Integrated development and agent execution environment.
- **Installed application packages (`package.json`):**
  - `@astryxdesign/core@0.7.16`
  - `@astryxdesign/theme-neutral@0.7.16`
  - `@stylexjs/stylex@0.19.2`
- **Transitive runtime dependencies in `node_modules`:**
  - `react@19.3.1` (pulled in by Astryx core)
  - `react-dom@19.3.1` (pulled in by Astryx core)
  - `lucide-react@1.74.0` (pulled in by Astryx theme-neutral)
  - `styleq@0.2.1` (pulled in by StyleX)
  - `intl-messageformat@11.2.15` (pulled in by Astryx core)
- **Chrome DevTools MCP:** Fully integrated into Antigravity MCP configuration (`mcp_config.json`) with global CLI (`chrome-devtools` v1.13.0).
- **Installed Agent Skills:** 44 specialized engineering, design, testing, browser-debugging, and security skills in `.agents/skills/`.

### 8.1.1 Critical status distinctions
- **Next.js is NOT yet installed.** Next.js has not been initialized.
- **TypeScript is NOT yet configured in `devDependencies`.**
- **GSAP runtime (`gsap`) is NOT installed.** GSAP skills are present in `.agents/skills/`, but the runtime package is not in `package.json`.
- **Lenis is NOT installed.** Lenis is a planned runtime dependency for smooth scrolling, to be evaluated and installed in a later phase.
- **Tailwind CSS is NOT installed.**

## 8.2 Dependency policy and classification

Every dependency must belong to one of four strict classifications:

| Category | Packages / Technologies | Status & Policy |
| :--- | :--- | :--- |
| **Installed Packages** | `@astryxdesign/core@0.7.16`, `@astryxdesign/theme-neutral@0.7.16`, `@stylexjs/stylex@0.19.2` (and transitive `react@19.3.1`, `react-dom@19.3.1`, `lucide-react@1.74.0`) | Present in repository. Do not delete, upgrade, or replace without documented rationale and verified compatibility. |
| **Planned Dependencies** | Next.js, TypeScript (`typescript`, `@types/node`, `@types/react`, `@types/react-dom`), styling toolchain, Zod, Vitest testing toolchain, Lenis, GSAP runtime | Intended for addition during Phase 0/1 implementation. Requires compatibility verification before installation. |
| **Proposed Technologies** | Open-Meteo Air Quality & Geocoding APIs, OpenAQ, Cloudflare Workers AI, Gemini API free tier | Proposed architecture components. Subject to API verification, quota, and licensing review before integration. |
| **Dependencies Requiring Verification** | Next.js version selection vs. React 19.3.1 & StyleX; StyleX integration with Next.js compiler; Tailwind CSS co-existence vs. dedicated StyleX approach; Astryx Server Component compatibility | Must be formally evaluated in Phase 0 before package installation. |

### 8.2.1 Next.js version policy
- Do NOT blindly force a particular Next.js version (such as Next.js 15) simply because an earlier specification draft mentioned it.
- Before initializing Next.js, evaluate current stable versions against React 19.3.1, Astryx integration requirements, StyleX compiler plugin compatibility, and official Next.js setup guidance.
- Document the selected Next.js version and compatibility matrix in an Architecture Decision Record (ADR).

### 8.2.2 Dependency addition rules
- Strict ₹0 budget for all runtime packages and services.
- No paid services, subscriptions, or paid fallback dependencies.
- Verify security, license, bundle size, and maintenance status before proposing a new package.
- Do not install dependencies during documentation tasks.

## 8.3 Architecture principles

Use a layered architecture:

**Presentation Layer:**
- Pages and App Router views.
- Reusable UI components.
- Design tokens and theme system.
- User interactions and client state.

**Application Layer:**
- Use cases and feature workflows.
- User profile and preference management.
- Recommendation orchestration.
- Environmental impact calculation pipelines.

**Domain Layer:**
- AQI interpretation and scale standards.
- Pollutant unit normalization.
- Recommendation rules and thresholds.
- Emission calculation models.
- Data quality, freshness, and staleness rules.

**Infrastructure Layer:**
- Environmental API adapters (Open-Meteo, OpenAQ).
- AI provider adapters (Cloudflare Workers AI, Gemini free tier).
- Deterministic fallback engine.
- Browser localStorage adapter.
- In-memory cache and request deduplication.

Keep domain calculations independent of UI components and AI providers.

## 8.4 Environmental data pipeline

External API  
→ API adapter  
→ Validation (Zod schema)  
→ Normalization (standardized internal units)  
→ Data quality & freshness checks  
→ Cache (deduplication & TTL)  
→ Domain intelligence (rules & interpretation)  
→ User interface and recommendation engine.

Use consistent internal contracts.

Each reading should preserve, where available:
- Location (coordinates, city, country).
- Pollutant identifier.
- Value.
- Unit.
- Source attribution.
- Measurement method (station sensor vs. atmospheric model).
- Timestamp of measurement.
- Observation vs. modelled status.
- Forecast horizon.
- Data freshness / staleness indicator.

Do not discard important source metadata.

## 8.5 AI architecture

User question  
→ Validate input (length, structure, injection safety)  
→ Retrieve relevant environmental context (current readings, forecast)  
→ Retrieve minimum necessary profile context (schedule, sensitivities)  
→ Apply deterministic rules (safety boundaries, baseline recommendations)  
→ Build grounded AI prompt context  
→ Call available free provider (Cloudflare Workers AI / Gemini)  
→ Validate structured output (schema conformance)  
→ Verify factual references and calculations against domain facts  
→ Display contextualized explanation to user.

If AI fails (rate limit, network timeout, invalid schema):
- Use deterministic recommendations directly.
- Display saved educational guidance.
- Clearly explain that the AI service is temporarily unavailable.
- Never switch to a paid provider.

Do not send the entire personal profile to AI. Minimize data exposure.

---

# 9. FREE SERVICE AND API REQUIREMENTS

Strict budget: ₹0.

No paid fallback, paid subscription, surprise billing or hidden charge.

Potential environmental sources:

## 9.1 Open-Meteo

Use for:
- Air-quality forecasts.
- Available pollutant data.
- Weather context where useful.
- Geocoding.

Verify:
- Free-service eligibility.
- Non-commercial conditions.
- Attribution requirements.
- Forecast coverage.
- Resolution and timestamp.
- Request limits.

Do not assume a modelled grid represents an exact street-level measurement.

## 9.2 OpenAQ

Use for:
- Ground monitoring station measurements.
- Station metadata.
- Available historical measurements.

Verify:
- API key requirements.
- Free usage limits.
- Data licensing.
- Attribution.
- Geographic coverage.
- Rate limits.

OpenAQ values must not automatically be treated as a universal AQI.

## 9.3 AI services

Cloudflare Workers AI:
- Preferred primary AI service.
- Verify free allowance.
- Verify supported model names.
- Verify request limits.

Gemini:
- Secondary free-tier provider.
- Verify model availability and current free-tier eligibility.
- Never automatically activate paid billing.

Both unavailable:
- Deterministic fallback.

## 9.4 API verification requirement

Before implementing any external integration, create an API verification document containing:
- Official documentation.
- Endpoint.
- Authentication.
- Request schema.
- Response schema.
- Quota.
- Pricing.
- Attribution.
- Licensing.
- Geographic coverage.
- Known limitations.
- Fallback behavior.

Do not rely on old tutorials or guessed endpoints.

---

# 10. DATA AND PERSISTENCE

No authentication or mandatory database.

Use local browser storage for:
- Onboarding preferences.
- Household profile.
- Saved locations.
- Primary location.
- Daily routines.
- Saved guidance.
- Selected theme.
- Personal habit history.
- Alert preferences.
- Recently viewed information.

Requirements:
- Version stored data schema.
- Validate data on reading.
- Handle corrupted storage.
- Handle unavailable storage.
- Handle quota errors.
- Avoid storing unnecessary sensitive information.
- Support exporting and deleting user data.
- Avoid persisting API secrets or sensitive AI context.

Explain that local data is stored on the current device and may be lost when browser storage is cleared.

Do not imply cloud synchronization exists.

---

# 11. ENVIRONMENTAL CALCULATIONS AND TRUST

This is a critical engineering requirement.

## 11.1 AQI

Do not mix AQI standards.

Maintain original source values and units.

When converting between standards:
- Document the exact formula.
- Identify the target standard.
- Preserve the original value.
- Show conversion limitations.

## 11.2 Exposure guidance

Do not claim to calculate medically accurate personal exposure doses.

If estimated exposure is introduced:
- Identify the assumptions.
- Use time and available environmental context.
- Clearly label it as an estimate.
- Never present it as a medical diagnosis.

## 11.3 CO2e calculations

Use deterministic formulas.

A general comparison model may use:
Estimated emissions = Distance × Emission factor × Relevant occupancy adjustment.

The exact formula depends on the chosen methodology.

Show:
- Baseline.
- Alternative.
- Distance.
- Emission factor.
- Occupancy assumption.
- Result.
- Source.
- Uncertainty.

Do not invent emission factors.

## 11.4 Recommendations

Every recommendation must be traceable to:
- Environmental conditions.
- Relevant user preferences.
- Application rules.
- Reliable guidance.

AI may explain the recommendation, but cannot invent its underlying facts.

---

# 12. SECURITY REQUIREMENTS

Security is mandatory even though this is a local-first application.

- Keep provider keys server-side.
- Never expose secrets in client bundles.
- Validate every API request.
- Apply request size limits.
- Use safe error messages.
- Sanitize or safely render untrusted content.
- Avoid unsafe HTML rendering.
- Protect external API integrations from abuse.
- Add appropriate rate limiting.
- Avoid logging personal information.
- Validate data restored from localStorage.
- Use secure response headers where appropriate.
- Do not rely on browser storage for secrets.
- Minimize profile information sent to AI.
- Verify dependencies and remove unused packages.

Important: in-memory rate limiting is process-local and does not provide robust distributed protection. Document this limitation and choose a suitable free-compatible solution.

Do not add authentication simply to make the architecture appear more secure.

---

# 13. PERFORMANCE REQUIREMENTS

Efficiency is one of the six evaluation parameters.

- Avoid unnecessary API calls.
- Cache responses appropriately.
- Avoid duplicate requests.
- Use debounced city search.
- Lazy-load expensive sections.
- Avoid unnecessary React renders.
- Keep calculations lightweight.
- Use optimized image assets.
- Keep charts efficient.
- Use CSS/SVG for the initial globe.
- Avoid heavy animation libraries where native CSS is sufficient.
- Provide loading, error and empty states.
- Keep the interface usable on mobile and lower-powered hardware.

Do not sacrifice data accuracy to improve perceived speed.

---

# 14. ACCESSIBILITY REQUIREMENTS

AirAware treats **WCAG 2.2 AA as the mandatory accessibility target** across the entire application.

Required capabilities:
- Semantic HTML structure.
- Full keyboard navigability (no keyboard traps, logical tab order).
- Prominent, visible focus rings on all interactive elements.
- Accessible form controls with explicit labels and error associations.
- Screen-reader-friendly AQI information with ARIA live regions for dynamic updates.
- Accessible modal dialogs and menus with focus trapping and ESC-key handling.
- Text and UI component contrast meeting the WCAG 2.2 AA target (4.5:1 for normal text, 3:1 for large text/icons).
- Full `prefers-reduced-motion` support disabling non-essential motion.
- Meaningful alternative text and chart data descriptions.
- Status indicators accompanied by textual descriptions beyond color.
- Responsive layout adapting without loss of content down to 320px width.
- Fully accessible 2D map/list view as an alternative to the interactive globe.

### 14.1 Verification requirement and Lighthouse clarification
- **Lighthouse clarification:** An automated Lighthouse accessibility score (even a 100/100 score) **alone does NOT establish WCAG 2.2 AA compliance**. Lighthouse automates only a subset of accessibility rules.
- **Mandatory actual verification:** Full compliance requires multi-faceted verification:
  1. Manual keyboard navigation walks verifying focus order, focus visibility, and zero focus traps.
  2. Screen reader accessibility tree inspection using Chrome DevTools MCP (`take_snapshot`) and testing with assistive technologies.
  3. Automated axe-core / Lighthouse audits as an initial baseline.
  4. Manual color contrast ratio verification across both light and dark themes using contrast tools.
- Do not claim WCAG 2.2 AA compliance without retaining actual verification evidence.

---

# 15. TESTING STRATEGY

Testing must be built into implementation, not postponed until submission.

Unit tests:
- AQI interpretation.
- Pollutant conversion.
- Data freshness.
- Recommendation rules.
- CO2e calculations.
- Input validation.
- Storage handling.

Integration tests:
- Environmental API adapters.
- AI provider adapters.
- Recommendation orchestration.
- API validation.
- Error and fallback behavior.

UI tests:
- Onboarding.
- City selection.
- Dashboard.
- Daily planner.
- Indoor air guidance.
- AI Copilot.
- Cleaner choices.
- Saved locations.
- Theme switching.

Edge cases:
- API timeout.
- API quota exhaustion.
- Invalid response.
- Missing pollutant.
- Stale data.
- GPS denied.
- No internet.
- Corrupted localStorage.
- AI provider failure.
- Invalid AI output.
- Empty search results.
- Small mobile screens.

Run:
- TypeScript checks.
- Lint.
- Unit tests.
- Integration tests.
- Production build.

Every bug fix should include an appropriate regression test.

Never report a test as passing without actually running it.

---

# 16. SIX PROMPTWARS EVALUATION PARAMETERS

These six categories constitute the mandatory evaluation framework. Impact levels are strict and non-negotiable.

## 16.1 Impact classifications

1. **Code Quality — HIGH IMPACT**
2. **Security — MEDIUM IMPACT**
3. **Efficiency — MEDIUM IMPACT**
4. **Testing — LOW IMPACT**
5. **Accessibility — LOW IMPACT**
6. **Problem Statement Alignment — HIGH IMPACT**

## 16.2 Actionable engineering evidence matrix

### 16.2.1 Measurable engineering targets policy
Performance metrics (including FCP < 1.5s, LCP < 2.5s, 60 FPS animation frame rates, and Lighthouse performance scores >= 90) as well as formula test coverage (targeting 100% of mathematical and conversion formulas) are defined as strict, **measurable engineering targets rather than unconditional guarantees**.

To maintain scientific credibility and engineering integrity without weakening the critical importance of performance:
- Targets must never be claimed as unconditionally achieved in the abstract; they must be verified under explicit, documented testing conditions (device class, CPU throttling, network profile e.g. Simulated Fast 4G, browser version, viewport dimensions, and dataset volume).
- Every reported performance score or test coverage figure must be accompanied by retained verification artifacts (Lighthouse report, DevTools performance trace, Vitest coverage report).
- If lower-powered hardware or network constraints cause a target to be missed during testing, the actual measured baseline, identified bottleneck, and remediation plan must be documented rather than ignored.

Every evaluation parameter must be supported by concrete implementation, specific supporting skills, reproducible verification tests/audits, and retained artifacts:

| Parameter & Impact | What Must Be Implemented | Supporting Development Skills | Required Tests & Audits | Retained Artifacts & Reports | What Constitutes a Real Pass | Invalid Claims & Prohibited Assumptions |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Code Quality**  <br>*(HIGH IMPACT)* | - Layered modular architecture  <br>- Strict TypeScript types  <br>- Separation of concerns  <br>- Clean folder structure  <br>- Reusable components  <br>- Zero circular dependencies | `codebase-design`  <br>`domain-modeling`  <br>`code-review`  <br>`modern-web-guidance`  <br>`implement` | - `tsc --noEmit` type check  <br>- ESLint pass with zero errors  <br>- Code review against spec  <br>- Dead code & circular dependency scan | - Type check logs  <br>- Code review report  <br>- Architecture review notes  <br>- Dependency tree audit | Clean build, zero TypeScript errors, clean linter run, documented module boundaries, no duplicated business logic. | Claiming quality without running `tsc` or lint; claiming clean architecture with tangled component/business logic. |
| **Security**  <br>*(MEDIUM IMPACT)* | - Zero client-side API secrets  <br>- Server-side Route Handler proxies  <br>- Zod schema validation on all inputs  <br>- Safe HTML output (no `dangerouslySetInnerHTML`)  <br>- LocalStorage schema validation  <br>- Supply-chain risk mitigation | `security-audit`  <br>`audit-context-building`  <br>`sharp-edges`  <br>`supply-chain-risk-auditor`  <br>`fp-check`  <br>`semgrep`  <br>`codeql` | - Environment variable bundle leak audit  <br>- Semgrep / CodeQL static analysis  <br>- `npm audit` supply chain scan  <br>- Malicious input / XSS injection tests  <br>- Corrupted storage injection tests | - Security audit report  <br>- Supply chain audit output  <br>- Static analysis findings and remediation log | Server-only secrets confirmed by bundle inspection; zero high/critical vulnerabilities; all external inputs strictly validated by Zod; sanitized error handling. | Storing API keys in `NEXT_PUBLIC_` variables; assuming client-side inputs are safe; claiming security without static analysis evidence. |
| **Efficiency**  <br>*(MEDIUM IMPACT)* | - API response caching & deduplication  <br>- Debounced search inputs  <br>- Lightweight CSS/SVG globe  <br>- Dynamic imports / code-splitting  <br>- Optimized re-rendering  <br>- Minimal bundle footprint | `next-bundle-optimizer`  <br>`debug-optimize-lcp`  <br>`memory-leak-debugging`  <br>`gsap-performance`  <br>`chrome-devtools` | - Lighthouse performance audit  <br>- Next.js bundle analyzer check  <br>- Heap snapshot check for leaks  <br>- DevTools network waterfall review  <br>- Chrome DevTools MCP performance trace | - Lighthouse performance report  <br>- Bundle size analysis report  <br>- Trace / Core Web Vitals report  <br>- Network caching verification log | Meeting measurable engineering targets (FCP <1.5s, LCP <2.5s, 60 FPS animations, Lighthouse performance score >= 90) verified under documented testing conditions (device, network profile, viewport) with retained performance trace / audit evidence; clean bundle splitting with zero redundant API calls on navigation. | Claiming efficiency or unconditional performance guarantees without measuring bundle size, Core Web Vitals, or recording test conditions; claiming 60 FPS with unmeasured/unoptimized 3D or WebGL scenes. |
| **Testing**  <br>*(LOW IMPACT)* | - Unit tests for domain logic (AQI, CO2e, rules)  <br>- Integration tests for API adapters  <br>- Component UI state tests  <br>- Fallback & error handling tests  <br>- Local storage resilience tests | `tdd`  <br>`diagnosing-bugs`  <br>`code-review` | - Vitest test suite execution  <br>- Edge case tests (timeouts, missing fields)  <br>- Regression tests for fixed defects  <br>- Mocked API adapter tests | - Test execution output and summary  <br>- Test coverage summary  <br>- Regression test suite | All unit and integration test suites pass green with reproducible commands (`npm test`); verified formula test coverage targeting 100% of mathematical and conversion formulas, backed by documented execution logs and coverage reports. | Fabricating test results; reporting test passes without running tests; claiming complete coverage without edge-case tests or documented test execution logs. |
| **Accessibility**  <br>*(LOW IMPACT)* | - Full keyboard navigability  <br>- Visible focus rings  <br>- WCAG 2.2 AA color contrast target  <br>- Semantic HTML elements  <br>- Screen-reader accessible AQI & charts  <br>- `prefers-reduced-motion` support  <br>- Accessible 2D alternative to globe | `a11y-debugging`  <br>`web-design-guidelines`  <br>`chrome-devtools`  <br>`review-animations` | - Lighthouse accessibility audit  <br>- Chrome DevTools `take_snapshot` a11y tree review  <br>- Keyboard-only navigation walk  <br>- Color contrast automated verification  <br>- Screen reader emulation check | - Lighthouse a11y audit report (score >= 95)  <br>- A11y tree snapshot log  <br>- Contrast ratio verification log  <br>- Reduced motion verification record | Verified against the WCAG 2.2 AA accessibility target: zero critical axe-core violations; all interactive controls focusable via Tab with visible focus rings; all status indicators accompanied by descriptive text; accessibility tree verified via Chrome DevTools MCP `take_snapshot`. Note: A Lighthouse accessibility score (even >= 95) is a supporting automated check, but does NOT alone establish WCAG 2.2 AA compliance without manual keyboard and tree verification. | Claiming WCAG 2.2 AA compliance based solely on an automated Lighthouse score without keyboard walk, screen reader tree inspection, and contrast verification; relying on color alone to convey AQI danger; missing alt text or ARIA labels; trapping keyboard focus. |
| **Problem Statement Alignment**  <br>*(HIGH IMPACT)* | - Location-aware live environmental intelligence  <br>- Personalized daily routine planner  <br>- Practical indoor air improvement hacks  <br>- Sustainable cleaner choices explorer  <br>- Transparent CO2e impact calculator  <br>- Grounded AI Air Copilot  <br>- Real family & community use cases | `grill-with-docs`  <br>`to-spec`  <br>`design-taste-frontend`  <br>`modern-web-guidance` | - End-to-end user journey validation  <br>- Onboarding to daily plan flow check  <br>- Indoor room advice generation check  <br>- Alternative transport comparison check  <br>- AI grounded response check  <br>- Offline/stale data handling check | - End-to-end feature verification log  <br>- PromptWars Challenge 06 compliance matrix  <br>- User journey walkthrough record | Every feature of Challenge 06 is fully interactive and functional with real/modelled data; daily plans adjust to AQI; calculations are transparent. | Prioritizing decorative 3D effects over challenge features; delivering non-interactive mock screens; generating ungrounded AI hallucinations. |

---

# 17. AI SKILLS AND DEVELOPMENT WORKFLOW

AirAware leverages specialized AI agent skills installed in `.agents/skills/`. Each skill has a clearly defined scope of responsibility, preventing overlapping or conflicting actions.

## 17.1 Verified skill inventory

The following 44 skills are installed in the repository's `.agents/skills/` directory:

### Group A: Primary Visual Design Authority
- **`design-taste-frontend`**
  - **Responsibility:** Primary visual design authority for AirAware. Owns visual direction, design exploration, color palette proposals, theme direction (light/dark/adaptive), typography and font pairing, visual hierarchy, spacing scale, component aesthetics, and overall visual identity.
  - **Rule:** Taste is the single visual design authority. No other skill may independently redesign an interface or impose a competing visual system.

### Group B: Core Engineering and Specification Skills
- **`grill-with-docs`** — Clarifies ambiguous requirements by interrogating official documentation and approved project constraints.
- **`to-spec`** — Converts approved requirements and architecture into rigorous, testable implementation specifications.
- **`implement`** — Drives small, testable, incremental units of implementation following approved specifications.
- **`code-review`** — Conducts dual-axis code reviews (standards compliance and specification alignment).
- **`diagnosing-bugs`** — Systematically diagnoses hard bugs, test failures, and runtime defects using scientific hypothesis loops.
- **`domain-modeling`** — Establishes clear domain entities, aggregates, and value objects (AQI standards, pollutants, emissions, user routines).
- **`codebase-design`** — Guides deep module design, information hiding, interface seams, and clean architecture boundaries.
- **`modern-web-guidance`** — Authoritative guide for modern web standards, HTML/CSS/JS best practices, and web platform capabilities.

### Group C: Next.js and React Engineering Skills
- **`vercel-react-best-practices`** — Performance optimization patterns for React and Next.js (waterfall avoidance, server/client boundaries, bundle minimization).
- **`next-dev-loop`** — Verifies Next.js runtime behavior in development mode after editing application code.
- **`next-bundle-optimizer`** — Audits and minimizes initial browser JavaScript bundles, eliminates duplicate dependencies, and optimizes dynamic imports.
- **`next-cache-components-adoption`** — Evaluates and safely adopts component caching patterns where appropriate.
- **`next-cache-components-optimizer`** — Optimizes cache keys and invalidation behavior for cached components.
- **`next-partial-prefetching-adoption`** — Evaluates Partial Prefetching patterns for instant client navigations where supported.
- **`next-partial-prefetching-optimizer`** — Fine-tunes prefetch strategies (default, viewport, intent) for route transitions.
- **`web-design-guidelines`** — Audits UI implementation against web interface guidelines, keyboard interactions, and responsive standards.
- **Rule:** Do not blindly enable experimental or version-specific Next.js features. Always verify compatibility with the actual installed Next.js version and official documentation before adopting.

### Group D: Animation and Interaction Skills
- **`animate`** — Guides refined CSS transitions, micro-interactions, layout animations, and accessible motion.
- **`review-animations`** — Reviews implemented animations for performance, frame drops, layout thrashing, and reduced-motion conformance.
- **`gsap-core`** — Core GSAP animation patterns and tween configurations.
- **`gsap-performance`** — Optimizes animation performance (transform-only, will-change, avoiding layout thrashing, 60fps targets).
- **`gsap-plugins`** — Guidance for official GSAP plugins (ScrollTrigger, Flip, Observer) when needed.
- **`gsap-react`** — Safe React/Next.js integration for GSAP (`useGSAP`, context scoping, clean unmount cleanup).
- **`gsap-scrolltrigger`** — Scroll-driven animations, pinning, and timeline scrub control.
- **`gsap-timeline`** — Complex multi-step animation sequences and keyframe coordination.
- **`gsap-utils`** — Interpolation, clamping, snapping, and mathematical utility mapping for animations.
- **Rules:**
  - Native CSS transitions and animations must be used whenever sufficient.
  - GSAP is used only when an interaction genuinely requires choreographed timelines or complex scroll coordination.
  - Avoid excessive animation, heavy parallax, and visual distractions.
  - **Lenis is a planned runtime dependency**, not an installed skill. Do not assume Lenis is currently available.

### Group E: Testing and Quality Skills
- **`tdd`** — Enforces test-driven development (red-green-refactor) for domain calculations and utilities.
- **`code-review`** — Reviews pull requests and diffs against repository standards and acceptance criteria.
- **`web-design-guidelines`** — Evaluates interactive states, responsive behavior, and UI quality.
- **`review-animations`** — Audits motion quality and ensures `prefers-reduced-motion` compliance.
- **Explicit verification note:** `property-based-testing` was verified as **NOT installed** in the repository. Do not document or call it as an installed skill.
- **Rule:** Never claim test coverage or successful test execution without verifiable execution commands and actual terminal output.

### Group F: Security Skills
- **`security-audit`** — Comprehensive security guidance, threat modeling, and vulnerability assessments.
- **`audit-context-building`** — Analyzes architecture assumptions, trust boundaries, and data flow before vulnerability audits.
- **`codeql`** — Static analysis queries for security vulnerabilities and dangerous patterns.
- **`differential-review`** — Reviews security impact of specific pull requests or code modifications.
- **`fp-check`** — Systematically verifies suspected security findings to eliminate false positives.
- **`semgrep`** — Fast static analysis and custom rule-based vulnerability scanning.
- **`sharp-edges`** — Identifies error-prone APIs, dangerous configurations, and security footguns.
- **`supply-chain-risk-auditor`** — Audits dependencies, lockfiles, and transitive packages for supply-chain risk and vulnerabilities.
- **`variant-analysis`** — Investigates whether a detected security flaw pattern exists elsewhere in the codebase.
- **Rules:** Do not assume security scans run automatically; invoke them explicitly. Do not invent uninstalled security skills.

### Group G: Browser and Debugging Skills
- **`chrome-devtools`** — Drives Chrome DevTools MCP for live browser automation, element snapshots, and runtime inspection.
- **`chrome-devtools-cli`** — Automates browser interactions directly from terminal commands via the global CLI.
- **`a11y-debugging`** — Audits accessibility trees, ARIA states, color contrast, and tap targets via DevTools.
- **`cookie-debugging`** — Inspects and debugs browser storage, cookies, and HTTP header states.
- **`debug-optimize-lcp`** — Diagnoses and optimizes Largest Contentful Paint (LCP) subparts and Core Web Vitals.
- **`inspect-in-devtools`** — Connects directly to the DevTools UI for live inspection and element selection.
- **`memory-leak-debugging`** — Analyzes heap snapshots, detached DOM trees, and memory retention paths.
- **`troubleshooting`** — Triages and fixes Chrome connection, port, and browser automation issues.

## 17.2 Astryx design-system library (Application Infrastructure)

Astryx is an **installed application component library**, NOT an AI skill.

The repository currently has the following packages installed in `package.json`:
- `@astryxdesign/core@0.7.16`
- `@astryxdesign/theme-neutral@0.7.16`
- `@stylexjs/stylex@0.19.2`

### 17.2.1 Integration rules for Astryx
- Astryx must be documented and handled under application dependencies and design-system infrastructure.
- Verify its actual documentation, component API, and integration requirements before utilizing components.
- Verify compatibility with the selected Next.js version, React 19.3.1, and the Next.js App Router (RSC vs. Client Components).
- Do NOT assume Tailwind CSS and StyleX can be combined without explicit configuration decisions. If StyleX is used, its compilation pipeline must be properly configured.
- Use Astryx components where they genuinely accelerate development and meet quality standards.
- Customize or build custom components where needed to achieve the Taste-approved visual identity.
- **Astryx defaults must NEVER override the approved AirAware design system.** Astryx serves the design system; it does not dictate it.

## 17.3 Chrome DevTools MCP integration

Chrome DevTools MCP has been successfully installed, configured, and verified in the Antigravity AI IDE:

- **Server Configuration:** Configured in `C:\Users\rahul\.gemini\config\mcp_config.json` and `C:\Users\rahul\.gemini\antigravity-ide\mcp_config.json` under server name `chrome-devtools`.
- **Command:** `npx -y chrome-devtools-mcp@latest`
- **Global CLI:** `chrome-devtools` v1.13.0 installed globally via npm.
- **Tool Schemas:** 33 tool schemas discovered and cached in `C:\Users\rahul\.gemini\antigravity\mcp\chrome-devtools/`.
- **Verified Capabilities:**
  1. MCP protocol initialization handshake.
  2. Automated browser launch and process management.
  3. Page navigation and lifecycle control.
  4. Script evaluation (`evaluate_script`).
  5. Accessibility tree extraction (`take_snapshot`).
  6. Performance tracing and Lighthouse integration.
- **Policy:** Preserve the existing MCP configuration. Do not reinstall or duplicate it. Use it for browser-level validation throughout development.

## 17.4 Skill ownership and conflict prevention hierarchy

When coordinating multiple skills, follow this strict 10-level responsibility hierarchy:

1. **Master Specification:** The single source of truth for all product requirements, scope, budget, and architectural principles.
2. **Product Owner:** Approves major scope, architecture, or design direction changes.
3. **Taste (`design-taste-frontend`):** The primary visual design authority for aesthetic direction, color palette, typography, layout hierarchy, and component styling.
4. **Modern Web Guidance & Vercel Skills (`modern-web-guidance`, `vercel-react-best-practices`):** Guide technical web standards, Next.js architecture, and rendering performance.
5. **Core Engineering Skills (`to-spec`, `implement`, `codebase-design`, `domain-modeling`):** Guide architectural decomposition, specification drafting, and code implementation.
6. **GSAP and Animation Skills (`animate`, `gsap-*`, `review-animations`):** Guide motion, scroll coordination, and animation performance.
7. **Security Skills (`security-audit`, `sharp-edges`, `supply-chain-risk-auditor`):** Guide threat modeling, vulnerability reviews, and dependency security.
8. **Testing Skills (`tdd`, `diagnosing-bugs`):** Guide test-driven development, regression tests, and verification evidence.
9. **Chrome DevTools Skills & MCP (`chrome-devtools`, `a11y-debugging`, etc.):** Support live browser inspection, a11y auditing, and runtime debugging.
10. **Astryx Library:** Provides reusable UI component primitives that must strictly conform to the Taste-approved design tokens.

### 17.4.1 Conflict resolution rules
- If two skills provide conflicting recommendations, **do not combine conflicting solutions blindly**.
- Identify the explicit conflict and document the technical trade-offs.
- Consult official documentation to verify facts.
- Follow the Master Specification and approved architectural decisions.
- Seek product owner approval before altering any confirmed decision.
- **Prohibitions:**
  - Do NOT install additional skills without identifying a genuine missing capability and obtaining product owner approval.
  - Do NOT use "UI/UX Pro Max" as a design authority.
  - Do NOT document "Impeccable" or "Inspo MCP" as installed skills (they are not present in `.agents/skills/`).

---

# 18. DOCUMENTATION AND DECISION MANAGEMENT POLICY

AirAware requires disciplined documentation management to ensure that decisions remain transparent, traceable, and authoritative throughout development.

## 18.1 Single source of truth rule

- This `AIR_AWARE_MASTER_SPECIFICATION.md` document is the authoritative single source of truth.
- Secondary documentation (ADRs, API verifications, component guides) must reference and align with this specification.
- If a secondary document contradicts this specification, this specification prevails until a formal update is approved.
- Avoid duplicating entire specification sections across multiple files to prevent specification drift.

## 18.2 Decision classification system

Every technical and product statement must fall into one of three explicit categories:

1. **Confirmed Decisions:** Fully approved choices (e.g., ₹0 budget, no authentication, local-first storage, Taste as design authority). Must be implemented as specified.
2. **Technical Proposals:** Recommended approaches (e.g., specific Next.js version, StyleX vs. Tailwind integration, Cloudflare Workers AI model names). Must be verified before commitment.
3. **Items Awaiting Verification:** Technical uncertainties (e.g., Next.js App Router compatibility with Astryx components, OpenAQ API key requirements, rate limits). Must be formally tested and documented in Phase 0.

## 18.3 Required documentation artifacts

As implementation progresses, the following supporting artifacts must be maintained:

1. **Architecture Decision Records (ADRs):** Maintained in `docs/adr/` for any significant architectural choice (e.g., Next.js version selection, styling engine choice, AI fallback strategy). Each ADR records: context, decision, consequences, and alternatives considered.
2. **Design System Reference:** Maintained in `docs/design-system/` once Taste has proposed and the product owner has approved the visual identity. Documents color tokens, typography scales, spacing tokens, and component states.
3. **API Verification Documents:** Maintained in `docs/api-verification/` before integrating any external service. Documents endpoints, quotas, rate limits, schema samples, and error codes.
4. **Dependency Log:** Records every dependency addition, its exact version, purpose, bundle size impact, and license.
5. **Trade-Off and Rejected Alternatives Log:** Documents why specific libraries, architectures, or design paths were rejected.
6. **Acceptance Criteria Evolution Record:** Documents any approved adjustments to scope, ensuring no requirement is silently dropped.

---

# 19. PHASED IMPLEMENTATION ROADMAP

Development proceeds strictly through nine sequential phases. Do not advance to a new phase until the deliverables of the current phase are verified and approved.

## Phase 0 — Repository inspection, planning, and compatibility resolution

- Inspect existing repository structure, files, and Git status.
- Verify installed packages (`@astryxdesign/core`, `@astryxdesign/theme-neutral`, `@stylexjs/stylex`, `react@19.3.1`, `react-dom@19.3.1`).
- Verify installed skills (44 skills) and Chrome DevTools MCP integration.
- Formally evaluate and resolve Next.js, React, Astryx, and styling toolchain compatibility.
- Evaluate StyleX integration requirements in Next.js vs. Tailwind CSS co-existence.
- Identify architectural risks and technical debt.
- Prepare a comprehensive dependency installation plan (Next.js, TypeScript, styling, validation, testing).
- Prepare a Taste visual design exploration plan.
- Map planned implementation tasks to the Six PromptWars Evaluation Parameters.
- **Rule:** Do NOT initialize Next.js or install application dependencies during Phase 0 until the assessment and plan are reviewed and approved.

*Deliverable:* Repository assessment, compatibility matrix, and approved Phase 1 implementation plan.

## Phase 1 — Foundation, design system, and application shell

- Activate `design-taste-frontend` to explore and propose the visual direction (light/soft/sophisticated palette, selective dark accents, typography, spacing).
- Resolve necessary design questions with the product owner.
- Establish centralized design tokens (colors, typography, spacing, elevation, radii).
- Initialize Next.js and TypeScript according to the approved Phase 0 compatibility plan.
- Configure the styling toolchain and integrate Astryx components conforming to design tokens.
- Build reusable core UI components (buttons, cards, inputs, status badges, modal dialogs).
- Build the application shell, navigation, and theme provider.
- Implement onboarding flow foundation.
- Verify accessibility (keyboard navigation, visible focus, WCAG 2.2 AA contrast target) and responsive layout.

*Deliverable:* Working application foundation with verified design tokens, theme support, and reusable components.

## Phase 2 — Global Air Intelligence

- City search with debounced input and geocoding integration.
- Optional browser GPS location detection with graceful permission handling.
- Environmental data adapters (Open-Meteo Air Quality API).
- AQI interpretation engine supporting local and global standards.
- Pollutant cards (PM2.5, PM10, NO2, O3, SO2, CO) with units and freshness timestamps.
- Hourly and daily forecast visualizations.
- Historical trend visualization when reliable data exists.
- Multiple saved locations and primary location selection.
- Lightweight CSS/SVG interactive globe prototype.
- Accessible 2D map/list view alternative to the globe.

*Deliverable:* Functional location-aware environmental intelligence dashboard.

## Phase 3 — Personalization and daily routine planner

- Household profile management (household size, children, elderly, sensitivities).
- Lifestyle profile (work/school hours, commute type/distance, outdoor exercise habits).
- Deterministic recommendation engine matching AQI conditions to user schedule.
- Interactive, editable daily routine planner.
- Specific activity recommendations (outdoor exercise windows, ventilation times, errand timing).
- Commute optimization guidance.
- Family and vulnerable group health advisories.

*Deliverable:* Practical, personalized daily routine planner.

## Phase 4 — Indoor Air Intelligence

- Room-level profiling (living room, bedroom, kitchen, study).
- Practical indoor air quality improvement guidance (ventilation, dust control, cooking practices).
- Ventilation timing recommendations based on outdoor AQI forecasts.
- Air filtration education, purifier selection guidelines, and filter maintenance tracking.
- Low-cost and DIY improvement hacks.
- Optional, neutral, and practical indoor product suggestions.

*Deliverable:* Comprehensive indoor air improvement assistant.

## Phase 5 — AI Air Copilot

- Cloudflare Workers AI primary adapter and Gemini API free-tier secondary adapter.
- Grounded prompt engineering pipeline incorporating live environmental facts and minimal profile context.
- Structured AI response validation using Zod.
- Deterministic fallback engine providing instant offline/rule-based guidance upon AI failure.
- Conversational UI with pre-built prompt suggestions and structured answers.
- Privacy filter stripping sensitive personal data before AI transmission.

*Deliverable:* Functional, data-grounded AI environmental assistant.

## Phase 6 — Cleaner Choices Explorer and Personal Impact Dashboard

- Sustainable transport alternative comparisons (private car, public transit, carpool, cycling, walking).
- Transparent CO2e emission calculation engine with visible formulas and emission factors.
- Distance and occupancy adjustment models.
- Habit tracker for logged clean-air actions.
- Personal Impact Dashboard showing weekly/monthly avoided CO2e trends.
- Calculation assumption inspector.

*Deliverable:* Transparent environmental impact and alternative comparison experience.

## Phase 7 — Community Air Intelligence and pollution alerts

- Nearby ground monitoring station information and metadata.
- Neighborhood and city comparative air intelligence.
- Community pollution trends and seasonal smog patterns.
- In-app threshold alert system for deteriorating air quality.
- Optional browser notification integration.
- Public educational and clean-air community initiatives.

*Deliverable:* Connected community intelligence and localized alert system.

## Phase 8 — Comprehensive audit, optimization, and submission preparation

- Code quality review: Architecture consistency, zero dead code, zero circular dependencies, full type-check pass.
- Security audit: Secret exposure review, static analysis (Semgrep/CodeQL), supply chain audit.
- Performance optimization: Core Web Vitals audit (LCP, INP, CLS), bundle size optimization, Lighthouse performance >= 90.
- Accessibility audit: Verified against the WCAG 2.2 AA target via full keyboard testing, screen reader tree inspection via Chrome DevTools MCP, contrast verification, and Lighthouse a11y >= 95 (recognizing that automated scores alone do not establish full compliance).
- Complete testing suite: Unit tests, integration tests, regression tests passing with reproducible commands.
- Cross-device responsive testing (mobile, tablet, desktop).
- Challenge 06 alignment verification against all brief requirements.
- Final documentation, README, and demonstration script.

*Deliverable:* Production-ready, submission-verified AirAware platform.

---

# 20. FINAL ACCEPTANCE CRITERIA

AirAware is ready for final submission only when all 22 criteria are met:

1. A user can search and select any global city manually.
2. Optional browser GPS works seamlessly or fails gracefully without blocking the application.
3. Environmental data displays clear source attribution, measurement method, and freshness timestamps.
4. AQI standards (US AQI, European EAQI, local standards) are correctly identified and never mixed without explanation.
5. Pollutant concentrations (PM2.5, PM10, NO2, O3, SO2, CO) are displayed with proper units and health categories.
6. Short personalized onboarding captures essential lifestyle context without asking for intrusive medical data.
7. Daily routine recommendations are deterministic-first, traceable to real environmental conditions and user context.
8. Users can edit, adjust, and customize their recommended daily plans.
9. Indoor air intelligence provides actionable, practical advice for ventilation, cooking, dust, and filtration.
10. The AI Air Copilot answers queries using grounded environmental facts and structured responses.
11. AI provider failure or quota exhaustion triggers deterministic fallback without breaking the UI.
12. Cleaner transport alternatives provide transparent, side-by-side comparisons.
13. Personal impact calculations clearly display their emission factors, formulas, and assumptions.
14. Saved locations, primary location, profile preferences, and habit logs persist reliably in local storage.
15. Stale, missing, or unavailable API data is honestly labelled and accompanied by cached safety guidance.
16. The interactive Earth globe operates smoothly using lightweight techniques without requiring heavy 3D scenes.
17. The entire application is fully responsive and visually polished across mobile, tablet, and desktop viewports.
18. Accessibility standards (targeting WCAG 2.2 AA with actual verification beyond automated Lighthouse scores) are verified for keyboard navigation, contrast, screen reader accessibility, and `prefers-reduced-motion`.
19. Security protections (server-side API proxies, input validation, zero client secrets) are verified.
20. TypeScript type checking (`tsc --noEmit`), ESLint, unit tests, and production build pass with zero errors.
21. All six PromptWars evaluation categories have documented evidence in the engineering matrix.
22. Every advertised feature has been end-to-end verified in a live browser environment.

---

# 21. INSTRUCTIONS TO THE AI CODING AGENT

You are the engineering agent responsible for implementing AirAware. Follow these rules throughout development:

1. **Read before acting:** Always read this complete Master Specification before beginning any new phase or task.
2. **Inspect before assuming:** Inspect the actual repository files, installed packages, and Git status before making assumptions.
3. **Respect confirmed decisions:** Do not reopen or question confirmed decisions (₹0 budget, no authentication, local-first storage, Taste as design authority).
4. **Follow the skill hierarchy:** Adhere strictly to the 10-level responsibility hierarchy in Section 17.4. Do not let overlapping skills make conflicting decisions.
5. **Taste is the design authority:** Use `design-taste-frontend` for all visual direction, palette, theme, typography, and component aesthetic decisions.
6. **Respect visual preferences:** Follow the approved soft, light, elegant, and sophisticated visual direction. Do NOT force a dark-first theme or hard-code the old navy/cyan palette.
7. **Astryx is a library, not a design authority:** Treat Astryx as an application component library. Astryx must conform to the Taste-approved design tokens.
8. **Verify compatibility before installing:** Formally verify package compatibility (Next.js, React 19, StyleX, TypeScript) before installing or upgrading dependencies.
9. **Zero-budget mandate:** Preserve the strict ₹0 budget and no-paid-fallback rule across all services and APIs.
10. **Zero fabrication:** Never fabricate API data, AI responses, test results, performance metrics, or accessibility scores.
11. **Keep evaluation parameters in view:** Maintain alignment with all Six PromptWars Evaluation Parameters throughout implementation.
12. **Phase approval gate:** Do not begin implementation of a new phase without approval of the deliverables from the preceding phase.
13. **Explain conflicts and seek approval:** If requirements conflict or an established architectural decision must change, explain the trade-offs clearly and obtain approval.
14. **Incremental implementation:** Build small, testable units with corresponding regression tests.
15. **Git status accuracy in reporting:** Always run `git status` before completing a task. Explicitly distinguish pre-existing untracked or modified files from files created or modified during the current task. Never describe a repository as "clean" when Git reports untracked, unstaged, or modified files. A repository is clean only when `git status` reports zero untracked and zero modified files.

### Required reporting format for every implementation phase

For every completed phase or significant milestone, provide a comprehensive report covering:

- **What was implemented:** Detailed breakdown of features, components, and logic completed.
- **Files created:** Full repository paths of all newly created files.
- **Files modified:** Summary of modified files and the exact nature of modifications.
- **Dependencies added and rationale:** Packages added, exact versions, and architectural justification.
- **Tests executed and results:** Test commands executed and actual terminal outputs.
- **TypeScript results:** Output of `tsc --noEmit` confirming zero type errors.
- **Lint results:** Output of ESLint confirming zero errors.
- **Build results:** Output of production build confirming clean compilation.
- **Known limitations:** Technical constraints, edge-case limitations, or mock boundaries.
- **Remaining work:** Upcoming tasks mapped to the phased roadmap.
- **Impact on the Six Evaluation Parameters:** Explicit accounting of how the completed work supports Code Quality, Security, Efficiency, Testing, Accessibility, and Challenge Alignment.
- **Git status and repository state:** Accurate output of `git status --porcelain` explicitly distinguishing:
  1. Files created during the current task.
  2. Files modified during the current task.
  3. Pre-existing untracked files (e.g., untracked `.agents/`, `node_modules/`, lockfiles) that were present prior to the task.
  - Strict rule: Never describe a repository as "clean" if Git reports any untracked, unstaged, or modified files. If untracked or modified files exist, report the exact status and accurately categorize each item.

If a requirement is blocked by unavailable APIs, rate limits, or technical limitations, document the exact constraint and propose the smallest reliable alternative. Never silently remove a requirement.

---

# 22. FINAL PRODUCT PRINCIPLE

AirAware should not be judged by how many animations, cards, AI features or 3D effects it contains.

It should be judged by how effectively it helps people understand air pollution and make better everyday decisions.

**Reliable environmental information first.  
Practical personalized actions second.  
Grounded AI assistance third.  
Premium visual experience throughout.**

Breathe Smarter. Live Better.
