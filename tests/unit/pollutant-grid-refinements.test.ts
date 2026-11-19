import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PollutantGrid } from '@/components/dashboard/PollutantGrid';
import { POLLUTANT_EDUCATIONAL_DATA } from '@/domain/aqi/pollutant-educational-data';
import { PollutantKey, PollutantMeasurement } from '@/domain/types';

function createMockPollutants(overrides?: Partial<Record<PollutantKey, Partial<PollutantMeasurement>>>) {
  const base: Record<PollutantKey, PollutantMeasurement> = {
    pm2_5: {
      key: 'pm2_5',
      label: 'Particulate Matter 2.5',
      chemicalFormula: 'PM₂.₅',
      concentration: 28.4,
      unit: 'μg/m³',
      subIndex: 85,
      tier: {
        level: 2,
        label: 'Moderate',
        colorToken: 'var(--aqi-moderate)',
        bgToken: 'var(--aqi-moderate-bg)',
        borderToken: 'var(--aqi-moderate-border)',
        description: 'Moderate air quality',
        healthAdvisory: 'Sensitive individuals should monitor symptoms',
      },
      isEvaluatedInActiveStandard: true,
      note: 'US EPA AQI method: requires preceding 24-hour rolling average (provider-modelled sub-index; not computed locally)',
      whoGuideline: 15.0,
      whoRatio: 1.9,
    },
    pm10: {
      key: 'pm10',
      label: 'Particulate Matter 10',
      chemicalFormula: 'PM₁₀',
      concentration: 42.0,
      unit: 'μg/m³',
      subIndex: 39,
      tier: {
        level: 1,
        label: 'Good',
        colorToken: 'var(--aqi-good)',
        bgToken: 'var(--aqi-good-bg)',
        borderToken: 'var(--aqi-good-border)',
        description: 'Good air quality',
        healthAdvisory: 'Air quality is considered satisfactory',
      },
      isEvaluatedInActiveStandard: true,
      note: 'US EPA AQI method: requires preceding 24-hour rolling average (provider-modelled sub-index; not computed locally)',
      whoGuideline: 45.0,
      whoRatio: 0.9,
    },
    nitrogen_dioxide: {
      key: 'nitrogen_dioxide',
      label: 'Nitrogen Dioxide',
      chemicalFormula: 'NO₂',
      concentration: 18.2,
      unit: 'μg/m³',
      subIndex: 17,
      tier: {
        level: 1,
        label: 'Good',
        colorToken: 'var(--aqi-good)',
        bgToken: 'var(--aqi-good-bg)',
        borderToken: 'var(--aqi-good-border)',
        description: 'Good air quality',
        healthAdvisory: 'Air quality is considered satisfactory',
      },
      isEvaluatedInActiveStandard: true,
      note: 'US EPA AQI method: evaluated against 1-hour daily maximum standard',
      whoGuideline: 25.0,
      whoRatio: 0.7,
    },
    ozone: {
      key: 'ozone',
      label: 'Ground-level Ozone',
      chemicalFormula: 'O₃',
      concentration: 64.0,
      unit: 'μg/m³',
      subIndex: 58,
      tier: {
        level: 2,
        label: 'Moderate',
        colorToken: 'var(--aqi-moderate)',
        bgToken: 'var(--aqi-moderate-bg)',
        borderToken: 'var(--aqi-moderate-border)',
        description: 'Moderate air quality',
        healthAdvisory: 'Sensitive individuals should consider limiting heavy exertion',
      },
      isEvaluatedInActiveStandard: true,
      note: 'US EPA AQI method: requires 8-hour rolling average (provider-modelled sub-index; not computed locally)',
      whoGuideline: 100.0,
      whoRatio: 0.6,
    },
    sulphur_dioxide: {
      key: 'sulphur_dioxide',
      label: 'Sulphur Dioxide',
      chemicalFormula: 'SO₂',
      concentration: 6.5,
      unit: 'μg/m³',
      subIndex: 9,
      tier: {
        level: 1,
        label: 'Good',
        colorToken: 'var(--aqi-good)',
        bgToken: 'var(--aqi-good-bg)',
        borderToken: 'var(--aqi-good-border)',
        description: 'Good air quality',
        healthAdvisory: 'Air quality is considered satisfactory',
      },
      isEvaluatedInActiveStandard: true,
      note: 'US EPA AQI method: evaluated against 1-hour daily maximum standard',
      whoGuideline: 40.0,
      whoRatio: 0.2,
    },
    carbon_monoxide: {
      key: 'carbon_monoxide',
      label: 'Carbon Monoxide',
      chemicalFormula: 'CO',
      concentration: 380.0,
      unit: 'μg/m³',
      subIndex: 4,
      tier: {
        level: 1,
        label: 'Good',
        colorToken: 'var(--aqi-good)',
        bgToken: 'var(--aqi-good-bg)',
        borderToken: 'var(--aqi-good-border)',
        description: 'Good air quality',
        healthAdvisory: 'Air quality is considered satisfactory',
      },
      isEvaluatedInActiveStandard: true,
      note: 'US EPA AQI method: requires 8-hour rolling average (provider-modelled sub-index; not computed locally)',
      whoGuideline: 4000.0,
      whoRatio: 0.1,
    },
  };

  if (!overrides) return base;

  for (const k of Object.keys(overrides) as PollutantKey[]) {
    if (overrides[k]) {
      base[k] = { ...base[k], ...overrides[k] };
    }
  }

  return base;
}

describe('Step 3: Pollutant Matrix Refinements', () => {
  describe('A. Six Stable Pollutant Cards', () => {
    it('renders all six criteria pollutants in stable order under US EPA AQI', () => {
      const pollutants = createMockPollutants();
      const html = renderToStaticMarkup(
        React.createElement(PollutantGrid, { pollutants, activeStandard: 'US_EPA' })
      );

      expect(html).toContain('PM₂.₅');
      expect(html).toContain('PM₁₀');
      expect(html).toContain('NO₂');
      expect(html).toContain('O₃');
      expect(html).toContain('SO₂');
      expect(html).toContain('CO');

      // Verify stable sequence of cards in the rendered HTML output
      const idxPm25 = html.indexOf('data-pollutant="pm2_5"');
      const idxPm10 = html.indexOf('data-pollutant="pm10"');
      const idxNo2 = html.indexOf('data-pollutant="nitrogen_dioxide"');
      const idxO3 = html.indexOf('data-pollutant="ozone"');
      const idxSo2 = html.indexOf('data-pollutant="sulphur_dioxide"');
      const idxCo = html.indexOf('data-pollutant="carbon_monoxide"');

      expect(idxPm25).toBeGreaterThan(-1);
      expect(idxPm25).toBeLessThan(idxPm10);
      expect(idxPm10).toBeLessThan(idxNo2);
      expect(idxNo2).toBeLessThan(idxO3);
      expect(idxO3).toBeLessThan(idxSo2);
      expect(idxSo2).toBeLessThan(idxCo);
    });

    it('renders all six criteria pollutants in stable order under European EAQI', () => {
      const pollutants = createMockPollutants({
        carbon_monoxide: {
          isEvaluatedInActiveStandard: false,
          subIndex: null,
          tier: null,
          note: 'Not evaluated under European EAQI standard (EEA convention)',
        },
      });

      const html = renderToStaticMarkup(
        React.createElement(PollutantGrid, { pollutants, activeStandard: 'EUROPEAN_EAQI' })
      );

      expect(html).toContain('PM₂.₅');
      expect(html).toContain('PM₁₀');
      expect(html).toContain('NO₂');
      expect(html).toContain('O₃');
      expect(html).toContain('SO₂');
      expect(html).toContain('CO');
    });

    it('explicitly labels CO as not evaluated under European EAQI convention', () => {
      const pollutants = createMockPollutants({
        carbon_monoxide: {
          isEvaluatedInActiveStandard: false,
          subIndex: null,
          tier: null,
          note: 'Not evaluated under European EAQI standard (EEA convention)',
        },
      });

      const html = renderToStaticMarkup(
        React.createElement(PollutantGrid, { pollutants, activeStandard: 'EUROPEAN_EAQI' })
      );

      expect(html).toContain('EAQI Excluded');
      expect(html).toContain('Not evaluated under European EAQI standard (EEA convention)');
    });
  });

  describe('B. Scientific Accuracy: Dominant Pollutant, Missing Data & Averaging Windows', () => {
    it('identifies dominant pollutant strictly from highest sub-index, NEVER from raw concentration', () => {
      // CO has huge raw concentration (450 μg/m³) but sub-index of only 4.
      // PM2.5 has modest raw concentration (35 μg/m³) but high sub-index (105).
      const pollutants = createMockPollutants({
        carbon_monoxide: {
          concentration: 450.0,
          subIndex: 4,
        },
        pm2_5: {
          concentration: 35.0,
          subIndex: 105,
        },
      });

      const html = renderToStaticMarkup(
        React.createElement(PollutantGrid, { pollutants, activeStandard: 'US_EPA' })
      );

      // PM2.5 must be marked as Primary Driver
      expect(html).toContain('Primary Driver');
      // CO must NOT be marked as primary driver despite having 12x higher raw concentration
      expect(html).not.toMatch(/Carbon Monoxide[\s\S]*?Primary Driver/);
    });

    it('clearly distinguishes missing data from zero concentration', () => {
      const pollutants = createMockPollutants({
        pm10: {
          concentration: null,
          subIndex: null,
          tier: null,
        },
        sulphur_dioxide: {
          concentration: 0.0,
          subIndex: 0,
        },
      });

      const html = renderToStaticMarkup(
        React.createElement(PollutantGrid, { pollutants, activeStandard: 'US_EPA' })
      );

      // PM10 is missing -> must show Not Reported / Data Unavailable, NEVER 0
      expect(html).toContain('Not Reported');
      // SO2 has actual zero measurement -> must show 0.0 or 0
      expect(html).toContain('0.0');
    });

    it('discloses both 24-hour and annual WHO 2021 reference guideline levels without claiming legal limits or ceilings', () => {
      const pollutants = createMockPollutants();
      const html = renderToStaticMarkup(
        React.createElement(PollutantGrid, { pollutants, activeStandard: 'US_EPA' })
      );

      // PM2.5 WHO baselines with corrected terminology
      expect(html).toContain('WHO 24-hour guideline level');
      expect(html).toContain('WHO annual guideline level');
      expect(html).not.toContain('Annual Exposure Ceiling');
      expect(html).toContain('15');
      expect(html).toContain('5');

      // Advisory reference level without implying legal limit or safety guarantee
      expect(html).toContain('WHO 2021');
      expect(html).toContain('not a legal limit or guarantee of safety');
      expect(html).toContain('cannot be directly equated');
    });

    it('clearly distinguishes instantaneous 1-hour model concentration from regulatory averaging periods', () => {
      const pollutants = createMockPollutants();
      const html = renderToStaticMarkup(
        React.createElement(PollutantGrid, { pollutants, activeStandard: 'US_EPA' })
      );

      // Instantaneous 1-hour model concentration basis
      expect(html).toContain('1-hour model concentration');

      // US EPA regulatory calculations show correct averaging method
      expect(html).toContain('US EPA AQI method: requires preceding 24-hour rolling average');
      expect(html).toContain('US EPA AQI method: requires 8-hour rolling average');
      expect(html).toContain('US EPA AQI method: evaluated against 1-hour daily maximum standard');

      // Explicitly discloses that the app does not calculate rolling averages locally
      expect(html).toContain('does not compute multi-hour regulatory rolling averages locally');
    });

    it('identifies European EAQI five pollutant indices as using hourly concentrations', () => {
      const pollutants = createMockPollutants({
        carbon_monoxide: {
          isEvaluatedInActiveStandard: false,
          subIndex: null,
          tier: null,
          note: 'Not evaluated under European EAQI standard (EEA convention)',
        },
      });

      const html = renderToStaticMarkup(
        React.createElement(PollutantGrid, { pollutants, activeStandard: 'EUROPEAN_EAQI' })
      );

      // European EAQI evaluates using hourly concentrations
      expect(html).toContain('EAQI method: evaluates five pollutant indices using hourly concentrations');
    });
  });

  describe('C. Educational Details & Screen Reader Accessibility', () => {
    it('contains expandable details with sources, health effects and seasonal behaviour for all 6 pollutants', () => {
      const pollutants = createMockPollutants();
      const html = renderToStaticMarkup(
        React.createElement(PollutantGrid, { pollutants, activeStandard: 'US_EPA' })
      );

      // Details disclosure tags
      expect(html).toContain('<details');
      expect(html).toContain('<summary');
      expect(html).toContain('Educational Profile');

      // Content checks from educational data
      expect(html).toContain('Primary Sources');
      expect(html).toContain('Health Considerations');
      expect(html).toContain('Seasonal &amp; Diurnal Behaviour');
    });

    it('explains that seasonal and diurnal patterns vary across geography, weather, emissions and season', () => {
      const keys: PollutantKey[] = [
        'pm2_5',
        'pm10',
        'nitrogen_dioxide',
        'ozone',
        'sulphur_dioxide',
        'carbon_monoxide',
      ];

      for (const k of keys) {
        const data = POLLUTANT_EDUCATIONAL_DATA[k];
        expect(data.seasonalBehavior.toLowerCase()).toContain('vary');
        expect(data.seasonalBehavior.toLowerCase()).toContain('weather');
      }
    });

    it('provides accurate full names for screen readers alongside visual chemical formulas', () => {
      const pollutants = createMockPollutants();
      const html = renderToStaticMarkup(
        React.createElement(PollutantGrid, { pollutants, activeStandard: 'US_EPA' })
      );

      // Screen reader hidden full names
      expect(html).toContain('Particulate Matter 2.5');
      expect(html).toContain('Particulate Matter 10');
      expect(html).toContain('Nitrogen Dioxide');
      expect(html).toContain('Ground-level Ozone');
      expect(html).toContain('Sulphur Dioxide');
      expect(html).toContain('Carbon Monoxide');
      expect(html).toContain('sr-only');
    });

    it('educational data dictionary has complete scientific coverage for all 6 pollutants', () => {
      const keys: PollutantKey[] = [
        'pm2_5',
        'pm10',
        'nitrogen_dioxide',
        'ozone',
        'sulphur_dioxide',
        'carbon_monoxide',
      ];

      for (const k of keys) {
        const data = POLLUTANT_EDUCATIONAL_DATA[k];
        expect(data).toBeDefined();
        expect(data.sources.length).toBeGreaterThan(20);
        expect(data.healthEffects.length).toBeGreaterThan(20);
        expect(data.seasonalBehavior.length).toBeGreaterThan(20);
        expect(data.who2021Guidelines.shortTerm.value).toBeGreaterThan(0);
        expect(data.who2021Guidelines.shortTerm.label).toContain('WHO');
        expect(data.who2021Guidelines.disclosure).toContain('not legal limits or guarantees of safety');
      }
    });
  });
});
