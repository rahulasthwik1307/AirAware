'use client';

import React, { useState } from 'react';
import { WorkspaceKey } from '@/domain/types';
import { AppHeader } from './AppHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { PersonalizationBanner } from './PersonalizationBanner';
import { CopilotDrawerShell } from './CopilotDrawerShell';
import { UpcomingWorkspacePlaceholder } from './UpcomingWorkspacePlaceholder';
import { AirQualityDashboard } from '@/components/dashboard/AirQualityDashboard';
import { FamilyPlannerWorkspace } from '@/components/planner/FamilyPlannerWorkspace';

export function AirAwareShell() {
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceKey>('air-intelligence');
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface-ground)] text-[var(--ink-primary)] pb-16 md:pb-0">
      {/* Universal Top Header */}
      <AppHeader
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={setActiveWorkspace}
        onOpenCopilot={() => setIsCopilotOpen(true)}
      />

      {/* Main Content Area */}
      <main
        id="main-content"
        className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      >
        {activeWorkspace === 'air-intelligence' ? (
          <>
            {/* Dismissible In-Situ Personalization Banner */}
            <PersonalizationBanner onOpenSetup={setActiveWorkspace} />

            {/* Live Global Air Intelligence Dashboard */}
            <AirQualityDashboard onSelectWorkspace={setActiveWorkspace} />
          </>
        ) : activeWorkspace === 'family-planner' ? (
          /* Production Phase 3 Family Daily Planner Workspace */
          <FamilyPlannerWorkspace />
        ) : (
          /* Non-broken upcoming workspace placeholder */
          <UpcomingWorkspacePlaceholder
            workspace={activeWorkspace}
            onReturnToLive={() => setActiveWorkspace('air-intelligence')}
          />
        )}
      </main>

      {/* Application Footer */}
      <footer className="mt-auto border-t border-[var(--border-subtle)] bg-[var(--surface-card)] py-6 text-xs text-[var(--ink-secondary)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-4">
          {/* Emergency Alert Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl border border-rose-200 bg-rose-50/70 text-rose-950 font-sans shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white text-[11px] font-bold">!</span>
              <p className="font-semibold text-xs text-rose-900">
                Experiencing acute shortness of breath, severe wheezing, or chest tightness?
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold text-rose-800 bg-white/80 px-2.5 py-1 rounded border border-rose-300 self-start sm:self-auto shrink-0">
              Seek medical care • Emergency: 112
            </span>
          </div>

          {/* Quick Action Navigation & Platform Attribution */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono font-bold text-[var(--ink-muted)] uppercase tracking-wider">
                Quick Actions:
              </span>
              <button
                type="button"
                onClick={() => setActiveWorkspace('air-intelligence')}
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] hover:text-[var(--brand-primary)] cursor-pointer transition-colors"
              >
                🌅 Forecast &amp; Smog Windows
              </button>
              <button
                type="button"
                onClick={() => setActiveWorkspace('indoor-air')}
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] hover:text-[var(--brand-primary)] cursor-pointer transition-colors"
              >
                🏠 Indoor Air Hacks
              </button>
              <button
                type="button"
                onClick={() => setActiveWorkspace('family-planner')}
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] hover:text-[var(--brand-primary)] cursor-pointer transition-colors"
              >
                🛡️ Family Daily Routines
              </button>
            </div>

            <div className="text-[11px] text-[var(--ink-muted)] font-mono sm:text-right">
              <p>Copernicus CAMS &amp; Open-Meteo Environmental Synthesis</p>
              <p className="text-[10px] text-[var(--ink-muted)]/80 mt-0.5">
                Local-first privacy: your health data stays on this device
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Fixed Bottom Navigation */}
      <MobileBottomNav
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={setActiveWorkspace}
      />

      {/* Global AI Copilot Slide-Over Drawer Shell */}
      <CopilotDrawerShell
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />
    </div>
  );
}
