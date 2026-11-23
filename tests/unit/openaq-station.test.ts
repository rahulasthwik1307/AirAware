import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  selectNearestStation,
  parseLatestReadings,
  getNearestOpenAqStation,
  getNearestOpenAqStationDetailed,
  openAqMemoryCache,
  OpenAqLocationItem,
  OpenAqLatestReadingItem,
} from '@/domain/aqi/openaq-adapter';
import {
  calculateCompositeCpcbAqi,
  calculateCpcbPm25SubIndex,
  calculateCpcbPm10SubIndex,
} from '@/domain/aqi/cpcb-benchmark';
import { normalizeAirQualityReport, RawOpenMeteoAirQualityResponse } from '@/domain/aqi/normalizer';
import { GeoLocation } from '@/domain/types';

describe('OpenAQ Ground-Station Integration & Fallback', () => {
  const FIXED_NOW = new Date('2026-11-22T12:00:00Z').getTime();

  beforeEach(() => {
    openAqMemoryCache.clear();
    vi.restoreAllMocks();
  });

  describe('1. Nearest-station selection', () => {
    it('chooses the nearest reference monitor within 25km with recent data', () => {
      const stations: OpenAqLocationItem[] = [
        {
          id: 101,
          name: 'Station Far (18km)',
          distance: 18000,
          isMonitor: true,
          isMobile: false,
          datetimeLast: { utc: '2026-11-22T11:00:00Z' }, // 1h ago
          sensors: [{ id: 1, parameter: { id: 2, name: 'pm25', units: 'µg/m³' } }],
        },
        {
          id: 102,
          name: 'Station Nearest (2.4km)',
          distance: 2400,
          isMonitor: true,
          isMobile: false,
          datetimeLast: { utc: '2026-11-22T11:30:00Z' }, // 30m ago
          sensors: [{ id: 2, parameter: { id: 2, name: 'pm25', units: 'µg/m³' } }],
        },
        {
          id: 103,
          name: 'Station Mid (8.5km)',
          distance: 8500,
          isMonitor: true,
          isMobile: false,
          datetimeLast: { utc: '2026-11-22T11:15:00Z' },
          sensors: [{ id: 3, parameter: { id: 2, name: 'pm25', units: 'µg/m³' } }],
        },
      ];

      const selected = selectNearestStation(stations, 3 * 3600 * 1000, FIXED_NOW);
      expect(selected).not.toBeNull();
      expect(selected?.id).toBe(102);
      expect(selected?.name).toBe('Station Nearest (2.4km)');
    });

    it('rejects stations beyond 25km radius', () => {
      const stations: OpenAqLocationItem[] = [
        {
          id: 201,
          name: 'Out of range station (28km)',
          distance: 28000,
          isMonitor: true,
          isMobile: false,
          datetimeLast: { utc: '2026-11-22T11:30:00Z' },
          sensors: [{ id: 1, parameter: { id: 2, name: 'pm25', units: 'µg/m³' } }],
        },
      ];

      const selected = selectNearestStation(stations, 3 * 3600 * 1000, FIXED_NOW);
      expect(selected).toBeNull();
    });

    it('rejects mobile sensors or non-monitors', () => {
      const stations: OpenAqLocationItem[] = [
        {
          id: 301,
          name: 'Mobile sensor on vehicle',
          distance: 1200,
          isMonitor: true,
          isMobile: true,
          datetimeLast: { utc: '2026-11-22T11:30:00Z' },
          sensors: [{ id: 1, parameter: { id: 2, name: 'pm25', units: 'µg/m³' } }],
        },
        {
          id: 302,
          name: 'Low cost unverified monitor',
          distance: 800,
          isMonitor: false,
          isMobile: false,
          datetimeLast: { utc: '2026-11-22T11:30:00Z' },
          sensors: [{ id: 2, parameter: { id: 2, name: 'pm25', units: 'µg/m³' } }],
        },
      ];

      const selected = selectNearestStation(stations, 3 * 3600 * 1000, FIXED_NOW);
      expect(selected).toBeNull();
    });
  });

  describe('2. Stale fallback (> 3 hours)', () => {
    it('discards stations whose latest reading is older than 3 hours', () => {
      const staleStations: OpenAqLocationItem[] = [
        {
          id: 401,
          name: 'Stale Station (4 hours old)',
          distance: 3000,
          isMonitor: true,
          isMobile: false,
          datetimeLast: { utc: '2026-11-22T07:45:00Z' }, // 4h 15m ago relative to 12:00:00Z
          sensors: [{ id: 1, parameter: { id: 2, name: 'pm25', units: 'µg/m³' } }],
        },
      ];

      const selected = selectNearestStation(staleStations, 3 * 3600 * 1000, FIXED_NOW);
      expect(selected).toBeNull();
    });

    it('rejects individual sensor readings older than 3 hours during measurement parsing', () => {
      const station: OpenAqLocationItem = {
        id: 501,
        name: 'Marginally Fresh Station',
        distance: 4000,
        isMonitor: true,
        sensors: [{ id: 10, parameter: { id: 2, name: 'pm25', units: 'µg/m³' } }],
      };

      const staleReadings: OpenAqLatestReadingItem[] = [
        {
          locationsId: 501,
          sensorsId: 10,
          value: 145.2,
          datetime: { utc: '2026-11-22T08:00:00Z' }, // 4h old
        },
      ];

      const parsed = parseLatestReadings(station, staleReadings, 3 * 3600 * 1000, FIXED_NOW);
      expect(parsed).toBeNull();
    });
  });

  describe('3. Missing-key fallback', () => {
    it('returns null immediately when apiKey is null or empty without making network requests', async () => {
      const mockFetch = vi.fn();
      const result = await getNearestOpenAqStation(28.61, 77.20, {
        apiKeyOverride: null,
        fetchFn: mockFetch as any,
      });

      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('4. HTTP 429 Rate Limit Fallback', () => {
    it('catches HTTP 429 response, executes zero retry loops, and falls back gracefully to null', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 429,
        ok: false,
        headers: new Headers({ 'x-ratelimit-remaining': '0' }),
        json: async () => ({ error: 'Rate limit exceeded' }),
      });

      const result = await getNearestOpenAqStation(28.61, 77.20, {
        apiKeyOverride: 'test_valid_key_12345',
        fetchFn: mockFetch as any,
      });

      expect(result).toBeNull();
      // Verifies only 1 single request was made — absolutely NO retry loops burning quota
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('5. Unit handling & data integrity', () => {
    it('parses valid numeric concentrations in µg/m³ and ignores invalid/negative numbers', () => {
      const station: OpenAqLocationItem = {
        id: 601,
        name: 'Govt Station Clean',
        distance: 3500,
        isMonitor: true,
        sensors: [
          { id: 21, parameter: { id: 2, name: 'pm25', units: 'µg/m³' } },
          { id: 22, parameter: { id: 1, name: 'pm10', units: 'µg/m³' } },
        ],
      };

      const readings: OpenAqLatestReadingItem[] = [
        {
          locationsId: 601,
          sensorsId: 21,
          value: 88.5,
          datetime: { utc: '2026-11-22T11:45:00Z' }, // 15m ago
        },
        {
          locationsId: 601,
          sensorsId: 22,
          value: 165.0,
          datetime: { utc: '2026-11-22T11:45:00Z' },
        },
      ];

      const parsed = parseLatestReadings(station, readings, 3 * 3600 * 1000, FIXED_NOW);
      expect(parsed).not.toBeNull();
      expect(parsed?.pm25).toBe(88.5);
      expect(parsed?.pm10).toBe(165.0);
      expect(parsed?.distanceKm).toBe(3.5);
      expect(parsed?.sourceType).toBe('station');
    });

    it('rejects negative or NaN concentration values', () => {
      const station: OpenAqLocationItem = {
        id: 602,
        name: 'Faulty Sensor Station',
        distance: 2000,
        sensors: [{ id: 31, parameter: { id: 2, name: 'pm25', units: 'µg/m³' } }],
      };

      const readings: OpenAqLatestReadingItem[] = [
        {
          locationsId: 602,
          sensorsId: 31,
          value: -999, // Instrument error code
          datetime: { utc: '2026-11-22T11:45:00Z' },
        },
      ];

      const parsed = parseLatestReadings(station, readings, 3 * 3600 * 1000, FIXED_NOW);
      expect(parsed).toBeNull();
    });
  });

  describe('6. Mumbai vs Delhi station isolation', () => {
    it('picks different geographic stations for Delhi vs Mumbai coordinates', async () => {
      const recentUtc = new Date(Date.now() - 30 * 60 * 1000).toISOString();

      const delhiStation: OpenAqLocationItem = {
        id: 7001,
        name: 'Mandir Marg, New Delhi - DPCC',
        distance: 2600,
        isMonitor: true,
        datetimeLast: { utc: recentUtc },
        sensors: [{ id: 101, parameter: { id: 2, name: 'pm25', units: 'µg/m³' } }],
      };

      const mumbaiStation: OpenAqLocationItem = {
        id: 8001,
        name: 'Colaba, Mumbai - MPCB',
        distance: 3100,
        isMonitor: true,
        datetimeLast: { utc: recentUtc },
        sensors: [{ id: 201, parameter: { id: 2, name: 'pm25', units: 'µg/m³' } }],
      };

      const mockFetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('28.61') && url.includes('77.21')) {
          // Delhi locations
          return Promise.resolve({
            status: 200,
            ok: true,
            headers: new Headers({ 'x-ratelimit-remaining': '50' }),
            json: async () => ({ results: [delhiStation] }),
          });
        }
        if (url.includes('19.08') && url.includes('72.88')) {
          // Mumbai locations
          return Promise.resolve({
            status: 200,
            ok: true,
            headers: new Headers({ 'x-ratelimit-remaining': '50' }),
            json: async () => ({ results: [mumbaiStation] }),
          });
        }
        if (url.includes('7001/latest')) {
          return Promise.resolve({
            status: 200,
            ok: true,
            headers: new Headers({ 'x-ratelimit-remaining': '49' }),
            json: async () => ({
              results: [
                {
                  locationsId: 7001,
                  sensorsId: 101,
                  value: 195,
                  datetime: { utc: recentUtc },
                },
              ],
            }),
          });
        }
        if (url.includes('8001/latest')) {
          return Promise.resolve({
            status: 200,
            ok: true,
            headers: new Headers({ 'x-ratelimit-remaining': '49' }),
            json: async () => ({
              results: [
                {
                  locationsId: 8001,
                  sensorsId: 201,
                  value: 75,
                  datetime: { utc: recentUtc },
                },
              ],
            }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const delhiResult = await getNearestOpenAqStation(28.61, 77.21, {
        apiKeyOverride: 'test_key',
        fetchFn: mockFetch as any,
      });

      const mumbaiResult = await getNearestOpenAqStation(19.08, 72.88, {
        apiKeyOverride: 'test_key',
        fetchFn: mockFetch as any,
      });

      expect(delhiResult?.stationId).toBe(7001);
      expect(delhiResult?.stationName).toContain('New Delhi');
      expect(delhiResult?.pm25).toBe(195);

      expect(mumbaiResult?.stationId).toBe(8001);
      expect(mumbaiResult?.stationName).toContain('Mumbai');
      expect(mumbaiResult?.pm25).toBe(75);
    });
  });

  describe('7. CPCB Composite Index & Sub-Index Maximum', () => {
    it('selects PM2.5 sub-index when PM2.5 is the dominant driver', () => {
      // PM2.5 = 100 µg/m³ -> CPCB sub-index = 233 (Poor)
      // PM10 = 80 µg/m³ -> CPCB sub-index = 80 (Satisfactory)
      const pm25Sub = calculateCpcbPm25SubIndex(100);
      const pm10Sub = calculateCpcbPm10SubIndex(80);
      expect(pm25Sub).toBe(233);
      expect(pm10Sub).toBe(80);

      const composite = calculateCompositeCpcbAqi(100, 80, true);
      expect(composite.aqi).toBe(233);
      expect(composite.category).toBe('Poor');
      expect(composite.dominantSubIndexPollutant).toBe('PM2.5');
      expect(composite.indexLabel).toBe('CPCB AQI (PM2.5/PM10 sub-index)');
    });

    it('selects PM10 sub-index when PM10 is the dominant driver', () => {
      // PM2.5 = 25 µg/m³ -> CPCB sub-index = 42 (Good)
      // PM10 = 260 µg/m³ -> CPCB sub-index = 210 (Poor)
      const pm25Sub = calculateCpcbPm25SubIndex(25);
      const pm10Sub = calculateCpcbPm10SubIndex(260);
      expect(pm25Sub).toBe(42);
      expect(pm10Sub).toBe(210);

      const composite = calculateCompositeCpcbAqi(25, 260, true);
      expect(composite.aqi).toBe(210);
      expect(composite.category).toBe('Poor');
      expect(composite.dominantSubIndexPollutant).toBe('PM10');
      expect(composite.indexLabel).toBe('CPCB AQI (PM2.5/PM10 sub-index)');
    });

    it('labels CAMS fallback as modeled PM2.5 sub-index', () => {
      const camsFallback = calculateCompositeCpcbAqi(115, null, false);
      expect(camsFallback.aqi).toBe(283);
      expect(camsFallback.category).toBe('Poor');
      expect(camsFallback.indexLabel).toBe('PM2.5 sub-index, modeled');
    });

    it('integrates station data smoothly into normalizeAirQualityReport', () => {
      const mockLocation: GeoLocation = {
        id: 1,
        name: 'Delhi',
        country: 'India',
        countryCode: 'IN',
        latitude: 28.61,
        longitude: 77.21,
        timezone: 'Asia/Kolkata',
      };

      const rawWithStation: RawOpenMeteoAirQualityResponse = {
        latitude: 28.61,
        longitude: 77.21,
        sourceType: 'station',
        stationName: 'Mandir Marg DPCC',
        distanceKm: 2.6,
        observedAt: '2026-11-22T11:45:00Z',
        stationPm25: 145.0,
        stationPm10: 220.0,
        current: {
          time: '2026-11-22T12:00',
          pm2_5: 90.0, // CAMS modeled value, should be overridden by 145.0
          pm10: 150.0,
          us_aqi: 169,
        },
        hourly: {
          time: ['2026-11-22T12:00', '2026-11-22T13:00'],
          us_aqi: [169, 172],
          pm2_5: [90.0, 95.0],
        },
      };

      const report = normalizeAirQualityReport(rawWithStation, mockLocation, 'US_EPA');
      expect(report.sourceType).toBe('station');
      expect(report.stationName).toBe('Mandir Marg DPCC');
      expect(report.distanceKm).toBe(2.6);
      expect(report.observedAt).toBe('2026-11-22T11:45:00Z');
      expect(report.isModelled).toBe(false);
      expect(report.dataSource).toBe('OPENAQ_GROUND_STATION');
      // Measured PM2.5 overrides modeled concentration
      expect(report.pollutants.pm2_5.concentration).toBe(145.0);
      expect(report.cpcbComparison?.indexLabel).toBe('CPCB AQI (PM2.5/PM10 sub-index)');
    });
  });

  describe('8. getNearestOpenAqStationDetailed fallback paths and error boundaries', () => {
    it('returns no recent station fallback when API key is missing', async () => {
      const result = await getNearestOpenAqStationDetailed(28.6, 77.2, {
        apiKeyOverride: null,
      });
      expect(result.station).toBeNull();
      expect(result.fallbackReason).toBe('no recent station within 25 km');
    });

    it('returns service busy when location search returns 429', async () => {
      const mockFetch = vi.fn().mockResolvedValue(new Response('', { status: 429 }));
      const result = await getNearestOpenAqStationDetailed(28.6, 77.2, {
        apiKeyOverride: 'test-key',
        fetchFn: mockFetch,
        forceRefresh: true,
      });
      expect(result.station).toBeNull();
      expect(result.fallbackReason).toBe('service busy');
    });

    it('returns service busy when rate limit remaining is zero', async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ results: [] }), {
          status: 200,
          headers: { 'x-ratelimit-remaining': '0' },
        })
      );
      const result = await getNearestOpenAqStationDetailed(28.6, 77.2, {
        apiKeyOverride: 'test-key',
        fetchFn: mockFetch,
        forceRefresh: true,
      });
      expect(result.station).toBeNull();
      expect(result.fallbackReason).toBe('service busy');
    });

    it('returns no recent station when search returns empty results array', async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ results: [] }), {
          status: 200,
          headers: { 'x-ratelimit-remaining': '50' },
        })
      );
      const result = await getNearestOpenAqStationDetailed(28.6, 77.2, {
        apiKeyOverride: 'test-key',
        fetchFn: mockFetch,
        forceRefresh: true,
      });
      expect(result.station).toBeNull();
      expect(result.fallbackReason).toBe('no recent station within 25 km');
    });

    it('returns station data too old when stations exist but are expired', async () => {
      const expiredStation: OpenAqLocationItem = {
        id: 999,
        name: 'Stale Station',
        distance: 2000,
        isMonitor: true,
        datetimeLast: { utc: '2020-01-01T00:00:00Z' },
        sensors: [{ id: 1, parameter: { id: 2, name: 'pm25', units: 'µg/m³' } }],
      };

      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ results: [expiredStation] }), {
          status: 200,
          headers: { 'x-ratelimit-remaining': '50' },
        })
      );

      const result = await getNearestOpenAqStationDetailed(28.6, 77.2, {
        apiKeyOverride: 'test-key',
        fetchFn: mockFetch,
        forceRefresh: true,
      });
      expect(result.station).toBeNull();
      expect(result.fallbackReason).toBe('station data too old');
    });

    it('handles network abort or fetch exceptions by returning service busy', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network connection timeout'));
      const result = await getNearestOpenAqStationDetailed(28.6, 77.2, {
        apiKeyOverride: 'test-key',
        fetchFn: mockFetch,
        forceRefresh: true,
      });
      expect(result.station).toBeNull();
      expect(result.fallbackReason).toBe('service busy');
    });
  });
});
