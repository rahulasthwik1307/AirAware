'use client';

import { useState, useEffect, useMemo, useSyncExternalStore, useRef } from 'react';
import { WorkspaceKey } from '@/domain/types';
import { useAirQuality } from '@/domain/aqi/useAirQuality';
import {
  loadHouseholdState,
  subscribeHouseholdStorage,
  getHouseholdServerSnapshot,
} from '@/domain/household/storage';
import { AppHeader } from './AppHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { CopilotDrawerShell } from './CopilotDrawerShell';
import { UpcomingWorkspacePlaceholder } from './UpcomingWorkspacePlaceholder';
import { AirQualityDashboard } from '@/components/dashboard/AirQualityDashboard';
import { FamilyPlannerWorkspace } from '@/components/planner/FamilyPlannerWorkspace';
import { IndoorAirWorkspace } from '@/components/indoor/IndoorAirWorkspace';
import { CleanerChoicesWorkspace } from '@/components/choices/CleanerChoicesWorkspace';
import { CommunityAlertsWorkspace } from '@/components/community/CommunityAlertsWorkspace';
import { NotificationDrawer } from '@/components/community/NotificationDrawer';
import { useCommunityAlerts } from '@/domain/community/useCommunityAlerts';
import { WelcomeLandingPage } from '@/components/welcome/WelcomeLandingPage';
import { OnboardingModal, OnboardingResult } from '@/components/welcome/OnboardingModal';
import { HouseholdMember } from '@/domain/household/types';
import { clearAllAirAwareData } from '@/domain/constants/storage-keys';

function createHouseholdMembersFromSensitivities(sensitivities: readonly string[]): HouseholdMember[] {
  const members: HouseholdMember[] = [];
  const now = new Date().toISOString();

  if (sensitivities.includes('infants_children')) {
    members.push({
      id: 'member_child',
      nickname: 'Aarav (Child)',
      archetype: 'CHILD_STUDENT',
      sensitivityTier: 'PEDIATRIC',
      createdAt: now,
      schedules: [
        {
          id: 'sch_school',
          activityName: 'Morning School Transit',
          activityType: 'SCHOOL_TRAVEL',
          startTime: '07:30',
          durationMinutes: 45,
          commuteMode: 'PUBLIC_TRANSIT',
          commuteDistanceKm: 6,
        },
      ],
    });
  }

  if (sensitivities.includes('elderly_parents') && members.length < 4) {
    members.push({
      id: 'member_senior',
      nickname: 'Dada / Dadi (Senior)',
      archetype: 'SENIOR_VULNERABLE',
      sensitivityTier: 'SENIOR',
      createdAt: now,
      schedules: [
        {
          id: 'sch_walk',
          activityName: 'Morning Park Walk',
          activityType: 'OUTDOOR_EXERCISE',
          startTime: '06:45',
          durationMinutes: 40,
          commuteMode: 'WALKING',
          commuteDistanceKm: 1.5,
        },
      ],
    });
  }

  if (sensitivities.includes('asthma_respiratory') && members.length < 4) {
    members.push({
      id: 'member_respiratory',
      nickname: 'Priya (Asthma Care)',
      archetype: 'OUTDOOR_ENTHUSIAST',
      sensitivityTier: 'RESPIRATORY',
      createdAt: now,
      schedules: [
        {
          id: 'sch_exercise',
          activityName: 'Outdoor Jogging / Exercise',
          activityType: 'OUTDOOR_EXERCISE',
          startTime: '07:00',
          durationMinutes: 45,
          commuteMode: 'WALKING',
          commuteDistanceKm: 3,
        },
      ],
    });
  }

  if (sensitivities.includes('active_commuter') && members.length < 4) {
    members.push({
      id: 'member_commuter',
      nickname: 'Rohan (Daily Commuter)',
      archetype: 'WORKING_COMMUTER',
      sensitivityTier: 'NONE',
      createdAt: now,
      schedules: [
        {
          id: 'sch_commute',
          activityName: 'Morning Office Commute',
          activityType: 'COMMUTE',
          startTime: '08:30',
          durationMinutes: 60,
          commuteMode: 'PRIVATE_CAR',
          commuteDistanceKm: 18,
        },
      ],
    });
  }

  if ((members.length === 0 || sensitivities.includes('healthy_adult')) && members.length < 4) {
    members.push({
      id: 'member_general',
      nickname: 'Family Household',
      archetype: 'WORKING_COMMUTER',
      sensitivityTier: 'NONE',
      createdAt: now,
      schedules: [
        {
          id: 'sch_errand',
          activityName: 'Market & Neighborhood Errands',
          activityType: 'ERRAND',
          startTime: '10:00',
          durationMinutes: 30,
          commuteMode: 'WALKING',
          commuteDistanceKm: 1,
        },
      ],
    });
  }

  return members.slice(0, 4);
}

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
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearedToast, setClearedToast] = useState(false);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);
  const clearDialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (showClearConfirm) {
      cancelBtnRef.current?.focus();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setShowClearConfirm(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [showClearConfirm]);

  const handleClearDataConfirm = () => {
    clearAllAirAwareData();
    setShowClearConfirm(false);
    setClearedToast(true);
    setTimeout(() => {
      setClearedToast(false);
      setIsWelcomeActive(true);
    }, 1200);
  };

  const handleDialogKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      const focusable = clearDialogRef.current?.querySelectorAll<HTMLElement>('button');
      if (focusable && focusable.length > 0) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
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
      const householdState = {
        version: 1,
        updatedAt: new Date().toISOString(),
        activeMemberId: members.length > 0 ? members[0].id : null,
        members,
      };
      localStorage.setItem('airaware_household_v1', JSON.stringify(householdState));
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
              <span className="font-semibold text-slate-800 block font-sans text-xs">Scientific Data Feeds</span>
              <p>Atmospheric Telemetry: Copernicus CAMS &amp; Open-Meteo Reanalysis</p>
              <p>Standards: Central Pollution Control Board (CPCB) &amp; WHO Guidelines</p>
            </div>

            <div className="space-y-1 font-mono text-[10px] text-slate-500 md:text-right">
              <span className="font-semibold text-slate-800 block font-sans text-xs">Privacy &amp; Data Control</span>
              <p className="max-w-md md:ml-auto">
                No account needed. Your profile, saved cities and chats are stored on this device. Questions you send to the AI are processed to generate answers. You can clear everything at any time.
              </p>
              <div className="pt-1.5">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-rose-600 hover:text-rose-700 underline underline-offset-2 hover:bg-rose-50 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                  aria-haspopup="dialog"
                >
                  Clear my data
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Confirmation Dialog for Clear My Data */}
      {showClearConfirm && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            ref={clearDialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="clear-dialog-title"
            aria-describedby="clear-dialog-desc"
            onKeyDown={handleDialogKeyDown}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden="true">⚠️</span>
              <h3 id="clear-dialog-title" className="text-base font-bold text-slate-900 font-sans">
                Clear all stored data?
              </h3>
            </div>
            <p id="clear-dialog-desc" className="text-xs text-slate-600 leading-relaxed">
              This removes your saved profile, cities, chats and indoor reading from this device. Continue?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                ref={cancelBtnRef}
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-mono font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearDataConfirm}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all cursor-pointer shadow-xs"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

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
