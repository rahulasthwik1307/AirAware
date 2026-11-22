'use client';

import React from 'react';
import { WorkspaceShowcaseStudio } from './WorkspaceShowcaseStudio';
import { PollutionComparisonSplit } from './PollutionComparisonSplit';

interface WelcomeLandingPageProps {
  readonly onGetStarted: () => void;
  readonly onExploreDirectly: () => void;
}

export function WelcomeLandingPage({
  onGetStarted,
  onExploreDirectly,
}: WelcomeLandingPageProps) {
  return (
    <div className="min-h-screen bg-[var(--surface-ground)] text-[var(--ink-primary)] selection:bg-teal-100 selection:text-teal-900">
      {/* Top Floating Glass Navigation Bar (Taste Editorial Typography Standard) */}
      <header className="sticky top-3 z-40 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mb-2">
        <div className="flex h-16 items-center justify-between px-5 sm:px-7 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-xs hover:shadow-sm transition-all">
          {/* Brand Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-hover)] text-white font-extrabold text-base shadow-xs select-none"
              aria-hidden="true"
            >
              A
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-slate-900 font-sans">
                AirAware
              </span>
              <span className="text-[11px] font-semibold text-slate-500 font-sans">
                Clean Air Intelligence
              </span>
            </div>
          </div>

          {/* Anchor Navigation */}
          <nav aria-label="Landing page sections" className="hidden md:flex items-center gap-1">
            <a
              href="#workspaces"
              className="px-3.5 py-1.5 rounded-lg text-[13px] font-sans font-semibold tracking-tight text-slate-600 hover:text-slate-950 hover:bg-slate-100/80 transition-all"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="px-3.5 py-1.5 rounded-lg text-[13px] font-sans font-semibold tracking-tight text-slate-600 hover:text-slate-950 hover:bg-slate-100/80 transition-all"
            >
              How It Works
            </a>
            <a
              href="#visual-stories"
              className="px-3.5 py-1.5 rounded-lg text-[13px] font-sans font-semibold tracking-tight text-slate-600 hover:text-slate-950 hover:bg-slate-100/80 transition-all"
            >
              Visual Stories
            </a>
            <a
              href="#privacy-commitment"
              className="px-3 py-1 rounded-full text-[12px] font-sans font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 hover:bg-emerald-100/80 transition-all ml-1"
            >
              100% Private
            </a>
          </nav>

          {/* Direct Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onExploreDirectly}
              className="text-[13px] font-sans font-semibold text-slate-700 hover:text-slate-950 px-3.5 py-2 rounded-xl hover:bg-slate-100/80 transition-all cursor-pointer group"
            >
              <span>Open App</span>
              <span className="inline-block transition-transform group-hover:translate-x-0.5 ml-1">→</span>
            </button>
            <button
              type="button"
              onClick={onGetStarted}
              className="inline-flex items-center justify-center rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white px-5 py-2 text-[13px] font-sans font-bold tracking-tight shadow-xs transition-all cursor-pointer hover:shadow-md tactile-btn"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* Hero Section: 5:7 Split Grid */}
      <section className="relative overflow-hidden pt-6 pb-16 sm:pt-10 sm:pb-20 border-b border-[var(--border-subtle)] bg-gradient-to-b from-white to-[var(--surface-ground)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left 5 Columns: Clear, Impactful Copy & Direct Action */}
            <div className="lg:col-span-5 space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 font-sans leading-[1.14]">
                Protect your family from hazardous winter smog.
              </h1>

              <p className="text-base text-slate-600 font-sans leading-relaxed">
                Transform live satellite telemetry into timed ventilation windows, room-by-room purifier sizing, and decisive neighborhood alerts.
              </p>

              {/* Hero CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onGetStarted}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white px-6 py-3.5 text-sm font-sans font-bold shadow-sm hover:shadow-md transition-all cursor-pointer tactile-btn"
                >
                  Get Started (60s Setup) →
                </button>
                <button
                  type="button"
                  onClick={onExploreDirectly}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 px-5 py-3.5 text-sm font-sans font-semibold shadow-xs transition-colors cursor-pointer tactile-btn"
                >
                  Explore Anonymously
                </button>
              </div>

              {/* Fast Trust Indicators */}
              <div className="pt-3 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs font-sans font-medium text-slate-500 border-t border-slate-200/80">
                <span>100% Stored on Device</span>
                <span>•</span>
                <span>No Sign-Up or Cookies</span>
                <span>•</span>
                <span>₹0 Public Mission</span>
              </div>
            </div>

            {/* Right 7 Columns: Interactive Before & After Pollution Split */}
            <div className="lg:col-span-7">
              <PollutionComparisonSplit />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section: High-Impact Visual Comparison */}
      <section id="how-it-works" className="py-14 sm:py-18 border-b border-[var(--border-subtle)] bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
              Why standard weather apps fail during smog season
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Visual Card 1: Diurnal Timing */}
            <div className="p-6 rounded-3xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-all card-elevate space-y-3.5">
              <span className="text-xs font-sans font-bold text-teal-800 uppercase tracking-wider block">
                Diurnal Timing
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 font-sans leading-snug">
                Peak morning smog hides behind 24-hour averages.
              </h3>
              <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="font-semibold text-rose-700">07:00 – 10:00 AM</span>
                  <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[11px]">380+ Severe</span>
                </div>
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="font-semibold text-emerald-700">12:30 – 03:30 PM</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[11px]">Safe Window</span>
                </div>
              </div>
              <p className="text-xs font-sans font-medium text-slate-600 leading-relaxed">
                AirAware shifts runs, school commutes, and ventilation to natural solar dispersion windows.
              </p>
            </div>

            {/* Visual Card 2: Volumetric CADR */}
            <div className="p-6 rounded-3xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-all card-elevate space-y-3.5">
              <span className="text-xs font-sans font-bold text-teal-800 uppercase tracking-wider block">
                Indoor Physics
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 font-sans leading-snug">
                Generic advice fails without CADR room sizing.
              </h3>
              <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="font-semibold text-slate-700">Air Changes / Hour</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[11px]">4.8 ACH Optimal</span>
                </div>
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="font-semibold text-slate-700">Room Volume Formula</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[11px]">ASHRAE 62.2</span>
                </div>
              </div>
              <p className="text-xs font-sans font-medium text-slate-600 leading-relaxed">
                Calculates exact purifier fan speed and filter runtime for your ceiling height and room volume.
              </p>
            </div>

            {/* Visual Card 3: Decisive Civic Action */}
            <div className="p-6 rounded-3xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-all card-elevate space-y-3.5">
              <span className="text-xs font-sans font-bold text-teal-800 uppercase tracking-wider block">
                Community Action
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 font-sans leading-snug">
                Replace helpless anxiety with 1-tap neighborhood alerts.
              </h3>
              <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="font-semibold text-slate-700">WhatsApp RWA Alert</span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-bold text-[11px]">Instant 1-Tap</span>
                </div>
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="font-semibold text-slate-700">CPCB Sameer Dossier</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[11px]">Formal Format</span>
                </div>
              </div>
              <p className="text-xs font-sans font-medium text-slate-600 leading-relaxed">
                Stop illegal garbage and dry-leaf fires with structured legal citations and instant dispatches.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Story Gallery: Life With Clean Air */}
      <section id="visual-stories" className="py-16 sm:py-20 border-b border-[var(--border-subtle)] bg-[var(--surface-ground)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
              Everyday life protected by environmental intelligence
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Story Card 1: Indoor Haven */}
            <div className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
              <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/landing/indoor_air_sanctuary.webp"
                  alt="Cozy sunlit living room sanctuary for family with air purifier"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-103"
                />
                <div className="absolute top-4 left-4">
                  <span className="rounded-full bg-white/90 backdrop-blur-md px-3 py-1 text-xs font-sans font-bold text-teal-900 shadow-md">
                    Indoor Sanctuary
                  </span>
                </div>
              </div>
              <div className="p-6 space-y-2">
                <h3 className="text-xl font-bold text-slate-900 font-sans">
                  Clean indoor haven for children and seniors
                </h3>
                <p className="text-sm font-sans text-slate-600 leading-relaxed">
                  While winter particulate fog lingers outside, indoor air is kept safe with calculated filtration rates, healthy humidity balance, and timely window management.
                </p>
                <div className="pt-2 flex items-center gap-2 text-xs font-sans font-semibold text-teal-800">
                  <span>Calculated CADR</span>
                  <span>•</span>
                  <span>Zero Suspended Fine PM₂.₅</span>
                  <span>•</span>
                  <span>Restful Sleep</span>
                </div>
              </div>
            </div>

            {/* Story Card 2: Community Action */}
            <div className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
              <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/landing/community_action_alert.webp"
                  alt="Neighbors and security guard coordinating air quality protection in courtyard"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-103"
                />
                <div className="absolute top-4 left-4">
                  <span className="rounded-full bg-white/90 backdrop-blur-md px-3 py-1 text-xs font-sans font-bold text-teal-900 shadow-md">
                    Community Alerts
                  </span>
                </div>
              </div>
              <div className="p-6 space-y-2">
                <h3 className="text-xl font-bold text-slate-900 font-sans">
                  Civic solidarity stopping smoke at the source
                </h3>
                <p className="text-sm font-sans text-slate-600 leading-relaxed">
                  One tap to alert security guards and neighborhood groups with pre-drafted WhatsApp messages and official CPCB dossiers that protect your community.
                </p>
                <div className="pt-2 flex items-center gap-2 text-xs font-sans font-semibold text-teal-800">
                  <span>Solid Waste Byelaws</span>
                  <span>•</span>
                  <span>Direct WhatsApp Dispatch</span>
                  <span>•</span>
                  <span>Collective Defense</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5 Workspaces Architecture Studio */}
      <section id="workspaces" className="py-16 sm:py-20 border-b border-[var(--border-subtle)] bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
              Comprehensive environmental intelligence for every domain
            </h2>
          </div>

          {/* Mount the interactive 5-workspace architectural studio */}
          <WorkspaceShowcaseStudio />
        </div>
      </section>

      {/* Open-Science Provenance Strip */}
      <section id="scientific-rigor" className="py-12 sm:py-16 border-b border-[var(--border-subtle)] bg-[var(--surface-ground)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-sans">
              Powered by authoritative atmospheric science
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center shadow-2xs">
              <span className="text-xs font-sans font-extrabold text-slate-900 block">
                Copernicus CAMS
              </span>
              <span className="text-[11px] font-sans font-medium text-slate-500">
                IFS ~45km Atmospheric Grid
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center shadow-2xs">
              <span className="text-xs font-sans font-extrabold text-slate-900 block">
                CPCB NAQI 2014
              </span>
              <span className="text-[11px] font-sans font-medium text-slate-500">
                Indian Standard &amp; GRAP Stages
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center shadow-2xs">
              <span className="text-xs font-sans font-extrabold text-slate-900 block">
                ASHRAE 62.2
              </span>
              <span className="text-[11px] font-sans font-medium text-slate-500">
                Volumetric CADR/ACH Sizing
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center shadow-2xs">
              <span className="text-xs font-sans font-extrabold text-slate-900 block">
                DEFRA Emission Factors
              </span>
              <span className="text-[11px] font-sans font-medium text-slate-500">
                Verified Transit Savings
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Local-First & Privacy Guarantee */}
      <section id="privacy-commitment" className="py-14 sm:py-18 border-b border-[var(--border-subtle)] bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-teal-50/40 p-6 sm:p-10 shadow-xs">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <span className="text-xs font-sans font-bold text-emerald-800 uppercase tracking-wider block">
                  100% Private &amp; Local-First
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-sans">
                  Your health routines never touch a cloud server.
                </h2>
                <p className="text-sm font-sans text-slate-600 leading-relaxed">
                  AirAware runs entirely in your browser with zero remote accounts, no telemetry tracking, and zero advertising cookies.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                <div className="p-4 rounded-2xl bg-white/90 border border-emerald-200 text-center min-w-[130px]">
                  <span className="text-base font-extrabold text-slate-900 block">0</span>
                  <span className="text-[11px] font-sans font-bold text-emerald-800 uppercase">Cloud Accounts</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/90 border border-emerald-200 text-center min-w-[130px]">
                  <span className="text-base font-extrabold text-slate-900 block">100%</span>
                  <span className="text-[11px] font-sans font-bold text-emerald-800 uppercase">On-Device Data</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/90 border border-emerald-200 text-center min-w-[130px]">
                  <span className="text-base font-extrabold text-slate-900 block">1-Tap</span>
                  <span className="text-[11px] font-sans font-bold text-emerald-800 uppercase">Full Data Wipe</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing Call to Action */}
      <section className="py-16 sm:py-22 bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto max-w-4xl px-4 text-center space-y-5">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-sans tracking-tight">
            Protect those who depend on you.
          </h2>
          <p className="text-base text-slate-600 font-sans max-w-lg mx-auto">
            Personalize your city, family vulnerability profile, and primary workspace in under 60 seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onGetStarted}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white px-8 py-3.5 text-sm font-sans font-bold shadow-md hover:shadow-lg transition-all cursor-pointer tactile-btn"
            >
              Get Started (Personalize) →
            </button>
            <button
              type="button"
              onClick={onExploreDirectly}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 px-6 py-3.5 text-sm font-sans font-semibold transition-colors cursor-pointer tactile-btn"
            >
              Explore Without Setup
            </button>
          </div>
        </div>
      </section>
      </main>
    </div>
  );
}
