import React from 'react';
import { AirQualityDashboard } from '@/components/dashboard/AirQualityDashboard';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface-ground)] text-[var(--ink-primary)]">
      {/* Top Application Shell Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border-subtle)] bg-[var(--surface-card)]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-hover)] text-white font-black text-lg shadow-xs"
              aria-hidden="true"
            >
              A
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-[var(--ink-primary)] font-sans">
                  AirAware
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-surface)] px-2 py-0.5 text-[10px] font-mono font-bold text-[var(--brand-primary)] border border-[var(--border-subtle)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-primary)] animate-pulse" />
                  Live
                </span>
              </div>
              <span className="text-[11px] font-medium text-[var(--ink-muted)]">
                Global Environmental Intelligence
              </span>
            </div>
          </div>

          {/* Quick Context Pill */}
          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-2 text-xs font-mono text-[var(--ink-secondary)] bg-[var(--surface-subtle)] px-3 py-1 rounded-lg border border-[var(--border-subtle)]">
              <span>Scientific Data</span>
              <span className="text-[var(--ink-muted)]">•</span>
              <span className="text-[var(--brand-primary)] font-bold">Open Public Science</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <AirQualityDashboard />
      </main>

      {/* Application Footer */}
      <footer className="mt-auto border-t border-[var(--border-subtle)] bg-[var(--surface-card)] py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-xs text-[var(--ink-muted)]">
            AirAware Global Environmental Intelligence • PromptWars Challenge 06
          </p>
          <p className="text-xs text-[var(--ink-muted)]">
            Strict ₹0 Budget Architecture • Powered by Open-Meteo &amp; Copernicus CAMS
          </p>
        </div>
      </footer>
    </div>
  );
}
