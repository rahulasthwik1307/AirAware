import React from 'react';
import { AirQualityDashboard } from '@/components/dashboard/AirQualityDashboard';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Top Application Shell Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[var(--border-subtle)] bg-[var(--surface-card)]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-white font-black text-lg shadow-sm"
              aria-hidden="true"
            >
              A
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-[var(--ink-primary)]">
                AirAware
              </span>
              <span className="ml-2 hidden sm:inline-block text-xs font-semibold text-[var(--ink-muted)]">
                Global Air Intelligence
              </span>
            </div>
          </div>

          <nav aria-label="Application shell navigation" className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-surface)] px-3 py-1 text-xs font-bold text-[var(--brand-primary)] border border-[var(--border-subtle)]">
              <span className="h-2 w-2 rounded-full bg-[var(--brand-primary)] animate-pulse" />
              Phase 2 Live
            </span>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <AirQualityDashboard />
      </main>

      {/* Application Footer */}
      <footer className="mt-auto border-t border-[var(--border-subtle)] bg-[var(--surface-card)] py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-xs text-[var(--ink-muted)]">
            AirAware Global Environmental Intelligence • Open Public Science
          </p>
          <p className="text-xs text-[var(--ink-muted)]">
            Strict ₹0 Budget Architecture • Powered by Open-Meteo & CAMS
          </p>
        </div>
      </footer>
    </div>
  );
}
