'use client';

import React, { useState } from 'react';
import { PlannerRecommendation } from '@/domain/planner/types';
import { ImpactSummaryBadge } from './ImpactSummaryBadge';

interface RecommendationCardProps {
  readonly recommendation: PlannerRecommendation;
  readonly isAdopted: boolean;
  readonly onAdopt: (rec: PlannerRecommendation) => void;
}

const TYPE_CONFIG = {
  TIMING_SHIFT: {
    label: 'Timing Shift',
    icon: '⏰',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  INDOOR_ALTERNATIVE: {
    label: 'Indoor Alternative',
    icon: '🏡',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  TRANSIT_ADJUSTMENT: {
    label: 'Transit Shift',
    icon: '🚲',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  VENTILATION_WINDOW: {
    label: 'Ventilation Window',
    icon: '🪟',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  PROTECTIVE_HABIT: {
    label: 'Protective Measure',
    icon: '🛡️',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
  },
};

export function RecommendationCard({
  recommendation,
  isAdopted,
  onAdopt,
}: RecommendationCardProps) {
  const [isWhyOpen, setIsWhyOpen] = useState(false);
  const config = TYPE_CONFIG[recommendation.type] ?? TYPE_CONFIG.PROTECTIVE_HABIT;

  return (
    <article
      className={`rounded-2xl border bg-[var(--surface-card)] p-4 sm:p-5 shadow-xs transition-all hover:border-[var(--brand-primary)]/40 ${
        isAdopted ? 'border-[var(--brand-primary)]/30 ring-1 ring-[var(--brand-primary)]/10' : 'border-[var(--border-subtle)]'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.badgeClass}`}
          >
            <span aria-hidden="true">{config.icon}</span>
            <span>{config.label}</span>
          </span>
          <span className="text-xs text-[var(--ink-muted)]">
            For <strong className="font-medium text-[var(--ink-secondary)]">{recommendation.memberNickname}</strong> ({recommendation.activityName})
          </span>
        </div>

        <div className="self-start sm:self-auto shrink-0">
          {isAdopted ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[var(--aqi-good-bg)] text-[var(--aqi-good)] text-xs font-mono font-semibold border border-[var(--aqi-good-border)] select-none">
              ✓ Adopted to Plan
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onAdopt(recommendation)}
              className="px-3.5 py-1.5 rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-xs font-mono font-bold shadow-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] active:scale-[0.98]"
              aria-label={`Adopt recommendation: ${recommendation.title}`}
            >
              + Adopt to Plan
            </button>
          )}
        </div>
      </div>

      <h3 className="text-sm sm:text-base font-bold text-[var(--ink-primary)] font-sans mt-3">
        {recommendation.title}
      </h3>

      <p className="text-xs sm:text-sm text-[var(--ink-secondary)] mt-1 leading-relaxed">
        {recommendation.practicalAction}
      </p>

      {/* Impact Indicators */}
      <ImpactSummaryBadge
        deltaC={recommendation.deltaC}
        transportImpact={recommendation.transportImpact}
      />

      {/* In-Situ Explanation Trigger */}
      <div className="mt-3.5 pt-3 border-t border-[var(--border-subtle)] flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setIsWhyOpen((prev) => !prev)}
          className="inline-flex items-center gap-1.5 text-xs text-[var(--brand-primary)] hover:text-[var(--brand-hover)] font-medium transition-colors cursor-pointer self-start focus-visible:outline-none focus-visible:underline"
          aria-expanded={isWhyOpen}
          aria-controls={`rec-why-${recommendation.id}`}
        >
          <span>💡 Why this recommendation?</span>
          <span className="text-[10px] transform transition-transform duration-200" style={{ transform: isWhyOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▼
          </span>
        </button>

        {isWhyOpen && (
          <div
            id={`rec-why-${recommendation.id}`}
            className="rounded-xl bg-[var(--surface-subtle)] p-3.5 text-xs text-[var(--ink-secondary)] space-y-2 border border-[var(--border-subtle)] animate-fadeIn"
          >
            <div>
              <p className="font-semibold text-[var(--ink-primary)]">Scientific Rationale</p>
              <p className="mt-0.5 leading-relaxed">{recommendation.scientificReason}</p>
            </div>

            <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-[var(--ink-muted)]">
              <span>Source: {recommendation.forecastAttribution}</span>
              <span className="italic">{recommendation.limitationsDisclaimer}</span>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
