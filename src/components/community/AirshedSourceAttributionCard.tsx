'use client';

import { useState, useMemo } from 'react';
import { WorkspaceKey } from '@/domain/types';
import { isDelhiNcrRegion } from '@/domain/community/generator';

interface AirshedSourceAttributionCardProps {
  readonly locationName: string;
  readonly onNavigateWorkspace: (workspace: WorkspaceKey) => void;
  readonly onAskCopilot: (prompt: string) => void;
}

export function AirshedSourceAttributionCard({
  locationName,
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
        percentage: 42,
        color: '#E11D48',
        bgTrackColor: '#FFE4E6',
        icon: '🔥',
        primaryPollutant: 'Elemental Black Carbon & Fine VOCs',
        mitigationAction: 'Provide electric radiant heaters to gate guards; prohibit dry garden burning.',
        cpcbRule: 'Air Act 1981 §19(5) Ban',
      },
      {
        id: 'road-dust',
        label: 'Road & Construction Dust (C&D)',
        percentage: 33,
        color: '#0284C7',
        bgTrackColor: '#E0F2FE',
        icon: '🏗️',
        primaryPollutant: 'Coarse PM₁₀ & Respirable Silica',
        mitigationAction: 'Enforce continuous tarpaulin sheet coverage & mechanical water misting.',
        cpcbRule: 'C&D Waste Rules 2016',
      },
      {
        id: 'vehicular',
        label: 'Vehicular Tailpipe & Idling Smog',
        percentage: 25,
        color: '#6366F1',
        bgTrackColor: '#EEF2FF',
        icon: '🚗',
        primaryPollutant: 'NOx Precursors & Ultrafine Particles',
        mitigationAction: isNcr
          ? 'Switch to electric Delhi Metro transit; avoid cold engine idling at gates.'
          : 'Switch to public rapid transit / electric bus; avoid cold engine idling at gates.',
        cpcbRule: isNcr ? 'CAQM GRAP Stage II/III Mandate' : 'CPCB National Clean Air Program',
      },
    ];
  }, [locationName]);

  return (
    <article
      className="p-5 sm:p-6 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xs flex flex-col justify-between gap-4 transition-shadow hover:shadow-md"
      aria-labelledby="source-attribution-heading"
    >
      {/* Header */}
      <div className="flex flex-col gap-1.5 pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0" aria-hidden="true">
              🏭
            </span>
            <h2
              id="source-attribution-heading"
              className="text-base font-bold text-[var(--ink-primary)] font-sans tracking-tight whitespace-nowrap"
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
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] text-[var(--brand-primary)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/40 shadow-2xs transition-colors shrink-0 cursor-pointer"
            title="Ask Copilot about source apportionment science"
          >
            <span className="text-sm">🤖</span>
            <span>Sources</span>
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200 shrink-0">
            CPCB &amp; Citizen Observations
          </span>
          <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
            Estimated contribution to local ground-level PM₂.₅ stagnation in {locationName}.
          </p>
        </div>
      </div>

      {/* Interactive Source Contribution Breakdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>SOURCE APPORTIONMENT BREAKDOWN</span>
          <span>EST. INVERSION SHARE</span>
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
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-base" aria-hidden="true">{src.icon}</span>
                  <span className="text-xs font-bold text-slate-900">{src.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-extrabold text-slate-900">
                    {src.percentage}%
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {src.cpcbRule}
                  </span>
                </div>
              </div>

              {/* Progress Track */}
              <div
                className="w-full h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: src.bgTrackColor }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${src.percentage}%`,
                    backgroundColor: src.color,
                  }}
                />
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

      {/* Community Action Scoreboard */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-teal-50/60 border border-indigo-200/80 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono font-bold text-indigo-900">
          <span>NEIGHBORHOOD ACTION IMPACT</span>
          <span className="text-emerald-700">✓ Community Simulation</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-xl bg-white border border-indigo-100 shadow-2xs">
            <span className="block text-base sm:text-lg font-black font-mono text-indigo-950">4</span>
            <span className="text-[10px] font-semibold text-indigo-800 leading-tight block">Alerts Dispatched</span>
          </div>
          <div className="p-2 rounded-xl bg-white border border-indigo-100 shadow-2xs">
            <span className="block text-base sm:text-lg font-black font-mono text-indigo-950">2</span>
            <span className="text-[10px] font-semibold text-indigo-800 leading-tight block">CPCB Escalated</span>
          </div>
          <div className="p-2 rounded-xl bg-white border border-indigo-100 shadow-2xs">
            <span className="block text-base sm:text-lg font-black font-mono text-emerald-700">~18 kg</span>
            <span className="text-[10px] font-semibold text-emerald-800 leading-tight block">Soot Prevented</span>
          </div>
        </div>
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
          <span>🚗</span>
          <span>Simulate Transit Savings →</span>
        </button>
      </div>
    </article>
  );
}
