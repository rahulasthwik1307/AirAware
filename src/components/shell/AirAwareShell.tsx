'use client';

import { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { WorkspaceKey } from '@/domain/types';
import { useAirQuality } from '@/domain/aqi/useAirQuality';
import {
  loadHouseholdState,
  subscribeHouseholdStorage,
  getHouseholdServerSnapshot,
} from '@/domain/household/storage';
import { AppHeader } from './AppHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { UpcomingWorkspacePlaceholder } from './UpcomingWorkspacePlaceholder';
import { AirQualityDashboard } from '@/components/dashboard/AirQualityDashboard';
import { FamilyPlannerWorkspace } from '@/components/planner/FamilyPlannerWorkspace';
import { IndoorAirWorkspace } from '@/components/indoor/IndoorAirWorkspace';
import { CleanerChoicesWorkspace } from '@/components/choices/CleanerChoicesWorkspace';
import { CommunityAlertsWorkspace } from '@/components/community/CommunityAlertsWorkspace';
import { NotificationDrawer } from '@/components/community/NotificationDrawer';
import { useCommunityAlerts } from '@/domain/community/useCommunityAlerts';
import { WelcomeLandingPage } from '@/components/welcome/WelcomeLandingPage';
import type { OnboardingResult } from '@/components/welcome/OnboardingModal';
import { clearAllAirAwareData } from '@/domain/constants/storage-keys';
import {
  createHouseholdMembersFromSensitivities,
  WORKSPACE_TITLES,
  WORKSPACE_DESCRIPTIONS,
} from './shell-utils';
import { AppFooter } from './AppFooter';

const CopilotDrawerShell = dynamic(
  () => import('./CopilotDrawerShell').then((mod) => mod.CopilotDrawerShell),
  { ssr: false }
);

const OnboardingModal = dynamic(
  () => import('@/components/welcome/OnboardingModal').then((mod) => mod.OnboardingModal),
  { ssr: false }
);

export function AirAwareShell() {
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceKey>('air-intelligence');
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [copilotInitialPrompt, setCopilotInitialPrompt] = useState<string | null>(null);
  const [copilotRoomContext, setCopilotRoomContext] = useState<string | null>(null);

  // Live single-source environmental telemetry and active location
  const { location, report, setLocation } = useAirQuality();

  // Reactive Household state
  const householdState = useSyncExternalStore(
    subscribeHouseholdStorage,
    loadHouseholdState,
    getHouseholdServerSnapshot
  );

  const activeMember = useMemo(() => {
    if (!householdState?.members || householdState.members.length === 0) return null;
    return (
      householdState.members.find((m) => m.id === householdState.activeMemberId) ||
      householdState.members[0] ||
      null
    );
  }, [householdState]);

  // Welcome page and onboarding questionnaire state (Hydration-safe returning user check)
  const [isMounted, setIsMounted] = useState(false);
  const [isWelcomeActive, setIsWelcomeActive] = useState<boolean | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [clearedToast, setClearedToast] = useState(false);

  // Synchronize document title and description with active workspace for a11y & context
  useEffect(() => {
    const title = WORKSPACE_TITLES[activeWorkspace] || 'AirAware — Global Environmental Intelligence';
    document.title = title;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', WORKSPACE_DESCRIPTIONS[activeWorkspace] || WORKSPACE_DESCRIPTIONS['air-intelligence']);
    }
  }, [activeWorkspace]);

  const handleClearDataConfirm = () => {
    clearAllAirAwareData();
    setClearedToast(true);
    setTimeout(() => {
      setClearedToast(false);
      setIsWelcomeActive(true);
    }, 1200);
  };

  useEffect(() => {
    try {
      const completed = typeof window !== 'undefined' && localStorage.getItem('airaware_onboarding_completed_v1') === 'true';
      setIsWelcomeActive(!completed);
    } catch {
      setIsWelcomeActive(false);
    }
    setIsMounted(true);
  }, []);

  // Community Alerts hook for header notification bell & global drawer
  const { alerts, unreadCount, markAlertRead, markAllAlertsRead } = useCommunityAlerts({
    locationName: location ? `${location.name}, ${location.country}` : 'Your Location',
    aqi: report?.providerAqi ?? 100,
    prominentPollutant: report?.dominantPollutant ?? 'PM2.5',
    historicalTrend: report?.historicalTrend,
  });

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

  const handleCompleteOnboarding = (result: OnboardingResult) => {
    try {
      // 1. Save chosen location
      setLocation(result.location);

      // 2. Pre-seed household profiles
      const members = createHouseholdMembersFromSensitivities(result.householdSensitivities);
      const newHouseholdState = {
        version: 1,
        updatedAt: new Date().toISOString(),
        activeMemberId: members.length > 0 ? members[0].id : null,
        members,
      };
      localStorage.setItem('airaware_household_v1', JSON.stringify(newHouseholdState));
      window.dispatchEvent(new CustomEvent('airaware_household_updated'));

      // 3. Mark onboarding completed
      localStorage.setItem('airaware_onboarding_completed_v1', 'true');
    } catch {
      // Local storage fallback
    }

    setActiveWorkspace(result.initialWorkspace);
    setIsOnboardingOpen(false);
    setIsWelcomeActive(false);
  };

  const handleSkipWelcome = () => {
    try {
      localStorage.setItem('airaware_onboarding_completed_v1', 'true');
    } catch {
      // fallback
    }
    setIsOnboardingOpen(false);
    setIsWelcomeActive(false);
  };

  // Neutral loading state during initial mount to avoid hydration flash or mismatch
  if (!isMounted || isWelcomeActive === null) {
    return (
      <div className="min-h-screen bg-[var(--surface-ground)] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[var(--brand-primary)] border-t-transparent" />
          <span className="text-xs font-mono text-[var(--ink-muted)]">Loading AirAware...</span>
        </div>
      </div>
    );
  }

  // Render Welcome Landing Page for first-time visitors or if summoned via Header Overview button
  if (isWelcomeActive) {
    return (
      <>
        <WelcomeLandingPage
          onGetStarted={() => setIsOnboardingOpen(true)}
          onExploreDirectly={handleSkipWelcome}
        />
        <OnboardingModal
          isOpen={isOnboardingOpen}
          onComplete={handleCompleteOnboarding}
          onSkip={handleSkipWelcome}
          onCancel={() => setIsOnboardingOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface-ground)] text-[var(--ink-primary)] pb-16 lg:pb-0">
      {/* Universal Top Header */}
      <AppHeader
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={setActiveWorkspace}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        unreadAlertCount={unreadCount}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenWelcome={() => setIsWelcomeActive(true)}
      />

      {/* Main Content Area */}
      <main
        id="main-content"
        className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      >
        <div key={activeWorkspace} className="workspace-enter">
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
        </div>
      </main>

      {/* Application Footer */}
      <AppFooter onClearDataConfirm={handleClearDataConfirm} />

      {/* Data Cleared Toast Notification */}
      {clearedToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 text-white text-xs font-mono px-4 py-2.5 shadow-lg border border-slate-700 animate-fadeIn"
        >
          ✓ Your data was cleared
        </div>
      )}

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
        report={report}
        location={location}
        householdState={householdState}
        activeMember={activeMember}
      />

      {/* Global Onboarding & Personalization Questionnaire */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={handleCompleteOnboarding}
        onSkip={handleSkipWelcome}
        onCancel={() => setIsOnboardingOpen(false)}
      />
    </div>
  );
}
