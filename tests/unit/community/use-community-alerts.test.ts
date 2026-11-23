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
});
