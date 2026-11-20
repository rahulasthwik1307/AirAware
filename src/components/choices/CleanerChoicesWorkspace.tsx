'use client';

import React from 'react';
import { useCleanerChoices } from '@/domain/choices/useCleanerChoices';
import { CleanerChoicesKpiStrip } from './CleanerChoicesKpiStrip';
import { CommuteComparatorCard } from './CommuteComparatorCard';
import { DualImpactDashboardCard } from './DualImpactDashboardCard';
import { AirshedPollutantBreakdownCard } from './AirshedPollutantBreakdownCard';
import { SustainableHabitHubCard } from './SustainableHabitHubCard';

interface CleanerChoicesWorkspaceProps {
  readonly onAskCopilot: (prompt: string) => void;
}

export function CleanerChoicesWorkspace({ onAskCopilot }: CleanerChoicesWorkspaceProps) {
  const {
    preferences,
    commuteComparison,
    dualImpact,
    setCommuteDistance,
    setTripsPerWeek,
    setSelectedAlternative,
    toggleHabitAdoption,
    toggleHabitDayCompletion,
    completeHabitToday,
  } = useCleanerChoices();

  const activeHabitCount = preferences.habits.filter((h) => h.isAdopted).length;

  return (
    <div className="space-y-6 animate-fadeIn py-2" role="region" aria-label="Cleaner Choices and Impact Workspace">
      {/* Top Enterprise / Power BI Stat Ribbon */}
      <CleanerChoicesKpiStrip
        commute={commuteComparison}
        dualImpact={dualImpact}
        activeHabitCount={activeHabitCount}
      />

      {/* Symmetrical 2x2 Bento Grid (Zero Awkward Spaces, Perfectly Balanced) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Card 1: Top-Left */}
        <CommuteComparatorCard
          commute={commuteComparison}
          onSelectAlternative={setSelectedAlternative}
          onDistanceChange={setCommuteDistance}
          onTripsChange={setTripsPerWeek}
          onAskCopilot={onAskCopilot}
        />

        {/* Card 2: Top-Right */}
        <DualImpactDashboardCard
          dualImpact={dualImpact}
          onAskCopilot={onAskCopilot}
        />

        {/* Card 3: Bottom-Left */}
        <AirshedPollutantBreakdownCard
          commute={commuteComparison}
          onAskCopilot={onAskCopilot}
        />

        {/* Card 4: Bottom-Right */}
        <SustainableHabitHubCard
          habits={preferences.habits}
          onToggleAdoption={toggleHabitAdoption}
          onToggleDay={toggleHabitDayCompletion}
          onCompleteToday={completeHabitToday}
          onAskCopilot={onAskCopilot}
        />
      </div>
    </div>
  );
}
