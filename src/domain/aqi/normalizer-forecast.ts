import { ForecastPoint, HistoricalAirshedPoint, AqiStandardKey } from '../types';
import { getEaqiTierFromValue } from './european-aqi';
import { getEpaTierFromValue } from './epa-aqi';
import type { RawOpenMeteoAirQualityResponse } from './normalizer';

export function buildForecastTimeline(
  hourly: RawOpenMeteoAirQualityResponse['hourly'] | undefined,
  currentTimeStr: string,
  activeStandard: AqiStandardKey
): ForecastPoint[] {
  const forecast: ForecastPoint[] = [];
  if (!hourly || !Array.isArray(hourly.time)) {
    return forecast;
  }

  let startIndex = hourly.time.findIndex((t) => t >= currentTimeStr);
  if (startIndex === -1) startIndex = 0;

  const pointsToTake = Math.min(24, hourly.time.length - startIndex);

  for (let i = startIndex; i < startIndex + pointsToTake; i++) {
    const timeStr = hourly.time[i];
    const usAqi = hourly.us_aqi ? hourly.us_aqi[i] ?? null : null;
    const europeanAqi = hourly.european_aqi ? hourly.european_aqi[i] ?? null : null;

    const activeAqi = activeStandard === 'EUROPEAN_EAQI' ? europeanAqi : usAqi;
    const pointTier =
      activeStandard === 'EUROPEAN_EAQI'
        ? getEaqiTierFromValue(activeAqi)
        : getEpaTierFromValue(activeAqi);

    const displayTime = timeStr.includes('T') ? timeStr.split('T')[1].slice(0, 5) : timeStr;
    const isCurrentHour = i === startIndex || timeStr === currentTimeStr;
    const pm25 = hourly.pm2_5 ? hourly.pm2_5[i] ?? null : null;
    const pm10 = hourly.pm10 ? hourly.pm10[i] ?? null : null;

    forecast.push({
      time: timeStr,
      displayTime,
      usAqi,
      europeanAqi,
      activeAqi,
      tier: pointTier,
      isCurrentHour,
      pm25,
      pm10,
    });
  }

  return forecast;
}

export function deriveHistoricalTrend(
  hourly: RawOpenMeteoAirQualityResponse['hourly'] | undefined,
  activeStandard: AqiStandardKey = 'US_EPA'
): readonly HistoricalAirshedPoint[] {
  if (!hourly || !hourly.time || hourly.time.length === 0) {
    return [];
  }

  const dayGroups = new Map<string, { aqiList: number[]; pm25List: number[]; noxList: number[] }>();
  const todayStr = new Date().toISOString().split('T')[0];

  for (let i = 0; i < hourly.time.length; i++) {
    const timeStr = hourly.time[i];
    const dateStr = timeStr.includes('T') ? timeStr.split('T')[0] : timeStr.slice(0, 10);
    if (dateStr > todayStr) continue;

    if (!dayGroups.has(dateStr)) {
      dayGroups.set(dateStr, { aqiList: [], pm25List: [], noxList: [] });
    }

    const group = dayGroups.get(dateStr)!;
    const aqiVal =
      activeStandard === 'EUROPEAN_EAQI'
        ? (hourly.european_aqi ? hourly.european_aqi[i] : null)
        : (hourly.us_aqi ? hourly.us_aqi[i] : null);

    if (aqiVal !== null && aqiVal !== undefined && Number.isFinite(aqiVal)) {
      group.aqiList.push(aqiVal);
    }
    const pm25Val = hourly.pm2_5 ? hourly.pm2_5[i] : null;
    if (pm25Val !== null && pm25Val !== undefined && Number.isFinite(pm25Val)) {
      group.pm25List.push(pm25Val);
    }
    const noxVal = hourly.nitrogen_dioxide ? hourly.nitrogen_dioxide[i] : null;
    if (noxVal !== null && noxVal !== undefined && Number.isFinite(noxVal)) {
      group.noxList.push(noxVal);
    }
  }

  const sortedDates = Array.from(dayGroups.keys()).sort();
  const recentDates = sortedDates.slice(-7);
  const points: HistoricalAirshedPoint[] = [];

  for (const date of recentDates) {
    const data = dayGroups.get(date)!;
    if (data.aqiList.length === 0 && data.pm25List.length === 0) continue;

    const meanAqi =
      data.aqiList.length > 0
        ? Math.round(data.aqiList.reduce((a, b) => a + b, 0) / data.aqiList.length)
        : 0;
    const meanPm25 =
      data.pm25List.length > 0
        ? Math.round((data.pm25List.reduce((a, b) => a + b, 0) / data.pm25List.length) * 10) / 10
        : 0;
    const meanNox =
      data.noxList.length > 0
        ? Math.round((data.noxList.reduce((a, b) => a + b, 0) / data.noxList.length) * 10) / 10
        : 0;

    const parsedDate = new Date(`${date}T12:00:00Z`);
    const dayName = parsedDate.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
    const dayNum = parsedDate.getUTCDate();
    const isToday = date === todayStr;
    const dayLabel = isToday ? `Today (${dayName})` : `${dayName} ${dayNum}`;
    const inversionCeilingMeters = Math.max(90, Math.round(350 - Math.min(250, meanPm25 * 0.8)));

    points.push({
      date,
      dayLabel,
      aqi: meanAqi,
      pm25: meanPm25,
      nox: meanNox,
      inversionCeilingMeters,
      isSevereDay: meanAqi >= 400 || meanPm25 >= 250,
    });
  }

  return points;
}
