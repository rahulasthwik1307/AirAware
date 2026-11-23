import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as regionalHotspotsHandler } from '@/app/api/regional-hotspots/route';
import { regionalHotspotsLimiter } from '@/lib/ai/rate-limiter';

describe('API Route: /api/regional-hotspots', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    regionalHotspotsLimiter.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('success: returns 200 with mapped cities array and valid metadata', async () => {
    const mockApiResponse = [
      {
        latitude: 28.6139,
        longitude: 77.209,
        current: {
          time: '2026-11-23T10:00',
          interval: 3600,
          european_aqi: 45,
          us_aqi: 80,
          pm2_5: 45,
          pm10: 80,
        },
      },
    ];

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
    } as Response);

    const req = new NextRequest('http://localhost:3000/api/regional-hotspots');
    const res = await regionalHotspotsHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.cities)).toBe(true);
    expect(data.source).toContain('Copernicus CAMS');
  });

  it('upstream failure: returns 502 without numbers and an empty cities array', async () => {
    // Advance clock past 15-minute in-memory cache TTL
    const realNow = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(realNow + 20 * 60 * 1000);

    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Open-Meteo connection timeout'));

    const req = new NextRequest('http://localhost:3000/api/regional-hotspots');
    const res = await regionalHotspotsHandler(req);
    expect(res.status).toBe(502);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.cities).toEqual([]);
    expect(data.error).toContain('Could not load regional air quality comparisons');
    // Ensure no leaked numbers or stack traces
    expect(JSON.stringify(data)).not.toContain('Open-Meteo');
    expect(JSON.stringify(data)).not.toContain('timeout');
  });

  it('rejects unknown query parameters with 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/regional-hotspots?unexpected=true');
    const res = await regionalHotspotsHandler(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.cities).toEqual([]);
  });
});
