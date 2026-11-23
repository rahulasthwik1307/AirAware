import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as airQualityHandler } from '@/app/api/air-quality/route';
import * as openAqAdapter from '@/domain/aqi/openaq-adapter';

describe('API Route: /api/air-quality', () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = process.env;

  const mockCamsResponse = {
    latitude: 28.61,
    longitude: 77.21,
    generationtime_ms: 0.8,
    utc_offset_seconds: 19800,
    timezone: 'Asia/Kolkata',
    timezone_abbreviation: 'IST',
    elevation: 216,
    current: {
      time: '2026-11-23T10:00',
      interval: 3600,
      pm2_5: 45,
      pm10: 80,
      us_aqi: 95,
      european_aqi: 40,
    },
    hourly: {
      time: ['2026-11-23T10:00'],
      pm2_5: [45],
      pm10: [80],
      us_aqi: [95],
      european_aqi: [40],
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env = originalEnv;
  });

  it('station found: returns 200 with sourceType=station when OpenAQ resolves nearby monitor', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('open-meteo.com')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockCamsResponse,
        } as Response);
      }
      return Promise.reject(new Error('Unexpected fetch'));
    });

    vi.spyOn(openAqAdapter, 'getNearestOpenAqStationDetailed').mockResolvedValue({
      station: {
        stationId: 101,
        stationName: 'Delhi Pusa CAAQMS',
        distanceKm: 3.8,
        observedAt: '2026-11-23T09:45:00Z',
        pm25: 52,
        pm10: 98,
        sourceType: 'station',
      },
      fallbackReason: null,
    });

    const req = new NextRequest('http://localhost:3000/api/air-quality?latitude=28.6139&longitude=77.209');
    const res = await airQualityHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.sourceType).toBe('station');
    expect(data.stationName).toBe('Delhi Pusa CAAQMS');
    expect(data.distanceKm).toBe(3.8);
    expect(data.modelFallbackReason).toBeNull();
  });

  it('stale station falls back to model with fallbackReason preserved', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockCamsResponse,
    } as Response);

    vi.spyOn(openAqAdapter, 'getNearestOpenAqStationDetailed').mockResolvedValue({
      station: null,
      fallbackReason: 'station data too old',
    });

    const req = new NextRequest('http://localhost:3000/api/air-quality?latitude=28.6139&longitude=77.209');
    const res = await airQualityHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.sourceType).toBe('model');
    expect(data.stationName).toBeNull();
    expect(data.modelFallbackReason).toBe('station data too old');
  });

  it('no key falls back to model gracefully without crashing or throwing 500', async () => {
    delete process.env.OPENAQ_API_KEY;

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockCamsResponse,
    } as Response);

    vi.spyOn(openAqAdapter, 'getNearestOpenAqStationDetailed').mockResolvedValue({
      station: null,
      fallbackReason: 'service busy',
    });

    const req = new NextRequest('http://localhost:3000/api/air-quality?latitude=28.6139&longitude=77.209');
    const res = await airQualityHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.sourceType).toBe('model');
  });

  it('429 rate limit falls back to model with 200 status', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockCamsResponse,
    } as Response);

    vi.spyOn(openAqAdapter, 'getNearestOpenAqStationDetailed').mockResolvedValue({
      station: null,
      fallbackReason: 'service busy',
    });

    const req = new NextRequest('http://localhost:3000/api/air-quality?latitude=28.6139&longitude=77.209');
    const res = await airQualityHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.sourceType).toBe('model');
    expect(data.modelFallbackReason).toBe('service busy');
  });

  it('rejects invalid coordinates with 400 status', async () => {
    const invalidReq1 = new NextRequest('http://localhost:3000/api/air-quality?latitude=105&longitude=77.209');
    const res1 = await airQualityHandler(invalidReq1);
    expect(res1.status).toBe(400);

    const invalidReq2 = new NextRequest('http://localhost:3000/api/air-quality?latitude=invalid&longitude=77.209');
    const res2 = await airQualityHandler(invalidReq2);
    expect(res2.status).toBe(400);

    const invalidReq3 = new NextRequest('http://localhost:3000/api/air-quality?latitude=28.6&longitude=77.2&unknown_param=123');
    const res3 = await airQualityHandler(invalidReq3);
    expect(res3.status).toBe(400);
  });

  it('Delhi vs Mumbai query different coordinates and pick their respective stations', async () => {
    const requestedCoordinates: { lat: number; lon: number }[] = [];

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      const u = new URL(url);
      requestedCoordinates.push({
        lat: parseFloat(u.searchParams.get('latitude') || '0'),
        lon: parseFloat(u.searchParams.get('longitude') || '0'),
      });
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => mockCamsResponse,
      } as Response);
    });

    vi.spyOn(openAqAdapter, 'getNearestOpenAqStationDetailed').mockImplementation(async (lat, lon) => {
      if (lat > 25) {
        return {
          station: {
            stationId: 1,
            stationName: 'Delhi Central Station',
            distanceKm: 2.1,
            observedAt: '2026-11-23T10:00:00Z',
            pm25: 60,
            pm10: 100,
            sourceType: 'station',
          },
          fallbackReason: null,
        };
      }
      return {
        station: {
          stationId: 2,
          stationName: 'Mumbai Coastal Monitor',
          distanceKm: 4.8,
          observedAt: '2026-11-23T10:00:00Z',
          pm25: 35,
          pm10: 55,
          sourceType: 'station',
        },
        fallbackReason: null,
      };
    });

    // Request Delhi
    const delhiReq = new NextRequest('http://localhost:3000/api/air-quality?latitude=28.6139&longitude=77.2090');
    const delhiRes = await airQualityHandler(delhiReq);
    const delhiData = await delhiRes.json();
    expect(delhiData.stationName).toBe('Delhi Central Station');

    // Request Mumbai
    const mumbaiReq = new NextRequest('http://localhost:3000/api/air-quality?latitude=19.0760&longitude=72.8777');
    const mumbaiRes = await airQualityHandler(mumbaiReq);
    const mumbaiData = await mumbaiRes.json();
    expect(mumbaiData.stationName).toBe('Mumbai Coastal Monitor');

    expect(requestedCoordinates.length).toBe(2);
    expect(requestedCoordinates[0].lat).toBeCloseTo(28.6139, 2);
    expect(requestedCoordinates[1].lat).toBeCloseTo(19.076, 2);
  });
});
