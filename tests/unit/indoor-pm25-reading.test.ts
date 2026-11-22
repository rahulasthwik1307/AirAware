import { describe, it, expect, beforeEach } from 'vitest';
import {
  classifyIndoorPm25,
  estimateIndoorPm25,
  analyzeIndoorAir,
} from '@/domain/indoor/calculations';
import {
  loadIndoorState,
  updateIndoorPm25Reading,
  resetIndoorStorageCache,
  INDOOR_STORAGE_KEY,
} from '@/domain/indoor/storage';

function createMockLocalStorage() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
}

const mockStorage = createMockLocalStorage();
if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = mockStorage as any;
}
if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {
    localStorage: mockStorage,
    dispatchEvent: () => true,
  };
} else if (!(globalThis as any).window.localStorage) {
  (globalThis as any).window.localStorage = mockStorage;
}

describe('Indoor Air Data & Action Logic (Part C)', () => {
  beforeEach(() => {
    localStorage.clear();
    resetIndoorStorageCache();
  });

  describe('1. CPCB PM2.5 Indoor Classification', () => {
    it('classifies 0–30 as Good', () => {
      const res = classifyIndoorPm25(18.5);
      expect(res.category).toBe('Good');
      expect(res.colorToken).toBe('#059669');
    });

    it('classifies 31–60 as Satisfactory', () => {
      const res = classifyIndoorPm25(45);
      expect(res.category).toBe('Satisfactory');
      expect(res.colorToken).toBe('#84cc16');
    });

    it('classifies 61–90 as Moderate', () => {
      const res = classifyIndoorPm25(75);
      expect(res.category).toBe('Moderate');
      expect(res.colorToken).toBe('#D97706');
    });

    it('classifies 91–120 as Poor', () => {
      const res = classifyIndoorPm25(110);
      expect(res.category).toBe('Poor');
      expect(res.colorToken).toBe('#EA580C');
    });

    it('classifies 121–250 as Very Poor', () => {
      const res = classifyIndoorPm25(180);
      expect(res.category).toBe('Very Poor');
      expect(res.colorToken).toBe('#DC2626');
    });

    it('classifies 251+ as Severe', () => {
      const res = classifyIndoorPm25(320);
      expect(res.category).toBe('Severe');
      expect(res.colorToken).toBe('#7F1D1D');
    });
  });

  describe('2. Rough Indoor PM2.5 Estimate (without monitor)', () => {
    it('derives rough estimate assuming 60% infiltration of outdoor PM2.5', () => {
      const res = estimateIndoorPm25(150);
      expect(res.estimatedPm25).toBe(90);
      expect(res.infiltrationRate).toBe(0.6);
      expect(res.assumption).toContain('Rough estimate assuming standard closed residential doors');
      expect(res.assumption).toContain('not a sensor measurement');
    });

    it('handles zero or negative outdoor concentrations gracefully', () => {
      const res = estimateIndoorPm25(0);
      expect(res.estimatedPm25).toBe(0);
    });
  });

  describe('3. Multi-Factor Indoor Analysis & Personalized Actions', () => {
    it('generates comparison and 4 structured actions with reading', () => {
      const analysis = analyzeIndoorAir({
        indoorReading: 25,
        hasMonitor: true,
        outdoorPm25: 150,
      });

      expect(analysis.isEstimate).toBe(false);
      expect(analysis.reading).toBe(25);
      expect(analysis.cpcbCategory).toBe('Good');
      expect(analysis.percentageCleaner).toBe(83); // (150-25)/150 = 83.3%
      expect(analysis.comparisonText).toContain('83% cleaner than outdoor air');

      // Must provide 4 concrete actions
      expect(analysis.actions).toHaveLength(4);

      // 1. Purifier mode
      expect(analysis.actions[0].title).toContain('Purifier');
      expect(analysis.actions[0].why).toBeDefined();
      expect(analysis.actions[0].expectedImpact).toBeDefined();

      // 2. Windows / ventilation
      expect(analysis.actions[1].title).toContain('Windows');
      expect(analysis.actions[1].action).toContain('Keep exterior doors and windows latched now');
      expect(analysis.actions[1].why).toContain('solar warmth lifts the boundary layer');

      // 3. Cooking exhaust
      expect(analysis.actions[2].title).toContain('Cooking');
      expect(analysis.actions[2].action).toContain('exhaust hood');

      // 4. Houseplants as minor extra
      expect(analysis.actions[3].title).toContain('Indoor Plants');
      expect(analysis.actions[3].why).toContain('negligible effect');
    });

    it('personalizes actions for households with infants', () => {
      const analysis = analyzeIndoorAir({
        indoorReading: 75,
        hasMonitor: true,
        outdoorPm25: 180,
        householdMembers: [
          {
            archetype: 'PEDIATRIC_VULNERABLE',
            sensitivityTier: 'PEDIATRIC',
            nickname: 'Baby Kabir',
          },
        ],
      });

      expect(analysis.actions[0].title).toContain('High / Turbo Mode');
      expect(analysis.actions[0].expectedImpact.toLowerCase()).toContain('infant crawl');
    });

    it('personalizes actions for households with seniors', () => {
      const analysis = analyzeIndoorAir({
        indoorReading: 80,
        hasMonitor: true,
        outdoorPm25: 180,
        householdMembers: [
          {
            archetype: 'SENIOR_VULNERABLE',
            sensitivityTier: 'SENIOR',
            nickname: 'Dad (Senior)',
          },
        ],
      });

      expect(analysis.actions[0].expectedImpact.toLowerCase()).toContain('cardiovascular');
    });

    it('personalizes actions for households with respiratory conditions', () => {
      const analysis = analyzeIndoorAir({
        indoorReading: 65,
        hasMonitor: true,
        outdoorPm25: 180,
        householdMembers: [
          {
            sensitivityTier: 'RESPIRATORY',
            nickname: 'Priya (Asthma)',
          },
        ],
      });

      expect(analysis.actions[0].expectedImpact.toLowerCase()).toContain('airway');
      expect(analysis.actions[2].expectedImpact.toLowerCase()).toContain('asthmatic');
    });

    it('marks rough estimate when user does not have a monitor', () => {
      const analysis = analyzeIndoorAir({
        indoorReading: null,
        hasMonitor: false,
        outdoorPm25: 200,
      });

      expect(analysis.isEstimate).toBe(true);
      expect(analysis.reading).toBe(120); // 200 * 0.6
      expect(analysis.statedAssumption).toContain('Rough estimate assuming standard closed residential doors');
      expect(analysis.comparisonText).toContain('Estimated indoor air is ~40% cleaner');
    });
  });

  describe('4. Indoor Storage Persistence', () => {
    it('persists and retrieves user indoor PM2.5 reading and monitor status', () => {
      updateIndoorPm25Reading(34.5, true);
      const state = loadIndoorState();
      expect(state.indoorPm25Reading).toBe(34.5);
      expect(state.hasMonitor).toBe(true);

      const raw = localStorage.getItem(INDOOR_STORAGE_KEY);
      expect(raw).not.toBeNull();
      expect(JSON.parse(raw!).indoorPm25Reading).toBe(34.5);
    });

    it('clears reading when monitor is set to false', () => {
      updateIndoorPm25Reading(34.5, true);
      updateIndoorPm25Reading(null, false);
      const state = loadIndoorState();
      expect(state.indoorPm25Reading).toBeNull();
      expect(state.hasMonitor).toBe(false);
    });
  });
});
