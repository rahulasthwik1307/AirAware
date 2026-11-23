'use client';

import React, { useState, useEffect, useRef } from 'react';

interface AppFooterProps {
  readonly onClearDataConfirm: () => void;
}

export function AppFooter({ onClearDataConfirm }: AppFooterProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);
  const clearDialogRef = useRef<HTMLDivElement | null>(null);
  const clearOpenerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (showClearConfirm) {
      clearOpenerRef.current = document.activeElement as HTMLElement | null;
      cancelBtnRef.current?.focus();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setShowClearConfirm(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    } else if (clearOpenerRef.current) {
      clearOpenerRef.current.focus();
    }
  }, [showClearConfirm]);

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

  const handleConfirm = () => {
    setShowClearConfirm(false);
    onClearDataConfirm();
  };

  return (
    <>
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
                onClick={handleConfirm}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all cursor-pointer shadow-xs"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
