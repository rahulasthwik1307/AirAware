'use client';

import { useState, useEffect, useRef } from 'react';

// Tactile number roll hook for smooth instrument calibration feel
export function useAnimatedNumber(target: number | null, durationMs = 450): number | null {
  const [current, setCurrent] = useState<number | null>(target);
  const prevRef = useRef<number | null>(target);

  useEffect(() => {
    if (target === null) {
      setCurrent(null);
      prevRef.current = null;
      return;
    }
    const start = prevRef.current ?? 0;
    prevRef.current = target;
    if (start === target) {
      setCurrent(target);
      return;
    }

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCurrent(target);
      return;
    }

    const startTime = performance.now();
    let frameId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(start + (target - start) * ease));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [target, durationMs]);

  return current;
}

export function formatPollutantSymbol(code?: string | null): string {
  if (!code) return 'PM₂.₅';
  const clean = code.toLowerCase().trim();
  if (clean.includes('pm2') || clean.includes('pm2_5') || clean.includes('pm2.5')) return 'PM₂.₅';
  if (clean.includes('pm10')) return 'PM₁₀';
  if (clean === 'o3' || clean.includes('ozone')) return 'O₃';
  if (clean === 'no2') return 'NO₂';
  if (clean === 'so2') return 'SO₂';
  if (clean === 'co') return 'CO';
  return code.toUpperCase().replace('_', '.');
}

export { formatDataAge } from '@/lib/formatters/time';

export interface GrapInfo {
  stage: string;
  badge: string;
  action: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export function computeGrapInfo(
  aqi: number | null,
  isIndia: boolean,
  isDelhiNcr: boolean
): GrapInfo | null {
  if (!isIndia || aqi === null || !Number.isFinite(aqi)) return null;

  if (isDelhiNcr) {
    if (aqi > 450) {
      return {
        stage: 'GRAP Stage IV (Severe+)',
        badge: 'EMERGENCY',
        action: 'Ban on diesel trucks; halt on construction; mandatory hybrid school & telework.',
        color: '#7F1D1D',
        bgColor: '#FEF2F2',
        borderColor: '#F87171',
      };
    }
    if (aqi > 400) {
      return {
        stage: 'GRAP Stage III (Severe)',
        badge: 'STRICT BAN',
        action: 'BS-III Petrol & BS-IV Diesel ban; halt on non-essential earthwork & mining.',
        color: '#991B1B',
        bgColor: '#FEF2F2',
        borderColor: '#FCA5A5',
      };
    }
    if (aqi > 300) {
      return {
        stage: 'GRAP Stage II (Very Poor)',
        badge: 'ENHANCED ACTIONS',
        action: 'Diesel genset bans; mechanized road sweeping; water sprinkling on major corridors.',
        color: '#C2410C',
        bgColor: '#FFF7ED',
        borderColor: '#FDBA74',
      };
    }
    if (aqi > 200) {
      return {
        stage: 'GRAP Stage I (Poor)',
        badge: 'ACTIVE ADVISORY',
        action: 'Strict dust control at construction sites; zero open trash burning enforcement.',
        color: '#D97706',
        bgColor: '#FFFBEB',
        borderColor: '#FCD34D',
      };
    }
    return null;
  }

  // Generic NCAP/CPCB Stage for other Indian Cities
  if (aqi > 400) {
    return {
      stage: 'CPCB Severe Air Alert',
      badge: 'HEALTH EMERGENCY',
      action: 'Vulnerable citizens must stay indoors; industrial emission enforcement active.',
      color: '#7F1D1D',
      bgColor: '#FEF2F2',
      borderColor: '#F87171',
    };
  }
  if (aqi > 300) {
    return {
      stage: 'CPCB Very Poor Alert',
      badge: 'RESTRICT EXERTION',
      action: 'Avoid prolonged morning walks; wear particulate-filtering N95 respirators outdoors.',
      color: '#991B1B',
      bgColor: '#FEF2F2',
      borderColor: '#FCA5A5',
    };
  }
  if (aqi > 200) {
    return {
      stage: 'National Clean Air Advisory (Poor)',
      badge: 'ACTIVE ADVISORY',
      action: 'Poor air quality. Sensitive members should avoid heavy outdoor exertion.',
      color: '#92400E',
      bgColor: '#FFFBEB',
      borderColor: '#FDE68A',
    };
  }
  return null;
}
