import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GeoLocation } from '@/domain/types';

const SearchQuerySchema = z.object({
  name: z.string().trim().min(2, 'Search term must be at least 2 characters long').max(100),
  count: z.coerce.number().int().min(1).max(10).default(8),
});

const OpenMeteoGeocodingItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  country: z.string().default(''),
  country_code: z.string().default(''),
  admin1: z.string().optional(),
  timezone: z.string().default('auto'),
});

const OpenMeteoGeocodingResponseSchema = z.object({
  results: z.array(OpenMeteoGeocodingItemSchema).optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parseResult = SearchQuerySchema.safeParse({
    name: searchParams.get('name') ?? '',
    count: searchParams.get('count') ?? 8,
  });

  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.issues[0]?.message ?? 'Invalid search parameters' },
      { status: 400 }
    );
  }

  const { name, count } = parseResult.data;

  try {
    const targetUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      name
    )}&count=${count}&language=en&format=json`;

    const res = await fetch(targetUrl, {
      next: { revalidate: 86400 }, // Cache geocoding for 24h
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Geocoding provider responded with status ${res.status}` },
        { status: 502 }
      );
    }

    const json = await res.json();
    const validated = OpenMeteoGeocodingResponseSchema.safeParse(json);

    if (!validated.success || !validated.data.results) {
      return NextResponse.json(
        { results: [] },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
          },
        }
      );
    }

    const locations: GeoLocation[] = validated.data.results.map((item) => ({
      id: item.id,
      name: item.name,
      country: item.country,
      countryCode: item.country_code,
      admin1: item.admin1,
      latitude: item.latitude,
      longitude: item.longitude,
      timezone: item.timezone,
    }));

    return NextResponse.json(
      { results: locations },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
        },
      }
    );
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to retrieve location suggestions from provider' },
      { status: 500 }
    );
  }
}
