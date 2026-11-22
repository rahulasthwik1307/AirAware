import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ForecastTimeline } from '@/components/dashboard/ForecastTimeline';
import { AtmosphericWeatherCard } from '@/components/dashboard/AtmosphericWeatherCard';
import { ProvenanceFooter } from '@/components/dashboard/ProvenanceFooter';
import { ScientificGrounding } from '@/components/dashboard/ScientificGrounding';
import { AirQualityReport, AtmosphericModelMetadata, ForecastPoint, GeoLocation } from '@/domain/types';
import { getAtmosphericModelMetadata } from '@/domain/aqi/standards-resolver';

function createMockForecast(): ForecastPoint[] {
  const points: ForecastPoint[] = [];
  const baseTime = '2026-11-19T08:00';
  for (let i = 0; i < 24; i++) {
    const hour = (8 + i) % 24;
    const hourStr = hour < 10 ? `0${hour}` : `${hour}`;
    const timeStr = `2026-11-19T${hourStr}:00`;
    points.push({
      time: timeStr,
      displayTime: `${hourStr}:00`,
      usAqi: 75 + (i % 20),
      europeanAqi: 35 + (i % 10),
      activeAqi: 75 + (i % 20),
      tier: {
        level: 2,
        label: 'Moderate',
        colorToken: 'var(--aqi-moderate)',
        bgToken: 'var(--aqi-moderate-bg)',
        borderToken: 'var(--aqi-moderate-border)',
        description: 'Moderate air quality',
        healthAdvisory: 'Unusually sensitive individuals should monitor symptoms',
      },
      isCurrentHour: i === 0,
      pm25: 22.5 + (i % 5),
      pm10: 40.0 + (i % 10),
    });
  }
  return points;
}

function createMockReport(overrides?: Partial<AirQualityReport>): AirQualityReport {
  const location: GeoLocation = {
    id: 1273294,
    name: 'New Delhi',
    country: 'India',
    countryCode: 'IN',
    latitude: 28.6139,
    longitude: 77.209,
    timezone: 'Asia/Kolkata',
  };

  const modelMeta: AtmosphericModelMetadata = getAtmosphericModelMetadata('IN');

  const base: AirQualityReport = {
    location,
    modelTimestamp: '2026-11-19 08:00',
    localTime: '2026-11-19 08:00',
    intervalSeconds: 3600,
    dataSource: 'OPEN_METEO_CAMS',
    isModelled: true,
    sourceType: 'model',
    averagingPeriodNote: 'Instantaneous 1-hour modelled concentration',
    isStale: false,
    activeStandard: 'US_EPA',
    standardMetadata: {
      key: 'US_EPA',
      name: 'US EPA Air Quality Index',
      shortLabel: 'US EPA AQI',
      scaleRange: '0–500',
      role: 'INTERNATIONAL_REFERENCE',
      roleLabel: 'International Reference Benchmark',
      description: 'US EPA Air Quality Index used as an international benchmark.',
    },
    providerAqi: 124,
    tier: {
      level: 3,
      label: 'Unhealthy for Sensitive Groups',
      colorToken: 'var(--aqi-sensitive)',
      bgToken: 'var(--aqi-sensitive-bg)',
      borderToken: 'var(--aqi-sensitive-border)',
      description: 'Members of sensitive groups may experience health effects.',
      healthAdvisory: 'Sensitive groups should consider limiting prolonged outdoor exertion.',
    },
    dominantPollutant: 'PM₂.₅',
    pollutants: {
      pm2_5: {
        key: 'pm2_5',
        label: 'Particulate Matter 2.5',
        chemicalFormula: 'PM₂.₅',
        concentration: 45.2,
        unit: 'μg/m³',
        subIndex: 124,
        tier: null,
        isEvaluatedInActiveStandard: true,
        whoGuideline: 15.0,
        whoRatio: 3.0,
      },
      pm10: {
        key: 'pm10',
        label: 'Particulate Matter 10',
        chemicalFormula: 'PM₁₀',
        concentration: 85.0,
        unit: 'μg/m³',
        subIndex: 65,
        tier: null,
        isEvaluatedInActiveStandard: true,
        whoGuideline: 45.0,
        whoRatio: 1.9,
      },
      nitrogen_dioxide: {
        key: 'nitrogen_dioxide',
        label: 'Nitrogen Dioxide',
        chemicalFormula: 'NO₂',
        concentration: 22.0,
        unit: 'μg/m³',
        subIndex: 20,
        tier: null,
        isEvaluatedInActiveStandard: true,
        whoGuideline: 25.0,
        whoRatio: 0.9,
      },
      ozone: {
        key: 'ozone',
        label: 'Ground-level Ozone',
        chemicalFormula: 'O₃',
        concentration: 58.0,
        unit: 'μg/m³',
        subIndex: 54,
        tier: null,
        isEvaluatedInActiveStandard: true,
        whoGuideline: 100.0,
        whoRatio: 0.6,
      },
      sulphur_dioxide: {
        key: 'sulphur_dioxide',
        label: 'Sulphur Dioxide',
        chemicalFormula: 'SO₂',
        concentration: 10.0,
        unit: 'μg/m³',
        subIndex: 14,
        tier: null,
        isEvaluatedInActiveStandard: true,
        whoGuideline: 40.0,
        whoRatio: 0.2,
      },
      carbon_monoxide: {
        key: 'carbon_monoxide',
        label: 'Carbon Monoxide',
        chemicalFormula: 'CO',
        concentration: 420.0,
        unit: 'μg/m³',
        subIndex: 5,
        tier: null,
        isEvaluatedInActiveStandard: true,
        whoGuideline: 4000.0,
        whoRatio: 0.1,
      },
    },
    forecast: createMockForecast(),
    coordinates: {
      latitude: 28.6139,
      longitude: 77.209,
    },
    modelMetadata: modelMeta,
    cpcbComparison: {
      equivalentCategory: 'Moderate',
      estimatedAqiRange: '101–200',
      stationContext: 'Continuous Ambient Air Quality Monitoring (CAAQMS) stations operated by CPCB.',
      methodologyDifference: 'CPCB NAQI uses 24-hour arithmetic averaging rather than CAMS model estimates.',
    },
  };

  return { ...base, ...overrides };
}

describe('Step 4: Forecast Timeline, Atmospheric Context & Data Provenance', () => {
  describe('A. Forecast Timeline Refinements', () => {
    it('preserves exact provider timestamps without generating fabricated forecast points', () => {
      const forecast = createMockForecast();
      const html = renderToStaticMarkup(
        React.createElement(ForecastTimeline, {
          forecast,
          activeStandard: 'US_EPA',
        })
      );

      // Verify start and end times match actual forecast data points exactly
      expect(html).toContain(forecast[0].displayTime);
      expect(html).toContain(forecast[forecast.length - 1].displayTime);
      expect(html).toContain('08:00');
    });

    it('clearly distinguishes current modelled conditions from forecast projections', () => {
      const forecast = createMockForecast();
      const html = renderToStaticMarkup(
        React.createElement(ForecastTimeline, {
          forecast,
          activeStandard: 'US_EPA',
        })
      );

      expect(html).toContain('Current Model Hour');
      expect(html).toContain('Modelled Projections');
      expect(html).not.toContain('sensor readings');
      expect(html).not.toContain('verified ground truth');
    });

    it('discloses the temporal resolution and model discretization of the forecast', () => {
      const forecast = createMockForecast();
      const html = renderToStaticMarkup(
        React.createElement(ForecastTimeline, {
          forecast,
          activeStandard: 'US_EPA',
        })
      );

      expect(html).toContain('Hourly resolution');
      expect(html).toContain('Copernicus Atmosphere Monitoring Service (CAMS)');
    });

    it('shows criteria pollutant concentrations when source data is available', () => {
      const forecast = createMockForecast();
      const html = renderToStaticMarkup(
        React.createElement(ForecastTimeline, {
          forecast,
          activeStandard: 'US_EPA',
        })
      );

      // Verify PM2.5 concentration is visible for the selected hour
      expect(html).toContain('PM₂.₅:');
      expect(html).toContain('22.5');
    });

    it('handles missing or unavailable forecast points without crashing or fabricating values', () => {
      const forecastWithMissing: ForecastPoint[] = [
        {
          time: '2026-11-19T08:00',
          displayTime: '08:00',
          usAqi: null,
          europeanAqi: null,
          activeAqi: null,
          tier: null,
          isCurrentHour: true,
          pm25: null,
          pm10: null,
        },
      ];

      const html = renderToStaticMarkup(
        React.createElement(ForecastTimeline, {
          forecast: forecastWithMissing,
          activeStandard: 'US_EPA',
        })
      );

      expect(html).toContain('Not Reported');
      expect(html).not.toContain('undefined');
    });
  });

  describe('B. Atmospheric Weather Context', () => {
    it('displays independent surface meteorological variables without ungrounded inversion claims', () => {
      const weather = {
        temperature: 24.5,
        humidity: 62,
        windSpeed: 12.8,
        windDirection: 180,
        windDirectionCardinal: 'S',
      };

      const html = renderToStaticMarkup(
        React.createElement(AtmosphericWeatherCard, { weather })
      );

      expect(html).toContain('24.5°C');
      expect(html).toContain('62%');
      expect(html).toContain('12.8 km/h');
      expect(html).toContain('S');

      // Reject unvalidated claims
      expect(html).not.toContain('Inversion Alert');
      expect(html).not.toContain('Ventilation Index');
      expect(html).not.toContain('Dispersion Score');
      expect(html).not.toContain('Stagnation:');
    });

    it('clearly separates general scientific educational explanations from local observations', () => {
      const weather = {
        temperature: 18.0,
        humidity: 50,
        windSpeed: 8.0,
        windDirection: 90,
        windDirectionCardinal: 'E',
      };

      const html = renderToStaticMarkup(
        React.createElement(AtmosphericWeatherCard, { weather })
      );

      expect(html).toContain('Surface Observations');
      expect(html).toContain('General Atmospheric Science');
      expect(html).toContain('upper-air atmospheric soundings');
    });
  });

  describe('C. Scientific Provenance & Data Freshness', () => {
    it('clearly distinguishes CAMS Global (~45 km grid) from CAMS Europe (~11 km grid)', () => {
      // Non-Europe report (India) -> CAMS Global
      const indiaReport = createMockReport();
      const htmlIndia = renderToStaticMarkup(
        React.createElement(ProvenanceFooter, { report: indiaReport })
      );

      expect(htmlIndia).toContain('CAMS Global');
      expect(htmlIndia).toContain('~45 km');
      expect(htmlIndia).not.toContain('~11 km');
      expect(htmlIndia).toContain('does not provide street-level');

      // Europe report (France) -> CAMS Europe
      const europeLocation: GeoLocation = {
        id: 2988507,
        name: 'Paris',
        country: 'France',
        countryCode: 'FR',
        latitude: 48.8566,
        longitude: 2.3522,
        timezone: 'Europe/Paris',
      };
      const europeReport = createMockReport({
        location: europeLocation,
        modelMetadata: getAtmosphericModelMetadata('FR'),
      });

      const htmlEurope = renderToStaticMarkup(
        React.createElement(ProvenanceFooter, { report: europeReport })
      );

      expect(htmlEurope).toContain('CAMS European');
      expect(htmlEurope).toContain('~11 km');
    });

    it('never claims ground-truth validation or independent sensor verification in provenance footer', () => {
      const report = createMockReport();
      const html = renderToStaticMarkup(
        React.createElement(ProvenanceFooter, { report })
      );

      expect(html).not.toContain('✓ Model Data Validated');
      expect(html).not.toContain('ground-truth validation');
      expect(html).not.toContain('sensor verification');
      expect(html).toContain('Modelled Environmental Simulation');
    });

    it('accurately discloses regulatory averaging periods and non-local computation in scientific grounding', () => {
      const report = createMockReport();
      const html = renderToStaticMarkup(
        React.createElement(ScientificGrounding, { report })
      );

      expect(html).toContain('Preceding 24-hour rolling average');
      expect(html).toContain('Hourly concentration');
      expect(html).toContain('CAAQMS');
      expect(html).toContain('WHO 24-hour guideline level');
      expect(html).toContain('WHO annual guideline level');
      expect(html).not.toContain('Annual Exposure Ceiling');
    });
  });
});
