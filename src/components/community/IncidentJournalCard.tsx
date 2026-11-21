'use client';

import React, { useState, useMemo } from 'react';
import { PollutionIncident } from '@/domain/community/types';
import { INCIDENT_CATEGORIES } from '@/domain/community/constants';
import { formatSocietyIncidentNotice, formatMunicipalComplaint } from '@/domain/community/generator';

interface IncidentJournalCardProps {
  readonly incidents: readonly PollutionIncident[];
  readonly onUpdateStatus: (id: string, status: PollutionIncident['status']) => void;
  readonly onDeleteIncident: (id: string) => void;
  readonly onGenerateCpcbComplaint: (incident: PollutionIncident) => string;
}

function dataUrlToFile(dataUrl: string, filename: string): File | null {
  try {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  } catch {
    return null;
  }
}

function triggerPhotoDownload(dataUrl: string, incidentId: string) {
  try {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `incident-photo-${incidentId.slice(0, 8)}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch {
    // Ignore in non-browser env
  }
}

export function IncidentJournalCard({
  incidents,
  onUpdateStatus,
  onDeleteIncident,
  onGenerateCpcbComplaint,
}: IncidentJournalCardProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadedId, setDownloadedId] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredIncidents = useMemo(() => {
    if (selectedCategory === 'ALL') return incidents;
    return incidents.filter((inc) => inc.category === selectedCategory);
  }, [incidents, selectedCategory]);

  const incidentCategories = useMemo(() => {
    const set = new Set<string>();
    incidents.forEach((inc) => set.add(inc.category));
    return Array.from(set);
  }, [incidents]);

  const handleCopyCpcb = (incident: PollutionIncident) => {
    const text = onGenerateCpcbComplaint(incident);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(incident.id);
      onUpdateStatus(incident.id, 'EXPORTED_CPCB');
      setTimeout(() => setCopiedId(null), 3000);
    }
  };

  /**
   * Unified WhatsApp & Grievance Dispatcher
   * When photo is present: Triggers native OS share flyout with file + caption (Windows / Android / iOS).
   * Fallback for desktop web: Copies image to clipboard, downloads photo file, and opens WhatsApp Web with pre-formatted text.
   */
  const handleShareIncident = async (incident: PollutionIncident, mode: 'SOCIETY' | 'MUNICIPAL') => {
    const isMunicipal = mode === 'MUNICIPAL';
    const text = isMunicipal ? formatMunicipalComplaint(incident) : formatSocietyIncidentNotice(incident);
    if (isMunicipal) {
      onUpdateStatus(incident.id, 'EXPORTED_CPCB');
    }

    // When a photo is attached, try native share with file first
    if (incident.photoDataUrl) {
      if (typeof navigator !== 'undefined' && navigator.share) {
        const file = dataUrlToFile(incident.photoDataUrl, `incident-${incident.id.slice(0, 8)}.jpg`);
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: incident.title,
              text,
              files: [file],
            });
            setShareStatus(`✓ Shared photo & ${isMunicipal ? 'municipal grievance' : 'society notice'} for #${incident.id.slice(0, 6)}`);
            setTimeout(() => setShareStatus(null), 4000);
            return;
          } catch {
            // User cancelled share flyout or OS rejected file; proceed to desktop clipboard fallback
          }
        }
      }

      // Laptop / Desktop Fallback:
      // 1. Copy image to system clipboard so user can press Ctrl+V in WhatsApp Web
      try {
        const res = await fetch(incident.photoDataUrl);
        const blob = await res.blob();
        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
          await navigator.clipboard.write([
            new ClipboardItem({ [blob.type]: blob }),
          ]);
        }
      } catch {
        // Ignore clipboard write restrictions
      }

      // 2. Download photo file to user's downloads as backup
      triggerPhotoDownload(incident.photoDataUrl, incident.id);

      // 3. Open WhatsApp Web with the pre-formatted text
      const encoded = encodeURIComponent(text);
      window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');

      // 4. Show friendly guidance toast
      setShareStatus(`📸 Photo copied to clipboard & downloaded! In WhatsApp, press Ctrl+V to attach photo with text.`);
      setTimeout(() => setShareStatus(null), 7000);
      return;
    }

    // No photo: open WhatsApp directly with pre-formatted text
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleDownloadPhoto = (incident: PollutionIncident) => {
    if (!incident.photoDataUrl) return;
    triggerPhotoDownload(incident.photoDataUrl, incident.id);
    setDownloadedId(incident.id);
    setTimeout(() => setDownloadedId(null), 3000);
  };

  return (
    <article
      className="p-5 sm:p-6 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xs flex flex-col justify-between gap-4 transition-shadow hover:shadow-md"
      aria-labelledby="incident-journal-heading"
    >
      {/* Header */}
      <div className="flex flex-col gap-1.5 pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0" aria-hidden="true">
              📋
            </span>
            <h2
              id="incident-journal-heading"
              className="text-base font-bold text-[var(--ink-primary)] font-sans tracking-tight whitespace-nowrap"
            >
              Saved Community Reports
            </h2>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
            {incidents.length} Saved on Device
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200 shrink-0">
            Fast Community Action
          </span>
          <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
            Saved safely on this phone or browser. Instant WhatsApp dispatch to your society or municipal helplines.
          </p>
        </div>
      </div>

      {/* Explanatory Guidance Banner: How Incident Reporting Works */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-white to-emerald-50/80 border border-indigo-200/90 text-xs space-y-1.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[11px]">
            <span>💡</span>
            <span>How This Feature Solves Real Neighborhood Problems:</span>
          </div>
          <span className="text-[10px] font-mono font-bold text-indigo-800 bg-indigo-100/70 px-2 py-0.5 rounded border border-indigo-200">
            No Courts • Immediate Results
          </span>
        </div>
        <p className="text-slate-600 leading-relaxed text-[11px]">
          Normal citizens don&apos;t want to file court petitions or argue with authorities. When you record an incident here, you can <strong>alert your society WhatsApp group</strong> in one tap to douse the fire immediately and provide electric heaters to night guards, or forward structured evidence to <strong>municipal helplines</strong>.
        </p>
      </div>

      {shareStatus && (
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center gap-1.5 animate-fadeIn">
          <span>✓</span>
          <span>{shareStatus}</span>
        </div>
      )}

      {/* Category Filter Pills (if multiple categories present) */}
      {incidents.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs select-none" role="tablist">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border tactile-btn ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            All ({incidents.length})
          </button>
          {incidentCategories.map((catKey) => {
            const meta = INCIDENT_CATEGORIES[catKey as keyof typeof INCIDENT_CATEGORIES] || INCIDENT_CATEGORIES.OTHER;
            const count = incidents.filter((i) => i.category === catKey).length;
            const isSelected = selectedCategory === catKey;
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setSelectedCategory(catKey)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border flex items-center gap-1 tactile-btn ${
                  isSelected
                    ? 'bg-indigo-900 text-white border-indigo-900 shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                <span>{meta.icon}</span>
                <span>{meta.label.split(' ')[0]} ({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Incidents List with Bounded Smooth Scroll */}
      <div className="space-y-3.5 max-h-[560px] overflow-y-auto pr-1">
        {filteredIncidents.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500 space-y-1">
            <span className="text-2xl block">🌱</span>
            <p className="font-semibold text-slate-700">No local pollution incidents recorded yet.</p>
            <p className="text-[11px]">Use the form above to document illegal garbage burning, road dust, or smoky industrial chimneys.</p>
          </div>
        ) : (
          filteredIncidents.map((incident) => {
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
                className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3 transition-all hover:border-slate-300"
              >
                {/* Title & Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-lg shrink-0">{meta.icon}</span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug break-words">
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
                      {incident.status === 'EXPORTED_CPCB' ? '✓ Dispatched' : 'Local Only'}
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

                {/* Violation Description */}
                <p className="text-xs text-slate-600 leading-relaxed break-words">
                  {incident.description}
                </p>

                {/* Photo Preview (Clean, without duplicate download button) */}
                {incident.photoDataUrl && (
                  <div className="pt-1">
                    <img
                      src={incident.photoDataUrl}
                      alt="Incident photo evidence"
                      className="max-w-[200px] max-h-32 object-contain rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-2xs"
                    />
                  </div>
                )}

                {/* Actionable Community Response Buttons */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>Category: {meta.cpcbClassification.split('/')[0]}</span>
                    <span>Ready for Action</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Action 1: Society WhatsApp */}
                    <button
                      type="button"
                      onClick={() => handleShareIncident(incident, 'SOCIETY')}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs tactile-btn"
                      title="Send polite alert to society WhatsApp group"
                    >
                      <span>📢</span>
                      <span>Alert to Society</span>
                    </button>

                    {/* Action 2: Municipal Helpline WhatsApp */}
                    <button
                      type="button"
                      onClick={() => handleShareIncident(incident, 'MUNICIPAL')}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs tactile-btn"
                      title="Forward official complaint to Municipal helpline"
                    >
                      <span>📲</span>
                      <span>Municipal Grievance</span>
                    </button>

                    {/* Action 3: Download Photo Backup (only if photo present) */}
                    {incident.photoDataUrl && (
                      <button
                        type="button"
                        onClick={() => handleDownloadPhoto(incident)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs sm:col-span-1 tactile-btn"
                        title="Download photo evidence file to your device"
                      >
                        <span>📥</span>
                        <span>{downloadedId === incident.id ? '✓ Photo Saved' : 'Save Photo Backup'}</span>
                      </button>
                    )}

                    {/* Action 4: Copy Full Dossier */}
                    <button
                      type="button"
                      onClick={() => handleCopyCpcb(incident)}
                      className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-xl border transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs tactile-btn ${
                        incident.photoDataUrl ? 'sm:col-span-1' : 'sm:col-span-2'
                      } ${
                        copiedId === incident.id
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                      title="Copy full formal dossier for environmental portals or email complaints"
                    >
                      <span>📋</span>
                      <span>{copiedId === incident.id ? '✓ Copied to Clipboard!' : 'Copy Formal Dossier'}</span>
                    </button>
                  </div>
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
