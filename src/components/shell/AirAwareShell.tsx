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
            <AirQualityDashboard />
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
