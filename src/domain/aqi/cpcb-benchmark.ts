/**
 * India CPCB NAQI Regulatory Engine
 * Official Central Pollution Control Board (CPCB) National Air Quality Index (NAQI)
 * breakpoints and single-pollutant PM2.5 benchmark resolver for the Indian subcontinent.
 *
 * Official CPCB Breakpoints (24-hour arithmetic average in µg/m³):
 * Category      | AQI Range | PM2.5 (µg/m³) | PM10 (µg/m³)
 * Good          | 0–50      | 0–30          | 0–50
 * Satisfactory  | 51–100    | 31–60         | 51–100
 * Moderate      | 101–200   | 61–90         | 101–250
 * Poor          | 201–300   | 91–120        | 251–350
 * Very Poor     | 301–400   | 121–250       | 351–430
 * Severe        | 401–500   | > 250         | > 430
 */

export type CpcbCategory =
  | 'Good'
  | 'Satisfactory'
  | 'Moderate'
  | 'Poor'
  | 'Very Poor'
  | 'Severe'
  | 'Unavailable';

export interface CpcbPm25Classification {
  readonly category: CpcbCategory;
  readonly aqiRange: string;
  readonly concentrationRange: string;
  readonly colorToken: string;
  readonly methodologyNote: string;
}

export function classifyCpcbPm25(
  concentration: number | null | undefined
): CpcbPm25Classification {
  if (
    concentration === null ||
    concentration === undefined ||
    !Number.isFinite(concentration) ||
    concentration < 0
  ) {
    return {
      category: 'Unavailable',
      aqiRange: 'N/A',
      concentrationRange: 'Data not reported',
      colorToken: 'var(--ink-muted)',
      methodologyNote:
        'Single-pollutant PM2.5 benchmark: Concentration unavailable for reference comparison.',
    };
  }

  if (concentration <= 30) {
    return {
      category: 'Good',
      aqiRange: '0–50',
      concentrationRange: '0–30 μg/m³',
      colorToken: 'var(--aqi-good)',
      methodologyNote:
        'Single-pollutant PM2.5 benchmark: Current concentration falls within India CPCB NAQI "Good" range (0–30 μg/m³, AQI 0–50). Unlike US EPA which evaluates modelled 24-hour rolling averages, official CPCB AQI requires 24-hour arithmetic averaging across ≥3 criteria pollutants at physical CAAQMS stations.',
    };
  }

  if (concentration <= 60) {
    return {
      category: 'Satisfactory',
      aqiRange: '51–100',
      concentrationRange: '31–60 μg/m³',
      colorToken: '#84cc16',
      methodologyNote:
        'Single-pollutant PM2.5 benchmark: Current concentration falls within India CPCB NAQI "Satisfactory" range (31–60 μg/m³, AQI 51–100). For comparison, US EPA classifies >35.4 μg/m³ as Unhealthy for Sensitive Groups (>100). Official composite CPCB AQI requires ≥3 pollutants at physical CAAQMS stations and is not claimed here.',
    };
  }

  if (concentration <= 90) {
    return {
      category: 'Moderate',
      aqiRange: '101–200',
      concentrationRange: '61–90 μg/m³',
      colorToken: 'var(--aqi-moderate)',
      methodologyNote:
        'Single-pollutant PM2.5 benchmark: Current concentration falls within India CPCB NAQI "Moderate" range (61–90 μg/m³, AQI 101–200). Official composite CPCB AQI requires physical ground monitors (CAAQMS) and is not claimed here.',
    };
  }

  if (concentration <= 120) {
    return {
      category: 'Poor',
      aqiRange: '201–300',
      concentrationRange: '91–120 μg/m³',
      colorToken: 'var(--aqi-sensitive)',
      methodologyNote:
        'Single-pollutant PM2.5 benchmark: Current concentration falls within India CPCB NAQI "Poor" range (91–120 μg/m³, AQI 201–300). Reflects regional CAMS numerical simulation; in-situ station monitors may record higher localized smoke or traffic plume peaks.',
    };
  }

  if (concentration <= 250) {
    return {
      category: 'Very Poor',
      aqiRange: '301–400',
      concentrationRange: '121–250 μg/m³',
      colorToken: 'var(--aqi-unhealthy)',
      methodologyNote:
        'Single-pollutant PM2.5 benchmark: Current concentration falls within India CPCB NAQI "Very Poor" range (121–250 μg/m³, AQI 301–400). Reflects high regional particulate concentrations under CAMS atmospheric transport models.',
    };
  }

  return {
    category: 'Severe',
    aqiRange: '401–500',
    concentrationRange: '> 250 μg/m³',
    colorToken: 'var(--aqi-hazardous)',
    methodologyNote:
      'Single-pollutant PM2.5 benchmark: Current concentration exceeds India CPCB NAQI "Severe" threshold (>250 μg/m³, AQI 401–500). Reflects severe regional aerosol accumulation in numerical models.',
  };
}
