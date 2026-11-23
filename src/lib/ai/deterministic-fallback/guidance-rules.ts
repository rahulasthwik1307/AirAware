import { GuidanceRequest, VentilationAdvice } from '../types';

export interface TierGuidanceResult {
  headline: string;
  healthSummary: string;
  actionRecommendations: string[];
  sensitiveGroupAdvisory: string;
  ventilationRecommendation: VentilationAdvice;
}

export function evaluateTierGuidance(data: GuidanceRequest): TierGuidanceResult {
  const { aqi, category, dominantPollutant, weather, userContext } = data;
  const isSensitive = userContext.isSensitiveGroup;
  const actionRecommendations: string[] = [];

  switch (category) {
    case 'Good':
      return {
        headline: 'Air Quality is Satisfactory',
        healthSummary: `Air pollution poses little or no risk with an AQI of ${aqi}. Outdoor physical activities are encouraged for all groups.`,
        actionRecommendations: [
          'Enjoy outdoor exercise and daily activities without restriction.',
          'Open windows and natural vents to refresh indoor air with clean outdoor air.',
        ],
        sensitiveGroupAdvisory: 'No special health precautions are necessary for sensitive individuals.',
        ventilationRecommendation: 'open_windows',
      };

    case 'Satisfactory':
      if (isSensitive) {
        actionRecommendations.push(
          'Sensitive members should monitor comfort during prolonged outdoor activities.',
          'Consider indoor alternatives if symptoms like throat irritation appear.'
        );
      } else {
        actionRecommendations.push(
          'Healthy individuals can proceed with normal outdoor routines.',
          'Ventilate rooms during periods of moderate wind and lower traffic.'
        );
      }
      actionRecommendations.push('Keep an eye on diurnal trends if planning extended outdoor workouts.');
      return {
        headline: 'Air Quality is Satisfactory',
        healthSummary: `AQI is ${aqi} (Satisfactory, CPCB NAQI). Air quality is generally acceptable, though sensitive individuals may experience minor breathing discomfort on prolonged exertion.`,
        actionRecommendations,
        sensitiveGroupAdvisory:
          'Sensitive individuals (pediatric, senior, asthmatic) should observe personal comfort during prolonged exertion.',
        ventilationRecommendation: 'open_windows',
      };

    case 'Moderate': {
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

      let ventilation: VentilationAdvice = aqi <= 75 ? 'open_windows' : 'ventilate_briefly';
      if (dominantPollutant === 'o3' && weather.temperatureC >= 25) {
        ventilation = 'ventilate_briefly';
      }

      return {
        headline: 'Acceptable Air Quality with Minor Cautions',
        healthSummary: `Air quality is acceptable (AQI ${aqi}). However, unusually sensitive individuals should watch for symptoms like coughing or shortness of breath.`,
        actionRecommendations,
        sensitiveGroupAdvisory:
          'People with respiratory or cardiac conditions should observe comfort during outdoor exertion.',
        ventilationRecommendation: ventilation,
      };
    }

    case 'Poor':
      return {
        headline: 'Poor Air Quality — Breathing Discomfort on Exposure',
        healthSummary: `AQI is ${aqi} (Poor, CPCB NAQI). Breathing discomfort may occur to most people on prolonged exposure, with pronounced impacts on vulnerable individuals.`,
        actionRecommendations: [
          'Reduce prolonged strenuous outdoor physical activity, especially during morning traffic peaks.',
          'Keep windows closed during inversion hours and run certified HEPA purifiers in occupied rooms.',
          'Wear an N95 respirator if commuting in congested traffic corridors.',
        ],
        sensitiveGroupAdvisory:
          'People with lung disease, asthma, or heart disease should avoid prolonged outdoor exertion.',
        ventilationRecommendation: 'ventilate_briefly',
      };

    case 'Unhealthy for Sensitive Groups':
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
      return {
        headline: 'Elevated Risk for Vulnerable Groups',
        healthSummary: `An AQI of ${aqi} means sensitive individuals (children, older adults, people with asthma/heart disease) may experience adverse health effects.`,
        actionRecommendations,
        sensitiveGroupAdvisory:
          'Children, seniors, and individuals with respiratory conditions should significantly cut back outdoor activity.',
        ventilationRecommendation: 'ventilate_briefly',
      };

    case 'Unhealthy':
      return {
        headline: 'Unhealthy Air — Everyone May Experience Effects',
        healthSummary: `At AQI ${aqi}, members of sensitive groups may experience more serious health effects, and the general public will likely notice irritation.`,
        actionRecommendations: [
          'Avoid prolonged outdoor exertion; move workouts indoors into filtered environments.',
          'Wear a well-fitted particulate respirator (N95/FFP2) if commuting near busy roads.',
          'Run indoor HEPA air purifiers to maintain safe ambient indoor air.',
        ],
        sensitiveGroupAdvisory:
          'Sensitive groups must avoid all outdoor physical exertion and stay indoors in filtered spaces.',
        ventilationRecommendation: 'keep_closed_use_purifier',
      };

    case 'Very Poor':
      return {
        headline: 'Very Poor Air — High Risk of Respiratory Illness',
        healthSummary: `AQI is ${aqi} (Very Poor, CPCB NAQI). Prolonged exposure causes respiratory illness and puts acute stress on cardiovascular function.`,
        actionRecommendations: [
          'Avoid morning runs and strenuous outdoor activities; shift all exercise indoors.',
          'Keep windows sealed; operate HEPA air purification continuously on medium or high speed.',
          'Wear a certified N95 respirator for any unavoidable outdoor travel.',
        ],
        sensitiveGroupAdvisory:
          'Vulnerable members (pediatric, senior, asthmatic) must strictly avoid outdoor exposure.',
        ventilationRecommendation: 'keep_closed_use_purifier',
      };

    case 'Very Unhealthy':
      return {
        headline: 'Health Alert: Serious Risk of Health Effects',
        healthSummary: `AQI ${aqi} indicates severe pollution. Risk of respiratory irritation and cardiovascular stress is significantly increased for everyone.`,
        actionRecommendations: [
          'Stay indoors and keep physical activity levels light to reduce inhalation volume.',
          'Seal doors and windows; run air purifiers on continuous medium/high mode.',
          'Wear an N95 respirator if stepping outside is unavoidable.',
        ],
        sensitiveGroupAdvisory:
          'Vulnerable individuals should remain in clean indoor rooms with filtered air and minimize all physical exertion.',
        ventilationRecommendation: 'keep_closed_use_purifier',
      };

    case 'Severe':
    case 'Hazardous':
    default:
      return {
        headline:
          category === 'Severe'
            ? 'Severe Smog Emergency — CPCB Critical Warning'
            : 'Health Warning of Emergency Conditions',
        healthSummary: `AQI ${aqi} represents severe/emergency conditions. Even healthy individuals are likely to be affected, with severe acute impacts on vulnerable populations.`,
        actionRecommendations: [
          'Remain indoors with windows and doors completely closed.',
          'Operate certified HEPA air filtration continuously; avoid creating indoor smoke or frying.',
          'Do not engage in any outdoor physical activity.',
        ],
        sensitiveGroupAdvisory:
          'Immediate hazard: high-risk individuals should stay in a sealed clean-room environment or seek medical advice if symptomatic.',
        ventilationRecommendation: 'keep_closed_use_purifier',
      };
  }
}
