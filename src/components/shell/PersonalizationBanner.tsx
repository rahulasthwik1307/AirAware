'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { WorkspaceKey } from '@/domain/types';

interface PersonalizationBannerProps {
  readonly onOpenSetup: (workspace: WorkspaceKey) => void;
}

const STORAGE_KEY = 'airaware_personalization_banner_dismissed';

function subscribeToStorage(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getDismissedSnapshot(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getServerSnapshot(): null {
  return null;
}

export function PersonalizationBanner({ onOpenSetup }: PersonalizationBannerProps) {
  const isDismissedStored = useSyncExternalStore(
    subscribeToStorage,
    getDismissedSnapshot,
    getServerSnapshot
  );

  const [localDismissed, setLocalDismissed] = useState(false);

  if (isDismissedStored === 'true' || localDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setLocalDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Ignore storage quota errors
    }
  };

  return (
    <aside
      aria-label="Personalization Onboarding Banner"
      className="mb-6 rounded-2xl border border-[var(--brand-primary)]/20 bg-gradient-to-r from-[var(--brand-surface)] via-white to-[var(--brand-surface)] p-4 sm:p-5 shadow-xs transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-[var(--border-subtle)] text-lg shadow-xs select-none"
            aria-hidden="true"
          >
            🌱
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-bold text-[var(--ink-primary)] font-sans">
              Personalize Your Clean-Air Plan
            </h2>
            <p className="text-xs text-[var(--ink-secondary)] mt-0.5 leading-relaxed">
              Tailor low-emission daily routines, school commutes, and indoor smog advice to your household. Profiles will persist strictly in local browser storage (localStorage). Zero cloud accounts or server tracking.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pl-12 sm:pl-0">
          <button
            type="button"
            onClick={() => onOpenSetup('family-planner')}
            className="px-3.5 py-1.5 rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-xs font-mono font-bold shadow-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
          >
            Quick Setup
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-[var(--surface-subtle)] text-[var(--ink-secondary)] text-xs font-mono font-medium border border-[var(--border-subtle)] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
            aria-label="Dismiss personalization banner and explore anonymously"
          >
            Explore Anonymously ✕
          </button>
        </div>
      </div>
    </aside>
  );
}
