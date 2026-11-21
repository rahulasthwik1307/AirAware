'use client';

import React, { useState, useRef } from 'react';
import { IncidentCategory, IncidentSeverity, PollutionIncident } from '@/domain/community/types';
import { INCIDENT_CATEGORIES } from '@/domain/community/constants';

interface PollutionIncidentReporterCardProps {
  readonly defaultLocationName: string;
  readonly onSubmitIncident: (incident: Omit<PollutionIncident, 'id' | 'timestamp' | 'status'>) => void;
  readonly onAskCopilot: (prompt: string) => void;
}

export function PollutionIncidentReporterCard({
  defaultLocationName,
  onSubmitIncident,
  onAskCopilot,
}: PollutionIncidentReporterCardProps) {
  const [category, setCategory] = useState<IncidentCategory>('WASTE_BURNING');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState(defaultLocationName);
  const [severity, setSeverity] = useState<IncidentSeverity>('HIGH');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoInfo, setPhotoInfo] = useState<{ name: string; sizeMb: string } | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-format & scale photo client-side using HTML5 Canvas (preserves full aspect ratio, max 3MB support)
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);

    // Support photos up to 3MB
    if (file.size > 3 * 1024 * 1024) {
      setPhotoError('Please select a photo under 3MB.');
      return;
    }

    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    setPhotoInfo({ name: file.name, sizeMb });

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Auto-scale maintaining exact aspect ratio without cropping any detail
        const maxDimension = 960;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Export high-quality balanced JPEG (<150KB for local storage)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setPhotoDataUrl(compressedDataUrl);
        }
      };
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    onSubmitIncident({
      category,
      title: title.trim() || `${INCIDENT_CATEGORIES[category].label} incident`,
      description: description.trim(),
      locationName: locationName.trim() || defaultLocationName,
      severity,
      photoDataUrl: photoDataUrl || undefined,
    });

    setIsSubmitting(false);
    setTitle('');
    setDescription('');
    setPhotoDataUrl(null);
    setPhotoInfo(null);
    setPhotoError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 4000);
  };

  const handleUseGps = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocationName(`GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        },
        () => {
          alert('Location permission denied or unavailable. Please enter landmark manually.');
        }
      );
    }
  };

  return (
    <article
      className="p-5 sm:p-6 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xs flex flex-col justify-between gap-4 transition-shadow hover:shadow-md"
      aria-labelledby="incident-reporter-heading"
    >
      {/* Header */}
      <div className="flex flex-col gap-1.5 pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0" aria-hidden="true">
              📸
            </span>
            <h2
              id="incident-reporter-heading"
              className="text-base font-bold text-[var(--ink-primary)] font-sans tracking-tight whitespace-nowrap"
            >
              Report Pollution Incident
            </h2>
          </div>
          <button
            type="button"
            onClick={() =>
              onAskCopilot(
                `How do I officially report an illegal ${INCIDENT_CATEGORIES[category].label} violation to the Delhi Pollution Control Committee or CPCB Sameer? What laws protect citizens?`
              )
            }
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] text-[var(--brand-primary)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/40 shadow-2xs transition-colors shrink-0 cursor-pointer"
            title="Ask Copilot about reporting legal channels"
          >
            <span className="text-sm">🤖</span>
            <span>Legal Rights</span>
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-indigo-50 text-indigo-800 border border-indigo-200 shrink-0">
            Local-First Journal
          </span>
          <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
            Document visible emissions. Stored 100% locally on your device with CPCB Sameer pre-fill.
          </p>
        </div>
      </div>

      {/* Success Notification Toast */}
      {showSuccessToast && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-[10px]">✓</span>
            <span className="font-semibold">Incident logged to local journal! Ready for CPCB export below.</span>
          </div>
          <button
            type="button"
            onClick={() => setShowSuccessToast(false)}
            className="text-slate-400 hover:text-slate-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Incident Submission Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Category Selector Chips */}
        <div>
          <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Select Incident Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {Object.values(INCIDENT_CATEGORIES).map((meta) => {
              const isSelected = category === meta.category;
              return (
                <button
                  key={meta.category}
                  type="button"
                  onClick={() => setCategory(meta.category)}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 tactile-btn ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20 shadow-2xs font-bold text-indigo-950'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-base shrink-0">{meta.icon}</span>
                  <span className="text-[11px] leading-snug break-words">{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Location & GPS Button */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="incident-location" className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
              Location / Landmark
            </label>
            <button
              type="button"
              onClick={handleUseGps}
              className="text-[10px] font-mono text-indigo-700 hover:text-indigo-900 font-semibold cursor-pointer"
            >
              📍 Auto-Detect GPS
            </button>
          </div>
          <input
            id="incident-location"
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="e.g. Near Community Center, Pocket 3"
            required
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>

        {/* Description Textarea */}
        <div>
          <label htmlFor="incident-desc" className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-1">
            Violation Description
          </label>
          <textarea
            id="incident-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you observed: color of smoke, intensity, affected roadway or school zone..."
            required
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
          />
        </div>

        {/* Severity Selector & Photo Upload */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Severity */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-1">
              Severity Level
            </label>
            <div className="flex items-center gap-1.5">
              {(['HIGH', 'MEDIUM', 'LOW'] as IncidentSeverity[]).map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverity(sev)}
                  className={`flex-1 py-1.5 text-[11px] font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                    severity === sev
                      ? sev === 'HIGH'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                        : sev === 'MEDIUM'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                        : 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Photo Attachment (Auto-sized, supports up to 3MB) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="incident-photo" className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 cursor-pointer">
                Attach Photo (Optional)
              </label>
              <span className="text-[10px] font-mono text-slate-400">Max 3MB</span>
            </div>
            <input
              id="incident-photo"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              aria-label="Upload photo of pollution incident"
              onChange={handlePhotoSelect}
              className="text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border file:border-slate-300 file:bg-slate-50 file:text-[11px] file:font-semibold file:cursor-pointer text-slate-500 cursor-pointer w-full"
            />
            {photoError && (
              <p className="text-[11px] text-rose-600 mt-1 font-mono font-semibold">{photoError}</p>
            )}
            {photoDataUrl && (
              <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-emerald-800 font-bold flex items-center gap-1">
                    ✓ Photo attached ({photoInfo?.sizeMb} MB auto-sized)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoDataUrl(null);
                      setPhotoInfo(null);
                      setPhotoError(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer transition-colors"
                  >
                    Remove
                  </button>
                </div>
                <div className="flex justify-center bg-white rounded-lg p-1.5 border border-slate-200 shadow-2xs">
                  <img
                    src={photoDataUrl}
                    alt="Uploaded incident preview"
                    className="max-h-36 w-auto max-w-full object-contain rounded"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !description.trim()}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer tactile-btn flex items-center justify-center gap-2"
        >
          <span>💾</span>
          <span>Save Incident to Local Device Journal</span>
        </button>
      </form>

      {/* Privacy Guarantee Footer */}
      <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 text-[11px] text-indigo-950 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>🔒</span>
          <span>
            <strong>100% Offline Privacy:</strong> Reports stay on your browser. Zero cloud tracking.
          </span>
        </div>
      </div>
    </article>
  );
}
