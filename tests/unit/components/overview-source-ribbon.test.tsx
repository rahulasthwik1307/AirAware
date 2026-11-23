// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SourceRibbon } from '@/components/dashboard/hero/SourceRibbon';
import { OverviewPanel } from '@/components/dashboard/hero/OverviewPanel';
import { AirQualityReport } from '@/domain/types';

describe('OverviewPanel and SourceRibbon Component Telemetry Provenance', () => {
  const baseReport: AirQualityReport = {
    providerAqi: 85,
    dominantPollutant: 'pm2_5',
    sourceType: 'station',
    stationName: 'Anand Vihar, Delhi - DPCC',
    distanceKm: 4.2,
    observedAt: '2026-11-23T10:00:00Z',
    modelTimestamp: '2026-11-23T10:00:00Z',
    localTime: '10:00 AM',
    modelFallbackReason: null,
    tier: {
      level: 2,
      label: 'Satisfactory',
      colorToken: '#4d7c0f',
      bgToken: '#F7FEE7',
      borderToken: '#D9F99D',
      description: 'Air quality is acceptable.',
      healthAdvisory: 'Acceptable air quality.',
    },
    location: {
      id: 1273294,
      name: 'New Delhi',
      country: 'India',
      countryCode: 'IN',
      admin1: 'Delhi',
      latitude: 28.6139,
      longitude: 77.209,
      timezone: 'Asia/Kolkata',
    },
    coordinates: { latitude: 28.6139, longitude: 77.209 },
    pollutants: {
      pm2_5: {
        concentration: 48,
        unit: 'µg/m³',
        displayName: 'PM2.5',
        subIndex: 85,
        tier: null,
      },
    },
    forecast: [],
    activeStandard: 'CPCB_NAQI',
  } as unknown as AirQualityReport;

  it('renders ground station label, name, and distance when sourceType is station', () => {
    render(<SourceRibbon report={baseReport} aqiColor="#4d7c0f" />);

    expect(screen.getByText(/Ground station:/i)).toBeTruthy();
    expect(screen.getByText('Anand Vihar, Delhi - DPCC')).toBeTruthy();
    expect(screen.getByText(/4\.2 km away/i)).toBeTruthy();
    expect(screen.queryByText(/This station is far from you/i)).toBeNull();
  });

  it('renders the "far station" warning note when station distance exceeds 10 km', () => {
    const farReport = {
      ...baseReport,
      distanceKm: 14.8,
    };

    render(<SourceRibbon report={farReport} aqiColor="#4d7c0f" />);

    expect(screen.getByText(/14\.8 km away/i)).toBeTruthy();
    expect(screen.getByText(/This station is far from you; air near you may differ\./i)).toBeTruthy();
  });

  it('renders modeled estimate label and exact modelFallbackReason when sourceType is model', () => {
    const customFallbackReason = 'Primary station offline; switched to CAMS atmospheric model';
    const modeledReport: AirQualityReport = {
      ...baseReport,
      sourceType: 'model',
      stationName: null,
      distanceKm: null,
      modelFallbackReason: customFallbackReason,
    };

    render(<SourceRibbon report={modeledReport} aqiColor="#4d7c0f" />);

    expect(screen.getByText(/Modeled estimate \(Copernicus CAMS via Open-Meteo, ~45 km grid\)/i)).toBeTruthy();
    expect(screen.getByText(new RegExp(customFallbackReason, 'i'))).toBeTruthy();
  });

  it('renders OverviewPanel with correct landmark, tabpanel role, and location heading', () => {
    render(
      <OverviewPanel
        report={baseReport}
        effectiveTierLabel="Satisfactory"
        dominantPollutant="PM2.5"
        aqiColor="#4d7c0f"
        isStation={true}
      />
    );

    const panel = document.getElementById('panel-overview');
    expect(panel).toBeTruthy();
    expect(panel?.getAttribute('role')).toBe('tabpanel');
    expect(screen.getByText(/Environmental Overview: New Delhi/i)).toBeTruthy();
  });
});
