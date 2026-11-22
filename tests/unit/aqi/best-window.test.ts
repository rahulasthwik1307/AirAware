import { describe, it, expect } from 'vitest';
import { findBestDaytimeWindow } from '@/domain/aqi/best-window';
import { ForecastPoint } from '@/domain/types';

function createMockForecast(hourlyAqis: number[]): ForecastPoint[] {
  return hourlyAqis.map((aqi, i) => {
    const hourStr = String(i % 24).padStart(2, '0');
    return {
      time: `2026-11-22T${hourStr}:00:00Z`,
      displayTime: `${hourStr}:00`,
      activeAqi: aqi,
      usAqi: aqi,
      europeanAqi: null,
      tier: null,
      pm25: Math.round(aqi * 0.6),
    };
  });
}

describe('findBestDaytimeWindow', () => {
  it('returns null for empty forecast', () => {
    expect(findBestDaytimeWindow([])).toBeNull();
  });

  it('selects the lowest AQI consecutive daytime window', () => {
    // 24 hours: high morning (06-11: 250), lower afternoon (14-16: 60), high evening (18-23: 300)
    const aqis = [
      220, 240, 260, 270, 280, 290, // 00 - 05
      310, 320, 280, 250, 200, 150, // 06 - 11
      120, 90, 60, 65, 110, 160,    // 12 - 17 (14-15 are 60, 65)
      220, 280, 320, 350, 300, 250, // 18 - 23
    ];
    const forecast = createMockForecast(aqis);
    const result = findBestDaytimeWindow(forecast, 2);

    expect(result).not.toBeNull();
    expect(result?.displayWindow).toContain('2 PM – 4 PM');
    expect(result?.averageAqi).toBeLessThan(70);
    expect(result?.category).toBe('Satisfactory');
  });
});
