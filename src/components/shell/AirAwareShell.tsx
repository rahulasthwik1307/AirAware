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
import { IndoorAirWorkspace } from '@/components/indoor/IndoorAirWorkspace';
import { CleanerChoicesWorkspace } from '@/components/choices/CleanerChoicesWorkspace';
import { CommunityAlertsWorkspace } from '@/components/community/CommunityAlertsWorkspace';
import { NotificationDrawer } from '@/components/community/NotificationDrawer';
import { useCommunityAlerts } from '@/domain/community/useCommunityAlerts';

export function AirAwareShell() {
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceKey>('air-intelligence');
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [copilotInitialPrompt, setCopilotInitialPrompt] = useState<string | null>(null);
  const [copilotRoomContext, setCopilotRoomContext] = useState<string | null>(null);

  // Community Alerts hook for header notification bell & global drawer
  const { alerts, unreadCount, markAlertRead, markAllAlertsRead } = useCommunityAlerts();

  const handleOpenCopilotWithContext = (prompt?: string, roomName?: string) => {
    setCopilotInitialPrompt(prompt || null);
    setCopilotRoomContext(roomName || null);
    setIsCopilotOpen(true);
  };

  const handleCloseCopilot = () => {
    setIsCopilotOpen(false);
    setCopilotInitialPrompt(null);
    setCopilotRoomContext(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface-ground)] text-[var(--ink-primary)] pb-16 md:pb-0">
      {/* Universal Top Header */}
      <AppHeader
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={setActiveWorkspace}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        unreadAlertCount={unreadCount}
        onOpenNotifications={() => setIsNotificationOpen(true)}
      />

      {/* Main Content Area */}
      <main
        id="main-content"
        className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      >
        {activeWorkspace === 'air-intelligence' ? (
          /* Live Global Air Intelligence Dashboard */
          <AirQualityDashboard onSelectWorkspace={setActiveWorkspace} />
        ) : activeWorkspace === 'family-planner' ? (
          /* Production Phase 3 Family Daily Planner Workspace */
          <FamilyPlannerWorkspace />
        ) : activeWorkspace === 'indoor-air' ? (
          /* Production Phase 4 Indoor Air Intelligence Workspace */
          <IndoorAirWorkspace onOpenCopilotWithContext={handleOpenCopilotWithContext} />
        ) : activeWorkspace === 'cleaner-choices' ? (
          /* Production Phase 6 Cleaner Choices & Impact Workspace */
          <CleanerChoicesWorkspace onAskCopilot={handleOpenCopilotWithContext} />
        ) : activeWorkspace === 'community-alerts' ? (
          /* Production Phase 7 Community Air Intelligence & Alerts Workspace */
          <CommunityAlertsWorkspace
            onSelectWorkspace={setActiveWorkspace}
            onAskCopilot={handleOpenCopilotWithContext}
          />
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

          {/* Authoritative Environmental Platform Provenance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100 text-[11px]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--brand-primary)] text-white text-[11px] font-black">A</span>
                <span className="font-bold text-slate-900 font-sans text-xs">AirAware Intelligence</span>
              </div>
              <p className="text-slate-500 leading-relaxed">
                Empowering families and housing societies to navigate severe winter smog with low-emission routines and verified indoor hacks.
              </p>
            </div>

            <div className="space-y-1 font-mono text-[10px] text-slate-500">
              <span className="font-bold uppercase tracking-wider text-slate-700 block">Scientific Data Feeds</span>
              <p>Atmospheric Telemetry: Copernicus CAMS &amp; Open-Meteo Reanalysis</p>
              <p>Standards: Central Pollution Control Board (CPCB) &amp; WHO Guidelines</p>
            </div>

            <div className="space-y-1 font-mono text-[10px] text-slate-500 md:text-right">
              <span className="font-bold uppercase tracking-wider text-slate-700 block">Privacy Guarantee</span>
              <p>🔒 100% Local-First: All routines, habits &amp; notes stay on your device.</p>
              <p>Zero tracking • ₹0 operational budget • Public health mission</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Fixed Bottom Navigation */}
      <MobileBottomNav
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={setActiveWorkspace}
      />

      {/* Universal In-App Notification Drawer Shell */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        alerts={alerts}
        unreadCount={unreadCount}
        onMarkRead={markAlertRead}
        onMarkAllRead={markAllAlertsRead}
        onNavigateWorkspace={setActiveWorkspace}
      />

      {/* Global AI Copilot Slide-Over Drawer Shell */}
      <CopilotDrawerShell
        isOpen={isCopilotOpen}
        onClose={handleCloseCopilot}
        activeWorkspace={activeWorkspace}
        initialPrompt={copilotInitialPrompt}
        roomContext={copilotRoomContext ? { roomName: copilotRoomContext } : null}
      />
    </div>
  );
}
