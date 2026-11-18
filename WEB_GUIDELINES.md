# AIR AWARE — WEB DEVELOPMENT, DESIGN & QUALITY GUIDELINES

**Project:** AirAware  
**Purpose:** Central guidance for AI coding agents working on frontend design, web implementation, interactions, animations, accessibility, performance and browser quality.  
**Status:** Supplemental project guidance.  
**Applies to:** All frontend pages, components, visualizations, interactions and responsive experiences.

---

# 1. MANDATORY DOCUMENT READING ORDER

Before performing any design, frontend implementation, UI modification, animation, accessibility review or browser-quality task, read these documents in this exact order.

### First — `AIR_AWARE_MASTER_SPECIFICATION.md`

This is the highest-authority project document.

Understand:
- Product vision and challenge requirements.
- Confirmed product and technical decisions.
- Approved visual identity and design system.
- Architecture and dependency restrictions.
- ₹0 budget.
- Accessibility and performance requirements.
- Feature requirements and phased roadmap.
- Evaluation criteria.

### Second — `AGENTS.md`

Read the complete workspace-level instructions.

Understand:
- Repository-specific development rules.
- Installed skills and their responsibilities.
- Technical implementation standards.
- Testing and verification workflows.
- Security restrictions.
- Git and approval requirements.

### Third — `WEB_GUIDELINES.md`

Read this document completely.

Use it as the operational reference for coordinating frontend design, implementation, animations, accessibility, performance and interface reviews.

**Mandatory precedence:**

1. `AIR_AWARE_MASTER_SPECIFICATION.md`
2. `AGENTS.md`
3. `WEB_GUIDELINES.md`
4. Relevant installed skill instructions.
5. Official framework and browser documentation.

If a recommendation conflicts with a higher-authority document, follow the higher-authority document.

Never silently change an approved product, architecture or visual-design decision.

Do not ask the product owner to repeat decisions already documented.

---

# 2. CORE DESIGN AND IMPLEMENTATION PHILOSOPHY

AirAware must feel like a premium environmental intelligence platform, not a generic AI-generated dashboard.

Every interface should prioritize:

- Scientific credibility.
- Clear information hierarchy.
- Visually distinctive presentation.
- Excellent readability.
- Meaningful data visualization.
- Responsive layouts.
- Accessible interactions.
- Efficient implementation.
- Purposeful motion.

Do not confuse visual complexity with design quality.

A simple, well-designed data visualization is better than an elaborate but confusing dashboard.

Do not automatically turn every information group into a card.

Do not use excessive rounded corners, repetitive card layouts, generic gradients, unnecessary shadows, random decorative elements or excessive animation.

All design decisions must remain consistent with Section 6 of the Master Specification.

# 3. VISUAL DESIGN AUTHORITY

## 3.1 Taste — Primary visual design authority

Skill: `design-taste-frontend`

Taste is responsible for:

- Overall visual direction.
- Brand identity.
- Colour palette.
- Typography and font pairing.
- Theme decisions.
- Layout hierarchy.
- Spacing and visual density.
- Component appearance.
- Data visualization aesthetics.
- Surface treatments.
- Visual consistency.

### Mandatory rules

- Consult Taste when creating a new major interface or redesigning an existing feature.
- Respect the confirmed AirAware visual preferences.
- Use the centralized approved design tokens.
- Do not introduce an independent visual identity through another skill.
- Do not let component-library defaults dictate the design.
- Ask only meaningful design questions when an actual product decision is missing.

Taste has visual authority, but it does not override scientific accuracy, accessibility, security or the Master Specification.

## 3.2 Astryx — Component infrastructure

Astryx is the installed component library, not an AI design authority.

Use it where appropriate.

Rules:
- Follow Taste-approved tokens.
- Verify component APIs before use.
- Customize components when necessary.
- Do not blindly accept default component styling.
- Avoid unnecessary component duplication.
- Preserve accessibility and responsive behavior.

---

# 4. MODERN WEB IMPLEMENTATION STANDARDS

## 4.1 Modern Web Guidance

Skill: `modern-web-guidance`

Use this as the primary reference for modern browser-platform implementation.

Consult relevant guidance when working with:

- Semantic HTML.
- Modern CSS.
- JavaScript and browser APIs.
- Forms and input controls.
- Browser storage.
- Accessibility APIs.
- Responsive behavior.
- Native browser capabilities.
- Performance-sensitive browser features.
- Compatibility and progressive enhancement.

### Rules

1. Retrieve relevant guidance rather than assuming the skill's recommendations.
2. Prefer modern, standards-based browser APIs.
3. Verify browser compatibility.
4. Avoid deprecated patterns.
5. Prefer native platform functionality where suitable.
6. Avoid unnecessary JavaScript when CSS or HTML can solve the problem.
7. Do not add dependencies simply because a guide mentions them.
8. Verify version-specific React and Next.js behavior against official documentation.

Modern Web Guidance is an implementation reference, not an independent visual design authority.

## 4.2 React and Next.js engineering

Skill: `vercel-react-best-practices`

Use it for:

- Server and Client Component boundaries.
- React rendering efficiency.
- Avoiding unnecessary re-renders.
- Data-fetching patterns.
- Request waterfall prevention.
- Bundle optimization.
- Dynamic imports.
- Efficient state management.
- Next.js App Router patterns.

Always verify recommendations against the actual installed Next.js and React versions.

Do not blindly introduce experimental features or version-specific APIs.

## 4.3 Modern CSS and frontend architecture

Skills:
- `codebase-design`
- `domain-modeling`
- `modern-web-guidance`
- `next-bundle-optimizer`

Requirements:

- Separate presentation from business logic.
- Keep domain calculations outside UI components.
- Reuse centralized design tokens.
- Use semantic component boundaries.
- Avoid unnecessarily large components.
- Avoid duplicated styling and business logic.
- Prefer maintainable CSS and component architecture.
- Keep client-side JavaScript as small as practical.

---

# 5. WEB DESIGN GUIDELINES — UI QUALITY REVIEW

Skill: `web-design-guidelines`

This skill is a complementary interface-quality reviewer.

It does not replace Taste.

Use it after implementing or modifying significant UI features.

Review:

### Visual consistency
- Typography hierarchy.
- Spacing consistency.
- Alignment.
- Component consistency.
- Surface treatments.
- Visual density.
- Responsive presentation.

### Accessibility
- Semantic HTML.
- Accessible labels.
- Keyboard navigation.
- Focus visibility.
- Accessible interactive states.
- Screen-reader announcements.
- Form validation and errors.
- Accessible data tables and visualizations.

### Interaction quality
- Hover states.
- Focus states.
- Active states.
- Disabled states.
- Loading states.
- Empty states.
- Error states.
- Feedback after user actions.

### Responsive behavior
- Mobile layouts.
- Tablet layouts.
- Desktop layouts.
- Overflow.
- Touch targets.
- Horizontal scrolling.
- Content visibility.

### Review rules

1. Review actual implemented code, not just screenshots.
2. Identify specific problems.
3. Provide file and line references where possible.
4. Distinguish critical issues from optional improvements.
5. Fix genuine issues.
6. Preserve Taste-approved visual decisions.
7. Do not redesign the application independently.
8. Do not apply recommendations mechanically.
9. Do not repeat an audit unnecessarily if no relevant code changed.

---

# 6. ACCESSIBILITY AND INCLUSIVE INTERACTION

Relevant skills:

- `a11y-debugging`
- `web-design-guidelines`
- `modern-web-guidance`
- `chrome-devtools`
- `review-animations`

Target: WCAG 2.2 AA, as defined by the Master Specification.

Verify:

- Semantic landmarks and headings.
- Keyboard-only navigation.
- Visible focus indicators.
- Accessible names and labels.
- Appropriate ARIA usage.
- Form error associations.
- Accessible dialogs and menus.
- Screen-reader-friendly dynamic updates.
- Text and UI contrast.
- Reduced-motion support.
- Touch target dimensions.
- Chart and visualization alternatives.
- Responsive behavior down to 320px.

Do not add ARIA roles unnecessarily when native HTML elements already provide the required semantics.

Do not rely on color alone to communicate AQI severity.

An automated Lighthouse score does not prove WCAG compliance.

Retain evidence of actual keyboard, accessibility-tree and contrast verification.

---

# 7. ANIMATION AND INTERACTION ENGINEERING

Relevant installed skills:

- `animate`
- `review-animations`
- `gsap-core`
- `gsap-performance`
- `gsap-plugins`
- `gsap-react`
- `gsap-scrolltrigger`
- `gsap-timeline`
- `gsap-utils`

## 7.1 Motion philosophy

AirAware should use refined, purposeful animation.

Appropriate examples:

- Smooth transitions between locations.
- Subtle AQI value changes.
- Atmospheric visualization.
- Meaningful chart transitions.
- Small interaction feedback.
- Gentle globe movement.
- Carefully controlled section reveals.

Avoid:

- Constant distracting motion.
- Excessive parallax.
- Unnecessary scroll hijacking.
- Heavy animated backgrounds.
- Animations that delay access to information.
- Motion that reduces readability.

## 7.2 CSS before GSAP

Prefer native CSS transitions and animations when sufficient.

Use GSAP only when the interaction genuinely requires:

- Coordinated multi-step timelines.
- Complex scroll-driven sequences.
- Advanced animation choreography.
- Complex synchronized transitions.

## 7.3 GSAP and React rules

When GSAP is necessary:

- Use safe React integration.
- Clean up animations on unmount.
- Avoid memory leaks.
- Avoid layout thrashing.
- Prefer transform and opacity animations.
- Test on mobile and lower-powered devices.
- Respect `prefers-reduced-motion`.

Do not assume GSAP runtime packages are installed merely because GSAP skills exist.

Check the actual dependency configuration first.

Lenis is not automatically available. Verify the runtime dependency before using it.

---

# 8. BROWSER VERIFICATION AND DEBUGGING

Relevant skills:

- `chrome-devtools`
- `chrome-devtools-cli`
- `inspect-in-devtools`
- `next-dev-loop`
- `debug-optimize-lcp`
- `cookie-debugging`
- `memory-leak-debugging`
- `troubleshooting`

Use the existing Chrome DevTools MCP integration.

Do not reinstall or duplicate the existing configuration.

For significant UI changes, verify:

1. Actual browser rendering.
2. Desktop layout.
3. Mobile layout.
4. Responsive overflow.
5. Interactive controls.
6. Keyboard behavior.
7. Browser console.
8. Network requests.
9. API failures and loading states.
10. Accessibility tree.
11. Reduced-motion behavior.
12. Performance where relevant.

Recommended viewports include:

- 1440 × 900 desktop.
- 1024 × 768 tablet.
- 390 × 844 mobile.
- 320px minimum-width accessibility check.

Do not claim that something works merely because the code compiles.

Use actual browser interactions and retain meaningful evidence.

---

# 9. PERFORMANCE AND EFFICIENCY

Relevant skills:

- `vercel-react-best-practices`
- `next-bundle-optimizer`
- `debug-optimize-lcp`
- `gsap-performance`
- `memory-leak-debugging`
- `modern-web-guidance`

Requirements:

- Avoid unnecessary client-side JavaScript.
- Avoid duplicate API requests.
- Cache data appropriately.
- Lazy-load expensive visualizations.
- Optimize images and fonts.
- Avoid unnecessary state updates.
- Avoid unnecessary component re-renders.
- Avoid memory leaks.
- Use efficient chart rendering.
- Prefer CSS/SVG for lightweight graphics.
- Verify real performance using browser tools.

Do not sacrifice scientific accuracy for speed.

Report actual measurements rather than assuming performance targets have been achieved.

---

# 10. SECURITY AND ENGINEERING QUALITY

Relevant skills:

- `security-audit`
- `audit-context-building`
- `sharp-edges`
- `semgrep`
- `codeql`
- `fp-check`
- `differential-review`
- `variant-analysis`
- `supply-chain-risk-auditor`
- `code-review`
- `diagnosing-bugs`

Use these skills contextually.

Examples:

| Task | Relevant skills |
|---|---|
| New frontend feature | Taste, modern-web-guidance, implement |
| UI redesign | Taste, web-design-guidelines |
| Accessibility issue | a11y-debugging, web-design-guidelines |
| React performance issue | vercel-react-best-practices, next-bundle-optimizer |
| Animation implementation | animate, gsap-react, review-animations |
| Animation performance | gsap-performance, chrome-devtools |
| Data/domain defect | domain-modeling, diagnosing-bugs, tdd |
| Architecture review | codebase-design, code-review |
| Security review | security-audit, audit-context-building, sharp-edges |
| Dependency review | supply-chain-risk-auditor |
| Browser defect | chrome-devtools, inspect-in-devtools, troubleshooting |

Never invoke every installed skill for every task.

Select only the skills that materially contribute to the current work.

---

# 11. TESTING AND IMPLEMENTATION WORKFLOW

Relevant skills:

- `implement`
- `to-spec`
- `tdd`
- `diagnosing-bugs`
- `code-review`
- `grill-with-docs`

Follow this workflow:

1. Read the two authoritative project documents.
2. Read this guideline.
3. Inspect the actual affected files.
4. Identify the requirements and acceptance criteria.
5. Retrieve relevant skill instructions.
6. Check official documentation when necessary.
7. Implement the smallest correct change.
8. Add or update appropriate tests.
9. Run TypeScript checks.
10. Run lint.
11. Run relevant tests.
12. Run a production build when appropriate.
13. Verify the actual browser experience.
14. Perform the relevant UI and accessibility review.
15. Report changes and remaining limitations.

Do not create lengthy plans for small implementation tasks.

Do not repeat planning when decisions are already approved.

If an existing implementation is working, preserve it unless a genuine issue is identified.

---

# 12. DESIGN-SYSTEM AND COMPONENT RULES

All interface work must use the approved centralized design tokens.

Do not introduce:

- Arbitrary hex colours.
- Random font families.
- Uncontrolled spacing values.
- Uncoordinated border radii.
- Inconsistent shadows.
- One-off component styles without justification.
- Duplicate design systems.

Use the approved token architecture for:

- Colours.
- Typography.
- Spacing.
- Border radii.
- Elevation.
- Responsive breakpoints.
- Interaction states.
- AQI status colours.
- Motion.

If a specialized visualization requires a styling exception, document why it is necessary.

Astryx components must conform to the approved AirAware design system.

---

# 13. CONFLICT RESOLUTION

When skills provide different recommendations:

1. Identify the actual disagreement.
2. Check the relevant skill instructions.
3. Consult official documentation.
4. Evaluate browser compatibility and maintainability.
5. Respect the Master Specification.
6. Respect approved Taste decisions.
7. Document important trade-offs.
8. Seek product-owner approval only when an actual approved decision needs to change.

Examples:

- If Taste chooses a visual treatment and Web Design Guidelines suggests an alternative, preserve the design unless the original treatment creates a genuine usability or accessibility defect.
- If Modern Web Guidance recommends a native browser API and an older tutorial recommends a library, investigate the modern native approach first.
- If Astryx defaults conflict with approved design tokens, customize Astryx rather than changing the approved identity.
- If an animation conflicts with reduced-motion accessibility, accessibility takes priority.

Never combine contradictory recommendations blindly.

---

# 14. PROHIBITED PRACTICES

- Do not override the Master Specification.
- Do not let a secondary skill independently redesign AirAware.
- Do not use UI/UX Pro Max as the design authority.
- Do not introduce new dependencies without justification and required approval.
- Do not install additional skills without approval.
- Do not assume an installed skill means its runtime dependency is installed.
- Do not claim browser verification without actually testing.
- Do not claim WCAG compliance without evidence.
- Do not invent performance measurements.
- Do not fabricate environmental data.
- Do not remove existing functionality during visual refinement.
- Do not stage, commit, push or deploy without explicit approval.
- Do not create duplicate documentation that contradicts the Master Specification.

---

# 15. FINAL OPERATING PRINCIPLE

AirAware must be designed and implemented as one coherent product.

Every agent must:

- Read the Master Specification first.
- Read AGENTS.md second.
- Read WEB_GUIDELINES.md third.
- Respect Taste as the visual authority.
- Use Modern Web Guidance for modern implementation practices.
- Use Web Design Guidelines for interface-quality reviews.
- Select other installed skills according to the actual task.
- Use Astryx as component infrastructure.
- Verify the real browser experience.
- Preserve scientific accuracy, accessibility, performance and maintainability.

**The objective is not to use as many skills as possible. The objective is to use the right skills at the right time to produce a visually distinctive, scientifically trustworthy, accessible and high-quality AirAware application.**
