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
            recommendation: 'Ambient concentrations are in the lowest index category. Routine outdoor mask use is generally not indicated based on current modelled levels.',
            badge: 'Not Indicated',
            badgeType: 'good',
          },
          {
            icon: '🪟',
            title: 'Indoor Ventilation',
            recommendation: 'Modelled outdoor concentrations are in the lowest category. Fresh air ventilation may be considered, balancing outdoor weather with indoor comfort.',
            badge: 'Ventilation Favorable',
            badgeType: 'good',
          },
          {
            icon: '🏃',
            title: 'Outdoor Exercise',
            recommendation: 'Modelled air quality represents the lowest outdoor exposure tier. Local exposure can still vary near active traffic corridors or localized emission sources.',
            badge: 'Low Exposure',
            badgeType: 'good',
          },
          {
            icon: '👶',
            title: 'Sensitive Groups',
            recommendation: 'Modelled concentrations are within the baseline index band. Individuals with asthma or respiratory sensitivities should continue observing personal comfort and following individualized health plans.',
            badge: 'Standard Precaution',
            badgeType: 'good',
          },
        ];
      case 2: // Moderate
        return [
          {
            icon: '😷',
            title: 'Mask & Respiratory',
            recommendation: 'Modelled concentrations reflect an intermediate atmospheric category. Individuals with heightened particulate sensitivity may consider respiratory protection in high-traffic corridors.',
            badge: 'Individual Choice',
            badgeType: 'moderate',
          },
          {
            icon: '🪟',
            title: 'Indoor Ventilation',
            recommendation: 'Modelled ambient concentrations are in the moderate range. When ventilating indoors, consider checking local hourly trends and use targeted kitchen ventilation during cooking to mitigate indoor sources.',
            badge: 'Source Awareness',
            badgeType: 'moderate',
          },
          {
            icon: '🏃',
            title: 'Outdoor Exercise',
            recommendation: 'Modelled air quality falls into the moderate band. Unusually sensitive individuals may consider pacing outdoor exertion or taking more frequent breaks.',
            badge: 'Pacing Advised',
            badgeType: 'moderate',
          },
          {
            icon: '👶',
            title: 'Sensitive Groups',
            recommendation: 'People with asthma, cardiovascular conditions, or respiratory illness should monitor for symptoms such as coughing or shortness of breath.',
            badge: 'Monitor Symptoms',
            badgeType: 'moderate',
          },
        ];
      case 3: // Unhealthy for Sensitive Groups / Moderate-Poor
        return [
          {
            icon: '😷',
            title: 'Mask & Respiratory',
            recommendation: 'Elevated particulate concentrations. Sensitive groups should consider well-fitted N95/FFP2 respirators near busy roadways.',
            badge: 'N95 Advised',
            badgeType: 'warning',
          },
          {
            icon: '🪟',
            title: 'Indoor Ventilation',
            recommendation: 'Elevated outdoor concentrations. While limiting outdoor air intake can reduce particle entry, ensure dedicated exhaust or mechanical ventilation is used during indoor activities like cooking.',
            badge: 'Indoor Sources',
            badgeType: 'warning',
          },
          {
            icon: '🏃',
            title: 'Outdoor Exercise',
            recommendation: 'Elevated pollutant levels. Consider reducing strenuous outdoor exertion or shifting high-intensity training indoors.',
            badge: 'Reduce Intensity',
            badgeType: 'warning',
          },
          {
            icon: '👶',
            title: 'Sensitive Groups',
            recommendation: 'Under official guidelines, children, older adults, and individuals with respiratory conditions face higher risk and should limit prolonged outdoor exertion.',
            badge: 'Limit Exertion',
            badgeType: 'warning',
          },
        ];
      case 4: // Unhealthy / Poor
        return [
          {
            icon: '😷',
            title: 'Mask & Respiratory',
            recommendation: 'High ambient pollutant concentrations. Well-fitted particulate respirators (N95 / FFP2) are advised for outdoor exposure.',
            badge: 'N95 Advised',
            badgeType: 'alert',
          },
          {
            icon: '🪟',
            title: 'Indoor Ventilation',
            recommendation: 'High outdoor concentrations. Closing windows reduces ambient particle entry, though local kitchen exhaust ventilation remains important during cooking or indoor combustion.',
            badge: 'Manage Air Exchange',
            badgeType: 'alert',
          },
          {
            icon: '🏃',
            title: 'Outdoor Exercise',
            recommendation: 'Under unhealthy tier guidelines, individuals are advised to reduce prolonged or heavy outdoor exertion, or reschedule strenuous workouts.',
            badge: 'Reduce Exertion',
            badgeType: 'alert',
          },
          {
            icon: '👶',
            title: 'Sensitive Groups',
            recommendation: 'Official guidance recommends that people with lung disease, asthma, heart disease, children, and older adults avoid prolonged or heavy outdoor exertion.',
            badge: 'Avoid Heavy Exertion',
            badgeType: 'alert',
          },
        ];
      default: // 5 & 6 Very Unhealthy / Hazardous / Very Poor
        return [
          {
            icon: '😷',
            title: 'Mask & Respiratory',
            recommendation: 'Very high or hazardous ambient particulate concentrations. Well-fitted particulate respirators (N95 / FFP3) are recommended for unavoidable outdoor exposure.',
            badge: 'Respirator Advised',
            badgeType: 'alert',
          },
          {
            icon: '🪟',
            title: 'Indoor Ventilation',
            recommendation: 'Very high outdoor pollution levels. Minimizing unfiltered outdoor air intake helps limit outdoor ingress; operate indoor air cleaners and use localized exhaust when generating indoor smoke or fumes.',
            badge: 'Limit Ingress',
            badgeType: 'alert',
          },
          {
            icon: '🏃',
            title: 'Outdoor Exercise',
            recommendation: 'Official health advisories recommend avoiding all strenuous outdoor physical activity under very unhealthy and hazardous categories, keeping outdoor time to a minimum.',
            badge: 'Avoid Outdoor Exertion',
            badgeType: 'alert',
          },
          {
            icon: '👶',
            title: 'Sensitive Groups',
            recommendation: 'Official health standards advise sensitive groups to remain indoors, keep physical activity low, and consult healthcare providers if symptoms arise.',
            badge: 'Remain Indoors Advised',
            badgeType: 'alert',
          },
        ];
    }
  };

  const cards = getActionCards(level);

  const getBadgeStyle = (type: ActionCard['badgeType']) => {
    if (variant === 'light') {
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
    <div className={`w-full mt-4 pt-4 border-t ${isDark ? 'border-slate-800/80' : 'border-slate-200/80'}`}>
      <div className="flex items-center justify-between mb-2.5">
        <span className={`text-[11px] font-bold tracking-wider uppercase font-mono ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          Actionable Health Guidance • Modelled Advisory Protocols
        </span>
        {dominantPollutant && (
          <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Primary Driver: <strong className={isDark ? 'text-sky-300 uppercase' : 'text-sky-700 uppercase'}>{dominantPollutant}</strong>
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
                : 'border-slate-200/90 bg-white/95 backdrop-blur-md hover:bg-white hover:border-slate-300 shadow-xs hover:shadow-md'
            }`}
          >
            <span className="text-xl shrink-0 mt-0.5 select-none" aria-hidden="true">
              {card.icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
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
              <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {card.recommendation}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className={`text-[10px] font-mono mt-3 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        Notice: Modelled advisory protocols provide generalized public guidance and do not guarantee personal safety. Individuals with pre-existing cardiopulmonary conditions should consult healthcare professionals.
      </p>
    </div>
  );
}
