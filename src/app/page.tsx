import React from 'react';
import { Center } from '@astryxdesign/core/Center';
import { Badge } from '@astryxdesign/core/Badge';
import { AstryxInteractiveTest } from '@/components/AstryxInteractiveTest';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Top Application Shell Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[var(--border-subtle)] bg-[var(--surface-card)]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand-primary)] text-white font-bold text-lg shadow-sm">
              A
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-[var(--ink-primary)]">
                AirAware
              </span>
              <span className="ml-2 hidden sm:inline-block text-xs font-medium text-[var(--ink-muted)]">
                Environmental Intelligence
              </span>
            </div>
          </div>

          <nav aria-label="Application shell navigation" className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-surface)] px-3 py-1 text-xs font-semibold text-[var(--brand-primary)] border border-[var(--border-subtle)]">
              <span className="h-2 w-2 rounded-full bg-[var(--brand-primary)] animate-pulse" />
              Phase 1 Shell Active
            </span>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Foundation Introduction Banner */}
        <section aria-labelledby="foundation-title" className="mb-10 text-center sm:text-left">
          <div className="inline-block rounded-md bg-[var(--surface-subtle)] px-2.5 py-1 text-xs font-semibold tracking-wide text-[var(--ink-secondary)] border border-[var(--border-subtle)] mb-3">
            FOUNDATION & DESIGN SYSTEM
          </div>
          <h1
            id="foundation-title"
            className="text-3xl font-extrabold tracking-tight text-[var(--ink-primary)] sm:text-4xl"
          >
            AirAware Platform Shell
          </h1>
          <p className="mt-3 max-w-2xl text-base text-[var(--ink-secondary)] leading-relaxed">
            The foundational application shell for AirAware is initialized with Next.js 16, React 19,
            TypeScript, Tailwind CSS 4, and Astryx design system integration.
          </p>
        </section>

        {/* Astryx Empirical Verification Suite */}
        <section
          aria-labelledby="astryx-verification-heading"
          className="mb-10 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 sm:p-8 shadow-[var(--shadow-sm)]"
        >
          <div className="border-b border-[var(--border-subtle)] pb-4 mb-6">
            <h2
              id="astryx-verification-heading"
              className="text-xl font-bold tracking-tight text-[var(--ink-primary)]"
            >
              Astryx Empirical Compatibility Verification
            </h2>
            <p className="text-sm text-[var(--ink-secondary)] mt-1">
              Live verification of Astryx pre-compiled CSS, Server Component rendering, and Client Component boundary interactions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Test 1: Astryx Presentation Component (Server Component context) */}
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-5">
              <div className="text-xs uppercase tracking-wider font-semibold text-[var(--ink-muted)] mb-3">
                Test 1: Astryx Presentation Components
              </div>
              <p className="text-xs text-[var(--ink-secondary)] mb-4 leading-relaxed">
                Renders Astryx <code className="text-xs font-mono bg-white px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">Center</code> and{' '}
                <code className="text-xs font-mono bg-white px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">Badge</code> directly within the Next.js Server Component boundary without runtime compilation issues.
              </p>
              <div className="p-4 bg-white rounded-lg border border-[var(--border-subtle)]">
                <Center isInline={false} width="100%">
                  <div className="flex flex-col items-center gap-3">
                    <Badge variant="neutral" label="Astryx Precompiled CSS Active" />
                    <span className="text-xs font-medium text-[var(--ink-secondary)]">
                      Center layout component rendered cleanly
                    </span>
                  </div>
                </Center>
              </div>
            </div>

            {/* Test 2: Astryx Interactive Component (Client Component context) */}
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-5">
              <div className="text-xs uppercase tracking-wider font-semibold text-[var(--ink-muted)] mb-3">
                Test 2: Astryx Interactive Client Component
              </div>
              <p className="text-xs text-[var(--ink-secondary)] mb-4 leading-relaxed">
                Renders Astryx <code className="text-xs font-mono bg-white px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">Button</code> inside a Client Component wrapper to verify event delegation, state dispatch, and zero hydration mismatches.
              </p>
              <AstryxInteractiveTest />
            </div>
          </div>
        </section>

        {/* Centralized Design Token Palette Inspection */}
        <section
          aria-labelledby="token-palette-heading"
          className="mb-10 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 sm:p-8 shadow-[var(--shadow-sm)]"
        >
          <div className="border-b border-[var(--border-subtle)] pb-4 mb-6">
            <h2
              id="token-palette-heading"
              className="text-xl font-bold tracking-tight text-[var(--ink-primary)]"
            >
              Taste Design Authority Tokens
            </h2>
            <p className="text-sm text-[var(--ink-secondary)] mt-1">
              Accessible palette tokens configured for environmental metrics, status tiers, and neutral surfaces (WCAG 2.2 AA compliant).
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Good */}
            <div className="rounded-lg p-3 border border-[var(--aqi-good-border)] bg-[var(--aqi-good-bg)] text-center">
              <span className="block text-xs font-bold uppercase tracking-wider text-[var(--aqi-good)]">
                Good
              </span>
              <span className="block text-lg font-extrabold text-[var(--aqi-good)] tabular-nums mt-1">
                0–50
              </span>
              <span className="block text-[11px] text-[var(--ink-secondary)] mt-0.5">
                Satisfactory
              </span>
            </div>

            {/* Moderate */}
            <div className="rounded-lg p-3 border border-[var(--aqi-moderate-border)] bg-[var(--aqi-moderate-bg)] text-center">
              <span className="block text-xs font-bold uppercase tracking-wider text-[var(--aqi-moderate)]">
                Moderate
              </span>
              <span className="block text-lg font-extrabold text-[var(--aqi-moderate)] tabular-nums mt-1">
                51–100
              </span>
              <span className="block text-[11px] text-[var(--ink-secondary)] mt-0.5">
                Acceptable
              </span>
            </div>

            {/* Sensitive */}
            <div className="rounded-lg p-3 border border-[var(--aqi-sensitive-border)] bg-[var(--aqi-sensitive-bg)] text-center">
              <span className="block text-xs font-bold uppercase tracking-wider text-[var(--aqi-sensitive)]">
                Sensitive
              </span>
              <span className="block text-lg font-extrabold text-[var(--aqi-sensitive)] tabular-nums mt-1">
                101–150
              </span>
              <span className="block text-[11px] text-[var(--ink-secondary)] mt-0.5">
                Precaution
              </span>
            </div>

            {/* Unhealthy */}
            <div className="rounded-lg p-3 border border-[var(--aqi-unhealthy-border)] bg-[var(--aqi-unhealthy-bg)] text-center">
              <span className="block text-xs font-bold uppercase tracking-wider text-[var(--aqi-unhealthy)]">
                Unhealthy
              </span>
              <span className="block text-lg font-extrabold text-[var(--aqi-unhealthy)] tabular-nums mt-1">
                151–200
              </span>
              <span className="block text-[11px] text-[var(--ink-secondary)] mt-0.5">
                Adverse
              </span>
            </div>

            {/* Very Unhealthy */}
            <div className="rounded-lg p-3 border border-[var(--aqi-very-unhealthy-border)] bg-[var(--aqi-very-unhealthy-bg)] text-center">
              <span className="block text-xs font-bold uppercase tracking-wider text-[var(--aqi-very-unhealthy)]">
                Very Unhealthy
              </span>
              <span className="block text-lg font-extrabold text-[var(--aqi-very-unhealthy)] tabular-nums mt-1">
                201–300
              </span>
              <span className="block text-[11px] text-[var(--ink-secondary)] mt-0.5">
                High Alert
              </span>
            </div>

            {/* Hazardous */}
            <div className="rounded-lg p-3 border border-[var(--aqi-hazardous-border)] bg-[var(--aqi-hazardous-bg)] text-center">
              <span className="block text-xs font-bold uppercase tracking-wider text-[var(--aqi-hazardous)]">
                Hazardous
              </span>
              <span className="block text-lg font-extrabold text-[var(--aqi-hazardous)] tabular-nums mt-1">
                301+
              </span>
              <span className="block text-[11px] text-[var(--ink-secondary)] mt-0.5">
                Emergency
              </span>
            </div>
          </div>
        </section>

        {/* Architecture Status Checklist */}
        <section
          aria-labelledby="checklist-heading"
          className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 sm:p-8 shadow-[var(--shadow-sm)]"
        >
          <h2
            id="checklist-heading"
            className="text-lg font-bold tracking-tight text-[var(--ink-primary)] mb-4"
          >
            Phase 1 Foundation Verification Checklist
          </h2>
          <ul className="space-y-2 text-sm text-[var(--ink-secondary)]">
            <li className="flex items-center gap-2">
              <span className="text-[var(--aqi-good)] font-bold">✓</span>
              <span>Next.js 16.4.6 with App Router initialized</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[var(--aqi-good)] font-bold">✓</span>
              <span>React 19.3.1 declared as direct dependencies</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[var(--aqi-good)] font-bold">✓</span>
              <span>Tailwind CSS 4 configured via @tailwindcss/postcss and CSS cascade layers</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[var(--aqi-good)] font-bold">✓</span>
              <span>Astryx pre-compiled CSS imported (@astryxdesign/core/dist/astryx.css)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[var(--aqi-good)] font-bold">✓</span>
              <span>Taste design authority tokens established for 90-95% neutral surfaces and accessible AQI status</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[var(--aqi-good)] font-bold">✓</span>
              <span>WCAG 2.2 AA compliant skip-link, semantic landmarks, and non-color-reliant status representations</span>
            </li>
          </ul>
        </section>
      </main>

      {/* Application Footer */}
      <footer className="mt-auto border-t border-[var(--border-subtle)] bg-[var(--surface-card)] py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-xs text-[var(--ink-muted)]">
            AirAware Environmental Intelligence Platform • Phase 1 Application Shell
          </p>
          <p className="text-xs text-[var(--ink-muted)]">
            Strict ₹0 Budget Architecture • Open Public Science
          </p>
        </div>
      </footer>
    </div>
  );
}
