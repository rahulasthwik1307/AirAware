// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useRegionalHotspots } from '@/components/dashboard/hero/useRegionalHotspots';

describe('useRegionalHotspots Hook', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('does not fetch until enabled is true', () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    const { result } = renderHook(() => useRegionalHotspots(false));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.regionalHotspots).toEqual([]);
    expect(result.current.isHotspotsLoading).toBe(false);
    expect(result.current.hotspotsError).toBeNull();
  });

  it('fetches and populates hotspots when enabled is true', async () => {
    const mockCities = [
      {
        id: 1,
        name: 'Delhi',
        country: 'India',
        countryCode: 'IN',
        admin1: 'Delhi',
        latitude: 28.61,
        longitude: 77.23,
        aqi: 245,
        pm25: 110,
        pm10: 180,
        tierLabel: 'Poor',
        colorToken: '#ea580c',
        time: '2026-11-23T08:00:00Z',
      },
      {
        id: 2,
        name: 'Mumbai',
        country: 'India',
        countryCode: 'IN',
        admin1: 'Maharashtra',
        latitude: 19.07,
        longitude: 72.87,
        aqi: 142,
        pm25: 52,
        pm10: 88,
        tierLabel: 'Moderate',
        colorToken: '#f59e0b',
        time: '2026-11-23T08:00:00Z',
      },
    ];

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        cities: mockCities,
      }),
    });

    const { result } = renderHook(() => useRegionalHotspots(true));

    await waitFor(() => {
      expect(result.current.regionalHotspots.length).toBe(2);
    });

    expect(result.current.isHotspotsLoading).toBe(false);
    expect(result.current.hotspotsError).toBeNull();
    expect(result.current.regionalHotspots[0].name).toBe('Delhi');
  });

  it('yields an error state without numbers when hotspot fetch fails', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

    const { result } = renderHook(() => useRegionalHotspots(true));

    await waitFor(() => {
      expect(result.current.hotspotsError).not.toBeNull();
    });

    expect(result.current.isHotspotsLoading).toBe(false);
    expect(result.current.regionalHotspots).toEqual([]);
    // Must yield an error state without numbers
    expect(result.current.hotspotsError).not.toMatch(/\d/);
    expect(result.current.hotspotsError).toContain('Could not load regional comparisons right now');
  });

  it('yields an error state without numbers when API responds with error status', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ success: false, error: 'Upstream gateway timeout' }),
    });

    const { result } = renderHook(() => useRegionalHotspots(true));

    await waitFor(() => {
      expect(result.current.hotspotsError).not.toBeNull();
    });

    expect(result.current.isHotspotsLoading).toBe(false);
    expect(result.current.regionalHotspots).toEqual([]);
    expect(result.current.hotspotsError).not.toMatch(/\d/);
  });

  it('allows retrying after an error', async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        throw new Error('Initial network error');
      }
      return {
        ok: true,
        json: async () => ({
          success: true,
          cities: [
            {
              id: 1,
              name: 'Bengaluru',
              country: 'India',
              countryCode: 'IN',
              admin1: 'Karnataka',
              latitude: 12.97,
              longitude: 77.59,
              aqi: 65,
              pm25: 18,
              pm10: 40,
              tierLabel: 'Satisfactory',
              colorToken: '#16a34a',
              time: '2026-11-23T08:00:00Z',
            },
          ],
        }),
      };
    });

    const { result } = renderHook(() => useRegionalHotspots(true));

    await waitFor(() => {
      expect(result.current.hotspotsError).not.toBeNull();
    });

    act(() => {
      result.current.retryHotspots();
    });

    await waitFor(() => {
      expect(result.current.regionalHotspots.length).toBe(1);
    });

    expect(result.current.hotspotsError).toBeNull();
    expect(result.current.regionalHotspots[0].name).toBe('Bengaluru');
  });
});
