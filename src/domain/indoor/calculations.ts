/**
 * AirAware Domain Logic — Indoor Air Intelligence Calculations
 *
 * Facade module re-exporting focused indoor calculation submodules:
 * - room-profiles: Pre-configured architectural room archetypes & mitigation protocols
 * - cadr: Clean Air Delivery Rate (CADR) and Air Changes per Hour (ACH) formulas
 * - ventilation: Multi-factor ambient ventilation suitability curve evaluations
 * - air-analysis: Indoor vs outdoor PM2.5 classification, infiltration estimation, and action items
 */

export type { IndoorReadingAnalysis, IndoorActionItem } from './types';

export {
  STANDARD_ROOM_PROFILES,
  getStandardRoomProfiles,
} from './room-profiles';

export {
  calculateCadrAch,
} from './cadr';

export {
  type RawHourlyDataPoint,
  evaluateVentilationPoint,
  evaluateVentilationCurve,
} from './ventilation';

export {
  type AnalyzeIndoorAirParams,
  classifyIndoorPm25,
  estimateIndoorPm25,
  analyzeIndoorAir,
} from './air-analysis';
