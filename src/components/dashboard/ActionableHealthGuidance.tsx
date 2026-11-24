'use client';

import { AqiTier, GeoLocation, WorkspaceKey } from '@/domain/types';
import {
  ActionCard,
  ActionCardIconType,
  ActionBadgeType,
  getHealthActionCards,
} from '@/domain/planner/health-advisory-rules';

export interface ActionableHealthGuidanceProps {
  readonly tier: AqiTier | null;
  readonly dominantPollutant: string | null;
  readonly variant?: 'dark' | 'light';
  readonly onSelectWorkspace?: (workspace: WorkspaceKey) => void;
  readonly location?: GeoLocation | null;
  readonly providerAqi?: number | null;
  readonly cpcbCategory?: string | null;
}

function ActionIcon({ type, className = 'w-5 h-5' }: { type: ActionCardIconType; className?: string }) {
  switch (type) {
    case 'mask':
      return (
        <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case 'window':
      return (
        <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.7 7.7A7.1 7.1 0 0 0 5 10.8" />
          <path d="M18 10h4" />
          <path d="M15 14h6" />
          <path d="M13 18h8" />
          <path d="M2.3 12.3A7.1 7.1 0 0 0 15 9.2" />
        </svg>
      );
    case 'exercise':
      return (
        <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      );
    case 'sensitive':
      return (
        <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          <path d="M12 5v14" />
        </svg>
      );
  }
}

function getBadgeStyle(type: ActionBadgeType): string {
  switch (type) {
    case 'good':
      return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    case 'moderate':
      return 'bg-amber-50 text-amber-800 border-amber-300';
    case 'warning':
      return 'bg-orange-50 text-orange-800 border-orange-300';
    case 'alert':
    default:
      return 'bg-rose-50 text-rose-800 border-rose-300';
  }
}

function getIconWrapperStyle(type: ActionBadgeType): string {
  switch (type) {
    case 'good':
      return 'bg-emerald-100/80 text-emerald-700 border-emerald-300';
    case 'moderate':
      return 'bg-amber-100/80 text-amber-700 border-amber-300';
    case 'warning':
      return 'bg-orange-100/80 text-orange-700 border-orange-300';
    case 'alert':
    default:
      return 'bg-rose-100/80 text-rose-700 border-rose-300';
  }
}

/**
 * Actionable Health Guidance Component rendering real-time, evidence-grounded
 * mitigation protocols for outdoor activity, ventilation, masking, and vulnerable family members.
 *
 * @param props - Current AQI tier, dominant pollutant, location, and workspace navigation callback
 */
export function ActionableHealthGuidance({
  tier,
  dominantPollutant,
  onSelectWorkspace,
  location,
  providerAqi,
  cpcbCategory,
}: ActionableHealthGuidanceProps) {
  const level = tier?.level ?? 1;
  const cards = getHealthActionCards(level);

  return (
    <section aria-labelledby="actionable-guidance-heading" className="w-full space-y-4">
      {/* Header with Title and Primary Driver */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2
            id="actionable-guidance-heading"
            className="text-lg sm:text-xl font-bold tracking-tight text-[var(--ink-primary)] font-sans flex items-center gap-2"
          >
            <span>Actionable Health Guidance</span>
            <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
              Live Advisory Protocols
            </span>
          </h2>
          <p className="text-sm text-[var(--ink-secondary)] mt-0.5">
            Practical, evidence-aligned daily protection protocols tailored for households, daily commuters, and vulnerable family members.
          </p>
        </div>

        {dominantPollutant && (
          <span className="text-xs font-mono font-bold text-[var(--ink-secondary)] bg-[var(--surface-subtle)] px-3 py-1 rounded-lg border border-[var(--border-subtle)] self-start sm:self-auto shadow-2xs">
            Primary Driver: <strong className="text-[var(--brand-primary)] uppercase">{dominantPollutant}</strong>
          </span>
        )}
      </div>

      {/* Dynamic Active Location Status Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-teal-50 to-emerald-50 border border-sky-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white border border-sky-200 flex items-center justify-center text-xl shrink-0 shadow-2xs">
            📍
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-semibold text-sky-800">
                Active Advisory:
              </span>
              <strong className="text-sm sm:text-base font-bold text-slate-900">
                {location?.name || 'Selected City'}, {location?.country || 'India'}
              </strong>
              {providerAqi !== null && (
                <span
                  className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full text-white shadow-2xs"
                  style={{ backgroundColor: tier?.colorToken || '#059669' }}
                >
                  AQI {providerAqi} • {tier?.label || 'Active'}
                </span>
              )}
              {cpcbCategory && (
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-white text-emerald-800 border border-emerald-300 shadow-2xs">
                  CPCB: {cpcbCategory}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              ⚡ These 4 protocols adapt to {location?.name || 'the active city'}&apos;s pollution severity.
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-semibold text-teal-800 bg-white px-2.5 py-1 rounded-lg border border-teal-200 shadow-2xs flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
          <span className="h-2 w-2 rounded-full bg-teal-500" />
          <span>Live Synchronized</span>
        </span>
      </div>

      {/* 4 Interactive Protocol Cards (2x2 Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => (
          <article
            key={card.title}
            className="flex flex-col justify-between p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] hover:border-[var(--border-strong)] transition-all shadow-xs hover:shadow-md space-y-3"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-xl border shrink-0 ${getIconWrapperStyle(card.badgeType)}`}>
                    <ActionIcon type={card.iconType} className="w-5 h-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[var(--ink-primary)] truncate font-sans">
                    {card.title}
                  </h3>
                </div>

                <span
                  className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-lg border shrink-0 ${getBadgeStyle(
                    card.badgeType
                  )}`}
                >
                  {card.badge}
                </span>
              </div>

              <p className="text-sm text-[var(--ink-secondary)] leading-relaxed font-medium">
                {card.recommendation}
              </p>

              {/* Practical Household / Commuter Hack */}
              <div className="mt-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200/90 text-xs text-amber-950 font-sans space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-amber-900 text-[11px]">
                  <span>💡 Practical Tip</span>
                </div>
                <p className="leading-relaxed">
                  {card.practicalTip}
                </p>
              </div>
            </div>

            {/* Quick Action Link to Planner / Indoor Workspace */}
            {card.targetWorkspace && onSelectWorkspace && (
              <div className="pt-3 border-t border-[var(--border-subtle)]/70 flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-[var(--ink-muted)]">
                  Action Plan
                </span>
                <button
                  type="button"
                  onClick={() => onSelectWorkspace(card.targetWorkspace!)}
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--brand-primary)] hover:text-[var(--brand-hover)] cursor-pointer transition-colors px-2.5 py-1 rounded-md hover:bg-[var(--surface-subtle)]"
                >
                  <span>{card.actionLabel}</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            )}
          </article>
        ))}
      </div>

      <p className="text-xs font-mono text-[var(--ink-muted)] mt-2 leading-relaxed">
        Scientific Notice: Modelled advisory protocols provide actionable environmental guidance aligned with CPCB and WHO guidelines. Individuals with chronic cardiovascular or respiratory conditions should follow personalized medical action plans.
      </p>
    </section>
  );
}
