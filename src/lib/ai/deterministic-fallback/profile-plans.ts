import { GuidanceRequest } from '../types';

export function buildHouseholdPlan(data: GuidanceRequest) {
  const aqi = data.aqi;
  const isSevere = aqi >= 300;
  const isPoor = aqi >= 200;
  const members = data.householdMembers ?? [];

  const hasChildren = members.some(
    (m) =>
      m.archetype.toLowerCase().includes('child') ||
      m.archetype.toLowerCase().includes('pediatric') ||
      m.sensitivityTier.toLowerCase().includes('pediatric') ||
      m.nickname.toLowerCase().includes('child') ||
      m.nickname.toLowerCase().includes('kid') ||
      m.nickname.toLowerCase().includes('baby') ||
      m.nickname.toLowerCase().includes('infant')
  );

  const hasSenior = members.some(
    (m) =>
      m.archetype.toLowerCase().includes('senior') ||
      m.sensitivityTier.toLowerCase().includes('senior') ||
      m.nickname.toLowerCase().includes('grand') ||
      m.nickname.toLowerCase().includes('elder')
  );

  const hasRespiratory = members.some(
    (m) =>
      m.sensitivityTier.toLowerCase().includes('respiratory') ||
      m.sensitivityTier.toLowerCase().includes('cardiovascular') ||
      m.nickname.toLowerCase().includes('asthma')
  );

  const hasCommuter =
    members.some(
      (m) =>
        m.archetype.toLowerCase().includes('commuter') ||
        m.schedules?.some((s) => s.commuteMode && s.commuteMode !== 'WALKING')
    ) || data.userContext.primaryActivity === 'daily_commute';

  if (hasChildren) {
    return {
      morning: {
        period: 'morning' as const,
        area: 'Low-emission routine',
        action: isSevere
          ? 'Shift school runs past 9:30 AM; keep children indoors during morning smog peak.'
          : isPoor
          ? 'Shift outdoor playground time indoors; ensure children wear fitted pediatric N95 masks during morning school transit.'
          : 'Proceed with normal morning activities; combine early school transit trips to minimize vehicle cold starts.',
        why: 'Nocturnal ground cooling traps particulate matter below a shallow boundary layer until solar heating commences.',
        expectedImpact: isSevere
          ? 'Avoids up to 70% of peak daily PM2.5 inhalation during nocturnal ground-level inversion.'
          : 'Reduces morning particulate exposure by 40–55%.',
      },
      afternoon: {
        period: 'afternoon' as const,
        area: 'Indoor air quality hack',
        action: isSevere
          ? "Create a clean-air study and play sanctuary in children's bedrooms with continuous HEPA filtration; keep windows sealed."
          : isPoor
          ? 'Briefly cross-ventilate study areas for 15 minutes between 1:00 PM and 2:30 PM, then seal and run HEPA purifier.'
          : 'Open windows for cross-ventilation between 12:30 PM and 3:30 PM to clear indoor CO2 buildup.',
        why: 'Children breathe more air per kilogram of body weight; daytime solar radiation lifts stagnant ground smoke for safer ventilation.',
        expectedImpact: isSevere
          ? 'Maintains indoor child breathing zone PM2.5 below 25 µg/m³ despite severe ambient outdoor pollution.'
          : 'Clears classroom and study CO2 to under 800 ppm while keeping particulate ingress minimal.',
      },
      evening: {
        period: 'evening' as const,
        area: 'Sustainable alternative',
        action: isSevere
          ? 'Coordinate shared school carpools or electric transit for evening activities; eliminate vehicle engine idling at pick-up gates.'
          : 'Use public transit or shared neighborhood carpools for evening family travel; avoid cold-engine vehicle idling.',
        why: 'Sunset rapidly cools the ground, reforming the surface inversion lid and compounding toxic tailpipe emissions.',
        expectedImpact: 'Prevents up to 2.5 kg CO2 and 15g NOx tailpipe exhaust per combined school run.',
      },
    };
  }

  if (hasSenior) {
    return {
      morning: {
        period: 'morning' as const,
        area: 'Low-emission routine',
        action: isSevere
          ? 'Postpone senior morning walks until afternoon; do gentle indoor mobility exercises in a filtered room.'
          : isPoor
          ? 'Shift senior outdoor park walks to indoor filtered spaces; avoid roadside walking before 9:30 AM.'
          : 'Schedule senior morning park walks after 8:30 AM when early chill and ground-level vehicle exhaust begin dispersing.',
        why: 'Cold morning air and concentrated particulate matter increase blood pressure and bronchial airway resistance in older adults.',
        expectedImpact: isSevere
          ? 'Prevents acute cardiovascular and bronchial strain from breathing cold morning inversion smog.'
          : 'Reduces peak particulate inhalation by 35–50% during morning exercise.',
      },
      afternoon: {
        period: 'afternoon' as const,
        area: 'Indoor air quality hack',
        action: isSevere
          ? 'Keep living and resting rooms sealed; run low-noise HEPA filtration continuously at bedside.'
          : isPoor
          ? 'Execute a brief 15-minute cross-ventilation window between 1:00 PM and 2:30 PM, then resume continuous HEPA filtration.'
          : 'Open windows for fresh air cross-ventilation between 1:00 PM and 3:30 PM to maintain oxygen and comfort.',
        why: 'Diurnal heating raises the atmospheric mixing layer, offering the cleanest ambient air of the day for room refreshing.',
        expectedImpact: isSevere
          ? 'Maintains resting room PM2.5 in the healthy range (< 15 µg/m³) without drafts.'
          : 'Flushes indoor airborne irritants without introducing high particulate loads.',
      },
      evening: {
        period: 'evening' as const,
        area: 'Sustainable alternative',
        action: isSevere
          ? 'Combine evening medical and grocery trips with neighbors using a shared vehicle; avoid traveling in open three-wheelers.'
          : 'Use shared electric transit or carpool for evening visits; eliminate cold vehicle starts in residential colonies.',
        why: 'Evening cooling reforms the ground inversion, trapping toxic stop-and-go exhaust at breathing level.',
        expectedImpact: 'Reduces personal exposure to roadside diesel exhaust while cutting local neighborhood emissions.',
      },
    };
  }

  if (hasRespiratory) {
    return {
      morning: {
        period: 'morning' as const,
        area: 'Low-emission routine',
        action: isSevere
          ? 'Stay indoors in filtered air; keep prescribed inhaler accessible and wear an N95/FFP2 respirator if stepping outside.'
          : isPoor
          ? 'Move all aerobic workouts indoors; avoid walking near diesel transit corridors to prevent airway irritation; keep inhaler handy.'
          : 'Check peak flow before morning exercise; wear a lightweight scarf or mask in brisk morning air to prevent airway spasms.',
        why: 'Fine particulates (PM2.5) and cold morning air trigger immediate airway inflammation and bronchospasm in sensitive airways.',
        expectedImpact: isSevere
          ? 'Avoids severe asthma or respiratory exacerbations triggered by dense morning particulate spikes.'
          : 'Reduces morning airway inflammation and prevents emergency medication usage.',
      },
      afternoon: {
        period: 'afternoon' as const,
        area: 'Indoor air quality hack',
        action: isSevere
          ? 'Maintain a sealed clean-air recovery bedroom with continuous HEPA filtration; avoid frying or incense burning.'
          : isPoor
          ? 'Keep windows closed during high winds; run purifier on medium-high to scrub infiltrated particles.'
          : 'Briefly ventilate during peak afternoon warmth (1:00–3:00 PM), then close and operate HEPA filtration.',
        why: 'Eliminating indoor particle sources and outdoor soot ingress prevents chronic bronchial irritation.',
        expectedImpact: isSevere
          ? 'Maintains indoor particle count well below WHO guidelines, keeping airway symptoms stable.'
          : 'Prevents indoor accumulation of allergens and chemical combustion triggers.',
      },
      evening: {
        period: 'evening' as const,
        area: 'Sustainable alternative',
        action: isSevere
          ? 'Avoid open-air commutes; travel only via closed-window metro or private vehicle with recirculating air filtration.'
          : 'Opt for electric metro or bus for evening trips; avoid sitting in stagnant traffic jams on congested arterial roads.',
        why: 'Evening rush hour produces intense ground-level nitrogen dioxide and particulate concentrations that irritate airways.',
        expectedImpact: 'Prevents high-concentration tailpipe exposure during evening temperature drops.',
      },
    };
  }

  if (hasCommuter) {
    return {
      morning: {
        period: 'morning' as const,
        area: 'Low-emission routine',
        action: isSevere
          ? 'Shift commute departure past 9:30 AM or telecommute; travel via closed-window metro with recirculating air.'
          : isPoor
          ? 'Wear a fitted N95 respirator during commute; switch vehicle ventilation to internal recirculation mode.'
          : 'Plan morning commute to avoid known diesel traffic bottlenecks; avoid idling engine in residential lanes.',
        why: 'Surface inversion traps vehicle tailpipe emissions near the pavement during peak 07:00–09:30 AM travel hours.',
        expectedImpact: isSevere
          ? 'Reduces commuter particulate and black carbon inhalation by up to 60% compared to open road exposure.'
          : 'Lowers personal exposure to heavy traffic exhaust while avoiding cold-start engine strain.',
      },
      afternoon: {
        period: 'afternoon' as const,
        area: 'Indoor air quality hack',
        action: isSevere
          ? 'Keep workspace and home office doors sealed; run a desktop or room HEPA purifier in the main work area.'
          : isPoor
          ? 'Cross-ventilate home office briefly between 1:00 PM and 2:30 PM, then seal and purify to maintain alertness.'
          : 'Open windows for cross-ventilation between 12:30 PM and 3:30 PM to clear CO2 and boost afternoon focus.',
        why: 'Elevated afternoon atmospheric mixing provides a brief clean air window to flush indoor carbon dioxide.',
        expectedImpact: isSevere
          ? 'Maintains work area PM2.5 below 20 µg/m³ to prevent afternoon cognitive fatigue and headaches.'
          : 'Keeps indoor CO2 below 800 ppm, sustaining mental focus without letting in heavy smog.',
      },
      evening: {
        period: 'evening' as const,
        area: 'Sustainable alternative',
        action: isSevere
          ? 'Shift from solo car driving to public metro or verified office carpool; avoid solo vehicle trips during evening rush.'
          : 'Use public electric transit or carpool for evening commute; consolidate errands to avoid multiple engine start cycles.',
        why: 'Evening traffic emissions coincide with cooling temperatures, intensifying ground-level smog formation.',
        expectedImpact: 'Eliminates ~2.3 kg of CO2 and 12g of smog-forming NOx per 10 km shifted to electric transit.',
      },
    };
  }

  // General Household Profile (no children, seniors, or special sensitivities)
  return {
    morning: {
      period: 'morning' as const,
      area: 'Low-emission routine',
      action: isSevere
        ? 'Move morning physical exercise indoors; avoid walking near high-emission roadways before 9:30 AM.'
        : isPoor
        ? 'Shift outdoor workouts to afternoon; wear an N95 respirator if commuting on foot or two-wheeler.'
        : 'Proceed with normal morning activities; combine early errands into one trip to avoid multiple cold vehicle starts.',
      why: 'Morning radiation cooling traps emissions below a low atmospheric boundary layer until solar warmth initiates mixing.',
      expectedImpact: isSevere
        ? 'Cuts daily personal inhaled particulate dose by up to 50% by avoiding peak stagnant morning hours.'
        : 'Prevents unnecessary fuel burn and reduces morning cold-start tailpipe emissions.',
    },
    afternoon: {
      period: 'afternoon' as const,
      area: 'Indoor air quality hack',
      action: isSevere
        ? 'Operate HEPA air purifier on continuous medium mode; use dedicated kitchen exhaust during cooking.'
        : isPoor
        ? 'Perform 15-minute cross-ventilation between 1:00 PM and 3:00 PM, then seal doors and resume HEPA filtration.'
        : 'Open windows for natural cross-ventilation between 12:30 PM and 3:30 PM to refresh indoor air.',
      why: 'Peak daytime sunlight lifts the atmospheric mixing layer, creating the safest window for indoor air exchange.',
      expectedImpact: isSevere
        ? 'Maintains clean indoor air quality despite elevated ambient outdoor smog.'
        : 'Prevents indoor stale air accumulation without introducing peak outdoor particulate pollution.',
    },
    evening: {
      period: 'evening' as const,
      area: 'Sustainable alternative',
      action: isSevere
        ? 'Consolidate all evening errands into a single shared trip or use public transit; eliminate vehicle idling.'
        : 'Use public transit, walking (if AQI allows), or carpooling for evening errands; combine local trips.',
      why: 'Evening cooling reforms the ground inversion layer, compounding evening rush hour tailpipe exhaust.',
      expectedImpact: 'Prevents 1.5–3.0 kg CO2 and valuable tailpipe emission precursors per consolidated trip.',
    },
  };
}
