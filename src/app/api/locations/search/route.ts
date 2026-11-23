import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GeoLocation } from '@/domain/types';
import { secureUpstreamFetch } from '@/lib/security/upstream';

const SearchQuerySchema = z.object({
  name: z.string().trim().min(2, 'Search term must be at least 2 characters long').max(100),
  count: z.coerce.number().int().min(1).max(10).default(8),
}).strict();

const ALLOWED_SEARCH_PARAMS = new Set(['name', 'count']);

const OpenMeteoGeocodingItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
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

  // Reject unknown query parameters
  for (const key of searchParams.keys()) {
    if (!ALLOWED_SEARCH_PARAMS.has(key)) {
      return NextResponse.json(
        { error: 'Unknown query parameter rejected' },
        { status: 400 }
      );
    }
  }

  const queryObj: Record<string, string | null> = {};
  if (searchParams.has('name')) queryObj.name = searchParams.get('name');
  if (searchParams.has('count')) queryObj.count = searchParams.get('count');

  const parseResult = SearchQuerySchema.safeParse(queryObj);

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

    const res = await secureUpstreamFetch(targetUrl, {
      next: { revalidate: 86400 }, // Cache geocoding for 24h
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Geocoding provider responded with an error' },
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
  } catch {
    return NextResponse.json(
      { error: 'Failed to retrieve location suggestions from provider' },
      { status: 502 }
    );
  }
}
