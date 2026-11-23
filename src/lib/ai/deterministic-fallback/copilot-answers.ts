import { CopilotRequest, CopilotResponse } from '../types';

interface IntentAdvice {
  directAnswer: string;
  recommendedAction: string;
  explanation: string;
  practicalAlternatives: string[];
}

function resolveParkChildAdvice(aqi: number, category: string, dominantPollutant: string): IntentAdvice {
  if (aqi <= 100) {
    return {
      directAnswer: `Yes, taking your child to the park is suitable under current conditions (AQI ${aqi}, ${category}).`,
      recommendedAction: 'Proceed with park visits, keeping hydrated and monitoring for fatigue.',
      explanation: `Particulate and gaseous pollutants are currently within acceptable thresholds (${dominantPollutant.toUpperCase()} is stable).`,
      practicalAlternatives: ['Plan outdoor play during mid-morning when ground-level ozone is lower.'],
    };
  }
  return {
    directAnswer: `It is not recommended to take children to the park right now due to elevated pollution (AQI ${aqi}, ${category}).`,
    recommendedAction: 'Postpone outdoor playground time and opt for indoor active play spaces.',
    explanation: `Children breathe more air per pound of body weight than adults, making their developing lungs particularly sensitive to ${dominantPollutant.toUpperCase()} at AQI ${aqi}.`,
    practicalAlternatives: [
      'Organize indoor active games in a HEPA-filtered room.',
      'Check the hourly forecast for expected clearing later in the evening.',
    ],
  };
}

function resolveCyclingCommuteAdvice(aqi: number, category: string, dominantPollutant: string): IntentAdvice {
  if (aqi <= 100) {
    return {
      directAnswer: `Cycling is a great option for your commute today with an AQI of ${aqi} (${category}).`,
      recommendedAction: 'Choose secondary streets with lower vehicle density to further reduce exposure.',
      explanation: 'Air quality is clean enough that the cardiovascular benefits of cycling far outweigh the minimal pollution exposure.',
      practicalAlternatives: ['Use designated bike lanes separated from heavy diesel bus routes.'],
    };
  }
  return {
    directAnswer: `Cycling is not recommended today as heavy aerobic breathing at AQI ${aqi} increases pollutant inhalation.`,
    recommendedAction: 'Switch to closed-window transit (metro or bus with air filtration) for your commute.',
    explanation: `During high-cadence cycling, ventilation rate increases by 300–500%, pulling elevated ${dominantPollutant.toUpperCase()} deep into the bronchial tree.`,
    practicalAlternatives: [
      'Take public transit or carpool with windows rolled up.',
      'Wear an N95/FFP2 respirator mask if cycling is unavoidable.',
    ],
  };
}

function resolveVentilationAdvice(aqi: number, category: string, dominantPollutant: string): IntentAdvice {
  if (aqi <= 50) {
    return {
      directAnswer: `Outdoor air is clean (AQI ${aqi}). Opening windows is recommended to flush indoor CO2, VOCs, and moisture.`,
      recommendedAction: 'Open windows on opposing walls for 20–30 minutes to create cross-ventilation.',
      explanation: 'Natural ventilation expels trapped indoor contaminants. Local microclimates (e.g. adjacent busy roads) should still be considered.',
      practicalAlternatives: ['Leave trickle vents open throughout the day.'],
    };
  }
  if (aqi <= 100) {
    if (dominantPollutant === 'o3') {
      return {
        directAnswer: `Ventilate briefly in morning or evening hours when ground-level ozone is lowest (current AQI ${aqi}).`,
        recommendedAction: 'Avoid opening windows during peak warm afternoon hours when photochemical ozone forms.',
        explanation: 'Ozone decomposes indoors upon contact with surfaces. Keeping windows closed during peak sunlight hours minimizes indoor levels.',
        practicalAlternatives: ['Ventilate during dawn or late evening when ozone concentrations are minimal.'],
      };
    }
    return {
      directAnswer: `Briefly air rooms (5–10 minutes) during low-traffic periods, then keep windows closed (AQI ${aqi}).`,
      recommendedAction: 'Combine brief airing to clear CO2 with an active indoor air purifier to capture infiltrated particulates.',
      explanation: `Ambient thresholds are statistical guides: outdoor ${dominantPollutant.toUpperCase()} infiltrates through open windows, but rooms also require oxygen exchange.`,
      practicalAlternatives: ['Run a HEPA air cleaner continuously if windows cannot be opened safely.'],
    };
  }
  return {
    directAnswer: `Keep your windows closed and run a HEPA air purifier to protect indoor air (ambient AQI is ${aqi}, ${category}).`,
    recommendedAction: 'Seal windows and run an air purifier on continuous auto or medium mode.',
    explanation: `At AQI ${aqi}, outdoor ${dominantPollutant.toUpperCase()} quickly degrades indoor air quality. Actual infiltration depends on building sealing.`,
    practicalAlternatives: [
      'Use an air purifier with both HEPA and activated carbon filtration.',
      'Avoid indoor emission sources like burning incense or cooking without an exhaust hood.',
    ],
  };
}

function resolveGeneralAdvice(aqi: number, category: string, dominantPollutant: string, isSensitive: boolean): IntentAdvice {
  if (aqi <= 100) {
    return {
      directAnswer: `Current environmental conditions are favorable (AQI ${aqi}, ${category}). You can proceed with normal routines.`,
      recommendedAction: 'Maintain standard hydration and monitor air trends if planning prolonged outdoor training.',
      explanation: 'Pollution levels are currently below health advisory limits for the general population.',
      practicalAlternatives: ['Schedule demanding outdoor tasks during the cleanest hours of the day.'],
    };
  }
  return {
    directAnswer: `Caution is advised under current conditions (AQI ${aqi}, ${category}). Reducing outdoor exertion is recommended.`,
    recommendedAction: isSensitive
      ? 'Sensitive individuals should remain indoors and keep rescue medications readily accessible.'
      : 'Limit prolonged outdoor workouts and take rest breaks indoors.',
    explanation: `Elevated ${dominantPollutant.toUpperCase()} causes airway inflammation and oxidative stress during prolonged exposure.`,
    practicalAlternatives: [
      'Move cardiovascular workouts to an indoor gym with filtered air.',
      'Wear an N95 respirator mask if outdoor exposure is required.',
    ],
  };
}

export function getDeterministicCopilotAnswer(data: CopilotRequest): CopilotResponse {
  const { question, aqi, category, dominantPollutant, userContext, weather } = data;
  const qLower = question.toLowerCase();
  const isSensitive = userContext?.isSensitiveGroup ?? false;

  let advice: IntentAdvice;
  if (qLower.includes('park') || qLower.includes('child') || qLower.includes('kid')) {
    advice = resolveParkChildAdvice(aqi, category, dominantPollutant);
  } else if (qLower.includes('cycle') || qLower.includes('cycling') || qLower.includes('bike') || qLower.includes('commute')) {
    advice = resolveCyclingCommuteAdvice(aqi, category, dominantPollutant);
  } else if (qLower.includes('window') || qLower.includes('bedroom') || qLower.includes('indoor') || qLower.includes('purifier') || qLower.includes('ventilat')) {
    advice = resolveVentilationAdvice(aqi, category, dominantPollutant);
  } else {
    advice = resolveGeneralAdvice(aqi, category, dominantPollutant, isSensitive);
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
    directAnswer: advice.directAnswer,
    environmentalConditions,
    recommendedAction: advice.recommendedAction,
    explanation: advice.explanation,
    practicalAlternatives: advice.practicalAlternatives.slice(0, 3),
    dataSourceAndFreshness,
    limitationsOrUncertainty,
    isDeterministicFallback: true,
  };
}
