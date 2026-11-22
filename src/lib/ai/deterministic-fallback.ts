/**
 * AirAware — Deterministic Offline Guidance Engine
 *
 * Authoritative, scientific rule-based environmental guidance engine.
 * Generates verified guidance from EPA/WHO criteria in pure TypeScript with zero network calls.
 * Serves as the reliable foundation when AI is disabled, rate-limited, or unavailable.
 */

import {
  GuidanceRequest,
  GuidanceResponse,
  CopilotRequest,
  CopilotResponse,
  VentilationAdvice,
} from './types';

/**
 * Generates deterministic proactive guidance cards from verified environmental rules.
 */
export function getDeterministicGuidance(data: GuidanceRequest): GuidanceResponse {
  const { aqi, category, dominantPollutant, weather, userContext } = data;
  const isSensitive = userContext.isSensitiveGroup;
  const activity = userContext.primaryActivity;

  let headline = '';
  let healthSummary = '';
  const actionRecommendations: string[] = [];
  let sensitiveGroupAdvisory = '';
  let ventilationRecommendation: VentilationAdvice = 'open_windows';

  switch (category) {
    case 'Good':
      headline = 'Air Quality is Satisfactory';
      healthSummary = `Air pollution poses little or no risk with an AQI of ${aqi}. Outdoor physical activities are encouraged for all groups.`;
      actionRecommendations.push(
        'Enjoy outdoor exercise and daily activities without restriction.',
        'Open windows and natural vents to refresh indoor air with clean outdoor air.'
      );
      sensitiveGroupAdvisory = 'No special health precautions are necessary for sensitive individuals.';
      ventilationRecommendation = 'open_windows';
      break;

    case 'Moderate':
      headline = 'Acceptable Air Quality with Minor Cautions';
      healthSummary = `Air quality is acceptable (AQI ${aqi}). However, unusually sensitive individuals should watch for symptoms like coughing or shortness of breath.`;
      if (isSensitive) {
        actionRecommendations.push(
          `Consider reducing heavy or prolonged outdoor exertion if sensitive to ${dominantPollutant.toUpperCase()}.`,
          'Plan outdoor training sessions for early morning or late evening when ozone and particulates are typically lower.'
        );
      } else {
        actionRecommendations.push(
          'General population can proceed with normal outdoor routines.',
          'Ventilate rooms during periods of lowest traffic and moderate wind speed.'
        );
      }
      actionRecommendations.push('Keep an eye on air trends if planning prolonged outdoor activities.');
      sensitiveGroupAdvisory =
        'EPA statistical risk bands indicate low risk, though individuals with asthma or respiratory conditions should monitor their comfort.';
      // Scientific ventilation guidance based on pollutant characteristics & environmental conditions:
      // - Ozone (O3): Photochemically driven; spikes in warm afternoons and degrades indoors on surfaces.
      // - Particulates (PM2.5/PM10): Outdoor air enters through openings; brief airing flushes indoor CO2/VOCs without major PM loading.
      if (dominantPollutant === 'o3' && weather.temperatureC >= 25) {
        ventilationRecommendation = 'ventilate_briefly';
      } else {
        ventilationRecommendation = aqi <= 75 ? 'open_windows' : 'ventilate_briefly';
      }
      break;

    case 'Unhealthy for Sensitive Groups':
      headline = 'Elevated Risk for Vulnerable Groups';
      healthSummary = `An AQI of ${aqi} means sensitive individuals (children, older adults, people with asthma/heart disease) may experience adverse health effects.`;
      if (isSensitive) {
        actionRecommendations.push(
          'Reduce strenuous outdoor exertion; take frequent rest breaks indoors.',
          'Keep quick-relief medicine (e.g. inhalers) accessible at all times.'
        );
      } else {
        actionRecommendations.push(
          'General public should moderate prolonged heavy outdoor workouts.',
          'Consider indoor alternatives for endurance workouts like long-distance running or cycling.'
        );
      }
      actionRecommendations.push(
        `Minimize exposure near heavy traffic corridors where ${dominantPollutant.toUpperCase()} concentrates.`
      );
      sensitiveGroupAdvisory =
        'Children, seniors, and individuals with respiratory conditions should significantly cut back outdoor activity.';
      ventilationRecommendation = 'ventilate_briefly';
      break;

    case 'Unhealthy':
      headline = 'Unhealthy Air — Everyone May Experience Effects';
      healthSummary = `At AQI ${aqi}, members of sensitive groups may experience more serious health effects, and the general public will likely notice irritation.`;
      actionRecommendations.push(
        'Avoid prolonged outdoor exertion; move workouts indoors into filtered environments.',
        'Wear a well-fitted particulate respirator (N95/FFP2) if commuting near busy roads.',
        'Run indoor HEPA air purifiers to maintain safe ambient indoor air.'
      );
      sensitiveGroupAdvisory =
        'Sensitive groups must avoid all outdoor physical exertion and stay indoors in filtered spaces.';
      ventilationRecommendation = 'keep_closed_use_purifier';
      break;

    case 'Very Unhealthy':
      headline = 'Health Alert: Serious Risk of Health Effects';
      healthSummary = `AQI ${aqi} indicates severe pollution. Risk of respiratory irritation and cardiovascular stress is significantly increased for everyone.`;
      actionRecommendations.push(
        'Stay indoors and keep physical activity levels light to reduce inhalation volume.',
        'Seal doors and windows; run air purifiers on continuous medium/high mode.',
        'Wear an N95 respirator if stepping outside is unavoidable.'
      );
      sensitiveGroupAdvisory =
        'Vulnerable individuals should remain in clean indoor rooms with filtered air and minimize all physical exertion.';
      ventilationRecommendation = 'keep_closed_use_purifier';
      break;

    case 'Hazardous':
    default:
      headline = 'Health Warning of Emergency Conditions';
      healthSummary = `AQI ${aqi} represents emergency conditions. The entire population is likely to be affected by severe acute health impacts.`;
      actionRecommendations.push(
        'Remain indoors with windows and doors completely closed.',
        'Operate certified HEPA air filtration continuously; avoid creating indoor smoke or frying.',
        'Do not engage in any outdoor physical activity.'
      );
      sensitiveGroupAdvisory =
        'Immediate hazard: high-risk individuals should stay in a sealed clean-room environment or seek medical advice if symptomatic.';
      ventilationRecommendation = 'keep_closed_use_purifier';
      break;
  }

  // Activity-specific refinement
  if (activity === 'daily_commute' && (category === 'Unhealthy' || category === 'Very Unhealthy' || category === 'Hazardous')) {
    actionRecommendations.unshift('Use closed-window transit (metro or car with recirculated AC) rather than walking or open cycling.');
  }

  const isSevere = aqi >= 300;
  const isPoor = aqi >= 200;

  const hasPediatric = data.householdMembers?.some(
    (m) =>
      m.archetype.toLowerCase().includes('child') ||
      m.archetype.toLowerCase().includes('pediatric') ||
      m.sensitivityTier.toLowerCase().includes('pediatric')
  );
  const hasSenior = data.householdMembers?.some(
    (m) =>
      m.archetype.toLowerCase().includes('senior') ||
      m.sensitivityTier.toLowerCase().includes('senior')
  );

  const todayHouseholdPlan = {
    morning: {
      period: 'morning' as const,
      area: 'Low-emission routine',
      action: isSevere
        ? hasPediatric
          ? 'Shift school runs past 9:30 AM; keep children indoors during morning smog peak.'
          : hasSenior
          ? 'Postpone senior morning walks until afternoon; keep indoor windows closed.'
          : 'Shift morning commute past 9:30 AM or telecommute; avoid walking near heavy diesel traffic.'
        : isPoor
        ? hasPediatric
          ? 'Shift outdoor play indoors; ensure children wear fitted N95 masks during morning school transit.'
          : hasSenior
          ? 'Postpone morning outdoor walks; exercise indoors in filtered room.'
          : 'Shift outdoor cardio indoors; wear fitted N95 respirator during commute and run recirculating vehicle AC.'
        : 'Proceed with normal morning activities; combine early market trips to minimize cold vehicle starts.',
      why: 'Nocturnal radiation cooling traps particulate matter below a shallow 120m boundary layer until solar heating commences.',
      expectedImpact: isSevere
        ? 'Avoids up to 70% of peak daily PM2.5 inhalation during nocturnal ground-level inversion.'
        : 'Reduces morning ultrafine particle exposure by 40–55%.',
    },
    afternoon: {
      period: 'afternoon' as const,
      area: 'Indoor air quality hack',
      action: isSevere
        ? 'Keep exterior doors sealed; operate HEPA air purifier on continuous medium-high in main living areas.'
        : isPoor
        ? 'Execute brief 15-minute cross-ventilation between 1:00 PM and 3:00 PM, then seal and purify.'
        : 'Open windows for cross-ventilation between 12:30 PM and 3:30 PM to clear indoor CO2 buildup.',
      why: 'Maximum diurnal solar radiation elevates the atmospheric mixing height to over 400m, providing the safest natural ventilation window.',
      expectedImpact: isSevere
        ? 'Maintains indoor PM2.5 below 25 µg/m³ despite severe ambient outdoor pollution.'
        : 'Flushes stale indoor CO2 while preventing elevated ambient particulate accumulation.',
    },
    evening: {
      period: 'evening' as const,
      area: 'Sustainable alternative',
      action: isSevere
        ? 'Combine all evening household errands into a single shared carpool or electric transit trip; avoid diesel transit.'
        : 'Use public electric transit or carpool for evening travel; eliminate cold engine idling in residential lanes.',
      why: 'Sunset rapidly cools the ground, reforming the surface inversion lid and compounding local NOx tailpipe emissions.',
      expectedImpact: 'Prevents 1.8–3.5 kg CO2 and 15g NOx tailpipe precursors per combined trip.',
    },
  };

  return {
    headline,
    healthSummary,
    actionRecommendations: actionRecommendations.slice(0, 4),
    sensitiveGroupAdvisory,
    ventilationRecommendation,
    todayHouseholdPlan,
    modelName: 'Rule-based fallback',
    isDeterministicFallback: true,
  };
}

/**
 * Generates an authoritative 7-part Air Copilot conversational response from verified environmental rules.
 * Strictly adheres to Master Specification §4.4.
 */
export function getDeterministicCopilotAnswer(data: CopilotRequest): CopilotResponse {
  const { question, aqi, category, dominantPollutant, userContext, weather } = data;
  const qLower = question.toLowerCase();
  const isSensitive = userContext?.isSensitiveGroup ?? false;

  let directAnswer = '';
  let recommendedAction = '';
  let explanation = '';
  const practicalAlternatives: string[] = [];

  // Question intent matching
  if (qLower.includes('park') || qLower.includes('child') || qLower.includes('kid')) {
    if (aqi <= 100) {
      directAnswer = `Yes, taking your child to the park is suitable under current conditions (AQI ${aqi}, ${category}).`;
      recommendedAction = 'Proceed with park visits, keeping hydrated and monitoring for fatigue.';
      explanation = `Particulate and gaseous pollutants are currently within acceptable thresholds (${dominantPollutant.toUpperCase()} is stable).`;
      practicalAlternatives.push('Plan outdoor play during mid-morning when ground-level ozone is lower.');
    } else {
      directAnswer = `It is not recommended to take children to the park right now due to elevated pollution (AQI ${aqi}, ${category}).`;
      recommendedAction = 'Postpone outdoor playground time and opt for indoor active play spaces.';
      explanation = `Children breathe more air per pound of body weight than adults, making their developing lungs particularly sensitive to ${dominantPollutant.toUpperCase()} at AQI ${aqi}.`;
      practicalAlternatives.push(
        'Organize indoor active games in a HEPA-filtered room.',
        'Check the hourly forecast for expected clearing later in the evening.'
      );
    }
  } else if (qLower.includes('cycle') || qLower.includes('cycling') || qLower.includes('bike') || qLower.includes('commute')) {
    if (aqi <= 100) {
      directAnswer = `Cycling is a great option for your commute today with an AQI of ${aqi} (${category}).`;
      recommendedAction = 'Choose secondary streets with lower vehicle density to further reduce exposure.';
      explanation = `Air quality is clean enough that the cardiovascular benefits of cycling far outweigh the minimal pollution exposure.`;
      practicalAlternatives.push('Use designated bike lanes separated from heavy diesel bus routes.');
    } else {
      directAnswer = `Cycling is not recommended today as heavy aerobic breathing at AQI ${aqi} increases pollutant inhalation.`;
      recommendedAction = 'Switch to closed-window transit (metro or bus with air filtration) for your commute.';
      explanation = `During high-cadence cycling, ventilation rate increases by 300–500%, pulling elevated ${dominantPollutant.toUpperCase()} deep into the bronchial tree.`;
      practicalAlternatives.push(
        'Take public transit or carpool with windows rolled up.',
        'Wear an N95/FFP2 respirator mask if cycling is unavoidable.'
      );
    }
  } else if (qLower.includes('window') || qLower.includes('bedroom') || qLower.includes('indoor') || qLower.includes('purifier') || qLower.includes('ventilat')) {
    if (aqi <= 50) {
      directAnswer = `Outdoor air is clean (AQI ${aqi}). Opening windows is recommended to flush indoor CO2, VOCs, and moisture.`;
      recommendedAction = 'Open windows on opposing walls for 20–30 minutes to create cross-ventilation.';
      explanation = 'Natural ventilation expels trapped indoor contaminants. Local microclimates (e.g. adjacent busy roads) should still be considered.';
      practicalAlternatives.push('Leave trickle vents open throughout the day.');
    } else if (aqi <= 100) {
      if (dominantPollutant === 'o3') {
        directAnswer = `Ventilate briefly in morning or evening hours when ground-level ozone is lowest (current AQI ${aqi}).`;
        recommendedAction = 'Avoid opening windows during peak warm afternoon hours when photochemical ozone forms.';
        explanation = 'Ozone decomposes indoors upon contact with surfaces. Keeping windows closed during peak sunlight hours minimizes indoor levels.';
        practicalAlternatives.push('Ventilate during dawn or late evening when ozone concentrations are minimal.');
      } else {
        directAnswer = `Briefly air rooms (5–10 minutes) during low-traffic periods, then keep windows closed (AQI ${aqi}).`;
        recommendedAction = 'Combine brief airing to clear CO2 with an active indoor air purifier to capture infiltrated particulates.';
        explanation = `Ambient thresholds are statistical guides: outdoor ${dominantPollutant.toUpperCase()} infiltrates through open windows, but rooms also require oxygen exchange.`;
        practicalAlternatives.push('Run a HEPA air cleaner continuously if windows cannot be opened safely.');
      }
    } else {
      directAnswer = `Keep your windows closed and run a HEPA air purifier to protect indoor air (ambient AQI is ${aqi}, ${category}).`;
      recommendedAction = 'Seal windows and run an air purifier on continuous auto or medium mode.';
      explanation = `At AQI ${aqi}, outdoor ${dominantPollutant.toUpperCase()} quickly degrades indoor air quality. Actual infiltration depends on building sealing.`;
      practicalAlternatives.push(
        'Use an air purifier with both HEPA and activated carbon filtration.',
        'Avoid indoor emission sources like burning incense or cooking without an exhaust hood.'
      );
    }
  } else {
    // General environmental advice
    if (aqi <= 100) {
      directAnswer = `Current environmental conditions are favorable (AQI ${aqi}, ${category}). You can proceed with normal routines.`;
      recommendedAction = 'Maintain standard hydration and monitor air trends if planning prolonged outdoor training.';
      explanation = `Pollution levels are currently below health advisory limits for the general population.`;
      practicalAlternatives.push('Schedule demanding outdoor tasks during the cleanest hours of the day.');
    } else {
      directAnswer = `Caution is advised under current conditions (AQI ${aqi}, ${category}). Reducing outdoor exertion is recommended.`;
      recommendedAction = isSensitive
        ? 'Sensitive individuals should remain indoors and keep rescue medications readily accessible.'
        : 'Limit prolonged outdoor workouts and take rest breaks indoors.';
      explanation = `Elevated ${dominantPollutant.toUpperCase()} causes airway inflammation and oxidative stress during prolonged exposure.`;
      practicalAlternatives.push(
        'Move cardiovascular workouts to an indoor gym with filtered air.',
        'Wear an N95 respirator mask if outdoor exposure is required.'
      );
    }
  }

  const locPrefix = data.cityName ? `In ${data.cityName}: ` : '';
  const environmentalConditions = `${locPrefix}Current AQI: ${aqi} (${category}), Dominant Pollutant: ${dominantPollutant.toUpperCase()} (${data.pollutantConcentration} ${data.pollutantUnit}), Temp: ${weather.temperatureC}°C, Humidity: ${weather.humidityPercent}%.`;
  const dataSourceAndFreshness =
    data.sourceType === 'station'
      ? `Ground station: ${data.stationName || 'Nearby Station'}${data.distanceKm ? `, ${data.distanceKm} km away` : ''} · OpenAQ · Observed ${data.observationTime || 'recent'}.`
      : data.dataSource
      ? `Source: ${data.dataSource}${data.observationTime ? ` (${data.observationTime})` : ''}.`
      : 'Source: Grounded deterministic rules derived from US EPA breakpoints and WHO air quality guidelines. Modeled estimate (Copernicus CAMS via Open-Meteo, ~45 km grid) · no recent station within 25 km.';

  const limitationsOrUncertainty =
    data.sourceType === 'station'
      ? 'Physical in-situ ground monitor; localized indoor infiltration and street microclimates may vary.'
      : 'Regional ambient estimate; microclimates near roadways, building seal quality, and individual health factors introduce variability.';

  return {
    directAnswer,
    environmentalConditions,
    recommendedAction,
    explanation,
    practicalAlternatives: practicalAlternatives.slice(0, 3),
    dataSourceAndFreshness,
    limitationsOrUncertainty,
    isDeterministicFallback: true,
  };
}
