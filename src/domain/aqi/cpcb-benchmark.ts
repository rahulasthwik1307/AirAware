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

export interface CpcbAqiResult {
  readonly aqi: number | null;
  readonly category: CpcbCategory;
  readonly aqiRange: string;
  readonly concentrationRange: string;
  readonly colorToken: string;
  readonly bgToken: string;
  readonly methodologyNote: string;
  readonly indexLabel?: string;
  readonly dominantSubIndexPollutant?: 'PM2.5' | 'PM10' | null;
}

/**
 * Calculates official Indian CPCB PM2.5 sub-index using linear piecewise breakpoint interpolation.
 * @param pm25 - 24-hour PM2.5 concentration in µg/m³.
 * @returns Numerical sub-index (0–500) or null if data is missing or negative. Never returns numbers exceeding 500.
 */
export function calculateCpcbPm25SubIndex(pm25: number | null | undefined): number | null {
  if (pm25 === null || pm25 === undefined || !Number.isFinite(pm25) || pm25 < 0) {
    return null;
  }
  if (pm25 <= 30) {
    return Math.round((50 / 30) * pm25);
  }
  if (pm25 <= 60) {
    return Math.round(50 + ((100 - 50) / (60 - 30)) * (pm25 - 30));
  }
  if (pm25 <= 90) {
    return Math.round(100 + ((200 - 100) / (90 - 60)) * (pm25 - 60));
  }
  if (pm25 <= 120) {
    return Math.round(200 + ((300 - 200) / (120 - 90)) * (pm25 - 90));
  }
  if (pm25 <= 250) {
    return Math.round(300 + ((400 - 300) / (250 - 120)) * (pm25 - 120));
  }
  return Math.min(500, Math.round(400 + ((500 - 400) / (380 - 250)) * (pm25 - 250)));
}

/**
 * Calculates official Indian CPCB PM10 sub-index using linear piecewise breakpoint interpolation.
 * @param pm10 - 24-hour PM10 concentration in µg/m³.
 * @returns Numerical sub-index (0–500) or null if data is missing or negative. Never returns numbers exceeding 500.
 */
export function calculateCpcbPm10SubIndex(pm10: number | null | undefined): number | null {
  if (pm10 === null || pm10 === undefined || !Number.isFinite(pm10) || pm10 < 0) {
    return null;
  }
  if (pm10 <= 50) {
    return Math.round(pm10);
  }
  if (pm10 <= 100) {
    return Math.round(pm10);
  }
  if (pm10 <= 250) {
    return Math.round(100 + ((200 - 100) / (250 - 100)) * (pm10 - 100));
  }
  if (pm10 <= 350) {
    return Math.round(200 + ((300 - 200) / (350 - 250)) * (pm10 - 250));
  }
  if (pm10 <= 430) {
    return Math.round(300 + ((400 - 300) / (430 - 350)) * (pm10 - 350));
  }
  return Math.min(500, Math.round(400 + ((500 - 400) / (500 - 430)) * (pm10 - 430)));
}

/**
 * Calculates composite Indian CPCB NAQI from particulate sub-indices (max sub-index rule).
 * @param pm25 - PM2.5 concentration in µg/m³.
 * @param pm10 - Optional PM10 concentration in µg/m³.
 * @param isStationData - Whether the reading originated from a physical CAAQMS monitor.
 * @returns Composite CpcbAqiResult with category, range, and provenance note. Never invents missing readings.
 */
export function calculateCompositeCpcbAqi(
  pm25: number | null | undefined,
  pm10?: number | null | undefined,
  isStationData = false
): CpcbAqiResult {
  const pm25Sub = calculateCpcbPm25SubIndex(pm25);
  const pm10Sub = calculateCpcbPm10SubIndex(pm10);

  if (isStationData) {
    let finalAqi: number | null = null;
    let dominant: 'PM2.5' | 'PM10' | null = null;

    if (pm25Sub !== null && pm10Sub !== null) {
      if (pm25Sub >= pm10Sub) {
        finalAqi = pm25Sub;
        dominant = 'PM2.5';
      } else {
        finalAqi = pm10Sub;
        dominant = 'PM10';
      }
    } else if (pm25Sub !== null) {
      finalAqi = pm25Sub;
      dominant = 'PM2.5';
    } else if (pm10Sub !== null) {
      finalAqi = pm10Sub;
      dominant = 'PM10';
    }

    if (finalAqi === null) {
      return {
        aqi: null,
        category: 'Unavailable',
        aqiRange: 'N/A',
        concentrationRange: 'Data not reported',
        colorToken: 'var(--ink-muted)',
        bgToken: '#F1F5F9',
        methodologyNote: 'In-situ ground station: PM2.5/PM10 concentrations unavailable for index calculation.',
        indexLabel: 'CPCB AQI (PM2.5/PM10 sub-index)',
        dominantSubIndexPollutant: null,
      };
    }

    const { category, aqiRange, colorToken, bgToken } = getCpcbCategoryDetailsFromAqi(finalAqi);
    const hasBothStationPollutants = pm25Sub !== null && pm10Sub !== null;
    const stationIndexLabel = hasBothStationPollutants
      ? 'CPCB AQI (PM2.5/PM10 sub-index)'
      : pm10Sub !== null
      ? 'PM10 sub-index only'
      : 'PM2.5 sub-index only';

    return {
      aqi: finalAqi,
      category,
      aqiRange,
      concentrationRange: `PM2.5: ${pm25 ?? 'N/A'}, PM10: ${pm10 ?? 'N/A'} μg/m³`,
      colorToken,
      bgToken,
      methodologyNote: `In-situ ground monitor composite CPCB AQI determined from maximum sub-index (dominant: ${dominant}).`,
      indexLabel: stationIndexLabel,
      dominantSubIndexPollutant: dominant,
    };
  }

  // CAMS fallback: PM2.5 sub-index modeled
  if (pm25Sub === null) {
    return {
      aqi: null,
      category: 'Unavailable',
      aqiRange: 'N/A',
      concentrationRange: 'Data not reported',
      colorToken: 'var(--ink-muted)',
      bgToken: '#F1F5F9',
      methodologyNote: 'Single-pollutant PM2.5 benchmark: Concentration unavailable for reference comparison.',
      indexLabel: pm10Sub !== null ? 'PM10 sub-index only' : 'PM2.5 sub-index only',
      dominantSubIndexPollutant: null,
    };
  }

  const { category, aqiRange, colorToken, bgToken } = getCpcbCategoryDetailsFromAqi(pm25Sub);
  return {
    aqi: pm25Sub,
    category,
    aqiRange,
    concentrationRange: `${pm25} μg/m³`,
    colorToken,
    bgToken,
    methodologyNote: `Single-pollutant PM2.5 benchmark: Current concentration falls within India CPCB NAQI "${category}" range.`,
    indexLabel: 'PM2.5 sub-index, modeled',
    dominantSubIndexPollutant: 'PM2.5',
  };
}

/**
 * Resolves CPCB NAQI category, display range, and color/background tokens for an AQI value.
 */
export function getCpcbCategoryDetailsFromAqi(aqi: number) {
  if (aqi <= 50) {
    return { category: 'Good' as CpcbCategory, aqiRange: '0–50', colorToken: '#047857', bgToken: '#ECFDF5' };
  }
  if (aqi <= 100) {
    return { category: 'Satisfactory' as CpcbCategory, aqiRange: '51–100', colorToken: '#4d7c0f', bgToken: '#F7FEE7' };
  }
  if (aqi <= 200) {
    return { category: 'Moderate' as CpcbCategory, aqiRange: '101–200', colorToken: '#92400E', bgToken: '#FFFBEB' };
  }
  if (aqi <= 300) {
    return { category: 'Poor' as CpcbCategory, aqiRange: '201–300', colorToken: '#EA580C', bgToken: '#FFF7ED' };
  }
  if (aqi <= 400) {
    return { category: 'Very Poor' as CpcbCategory, aqiRange: '301–400', colorToken: '#DC2626', bgToken: '#FEF2F2' };
  }
  return { category: 'Severe' as CpcbCategory, aqiRange: '401–500', colorToken: '#7F1D1D', bgToken: '#450A0A' };
}

/**
 * Calculates single-pollutant CPCB AQI from PM2.5 concentration.
 */
export function calculateCpcbAqi(pm25: number | null | undefined): CpcbAqiResult {
  return calculateCompositeCpcbAqi(pm25, null, false);
}

/**
 * Classifies a PM2.5 concentration against CPCB NAQI threshold bands.
 */
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
      colorToken: '#4d7c0f',
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
