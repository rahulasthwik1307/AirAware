'use client';

import React from 'react';
import { AqiTier } from '@/domain/types';

interface ActionableHealthGuidanceProps {
  readonly tier: AqiTier | null;
  readonly dominantPollutant: string | null;
  readonly variant?: 'dark' | 'light';
}

interface ActionCard {
  readonly icon: string;
  readonly title: string;
  readonly recommendation: string;
  readonly badge: string;
  readonly badgeType: 'good' | 'moderate' | 'warning' | 'alert';
}

export function ActionableHealthGuidance({
  tier,
  dominantPollutant,
  variant = 'dark',
}: ActionableHealthGuidanceProps) {
  const level = tier?.level ?? 1;

  // Formulate deterministic guidance based on active AQI tier level (1 to 6)
  const getActionCards = (lvl: number): ActionCard[] => {
    switch (lvl) {
      case 1: // Good
        return [
          {
            icon: '😷',
            title: 'Mask & Respiratory',
            recommendation: 'Air quality is pristine. No mask or respiratory protection is needed for any demographic.',
            badge: 'Unrestricted',
            badgeType: 'good',
          },
          {
            icon: '🪟',
            title: 'Indoor Ventilation',
            recommendation: 'Optimal time to open windows and refresh indoor air. Passive natural ventilation encouraged.',
            badge: 'Open Windows',
            badgeType: 'good',
          },
          {
            icon: '🏃',
            title: 'Outdoor Exercise',
            recommendation: 'Perfect atmospheric conditions for running, cycling, and prolonged high-intensity sports.',
            badge: 'Ideal Activity',
            badgeType: 'good',
          },
          {
            icon: '👶',
            title: 'Sensitive Groups',
            recommendation: 'Children, older adults, and individuals with respiratory conditions can engage normally outdoors.',
            badge: 'Zero Risk',
            badgeType: 'good',
          },
        ];
      case 2: // Moderate
        return [
          {
            icon: '😷',
            title: 'Mask & Respiratory',
            recommendation: 'Not required for general public. Extremely sensitive individuals should carry quick-relief inhalers.',
            badge: 'Optional',
            badgeType: 'moderate',
          },
          {
            icon: '🪟',
            title: 'Indoor Ventilation',
            recommendation: 'Safe to ventilate indoors during midday hours when morning thermal inversions have dissipated.',
            badge: 'Ventilate Midday',
            badgeType: 'moderate',
          },
          {
            icon: '🏃',
            title: 'Outdoor Exercise',
            recommendation: 'Outdoor sports are safe. Sensitive athletes should watch for slight throat irritation or coughing.',
            badge: 'Safe with Caution',
            badgeType: 'moderate',
          },
          {
            icon: '👶',
            title: 'Sensitive Groups',
            recommendation: 'Individuals with severe asthma or cardiovascular sensitivities should monitor local symptom onset.',
            badge: 'Monitor Symptoms',
            badgeType: 'moderate',
          },
        ];
      case 3: // Unhealthy for Sensitive Groups / Moderate-Poor
        return [
          {
            icon: '😷',
            title: 'Mask & Respiratory',
            recommendation: 'Sensitive groups should consider well-fitted N95 masks when near high-traffic arterial roads.',
            badge: 'N95 for Sensitive',
            badgeType: 'warning',
          },
          {
            icon: '🪟',
            title: 'Indoor Ventilation',
            recommendation: 'Keep windows closed during early morning and late evening rush hours to prevent fine particle ingress.',
            badge: 'Limit Opening',
            badgeType: 'warning',
          },
          {
            icon: '🏃',
            title: 'Outdoor Exercise',
            recommendation: 'Take more frequent breaks during outdoor cardio. Move strenuous workouts indoors if symptomatic.',
            badge: 'Reduce Intensity',
            badgeType: 'warning',
          },
          {
            icon: '👶',
            title: 'Sensitive Groups',
            recommendation: 'Children and older adults should reschedule extended outdoor playtime to times with lower ambient smog.',
            badge: 'Limit Exposure',
            badgeType: 'warning',
          },
        ];
      case 4: // Unhealthy / Poor
        return [
          {
            icon: '😷',
            title: 'Mask & Respiratory',
            recommendation: 'N95 / FFP2 respirators recommended for everyone when spending more than 30 minutes outdoors.',
            badge: 'N95 Advised',
            badgeType: 'alert',
          },
          {
            icon: '🪟',
            title: 'Indoor Ventilation',
            recommendation: 'Seal doors and windows. Run indoor HEPA air filtration if available to scrub incoming particulates.',
            badge: 'Keep Windows Shut',
            badgeType: 'alert',
          },
          {
            icon: '🏃',
            title: 'Outdoor Exercise',
            recommendation: 'Avoid prolonged outdoor running or heavy cardio. Substitute with indoor gym workouts.',
            badge: 'Move Indoors',
            badgeType: 'alert',
          },
          {
            icon: '👶',
            title: 'Sensitive Groups',
            recommendation: 'Individuals with asthma, heart disease, or respiratory illness should strictly stay in purified indoor environments.',
            badge: 'Stay Indoors',
            badgeType: 'alert',
          },
        ];
      default: // 5 & 6 Very Unhealthy / Hazardous / Very Poor
        return [
          {
            icon: '😷',
            title: 'Mask & Respiratory',
            recommendation: 'Tight-fitting N95/FFP3 respirator essential for all unavoidable outdoor exposure. Avoid loose cloth masks.',
            badge: 'N95 Mandatory',
            badgeType: 'alert',
          },
          {
            icon: '🪟',
            title: 'Indoor Ventilation',
            recommendation: 'Strictly seal all windows and entryways. Run continuous HEPA purifiers on medium-high speed.',
            badge: 'Strictly Sealed',
            badgeType: 'alert',
          },
          {
            icon: '🏃',
            title: 'Outdoor Exercise',
            recommendation: 'Cancel all outdoor sports, running, and cycling. Even healthy individuals face acute respiratory irritation.',
            badge: 'Zero Outdoor Sports',
            badgeType: 'alert',
          },
          {
            icon: '👶',
            title: 'Sensitive Groups',
            recommendation: 'Extreme danger for vulnerable demographics. Remain strictly indoors in clean-air zones.',
            badge: 'Hazardous Alert',
            badgeType: 'alert',
          },
        ];
    }
  };

  const cards = getActionCards(level);

  const getBadgeStyle = (type: ActionCard['badgeType']) => {
    switch (type) {
      case 'good':
        return 'bg-[var(--aqi-good-bg)] text-[var(--aqi-good)] border-[var(--aqi-good-border)]';
      case 'moderate':
        return 'bg-[var(--aqi-moderate-bg)] text-[var(--aqi-moderate)] border-[var(--aqi-moderate-border)]';
      case 'warning':
        return 'bg-[var(--aqi-sensitive-bg)] text-[var(--aqi-sensitive)] border-[var(--aqi-sensitive-border)]';
      case 'alert':
      default:
        return 'bg-[var(--aqi-unhealthy-bg)] text-[var(--aqi-unhealthy)] border-[var(--aqi-unhealthy-border)]';
    }
  };

  const isDark = variant === 'dark';

  return (
    <div className={`w-full mt-4 pt-4 border-t ${isDark ? 'border-slate-800/80' : 'border-[var(--border-subtle)]'}`}>
      <div className="flex items-center justify-between mb-2.5">
        <span className={`text-[11px] font-bold tracking-wider uppercase font-mono ${isDark ? 'text-slate-300' : 'text-[var(--ink-secondary)]'}`}>
          Actionable Health Guidance // Real-Time Protocols
        </span>
        {dominantPollutant && (
          <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-[var(--ink-muted)]'}`}>
            Primary Driver: <strong className={isDark ? 'text-sky-300 uppercase' : 'text-[var(--ink-primary)]'}>{dominantPollutant}</strong>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all ${
              isDark
                ? 'border-slate-800/90 bg-slate-900/60 backdrop-blur-md hover:bg-slate-900/90 hover:border-slate-700/80 shadow-md'
                : 'border-[var(--border-subtle)] bg-[var(--surface-subtle)]/60 hover:bg-[var(--surface-subtle)]'
            }`}
          >
            <span className="text-xl shrink-0 mt-0.5 select-none" aria-hidden="true">
              {card.icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[var(--ink-primary)]'}`}>
                  {card.title}
                </span>
                <span
                  className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border shrink-0 ${getBadgeStyle(
                    card.badgeType
                  )}`}
                >
                  {card.badge}
                </span>
              </div>
              <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-[var(--ink-secondary)]'}`}>
                {card.recommendation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
