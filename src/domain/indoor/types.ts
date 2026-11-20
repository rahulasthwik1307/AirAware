/**
 * AirAware Domain Types — Indoor Air Intelligence
 * Authoritative types for rooms, ventilation trade-offs, CADR/ACH calculations, and local maintenance logs.
 */

export type RoomType = 'living_room' | 'kitchen' | 'bedroom' | 'study';

export interface RoomProfile {
  readonly id: RoomType;
  readonly name: string;
  readonly defaultAreaM2: number;
  readonly ceilingHeightM: number;
  readonly icon: string;
  readonly tag: string;
  readonly primaryPollutantRisks: readonly {
    readonly pollutant: string;
    readonly source: string;
    readonly severity: 'caution' | 'moderate' | 'high';
  }[];
  readonly practicalMitigations: readonly {
    readonly action: string;
    readonly detail: string;
  }[];
  readonly filtrationAdvice: string;
}

export type VentilationSuitability = 'FAVORABLE' | 'MODERATE' | 'CAUTION' | 'NEUTRAL';

export interface VentilationFactor {
  readonly name: string;
  readonly value: string;
  readonly status: 'good' | 'moderate' | 'caution' | 'neutral';
  readonly consideration: string;
}

export interface VentilationHourlyPoint {
  readonly hour: string; // "14:00"
  readonly timestamp: string;
  readonly suitability: VentilationSuitability;
  readonly pm25Concentration: number;
  readonly ozoneConcentration?: number;
  readonly temperatureC?: number;
  readonly humidityPercent?: number;
  readonly summary: string;
  readonly factors: readonly VentilationFactor[];
}

export interface CadrCalculation {
  readonly floorAreaM2: number;
  readonly ceilingHeightM: number;
  readonly roomVolumeM3: number;
  readonly targetAch: number;
  readonly requiredCadrM3h: number;
  readonly selectedCadrM3h: number;
  readonly estimatedAch: number;
  readonly isUnderpowered: boolean;
  readonly isTargetMet: boolean;
  readonly deratedSleepAch: number; // CADR typically drops ~60% on low/quiet fan mode
}

export interface FilterLogState {
  readonly installDate: string; // ISO string YYYY-MM-DD
  readonly customIntervalMonths: number; // e.g. 6 or 12 months as per manufacturer
  readonly lastVacuumDate?: string;
  readonly notes?: string;
}

export interface IndoorPreferencesState {
  readonly selectedRoomId: RoomType;
  readonly roomAreas: Record<RoomType, number>;
  readonly ceilingHeightM: number;
  readonly selectedCadrM3h: number;
  readonly targetAch: number;
  readonly filterLog: FilterLogState;
}
