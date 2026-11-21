'use client';

import React, { useState } from 'react';
import { WorkspaceShowcaseStudio } from './WorkspaceShowcaseStudio';

interface WelcomeLandingPageProps {
  readonly onGetStarted: () => void;
  readonly onExploreDirectly: () => void;
}

export function WelcomeLandingPage({
  onGetStarted,
  onExploreDirectly,
}: WelcomeLandingPageProps) {
  const [telemetryMode, setTelemetryMode] = useState<'morning_inversion' | 'afternoon_window'>('morning_inversion');

  return (
    <div className="min-h-screen bg-[var(--surface-ground)] text-[var(--ink-primary)] selection:bg-teal-100 selection:text-teal-900">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border-subtle)] bg-[var(--surface-card)]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-hover)] text-white font-black text-lg shadow-xs select-none"
              aria-hidden="true"
            >
              A
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-[var(--ink-primary)] font-sans">
                  AirAware
                </span>
                <span className="inline-flex items-center rounded-full bg-[var(--brand-surface)] px-2 py-0.5 text-[10px] font-mono font-semibold text-[var(--brand-primary)] border border-[var(--border-subtle)]">
                  Open Science
                </span>
              </div>
              <span className="text-[11px] font-medium text-[var(--ink-muted)]">
                Global Environmental Intelligence
              </span>
            </div>
          </div>

          {/* Quick Anchor Navigation */}
          <nav aria-label="Landing page sections" className="hidden md:flex items-center gap-6 text-xs font-mono font-medium text-[var(--ink-secondary)]">
            <a href="#workspaces" className="hover:text-[var(--brand-primary)] transition-colors">
              5 Workspaces
            </a>
            <a href="#scientific-rigor" className="hover:text-[var(--brand-primary)] transition-colors">
              Open Telemetry
            </a>
            <a href="#privacy-commitment" className="hover:text-[var(--brand-primary)] transition-colors">
              Local-First
            </a>
          </nav>

          {/* Direct Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onExploreDirectly}
              className="text-xs font-mono font-semibold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Direct App Launch →
            </button>
            <button
              type="button"
              onClick={onGetStarted}
              className="inline-flex items-center justify-center rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white px-4 py-2 text-xs font-mono font-bold shadow-xs transition-all cursor-pointer hover:shadow-md active:scale-98"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-[var(--border-subtle)] bg-gradient-to-b from-white to-[var(--surface-ground)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Hero Header & Value Proposition */}
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50/80 px-3 py-1 text-[11px] font-mono font-semibold text-teal-800">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-pulse" />
              GLOBAL AIRSHED TELEMETRY • CPCB NAQI &amp; COPERNICUS CAMS
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 font-sans leading-[1.12]">
              Evidence-based defense against hazardous winter smog.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-sans max-w-2xl">
              AirAware turns complex atmospheric chemistry into deterministic family routines, room-by-room ventilation windows, and decisive community intervention—powered by open science, with zero tracking and zero cloud accounts.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onGetStarted}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white px-6 py-3.5 text-sm font-mono font-bold shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-98"
              >
                Get Started (60s Personalization) →
              </button>
              <button
                type="button"
                onClick={onExploreDirectly}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 px-6 py-3.5 text-sm font-mono font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Explore Anonymously
              </button>
            </div>

            {/* Trust & Guarantee Markers */}
            <div className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs font-mono text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                No Login or Cloud Database
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                100% Stored on Your Device
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                ₹0 Budget Public Health Mission
              </span>
            </div>
          </div>

          {/* Interactive Hero Telemetry Card */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    Live Atmospheric Physics Model
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    New Delhi Airshed • 28.61°N, 77.21°E
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  How Inversion Dynamics Impact Daily Inhalation
                </h3>
              </div>

              {/* Inversion Simulator Switcher */}
              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setTelemetryMode('morning_inversion')}
                  className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
                    telemetryMode === 'morning_inversion'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  08:00 Ground Inversion (Hazardous)
                </button>
                <button
                  type="button"
                  onClick={() => setTelemetryMode('afternoon_window')}
                  className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
                    telemetryMode === 'afternoon_window'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  13:30 Solar Convection (Safe Window)
                </button>
              </div>
            </div>

            {/* Telemetry Numbers Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                  CPCB NAQI Severity
                </span>
                <span className={`text-2xl font-black font-sans ${telemetryMode === 'morning_inversion' ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {telemetryMode === 'morning_inversion' ? '382 (Severe)' : '168 (Moderate)'}
                </span>
                <span className="text-[11px] font-mono text-slate-500 mt-1 block">
                  {telemetryMode === 'morning_inversion' ? 'GRAP Stage III in effect' : 'Safe for brief transit'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                  Fine Particulate (PM₂.₅)
                </span>
                <span className="text-2xl font-black font-sans text-slate-900">
                  {telemetryMode === 'morning_inversion' ? '324 µg/m³' : '62 µg/m³'}
                </span>
                <span className="text-[11px] font-mono text-slate-500 mt-1 block">
                  {telemetryMode === 'morning_inversion' ? '5.4x CPCB standard' : 'Within diurnal dispersion'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                  Boundary Layer Height
                </span>
                <span className="text-2xl font-black font-sans text-slate-900">
                  {telemetryMode === 'morning_inversion' ? '180 m' : '1,240 m'}
                </span>
                <span className="text-[11px] font-mono text-slate-500 mt-1 block">
                  {telemetryMode === 'morning_inversion' ? 'Smog trapped at street' : 'Vertical mixing enabled'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                  Ventilation Action
                </span>
                <span className={`text-2xl font-black font-sans ${telemetryMode === 'morning_inversion' ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {telemetryMode === 'morning_inversion' ? 'Seal Indoors' : '15-Min Cross Air'}
                </span>
                <span className="text-[11px] font-mono text-slate-500 mt-1 block">
                  {telemetryMode === 'morning_inversion' ? 'CADR purifiers high' : 'Flushes stale indoor CO₂'}
                </span>
              </div>
            </div>

            {/* Deterministic Translation Callout */}
            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans text-teal-950">
              <div className="space-y-0.5">
                <span className="font-bold font-mono text-teal-900 uppercase tracking-wider text-[10px] block">
                  What AirAware Does Differently:
                </span>
                <p className="text-teal-900">
                  {telemetryMode === 'morning_inversion'
                    ? 'Automatically reschedules pediatric morning exercise and senior walks to the afternoon window, cutting inhaled particulate dose by 52%.'
                    : 'Signals the exact solar peak when outdoor ambient air has sufficiently diluted to allow 15 minutes of cross-ventilation without indoor smog spikes.'}
                </p>
              </div>
              <button
                type="button"
                onClick={onGetStarted}
                className="shrink-0 text-xs font-mono font-bold text-teal-800 hover:text-teal-950 underline cursor-pointer"
              >
                Configure for your family →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* The Fundamental Problem Section */}
      <section className="py-16 sm:py-20 border-b border-[var(--border-subtle)] bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
              02 / The Core Problem
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight font-sans">
              Why generic weather apps fail during severe pollution.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-sans">
              Most platforms display a single city-wide number and a generic recommendation. That advice ignores how air chemistry, human biology, and household mechanics actually work.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-slate-200 bg-[var(--surface-ground)] space-y-3">
              <span className="text-xs font-mono font-bold text-rose-700 uppercase tracking-widest block">
                Problem 01 • Stale Averages
              </span>
              <h3 className="text-base font-bold text-slate-900 font-sans">
                A single 24-hour AQI hides peak danger hours
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                Winter smog is driven by nocturnal radiation inversions. Ground-level pollutants concentrate between 07:00 and 10:00 AM, yet standard apps give the same warning at noon as at dawn.
              </p>
              <div className="pt-2 text-[11px] font-mono text-teal-800 font-semibold border-t border-slate-200">
                AirAware Solution: Hourly diurnal curves &amp; dynamic morning routine shifts.
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-[var(--surface-ground)] space-y-3">
              <span className="text-xs font-mono font-bold text-rose-700 uppercase tracking-widest block">
                Problem 02 • Indoor Blindspot
              </span>
              <h3 className="text-base font-bold text-slate-900 font-sans">
                Indoor air is not safe without volumetric calculation
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                Without calculating Clean Air Delivery Rate (CADR) for your room volume, purifiers either underperform or run on low speeds that leave fine particles suspended for hours.
              </p>
              <div className="pt-2 text-[11px] font-mono text-teal-800 font-semibold border-t border-slate-200">
                AirAware Solution: Room-by-room CADR/ACH volumetric sizing formulas.
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-[var(--surface-ground)] space-y-3">
              <span className="text-xs font-mono font-bold text-rose-700 uppercase tracking-widest block">
                Problem 03 • Action Paralysis
              </span>
              <h3 className="text-base font-bold text-slate-900 font-sans">
                Passive despair instead of neighborhood action
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                Individual citizens cannot solve regional agricultural fires, but they can stop neighborhood garbage burning and mandate building security guards stop burning dry leaves for warmth.
              </p>
              <div className="pt-2 text-[11px] font-mono text-teal-800 font-semibold border-t border-slate-200">
                AirAware Solution: 1-tap WhatsApp RWA dispatches and CPCB Sameer incident journals.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5 Workspaces Architecture Studio */}
      <section id="workspaces" className="py-16 sm:py-24 border-b border-[var(--border-subtle)] bg-[var(--surface-ground)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
              03 / Five Dedicated Workspaces
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight font-sans">
              Comprehensive environmental intelligence for every domain.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-sans">
              Explore the five specialized studios built into AirAware. From global 3D atmospheric dispersion to personal family routines and housing society alerts.
            </p>
          </div>

          {/* Mount the interactive 5-workspace architectural studio */}
          <WorkspaceShowcaseStudio />
        </div>
      </section>

      {/* Scientific Standards & Regulatory Alignment */}
      <section id="scientific-rigor" className="py-16 sm:py-20 border-b border-[var(--border-subtle)] bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
              04 / Scientific Provenance
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight font-sans">
              Deterministic models. Authoritative regulatory standards.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-sans">
              AirAware uses published formulas from atmospheric physics, building science, and environmental protection agencies rather than opaque approximations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl border border-slate-200 bg-[var(--surface-ground)] space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-800 block">
                Atmospheric Telemetry
              </span>
              <h3 className="text-sm font-bold text-slate-900 font-sans">
                Copernicus CAMS &amp; Open-Meteo
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Integrated IFS model with ~45 km horizontal grid resolution, surface wind vectors, and thermal boundary layers.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-[var(--surface-ground)] space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-800 block">
                Regulatory Standards
              </span>
              <h3 className="text-sm font-bold text-slate-900 font-sans">
                CPCB NAQI &amp; WHO 2021
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Dual reporting supporting both Indian National AQI (60 µg/m³ PM₂.₅ 24h) and strict WHO health guidelines.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-[var(--surface-ground)] space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-800 block">
                Indoor Aerodynamics
              </span>
              <h3 className="text-sm font-bold text-slate-900 font-sans">
                ASHRAE 62.2 CADR Sizing
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Deterministic Clean Air Delivery Rate formulas calculating exact air changes per hour (ACH) per room geometry.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-[var(--surface-ground)] space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-800 block">
                Emission Factors
              </span>
              <h3 className="text-sm font-bold text-slate-900 font-sans">
                DEFRA &amp; CPCB Tailpipe
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Empirical tailpipe coefficients (2.3 kg CO₂ &amp; 4.5g NOₓ per 10 km shifted to electric metro rail transit).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Local-First & Privacy Guarantee */}
      <section id="privacy-commitment" className="py-16 sm:py-20 border-b border-[var(--border-subtle)] bg-[var(--surface-ground)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-300 bg-white p-6 sm:p-10 shadow-sm space-y-6">
            <div className="max-w-2xl space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                05 / Privacy Guarantee
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-sans">
                Your family&apos;s health routines never leave your device.
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                AirAware is engineered with a strict local-first architecture. We do not operate user accounts, track personal schedules, or store your room dimensions on external cloud servers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
              <div className="space-y-1.5 border-t border-slate-200 pt-3">
                <span className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider block">
                  Zero Cloud Accounts
                </span>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  No sign-up forms, email tracking, or third-party identity cookies. Start immediately with one click.
                </p>
              </div>

              <div className="space-y-1.5 border-t border-slate-200 pt-3">
                <span className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider block">
                  100% On-Device Storage
                </span>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  Schedules, vulnerability profiles, and pollution reports remain exclusively inside your browser&apos;s local storage.
                </p>
              </div>

              <div className="space-y-1.5 border-t border-slate-200 pt-3">
                <span className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider block">
                  Export or Wipe Anytime
                </span>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  Download your incident logs and household plans as structured JSON dossiers, or wipe all records in one tap.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing Call to Action */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto max-w-4xl px-4 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 font-sans tracking-tight">
            Protect those who depend on you.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto font-sans">
            Personalize your city, family vulnerability profile, and primary clean air workspace in under 60 seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onGetStarted}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white px-8 py-3.5 text-sm font-mono font-bold shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-98"
            >
              Get Started (Personalize) →
            </button>
            <button
              type="button"
              onClick={onExploreDirectly}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 px-6 py-3.5 text-sm font-mono font-semibold transition-colors cursor-pointer"
            >
              Explore Without Setup
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
