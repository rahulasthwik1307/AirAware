import { describe, it, expect } from 'vitest';
import { getDeterministicGuidance } from '@/lib/ai/deterministic-fallback';
import { GuidanceRequest } from '@/lib/ai/types';
import { getPollutionControlAuthority, DEFAULT_AUTHORITY } from '@/domain/community/authorities';
import { GLOBE_REFERENCE_CITIES } from '@/components/globe/world-landmass';

describe('P0-P2 Fixes Pure Logic Tests', () => {
  describe('1. Fallback Guidance Household Personalization & Child Guard', () => {
    const baseRequest: GuidanceRequest = {
      aqi: 220,
      category: 'Very Unhealthy',
      dominantPollutant: 'pm25',
      pollutantConcentration: 120,
      pollutantUnit: 'µg/m³',
      weather: { temperatureC: 18, humidityPercent: 65, windSpeedKmh: 4 },
      userContext: { isSensitiveGroup: false, primaryActivity: 'general', locale: 'en' },
    };

    it('tailors plan for households with children and includes pediatric precautions', () => {
      const childReq: GuidanceRequest = {
        ...baseRequest,
        householdMembers: [
          {
            id: 'm1',
            nickname: 'Aarav (Child)',
            archetype: 'CHILD_STUDENT',
            sensitivityTier: 'PEDIATRIC',
          },
        ],
      };

      const res = getDeterministicGuidance(childReq);
      expect(res.todayHouseholdPlan).toBeDefined();
      const plan = res.todayHouseholdPlan!;

      expect(plan.morning.area).toBe('Low-emission routine');
      expect(plan.morning.action.toLowerCase()).toMatch(/child|school/);
      expect(plan.morning.why).toBeDefined();
      expect(plan.morning.expectedImpact).toBeDefined();

      expect(plan.afternoon.area).toBe('Indoor air quality hack');
      expect(plan.afternoon.action.toLowerCase()).toMatch(/child|study/);

      expect(plan.evening.area).toBe('Sustainable alternative');
      expect(plan.evening.action.toLowerCase()).toMatch(/school|carpool/);
    });

    it('NEVER mentions children, kids, or schools for a senior-only household', () => {
      const seniorReq: GuidanceRequest = {
        ...baseRequest,
        householdMembers: [
          {
            id: 'm2',
            nickname: 'Dada (Senior)',
            archetype: 'SENIOR_VULNERABLE',
            sensitivityTier: 'SENIOR',
          },
        ],
      };

      const res = getDeterministicGuidance(seniorReq);
      expect(res.todayHouseholdPlan).toBeDefined();
      const plan = res.todayHouseholdPlan!;

      const fullPlanText = `${plan.morning.action} ${plan.afternoon.action} ${plan.evening.action}`.toLowerCase();
      expect(fullPlanText).not.toContain('child');
      expect(fullPlanText).not.toContain('kid');
      expect(fullPlanText).not.toContain('school');
      expect(fullPlanText).toContain('senior');
    });

    it('NEVER mentions children, kids, or schools for a respiratory sensitivity household', () => {
      const respReq: GuidanceRequest = {
        ...baseRequest,
        householdMembers: [
          {
            id: 'm3',
            nickname: 'Priya (Asthma Care)',
            archetype: 'OUTDOOR_ENTHUSIAST',
            sensitivityTier: 'RESPIRATORY',
          },
        ],
      };

      const res = getDeterministicGuidance(respReq);
      expect(res.todayHouseholdPlan).toBeDefined();
      const plan = res.todayHouseholdPlan!;

      const fullPlanText = `${plan.morning.action} ${plan.afternoon.action} ${plan.evening.action}`.toLowerCase();
      expect(fullPlanText).not.toContain('child');
      expect(fullPlanText).not.toContain('kid');
      expect(fullPlanText).not.toContain('school');
      expect(fullPlanText).toMatch(/inhaler|airway|respirator/);
    });

    it('NEVER mentions children, kids, or schools for a working commuter household', () => {
      const commuterReq: GuidanceRequest = {
        ...baseRequest,
        householdMembers: [
          {
            id: 'm4',
            nickname: 'Rohan (Daily Commuter)',
            archetype: 'WORKING_COMMUTER',
            sensitivityTier: 'NONE',
            schedules: [
              {
                activityName: 'Office Commute',
                startTime: '08:00',
                durationMinutes: 45,
                commuteMode: 'PRIVATE_CAR',
              },
            ],
          },
        ],
      };

      const res = getDeterministicGuidance(commuterReq);
      expect(res.todayHouseholdPlan).toBeDefined();
      const plan = res.todayHouseholdPlan!;

      const fullPlanText = `${plan.morning.action} ${plan.afternoon.action} ${plan.evening.action}`.toLowerCase();
      expect(fullPlanText).not.toContain('child');
      expect(fullPlanText).not.toContain('kid');
      expect(fullPlanText).not.toContain('school');
      expect(fullPlanText).toMatch(/commute|transit|carpool/);
    });

    it('NEVER mentions children for a general household with no member info', () => {
      const generalReq: GuidanceRequest = {
        ...baseRequest,
        householdMembers: [],
      };

      const res = getDeterministicGuidance(generalReq);
      expect(res.todayHouseholdPlan).toBeDefined();
      const plan = res.todayHouseholdPlan!;

      const fullPlanText = `${plan.morning.action} ${plan.afternoon.action} ${plan.evening.action}`.toLowerCase();
      expect(fullPlanText).not.toContain('child');
      expect(fullPlanText).not.toContain('kid');
      expect(fullPlanText).not.toContain('school');
      expect(plan.morning.area).toBe('Low-emission routine');
      expect(plan.afternoon.area).toBe('Indoor air quality hack');
      expect(plan.evening.area).toBe('Sustainable alternative');
    });
  });

  describe('2. Pollution Control Authority Mapping', () => {
    it('maps Delhi to DPCC', () => {
      const auth = getPollutionControlAuthority('New Delhi', 'Delhi');
      expect(auth.code).toBe('DPCC');
      expect(auth.name).toContain('Delhi Pollution Control Committee');
    });

    it('maps Noida and Lucknow to UPPCB', () => {
      const noidaAuth = getPollutionControlAuthority('Noida', 'Uttar Pradesh');
      expect(noidaAuth.code).toBe('UPPCB');
      expect(noidaAuth.name).toContain('Uttar Pradesh Pollution Control Board');

      const lucknowAuth = getPollutionControlAuthority('Lucknow', 'Uttar Pradesh');
      expect(lucknowAuth.code).toBe('UPPCB');
    });

    it('maps Gurugram and Rohtak to HSPCB', () => {
      const gurugramAuth = getPollutionControlAuthority('Gurugram', 'Haryana');
      expect(gurugramAuth.code).toBe('HSPCB');
      expect(gurugramAuth.name).toContain('Haryana State Pollution Control Board');

      const rohtakAuth = getPollutionControlAuthority('Rohtak', 'Haryana');
      expect(rohtakAuth.code).toBe('HSPCB');
    });

    it('maps Mumbai and Pune to MPCB', () => {
      const mumbaiAuth = getPollutionControlAuthority('Mumbai', 'Maharashtra');
      expect(mumbaiAuth.code).toBe('MPCB');
      expect(mumbaiAuth.name).toContain('Maharashtra Pollution Control Board');

      const puneAuth = getPollutionControlAuthority('Pune', 'Maharashtra');
      expect(puneAuth.code).toBe('MPCB');
    });

    it('maps Bengaluru and Mandya to KSPCB', () => {
      const blrAuth = getPollutionControlAuthority('Bengaluru', 'Karnataka');
      expect(blrAuth.code).toBe('KSPCB');
      expect(blrAuth.name).toContain('Karnataka State Pollution Control Board');

      const mandyaAuth = getPollutionControlAuthority('Mandya', 'Karnataka');
      expect(mandyaAuth.code).toBe('KSPCB');
    });

    it('maps Kolkata to WBPCB', () => {
      const kolkataAuth = getPollutionControlAuthority('Kolkata', 'West Bengal');
      expect(kolkataAuth.code).toBe('WBPCB');
      expect(kolkataAuth.name).toContain('West Bengal Pollution Control Board');
    });

    it('maps Hyderabad to TSPCB', () => {
      const hydAuth = getPollutionControlAuthority('Hyderabad', 'Telangana');
      expect(hydAuth.code).toBe('TSPCB');
      expect(hydAuth.name).toContain('Telangana State Pollution Control Board');
    });

    it('maps Chennai to TNPCB', () => {
      const chennaiAuth = getPollutionControlAuthority('Chennai', 'Tamil Nadu');
      expect(chennaiAuth.code).toBe('TNPCB');
      expect(chennaiAuth.name).toContain('Tamil Nadu Pollution Control Board');
    });

    it('falls back to generic SPCB / Sameer app for unmapped or international cities', () => {
      const foreignAuth = getPollutionControlAuthority('London', 'United Kingdom');
      expect(foreignAuth.code).toBe('SPCB');
      expect(foreignAuth.name).toBe(DEFAULT_AUTHORITY.name);
    });
  });

  describe('3. Regional Hotspots City Data Model', () => {
    it('contains reference cities with valid coordinates and administrative metadata', () => {
      expect(GLOBE_REFERENCE_CITIES.length).toBeGreaterThanOrEqual(10);
      for (const city of GLOBE_REFERENCE_CITIES) {
        expect(city.id).toBeDefined();
        expect(city.name).toBeDefined();
        expect(city.latitude).toBeGreaterThan(-90);
        expect(city.latitude).toBeLessThan(90);
        expect(city.longitude).toBeGreaterThan(-180);
        expect(city.longitude).toBeLessThan(180);
      }
    });
  });
});
