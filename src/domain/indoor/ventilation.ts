import { VentilationHourlyPoint, VentilationFactor, VentilationSuitability } from './types';

export interface RawHourlyDataPoint {
  readonly time: string;
  readonly pm25?: number;
  readonly pm10?: number;
  readonly ozone?: number;
  readonly no2?: number;
  readonly temperatureC?: number;
  readonly humidityPercent?: number;
}

function evaluatePm25Factor(pm25: number): VentilationFactor {
  if (pm25 <= 25) {
    return {
      name: 'Particulates (PM2.5)',
      value: `${Math.round(pm25)} µg/m³`,
      status: 'good',
      consideration: 'Low outdoor ambient particulate concentration.',
    };
  }
  if (pm25 <= 60) {
    return {
      name: 'Particulates (PM2.5)',
      value: `${Math.round(pm25)} µg/m³`,
      status: 'moderate',
      consideration: 'Moderate ambient loading; brief 10–15 min airing recommended.',
    };
  }
  return {
    name: 'Particulates (PM2.5)',
    value: `${Math.round(pm25)} µg/m³`,
    status: 'caution',
    consideration: 'Elevated outdoor smog; natural infiltration increases indoor PM.',
  };
}

function evaluateOzoneFactor(ozone?: number): VentilationFactor | null {
  if (typeof ozone !== 'number') return null;
  if (ozone > 100) {
    return {
      name: 'Ozone (O3)',
      value: `${Math.round(ozone)} µg/m³`,
      status: 'caution',
      consideration: 'Warm afternoon photochemical ozone peak; ozone degrades indoors on surfaces.',
    };
  }
  return {
    name: 'Ozone (O3)',
    value: `${Math.round(ozone)} µg/m³`,
    status: 'good',
    consideration: 'Ozone within acceptable background levels.',
  };
}

function evaluateHumidityFactor(humidity?: number): VentilationFactor | null {
  if (typeof humidity !== 'number') return null;
  if (humidity > 80) {
    return {
      name: 'Relative Humidity',
      value: `${Math.round(humidity)}%`,
      status: 'caution',
      consideration: 'High dampness outside; extended airing may increase indoor mold risk.',
    };
  }
  return {
    name: 'Relative Humidity',
    value: `${Math.round(humidity)}%`,
    status: 'good',
    consideration: 'Comfortable indoor humidity transfer range.',
  };
}

function resolveSuitability(pm25: number, factors: readonly VentilationFactor[]): { suitability: VentilationSuitability; summary: string } {
  const hasCaution = factors.some((f) => f.status === 'caution');
  const allGood = factors.length > 0 && factors.every((f) => f.status === 'good');

  if (allGood && pm25 <= 35) {
    return {
      suitability: 'FAVORABLE',
      summary: 'Outdoor air is favorable. Favorable window for full room air exchange to purge indoor CO2 and moisture.',
    };
  }
  if (pm25 <= 75 && !hasCaution) {
    return {
      suitability: 'MODERATE',
      summary: 'Moderate conditions. Consider a brief 5–10 minute airing if indoor air feels stuffy, then run filtration.',
    };
  }
  return {
    suitability: 'CAUTION',
    summary: 'Elevated outdoor pollution. Keep windows closed and rely on indoor HEPA filtration.',
  };
}

export function evaluateVentilationPoint(data: RawHourlyDataPoint): VentilationHourlyPoint {
  const timeStr = data.time.includes('T') ? data.time.split('T')[1].slice(0, 5) : data.time.slice(0, 5);
  const pm25 = data.pm25 ?? 0;
  const factors: VentilationFactor[] = [evaluatePm25Factor(pm25)];

  const ozoneFactor = evaluateOzoneFactor(data.ozone);
  if (ozoneFactor) factors.push(ozoneFactor);

  const humidityFactor = evaluateHumidityFactor(data.humidityPercent);
  if (humidityFactor) factors.push(humidityFactor);

  const { suitability, summary } = resolveSuitability(pm25, factors);

  return {
    hour: timeStr,
    timestamp: data.time,
    suitability,
    pm25Concentration: pm25,
    ozoneConcentration: data.ozone,
    temperatureC: data.temperatureC,
    humidityPercent: data.humidityPercent,
    summary,
    factors,
  };
}

export function evaluateVentilationCurve(hourlyList: readonly RawHourlyDataPoint[]): readonly VentilationHourlyPoint[] {
  if (!hourlyList || hourlyList.length === 0) {
    return [];
  }
  return hourlyList.slice(0, 24).map(evaluateVentilationPoint);
}
