'use client';

import React, { useState } from 'react';
import { useCommunityAlerts } from '@/domain/community/useCommunityAlerts';
import { CommunityKpiStrip } from './CommunityKpiStrip';
import { AirshedAlertFeedCard } from './AirshedAlertFeedCard';
import { HistoricalAirshedTrendCard } from './HistoricalAirshedTrendCard';
import { AirshedSourceAttributionCard } from './AirshedSourceAttributionCard';
import { PollutionIncidentReporterCard } from './PollutionIncidentReporterCard';
import { IncidentJournalCard } from './IncidentJournalCard';
import { RwaBulletinModal } from './RwaBulletinModal';
import { WorkspaceKey } from '@/domain/types';

interface CommunityAlertsWorkspaceProps {
  readonly onSelectWorkspace: (workspace: WorkspaceKey) => void;
  readonly onAskCopilot: (prompt: string) => void;
}

export function CommunityAlertsWorkspace({
  onSelectWorkspace,
  onAskCopilot,
}: CommunityAlertsWorkspaceProps) {
  const [isRwaModalOpen, setIsRwaModalOpen] = useState(false);

  const {
    alerts,
    unreadCount,
    incidents,
    activeGrapStage,
    ventilationWindow,
    historicalTrend,
    rwaSocietyName,
    addIncident,
    updateIncidentStatus,
    deleteIncident,
    markAlertRead,
    markAllAlertsRead,
    generateCpcbComplaint,
    generateRwaBulletin,
  } = useCommunityAlerts({
    locationName: 'New Delhi, India',
    aqi: 378,
    prominentPollutant: 'PM2.5',
  });

  return (
    <div
      className="space-y-6 animate-fadeIn py-2"
      role="region"
      aria-label="Community Air Intelligence and Alerts Workspace"
    >
      {/* Top Executive KPI Strip */}
      <CommunityKpiStrip
        unreadCount={unreadCount}
        activeGrapStage={activeGrapStage}
        ventilationWindow={ventilationWindow}
        incidentCount={incidents.length}
        onOpenRwaModal={() => setIsRwaModalOpen(true)}
      />

      {/* Asymmetric 7 / 5 Bento Grid (Dominant Alert Stream & Retrospective History on Left) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Alerts & Historical Airshed Trends (7 cols - 58.3%) */}
        <div className="lg:col-span-7 space-y-6">
          <AirshedAlertFeedCard
            alerts={alerts}
            onMarkRead={markAlertRead}
            onMarkAllRead={markAllAlertsRead}
            onNavigateWorkspace={onSelectWorkspace}
            onAskCopilot={onAskCopilot}
          />

          <HistoricalAirshedTrendCard
            history={historicalTrend}
            locationName="New Delhi, India"
          />

          <AirshedSourceAttributionCard
            locationName="New Delhi, India"
            onNavigateWorkspace={onSelectWorkspace}
            onAskCopilot={onAskCopilot}
          />
        </div>

        {/* Right Column: Citizen Incident Reporter & Journal (5 cols - 41.7%) */}
        <div className="lg:col-span-5 space-y-6">
          <PollutionIncidentReporterCard
            defaultLocationName="New Delhi, India"
            onSubmitIncident={addIncident}
            onAskCopilot={onAskCopilot}
          />

          <IncidentJournalCard
            incidents={incidents}
            onUpdateStatus={updateIncidentStatus}
            onDeleteIncident={deleteIncident}
            onGenerateCpcbComplaint={generateCpcbComplaint}
          />
        </div>
      </div>

      {/* RWA / Society Clean Air Bulletin Modal */}
      {isRwaModalOpen && (
        <RwaBulletinModal
          isOpen={isRwaModalOpen}
          onClose={() => setIsRwaModalOpen(false)}
          defaultSocietyName={rwaSocietyName}
          onGenerateBulletin={generateRwaBulletin}
        />
      )}
    </div>
  );
}
