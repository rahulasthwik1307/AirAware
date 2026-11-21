import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  calculateVentilationWindow,
  generateAirshedAlerts,
  formatCpcbSameerDossier,
  formatRwaSocietyBulletin,
  formatSocietyIncidentNotice,
  formatMunicipalComplaint,
} from '../generator';
import {
  loadCommunityState,
  addLocalIncident,
  deleteLocalIncident,
  updateIncidentStatus,
  markAlertAsRead,
  markAllAlertsAsRead,
  INITIAL_COMMUNITY_STATE,
  COMMUNITY_STORAGE_KEY,
} from '../storage';
import { PollutionIncident } from '../types';

describe('Community & Alerts Domain Tests', () => {
  describe('calculateVentilationWindow', () => {
    it('identifies 1:00 PM (13:00) with favorable wind as an open ventilation window', () => {
      const window = calculateVentilationWindow(13, 5.0, 20.0);
      expect(window.isOpenNow).toBe(true);
      expect(window.mixingHeightMeters).toBeGreaterThan(400);
      expect(window.advisory).toContain('Optimal ventilation window active');
    });

    it('identifies 8:00 AM (08:00) as sealed thermal inversion lock', () => {
      const window = calculateVentilationWindow(8, 2.0, 12.0);
      expect(window.isOpenNow).toBe(false);
      expect(window.mixingHeightMeters).toBeLessThanOrEqual(150);
      expect(window.advisory).toContain('Windows should remain sealed');
    });
  });

  describe('generateAirshedAlerts', () => {
    it('generates Emergency GRAP Stage IV alert when AQI >= 450', () => {
      const alerts = generateAirshedAlerts('New Delhi, India', 465, 'PM2.5', 10);
      const grapAlert = alerts.find((a) => a.category === 'GRAP_REGULATORY');
      expect(grapAlert).toBeDefined();
      expect(grapAlert?.severity).toBe('CRITICAL');
      expect(grapAlert?.title).toContain('GRAP Stage IV');
    });

    it('generates GRAP Stage III alert when AQI is 415', () => {
      const alerts = generateAirshedAlerts('Noida, India', 415, 'PM2.5', 14);
      const grapAlert = alerts.find((a) => a.category === 'GRAP_REGULATORY');
      expect(grapAlert).toBeDefined();
      expect(grapAlert?.title).toContain('GRAP Stage III');
    });

    it('generates vulnerable family health advisory when AQI >= 250', () => {
      const alerts = generateAirshedAlerts('Kolkata, India', 320, 'PM2.5', 11);
      const healthAlert = alerts.find((a) => a.category === 'FAMILY_HEALTH');
      expect(healthAlert).toBeDefined();
      expect(healthAlert?.targetWorkspace).toBe('family-planner');
    });
  });

  describe('formatCpcbSameerDossier', () => {
    it('creates a compliant CPCB Sameer formatted complaint text with reference and category', () => {
      const incident: PollutionIncident = {
        id: 'test-inc-1',
        category: 'WASTE_BURNING',
        title: 'Open plastic burning',
        description: 'Thick smoke near hospital boundary',
        locationName: 'Sector 12, Gurugram',
        coordinates: { latitude: 28.4595, longitude: 77.0266 },
        timestamp: '2026-11-20T10:00:00.000Z',
        status: 'LOGGED_LOCALLY',
        severity: 'HIGH',
      };

      const dossier = formatCpcbSameerDossier(incident);
      expect(dossier).toContain('CPCB SAMEER GRIEVANCE DOSSIER');
      expect(dossier).toContain('Sector 12, Gurugram');
      expect(dossier).toContain('28.45950, 77.02660');
      expect(dossier).toContain('Solid Waste Burning / Section 19(5) Air Act');
    });
  });

  describe('formatRwaSocietyBulletin', () => {
    it('generates society notice board and WhatsApp copy with key protocols', () => {
      const bulletin = formatRwaSocietyBulletin('Palm Grove RWA', 380, 'Stage III');
      expect(bulletin).toContain('AIRAWARE RESIDENTIAL ADVISORY — PALM GROVE RWA');
      expect(bulletin).toContain('CPCB AQI 380');
      expect(bulletin).toContain('Zero Open Burning');
      expect(bulletin).toContain('Safe Window Timing');
    });
  });

  describe('formatSocietyIncidentNotice', () => {
    it('formats an actionable notice for apartment WhatsApp groups with night guard heater reminder', () => {
      const incident: PollutionIncident = {
        id: 'inc-whatsapp-1',
        category: 'WASTE_BURNING',
        title: 'Open plastic burning near gate 2',
        description: 'Smoke entering 1st floor balconies',
        locationName: 'Green Meadows Tower B',
        timestamp: '2026-11-20T21:30:00.000Z',
        status: 'LOGGED_LOCALLY',
        severity: 'HIGH',
      };
      const notice = formatSocietyIncidentNotice(incident, 'Green Meadows RWA');
      expect(notice).toContain('POLLUTION ALERT — GREEN MEADOWS RWA');
      expect(notice).toContain('Open plastic burning near gate 2');
      expect(notice).toContain('radiant heaters');
    });
  });

  describe('formatMunicipalComplaint', () => {
    it('formats a formal complaint for municipal helplines with legal reference and coordinates', () => {
      const incident: PollutionIncident = {
        id: 'inc-muni-1',
        category: 'CONSTRUCTION_DUST',
        title: 'Uncovered dry cement unloading',
        description: 'Piles of dust blowing into main road without water sprinkling',
        locationName: 'Plot 44, Okhla Phase 3',
        coordinates: { latitude: 28.5355, longitude: 77.2731 },
        timestamp: '2026-11-20T11:15:00.000Z',
        status: 'LOGGED_LOCALLY',
        severity: 'HIGH',
      };
      const complaint = formatMunicipalComplaint(incident);
      expect(complaint).toContain('MUNICIPAL AIR POLLUTION COMPLAINT');
      expect(complaint).toContain('Plot 44, Okhla Phase 3');
      expect(complaint).toContain('GPS: 28.53550, 77.27310');
      expect(complaint).toContain('Air Act 1981');
    });
  });

  describe('Local-First Storage', () => {
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

    it('loads initial state when localStorage is empty', () => {
      const state = loadCommunityState();
      expect(state.version).toBe(1);
      expect(state.incidents.length).toBeGreaterThan(0);
    });

    it('adds a new local incident and persists to localStorage', () => {
      const current = loadCommunityState();
      const updated = addLocalIncident(current, {
        category: 'CONSTRUCTION_DUST',
        title: 'Excavation dust plume',
        description: 'Uncovered dry debris',
        locationName: 'Ring Road, Delhi',
        severity: 'HIGH',
      });

      expect(updated.incidents.length).toBe(current.incidents.length + 1);
      expect(updated.incidents[0].title).toBe('Excavation dust plume');
      expect(updated.incidents[0].status).toBe('LOGGED_LOCALLY');
    });

    it('marks alerts as read and prevents duplicate read IDs', () => {
      const current = loadCommunityState();
      const s1 = markAlertAsRead(current, 'alert-grap-iv');
      expect(s1.readAlertIds).toContain('alert-grap-iv');

      const s2 = markAlertAsRead(s1, 'alert-grap-iv');
      expect(s2.readAlertIds.filter((id) => id === 'alert-grap-iv').length).toBe(1);

      const s3 = markAllAlertsAsRead(s2, ['a1', 'a2']);
      expect(s3.readAlertIds).toContain('a1');
      expect(s3.readAlertIds).toContain('a2');
    });

    it('deletes a local incident by id', () => {
      const current = loadCommunityState();
      const idToDelete = current.incidents[0].id;
      const updated = deleteLocalIncident(current, idToDelete);
      expect(updated.incidents.some((i) => i.id === idToDelete)).toBe(false);
    });
  });
});
