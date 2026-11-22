import { NextResponse } from 'next/server';
import { GLOBE_REFERENCE_CITIES } from '@/components/globe/world-landmass';
import { getEpaTierFromValue } from '@/domain/aqi/epa-aqi';

export interface RegionalCityEstimate {
  readonly id: number;
  readonly name: string;
  readonly country: string;
  readonly countryCode: string;
  readonly admin1: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly aqi: number | null;
  readonly pm25: number | null;
  readonly pm10: number | null;
  readonly tierLabel: string;
  readonly colorToken: string;
  readonly time: string;
}

interface CacheEntry {
  readonly timestamp: number;
  readonly data: readonly RegionalCityEstimate[];
}

let memoryCache: CacheEntry | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export async function GET() {
  const now = Date.now();

  // 1. Check in-memory 15-minute cache
  if (memoryCache && now - memoryCache.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(
      {
        success: true,
        source: 'Copernicus CAMS via Open-Meteo',
        label: 'Modeled estimates',
        cities: memoryCache.data,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
        },
      }
    );
  }

  try {
    // 2. Build batched comma-separated query coordinates
    const lats = GLOBE_REFERENCE_CITIES.map((c) => c.latitude.toFixed(4)).join(',');
    const lons = GLOBE_REFERENCE_CITIES.map((c) => c.longitude.toFixed(4)).join(',');

    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lats}&longitude=${lons}&current=us_aqi,pm2_5,pm10`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 900 },
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          error: 'Could not load regional air quality comparisons right now. Please try again later.',
          cities: [],
        },
        { status: 502 }
      );
    }

    const rawData = await res.json();
    const resultsArray = Array.isArray(rawData) ? rawData : [rawData];

    const mappedCities: RegionalCityEstimate[] = GLOBE_REFERENCE_CITIES.map((city, idx) => {
      const cityResult = resultsArray[idx] || resultsArray.find(
        (r: { latitude?: number; longitude?: number }) =>
          r.latitude !== undefined &&
          r.longitude !== undefined &&
          Math.abs(r.latitude - city.latitude) < 0.2 &&
          Math.abs(r.longitude - city.longitude) < 0.2
      );

      const current = cityResult?.current;
      const aqi = typeof current?.us_aqi === 'number' ? Math.round(current.us_aqi) : null;
      const pm25 = typeof current?.pm2_5 === 'number' ? Math.round(current.pm2_5 * 10) / 10 : null;
      const pm10 = typeof current?.pm10 === 'number' ? Math.round(current.pm10 * 10) / 10 : null;
      const tier = aqi !== null ? getEpaTierFromValue(aqi) : null;

      return {
        id: city.id,
        name: city.name,
        country: city.country,
        countryCode: city.countryCode,
        admin1: city.admin1 || '',
        latitude: city.latitude,
        longitude: city.longitude,
        aqi,
        pm25,
        pm10,
        tierLabel: tier?.label ?? 'Unavailable',
        colorToken: tier?.colorToken ?? 'var(--ink-muted)',
        time: current?.time ?? new Date().toISOString(),
      };
    });

    memoryCache = {
      timestamp: now,
      data: mappedCities,
    };

    return NextResponse.json(
      {
        success: true,
        source: 'Copernicus CAMS via Open-Meteo',
        label: 'Modeled estimates',
        cities: mappedCities,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
        },
      }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Could not load regional air quality comparisons right now. Please try again later.',
        cities: [],
      },
      { status: 500 }
    );
  }
}
