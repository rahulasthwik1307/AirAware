// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AqiHeroCard } from '@/components/dashboard/AqiHeroCard';
import { AirQualityReport } from '@/domain/types';

describe('Overview Panel ViewSwitcher & 6-Hour Exposure Window Flow', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  const mockReport = {
    location: {
      id: 1,
      name: 'New Delhi',
      country: 'India',
      countryCode: 'IN',
      latitude: 28.6139,
      longitude: 77.209,
      timezone: 'Asia/Kolkata',
    },
    coordinates: {
      latitude: 28.6139,
      longitude: 77.209,
    },
    providerAqi: 245,
    dominantPollutant: 'pm25',
    activeStandard: 'CPCB_NAQI',
    sourceType: 'station',
    stationName: 'Anand Vihar, Delhi',
    observedAt: '2026-11-23T12:00:00Z',
    modelTimestamp: '2026-11-23T12:00:00Z',
    localTime: '12:00 PM',
    intervalSeconds: 3600,
    dataSource: 'OPENAQ_GROUND_STATION',
    isModelled: false,
    isStale: false,
    standardMetadata: {
      key: 'CPCB_NAQI',
      label: 'CPCB NAQI (India)',
      governingBody: 'Central Pollution Control Board',
      isDefault: true,
    },
    pollutants: {
      pm2_5: { concentration: 110.5, unit: 'µg/m³', isStationMeasurement: true },
      pm10: { concentration: 215.0, unit: 'µg/m³', isStationMeasurement: true },
    },
    forecast: [
      { time: '2026-11-23T12:00', displayTime: '12:00', aqi: 245, activeAqi: 245, isCurrentHour: true },
      { time: '2026-11-23T13:00', displayTime: '13:00', aqi: 230, activeAqi: 230, isCurrentHour: false },
      { time: '2026-11-23T14:00', displayTime: '14:00', aqi: 210, activeAqi: 210, isCurrentHour: false },
      { time: '2026-11-23T15:00', displayTime: '15:00', aqi: 195, activeAqi: 195, isCurrentHour: false },
      { time: '2026-11-23T16:00', displayTime: '16:00', aqi: 220, activeAqi: 220, isCurrentHour: false },
      { time: '2026-11-23T17:00', displayTime: '17:00', aqi: 260, activeAqi: 260, isCurrentHour: false },
    ],
    tier: {
      level: 4,
      label: 'Poor',
      colorToken: '#EF4444',
      bgToken: '#FEF2F2',
      borderToken: '#FCA5A5',
      description: 'Breathing discomfort to people on prolonged exposure',
      healthAdvisory: 'Avoid prolonged outdoor cardio',
    },
  } as unknown as AirQualityReport;

  it('maintains the 6-hour exposure window visible across all three view modes', () => {
    render(
      <AqiHeroCard
        report={mockReport}
        weather={null}
        onSwitchStandard={vi.fn()}
        onSelectLocation={vi.fn()}
      />
    );

    // 1. Initial Mode: Overview
    expect(screen.getByRole('tab', { name: /overview/i }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText(/rapid 6-hour exposure window/i)).toBeDefined();

    // 2. Switch Mode to: Regional compare
    const compareTab = screen.getByRole('tab', { name: /regional compare/i });
    fireEvent.click(compareTab);
    expect(compareTab.getAttribute('aria-selected')).toBe('true');
    // 6-Hour window remains visible!
    expect(screen.getByText(/rapid 6-hour exposure window/i)).toBeDefined();

    // 3. Switch Mode to: 3D globe
    const globeTab = screen.getByRole('tab', { name: /3d globe/i });
    fireEvent.click(globeTab);
    expect(globeTab.getAttribute('aria-selected')).toBe('true');
    // 6-Hour window remains visible!
    expect(screen.getByText(/rapid 6-hour exposure window/i)).toBeDefined();
  });
});
