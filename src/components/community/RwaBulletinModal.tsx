'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface RwaBulletinModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly defaultSocietyName: string;
  readonly onGenerateBulletin: (societyName?: string) => string;
}

export function RwaBulletinModal({
  isOpen,
  onClose,
  defaultSocietyName,
  onGenerateBulletin,
}: RwaBulletinModalProps) {
  const [societyName, setSocietyName] = useState(defaultSocietyName);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'FORMATTED' | 'RAW'>('FORMATTED');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const bulletinText = onGenerateBulletin(societyName);

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(bulletinText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleWhatsAppShare = () => {
    const encoded = encodeURIComponent(bulletinText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rwa-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/40 animate-fadeIn"
    >
      <div className="relative w-full max-w-xl my-auto rounded-3xl bg-white border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-4 max-h-[85vh] flex flex-col justify-between pointer-events-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl shrink-0" aria-hidden="true">📢</span>
            <div>
              <h3 id="rwa-modal-title" className="text-base font-bold text-slate-900 leading-snug">
                Society &amp; RWA Clean-Air Notice Board
              </h3>
              <p className="text-xs text-slate-500">
                Ready for apartment notice boards, elevators, and resident WhatsApp groups.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg text-lg cursor-pointer transition-colors"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Custom Society Name Input & View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="flex-1">
            <label htmlFor="society-name-input" className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-1">
              Society / Apartment Name
            </label>
            <input
              id="society-name-input"
              type="text"
              value={societyName}
              onChange={(e) => setSocietyName(e.target.value)}
              placeholder="e.g. Green Meadows Apartment RWA"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('FORMATTED')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === 'FORMATTED'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📄 Notice Board
            </button>
            <button
              type="button"
              onClick={() => setViewMode('RAW')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === 'RAW'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📝 Plain Text
            </button>
          </div>
        </div>

        {/* Bulletin Content Preview */}
        {viewMode === 'FORMATTED' ? (
          <div className="flex-1 overflow-y-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3.5 select-text">
            {/* Announcement Banner */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-slate-900 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-amber-900 uppercase tracking-wider">
                  📢 Official Advisory
                </span>
                <span className="text-[10px] font-mono font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                  Level 2 (Very Poor Air)
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                {societyName.trim() || 'Green Meadows Apartment RWA'}
              </h4>
              <p className="text-[11px] text-slate-600">
                Actionable guidelines to safeguard residents, children, and seniors during winter smog.
              </p>
            </div>

            {/* Current Air Quality Alert Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 space-y-0.5">
                <span className="text-[10px] font-mono font-bold text-rose-800 uppercase block">Active Outdoor Air</span>
                <span className="text-sm font-black text-rose-950">CPCB AQI 378 (Hazardous)</span>
                <p className="text-[10px] text-rose-900">High concentrations of PM2.5 soot in the neighborhood.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 space-y-0.5">
                <span className="text-[10px] font-mono font-bold text-amber-800 uppercase block">Weather Condition</span>
                <span className="text-sm font-black text-amber-950">Surface Inversion Lid (&lt;150m)</span>
                <p className="text-[10px] text-amber-900">Cold air traps ground smoke and dust until afternoon.</p>
              </div>
            </div>

            {/* 4 Clear Resident Protocols */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider block">
                Resident Welfare Association (RWA) Action Protocols:
              </span>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                  <span className="text-sm">🚫</span>
                  <span>1. Zero Open Garbage &amp; Leaf Burning</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed pl-5">
                  Security guards, maintenance staff, and gardeners must strictly avoid burning waste or dry leaves. Electric radiant heaters must be provided to night-shift gate staff.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                  <span className="text-sm">🪟</span>
                  <span>2. Safe Window Opening Timing (1:00 PM – 4:00 PM)</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed pl-5">
                  Keep balcony doors and windows firmly sealed during peak morning inversion (7:00–10:00 AM). Airing out rooms is safest in the early afternoon when sunlight elevates the mixing height.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                  <span className="text-sm">🚸</span>
                  <span>3. Protection for Children &amp; Senior Citizens</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed pl-5">
                  Young children, asthmatics, and elderly residents should avoid strenuous morning walks or outdoor playground activities. Wear well-fitted N95 masks for necessary commutes.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                  <span className="text-sm">🚗</span>
                  <span>4. Shared Carpooling &amp; Public Transit</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed pl-5">
                  Coordinate neighborhood office carpools or use electric metro lines to reduce neighborhood vehicle exhaust in congested colony gates.
                </p>
              </div>
            </div>

            <div className="text-[10px] font-mono text-slate-500 text-center pt-1 border-t border-slate-200">
              🛡️ Working Together for Cleaner Neighborhood Air • AirAware Environmental Intelligence
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed select-all">
            {bulletinText}
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <span className="text-[11px] text-slate-500 font-sans">
            Ready for instant dispatch. Zero cloud storage required.
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>📲</span>
              <span>Open in WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>{copied ? '✓ Copied to Clipboard!' : '📋 Copy Clean Text'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
