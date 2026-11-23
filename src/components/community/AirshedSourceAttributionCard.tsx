'use client';

import { useState, useMemo } from 'react';
import { WorkspaceKey } from '@/domain/types';
import { isDelhiNcrRegion } from '@/domain/community/generator';
import { PollutionIncident } from '@/domain/community/types';

interface AirshedSourceAttributionCardProps {
  readonly locationName: string;
  readonly incidents?: readonly PollutionIncident[];
  readonly onNavigateWorkspace: (workspace: WorkspaceKey) => void;
  readonly onAskCopilot: (prompt: string) => void;
}

export function AirshedSourceAttributionCard({
  locationName,
  incidents = [],
  onNavigateWorkspace,
  onAskCopilot,
}: AirshedSourceAttributionCardProps) {
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null);

  const sources = useMemo(() => {
    const isNcr = isDelhiNcrRegion(locationName);
    return [
      {
        id: 'biomass-waste',
        label: 'Solid Waste & Biomass Burning',
        icon: '🔥',
        primaryPollutant: 'Elemental Black Carbon & Fine VOCs',
        mitigationAction: 'Provide electric radiant heaters to gate guards; prohibit dry garden burning.',
        regulatoryContext: 'Air Act 1981 §19(5) Municipal Ban',
      },
      {
        id: 'road-dust',
        label: 'Road & Construction Dust (C&D)',
        icon: '🏗️',
        primaryPollutant: 'Coarse PM₁₀ & Respirable Silica',
        mitigationAction: 'Enforce continuous tarpaulin sheet coverage & mechanical water misting.',
        regulatoryContext: 'C&D Waste Management Rules',
      },
      {
        id: 'vehicular',
        label: 'Vehicular Tailpipe & Idling Smog',
        icon: '🚗',
        primaryPollutant: 'NOx Precursors & Ultrafine Particles',
        mitigationAction: isNcr
          ? 'Switch to electric Delhi Metro transit; avoid cold engine idling at gates.'
          : 'Switch to public rapid transit / electric bus; avoid cold engine idling at gates.',
        regulatoryContext: isNcr ? 'CAQM GRAP Directives' : 'CPCB Clean Air Directives',
      },
      {
        id: 'industrial-dg',
        label: 'Diesel Generator Sets & Industry',
        icon: '⚡',
        primaryPollutant: 'Sulfur Dioxide & Fine Particulates',
        mitigationAction: 'Ensure society backup switches to piped gas/solar or PNG conversion kits.',
        regulatoryContext: 'CPCB DG Set Emission Standards',
      },
    ];
  }, [locationName]);

  const totalReports = incidents.length;
  const cpcbEscalated = incidents.filter((inc) => inc.status === 'EXPORTED_CPCB').length;
  const resolvedLocally = incidents.filter((inc) => inc.status === 'RESOLVED_LOCALLY').length;

  return (
    <article
      className="p-5 sm:p-6 rounded-3xl bg-(--surface-card) border border-(--border-subtle)ow-xs flex flex-col justify-between gap-4 transition-shadow hover:shadow-md"
      aria-labelledby="source-attribution-heading"
    >
      {/* Header */}
      <div className="flex flex-col gap-1.5 pb-3 border-b border-(--border-subtle)">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0" aria-hidden="true">
              🏭
            </span>
            <h2
              id="source-attribution-heading"
              className="text-base font-bold text-(--ink-primary) font-sans tracking-tight whitespace-nowrap"
            >
              Where Pollution Comes From &amp; How to Help
            </h2>
          </div>
          <button
            type="button"
            onClick={() =>
              onAskCopilot(
                `What are the leading contributors to winter smog in ${locationName}? How do trapped morning air and biomass burning worsen PM2.5 concentrations?`
              )
            }
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-(--surface-subtle) hover:bg-(--surface-card) text-(--brand-primary) border border-(--border-subtle) hover:border-(--brand-primary)/40 shadow-2xs transition-colors shrink-0 cursor-pointer"
            title="Ask Copilot about source apportionment science"
          >
            <span className="text-sm">🤖</span>
            <span>Sources</span>
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200 shrink-0">
            General information, not measured for your area
          </span>
          <p className="text-xs text-(--ink-secondary) leading-relaxed">
            Typical winter smog source categories and neighborhood mitigation actions for {locationName}.
          </p>
        </div>
      </div>

      {/* Qualitative Source Knowledge */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>COMMON WINTER POLLUTION SOURCES</span>
          <span>REGULATORY CONTEXT</span>
        </div>

        {sources.map((src) => {
          const isSelected = activeSourceId === src.id;
          return (
            <div
              key={src.id}
              onClick={() => setActiveSourceId(isSelected ? null : src.id)}
              className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? 'border-slate-400 bg-slate-50/80 shadow-xs'
                  : 'border-slate-200/90 bg-white hover:border-slate-300'
              }`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveSourceId(isSelected ? null : src.id);
                }
              }}
              aria-expanded={isSelected}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-base" aria-hidden="true">{src.icon}</span>
                  <span className="text-xs font-bold text-slate-900">{src.label}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {src.regulatoryContext}
                </span>
              </div>

              {/* Expanded Details on Click */}
              {isSelected && (
                <div className="mt-2.5 pt-2 border-t border-slate-200/80 text-[11px] space-y-1 animate-fadeIn">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="font-semibold text-slate-800">Key Pollutant:</span>
                    <span className="font-mono">{src.primaryPollutant}</span>
                  </div>
                  <p className="text-slate-700 leading-snug">
                    <strong className="text-slate-900">Action:</strong> {src.mitigationAction}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Local Citizen Reports on Device */}
      <div className="p-3.5 rounded-2xl bg-linear-to-br from-indigo-50/70 via-white to-teal-50/60 border border-indigo-200/80 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono font-bold text-indigo-900">
          <span>LOCAL CITIZEN REPORTS ON DEVICE</span>
          <span className={totalReports > 0 ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
            {totalReports > 0 ? '✓ Real Local Actions' : 'Device Storage'}
          </span>
        </div>

        {totalReports === 0 ? (
          <div className="p-3.5 rounded-xl bg-white border border-indigo-100 text-center text-xs text-slate-600">
            No reports yet. Report an incident to see it here
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-white border border-indigo-100 shadow-2xs">
              <span className="block text-base sm:text-lg font-black font-mono text-indigo-950">{totalReports}</span>
              <span className="text-[10px] font-semibold text-indigo-800 leading-tight block">Reports Logged</span>
            </div>
            <div className="p-2 rounded-xl bg-white border border-indigo-100 shadow-2xs">
              <span className="block text-base sm:text-lg font-black font-mono text-indigo-950">{cpcbEscalated}</span>
              <span className="text-[10px] font-semibold text-indigo-800 leading-tight block">CPCB Escalated</span>
            </div>
            <div className="p-2 rounded-xl bg-white border border-indigo-100 shadow-2xs">
              <span className="block text-base sm:text-lg font-black font-mono text-emerald-700">{resolvedLocally}</span>
              <span className="text-[10px] font-semibold text-emerald-800 leading-tight block">Resolved Locally</span>
            </div>
          </div>
        )}
      </div>

      {/* Cross-Workspace Simulation CTA */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-600">
          Measure commute emission reductions
        </span>
        <button
          type="button"
          onClick={() => onNavigateWorkspace('cleaner-choices')}
          className="px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <span>Open Cleaner Choices</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  );
}
