import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as airQualityGet } from '@/app/api/air-quality/route';
import { GET as weatherGet } from '@/app/api/weather/route';
import { GET as searchGet } from '@/app/api/locations/search/route';
import { POST as guidancePost } from '@/app/api/ai/guidance/route';
import { POST as copilotPost } from '@/app/api/ai/copilot/route';
import { GET as regionalHotspotsGet } from '@/app/api/regional-hotspots/route';
import { localRateLimiter, regionalHotspotsLimiter } from '@/lib/ai/rate-limiter';

describe('API Route Security & Input Validation', () => {
  beforeEach(() => {
    localRateLimiter.clear();
    regionalHotspotsLimiter.clear();
    vi.restoreAllMocks();
  });

  describe('GET /api/air-quality', () => {
    it('returns 400 for out-of-bounds latitude (> 90)', async () => {
      const req = new NextRequest('http://localhost:3000/api/air-quality?latitude=95&longitude=77');
      const res = await airQualityGet(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it('returns 400 for unknown query parameter', async () => {
      const req = new NextRequest('http://localhost:3000/api/air-quality?latitude=28&longitude=77&malicious=1');
      const res = await airQualityGet(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Unknown query parameter');
    });

    it('returns 502 without leaking stack trace or secrets on upstream failure', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Sensitive upstream database failure')));
      const req = new NextRequest('http://localhost:3000/api/air-quality?latitude=28&longitude=77');
      const res = await airQualityGet(req);
      expect(res.status).toBe(502);
      const data = await res.json();
      expect(data.error).toBeDefined();
      expect(JSON.stringify(data)).not.toContain('stack');
      expect(JSON.stringify(data)).not.toContain('Sensitive upstream database failure');
    });
  });

  describe('GET /api/weather', () => {
    it('returns 400 for out-of-bounds longitude (> 180)', async () => {
      const req = new NextRequest('http://localhost:3000/api/weather?latitude=28&longitude=190');
      const res = await weatherGet(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 for unknown query parameter', async () => {
      const req = new NextRequest('http://localhost:3000/api/weather?latitude=28&longitude=77&hack=true');
      const res = await weatherGet(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Unknown query parameter');
    });
  });

  describe('GET /api/locations/search', () => {
    it('returns 400 for search query under 2 characters', async () => {
      const req = new NextRequest('http://localhost:3000/api/locations/search?name=a');
      const res = await searchGet(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 for unknown query parameter', async () => {
      const req = new NextRequest('http://localhost:3000/api/locations/search?name=Delhi&extra=bad');
      const res = await searchGet(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Unknown query parameter');
    });
  });

  describe('POST /api/ai/guidance', () => {
    it('returns 400 for unknown payload fields (.strict())', async () => {
      const req = new Request('http://localhost:3000/api/ai/guidance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Sec-Fetch-Site': 'same-origin',
        },
        body: JSON.stringify({
          aqi: 100,
          category: 'Moderate',
          dominantPollutant: 'pm25',
          pollutantConcentration: 35,
          weather: { temperatureC: 25, humidityPercent: 50, windSpeedKmh: 10 },
          userContext: { isSensitiveGroup: false, primaryActivity: 'general', locale: 'en' },
          injectedUnknownField: 'exploit',
        }),
      });

      const res = await guidancePost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('VALIDATION_ERROR');
    });

    it('returns 413 when payload exceeds maximum size limit', async () => {
      const oversizedPayload = {
        aqi: 100,
        category: 'Moderate',
        dominantPollutant: 'pm25',
        pollutantConcentration: 35,
        weather: { temperatureC: 25, humidityPercent: 50, windSpeedKmh: 10 },
        userContext: { isSensitiveGroup: false, primaryActivity: 'general', locale: 'en' },
        scheduleSummary: 'X'.repeat(5000), // exceeds 4KB
      };

      const req = new Request('http://localhost:3000/api/ai/guidance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': String(JSON.stringify(oversizedPayload).length),
          'Sec-Fetch-Site': 'same-origin',
        },
        body: JSON.stringify(oversizedPayload),
      });

      const res = await guidancePost(req);
      expect(res.status).toBe(413);
      const data = await res.json();
      expect(data.error).toBe('PAYLOAD_TOO_LARGE');
    });

    it('returns 429 when client exceeds rate limit', async () => {
      const validPayload = {
        aqi: 100,
        category: 'Moderate',
        dominantPollutant: 'pm25',
        pollutantConcentration: 35,
        weather: { temperatureC: 25, humidityPercent: 50, windSpeedKmh: 10 },
        userContext: { isSensitiveGroup: false, primaryActivity: 'general', locale: 'en' },
      };

      // Exhaust 30 allowed requests
      for (let i = 0; i < 30; i++) {
        const req = new Request('http://localhost:3000/api/ai/guidance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Sec-Fetch-Site': 'same-origin',
            'X-Forwarded-For': '198.51.100.1',
          },
          body: JSON.stringify(validPayload),
        });
        await guidancePost(req);
      }

      // 31st request should be rate-limited
      const limitedReq = new Request('http://localhost:3000/api/ai/guidance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Sec-Fetch-Site': 'same-origin',
          'X-Forwarded-For': '198.51.100.1',
        },
        body: JSON.stringify(validPayload),
      });

      const res = await guidancePost(limitedReq);
      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.error).toBe('RATE_LIMIT_EXCEEDED');
      expect(res.headers.get('Retry-After')).toBeDefined();
    });
  });

  describe('POST /api/ai/copilot', () => {
    it('returns 400 for questions exceeding 200 characters', async () => {
      const req = new Request('http://localhost:3000/api/ai/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Sec-Fetch-Site': 'same-origin',
        },
        body: JSON.stringify({
          question: 'A'.repeat(250),
          aqi: 100,
          category: 'Moderate',
          dominantPollutant: 'pm25',
          pollutantConcentration: 35,
          weather: { temperatureC: 25, humidityPercent: 50, windSpeedKmh: 10 },
        }),
      });

      const res = await copilotPost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('VALIDATION_ERROR');
    });

    it('returns 413 when payload exceeds maximum size limit', async () => {
      const oversized = {
        question: 'Can I go outside?',
        aqi: 100,
        category: 'Moderate',
        dominantPollutant: 'pm25',
        pollutantConcentration: 35,
        weather: { temperatureC: 25, humidityPercent: 50, windSpeedKmh: 10 },
        cityName: 'C'.repeat(5000),
      };

      const req = new Request('http://localhost:3000/api/ai/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': String(JSON.stringify(oversized).length),
          'Sec-Fetch-Site': 'same-origin',
        },
        body: JSON.stringify(oversized),
      });

      const res = await copilotPost(req);
      expect(res.status).toBe(413);
      const data = await res.json();
      expect(data.error).toBe('PAYLOAD_TOO_LARGE');
    });
  });

  describe('GET /api/regional-hotspots', () => {
    it('returns 400 for unknown query parameter', async () => {
      const req = new NextRequest('http://localhost:3000/api/regional-hotspots?unknownParam=1');
      const res = await regionalHotspotsGet(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Unknown parameters rejected');
    });

    it('returns 429 when client exceeds rate limit', async () => {
      for (let i = 0; i < 60; i++) {
        const req = new NextRequest('http://localhost:3000/api/regional-hotspots', {
          headers: { 'X-Forwarded-For': '203.0.113.195' },
        });
        await regionalHotspotsGet(req);
      }

      const limitedReq = new NextRequest('http://localhost:3000/api/regional-hotspots', {
        headers: { 'X-Forwarded-For': '203.0.113.195' },
      });
      const res = await regionalHotspotsGet(limitedReq);
      expect(res.status).toBe(429);
    });
  });
});
