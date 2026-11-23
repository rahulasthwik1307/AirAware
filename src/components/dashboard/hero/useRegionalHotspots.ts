'use client';

import { useState, useEffect, useCallback } from 'react';
import type { RegionalCityEstimate } from '@/app/api/regional-hotspots/route';

export interface UseRegionalHotspotsResult {
  readonly regionalHotspots: readonly RegionalCityEstimate[];
  readonly isHotspotsLoading: boolean;
  readonly hotspotsError: string | null;
  readonly retryHotspots: () => void;
}

/**
 * Custom hook to lazily fetch and cache regional air quality comparisons.
 * Does not fetch until enabled is true.
 * If fetch fails, yields an error state without numbers.
 *
 * @param enabled - Whether the hotspot fetch is active (e.g. when Compare tab is opened).
 */
export function useRegionalHotspots(enabled: boolean = true): UseRegionalHotspotsResult {
  const [regionalHotspots, setRegionalHotspots] = useState<readonly RegionalCityEstimate[]>([]);
  const [isHotspotsLoading, setIsHotspotsLoading] = useState(false);
  const [hotspotsError, setHotspotsError] = useState<string | null>(null);

  const fetchHotspots = useCallback(() => {
    let cancelled = false;
    setIsHotspotsLoading(true);
    setHotspotsError(null);

    fetch('/api/regional-hotspots')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          if (data && data.success && Array.isArray(data.cities)) {
            setRegionalHotspots(data.cities);
          } else {
            setHotspotsError(
              data?.error || 'Could not load regional comparisons right now. Please try again later.'
            );
            setRegionalHotspots([]);
          }
          setIsHotspotsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHotspotsError('Could not load regional comparisons right now. Please try again later.');
          setRegionalHotspots([]);
          setIsHotspotsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!enabled || regionalHotspots.length > 0) return;
    const cleanup = fetchHotspots();
    return cleanup;
  }, [enabled, regionalHotspots.length, fetchHotspots]);

  const retryHotspots = useCallback(() => {
    setRegionalHotspots([]);
    setHotspotsError(null);
    fetchHotspots();
  }, [fetchHotspots]);

  return {
    regionalHotspots,
    isHotspotsLoading,
    hotspotsError,
    retryHotspots,
  };
}
