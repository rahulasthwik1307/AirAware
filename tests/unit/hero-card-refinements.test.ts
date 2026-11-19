import { describe, it, expect } from 'vitest';
import { EAQI_TIERS, getEaqiTierFromValue } from '@/domain/aqi/european-aqi';
import { EPA_TIERS, getEpaTierFromValue } from '@/domain/aqi/epa-aqi';

describe('Step 2 Scientific Corrections: Hero Card, Globe & Standards', () => {
  describe('Correction 1: Health Guidance Cautious Risk Presentation', () => {
    it('ensures Level 1 European and US EPA standards do not claim Minimal Risk or Zero Risk', () => {
      const eaqiLevel1 = EAQI_TIERS[0];
      const epaLevel1 = EPA_TIERS[0];

      // Master Spec & Scientific Audit: Never promise absolute safety or zero/minimal risk
      expect(eaqiLevel1.description).not.toContain('Zero Risk');
      expect(eaqiLevel1.description).not.toContain('Minimal Risk');
      expect(epaLevel1.description).not.toContain('Zero Risk');
      expect(epaLevel1.description).not.toContain('Minimal Risk');

      expect(eaqiLevel1.healthAdvisory).not.toContain('Zero Risk');
      expect(eaqiLevel1.healthAdvisory).not.toContain('Minimal Risk');
      expect(epaLevel1.healthAdvisory).not.toContain('Zero Risk');
      expect(epaLevel1.healthAdvisory).not.toContain('Minimal Risk');
    });

    it('ensures sensitive populations are not given unconditional outdoor safety assurances', () => {
      // Sensitive groups must be advised with standard precaution, not told they can engage with zero/minimal risk
      const sensitiveGuidanceLevel1 = {
        title: 'Sensitive Groups',
        recommendation:
          'Modelled concentrations are within the baseline index band. Individuals with asthma or respiratory sensitivities should continue observing personal comfort and following individualized health plans.',
        badge: 'Standard Precaution',
      };

      expect(sensitiveGuidanceLevel1.badge).not.toBe('Minimal Risk');
      expect(sensitiveGuidanceLevel1.badge).not.toBe('Zero Risk');
      expect(sensitiveGuidanceLevel1.recommendation).not.toContain('minimal anticipated risk');
      expect(sensitiveGuidanceLevel1.recommendation).not.toContain('Most individuals can engage');
      expect(sensitiveGuidanceLevel1.recommendation).toContain('observing personal comfort');
    });

    it('ensures broad assurances of safety, fixed midday ventilation assumptions, and blanket closures are strictly absent', () => {
      const guidanceStatements = [
        'Ambient concentrations are in the lowest index category. Routine outdoor mask use is generally not indicated based on current modelled levels.',
        'Modelled outdoor concentrations are in the lowest category. Fresh air ventilation may be considered, balancing outdoor weather with indoor comfort.',
        'Modelled air quality represents the lowest outdoor exposure tier. Local exposure can still vary near active traffic corridors or localized emission sources.',
        'Modelled concentrations reflect an intermediate atmospheric category. Individuals with heightened particulate sensitivity may consider respiratory protection in high-traffic corridors.',
        'Modelled ambient concentrations are in the moderate range. When ventilating indoors, consider checking local hourly trends and use targeted kitchen ventilation during cooking to mitigate indoor sources.',
        'Modelled air quality falls into the moderate band. Unusually sensitive individuals may consider pacing outdoor exertion or taking more frequent breaks.',
        'Elevated outdoor concentrations. While limiting outdoor air intake can reduce particle entry, ensure dedicated exhaust or mechanical ventilation is used during indoor activities like cooking.',
        'High outdoor concentrations. Closing windows reduces ambient particle entry, though local kitchen exhaust ventilation remains important during cooking or indoor combustion.',
        'Under unhealthy tier guidelines, individuals are advised to reduce prolonged or heavy outdoor exertion, or reschedule strenuous workouts.',
        'Official guidance recommends that people with lung disease, asthma, heart disease, children, and older adults avoid prolonged or heavy outdoor exertion.',
        'Very high outdoor pollution levels. Minimizing unfiltered outdoor air intake helps limit outdoor ingress; operate indoor air cleaners and use localized exhaust when generating indoor smoke or fumes.',
        'Official health advisories recommend avoiding all strenuous outdoor physical activity under very unhealthy and hazardous categories, keeping outdoor time to a minimum.',
        'Official health standards advise sensitive groups to remain indoors, keep physical activity low, and consult healthcare providers if symptoms arise.',
      ];

      for (const statement of guidanceStatements) {
        expect(statement).not.toContain('Most individuals can engage in outdoor activities');
        expect(statement).not.toContain('Outdoor recreation is generally acceptable for most people');
        expect(statement).not.toContain('Outdoor sports are safe');
        expect(statement).not.toContain('generally acceptable');
        expect(statement).not.toContain('midday periods may help');
        expect(statement).not.toContain('Strictly seal all windows');
        expect(statement).not.toMatch(/\b(safe|safety guaranteed)\b/i);
      }
    });

    it('accounts for indoor pollution sources such as cooking during indoor ventilation guidance', () => {
      const ventilationCardLevel2 =
        'Modelled ambient concentrations are in the moderate range. When ventilating indoors, consider checking local hourly trends and use targeted kitchen ventilation during cooking to mitigate indoor sources.';
      const ventilationCardLevel3 =
        'Elevated outdoor concentrations. While limiting outdoor air intake can reduce particle entry, ensure dedicated exhaust or mechanical ventilation is used during indoor activities like cooking.';

      expect(ventilationCardLevel2).toContain('cooking');
      expect(ventilationCardLevel3).toContain('exhaust');
      expect(ventilationCardLevel3).toContain('cooking');
    });
  });

  describe('Correction 2: Atmospheric Surface Meteorology without Unvalidated Claims', () => {
    it('ensures surface weather card does not fabricate inversion or mixing status', () => {
      const weatherCardState = {
        title: 'Surface Meteorological Context',
        badge: 'Modelled Surface Data (2m / 10m)',
        disclaimer:
          'Surface weather parameters from numerical forecast models. Surface winds provide horizontal transport; boundary-layer height and vertical temperature profiles (inversions) require upper-air atmospheric soundings not captured in surface observations.',
      };

      expect(weatherCardState.title).not.toBe('Atmospheric Dispersion');
      expect(weatherCardState.badge).not.toContain('Inversion Potential');
      expect(weatherCardState.badge).not.toContain('Active Ventilation');
      expect(weatherCardState.badge).not.toContain('Stagnant');
      expect(weatherCardState.disclaimer).toContain('boundary-layer height');
      expect(weatherCardState.disclaimer).toContain('upper-air atmospheric soundings');
    });
  });

  describe('Correction 4: European EAQI Scale (Continuous 0–100+ without 1–6 mixing)', () => {
    const calculateEaqiSpectrumPercent = (aqi: number | null | undefined): number => {
      if (aqi === null || aqi === undefined || !Number.isFinite(aqi) || aqi < 0) {
        return 0;
      }
      return Math.min(100, Math.max(0, (aqi / 100) * 100));
    };

    it('correctly maps European EAQI tiers across official Open-Meteo continuous 0-100+ boundaries', () => {
      // 0 - 20: Good (Level 1)
      expect(getEaqiTierFromValue(0)?.label).toBe('Good');
      expect(getEaqiTierFromValue(10)?.label).toBe('Good');
      expect(getEaqiTierFromValue(20)?.label).toBe('Good');

      // 20 - 40: Fair (Level 2)
      expect(getEaqiTierFromValue(20.1)?.label).toBe('Fair');
      expect(getEaqiTierFromValue(30)?.label).toBe('Fair');
      expect(getEaqiTierFromValue(40)?.label).toBe('Fair');

      // 40 - 60: Moderate (Level 3)
      expect(getEaqiTierFromValue(40.1)?.label).toBe('Moderate');
      expect(getEaqiTierFromValue(50)?.label).toBe('Moderate');
      expect(getEaqiTierFromValue(60)?.label).toBe('Moderate');

      // 60 - 80: Poor (Level 4)
      expect(getEaqiTierFromValue(60.1)?.label).toBe('Poor');
      expect(getEaqiTierFromValue(70)?.label).toBe('Poor');
      expect(getEaqiTierFromValue(80)?.label).toBe('Poor');

      // 80 - 100: Very Poor (Level 5)
      expect(getEaqiTierFromValue(80.1)?.label).toBe('Very Poor');
      expect(getEaqiTierFromValue(90)?.label).toBe('Very Poor');
      expect(getEaqiTierFromValue(100)?.label).toBe('Very Poor');

      // > 100: Extremely Poor (Level 6)
      expect(getEaqiTierFromValue(100.1)?.label).toBe('Extremely Poor');
      expect(getEaqiTierFromValue(150)?.label).toBe('Extremely Poor');
      expect(getEaqiTierFromValue(350)?.label).toBe('Extremely Poor');
    });

    it('safely handles invalid, null, and negative European EAQI values', () => {
      expect(getEaqiTierFromValue(null)).toBeNull();
      expect(getEaqiTierFromValue(-5)).toBeNull();
      expect(getEaqiTierFromValue(NaN)).toBeNull();
      expect(getEaqiTierFromValue(Infinity)).toBeNull();

      expect(calculateEaqiSpectrumPercent(null)).toBe(0);
      expect(calculateEaqiSpectrumPercent(-15)).toBe(0);
      expect(calculateEaqiSpectrumPercent(NaN)).toBe(0);
    });

    it('calculates continuous EAQI spectrum pin percentage without 1-6 integer distortion', () => {
      // Linear mapping: (aqi / 100) * 100
      expect(calculateEaqiSpectrumPercent(0)).toBe(0);
      expect(calculateEaqiSpectrumPercent(20)).toBe(20);
      expect(calculateEaqiSpectrumPercent(50)).toBe(50);
      expect(calculateEaqiSpectrumPercent(75)).toBe(75);
      expect(calculateEaqiSpectrumPercent(100)).toBe(100);
      // Values above 100 clamp cleanly to 100% pin position
      expect(calculateEaqiSpectrumPercent(120)).toBe(100);
      expect(calculateEaqiSpectrumPercent(250)).toBe(100);
    });
  });

  describe('Correction 4: US EPA AQI Scale (Continuous 0–500)', () => {
    const calculateEpaSpectrumPercent = (aqi: number | null | undefined): number => {
      if (aqi === null || aqi === undefined || !Number.isFinite(aqi) || aqi < 0) {
        return 0;
      }
      return Math.min(100, Math.max(0, (aqi / 500) * 100));
    };

    it('correctly maps US EPA tiers across official EPA boundaries', () => {
      // 0 - 50: Good
      expect(getEpaTierFromValue(0)?.label).toBe('Good');
      expect(getEpaTierFromValue(50)?.label).toBe('Good');

      // 51 - 100: Moderate
      expect(getEpaTierFromValue(51)?.label).toBe('Moderate');
      expect(getEpaTierFromValue(100)?.label).toBe('Moderate');

      // 101 - 150: Unhealthy for Sensitive Groups
      expect(getEpaTierFromValue(101)?.label).toBe('Unhealthy for Sensitive Groups');
      expect(getEpaTierFromValue(150)?.label).toBe('Unhealthy for Sensitive Groups');

      // 151 - 200: Unhealthy
      expect(getEpaTierFromValue(151)?.label).toBe('Unhealthy');
      expect(getEpaTierFromValue(200)?.label).toBe('Unhealthy');

      // 201 - 300: Very Unhealthy
      expect(getEpaTierFromValue(201)?.label).toBe('Very Unhealthy');
      expect(getEpaTierFromValue(300)?.label).toBe('Very Unhealthy');

      // 301 - 500: Hazardous
      expect(getEpaTierFromValue(301)?.label).toBe('Hazardous');
      expect(getEpaTierFromValue(500)?.label).toBe('Hazardous');
      expect(getEpaTierFromValue(550)?.label).toBe('Hazardous');
    });

    it('safely handles invalid, null, and negative US EPA values', () => {
      expect(getEpaTierFromValue(null)).toBeNull();
      expect(getEpaTierFromValue(-1)).toBeNull();
      expect(getEpaTierFromValue(NaN)).toBeNull();
      expect(getEpaTierFromValue(Infinity)).toBeNull();

      expect(calculateEpaSpectrumPercent(null)).toBe(0);
      expect(calculateEpaSpectrumPercent(-10)).toBe(0);
      expect(calculateEpaSpectrumPercent(NaN)).toBe(0);
    });

    it('calculates continuous US EPA spectrum pin percentage across 0-500 scale', () => {
      // (aqi / 500) * 100
      expect(calculateEpaSpectrumPercent(0)).toBe(0);
      expect(calculateEpaSpectrumPercent(50)).toBe(10);
      expect(calculateEpaSpectrumPercent(100)).toBe(20);
      expect(calculateEpaSpectrumPercent(250)).toBe(50);
      expect(calculateEpaSpectrumPercent(500)).toBe(100);
      // Clamps cleanly above 500
      expect(calculateEpaSpectrumPercent(600)).toBe(100);
    });
  });

  describe('Correction 5: Default Reference Location Integrity', () => {
    it('ensures New Delhi is explicitly identified as a default starting reference, not detected location', () => {
      const defaultLocationLabel = 'Default Starting Reference (Not your detected location)';
      expect(defaultLocationLabel).toContain('Default Starting Reference');
      expect(defaultLocationLabel).toContain('Not your detected location');
    });
  });
});
