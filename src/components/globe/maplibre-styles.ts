import type { StyleSpecification } from 'maplibre-gl';
import { GLOBE_REFERENCE_CITIES } from './world-landmass';
import type { ResolvedGlobePlace } from './globe-place-resolver';

export type GlobeMapStyleKey = 'satellite' | 'streets' | 'scientific';

export interface LocationInspectData {
  name: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  aqi: number;
  tier: string;
  tierColor: string;
  dominant: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  healthAction: string;
  screenX?: number;
  screenY?: number;
  isReferenceSample?: boolean;
}

export const CITY_SAMPLE_ESTIMATES: Record<string, {
  aqi: number;
  tier: string;
  color: string;
  temp: number;
  humidity: number;
  wind: number;
  smogTip: string;
}> = {
  'New Delhi': {
    aqi: 168,
    tier: 'Unhealthy',
    color: '#EF4444',
    temp: 19,
    humidity: 62,
    wind: 5.9,
    smogTip: 'Severe thermal inversion trapping PM2.5. Seal windows & wear N95.',
  },
  'Hyderabad': {
    aqi: 129,
    tier: 'Sensitive Groups',
    color: '#F97316',
    temp: 25,
    humidity: 43,
    wind: 9.9,
    smogTip: 'Elevated particulate concentration. Sensitive groups limit outdoor cardio.',
  },
  'Jakarta': {
    aqi: 137,
    tier: 'Sensitive Groups',
    color: '#F97316',
    temp: 34,
    humidity: 50,
    wind: 13.2,
    smogTip: 'Urban vehicular exhaust buildup. N95 recommended near busy traffic corridors.',
  },
  'Beijing': {
    aqi: 155,
    tier: 'Unhealthy',
    color: '#EF4444',
    temp: 4,
    humidity: 35,
    wind: 8.5,
    smogTip: 'Seasonal heating emissions active. Run continuous HEPA purifiers indoors.',
  },
  'Cairo': {
    aqi: 145,
    tier: 'Sensitive Groups',
    color: '#F97316',
    temp: 22,
    humidity: 48,
    wind: 11.0,
    smogTip: 'Desert mineral dust combined with urban particulate accumulation.',
  },
  'New York': {
    aqi: 56,
    tier: 'Moderate',
    color: '#F59E0B',
    temp: 6,
    humidity: 78,
    wind: 6.8,
    smogTip: 'Air quality acceptable. Safe to ventilate indoor living spaces midday.',
  },
  'London': {
    aqi: 42,
    tier: 'Good',
    color: '#10B981',
    temp: 9,
    humidity: 82,
    wind: 14.5,
    smogTip: 'Brisk maritime air mass provides excellent atmospheric particulate dispersion.',
  },
  'Tokyo': {
    aqi: 42,
    tier: 'Good',
    color: '#10B981',
    temp: 12,
    humidity: 55,
    wind: 10.2,
    smogTip: 'Pristine coastal air mass. Ideal atmospheric conditions for outdoor recreation.',
  },
  'Paris': {
    aqi: 45,
    tier: 'Good',
    color: '#10B981',
    temp: 8,
    humidity: 75,
    wind: 9.0,
    smogTip: 'Low criteria pollutant concentrations. Safe for all demographic groups.',
  },
  'Sydney': {
    aqi: 38,
    tier: 'Good',
    color: '#10B981',
    temp: 24,
    humidity: 65,
    wind: 18.0,
    smogTip: 'Clean coastal breezes ensure continuous natural particulate ventilation.',
  },
  'Rio de Janeiro': {
    aqi: 42,
    tier: 'Good',
    color: '#10B981',
    temp: 28,
    humidity: 72,
    wind: 12.0,
    smogTip: 'Tropical oceanic dispersion. Atmospheric indices at healthy baselines.',
  },
  'Riyadh': {
    aqi: 142,
    tier: 'Sensitive Groups',
    color: '#F97316',
    temp: 29,
    humidity: 18,
    wind: 15.0,
    smogTip: 'Arid dust particulates elevated. Hydrate and use indoor air filters.',
  },
};

export const SATELLITE_STYLE_SPEC: StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: 'Esri, Maxar, Earthstar Geographics',
    },
    reference: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'satellite-layer',
      type: 'raster',
      source: 'satellite',
      minzoom: 0,
      maxzoom: 22,
    },
    {
      id: 'reference-layer',
      type: 'raster',
      source: 'reference',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

export const TILE_STYLES: Record<GlobeMapStyleKey, string | StyleSpecification> = {
  satellite: SATELLITE_STYLE_SPEC,
  streets: 'https://tiles.openfreemap.org/styles/bright',
  scientific: 'https://tiles.openfreemap.org/styles/positron',
};

export function subscribeReducedMotion(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
}

export function getReducedMotionSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function getReducedMotionServerSnapshot(): boolean {
  return false;
}

/**
 * Returns estimated telemetry and smog tips for reference sample cities
 */
export function getReferenceCityEstimate(cityName: string): {
  aqi: number;
  tier: string;
  color: string;
  temp: number;
  humidity: number;
  wind: number;
  smogTip: string;
} {
  let cityAqi = 42;
  let cityColor = '#10B981';
  let cityTier = 'Good';
  let cityTemp = 20;
  let cityHumidity = 50;
  let cityWind = 10;
  let cityTip = 'Acceptable air quality for general demographic.';

  const matched = Object.entries(CITY_SAMPLE_ESTIMATES).find(([name]) => cityName.includes(name));
  if (matched) {
    const t = matched[1];
    cityAqi = t.aqi;
    cityColor = t.color;
    cityTier = t.tier;
    cityTemp = t.temp;
    cityHumidity = t.humidity;
    cityWind = t.wind;
    cityTip = t.smogTip;
  }

  return {
    aqi: cityAqi,
    tier: cityTier,
    color: cityColor,
    temp: cityTemp,
    humidity: cityHumidity,
    wind: cityWind,
    smogTip: cityTip,
  };
}

/**
 * Derives telemetry and atmospheric summary data for a resolved globe location
 */
export function resolveInspectTelemetry(
  lat: number,
  lng: number,
  place: ResolvedGlobePlace,
  point?: { x: number; y: number }
): LocationInspectData {
  const nearCity = GLOBE_REFERENCE_CITIES.find(
    (c) => Math.hypot(c.latitude - lat, c.longitude - lng) < 1.8
  );

  let aqiVal = 65;
  let tierStr = 'Moderate';
  let tierClr = '#F59E0B';
  let tempVal = 22;
  let humidVal = 55;
  let windVal = 10;
  let tip = `${place.name} atmospheric index. Safe for standard outdoor activities.`;

  if (nearCity) {
    const est = getReferenceCityEstimate(nearCity.name);
    aqiVal = est.aqi;
    tierStr = est.tier;
    tierClr = est.color;
    tempVal = est.temp;
    humidVal = est.humidity;
    windVal = est.wind;
    tip = est.smogTip;
  } else if (place.isMarine) {
    aqiVal = 25;
    tierStr = 'Good';
    tierClr = '#10B981';
    tempVal = 20;
    humidVal = 80;
    windVal = 18;
    tip = `Clean oceanic air mass over the ${place.name}. Baseline marine dispersion.`;
  }

  return {
    name: place.name,
    country: place.country,
    countryCode: place.countryCode,
    latitude: lat,
    longitude: lng,
    aqi: aqiVal,
    tier: tierStr,
    tierColor: tierClr,
    dominant: 'PM2.5',
    temperature: tempVal,
    humidity: humidVal,
    windSpeed: windVal,
    healthAction: tip,
    screenX: point?.x,
    screenY: point?.y,
    isReferenceSample: Boolean(nearCity),
  };
}
