'use client';

import React, { useState } from 'react';
import { AqiTier, GeoLocation, WorkspaceKey } from '@/domain/types';

interface ActionableHealthGuidanceProps {
  readonly tier: AqiTier | null;
  readonly dominantPollutant: string | null;
  readonly variant?: 'dark' | 'light';
  readonly onSelectWorkspace?: (workspace: WorkspaceKey) => void;
  readonly location?: GeoLocation | null;
  readonly providerAqi?: number | null;
  readonly cpcbCategory?: string | null;
}

interface ActionCard {
  readonly iconType: 'mask' | 'window' | 'exercise' | 'sensitive';
  readonly title: string;
  readonly recommendation: string;
  readonly practicalTip: string;
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
  location,
  providerAqi,
  cpcbCategory,
}: ActionableHealthGuidanceProps) {
  const level = tier?.level ?? 1;
  const [activeExpanded, setActiveExpanded] = useState<string | null>(null);

  // Formulate deterministic guidance based on active AQI tier level (1 to 6)
  const getActionCards = (lvl: number): ActionCard[] => {
    switch (lvl) {
      case 1: // Good
        return [
          {
            iconType: 'mask',
            title: 'Mask & Respiratory',
            recommendation: 'Ambient concentrations are in the lowest index category. Routine outdoor mask use is not required for daily errands.',
            practicalTip: 'Keep a certified N95 respirator in your vehicle or bag for unexpected localized construction dust or heavy diesel corridors.',
            badge: 'Not Required',
            badgeType: 'good',
            actionLabel: 'Air Quality Normal',
          },
          {
            iconType: 'window',
            title: 'Indoor Ventilation',
            recommendation: 'Modelled outdoor concentrations are in the clean category. Open windows across rooms to flush accumulated indoor carbon dioxide.',
            practicalTip: 'Create natural cross-ventilation for 30–45 minutes during morning hours to refresh bedroom air while temperatures are pleasant.',
            badge: 'Ventilation Favorable',
            badgeType: 'good',
            actionLabel: 'Ventilate Indoors',
            targetWorkspace: 'indoor-air',
          },
          {
            iconType: 'exercise',
            title: 'Outdoor Exercise',
            recommendation: 'Modelled air quality represents optimal outdoor conditions. Ideal for morning jogging, outdoor cycling, and school sports.',
            practicalTip: 'Outdoor cardio and children sports can proceed with zero restrictions. Maintain normal hydration.',
            badge: 'Ideal For Sports',
            badgeType: 'good',
            actionLabel: 'Plan Outdoor Routine',
            targetWorkspace: 'family-planner',
          },
          {
            iconType: 'sensitive',
            title: 'Sensitive Groups',
            recommendation: 'Modelled concentrations are within safe baseline bands. Safe for infants, pregnant women, asthmatics, and senior citizens.',
            practicalTip: 'Senior citizens can enjoy uninterrupted morning walks in local parks or open residential areas.',
            badge: 'Safe For Seniors',
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
            recommendation: 'Intermediate atmospheric category. Commuters in open autorickshaws or on two-wheelers should consider wearing a particulate mask.',
            practicalTip: 'Ordinary cloth scarves/gamchas filter less than 25% of fine exhaust soot. A snug N95 or surgical mask blocks road dust in stop-and-go traffic.',
            badge: 'Optional in Traffic',
            badgeType: 'moderate',
            actionLabel: 'Optional in Traffic',
          },
          {
            iconType: 'window',
            title: 'Indoor Ventilation',
            recommendation: 'Ambient concentrations are acceptable. Check hourly local forecast before opening windows for extended periods.',
            practicalTip: 'Always run kitchen range hood exhaust when frying with mustard oil or tadka to prevent indoor PM2.5 build-up.',
            badge: 'Selective Flush',
            badgeType: 'moderate',
            actionLabel: 'Check Cooking Exhaust',
            targetWorkspace: 'indoor-air',
          },
          {
            iconType: 'exercise',
            title: 'Outdoor Exercise',
            recommendation: 'Modelled air quality falls into the moderate band. Safe for general workouts; sensitive individuals pace heavy cardio.',
            practicalTip: 'If jogging near major ring roads or arterial highways, consider shifting to an inner residential park or indoor treadmill.',
            badge: 'Pacing Advised',
            badgeType: 'moderate',
            actionLabel: 'Pace Outdoor Workouts',
            targetWorkspace: 'family-planner',
          },
          {
            iconType: 'sensitive',
            title: 'Sensitive Groups',
            recommendation: 'People with asthma or chronic respiratory conditions should keep rescue inhalers accessible during early morning outings.',
            practicalTip: 'Monitor elderly family members for mild dry coughing or throat irritation after prolonged exposure.',
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
            recommendation: 'Elevated particulate smog. Well-fitted particulate respirators (N95 / FFP2) are strongly advised for children, seniors, and daily commuters.',
            practicalTip: 'Ensure a snug nose-clip fit. A loose mask with air gaps leaks over 50% of toxic sub-micron combustion soot.',
            badge: 'N95 Recommended',
            badgeType: 'warning',
            actionLabel: 'Wear N95 Outdoors',
          },
          {
            iconType: 'window',
            title: 'Indoor Ventilation',
            recommendation: 'Keep windows sealed during early morning and late night inversion hours. Use localized mechanical kitchen exhaust.',
            practicalTip: 'Damp-mop hard floors with wet microfiber mops; avoid dry broom sweeping (jharoo) which resuspends settled particles into breathing zones.',
            badge: 'Seal Morning Smog',
            badgeType: 'warning',
            actionLabel: 'Mitigate Indoor Air',
            targetWorkspace: 'indoor-air',
          },
          {
            iconType: 'exercise',
            title: 'Outdoor Exercise',
            recommendation: 'Elevated pollutant levels. Avoid high-intensity outdoor running or heavy aerobic workouts before 9:30 AM.',
            practicalTip: 'Take advantage of the 1:00 PM – 3:30 PM afternoon solar window when surface inversion lifts and ground soot temporarily dilutes.',
            badge: 'Shift To Afternoon',
            badgeType: 'warning',
            actionLabel: 'Reschedule Workouts',
            targetWorkspace: 'family-planner',
          },
          {
            iconType: 'sensitive',
            title: 'Sensitive Groups',
            recommendation: 'Children and older adults face heightened irritation. School transit should keep vehicle windows closed.',
            practicalTip: 'Switch evening children outdoor playground playtime to indoor activities or board games during smog alerts.',
            badge: 'Protect Children',
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
            recommendation: 'High ambient pollutant concentrations. Well-fitted particulate respirators (N95 / FFP2) are necessary for all outdoor travel.',
            practicalTip: 'Cloth handkerchiefs and scarves provide false security. Use certified N95 respirators with headbands or earloop adjusters for a true seal.',
            badge: 'N95 Mandatory',
            badgeType: 'alert',
            actionLabel: 'Wear N95/FFP2',
          },
          {
            iconType: 'window',
            title: 'Indoor Ventilation',
            recommendation: 'Keep all exterior windows and balcony doors tightly closed. Run HEPA air purifiers continuously on auto/medium mode.',
            practicalTip: 'Place rolled towels or silicone draft stoppers under entrance doors to block pressurized corridor smog infiltration.',
            badge: 'Keep Sealed',
            badgeType: 'alert',
            actionLabel: 'Run Purifiers / Close Windows',
            targetWorkspace: 'indoor-air',
          },
          {
            iconType: 'exercise',
            title: 'Outdoor Exercise',
            recommendation: 'Strictly avoid outdoor jogging, fast walking, or outdoor sports. Deep breathing during exercise pulls soot deep into lower alveoli.',
            practicalTip: 'Transition completely to indoor yoga, bodyweight training, or indoor stair climbing until thermal dispersion improves.',
            badge: 'Cancel Outdoor Cardio',
            badgeType: 'alert',
            actionLabel: 'Move Cardio Indoors',
            targetWorkspace: 'family-planner',
          },
          {
            iconType: 'sensitive',
            title: 'Sensitive Groups',
            recommendation: 'High-risk alert for asthmatics, COPD patients, elderly citizens, and toddlers. Remain in HEPA-filtered indoor environments.',
            practicalTip: 'Senior morning walkers must pause park walks; shift to gentle corridor or living-room walking routines.',
            badge: 'Remain Indoors',
            badgeType: 'alert',
            actionLabel: 'Protect Sensitive Members',
            targetWorkspace: 'family-planner',
          },
        ];
      default: // 5 & 6 Very Unhealthy / Hazardous (Severe Winter Smog)
        return [
          {
            iconType: 'mask',
            title: 'Mask & Respiratory',
            recommendation: 'Severe winter smog and thermal inversion crisis. High-grade particulate respirators (N95 / FFP3) are essential for any unavoidable outdoor step.',
            practicalTip: 'Replace N95 masks every 3–4 days during severe winter smog as soot accumulation increases breathing resistance.',
            badge: 'N95/FFP3 Required',
            badgeType: 'alert',
            actionLabel: 'N95/FFP3 Required Outdoors',
          },
          {
            iconType: 'window',
            title: 'Indoor Ventilation',
            recommendation: 'Emergency outdoor air ingress alert. Seal all vents and windows. Create a designated clean air sanctuary in the family bedroom.',
            practicalTip: 'Operate your HEPA purifier on maximum fan speed in the closed bedroom for 40 minutes, then maintain on quiet mode through the night.',
            badge: 'Sanctuary Protocol',
            badgeType: 'alert',
            actionLabel: 'Deploy Indoor Defense',
            targetWorkspace: 'indoor-air',
          },
          {
            iconType: 'exercise',
            title: 'Outdoor Exercise',
            recommendation: 'Complete prohibition on outdoor physical exertion. Ambient PM2.5 levels equal smoking multiple packs of cigarettes per day.',
            practicalTip: 'All physical workouts must stay strictly indoors in filtered rooms. Keep exertion gentle to prevent deep lung irritation.',
            badge: 'Zero Outdoor Cardio',
            badgeType: 'alert',
            actionLabel: 'Cancel Outdoor Activity',
            targetWorkspace: 'family-planner',
          },
          {
            iconType: 'sensitive',
            title: 'Sensitive Groups',
            recommendation: 'Critical medical protection alert. Vulnerable members, elderly, and young children must remain indoors in filtered rooms.',
            practicalTip: 'Keep emergency bronchodilator inhalers ready. Ensure elderly members avoid unheated drafty rooms during cold morning smog peaks.',
            badge: 'Emergency Defense',
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
        return 'bg-emerald-100/80 text-emerald-700 border-emerald-300';
      case 'moderate':
        return 'bg-amber-100/80 text-amber-700 border-amber-300';
      case 'warning':
        return 'bg-orange-100/80 text-orange-700 border-orange-300';
      case 'alert':
      default:
        return 'bg-rose-100/80 text-rose-700 border-rose-300';
    }
  };

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

      {/* Dynamic Active Location Status Ribbon (Light, Premium Multi-Color Tint) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-teal-50 to-emerald-50 border border-sky-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white border border-sky-200 flex items-center justify-center text-xl shrink-0 shadow-2xs">
            📍
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-800">
                Active Location Advisory:
              </span>
              <strong className="text-sm sm:text-base font-extrabold text-slate-900">
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
              ⚡ Reactive Engine: These 4 protocols adapt dynamically to {location?.name || 'the active city'}&apos;s live pollution severity.
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-teal-800 bg-white px-2.5 py-1 rounded-lg border border-teal-200 shadow-2xs flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
          <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
          <span>Live Synchronized</span>
        </span>
      </div>

      {/* 4 Interactive Protocol Cards (2x2 Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => {
          const isExpanded = activeExpanded === card.title;
          return (
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
                    className={`text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border shrink-0 ${getBadgeStyle(
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
                  <div className="font-bold flex items-center gap-1.5 text-amber-900 uppercase tracking-wide font-mono text-[11px]">
                    <span>💡 PRACTICAL HOUSEHOLD HACK:</span>
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
                    Challenge 06 Action Plan
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
          );
        })}
      </div>

      <p className="text-xs font-mono text-[var(--ink-muted)] mt-2 leading-relaxed">
        Scientific Notice: Modelled advisory protocols provide actionable environmental guidance aligned with CPCB and WHO guidelines. Individuals with chronic cardiovascular or respiratory conditions should follow personalized medical action plans.
      </p>
    </section>
  );
}

