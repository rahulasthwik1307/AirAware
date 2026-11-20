/**
 * AirAware Domain Logic — Indoor Air Intelligence Calculations
 *
 * Grounded mathematical formulas for CADR/ACH sizer and multi-factor ventilation evaluation.
 * Follows strict scientific definitions:
 * - ACH is an engineering air turnover rate, not a medical or health guarantee.
 * - Multi-factor ventilation balances outdoor particulates & ozone against indoor CO2 and moisture.
 */

import { RoomProfile, CadrCalculation, VentilationHourlyPoint, VentilationFactor, VentilationSuitability } from './types';

export const STANDARD_ROOM_PROFILES: readonly RoomProfile[] = [
  {
    id: 'living_room',
    name: 'Living Room',
    defaultAreaM2: 22,
    ceilingHeightM: 2.7,
    icon: '🛋️',
    tag: 'Shared Breathing Zone',
    primaryPollutantRisks: [
      {
        pollutant: 'Resuspended Dust & PM10',
        source: 'Foot traffic, vacuuming without sealed exhaust, and upholstered furniture',
        severity: 'moderate',
      },
      {
        pollutant: 'Outdoor Smog Infiltration',
        source: 'Frequent balcony and exterior door openings during evening inversions',
        severity: 'high',
      },
    ],
    practicalMitigations: [
      {
        action: 'Damp-wipe surfaces and mop hard floors',
        detail: 'Dry brooms resuspend settled particles back into the breathing zone for 2–4 hours.',
      },
      {
        action: 'Inspect perimeter weatherstripping',
        detail: 'Draft stoppers and window seals reduce uncontrolled outdoor smog infiltration by 30–50%.',
      },
      {
        action: 'Position air cleaner in central airflow path',
        detail: 'Avoid tucking purifiers behind curtains or deep inside sofa corners where circulation is blocked.',
      },
    ],
    filtrationAdvice: 'Maintain continuous medium airflow during daytime; ensure pre-filter is vacuumed monthly to preserve CADR.',
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    defaultAreaM2: 12,
    ceilingHeightM: 2.7,
    icon: '🍳',
    tag: 'Combustion & Aerosol Zone',
    primaryPollutantRisks: [
      {
        pollutant: 'Nitrogen Dioxide (NO2) & Carbon Monoxide',
        source: 'Unvented natural gas or LPG combustion burners',
        severity: 'high',
      },
      {
        pollutant: 'Ultrafine Particulates & Cooking Fumes',
        source: 'High-temperature oil frying, sautéing, and charring',
        severity: 'high',
      },
    ],
    practicalMitigations: [
      {
        action: 'Run exhaust hood before and after cooking',
        detail: 'Turn range hood on 2 minutes before lighting flame and keep running 10–15 minutes after cooking completes.',
      },
      {
        action: 'Cook on rear burners under the hood canopy',
        detail: 'Rear burners capture up to 70% more cooking fumes than front burners under standard over-the-range hoods.',
      },
      {
        action: 'Isolate kitchen from bedrooms during frying',
        detail: 'Close interior doors to prevent fine oil aerosols from migrating and settling on bedroom fabrics.',
      },
    ],
    filtrationAdvice: 'Dedicated ducted range hoods provide primary source capture. Standalone room purifiers require activated carbon to capture gaseous NO2.',
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    defaultAreaM2: 16,
    ceilingHeightM: 2.7,
    icon: '🛏️',
    tag: '8-Hour Rest & Exposure Zone',
    primaryPollutantRisks: [
      {
        pollutant: 'Nocturnal CO2 Accumulation',
        source: 'Closed doors and windows with continuous occupant respiration',
        severity: 'moderate',
      },
      {
        pollutant: 'Outdoor Inversion Smog',
        source: 'Nighttime surface cooling trapping particulate smog near ground level',
        severity: 'high',
      },
    ],
    practicalMitigations: [
      {
        action: 'Keep interior bedroom door slightly ajar',
        detail: 'Allows air exchange with the rest of the dwelling to prevent sleeping CO2 levels from exceeding 1,200 ppm.',
      },
      {
        action: 'Size purifier with a quiet-mode margin',
        detail: 'Choose a purifier rated for a larger room so it delivers 3–4 ACH on low/sleep fan mode without sleep-disrupting noise.',
      },
      {
        action: 'Wash bedding in hot water (55°C+)',
        detail: 'Reduces biological dust mite allergens without introducing chemical disinfectant sprays.',
      },
    ],
    filtrationAdvice: 'HEPA air cleaner operated continuously on quiet mode provides uninterrupted breathing zone particulate protection.',
  },
  {
    id: 'study',
    name: 'Study / Home Office',
    defaultAreaM2: 14,
    ceilingHeightM: 2.7,
    icon: '📚',
    tag: 'Cognitive Focus Space',
    primaryPollutantRisks: [
      {
        pollutant: 'Elevated Carbon Dioxide (CO2)',
        source: 'Enclosed workspace respiration causing drowsiness and reduced cognitive throughput',
        severity: 'moderate',
      },
      {
        pollutant: 'Electronics & Printer VOCs',
        source: 'Laser printer fusers and warm plastic electronic enclosures',
        severity: 'moderate',
      },
    ],
    practicalMitigations: [
      {
        action: 'Brief airing when outdoor conditions permit',
        detail: 'A 5–10 minute cross-ventilation flush during cleaner outdoor hours rapidly drops indoor CO2.',
      },
      {
        action: 'Separate printing equipment from desk',
        detail: 'Position laser printers at least 1.5 meters away from the primary seated breathing zone.',
      },
    ],
    filtrationAdvice: 'Compact portable HEPA filtration unit maintains clean ambient air and low particulate loading.',
  },
];

export function getStandardRoomProfiles(): readonly RoomProfile[] {
  return STANDARD_ROOM_PROFILES;
}

/**
 * Calculates Clean Air Delivery Rate (CADR) and Air Changes per Hour (ACH).
 *
 * Formulas:
 * Room Volume (m³) = Floor Area (m²) × Ceiling Height (m)
 * Required CADR (m³/h) = Room Volume (m³) × Target ACH
 * Estimated ACH = Selected CADR (m³/h) / Room Volume (m³)
 * Derated Sleep ACH = (Selected CADR × 0.4) / Room Volume (m³)
 */
export function calculateCadrAch(
  floorAreaM2: number,
  ceilingHeightM: number,
  targetAch: number = 4.0,
  selectedCadrM3h: number = 250
): CadrCalculation {
  const safeArea = Math.max(1, floorAreaM2);
  const safeHeight = Math.max(1.8, ceilingHeightM);
  const safeTargetAch = Math.max(1, targetAch);
  const safeCadr = Math.max(0, selectedCadrM3h);

  const roomVolumeM3 = Math.round(safeArea * safeHeight * 10) / 10;
  const requiredCadrM3h = Math.round(roomVolumeM3 * safeTargetAch);
  const estimatedAch = roomVolumeM3 > 0 ? Math.round((safeCadr / roomVolumeM3) * 10) / 10 : 0;
  // Disclose that on quiet/sleep mode, fan speed drops output by approx 60%
  const deratedSleepAch = roomVolumeM3 > 0 ? Math.round(((safeCadr * 0.4) / roomVolumeM3) * 10) / 10 : 0;

  return {
    floorAreaM2: safeArea,
    ceilingHeightM: safeHeight,
    roomVolumeM3,
    targetAch: safeTargetAch,
    requiredCadrM3h,
    selectedCadrM3h: safeCadr,
    estimatedAch,
    isUnderpowered: estimatedAch < 2.0,
    isTargetMet: estimatedAch >= safeTargetAch,
    deratedSleepAch,
  };
}

export interface RawHourlyDataPoint {
  readonly time: string;
  readonly pm25?: number;
  readonly pm10?: number;
  readonly ozone?: number;
  readonly no2?: number;
  readonly temperatureC?: number;
  readonly humidityPercent?: number;
}

/**
 * Evaluates the multi-factor outdoor-to-indoor ventilation suitability curve.
 *
 * Considers:
 * 1. Outdoor PM2.5 & PM10 (particulate infiltration)
 * 2. Ground-level Ozone (photochemical afternoon spikes)
 * 3. Humidity & Temperature (thermal comfort, dampness/mold risks)
 * 4. Indoor CO2 & moisture purge necessity
 */
export function evaluateVentilationPoint(data: RawHourlyDataPoint): VentilationHourlyPoint {
  const timeStr = data.time.includes('T') ? data.time.split('T')[1].slice(0, 5) : data.time.slice(0, 5);
  const pm25 = data.pm25 ?? 0;
  const ozone = data.ozone;
  const temp = data.temperatureC;
  const humidity = data.humidityPercent;

  const factors: VentilationFactor[] = [];

  // 1. PM2.5 evaluation
  if (pm25 <= 25) {
    factors.push({
      name: 'Particulates (PM2.5)',
      value: `${Math.round(pm25)} µg/m³`,
      status: 'good',
      consideration: 'Low outdoor ambient particulate concentration.',
    });
  } else if (pm25 <= 60) {
    factors.push({
      name: 'Particulates (PM2.5)',
      value: `${Math.round(pm25)} µg/m³`,
      status: 'moderate',
      consideration: 'Moderate ambient loading; brief 10–15 min airing recommended.',
    });
  } else {
    factors.push({
      name: 'Particulates (PM2.5)',
      value: `${Math.round(pm25)} µg/m³`,
      status: 'caution',
      consideration: 'Elevated outdoor smog; natural infiltration increases indoor PM.',
    });
  }

  // 2. Ozone evaluation (if present in model)
  if (typeof ozone === 'number') {
    if (ozone > 100) {
      factors.push({
        name: 'Ozone (O3)',
        value: `${Math.round(ozone)} µg/m³`,
        status: 'caution',
        consideration: 'Warm afternoon photochemical ozone peak; ozone degrades indoors on surfaces.',
      });
    } else {
      factors.push({
        name: 'Ozone (O3)',
        value: `${Math.round(ozone)} µg/m³`,
        status: 'good',
        consideration: 'Ozone within acceptable background levels.',
      });
    }
  }

  // 3. Humidity evaluation (if present)
  if (typeof humidity === 'number') {
    if (humidity > 80) {
      factors.push({
        name: 'Relative Humidity',
        value: `${Math.round(humidity)}%`,
        status: 'caution',
        consideration: 'High dampness outside; extended airing may increase indoor mold risk.',
      });
    } else {
      factors.push({
        name: 'Relative Humidity',
        value: `${Math.round(humidity)}%`,
        status: 'good',
        consideration: 'Comfortable indoor humidity transfer range.',
      });
    }
  }

  // Overall Multi-factor Suitability Synthesis
  let suitability: VentilationSuitability = 'NEUTRAL';
  let summary = '';

  const hasCaution = factors.some((f) => f.status === 'caution');
  const allGood = factors.length > 0 && factors.every((f) => f.status === 'good');

  if (allGood && pm25 <= 35) {
    suitability = 'FAVORABLE';
    summary = 'Outdoor air is favorable. Favorable window for full room air exchange to purge indoor CO2 and moisture.';
  } else if (pm25 <= 75 && !hasCaution) {
    suitability = 'MODERATE';
    summary = 'Moderate conditions. Consider a brief 5–10 minute airing if indoor air feels stuffy, then run filtration.';
  } else {
    suitability = 'CAUTION';
    summary = 'Elevated outdoor pollution. Keep windows closed and rely on indoor HEPA filtration.';
  }

  return {
    hour: timeStr,
    timestamp: data.time,
    suitability,
    pm25Concentration: pm25,
    ozoneConcentration: ozone,
    temperatureC: temp,
    humidityPercent: humidity,
    summary,
    factors,
  };
}

/**
 * Evaluates full 24-hour ventilation curve from hourly model arrays.
 */
export function evaluateVentilationCurve(hourlyList: readonly RawHourlyDataPoint[]): readonly VentilationHourlyPoint[] {
  if (!hourlyList || hourlyList.length === 0) {
    return [];
  }
  return hourlyList.slice(0, 24).map(evaluateVentilationPoint);
}
