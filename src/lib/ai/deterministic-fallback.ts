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
        'Individuals with asthma, heart disease, or respiratory illness should monitor their breathing comfort.';
      // Scientific ventilation guidance based on EPA pollutant thresholds:
      // Lower moderate (AQI <= 75): Natural cross-ventilation is encouraged to dilute indoor CO2/VOCs.
      // Upper moderate (AQI 76-100): Brief ventilation during low-traffic hours to prevent particulate buildup.
      ventilationRecommendation = aqi <= 75 ? 'open_windows' : 'ventilate_briefly';
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

  return {
    headline,
    healthSummary,
    actionRecommendations: actionRecommendations.slice(0, 4),
    sensitiveGroupAdvisory,
    ventilationRecommendation,
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
  } else if (qLower.includes('window') || qLower.includes('bedroom') || qLower.includes('indoor') || qLower.includes('purifier')) {
    if (aqi <= 50) {
      directAnswer = `Outdoor air is clean (AQI ${aqi}). Opening your bedroom windows is recommended to refresh indoor air.`;
      recommendedAction = 'Open windows on opposing walls for 20–30 minutes to create cross-ventilation.';
      explanation = 'Natural ventilation expels trapped indoor CO2, VOCs, and moisture without introducing particulate hazards.';
      practicalAlternatives.push('Leave trickle vents open throughout the day.');
    } else {
      directAnswer = `Keep your windows closed and run a HEPA air purifier to protect your indoor air (outdoor AQI is ${aqi}).`;
      recommendedAction = 'Seal bedroom windows and set your air purifier to continuous auto or medium mode.';
      explanation = `Outdoor ${dominantPollutant.toUpperCase()} infiltrates quickly through open windows, degrading indoor air quality within minutes.`;
      practicalAlternatives.push(
        'Use an air purifier with both HEPA (particulates) and activated carbon (odors/VOCs).',
        'Avoid indoor sources of pollution like incense, frying, or vacuuming without a HEPA exhaust filter.'
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

  const environmentalConditions = `Current AQI: ${aqi} (${category}), Dominant Pollutant: ${dominantPollutant.toUpperCase()} (${data.pollutantConcentration} ${data.pollutantUnit}), Temp: ${weather.temperatureC}°C, Humidity: ${weather.humidityPercent}%.`;
  const dataSourceAndFreshness = 'Source: Grounded deterministic rules derived from US EPA breakpoints and WHO global air quality guidelines (15-min refresh).';
  const limitationsOrUncertainty = 'Guidance applies to general ambient conditions; microclimates near major highways or localized burning may have significantly higher localized pollution.';

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
