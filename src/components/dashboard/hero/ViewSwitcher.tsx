'use client';

import React, { useRef } from 'react';
import type { HeroViewMode } from './types';

interface ViewSwitcherProps {
  readonly activeView: HeroViewMode;
  readonly onSelectView: (view: HeroViewMode) => void;
}

export const ViewSwitcher = React.memo(function ViewSwitcher({
  activeView,
  onSelectView,
}: ViewSwitcherProps) {
  const tabListRef = useRef<HTMLDivElement>(null);

  const handleTabKeyDown = (e: React.KeyboardEvent) => {
    const tabKeys: HeroViewMode[] = ['overview', 'compare', 'globe'];
    const currentIndex = tabKeys.indexOf(activeView);
    let nextIndex = currentIndex;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % tabKeys.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + tabKeys.length) % tabKeys.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = tabKeys.length - 1;
    } else {
      return;
    }
    const nextView = tabKeys[nextIndex];
    onSelectView(nextView);
    const targetBtn = tabListRef.current?.querySelector<HTMLButtonElement>(`#tab-${nextView}`);
    targetBtn?.focus();
  };

  return (
    <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/85 backdrop-blur-md border border-slate-200/90 shadow-2xs">
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              activeView === 'overview'
                ? 'bg-emerald-400'
                : activeView === 'compare'
                ? 'bg-sky-400'
                : 'bg-indigo-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              activeView === 'overview'
                ? 'bg-emerald-500'
                : activeView === 'compare'
                ? 'bg-sky-500'
                : 'bg-indigo-500'
            }`}
          />
        </span>
        <span className="text-xs font-mono font-bold text-slate-800 tracking-tight">
          {activeView === 'overview'
            ? 'Live Airshed Telemetry'
            : activeView === 'compare'
            ? 'Regional Airshed Grid'
            : '3D Earth Atmospheric Dispersion'}
        </span>
      </div>

      {/* View Switcher: Accessible 3-Option Segmented Control */}
      <div
        ref={tabListRef}
        role="tablist"
        aria-label="Environmental view mode"
        className="inline-flex p-1 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xs text-xs font-mono font-bold gap-1 self-start sm:self-auto"
        onKeyDown={handleTabKeyDown}
      >
        <button
          id="tab-overview"
          role="tab"
          type="button"
          aria-selected={activeView === 'overview'}
          aria-controls="panel-overview"
          tabIndex={activeView === 'overview' ? 0 : -1}
          onClick={() => onSelectView('overview')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 font-bold tactile-btn ${
            activeView === 'overview'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          <span aria-hidden="true">🌤️</span>
          <span>Overview</span>
        </button>
        <button
          id="tab-compare"
          role="tab"
          type="button"
          aria-selected={activeView === 'compare'}
          aria-controls="panel-compare"
          tabIndex={activeView === 'compare' ? 0 : -1}
          onClick={() => onSelectView('compare')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 font-bold tactile-btn ${
            activeView === 'compare'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          <span aria-hidden="true">🇮🇳</span>
          <span>Regional compare</span>
        </button>
        <button
          id="tab-globe"
          role="tab"
          type="button"
          aria-selected={activeView === 'globe'}
          aria-controls="panel-globe"
          tabIndex={activeView === 'globe' ? 0 : -1}
          onClick={() => onSelectView('globe')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 font-bold tactile-btn ${
            activeView === 'globe'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          <span aria-hidden="true">🌐</span>
          <span>3D globe</span>
        </button>
      </div>
    </div>
  );
});
