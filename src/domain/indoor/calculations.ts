/**
 * AirAware Domain Logic — Indoor Air Intelligence Calculations
 *
 * Grounded mathematical formulas for CADR/ACH sizer and multi-factor ventilation evaluation.
 * Follows strict scientific definitions:
 * - ACH is an engineering air turnover rate, not a medical or health guarantee.
 * - Multi-factor ventilation balances outdoor particulates & ozone against indoor CO2 and moisture.
 */

import {
  RoomProfile,
  CadrCalculation,
  VentilationHourlyPoint,
  VentilationFactor,
  VentilationSuitability,
  IndoorReadingAnalysis,
  IndoorActionItem,
} from './types';

export type { IndoorReadingAnalysis, IndoorActionItem };

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

/**
 * Classifies indoor PM2.5 concentration against standard India CPCB NAQI 24h breakpoints.
 */
export function classifyIndoorPm25(pm25: number): {
  readonly category: string;
  readonly colorToken: string;
  readonly bgToken: string;
} {
  const val = Math.max(0, pm25);
  if (val <= 30) {
    return { category: 'Good', colorToken: '#059669', bgToken: '#ECFDF5' };
  }
  if (val <= 60) {
    return { category: 'Satisfactory', colorToken: '#84cc16', bgToken: '#F7FEE7' };
  }
  if (val <= 90) {
    return { category: 'Moderate', colorToken: '#D97706', bgToken: '#FFFBEB' };
  }
  if (val <= 120) {
    return { category: 'Poor', colorToken: '#EA580C', bgToken: '#FFF7ED' };
  }
  if (val <= 250) {
    return { category: 'Very Poor', colorToken: '#DC2626', bgToken: '#FEF2F2' };
  }
  return { category: 'Severe', colorToken: '#7F1D1D', bgToken: '#450A0A' };
}

/**
 * Derives a rough indoor PM2.5 estimate from outdoor ambient levels.
 * Standard urban residential building shell infiltration without mechanical filtration is ~60%.
 */
export function estimateIndoorPm25(outdoorPm25: number): {
  readonly estimatedPm25: number;
  readonly assumption: string;
  readonly infiltrationRate: number;
} {
  const safeOutdoor = Math.max(0, outdoorPm25);
  const estimatedPm25 = Math.round(safeOutdoor * 0.6);
  const assumption =
    'Rough estimate assuming standard closed residential doors and windows with natural building shell infiltration (~60% of ambient outdoor PM2.5) without active mechanical air filtration. This is an estimate, not a sensor measurement.';

  return {
    estimatedPm25,
    assumption,
    infiltrationRate: 0.6,
  };
}

export interface AnalyzeIndoorAirParams {
  readonly indoorReading: number | null;
  readonly hasMonitor: boolean;
  readonly outdoorPm25: number;
  readonly householdMembers?: readonly {
    readonly archetype?: string;
    readonly sensitivityTier?: string;
    readonly nickname?: string;
  }[];
  readonly bestVentilationWindow?: string;
}

/**
 * Comprehensive indoor air quality analysis, comparison, and personalized mitigation plan.
 */
export function analyzeIndoorAir(params: AnalyzeIndoorAirParams): IndoorReadingAnalysis {
  const { indoorReading, hasMonitor, outdoorPm25, householdMembers = [], bestVentilationWindow } = params;

  const isEstimate = !hasMonitor || indoorReading === null;
  const effectiveReading = isEstimate
    ? estimateIndoorPm25(outdoorPm25).estimatedPm25
    : indoorReading;

  const classification = classifyIndoorPm25(effectiveReading);
  const statedAssumption = isEstimate ? estimateIndoorPm25(outdoorPm25).assumption : undefined;

  // Comparison to outdoor
  let comparisonText = '';
  let percentageCleaner: number | null = null;

  if (outdoorPm25 > 0) {
    if (effectiveReading < outdoorPm25) {
      const diffPct = Math.round(((outdoorPm25 - effectiveReading) / outdoorPm25) * 100);
      percentageCleaner = diffPct;
      comparisonText = isEstimate
        ? `Estimated indoor air is ~${diffPct}% cleaner than outdoor air (${effectiveReading} vs ${Math.round(outdoorPm25)} µg/m³).`
        : `Your measured indoor air is ${diffPct}% cleaner than outdoor air (${effectiveReading} vs ${Math.round(outdoorPm25)} µg/m³).`;
    } else if (effectiveReading === outdoorPm25) {
      comparisonText = `Indoor and outdoor particulate levels are equal (${effectiveReading} µg/m³).`;
      percentageCleaner = 0;
    } else {
      const elevatedPct = Math.round(((effectiveReading - outdoorPm25) / outdoorPm25) * 100);
      comparisonText = `Indoor PM2.5 is elevated ${elevatedPct}% above outdoor air (${effectiveReading} vs ${Math.round(outdoorPm25)} µg/m³). Check for indoor cooking, frying, or incense!`;
      percentageCleaner = -elevatedPct;
    }
  } else {
    comparisonText = `Current indoor level: ${effectiveReading} µg/m³.`;
  }

  // Profile vulnerability checks
  const hasInfants = householdMembers.some(
    (m) =>
      (m.archetype && /child|pediatric|baby|infant/i.test(m.archetype)) ||
      (m.sensitivityTier && /pediatric/i.test(m.sensitivityTier)) ||
      (m.nickname && /child|kid|baby|infant/i.test(m.nickname))
  );

  const hasSeniors = householdMembers.some(
    (m) =>
      (m.archetype && /senior|elder/i.test(m.archetype)) ||
      (m.sensitivityTier && /senior/i.test(m.sensitivityTier)) ||
      (m.nickname && /senior|grand|elder/i.test(m.nickname))
  );

  const hasRespiratory = householdMembers.some(
    (m) =>
      (m.sensitivityTier && /respiratory|cardiovascular/i.test(m.sensitivityTier)) ||
      (m.nickname && /asthma|inhaler/i.test(m.nickname))
  );

  const actions: IndoorActionItem[] = [];

  // Action 1: Purifier Operating Mode
  if (effectiveReading > 60) {
    actions.push({
      title: 'Purifier: Boost to High / Turbo Mode',
      action: 'Run mechanical HEPA filtration on high/turbo speed in active rooms until levels drop below 30 µg/m³.',
      why: 'High-speed fan turnover provides the necessary Clean Air Delivery Rate (CADR) to rapidly clear suspended particulate matter.',
      expectedImpact: hasInfants
        ? 'Quickly lowers floor-level particulate concentration by 60–75% in infant crawl zones.'
        : hasRespiratory
        ? 'Prevents acute airway irritation and relieves bronchial reactivity within 30 minutes.'
        : hasSeniors
        ? 'Reduces resting room cardiovascular stress caused by inhaling fine winter soot.'
        : 'Reduces room PM2.5 by 50–70% within 45 minutes of continuous high airflow.',
    });
  } else if (effectiveReading > 30) {
    actions.push({
      title: 'Purifier: Maintain Continuous Medium Mode',
      action: 'Keep air purifiers running on steady medium speed rather than low auto mode.',
      why: 'Medium speed ensures 3 to 4 air changes per hour (ACH) to balance fresh particle infiltration against filter collection.',
      expectedImpact: hasInfants
        ? 'Maintains nursery air consistently in the CPCB Good band (< 25 µg/m³).'
        : hasSeniors
        ? 'Protects resting oxygen uptake without disruptive motor noise or draftiness.'
        : 'Keeps room air stable below 25 µg/m³ throughout daily activities.',
    });
  } else {
    actions.push({
      title: 'Purifier: Maintain Low / Quiet Mode',
      action: 'Run purifier continuously on quiet/low speed to sustain clean haven status.',
      why: 'Indoor air is currently within CPCB Good levels; low speed preserves filter lifespan while maintaining clean air turnover.',
      expectedImpact: 'Sustains a healthy clean-air sanctuary below 15 µg/m³ with minimal power consumption.',
    });
  }

  // Action 2: Window Ventilation & Best Timing
  const windowTime = bestVentilationWindow || '1:00 PM – 3:00 PM';
  if (outdoorPm25 > effectiveReading) {
    actions.push({
      title: 'Windows: Keep Sealed; Air Briefly at Solar Peak',
      action: `Keep exterior doors and windows latched now. Open briefly for 10–15 minutes only between ${windowTime} if air feels stale, then immediately reseal and boost filtration.`,
      why: 'Outdoor smog is concentrated near the ground during morning and night. Afternoon solar warmth lifts the boundary layer for cleaner cross-ventilation.',
      expectedImpact: 'Flushes indoor carbon dioxide (CO2) below 900 ppm without allowing severe outdoor particulate ingress.',
    });
  } else {
    actions.push({
      title: 'Windows: Cross-Ventilate to Flush Indoor Spike',
      action: `Open opposite windows for 10 minutes now to exhaust trapped indoor combustion particles to the cleaner outside air.`,
      why: 'Indoor particulate levels currently exceed outdoor ambient air due to cooking or indoor sources; rapid airflow dilutes the concentration.',
      expectedImpact: 'Cuts indoor particulate concentrations by 50–70% in under 15 minutes.',
    });
  }

  // Action 3: Cooking Exhaust & Source Isolation
  actions.push({
    title: 'Cooking: Range Hood & Kitchen Door Isolation',
    action: 'Switch on ducted exhaust hood 2 minutes prior to lighting burners; keep interior kitchen doors closed during sautéing or frying.',
    why: 'High-temperature oil droplets and gas combustion generate concentrated ultrafine particles (UFP) that easily migrate into bedrooms.',
    expectedImpact: hasRespiratory
      ? 'Prevents cooking oil aerosols from triggering asthmatic bronchial spasms in family living areas.'
      : 'Stops cooking PM2.5 from spiking living room concentrations by 80–120 µg/m³.',
  });

  // Action 4: Houseplants as Minor Extra (Science-backed)
  actions.push({
    title: 'Indoor Plants: Minor Psychological & Humidity Extra',
    action: 'Enjoy indoor greenery (snake plant, pothos) as a natural decor and mild humidity enhancer, but do not rely on plants for particulate filtration.',
    why: 'Controlled chamber studies do not translate to real homes; scientific consensus shows houseplants have a negligible effect on ambient particulate matter or toxic gases.',
    expectedImpact: 'Provides positive biophilic well-being without false security; mechanical HEPA filtration remains the primary defense.',
  });

  return {
    reading: effectiveReading,
    hasMonitor,
    cpcbCategory: classification.category,
    cpcbColorToken: classification.colorToken,
    cpcbBgToken: classification.bgToken,
    outdoorPm25,
    comparisonText,
    percentageCleaner,
    isEstimate,
    statedAssumption,
    actions,
  };
}
