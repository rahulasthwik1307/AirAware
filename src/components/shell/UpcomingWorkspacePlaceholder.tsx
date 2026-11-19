'use client';

import React from 'react';
import { WorkspaceKey } from '@/domain/types';

interface UpcomingWorkspacePlaceholderProps {
  readonly workspace: WorkspaceKey;
  readonly onReturnToLive: () => void;
}

interface WorkspaceDetails {
  readonly title: string;
  readonly phaseLabel: string;
  readonly icon: string;
  readonly summary: string;
  readonly features: readonly {
    readonly title: string;
    readonly description: string;
  }[];
}

const WORKSPACE_DATA: Record<Exclude<WorkspaceKey, 'air-intelligence'>, WorkspaceDetails> = {
  'family-planner': {
    title: 'Family Daily Planner',
    phaseLabel: 'Scheduled for Phase 3 Implementation',
    icon: '📅',
    summary:
      'Bridge atmospheric forecast curves with real-life family schedules to suggest low-emission routines and minimize toxic exposure during winter thermal inversions.',
    features: [
      {
        title: 'Multi-Member Household Profiles (Up to 4)',
        description: 'Anonymous schedules for school runs, office commutes, elderly walks, and home chores stored 100% locally.',
      },
      {
        title: 'Diurnal Smog Correlation & Mixing Windows',
        description: 'Maps forecasted morning trapping and convective mixing against personal schedules without speculative claims.',
      },
      {
        title: 'The Actionable Routine Loop',
        description: 'Adopt, edit, complete, and dismiss practical habits with defensible modelled ambient concentration difference (+ΔC) tracking.',
      },
    ],
  },
  'indoor-air': {
    title: 'Indoor Air Intelligence',
    phaseLabel: 'Scheduled for Phase 4 Implementation',
    icon: '🏡',
    summary:
      'Practical, accessible, and low-cost indoor air protection during severe winter smog episodes without claiming unverified physical sensor readings.',
    features: [
      {
        title: 'Dynamic Outdoor Ventilation Window Advisor',
        description: 'Scans Open-Meteo CAMS forecast trends to locate diurnal periods of lowest predicted ambient concentrations.',
      },
      {
        title: 'Corsi-Rosenthal DIY Box Fan Blueprint',
        description: 'Transparent materials, MERV 13 filter specifications, and research-backed Clean Air Delivery Rate (CADR) benchmarks.',
      },
      {
        title: 'Kitchen & Combustion Mitigation Protocols',
        description: 'Range hood exhaust timing, rear burner priority, and particulate dust suppression guidance.',
      },
    ],
  },
  'cleaner-choices': {
    title: 'Cleaner Choices & Impact',
    phaseLabel: 'Scheduled for Phase 6 Implementation',
    icon: '🌱',
    summary:
      'Empower sustainable everyday decisions, compare transit alternatives side-by-side, and track verified personal habits with strict scientific integrity.',
    features: [
      {
        title: 'Sustainable Commute & Lifestyle Comparator',
        description: 'Side-by-side emissions comparison across solo car, electric rail, clean bus, carpool, and active travel.',
      },
      {
        title: 'Dual-Impact Integrity Dashboard',
        description: 'Strictly separates personal exposure defense from environmental emissions avoided. Never claims personal travel cleans city AQI.',
      },
      {
        title: 'Auditable Cumulative Calculations',
        description: 'Discloses vehicle baselines, occupancy factors, and geographically appropriate, dated emission factors.',
      },
    ],
  },
};

export function UpcomingWorkspacePlaceholder({
  workspace,
  onReturnToLive,
}: UpcomingWorkspacePlaceholderProps) {
  if (workspace === 'air-intelligence') return null;

  const data = WORKSPACE_DATA[workspace];

  return (
    <section
      aria-labelledby="upcoming-workspace-title"
      className="w-full space-y-6 animate-fadeIn py-4"
    >
      {/* Header Banner */}
      <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-8 sm:p-12 text-center shadow-xs">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand-surface)] text-3xl border border-[var(--border-subtle)] mb-4 shadow-xs select-none">
          {data.icon}
        </div>

        <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-[var(--brand-surface)] text-[var(--brand-primary)] border border-[var(--border-subtle)] mb-3 uppercase tracking-wider">
          {data.phaseLabel}
        </span>

        <h1
          id="upcoming-workspace-title"
          className="text-2xl sm:text-3xl font-extrabold text-[var(--ink-primary)] tracking-tight font-sans"
        >
          {data.title}
        </h1>

        <p className="mt-3 text-sm text-[var(--ink-secondary)] max-w-2xl mx-auto leading-relaxed">
          {data.summary}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onReturnToLive}
            className="px-5 py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-xs font-mono font-bold shadow-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
          >
            🌍 Return to Live Air Intelligence
          </button>
        </div>
      </div>

      {/* Feature Specification Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.features.map((feat, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-xs"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--surface-subtle)] text-[11px] font-mono font-bold text-[var(--brand-primary)]">
                0{idx + 1}
              </span>
              <h2 className="text-xs font-bold text-[var(--ink-primary)] font-sans">
                {feat.title}
              </h2>
            </div>
            <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed">
              {feat.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
