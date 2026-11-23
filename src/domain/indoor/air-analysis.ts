import { IndoorReadingAnalysis, IndoorActionItem } from './types';

/**
 * Classifies an indoor PM2.5 reading into official CPCB 24-hour equivalent concentration tiers.
 */
export function classifyIndoorPm25(pm25: number): {
  readonly category: string;
  readonly colorToken: string;
  readonly bgToken: string;
} {
  const val = Math.max(0, pm25);
  if (val <= 30) return { category: 'Good', colorToken: '#047857', bgToken: '#ECFDF5' };
  if (val <= 60) return { category: 'Satisfactory', colorToken: '#4d7c0f', bgToken: '#F7FEE7' };
  if (val <= 90) return { category: 'Moderate', colorToken: '#92400E', bgToken: '#FFFBEB' };
  if (val <= 120) return { category: 'Poor', colorToken: '#EA580C', bgToken: '#FFF7ED' };
  if (val <= 250) return { category: 'Very Poor', colorToken: '#DC2626', bgToken: '#FEF2F2' };
  return { category: 'Severe', colorToken: '#7F1D1D', bgToken: '#450A0A' };
}

/**
 * Estimates baseline indoor PM2.5 from outdoor ambient concentration using a standard 60% infiltration factor.
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

interface HouseholdVulnerabilities {
  readonly hasInfants: boolean;
  readonly hasSeniors: boolean;
  readonly hasRespiratory: boolean;
}

function detectVulnerabilities(members: AnalyzeIndoorAirParams['householdMembers'] = []): HouseholdVulnerabilities {
  const hasInfants = members.some(
    (m) =>
      (m.archetype && /child|pediatric|baby|infant/i.test(m.archetype)) ||
      (m.sensitivityTier && /pediatric/i.test(m.sensitivityTier)) ||
      (m.nickname && /child|kid|baby|infant/i.test(m.nickname))
  );

  const hasSeniors = members.some(
    (m) =>
      (m.archetype && /senior|elder/i.test(m.archetype)) ||
      (m.sensitivityTier && /senior/i.test(m.sensitivityTier)) ||
      (m.nickname && /senior|grand|elder/i.test(m.nickname))
  );

  const hasRespiratory = members.some(
    (m) =>
      (m.sensitivityTier && /respiratory|cardiovascular/i.test(m.sensitivityTier)) ||
      (m.nickname && /asthma|inhaler/i.test(m.nickname))
  );

  return { hasInfants, hasSeniors, hasRespiratory };
}

function buildPurifierAction(effectiveReading: number, vulns: HouseholdVulnerabilities): IndoorActionItem {
  if (effectiveReading > 60) {
    let impact = 'Reduces room PM2.5 by 50–70% within 45 minutes of continuous high airflow.';
    if (vulns.hasInfants) impact = 'Quickly lowers floor-level particulate concentration by 60–75% in infant crawl zones.';
    else if (vulns.hasRespiratory) impact = 'Prevents acute airway irritation and relieves bronchial reactivity within 30 minutes.';
    else if (vulns.hasSeniors) impact = 'Reduces resting room cardiovascular stress caused by inhaling fine winter soot.';

    return {
      title: 'Purifier: Boost to High / Turbo Mode',
      action: 'Run mechanical HEPA filtration on high/turbo speed in active rooms until levels drop below 30 µg/m³.',
      why: 'High-speed fan turnover provides the necessary Clean Air Delivery Rate (CADR) to rapidly clear suspended particulate matter.',
      expectedImpact: impact,
    };
  }

  if (effectiveReading > 30) {
    let impact = 'Keeps room air stable below 25 µg/m³ throughout daily activities.';
    if (vulns.hasInfants) impact = 'Maintains nursery air consistently in the CPCB Good band (< 25 µg/m³).';
    else if (vulns.hasSeniors) impact = 'Protects resting oxygen uptake without disruptive motor noise or draftiness.';

    return {
      title: 'Purifier: Maintain Continuous Medium Mode',
      action: 'Keep air purifiers running on steady medium speed rather than low auto mode.',
      why: 'Medium speed ensures 3 to 4 air changes per hour (ACH) to balance fresh particle infiltration against filter collection.',
      expectedImpact: impact,
    };
  }

  return {
    title: 'Purifier: Maintain Low / Quiet Mode',
    action: 'Run purifier continuously on quiet/low speed to sustain clean haven status.',
    why: 'Indoor air is currently within CPCB Good levels; low speed preserves filter lifespan while maintaining clean air turnover.',
    expectedImpact: 'Sustains a healthy clean-air sanctuary below 15 µg/m³ with minimal power consumption.',
  };
}

function buildComparisonSummary(effectiveReading: number, outdoorPm25: number, isEstimate: boolean): { comparisonText: string; percentageCleaner: number | null } {
  if (outdoorPm25 <= 0) {
    return { comparisonText: `Current indoor level: ${effectiveReading} µg/m³.`, percentageCleaner: null };
  }

  if (effectiveReading < outdoorPm25) {
    const diffPct = Math.round(((outdoorPm25 - effectiveReading) / outdoorPm25) * 100);
    return {
      percentageCleaner: diffPct,
      comparisonText: isEstimate
        ? `Estimated indoor air is ~${diffPct}% cleaner than outdoor air (${effectiveReading} vs ${Math.round(outdoorPm25)} µg/m³).`
        : `Your measured indoor air is ${diffPct}% cleaner than outdoor air (${effectiveReading} vs ${Math.round(outdoorPm25)} µg/m³).`,
    };
  }

  if (effectiveReading === outdoorPm25) {
    return {
      comparisonText: `Indoor and outdoor particulate levels are equal (${effectiveReading} µg/m³).`,
      percentageCleaner: 0,
    };
  }

  const elevatedPct = Math.round(((effectiveReading - outdoorPm25) / outdoorPm25) * 100);
  return {
    comparisonText: `Indoor PM2.5 is elevated ${elevatedPct}% above outdoor air (${effectiveReading} vs ${Math.round(outdoorPm25)} µg/m³). Check for indoor cooking, frying, or incense!`,
    percentageCleaner: -elevatedPct,
  };
}

/**
 * Analyzes indoor microclimate readings and generates actionable, personalized room recommendations.
 */
export function analyzeIndoorAir(params: AnalyzeIndoorAirParams): IndoorReadingAnalysis {
  const { indoorReading, hasMonitor, outdoorPm25, householdMembers = [], bestVentilationWindow } = params;

  const isEstimate = !hasMonitor || indoorReading === null;
  const effectiveReading = isEstimate ? estimateIndoorPm25(outdoorPm25).estimatedPm25 : indoorReading;
  const classification = classifyIndoorPm25(effectiveReading);
  const statedAssumption = isEstimate ? estimateIndoorPm25(outdoorPm25).assumption : undefined;

  const { comparisonText, percentageCleaner } = buildComparisonSummary(effectiveReading, outdoorPm25, isEstimate);
  const vulns = detectVulnerabilities(householdMembers);
  const actions: IndoorActionItem[] = [buildPurifierAction(effectiveReading, vulns)];

  // Action 2: Windows
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

  // Action 3: Cooking
  actions.push({
    title: 'Cooking: Range Hood & Kitchen Door Isolation',
    action: 'Switch on ducted exhaust hood 2 minutes prior to lighting burners; keep interior kitchen doors closed during sautéing or frying.',
    why: 'High-temperature oil droplets and gas combustion generate concentrated ultrafine particles (UFP) that easily migrate into bedrooms.',
    expectedImpact: vulns.hasRespiratory
      ? 'Prevents cooking oil aerosols from triggering asthmatic bronchial spasms in family living areas.'
      : 'Stops cooking PM2.5 from spiking living room concentrations by 80–120 µg/m³.',
  });

  // Action 4: Plants
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
