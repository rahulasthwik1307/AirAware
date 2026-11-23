import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { secureUpstreamFetch } from '@/lib/security/upstream';

const WeatherQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  timezone: z
    .string()
    .max(50)
    .regex(/^[A-Za-z0-9_\/+\-]+$/, 'Invalid timezone format')
    .default('auto'),
}).strict();

const ALLOWED_WEATHER_PARAMS = new Set(['latitude', 'longitude', 'timezone']);

export interface WeatherData {
  readonly temperature: number | null;
  readonly humidity: number | null;
  readonly windSpeed: number | null;
  readonly windDirection: number | null;
  readonly windDirectionCardinal: string;
}

function getWindCardinal(degrees: number | null): string {
  if (degrees === null) return 'N/A';
  const cardinals = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((degrees % 360) / 22.5)) % 16;
  return cardinals[index];
}

/**
 * GET /api/weather
 * Purpose: Retrieves surface meteorological telemetry (temperature, humidity, wind) for atmospheric dispersion modeling.
 * Inputs: NextRequest with query parameters latitude, longitude, timezone.
 * Never: Never retains user location on the server or exposes raw unparsed provider errors.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Reject unknown query parameters
  for (const key of searchParams.keys()) {
    if (!ALLOWED_WEATHER_PARAMS.has(key)) {
      return NextResponse.json(
        { error: 'Unknown query parameter rejected' },
        { status: 400 }
      );
    }
  }

  const queryObj: Record<string, string | null> = {};
  if (searchParams.has('latitude')) queryObj.latitude = searchParams.get('latitude');
  if (searchParams.has('longitude')) queryObj.longitude = searchParams.get('longitude');
  if (searchParams.has('timezone')) queryObj.timezone = searchParams.get('timezone');

  const parseResult = WeatherQuerySchema.safeParse(queryObj);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid coordinates provided for weather query' },
      { status: 400 }
    );
  }

  const { latitude, longitude, timezone } = parseResult.data;

  try {
    const targetUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m&timezone=${encodeURIComponent(
      timezone
    )}`;

    const res = await secureUpstreamFetch(targetUrl, {
      next: { revalidate: 900 }, // 15-minute caching
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Weather provider responded with an error' },
        { status: 502 }
      );
    }

    const data = await res.json();
    const cur = data.current || {};

    const temp = typeof cur.temperature_2m === 'number' ? cur.temperature_2m : null;
    const humidity = typeof cur.relative_humidity_2m === 'number' ? cur.relative_humidity_2m : null;
    const windSpeed = typeof cur.wind_speed_10m === 'number' ? cur.wind_speed_10m : null;
    const windDirection = typeof cur.wind_direction_10m === 'number' ? cur.wind_direction_10m : null;
    const cardinal = getWindCardinal(windDirection);

    const payload: WeatherData = {
      temperature: temp,
      humidity,
      windSpeed,
      windDirection,
      windDirectionCardinal: cardinal,
    };

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=300',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to retrieve atmospheric weather data' },
      { status: 502 }
    );
  }
}
