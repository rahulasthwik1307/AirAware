import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const WeatherQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  timezone: z.string().default('auto'),
});

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const parseResult = WeatherQuerySchema.safeParse({
    latitude: searchParams.get('latitude'),
    longitude: searchParams.get('longitude'),
    timezone: searchParams.get('timezone') ?? 'auto',
  });

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

    const res = await fetch(targetUrl, {
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
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to retrieve atmospheric weather data' },
      { status: 500 }
    );
  }
}
