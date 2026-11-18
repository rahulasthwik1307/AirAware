# AirAware — AI Agent Instructions & Workspace Governance

> **Project:** AirAware — Global Environmental Intelligence Platform (PromptWars Virtual Challenge 06).
> **Guiding Principle:** Reliable environmental information first • Practical personalized actions second • Grounded AI assistance third • Premium visual experience throughout.

---

## 1. Authoritative Specification & Task Inception Protocol

- `AIR_AWARE_MASTER_SPECIFICATION.md` is the authoritative single source of truth for all product architecture, mathematical formulas, algorithms, feature requirements, and implementation phases.
- **Mandatory Task Inception Protocol:** At the start of EVERY task:
  1. Read this `AGENTS.md` file to confirm workspace governance and constraints.
  2. Read the relevant section(s) of `AIR_AWARE_MASTER_SPECIFICATION.md`.
  3. Classify the task (e.g., Planning, Visual Design, Domain Modeling, Component UI, API Integration, Testing, Performance, or Security).
  4. Select ONLY the relevant skills for that task from the 44-skill inventory below.
  5. Never assume, invent, or extrapolate requirements from memory.

---

## 2. Antigravity Instruction Loading & Skill Invocation Reality

- **Rules vs. Skills:** Rules defined in `AGENTS.md` are automatically discovered and loaded into the AI agent prompt under `<user_rules>` on every turn. However, installed skills in `.agents/skills/` are **NOT** automatically executed.
- Antigravity exposes only skill names and descriptions in the prompt context. The full instructions of a skill are loaded only when the agent or user explicitly triggers that skill via progressive disclosure.
- Therefore, you must deliberately select, invoke, and read the appropriate skill when entering its domain of responsibility. Never make unsupported claims that an uninvoked skill ran automatically.

---

## 3. Mandatory Authority & Conflict-Resolution Hierarchy

When coordinating development decisions and multi-skill workflows, adhere strictly to this 10-level hierarchy (Section 17.4):

1. **Master Specification:** Authoritative product scope, requirements, ₹0 budget, and architectural roadmap.
2. **Product Owner:** Final approval on all product requirements, architecture, scope changes, and design direction.
3. **Taste (`design-taste-frontend`):** Sole visual design authority (color palette, typography, visual hierarchy, layout aesthetics).
4. **Technical Web Authorities (`modern-web-guidance`, `vercel-react-best-practices`):** Modern web platform standards, browser APIs, Next.js architecture, and React rendering performance.
5. **Core Engineering Skills (`to-spec`, `implement`, `codebase-design`, `domain-modeling`, `grill-with-docs`):** Domain modeling, specification drafting, and incremental implementation.
6. **Animation & Interaction Skills (`animate`, `review-animations`, `gsap-*`):** Motion design, timing curves, scroll coordination, and animation performance.
7. **Security Skills (`security-audit`, `sharp-edges`, `supply-chain-risk-auditor`, `fp-check`, etc.):** Threat modeling, input validation, and dependency risk.
8. **Testing Skills (`tdd`, `diagnosing-bugs`):** Test-driven development, regression tests, and verification evidence.
9. **Chrome DevTools & Debugging Skills (`chrome-devtools`, `a11y-debugging`, etc.):** Runtime, browser, accessibility, and performance verification.
10. **Astryx Library:** Reusable UI component library; strictly subordinate to the Taste-approved design tokens.

### Conflict-Resolution Protocol
- Never combine conflicting recommendations blindly.
- Identify the explicit conflict and document the technical trade-offs.
- Verify claims against official documentation and the Master Specification.
- Seek Product Owner approval before altering any confirmed decision.
- Astryx defaults, component libraries, or technical skills must NEVER override Taste on visual aesthetics.

---

## 4. Mandatory Modern Web Guidance & Platform Currency

The `modern-web-guidance` skill is a **mandatory technical authority** for all significant frontend architecture and UI implementation tasks.
- **Documented Workflow:**
  1. **Search:** Run `npx -y modern-web-guidance@latest search "<query>" --skill-version 2026_11_10-47b4c80e` with a 2–5 word action-oriented English query describing the user-visible UI primitive or web platform capability (e.g. `"confirmation modal dialog"`, `"responsive data table"`).
     - *Version Currency Policy:* The CLI supports version selection via the internal `--skill-version <version>` parameter (do not invent unverified CLI flags such as `--latest`). Periodically verify whether the pinned version (`2026_11_10-47b4c80e`) remains compatible and current. If a newer skill version is available, propose updating it to the Product Owner; do NOT update without approval.
  2. **Retrieve:** Run `npx -y modern-web-guidance@latest retrieve "<id>"` using the relevant guide ID(s) returned by search.
  3. **Official Documentation Cross-Check:** Web APIs, CSS standards, React 19, and Next.js 16 evolve rapidly. Whenever implementing a capability where browser support, React Server Component patterns, or Next.js App Router conventions may have evolved beyond the guidance snapshot, consult current official documentation (MDN Web Docs, React documentation, Next.js documentation).
  4. **Version Compatibility Verification:** Verify that guidance recommendations are fully compatible with the installed project stack:
     - Next.js 16 (App Router, Turbopack; Cache Components and Partial Prerendering [PPR] applicable only when the relevant features are explicitly enabled and supported by the installed configuration)
     - React 19 (React Server Components, Actions, native DOM integration)
     - TypeScript (declared: `^5.7.3`, installed: `5.9.3`; `strict: true`, path alias `@/*`)
     - Tailwind CSS 4 (CSS cascade layers, `@theme` block)
     - Astryx Core 0.7.16 (precompiled CSS baseline)
  5. **Conflict Resolution & Architecture Protection:** If retrieved guidance or external documentation conflicts with confirmed project architecture (e.g. the Astryx baseline, Taste visual identity, local-first storage, or ₹0 budget):
     - Explicitly document the conflict and technical trade-offs to the Product Owner.
     - Never silently upgrade packages, add unapproved dependencies, or alter confirmed architectural patterns.
     - Await Product Owner direction before proceeding.
  6. **Anti-Deprecation Rule:** Strictly avoid deprecated HTML attributes, legacy CSS properties, obsolete polyfills, and outdated React lifecycle methods. Use baseline widely available web platform features with necessary fallbacks as documented in the guides.
  7. **Dual Disclosure Requirement:** When delivering code shaped by web guidance, conclude the response with a `### Modern Web Guidance & Documentation Consulted` section detailing:
     - The specific guide `<id>`s applied, non-obvious API/CSS choices, and short verbatim quotes of the relevant gotcha/rule.
     - The specific official documentation sources consulted (e.g. MDN URLs, Next.js 16 docs, React 19 docs) and the version compatibility verified.
- **Triggers:** Modals/dialogs/popovers, tables, responsive layouts, container queries, view transitions, scroll-driven animations, forms, validation, autofill, accessibility, custom selects, scrollbars, Core Web Vitals (LCP, INP, CLS), content-visibility, fetch priority, image optimization, HTML sanitization, dates/timezones, standard HTML/CSS/DOM in frameworks.
- **Non-Triggers:** Backend logic (SQL, API routes), infra/scripts (CI/CD, Docker, Git), or tooling/trivial setup (tsconfig, ESLint, tests).
- **Role Boundary:** Technical authority on *how* to build cleanly using modern web platform standards; it does not dictate visual style (Taste retains ownership of visual identity).

---

## 5. Exhaustive Inventory of All 44 Installed Skills

Select only the skills relevant to the active task. Do not invoke all skills simultaneously.

### Group A: Visual Design Authority (1 skill)
1. **`design-taste-frontend`**
   - *Responsibility:* Sole visual design authority. Owns aesthetic direction, color palette proposals, typography, layout hierarchy, and component styling.
   - *When to invoke:* Establishing or updating visual direction, component aesthetics, or design systems.
   - *When NOT to invoke:* Backend logic, data ingestion, mathematical formulas, or security reviews.
   - *Combinations:* Pairs with `web-design-guidelines` for UI review and `modern-web-guidance` for standards.
   - *Mandatory Rule:* Must ask design questions **ONE AT A TIME** and wait for Product Owner answers.

### Group B: Core Engineering & Specifications (8 skills)
2. **`grill-with-docs`**
   - *Responsibility:* Clarifies ambiguous requirements and pressure-tests architecture against official documentation.
   - *When to invoke:* Inception of complex integrations or unfamiliar APIs.
   - *When NOT to invoke:* Trivial bug fixes or straightforward file updates.
   - *Combinations:* Pairs with `to-spec` before feature implementation.
3. **`to-spec`**
   - *Responsibility:* Converts approved requirements into testable implementation specifications.
   - *When to invoke:* Multi-file feature additions or significant architectural changes.
   - *When NOT to invoke:* Minor typo fixes or small refactors.
   - *Combinations:* Pairs with `implement` and `tdd`.
4. **`implement`**
   - *Responsibility:* Executes incremental, testable units of code following approved specifications.
   - *When to invoke:* Active coding phases.
   - *When NOT to invoke:* High-level planning or security audit stages.
   - *Combinations:* Pairs with `tdd`, `code-review`, and `next-dev-loop`.
5. **`code-review`**
   - *Responsibility:* Conducts dual-axis code reviews (standards compliance and specification alignment).
   - *When to invoke:* Pull requests, completed feature milestones, and pre-phase gates.
   - *When NOT to invoke:* During initial drafting or planning turns.
   - *Combinations:* Pairs with `differential-review` and `web-design-guidelines`.
6. **`diagnosing-bugs`**
   - *Responsibility:* Executes hypothesis-driven diagnosis for hard bugs and test failures.
   - *When to invoke:* When code throws errors, tests fail unexpectedly, or performance regresses.
   - *When NOT to invoke:* Writing new feature specifications from scratch.
   - *Combinations:* Pairs with `chrome-devtools` and `troubleshooting`.
7. **`domain-modeling`**
   - *Responsibility:* Establishes domain aggregates, entities, value objects, and business rules.
   - *When to invoke:* Designing AQI conversion logic, pollutant thresholds, emission calculations, or routine schedules.
   - *When NOT to invoke:* Pure UI styling or CSS adjustments.
   - *Combinations:* Pairs with `codebase-design` and `tdd`.
8. **`codebase-design`**
   - *Responsibility:* Enforces modular architecture, deep module interfaces, and information hiding.
   - *When to invoke:* Architecting new subsystems (e.g. data ingestion engine, caching store).
   - *When NOT to invoke:* Single-component leaf styling.
   - *Combinations:* Pairs with `domain-modeling` and `to-spec`.
9. **`modern-web-guidance`**
   - *Responsibility:* Mandatory technical guide for modern web platform standards, HTML/CSS/JS APIs, and best practices.
   - *When to invoke:* Designing or implementing web UI, client-side JS logic, dialogs, tables, and responsive layouts.
   - *When NOT to invoke:* Backend-only scripts, pure database queries, or CI tooling.
   - *Combinations:* Pairs with `vercel-react-best-practices` and `design-taste-frontend`.

### Group C: React & Next.js Architecture (8 skills)
10. **`vercel-react-best-practices`**
    - *Responsibility:* React and Next.js performance patterns, eliminating waterfalls, optimizing RSC/client boundaries.
    - *When to invoke:* Creating or refactoring React components and Next.js routes.
    - *When NOT to invoke:* Pure utility calculations with no React dependencies.
    - *Combinations:* Pairs with `modern-web-guidance` and `next-bundle-optimizer`.
11. **`next-dev-loop`**
    - *Responsibility:* Verifies runtime behavior and hydration in a running Next.js development server.
    - *When to invoke:* After editing application pages or interactive client components.
    - *When NOT to invoke:* Pure documentation or unit test tasks.
    - *Combinations:* Pairs with `chrome-devtools` and `implement`.
12. **`next-bundle-optimizer`**
    - *Responsibility:* Audits and reduces initial browser JavaScript bundles and identifies code-splitting opportunities.
    - *When to invoke:* Introducing dependencies or optimizing slow route initializations.
    - *When NOT to invoke:* Small text or stylesheet changes.
    - *Combinations:* Pairs with `debug-optimize-lcp`.
13. **`next-cache-components-adoption`**
    - *Responsibility:* Evaluates adoption of component caching patterns (applicable only when Next.js Cache Components are explicitly enabled and supported by the installed configuration).
    - *When to invoke:* Structuring server-side data fetching and revalidation layers where Cache Components are enabled.
    - *When NOT to invoke:* Highly dynamic client-only state, or when Cache Components are not enabled or supported.
    - *Combinations:* Pairs with `next-cache-components-optimizer`.
14. **`next-cache-components-optimizer`**
    - *Responsibility:* Optimizes cache keys, invalidation tags, and revalidation behavior (applicable only when Next.js Cache Components are explicitly enabled and supported by the installed configuration).
    - *When to invoke:* Fine-tuning cache hit rates for environmental data feeds where Cache Components are enabled.
    - *When NOT to invoke:* Uncached client-side forms, or when Cache Components are not enabled or supported.
    - *Combinations:* Pairs with `next-cache-components-adoption`.
15. **`next-partial-prefetching-adoption`**
    - *Responsibility:* Evaluates Partial Prefetching (PPR) patterns where applicable (applicable only when PPR is explicitly enabled and supported by the installed Next.js configuration).
    - *When to invoke:* Optimizing client-side route transitions and navigation instantaneity where PPR is enabled.
    - *When NOT to invoke:* When running without Next.js PPR support or when PPR is not enabled.
    - *Combinations:* Pairs with `next-partial-prefetching-optimizer`.
16. **`next-partial-prefetching-optimizer`**
    - *Responsibility:* Fine-tunes viewport, intent, and default prefetching behaviors under Partial Prefetching (applicable only when PPR is explicitly enabled and supported).
    - *When to invoke:* Tuning navigation links and transition performance where PPR is enabled.
    - *When NOT to invoke:* Backend API route development, or when PPR is not enabled or supported.
    - *Combinations:* Pairs with `next-partial-prefetching-adoption`.
17. **`web-design-guidelines`**
    - *Responsibility:* Audits UI code against Web Interface Guidelines (interaction states, touch targets, accessibility).
    - *When to invoke:* Reviewing implemented components and pages.
    - *When NOT to invoke:* Establishing the core visual identity (Taste owns visual design).
    - *Combinations:* Pairs with `design-taste-frontend` and `a11y-debugging`.

### Group D: Animation & Interaction (9 skills)
18. **`animate`**
    - *Responsibility:* Plans and structures animation choreography, transitions, and spatial metaphors.
    - *When to invoke:* Designing new interactive UI transitions.
    - *When NOT to invoke:* Static data rendering or layout positioning.
    - *Combinations:* Pairs with `review-animations` and `gsap-react`.
19. **`review-animations`**
    - *Responsibility:* Audits animation craft, timing curves, frame stability, and `prefers-reduced-motion` compliance.
    - *When to invoke:* After implementing motion or transitions.
    - *When NOT to invoke:* Non-animated static views.
    - *Combinations:* Pairs with `gsap-performance` and `animate`.
20. **`gsap-core`**
    - *Responsibility:* Guidance on core GSAP methods (`to`, `from`, `fromTo`, timelines, easing).
    - *When to invoke:* If and when the GSAP runtime is approved and complex timelines are required.
    - *When NOT to invoke:* Routine CSS transitions or when GSAP runtime is not installed.
    - *Combinations:* Pairs with `gsap-react` and `gsap-timeline`.
21. **`gsap-performance`**
    - *Responsibility:* Optimizes animation performance (transform-only, will-change, avoiding layout thrashing).
    - *When to invoke:* Diagnosing dropped frames or jank in animations.
    - *When NOT to invoke:* Static layouts without motion.
    - *Combinations:* Pairs with `review-animations` and `debug-optimize-lcp`.
22. **`gsap-plugins`**
    - *Responsibility:* Registration and usage of specialized GSAP plugins (ScrollTo, Flip, Observer).
    - *When to invoke:* Advanced choreographed view transitions.
    - *When NOT to invoke:* Simple CSS keyframes or hover states.
    - *Combinations:* Pairs with `gsap-core`.
23. **`gsap-react`**
    - *Responsibility:* React integration for GSAP (`useGSAP` hook, scoping, cleanup).
    - *When to invoke:* Integrating GSAP within React component lifecycles.
    - *When NOT to invoke:* Server Components or non-React code.
    - *Combinations:* Pairs with `vercel-react-best-practices`.
24. **`gsap-scrolltrigger`**
    - *Responsibility:* Scroll-linked animations, pinning, and scrub coordination.
    - *When to invoke:* Designing complex scroll-driven environmental stories.
    - *When NOT to invoke:* Standard document scrolling.
    - *Combinations:* Pairs with `lenis` runtime and `gsap-performance`.
25. **`gsap-timeline`**
    - *Responsibility:* Sequences multi-element animations and coordinated playback.
    - *When to invoke:* Chained hero entrances or multi-stage data reveals.
    - *When NOT to invoke:* Single isolated button clicks.
    - *Combinations:* Pairs with `gsap-core` and `animate`.
26. **`gsap-utils`**
    - *Responsibility:* Mathematical utilities for animation (clamp, mapRange, snap, wrap).
    - *When to invoke:* Mapping sensor data values to visual animation parameters.
    - *When NOT to invoke:* Standard business logic calculations.
    - *Combinations:* Pairs with `gsap-core`.

### Group E: Testing & Quality (1 primary + cross-functional skills)
27. **`tdd`**
    - *Responsibility:* Test-driven development (red-green-refactor) for mathematical calculations and domain logic.
    - *When to invoke:* Implementing AQI conversions, data parsers, and recommendation rules.
    - *When NOT to invoke:* Visual layout exploration or CSS token definition.
    - *Combinations:* Pairs with `domain-modeling` and `implement`.

### Group F: Security & Auditing (9 skills)
28. **`security-audit`**
    - *Responsibility:* Comprehensive security reviews, threat modeling, and vulnerability assessments.
    - *When to invoke:* Pre-phase gates, endpoint completions, and data pipeline milestones.
    - *When NOT to invoke:* Cosmetic styling tasks.
    - *Combinations:* Pairs with `sharp-edges` and `audit-context-building`.
29. **`audit-context-building`**
    - *Responsibility:* Maps architecture assumptions, trust boundaries, and data flow before vulnerability audits.
    - *When to invoke:* Prior to conducting security reviews on unfamiliar or external integration code.
    - *When NOT to invoke:* Routine unit testing.
    - *Combinations:* Pairs with `security-audit`.
30. **`codeql`**
    - *Responsibility:* Static analysis queries for dangerous data flows and security vulnerabilities.
    - *When to invoke:* Deep security audits when CodeQL CLI is configured and executed.
    - *When NOT to invoke:* Quick frontend styling checks or when CodeQL is not configured.
    - *Combinations:* Pairs with `semgrep` and `security-audit`.
31. **`differential-review`**
    - *Responsibility:* Security-focused diff review between branches or commits.
    - *When to invoke:* Reviewing pull requests and phase diffs before merge.
    - *When NOT to invoke:* Single-file initial drafting.
    - *Combinations:* Pairs with `code-review`.
32. **`fp-check`**
    - *Responsibility:* Verifies suspected security findings to systematically eliminate false positives.
    - *When to invoke:* Triaging static analysis alerts.
    - *When NOT to invoke:* General application feature development.
    - *Combinations:* Pairs with `semgrep` and `codeql`.
33. **`semgrep`**
    - *Responsibility:* Fast pattern-based static security scanning.
    - *When to invoke:* Pre-commit audits and route handler verification when Semgrep is configured and executed.
    - *When NOT to invoke:* Reviewing visual layout aesthetics.
    - *Combinations:* Pairs with `sharp-edges` and `security-audit`.
34. **`sharp-edges`**
    - *Responsibility:* Identifies error-prone APIs, dangerous configurations, and security footguns.
    - *When to invoke:* Designing internal API interfaces or client storage structures.
    - *When NOT to invoke:* Plain HTML markup tasks.
    - *Combinations:* Pairs with `security-audit` and `codebase-design`.
35. **`supply-chain-risk-auditor`**
    - *Responsibility:* Audits dependencies, lockfiles, and transitive packages for supply-chain risks.
    - *When to invoke:* Evaluating or installing new npm packages.
    - *When NOT to invoke:* Normal coding with already-audited dependencies.
    - *Combinations:* Pairs with `security-audit`.
36. **`variant-analysis`**
    - *Responsibility:* Hunts for codebase-wide variants of an identified defect or vulnerability.
    - *When to invoke:* After fixing a security bug to ensure no duplicates exist.
    - *When NOT to invoke:* Routine feature scaffolding.
    - *Combinations:* Pairs with `diagnosing-bugs`.

### Group G: Browser, Accessibility & Debugging (8 skills)

#### Chrome DevTools MCP Verification Protocol
Chrome DevTools MCP is the primary browser verification and runtime debugging engine for AirAware **for tasks involving a running application, rendered UI, browser interactions, network behavior, runtime errors, or browser performance**. It bridges automated code generation with real browser execution, ensuring that implementations work in a live environment rather than merely compiling. **It is NOT required for backend-only work, documentation changes, or offline unit tests where browser inspection adds no value.**

1. **Core Verification Domains:**
   - *Live Navigation & Interaction:* Navigate to local routes (`navigate_page`), manage page lifecycles, and simulate real user journeys (`click`, `fill`, `hover`, `press_key`).
   - *Rendered UI & Accessibility Inspection:* Extract accessibility-tree snapshots (`take_snapshot`) to inspect accessible nodes, roles, and names using element `uid`s. Note: `take_snapshot` provides an accessibility-tree snapshot, not a complete live DOM hierarchy inspection; inspecting the live DOM hierarchy is a separate task using an appropriate documented tool.
   - *Console Diagnostics:* Monitor runtime errors, unhandled exceptions, and React hydration warnings (`list_console_messages`, `get_console_message`).
   - *Network & API Inspection:* Monitor HTTP status codes, request/response headers, latency, caching behavior, and failed API calls (`list_network_requests`, `get_network_request`).
   - *Visual & Responsive Auditing:* Capture full-page or element screenshots (`take_screenshot`) and test responsive viewports across mobile, tablet, and desktop dimensions (`resize_page`).
   - *Runtime & Hydration Debugging:* Inspect computed CSS styles and cascade variables (`get_css_styles`), evaluate runtime JS state (`evaluate_script`), and set non-invasive source logpoints (`set_logpoints`).
   - *Performance Tracing & Insights:* Record DevTools performance traces (`performance_start_trace`, `performance_stop_trace`) and analyze Core Web Vitals insights (`performance_analyze_insight`).
   - *Accessibility-Tree Inspection:* Extract live browser accessibility snapshots (`take_snapshot`) to evaluate ARIA roles, accessible names, computed labels, and tree hierarchy. Crucial distinction: accessibility-tree snapshots do not verify focus order or contrast compliance on their own; separate checks are required for manual keyboard navigation walks, contrast-ratio verification, and live screen-reader testing.
   - *Browser Automation & Regression Verification:* Automate multi-step user workflows to verify that bug fixes and new features do not introduce regressions.

2. **Tool Schema & Parameter Discipline:**
   - Always use the **actual available MCP tools** and their **current documented parameters** as defined in the server schemas (`list_pages`, `new_page`, `navigate_page`, `take_snapshot`, `click`, `fill`, `type_text`, `press_key`, `take_screenshot`, `resize_page`, `list_console_messages`, `get_console_message`, `list_network_requests`, `get_network_request`, `get_css_styles`, `evaluate_script`, `performance_start_trace`, `performance_stop_trace`, `performance_analyze_insight`).
   - **Never invent tool names or assume undocumented parameters.** Refer to the cached tool schemas in `C:\Users\rahul\.gemini\antigravity\mcp\chrome-devtools/` when verifying tool signatures.

3. **Server & Skill Version Synchronization:**
   - The installed MCP server (`chrome-devtools-mcp@1.13.0`), the global CLI (`chrome-devtools@1.13.0`), and the 8 browser skills in `.agents/skills/` must remain compatible.
   - Skill instructions can become outdated when the server version changes. Periodically check whether newer releases exist (`npm view chrome-devtools-mcp dist-tags`).
   - If an update is available, report the update and technical changelog to the Product Owner. **Do NOT update the server, CLI, or skills without explicit Product Owner approval.**

4. **Privacy & Security Precautions:**
   - Never expose unnecessary personal data, private user locations, session tokens, authentication cookies, or sensitive browser content in tool calls, logs, or reports.
   - Avoid navigating to unapproved external URLs or inspecting sensitive personal tabs during browser automation.

---

37. **`chrome-devtools`**
    - *Responsibility:* Primary driver for live browser automation, DOM inspection, network/console monitoring, and runtime checks via Chrome DevTools MCP following the task-dependent protocol above.
    - *When to invoke:* Tasks involving a running application, rendered UI, browser interactions, network behavior, runtime errors, or browser performance (e.g. verifying rendered pages, checking console logs, capturing live screenshots, testing user interactions, and performing runtime smoke tests).
    - *When NOT to invoke:* Backend-only work, documentation changes, static TypeScript editing, or offline unit tests where browser inspection adds no value.
    - *Combinations:* Pairs with `a11y-debugging` for accessibility audits and `next-dev-loop` for development verification.
38. **`chrome-devtools-cli`**
    - *Responsibility:* Executes browser automation scripts directly via the terminal CLI.
    - *When to invoke:* Automated headless browser validation scripts.
    - *When NOT to invoke:* Interactive DevTools UI inspection.
    - *Combinations:* Pairs with `chrome-devtools`.
39. **`a11y-debugging`**
    - *Responsibility:* Leverages Chrome DevTools MCP to inspect accessibility trees, evaluate ARIA roles/labels, test focus states, and inspect color contrast directly in the live browser. Accessibility-tree inspection, keyboard/focus testing, and color-contrast checks are separate verification activities; an accessibility snapshot alone does not verify keyboard behavior or contrast. (Note: this is an interactive browser inspection tool, not an automated build-time linter).
    - *When to invoke:* During UI verification and pre-phase accessibility audits in the browser.
    - *When NOT to invoke:* Pure backend calculation tasks or static code editing before running the app.
    - *Combinations:* Pairs with `chrome-devtools` and `web-design-guidelines`.
40. **`cookie-debugging`**
    - *Responsibility:* Inspects and debugs browser cookies, storage, and HTTP headers.
    - *When to invoke:* Testing local storage persistence or header security.
    - *When NOT to invoke:* Plain UI styling.
    - *Combinations:* Pairs with `chrome-devtools`.
41. **`debug-optimize-lcp`**
    - *Responsibility:* Diagnoses and optimizes Largest Contentful Paint (LCP) and Core Web Vitals.
    - *When to invoke:* Auditing page load performance and image rendering.
    - *When NOT to invoke:* Backend API calculation tasks.
    - *Combinations:* Pairs with `next-bundle-optimizer` and `chrome-devtools`.
42. **`inspect-in-devtools`**
    - *Responsibility:* Connects to the DevTools UI for interactive element selection and inspection.
    - *When to invoke:* Live UI debugging alongside the user.
    - *When NOT to invoke:* Automated test runs.
    - *Combinations:* Pairs with `chrome-devtools`.
43. **`memory-leak-debugging`**
    - *Responsibility:* Inspects heap snapshots, detached DOM nodes, and memory retention paths.
    - *When to invoke:* Long-running client sessions or chart/globe memory analysis.
    - *When NOT to invoke:* Simple stateless component updates.
    - *Combinations:* Pairs with `chrome-devtools`.
44. **`troubleshooting`**
    - *Responsibility:* Triages and resolves connection and MCP server communication errors.
    - *When to invoke:* When Chrome DevTools MCP tools fail to respond.
    - *When NOT to invoke:* Normal application feature coding.
    - *Combinations:* Pairs with `chrome-devtools`.

---

## 6. Taste-Led Visual Design Approval Workflow

Before implementing major frontend features or altering visual styles, follow this mandatory 6-step workflow:

1. **Step 1 — Research & Identity:** Invoke `design-taste-frontend`. Ground design choices in AirAware's identity: *Premium Environmental Intelligence*.
2. **Step 2 — Interactive User Interview (ONE QUESTION AT A TIME):**
   - Ask the Product Owner questions **one at a time**.
   - Wait for the user's response before presenting the next question. Never output an entire questionnaire at once.
   - Inquire about visual mood, theme direction (light/dark/adaptive), typography pairing, layout density, micro-interactions, animation intensity, scroll behavior, globe visualization style, and mobile layout.
   - *Aesthetic Directive:* Preserve the Product Owner's preference for **light, soft, and sophisticated** tones, permitting dark accents where appropriate. Do NOT force a dark-first theme, impose fixed color percentages, or hardcode a predetermined palette before the interview.
3. **Step 3 — Design Proposal:** Present the proposed visual direction, tokens, and rationale. Wait for explicit approval.
4. **Step 4 — Centralized Design Tokens:** Create tokens in `src/tokens/` for colors, typography, spacing, radii, elevation, and component states.
5. **Step 5 — Implementation:** Use Astryx components and custom components strictly mapped to approved tokens.
6. **Step 6 — Review:** Verify against `web-design-guidelines`, `a11y-debugging`, and Chrome DevTools MCP.

---

## 7. Astryx UI Library & Verified Styling Architecture

- **Role:** Astryx (`@astryxdesign/core`) is an application component library, **NOT** a visual design authority. Astryx components must conform to Taste-approved design tokens; Astryx defaults must never dictate the application's visual identity.
- **Preservation of Verified CSS Baseline:** Preserve the complete verified integration in `src/app/globals.css` and `src/tokens/tokens.css` as the current baseline:
  1. **Canonical CSS Layer Declaration:** `@layer reset, theme, base, astryx-base, astryx-theme, components, utilities;` in `globals.css` ensuring correct cascade precedence.
  2. **Granular Tailwind Imports:** `@import "tailwindcss/theme.css" layer(theme);`, `@import "tailwindcss/preflight.css" layer(base);`, and `@import "tailwindcss/utilities.css" layer(utilities);`.
  3. **Astryx Component Imports:** `@import "@astryxdesign/core/reset.css";`, `@import "@astryxdesign/core/astryx.css";`, and `@import "@astryxdesign/core/tailwind-theme.css";`.
  4. **Astryx Token Bridge:** The 19 provisional token bridge mappings in `src/tokens/tokens.css` (`--color-accent`, `--color-accent-muted`, `--color-on-accent`, `--color-background-surface`, `--color-background-body`, `--color-border`, `--color-border-emphasized`, `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`, `--radius-inner`, `--radius-element`, `--radius-container`, `--color-success`, `--color-success-muted`, `--color-warning`, `--color-warning-muted`, `--color-error`, `--color-error-muted`).
  5. **Tailwind Theme Bridge:** The Tailwind v4 `@theme` block bridging surface, ink, brand, and AQI tokens to utility classes.
- **Controlled Evolution Policy:** Future changes to this styling baseline are permitted only when a genuine technical issue or necessary architectural improvement is identified. Before modifying the baseline, you must document the technical rationale, obtain explicit Product Owner approval, and run full regression checks (build, runtime, and styling inspection).
- **StyleX Exclusion:** StyleX is strictly an internal implementation dependency of Astryx. Do **NOT** write custom StyleX code (`stylex.create`, etc.) for custom application styling. Use Tailwind CSS 4 utility classes and centralized design token variables.

---

## 8. Package Runtime vs. Skill Boundaries (GSAP & Lenis)

- **GSAP:** GSAP skills are installed in `.agents/skills/`, but the `gsap` npm runtime package is **NOT** installed in `package.json`. Do NOT import or call `gsap` in application code without explicit Product Owner approval and formal package installation.
- **Lenis:** `lenis@^1.3.27` is installed in `package.json`, but its integration into application scrolling is scheduled for **Phase 3**. Do NOT integrate Lenis ahead of schedule.
- Always use native CSS transitions and animations where sufficient.

---

## 9. Six PromptWars Evaluation Parameters & Measurable Targets

Every development phase must produce auditable evidence against all six criteria. Performance thresholds are **measurable engineering targets evaluated under documented test conditions, not unconditional guarantees**:

1. **Code Quality (HIGH IMPACT):** Layered modular architecture, strict TypeScript (`tsc --noEmit` clean), separation of concerns, zero circular dependencies, reusable components.
2. **Security (MEDIUM IMPACT):** Zero client-side API secrets, server-side Route Handlers for external APIs, Zod validation on all external inputs, safe HTML rendering, local-first private storage, supply-chain checks.
3. **Efficiency (MEDIUM IMPACT):** Measurable engineering targets: FCP < 1.5s, LCP < 2.5s, 60 FPS animations, Lighthouse >= 90 (under documented test conditions including device class, network profile e.g. Simulated Fast 4G, and viewport). Stale-while-revalidate API caching, minimal bundle sizes, zero redundant fetches.
4. **Testing (LOW IMPACT):** Automated test foundation established before Phase 2. Unit, integration, component, and regression coverage for mathematical conversions and domain logic.
5. **Accessibility (LOW IMPACT):** Target WCAG 2.2 AA verified through documented, multi-layered checks: semantic HTML structure, manual keyboard navigation walks, visible focus rings, non-color-reliant status text, and Chrome DevTools accessibility-tree snapshots. Automated scores do not establish compliance, and DevTools accessibility snapshots must not be conflated with live screen-reader testing.
6. **Problem Statement Alignment (HIGH IMPACT):** Strict fidelity to Challenge 06: location-aware AQI, personalized daily planner, indoor air hacks, cleaner transport choices, transparent CO2e calculations, grounded AI Copilot. Real environmental utility over decorative fluff.

---

## 10. Automated Testing Foundation & Phase 2 Prerequisite

- **Mandatory Prerequisite:** Before Phase 2 begins, the automated testing foundation must be evaluated, configured, verified, and approved.
- **Evaluation Requirement:** Do not assume a testing framework is installed. Evaluate and propose the testing stack (e.g., Vitest, component testing tools) compatible with Next.js 16, React 19, and TypeScript (declared: `^5.7.3`, installed: `5.9.3`), and obtain Product Owner approval before installation.
- **Test Architecture:**
  - *Unit Tests:* AQI conversions (US EPA, EAQI), pollutant unit conversions, data freshness checks, CO2e calculations, recommendation rules.
  - *Integration Tests:* API adapter parsing, error handling, deterministic fallbacks, local storage validation.
  - *Component Tests:* Form validation, navigation, modal/dialog states, accessible interactive elements.
  - *Regression Tests:* Dedicated tests written alongside every non-trivial bug fix.
- **Testing Rules:**
  - Write tests alongside implementation.
  - Never report a test as passing without running it and capturing terminal output.
  - Use clearly labeled, deterministic test fixtures—never fabricate fake data as "real".
  - Test mathematical formulas against documented reference values.

---

## 11. Security, Privacy & Data Integrity

- **Strict ₹0 Budget:** Absolutely no paid services, paid APIs, paid fallbacks, or subscriptions. All external data ingestion must rely exclusively on free, open public science APIs (e.g. Open-Meteo, OpenAQ free tier) or zero-cost serverless execution.
- **Client-Side Storage & Data Privacy:**
  - No mandatory user authentication or accounts are required. User location choices, lifestyle preferences, and habit logs are stored client-side in `localStorage` to avoid server-side user data persistence.
  - *Storage Security Reality:* `localStorage` is accessible to any script executing in the same origin and is NOT an encrypted or tamper-proof vault.
  - *Data Minimization & Hygiene:* Never store unnecessary personal or intrusive medical data. Validate all read and write operations against strict Zod schemas.
- **AI Privacy Filtering:** Send only the minimum relevant household, lifestyle, or location context necessary for the specific AI request. Exclude direct identifiers and unnecessary sensitive information. Never transmit the complete user profile by default. If personalization context is unnecessary, do not send it.
- **Input Validation & Safe Rendering:** Validate localStorage data against appropriate Zod schemas when reading and writing. Treat stored values as untrusted input. Use context-appropriate output encoding and safe React rendering. Never assume Zod validation alone prevents XSS.
- **Data Integrity:** Never fabricate API data, environmental readings, AI responses, or test results. Missing, stale, or unavailable data must be honestly labeled in the UI with appropriate fallbacks.

---

## 12. Accessibility as a Testable Target

- Treat **WCAG 2.2 AA as a target to test against**, NOT an unsupported guarantee or marketing claim.
- An automated accessibility score (such as Lighthouse) does NOT alone establish WCAG 2.2 AA conformance.
- Verification must distinguish between separate accessibility testing layers:
  1. **Automated Accessibility Checks:** Static linters or automated scanning tools (e.g. axe-core) — report only when actually installed, configured, and executed with retained terminal output.
  2. **Chrome DevTools Accessibility-Tree Inspection:** Inspecting the live browser accessibility tree (roles, accessible names, expanded states) via DevTools MCP (`take_snapshot`). *Crucial distinction:* capturing an accessibility-tree snapshot verifies browser DOM mapping, but does not verify focus order or contrast compliance on its own, and must NEVER be claimed as live screen-reader testing.
  3. **Manual Keyboard Navigation Testing:** Verifying that every interactive component is fully reachable, operable, and escapable using only the keyboard (`Tab`, `Shift+Tab`, `Enter`, `Space`, `Escape`), with clearly visible focus rings and no keyboard traps.
  4. **Live Screen-Reader Testing:** Evaluating with actual assistive software (e.g. NVDA, VoiceOver, JAWS). Never report or claim screen-reader verification unless testing was actually performed with a live screen reader.
  5. **Non-Color Reliance & Contrast:** Verifying text and UI component contrast ratios against their actual background colors and ensuring that every status color is paired with explicit text labels so information is never conveyed by color alone.

---

## 13. Git & Change Approval Governance

- **NEVER stage (`git add`) or commit (`git commit`) files without the user's explicit prior approval.**
- Do not install new dependencies, expand scope, or modify architectural boundaries without explicit approval.
- Always run `git status --porcelain` before completing a task.
- Accurately categorize files into:
  1. Files created during the task.
  2. Files modified during the task.
  3. Pre-existing untracked files.
- Never describe a repository as "clean" if any untracked or modified files exist.

---

## 14. Proportional Completion Reporting Standard

Adapt report detail proportionally to the task scope. Tools (such as ESLint, test runners, security scanners, or Lighthouse) must **only be reported as executed when they are actually installed, configured, and run with real output**:

### A. Major Phase Milestone Reports (Comprehensive Audit Format)
For completed roadmap phases, provide comprehensive evidence covering:
1. Objective & Scope
2. What Was Implemented
3. Files Created
4. Files Modified
5. Dependencies Added & Rationale
6. Skills Invoked & Responsibilities
7. Automated Tests Executed & Terminal Output (only when test runner is configured and run)
8. TypeScript Results (`tsc --noEmit`)
9. ESLint Results (only when linter is configured and run)
10. Production Build Results (`next build`)
11. Browser Runtime Verification (Chrome DevTools MCP): Console messages, network requests, screenshots, or performance traces for tasks involving rendered UI or browser interactions (noted as not applicable for backend-only or documentation tasks).
12. Accessibility Verification: DevTools accessibility-tree snapshot, manual keyboard navigation walk results, contrast verification, and results of any configured automated accessibility scans. (Accessibility-tree snapshots must not be conflated with focus order verification, contrast compliance, or live screen-reader testing).
13. Security Findings (Secret isolation, input validation, and scanner output where run)
14. Performance Findings (Measured FCP, LCP, bundle size under documented test conditions)
15. Impact on the Six Evaluation Parameters
16. Known Limitations
17. Remaining Roadmap Work
18. Accurate Git Status (`git status --porcelain`)
19. Explicit Request for Phase Approval

### B. Incremental Task Reports (Concise Format)
For individual bug fixes, minor refactors, or discrete configuration steps:
- Summary of changes made.
- Files created/modified.
- Exact verification commands executed and actual terminal outputs (`tsc`, tests, dev server).
- Accurate `git status` report.
- Next recommended step awaiting approval.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
