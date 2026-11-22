import { getOpenAqApiKey } from '@/lib/openaq/config';

export interface OpenAqStationResult {
  readonly stationId: number;
  readonly stationName: string;
  readonly distanceKm: number;
  readonly observedAt: string; // ISO string
  readonly pm25: number;
  readonly pm10: number | null;
  readonly sourceType: 'station';
}

export interface OpenAqSensorInfo {
  readonly id: number;
  readonly name?: string;
  readonly parameter?: {
    readonly id: number;
    readonly name: string;
    readonly units: string;
    readonly displayName?: string;
  };
}

export interface OpenAqLocationItem {
  readonly id: number;
  readonly name: string;
  readonly distance?: number; // meters from query point
  readonly isMonitor?: boolean;
  readonly isMobile?: boolean;
  readonly datetimeLast?: {
    readonly utc?: string;
    readonly local?: string;
  } | null;
  readonly sensors?: readonly OpenAqSensorInfo[];
  readonly coordinates?: {
    readonly latitude: number;
    readonly longitude: number;
  };
}

export interface OpenAqLatestReadingItem {
  readonly datetime?: {
    readonly utc?: string;
    readonly local?: string;
  };
  readonly value: number;
  readonly sensorsId: number;
  readonly locationsId: number;
}

const MAX_RADIUS_METERS = 25000; // 25 km
const MAX_DATA_AGE_MS = 3 * 60 * 60 * 1000; // 3 hours
const TIMEOUT_MS = 5000; // 5 seconds
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// In-memory module-level cache for serverless invocation lifetime
export const openAqMemoryCache = new Map<
  string,
  { result: OpenAqStationResult | null; timestamp: number }
>();

/**
 * Pure function: filters and selects the nearest government reference monitor
 * within 25 km that reports PM2.5 and has recent observations.
 */
export function selectNearestStation(
  stations: readonly OpenAqLocationItem[],
  maxAgeMs = MAX_DATA_AGE_MS,
  now = Date.now()
): OpenAqLocationItem | null {
  if (!stations || !Array.isArray(stations) || stations.length === 0) {
    return null;
  }

  const validCandidates = stations.filter((st) => {
    // 1. Must be a reference monitor (not mobile, isMonitor true or not explicitly false)
    if (st.isMobile === true) return false;
    if (st.isMonitor === false) return false;

    // 2. Must be within 25 km
    if (st.distance === undefined || st.distance === null || st.distance > MAX_RADIUS_METERS || st.distance < 0) {
      return false;
    }

    // 3. Must have a PM2.5 sensor
    const hasPm25Sensor = st.sensors?.some(
      (s: OpenAqSensorInfo) => s.parameter?.id === 2 || s.parameter?.name?.toLowerCase() === 'pm25' || s.parameter?.name?.toLowerCase() === 'pm2_5'
    );
    if (!hasPm25Sensor) return false;

    // 4. Must have recent observation timestamp (<= 3 hours)
    const dtLastUtc = st.datetimeLast?.utc;
    if (!dtLastUtc) return false;
    const lastTime = new Date(dtLastUtc).getTime();
    if (isNaN(lastTime)) return false;
    const age = now - lastTime;
    if (age < 0 || age > maxAgeMs) return false;

    return true;
  });

  if (validCandidates.length === 0) {
    return null;
  }

  // Choose the nearest station by distance ascending
  validCandidates.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  return validCandidates[0];
}

/**
 * Pure function: maps latest sensor measurements to PM2.5 and PM10 values.
 * Returns null if PM2.5 is missing, invalid, or older than maxAgeMs.
 */
export function parseLatestReadings(
  station: OpenAqLocationItem,
  readings: readonly OpenAqLatestReadingItem[],
  maxAgeMs = MAX_DATA_AGE_MS,
  now = Date.now()
): OpenAqStationResult | null {
  if (!readings || !Array.isArray(readings) || readings.length === 0) {
    return null;
  }

  const sensorMap = new Map<number, { name: string; units: string }>();
  if (station.sensors) {
    for (const s of station.sensors) {
      const pName = s.parameter?.name?.toLowerCase();
      if (pName) {
        sensorMap.set(s.id, { name: pName, units: s.parameter?.units || 'µg/m³' });
      }
    }
  }

  let pm25Val: number | null = null;
  let pm25ObservedAt: string | null = null;
  let pm10Val: number | null = null;

  for (const r of readings) {
    const meta = sensorMap.get(r.sensorsId);
    if (!meta) continue;

    const val = r.value;
    if (val === undefined || val === null || !Number.isFinite(val) || val < 0) {
      continue;
    }

    const dtUtc = r.datetime?.utc;
    if (!dtUtc) continue;
    const time = new Date(dtUtc).getTime();
    if (isNaN(time)) continue;
    const age = now - time;
    if (age < 0 || age > maxAgeMs) continue;

    if (meta.name === 'pm25' || meta.name === 'pm2_5') {
      pm25Val = val;
      pm25ObservedAt = dtUtc;
    } else if (meta.name === 'pm10') {
      pm10Val = val;
    }
  }

  // PM2.5 reading is mandatory for ground station evaluation
  if (pm25Val === null || !pm25ObservedAt) {
    return null;
  }

  const distanceKm =
    station.distance !== undefined
      ? Math.round((station.distance / 1000) * 10) / 10
      : 0;

  return {
    stationId: station.id,
    stationName: station.name,
    distanceKm,
    observedAt: pm25ObservedAt,
    pm25: pm25Val,
    pm10: pm10Val,
    sourceType: 'station',
  };
}

/**
 * Retrieves the nearest active OpenAQ government reference monitor within 25 km.
 * Falls back gracefully to null on missing key, 429 rate limit, timeouts, or lack of fresh station.
 */
export async function getNearestOpenAqStation(
  latitude: number,
  longitude: number,
  options?: {
    readonly apiKeyOverride?: string | null;
    readonly forceRefresh?: boolean;
    readonly fetchFn?: typeof fetch;
  }
): Promise<OpenAqStationResult | null> {
  const apiKey = options?.apiKeyOverride ?? getOpenAqApiKey();
  if (!apiKey) {
    return null;
  }

  const customFetch = options?.fetchFn ?? fetch;
  const cacheKey = `${latitude.toFixed(2)}_${longitude.toFixed(2)}`;
  const now = Date.now();

  if (!options?.forceRefresh) {
    const cached = openAqMemoryCache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.result;
    }
  }

  try {
    // Call 1: Search locations within 25 km reporting PM2.5 from reference monitors
    const locationsUrl = `https://api.openaq.org/v3/locations?coordinates=${latitude},${longitude}&radius=${MAX_RADIUS_METERS}&parameters_id=2&monitor=true&limit=100`;

    const controller1 = new AbortController();
    const timeout1 = setTimeout(() => controller1.abort(), TIMEOUT_MS);

    let locRes: Response;
    try {
      locRes = await customFetch(locationsUrl, {
        signal: controller1.signal,
        headers: {
          'X-API-Key': apiKey,
          Accept: 'application/json',
        },
        next: { revalidate: 600 }, // 10 minutes Next.js SWR cache on Vercel
      });
    } finally {
      clearTimeout(timeout1);
    }

    // Rate limit or upstream failure check
    if (locRes.status === 429 || !locRes.ok) {
      openAqMemoryCache.set(cacheKey, { result: null, timestamp: now });
      return null;
    }

    const locRemaining = locRes.headers.get('x-ratelimit-remaining');
    if (locRemaining !== null && Number(locRemaining) <= 0) {
      // At rate limit limit, do not hammer upstream
      openAqMemoryCache.set(cacheKey, { result: null, timestamp: now });
      return null;
    }

    const locData = await locRes.json().catch(() => null);
    if (!locData || !Array.isArray(locData.results)) {
      openAqMemoryCache.set(cacheKey, { result: null, timestamp: now });
      return null;
    }

    const nearestStation = selectNearestStation(locData.results, MAX_DATA_AGE_MS, now);
    if (!nearestStation) {
      openAqMemoryCache.set(cacheKey, { result: null, timestamp: now });
      return null;
    }

    // Call 2: Fetch latest sensor measurements for the nearest station
    const latestUrl = `https://api.openaq.org/v3/locations/${nearestStation.id}/latest`;
    const controller2 = new AbortController();
    const timeout2 = setTimeout(() => controller2.abort(), TIMEOUT_MS);

    let latestRes: Response;
    try {
      latestRes = await customFetch(latestUrl, {
        signal: controller2.signal,
        headers: {
          'X-API-Key': apiKey,
          Accept: 'application/json',
        },
        next: { revalidate: 600 },
      });
    } finally {
      clearTimeout(timeout2);
    }

    if (latestRes.status === 429 || !latestRes.ok) {
      openAqMemoryCache.set(cacheKey, { result: null, timestamp: now });
      return null;
    }

    const latestData = await latestRes.json().catch(() => null);
    if (!latestData || !Array.isArray(latestData.results)) {
      openAqMemoryCache.set(cacheKey, { result: null, timestamp: now });
      return null;
    }

    const stationResult = parseLatestReadings(nearestStation, latestData.results, MAX_DATA_AGE_MS, now);
    openAqMemoryCache.set(cacheKey, { result: stationResult, timestamp: now });
    return stationResult;
  } catch {
    // Network errors, abort timeouts, JSON parse errors -> fail closed to null immediately
    openAqMemoryCache.set(cacheKey, { result: null, timestamp: now });
    return null;
  }
}
