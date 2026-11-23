import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { GET as airQualityGet } from '@/app/api/air-quality/route';
import { GET as weatherGet } from '@/app/api/weather/route';
import { GET as searchGet } from '@/app/api/locations/search/route';
import { GET as regionalHotspotsGet } from '@/app/api/regional-hotspots/route';
import { POST as guidancePost } from '@/app/api/ai/guidance/route';
import { POST as copilotPost } from '@/app/api/ai/copilot/route';

function walkDir(dir: string): string[] {
  let files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(walkDir(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('Architecture Invariants & Protection Tests', () => {
  describe('1. Pure Domain Boundary (Zero React or Next.js dependencies in src/domain)', () => {
    it('ensures no file under src/domain imports react, react-dom, next, or components', () => {
      const domainDir = path.resolve(__dirname, '../../src/domain');
      const files = walkDir(domainDir);
      expect(files.length).toBeGreaterThan(0);

      const forbiddenPatterns = [
        /from\s+['"]react['"]/,
        /from\s+['"]react\/.*['"]/,
        /from\s+['"]react-dom['"]/,
        /from\s+['"]react-dom\/.*['"]/,
        /from\s+['"]next\/.+['"]/,
        /from\s+['"]@\/components\/.*['"]/,
      ];

      const violations: Array<{ file: string; match: string }> = [];

      for (const file of files) {
        // Skip test files if any exist under domain
        if (file.includes('__tests__') || file.endsWith('.test.ts') || file.endsWith('.spec.ts')) {
          continue;
        }

        const content = fs.readFileSync(file, 'utf8');
        for (const pattern of forbiddenPatterns) {
          const match = content.match(pattern);
          if (match) {
            violations.push({
              file: path.relative(domainDir, file),
              match: match[0],
            });
          }
        }
      }

      expect(violations).toEqual([]);
    });
  });

  describe('2. Strict Route Handlers (Every API route rejects unknown fields with 400)', () => {
    it('GET /api/air-quality rejects unknown query parameters with 400', async () => {
      const req = new NextRequest('http://localhost:3000/api/air-quality?latitude=28.6&longitude=77.2&unknownField=evil');
      const res = await airQualityGet(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it('GET /api/weather rejects unknown query parameters with 400', async () => {
      const req = new NextRequest('http://localhost:3000/api/weather?latitude=28.6&longitude=77.2&unknownParam=evil');
      const res = await weatherGet(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it('GET /api/locations/search rejects unknown query parameters with 400', async () => {
      const req = new NextRequest('http://localhost:3000/api/locations/search?name=Delhi&unknownKey=evil');
      const res = await searchGet(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it('GET /api/regional-hotspots rejects unknown query parameters with 400', async () => {
      const req = new NextRequest('http://localhost:3000/api/regional-hotspots?unexpectedParam=evil');
      const res = await regionalHotspotsGet(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it('POST /api/ai/guidance rejects unknown payload fields with 400', async () => {
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
          unrecognizedFieldKey: 'malicious',
        }),
      });

      const res = await guidancePost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('VALIDATION_ERROR');
    });

    it('POST /api/ai/copilot rejects unknown payload fields with 400', async () => {
      const req = new Request('http://localhost:3000/api/ai/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Sec-Fetch-Site': 'same-origin',
        },
        body: JSON.stringify({
          question: 'What is the air quality?',
          aqi: 100,
          category: 'Moderate',
          dominantPollutant: 'pm25',
          pollutantConcentration: 35,
          weather: { temperatureC: 25, humidityPercent: 50, windSpeedKmh: 10 },
          unrecognizedFieldKey: 'malicious',
        }),
      });

      const res = await copilotPost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('VALIDATION_ERROR');
    });
  });
});
