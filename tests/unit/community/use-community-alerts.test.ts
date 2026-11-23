// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCommunityAlerts } from '@/hooks/community/useCommunityAlerts';

describe('useCommunityAlerts Hook Contract', () => {
  const originalLocalStorage = globalThis.window?.localStorage;

  beforeEach(() => {
    const store: Record<string, string> = {};
    const mockStorage = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach((k) => delete store[k]);
      }),
      length: 0,
      key: vi.fn(() => null),
    };
    vi.stubGlobal('window', { localStorage: mockStorage });
  });

  afterEach(() => {
    if (originalLocalStorage) {
      vi.stubGlobal('window', { localStorage: originalLocalStorage });
    }
  });

  it('yields empty alerts list and zero unread count when AQI is clean (< 200) and no local incidents exist', () => {
    const { result } = renderHook(() =>
      useCommunityAlerts({
        locationName: 'Bengaluru, Karnataka',
        aqi: 65,
        prominentPollutant: 'PM2.5',
      })
    );

    expect(result.current.isHydrated).toBe(true);
    expect(result.current.alerts).toHaveLength(0);
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.incidents).toHaveLength(0);
  });

  it('generates regulatory and ventilation alerts when AQI is elevated (>= 200)', () => {
    const { result } = renderHook(() =>
      useCommunityAlerts({
        locationName: 'Connaught Place, New Delhi',
        aqi: 320,
        prominentPollutant: 'PM2.5',
      })
    );

    expect(result.current.alerts.length).toBeGreaterThan(0);
    expect(result.current.unreadCount).toBeGreaterThan(0);
    expect(result.current.isDelhiNcr).toBe(true);
    expect(result.current.activeGrapStage).toContain('GRAP Stage 2');
  });

  it('maps user-created incidents into alerts feed and increments unread count', () => {
    const { result } = renderHook(() =>
      useCommunityAlerts({
        locationName: 'Bengaluru, Karnataka',
        aqi: 70,
        prominentPollutant: 'PM2.5',
      })
    );

    expect(result.current.alerts).toHaveLength(0);
    expect(result.current.unreadCount).toBe(0);

    act(() => {
      result.current.addIncident({
        category: 'WASTE_BURNING',
        title: 'Neighborhood garden leaf fire',
        description: 'Persistent smoke entering apartment balconies',
        locationName: 'Indiranagar 100ft Road',
        severity: 'HIGH',
      });
    });

    expect(result.current.incidents).toHaveLength(1);
    expect(result.current.alerts).toHaveLength(1);
    expect(result.current.alerts[0].category).toBe('COMMUNITY_REPORT');
    expect(result.current.alerts[0].title).toContain('Neighborhood garden leaf fire');
    expect(result.current.unreadCount).toBe(1);
  });

  it('marking an alert as read decrements the unread count', () => {
    const { result } = renderHook(() =>
      useCommunityAlerts({
        locationName: 'New Delhi',
        aqi: 410,
        prominentPollutant: 'PM2.5',
      })
    );

    const initialUnread = result.current.unreadCount;
    expect(initialUnread).toBeGreaterThan(0);

    const alertId = result.current.alerts[0].id;
    act(() => {
      result.current.markAlertRead(alertId);
    });

    expect(result.current.unreadCount).toBe(initialUnread - 1);
  });

  it('marks all alerts as read on demand', () => {
    const { result } = renderHook(() =>
      useCommunityAlerts({
        locationName: 'New Delhi',
        aqi: 460,
        prominentPollutant: 'PM2.5',
      })
    );

    expect(result.current.unreadCount).toBeGreaterThan(0);

    act(() => {
      result.current.markAllAlertsRead();
    });

    expect(result.current.unreadCount).toBe(0);
    expect(result.current.alerts.every((a) => a.isRead)).toBe(true);
  });

  it('evaluates all Delhi-NCR GRAP stages across AQI breakpoints', () => {
    const stages = [
      { aqi: 470, expected: 'GRAP Stage 4: Severe+ Air' },
      { aqi: 415, expected: 'GRAP Stage 3: Severe Air' },
      { aqi: 320, expected: 'GRAP Stage 2: Very Poor Air' },
      { aqi: 220, expected: 'GRAP Stage 1: Poor Air' },
      { aqi: 150, expected: 'GRAP: Standard (Normal)' },
    ];

    stages.forEach(({ aqi, expected }) => {
      const { result } = renderHook(() =>
        useCommunityAlerts({
          locationName: 'Noida, Uttar Pradesh',
          aqi,
        })
      );
      expect(result.current.activeGrapStage).toBe(expected);
      expect(result.current.isDelhiNcr).toBe(true);
    });
  });

  it('evaluates all non-Delhi CPCB national categories across AQI breakpoints', () => {
    const categories = [
      { aqi: 460, expected: 'CPCB: Severe+ Air' },
      { aqi: 410, expected: 'CPCB: Severe Air' },
      { aqi: 310, expected: 'CPCB: Very Poor Air' },
      { aqi: 210, expected: 'CPCB: Poor Air' },
      { aqi: 120, expected: 'CPCB: Moderate Air' },
      { aqi: 65, expected: 'CPCB: Satisfactory' },
      { aqi: 30, expected: 'CPCB: Good Air' },
    ];

    categories.forEach(({ aqi, expected }) => {
      const { result } = renderHook(() =>
        useCommunityAlerts({
          locationName: 'Mumbai, Maharashtra',
          aqi,
        })
      );
      expect(result.current.activeGrapStage).toBe(expected);
      expect(result.current.isDelhiNcr).toBe(false);
    });
  });

  it('generates CPCB complaint dossier and RWA society bulletin', () => {
    const { result } = renderHook(() =>
      useCommunityAlerts({
        locationName: 'Vasant Kunj, New Delhi',
        aqi: 350,
      })
    );

    const dossier = result.current.generateCpcbComplaint({
      id: 'inc-1',
      category: 'WASTE_BURNING',
      title: 'Leaves burning in park',
      description: 'Open burning of garden waste behind block C',
      locationName: 'Sector C, Vasant Kunj',
      timestamp: '2026-11-23T08:00:00Z',
      severity: 'HIGH',
      status: 'LOGGED_LOCALLY',
    });

    expect(dossier).toContain('CPCB SAMEER GRIEVANCE DOSSIER');
    expect(dossier).toContain('Open burning of garden waste behind block C');

    const bulletin = result.current.generateRwaBulletin('Palm Grove RWA');
    expect(bulletin).toContain('PALM GROVE RWA');
    expect(bulletin).toContain('Air Quality');
  });

  it('passes through historical trend data or defaults to empty array', () => {
    const mockTrend = [
      {
        date: '2026-11-22',
        dayLabel: 'Sun 22',
        aqi: 120,
        pm25: 45,
        nox: 20,
        inversionCeilingMeters: 400,
        isSevereDay: false,
      },
      {
        date: '2026-11-23',
        dayLabel: 'Mon 23',
        aqi: 180,
        pm25: 75,
        nox: 35,
        inversionCeilingMeters: 350,
        isSevereDay: false,
      },
    ];

    const { result } = renderHook(() =>
      useCommunityAlerts({
        locationName: 'Delhi',
        historicalTrend: mockTrend,
      })
    );
    expect(result.current.historicalTrend).toEqual(mockTrend);

    const { result: emptyResult } = renderHook(() =>
      useCommunityAlerts({
        locationName: 'Delhi',
        historicalTrend: [],
      })
    );
    expect(emptyResult.current.historicalTrend).toEqual([]);
  });
});
