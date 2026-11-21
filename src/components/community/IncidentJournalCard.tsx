'use client';

import React, { useState } from 'react';
import { PollutionIncident } from '@/domain/community/types';
import { INCIDENT_CATEGORIES } from '@/domain/community/constants';

interface IncidentJournalCardProps {
  readonly incidents: readonly PollutionIncident[];
  readonly onUpdateStatus: (id: string, status: PollutionIncident['status']) => void;
  readonly onDeleteIncident: (id: string) => void;
  readonly onGenerateCpcbComplaint: (incident: PollutionIncident) => string;
}

export function IncidentJournalCard({
  incidents,
  onUpdateStatus,
  onDeleteIncident,
  onGenerateCpcbComplaint,
}: IncidentJournalCardProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyCpcb = (incident: PollutionIncident) => {
    const text = onGenerateCpcbComplaint(incident);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(incident.id);
      onUpdateStatus(incident.id, 'EXPORTED_CPCB');
      setTimeout(() => setCopiedId(null), 3000);
    }
  };

  return (
    <article
      className="p-5 sm:p-6 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xs flex flex-col justify-between gap-4 transition-shadow hover:shadow-md"
      aria-labelledby="incident-journal-heading"
    >
      {/* Header */}
      <div className="flex flex-col gap-1.5 pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl shrink-0" aria-hidden="true">
              📋
            </span>
            <h2
              id="incident-journal-heading"
              className="text-base sm:text-lg font-bold text-[var(--ink-primary)] font-sans tracking-tight"
            >
              Citizen Incident Reports
            </h2>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
            {incidents.length} Saved on Device
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200 shrink-0">
            Complaint Pre-fill
          </span>
          <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
            Review reports recorded on this phone or browser. Download or copy complaint details with one click.
          </p>
        </div>
      </div>

      {/* Incidents List */}
      <div className="space-y-3">
        {incidents.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500 space-y-1">
            <span className="text-2xl block">🌱</span>
            <p className="font-semibold text-slate-700">No local pollution incidents recorded.</p>
            <p className="text-[11px]">Use the form above to document illegal burning, unpaved dust, or industrial plumes.</p>
          </div>
        ) : (
          incidents.map((incident) => {
            const meta = INCIDENT_CATEGORIES[incident.category] || INCIDENT_CATEGORIES.OTHER;
            const timeFormatted = new Date(incident.timestamp).toLocaleString('en-IN', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={incident.id}
                className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-2.5 transition-all hover:border-slate-300"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-lg shrink-0">{meta.icon}</span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                        {incident.title}
                      </h3>
                      <p className="text-[10px] font-mono text-slate-400">
                        {incident.locationName} • {timeFormatted}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                        incident.status === 'EXPORTED_CPCB'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {incident.status === 'EXPORTED_CPCB' ? '✓ CPCB Exported' : 'Local Only'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteIncident(incident.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 text-xs cursor-pointer transition-colors"
                      title="Delete from local journal"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {incident.description}
                </p>

                {incident.photoDataUrl && (
                  <div className="pt-1">
                    <img
                      src={incident.photoDataUrl}
                      alt="Incident photo preview"
                      className="max-w-[220px] max-h-36 object-contain rounded-lg border border-slate-200 bg-slate-50 p-1 shadow-2xs"
                    />
                  </div>
                )}

                {/* Footer Action Ribbon */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-slate-500">
                    CPCB: {meta.cpcbClassification.split('/')[0]}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleCopyCpcb(incident)}
                    className="px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shadow-2xs"
                  >
                    <span>{copiedId === incident.id ? '✓ Copied to Clipboard!' : '📋 Copy CPCB Sameer Dossier'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>⚖️</span>
          <span>
            Citizen reporting is protected under Section 19(5) of the Air (Prevention and Control of Pollution) Act 1981.
          </span>
        </div>
      </div>
    </article>
  );
}
