'use client';

import React from 'react';
import { AqiTier, WorkspaceKey } from '@/domain/types';

interface ActionableHealthGuidanceProps {
  readonly tier: AqiTier | null;
  readonly dominantPollutant: string | null;
  readonly variant?: 'dark' | 'light';
  readonly onSelectWorkspace?: (workspace: WorkspaceKey) => void;
}

interface ActionCard {
  readonly iconType: 'mask' | 'window' | 'exercise' | 'sensitive';
  readonly title: string;
  readonly recommendation: string;
  readonly badge: string;
  readonly badgeType: 'good' | 'moderate' | 'warning' | 'alert';
  readonly actionLabel?: string;
  readonly targetWorkspace?: WorkspaceKey;
}

function ActionIcon({ type, className = 'w-5 h-5' }: { type: ActionCard['iconType']; className?: string }) {
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

export function ActionableHealthGuidance({
  tier,
  dominantPollutant,
  variant = 'light',
  onSelectWorkspace,
}: ActionableHealthGuidanceProps) {
  const level = tier?.level ?? 1;

  // Formulate deterministic guidance based on active AQI tier level (1 to 6)
  const getActionCards = (lvl: number): ActionCard[] => {
    switch (lvl) {
      case 1: // Good
        return [
          {
            iconType: 'mask',
            title: 'Mask & Respiratory',
            recommendation: 'Ambient concentrations are in the lowest index category. Routine outdoor mask use is generally not indicated based on current modelled levels.',
            badge: 'Not Indicated',
            badgeType: 'good',
            actionLabel: 'Air Quality Normal',
          },
          {
            iconType: 'window',
            title: 'Indoor Ventilation',
            recommendation: 'Modelled outdoor concentrations are in the lowest category. Fresh air ventilation may be considered, balancing outdoor weather with indoor comfort.',
            badge: 'Ventilation Favorable',
            badgeType: 'good',
            actionLabel: 'Ventilate Indoors',
            targetWorkspace: 'indoor-air',
          },
          {
            iconType: 'exercise',
            title: 'Outdoor Exercise',
            recommendation: 'Modelled air quality represents the lowest outdoor exposure tier. Local exposure can still vary near active traffic corridors or localized emission sources.',
            badge: 'Low Exposure',
            badgeType: 'good',
            actionLabel: 'Plan Outdoor Routine',
            targetWorkspace: 'family-planner',
          },
          {
            iconType: 'sensitive',
            title: 'Sensitive Groups',
            recommendation: 'Modelled concentrations are within the baseline index band. Individuals with asthma or respiratory sensitivities should continue observing personal comfort and following individualized health plans.',
            badge: 'Standard Precaution',
            badgeType: 'good',
            actionLabel: 'Review Family Profiles',
            targetWorkspace: 'family-planner',
          },
        ];
      case 2: // Moderate
        return [
          {
            iconType: 'mask',
            title: 'Mask & Respiratory',
            recommendation: 'Modelled concentrations reflect an intermediate atmospheric category. Individuals with heightened particulate sensitivity may consider respiratory protection in high-traffic corridors.',
            badge: 'Individual Choice',
            badgeType: 'moderate',
            actionLabel: 'Optional in Traffic',
          },
          {
            iconType: 'window',
            title: 'Indoor Ventilation',
            recommendation: 'Modelled ambient concentrations are in the moderate range. When ventilating indoors, consider checking local hourly trends and use targeted kitchen ventilation during cooking to mitigate indoor sources.',
            badge: 'Source Awareness',
            badgeType: 'moderate',
            actionLabel: 'Check Cooking Exhaust',
            targetWorkspace: 'indoor-air',
          },
          {
            iconType: 'exercise',
            title: 'Outdoor Exercise',
            recommendation: 'Modelled air quality falls into the moderate band. Unusually sensitive individuals may consider pacing outdoor exertion or taking more frequent breaks.',
            badge: 'Pacing Advised',
            badgeType: 'moderate',
            actionLabel: 'Pace Outdoor Workouts',
            targetWorkspace: 'family-planner',
          },
          {
            iconType: 'sensitive',
            title: 'Sensitive Groups',
            recommendation: 'People with asthma, cardiovascular conditions, or respiratory illness should monitor for symptoms such as coughing or shortness of breath.',
            badge: 'Monitor Symptoms',
            badgeType: 'moderate',
            actionLabel: 'Monitor Symptoms',
            targetWorkspace: 'family-planner',
          },
        ];
      case 3: // Unhealthy for Sensitive Groups
        return [
          {
            iconType: 'mask',
            title: 'Mask & Respiratory',
            recommendation: 'Elevated particulate concentrations. Sensitive groups should consider well-fitted N95/FFP2 respirators near busy roadways.',
            badge: 'N95 Advised',
            badgeType: 'warning',
            actionLabel: 'Wear N95 Outdoors',
          },
          {
            iconType: 'window',
            title: 'Indoor Ventilation',
            recommendation: 'Elevated outdoor concentrations. While limiting outdoor air intake can reduce particle entry, ensure dedicated exhaust or mechanical ventilation is used during indoor activities like cooking.',
            badge: 'Indoor Sources',
            badgeType: 'warning',
            actionLabel: 'Mitigate Indoor Air',
            targetWorkspace: 'indoor-air',
          },
          {
            iconType: 'exercise',
            title: 'Outdoor Exercise',
            recommendation: 'Elevated pollutant levels. Consider reducing strenuous outdoor exertion or shifting high-intensity training indoors.',
            badge: 'Reduce Intensity',
            badgeType: 'warning',
            actionLabel: 'Reschedule Workouts',
            targetWorkspace: 'family-planner',
          },
          {
            iconType: 'sensitive',
            title: 'Sensitive Groups',
            recommendation: 'Under official guidelines, children, older adults, and individuals with respiratory conditions face higher risk and should limit prolonged outdoor exertion.',
            badge: 'Limit Exertion',
            badgeType: 'warning',
            actionLabel: 'Shift Child/Senior Plan',
            targetWorkspace: 'family-planner',
          },
        ];
      case 4: // Unhealthy
        return [
          {
            iconType: 'mask',
            title: 'Mask & Respiratory',
            recommendation: 'High ambient pollutant concentrations. Well-fitted particulate respirators (N95 / FFP2) are advised for outdoor exposure.',
            badge: 'N95 Advised',
            badgeType: 'alert',
            actionLabel: 'Wear N95/FFP2',
          },
          {
            iconType: 'window',
            title: 'Indoor Ventilation',
            recommendation: 'High outdoor concentrations. Closing windows reduces ambient particle entry, though local kitchen exhaust ventilation remains important during cooking or indoor combustion.',
            badge: 'Manage Air Exchange',
            badgeType: 'alert',
            actionLabel: 'Run Purifiers / Close Windows',
            targetWorkspace: 'indoor-air',
          },
          {
            iconType: 'exercise',
            title: 'Outdoor Exercise',
            recommendation: 'Under unhealthy tier guidelines, individuals are advised to reduce prolonged or heavy outdoor exertion, or reschedule strenuous workouts.',
            badge: 'Reduce Exertion',
            badgeType: 'alert',
            actionLabel: 'Move Cardio Indoors',
            targetWorkspace: 'family-planner',
          },
          {
            iconType: 'sensitive',
            title: 'Sensitive Groups',
            recommendation: 'Official guidance recommends that people with lung disease, asthma, heart disease, children, and older adults avoid prolonged or heavy outdoor exertion.',
            badge: 'Avoid Heavy Exertion',
            badgeType: 'alert',
            actionLabel: 'Protect Sensitive Members',
            targetWorkspace: 'family-planner',
          },
        ];
      default: // 5 & 6 Very Unhealthy / Hazardous
        return [
          {
            iconType: 'mask',
            title: 'Mask & Respiratory',
            recommendation: 'Very high or hazardous ambient particulate concentrations. Well-fitted particulate respirators (N95 / FFP3) are recommended for unavoidable outdoor exposure.',
            badge: 'Respirator Advised',
            badgeType: 'alert',
            actionLabel: 'N95/FFP3 Required Outdoors',
          },
          {
            iconType: 'window',
            title: 'Indoor Ventilation',
            recommendation: 'Very high outdoor pollution levels. Minimizing unfiltered outdoor air intake helps limit outdoor ingress; operate indoor air cleaners and use localized exhaust when generating indoor smoke or fumes.',
            badge: 'Limit Ingress',
            badgeType: 'alert',
            actionLabel: 'Deploy Indoor Defense',
            targetWorkspace: 'indoor-air',
          },
          {
            iconType: 'exercise',
            title: 'Outdoor Exercise',
            recommendation: 'Official health advisories recommend avoiding all strenuous outdoor physical activity under very unhealthy and hazardous categories, keeping outdoor time to a minimum.',
            badge: 'Avoid Outdoor Exertion',
            badgeType: 'alert',
            actionLabel: 'Cancel Outdoor Activity',
            targetWorkspace: 'family-planner',
          },
          {
            iconType: 'sensitive',
            title: 'Sensitive Groups',
            recommendation: 'Official health standards advise sensitive groups to remain indoors, keep physical activity low, and consult healthcare providers if symptoms arise.',
            badge: 'Remain Indoors Advised',
            badgeType: 'alert',
            actionLabel: 'Keep Indoors at All Times',
            targetWorkspace: 'family-planner',
          },
        ];
    }
  };

  const cards = getActionCards(level);

  const getBadgeStyle = (type: ActionCard['badgeType']) => {
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
  };

  const getIconWrapperStyle = (type: ActionCard['badgeType']) => {
    switch (type) {
      case 'good':
        return 'bg-emerald-100/70 text-emerald-700 border-emerald-200';
      case 'moderate':
        return 'bg-amber-100/70 text-amber-700 border-amber-200';
      case 'warning':
        return 'bg-orange-100/70 text-orange-700 border-orange-200';
      case 'alert':
      default:
        return 'bg-rose-100/70 text-rose-700 border-rose-200';
    }
  };

  return (
    <section aria-labelledby="actionable-guidance-heading" className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-3.5">
        <div>
          <h2
            id="actionable-guidance-heading"
            className="text-base sm:text-lg font-bold tracking-tight text-[var(--ink-primary)] font-sans flex items-center gap-2"
          >
            <span>Actionable Health Guidance</span>
            <span className="text-[10px] font-mono font-normal text-[var(--ink-muted)] bg-[var(--surface-subtle)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
              Modelled Advisory Protocols
            </span>
          </h2>
          <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
            Practical, evidence-aligned daily protection protocols tailored for households and sensitive family members.
          </p>
        </div>

        {dominantPollutant && (
          <span className="text-[10px] font-mono text-[var(--ink-secondary)] bg-[var(--surface-subtle)] px-2.5 py-1 rounded-md border border-[var(--border-subtle)] self-start sm:self-auto">
            Primary Driver: <strong className="text-[var(--brand-primary)] uppercase">{dominantPollutant}</strong>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {cards.map((card) => (
          <article
            key={card.title}
            className="flex flex-col justify-between p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] hover:border-[var(--border-strong)] transition-all shadow-xs hover:shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-1.5 rounded-lg border shrink-0 ${getIconWrapperStyle(card.badgeType)}`}>
                    <ActionIcon type={card.iconType} className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--ink-primary)] truncate font-sans">
                    {card.title}
                  </h3>
                </div>

                <span
                  className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${getBadgeStyle(
                    card.badgeType
                  )}`}
                >
                  {card.badge}
                </span>
              </div>

              <p className="text-xs text-[var(--ink-secondary)] leading-relaxed mt-1">
                {card.recommendation}
              </p>
            </div>

            {/* Quick Action Link to Planner / Indoor Workspace */}
            {card.targetWorkspace && onSelectWorkspace && (
              <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)]/70 flex items-center justify-between">
                <span className="text-[10px] font-mono text-[var(--ink-muted)]">
                  Challenge 06 Action
                </span>
                <button
                  type="button"
                  onClick={() => onSelectWorkspace(card.targetWorkspace!)}
                  className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[var(--brand-primary)] hover:text-[var(--brand-hover)] cursor-pointer transition-colors"
                >
                  <span>{card.actionLabel}</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            )}
          </article>
        ))}
      </div>

      <p className="text-[10px] font-mono text-[var(--ink-muted)] mt-2.5 leading-relaxed">
        Notice: Modelled advisory protocols provide generalized public guidance and do not guarantee personal safety. Individuals with pre-existing cardiopulmonary conditions should consult healthcare professionals.
      </p>
    </section>
  );
}

