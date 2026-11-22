import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getNearestOpenAqStation } from '@/domain/aqi/openaq-adapter';

const AirQualityQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  timezone: z.string().default('auto'),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const parseResult = AirQualityQuerySchema.safeParse({
    latitude: searchParams.get('latitude'),
    longitude: searchParams.get('longitude'),
    timezone: searchParams.get('timezone') ?? 'auto',
  });

  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid geographic coordinates provided' },
      { status: 400 }
    );
  }

  const { latitude, longitude, timezone } = parseResult.data;

  try {
    const currentParams = [
      'european_aqi',
      'us_aqi',
      'pm10',
      'pm2_5',
      'carbon_monoxide',
      'nitrogen_dioxide',
      'sulphur_dioxide',
      'ozone',
      'us_aqi_pm2_5',
      'us_aqi_pm10',
      'us_aqi_nitrogen_dioxide',
      'us_aqi_ozone',
      'us_aqi_sulphur_dioxide',
      'us_aqi_carbon_monoxide',
      'european_aqi_pm2_5',
      'european_aqi_pm10',
      'european_aqi_nitrogen_dioxide',
      'european_aqi_ozone',
      'european_aqi_sulphur_dioxide',
    ].join(',');

    const hourlyParams = [
      'pm10',
      'pm2_5',
      'carbon_monoxide',
      'nitrogen_dioxide',
      'sulphur_dioxide',
      'ozone',
      'european_aqi',
      'us_aqi',
    ].join(',');

    const targetUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=${currentParams}&hourly=${hourlyParams}&past_days=7&forecast_days=2&timezone=${encodeURIComponent(
      timezone
    )}`;

    // Query CAMS numerical model and OpenAQ in-situ ground station in parallel
    const [camsRes, stationResult] = await Promise.all([
      fetch(targetUrl, {
        next: { revalidate: 600 }, // 10-minute caching
        headers: {
          Accept: 'application/json',
        },
      }),
      getNearestOpenAqStation(latitude, longitude).catch(() => null),
    ]);

    if (!camsRes.ok) {
      return NextResponse.json(
        { error: `Air Quality provider responded with status ${camsRes.status}` },
        { status: 502 }
      );
    }

    const data = await camsRes.json();

    if (!data.current || !data.hourly) {
      return NextResponse.json(
        { error: 'Environmental data is temporarily unavailable for this coordinate' },
        { status: 502 }
      );
    }

    const payload = {
      ...data,
      sourceType: stationResult ? 'station' : 'model',
      stationName: stationResult ? stationResult.stationName : null,
      distanceKm: stationResult ? stationResult.distanceKm : null,
      observedAt: stationResult ? stationResult.observedAt : null,
      stationPm25: stationResult ? stationResult.pm25 : null,
      stationPm10: stationResult ? stationResult.pm10 : null,
    };

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to retrieve environmental data from provider' },
      { status: 500 }
    );
  }
}
