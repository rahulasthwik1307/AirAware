'use client';

import React, { useState } from 'react';

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

  if (!isOpen) return null;

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rwa-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
    >
      <div className="relative w-full max-w-xl rounded-3xl bg-white border border-slate-200 shadow-xl p-5 sm:p-6 space-y-4 max-h-[90vh] flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📢</span>
            <div>
              <h3 id="rwa-modal-title" className="text-base font-bold text-slate-900">
                RWA &amp; Society Clean-Air Advisory Dispatcher
              </h3>
              <p className="text-xs text-slate-500">
                Formatted for apartment notice boards and residential WhatsApp groups.
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

        {/* Custom Society Name Input */}
        <div>
          <label htmlFor="society-name-input" className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-1">
            Society / Colony / Apartment Name
          </label>
          <input
            id="society-name-input"
            type="text"
            value={societyName}
            onChange={(e) => setSocietyName(e.target.value)}
            placeholder="e.g. Green Meadows Society RWA"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>

        {/* Pre-Formatted Bulletin Preview Box */}
        <div className="flex-1 overflow-y-auto p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed select-all">
          {bulletinText}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <span className="text-[11px] text-slate-500 font-sans">
            Ready for instant dispatch. Zero cloud storage required.
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>📲</span>
              <span>Open in WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>{copied ? '✓ Copied!' : '📋 Copy Text'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
