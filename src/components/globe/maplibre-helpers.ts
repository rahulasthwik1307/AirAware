/**
 * AirAware — MapLibre WebGL Marker & Layer Utility Helpers
 * Pure DOM marker construction and formatting utilities for 3D Earth Globe.
 */

import * as maplibregl from 'maplibre-gl';
import { GeoLocation } from '@/domain/types';
import { GLOBE_REFERENCE_CITIES } from './world-landmass';
import { LocationInspectData, getReferenceCityEstimate } from './maplibre-styles';

export const DEFAULT_SKY_CONFIG = {
  'sky-color': '#0F172A',
  'horizon-color': '#1E293B',
  'fog-color': '#0F172A',
  'fog-ground-blend': 0.8,
} as const;

/**
 * Builds the interactive HTML DOM element for the active selected location marker.
 *
 * @param location - Active geolocation
 * @param aqiColor - Hex color corresponding to the current AQI tier
 * @param currentAqi - Current AQI numerical value
 * @param onInspect - Click handler callback triggering telemetry inspection
 * @returns Configured HTMLDivElement
 */
export function createActiveMarkerElement(
  location: GeoLocation,
  aqiColor: string,
  currentAqi: number | null | undefined,
  onInspect: () => void
): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'group relative flex flex-col items-center cursor-pointer select-none';
  el.innerHTML = `
    <div class="relative flex items-center justify-center">
      <span class="absolute w-8 h-8 rounded-full animate-ping opacity-75" style="background-color: ${aqiColor}"></span>
      <span class="w-4 h-4 rounded-full border-2 border-white shadow-xl ring-2 ring-slate-900" style="background-color: ${aqiColor}"></span>
    </div>
    <div class="mt-1 px-2.5 py-0.5 rounded-full font-mono font-black text-white text-[11px] shadow-xl border border-white/40 flex items-center gap-1.5 whitespace-nowrap" style="background-color: ${aqiColor}">
      <span>${location.name}</span>
      <span class="opacity-90">[${currentAqi ?? '--'}]</span>
    </div>
  `;

  el.addEventListener('click', (ev) => {
    ev.stopPropagation();
    onInspect();
  });

  return el;
}

/**
 * Builds the interactive HTML DOM element for a world reference benchmark city pin.
 *
 * @param cityName - Name of the reference city
 * @param cityColor - Benchmark AQI hex color
 * @param cityAqi - Estimated reference AQI
 * @param onInspect - Hover/click inspect callback
 * @returns Configured HTMLDivElement
 */
export function createReferenceCityMarkerElement(
  cityName: string,
  cityColor: string,
  cityAqi: number,
  onInspect: () => void
): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'group relative flex items-center gap-1 cursor-pointer transition-transform hover:scale-110';
  el.innerHTML = `
    <span class="w-2.5 h-2.5 rounded-full border border-white shadow-md" style="background-color: ${cityColor}"></span>
    <span class="px-1.5 py-0.2 rounded-full font-mono font-bold text-white text-[10px] shadow-md border border-white/30" style="background-color: ${cityColor}EE">
      ${cityName} [${cityAqi}]
    </span>
  `;

  const triggerInspect = (ev: Event) => {
    ev.stopPropagation();
    onInspect();
  };

  el.addEventListener('mouseenter', triggerInspect);
  el.addEventListener('click', triggerInspect);

  return el;
}

/**
 * Synchronizes the active location pin on the MapLibre map instance.
 *
 * @param map - Active MapLibre Map instance
 * @param selectedLocation - Geolocation to pin
 * @param aqiColor - Hex color corresponding to current AQI
 * @param currentAqi - Numerical AQI or null
 * @param onInspect - Callback to set inspect data
 * @param currentMarker - Pre-existing marker to replace
 * @returns The newly created maplibregl.Marker instance
 */
export function updateActiveLocationMarker(
  map: maplibregl.Map,
  selectedLocation: GeoLocation,
  aqiColor: string,
  currentAqi: number | null | undefined,
  onInspect: (data: LocationInspectData) => void,
  currentMarker: maplibregl.Marker | null
): maplibregl.Marker {
  if (currentMarker) currentMarker.remove();

  const el = createActiveMarkerElement(selectedLocation, aqiColor, currentAqi, () => {
    onInspect({
      name: selectedLocation.name,
      country: selectedLocation.country,
      countryCode: selectedLocation.countryCode,
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      aqi: currentAqi ?? 100,
      tier:
        currentAqi && currentAqi > 150
          ? 'Unhealthy'
          : currentAqi && currentAqi > 100
          ? 'Sensitive'
          : 'Moderate',
      tierColor: aqiColor,
      dominant: 'PM2.5',
      temperature: 24,
      humidity: 50,
      windSpeed: 8,
      healthAction: 'Active selected location. Modelled atmospheric estimates loaded.',
      isReferenceSample: false,
    });
  });

  const marker = new maplibregl.Marker({ element: el })
    .setLngLat([selectedLocation.longitude, selectedLocation.latitude])
    .addTo(map);

  return marker;
}

/**
 * Synchronizes global reference benchmark city pins on the MapLibre map instance.
 *
 * @param map - Active MapLibre Map instance
 * @param selectedLocation - Currently selected location to avoid duplicate pinning
 * @param onInspect - Callback to set inspect data
 * @param existingMarkers - Array of existing markers to tear down
 * @returns Newly created array of reference city maplibregl.Markers
 */
export function updateReferenceCityMarkers(
  map: maplibregl.Map,
  selectedLocation: GeoLocation | null,
  onInspect: (data: LocationInspectData) => void,
  existingMarkers: maplibregl.Marker[]
): maplibregl.Marker[] {
  existingMarkers.forEach((m) => m.remove());
  const newMarkers: maplibregl.Marker[] = [];

  GLOBE_REFERENCE_CITIES.forEach((c) => {
    if (
      selectedLocation &&
      Math.abs(c.latitude - selectedLocation.latitude) < 0.5 &&
      Math.abs(c.longitude - selectedLocation.longitude) < 0.5
    ) {
      return;
    }

    const est = getReferenceCityEstimate(c.name);
    const el = createReferenceCityMarkerElement(c.name, est.color, est.aqi, () => {
      onInspect({
        name: c.name,
        country: c.country,
        countryCode: c.countryCode,
        latitude: c.latitude,
        longitude: c.longitude,
        aqi: est.aqi,
        tier: est.tier,
        tierColor: est.color,
        dominant: 'PM2.5',
        temperature: est.temp,
        humidity: est.humidity,
        windSpeed: est.wind,
        healthAction:
          est.smogTip ||
          'Modelled reference sample for global comparison. Focus & select as active location.',
        isReferenceSample: true,
      });
    });

    const m = new maplibregl.Marker({ element: el })
      .setLngLat([c.longitude, c.latitude])
      .addTo(map);

    newMarkers.push(m);
  });

  return newMarkers;
}

/**
 * Formats a clean geographic coordinate subtitle for the inspect card.
 *
 * @param data - Inspected location telemetry record
 * @returns Formatted coordinates string with cardinal directions
 */
export function formatLocationSubtitle(data: LocationInspectData): string {
  const countryPrefix =
    data.country && data.country !== data.name && data.country !== 'International Waters'
      ? `${data.country} • `
      : '';
  const latStr = `${Math.abs(data.latitude).toFixed(2)}°${data.latitude >= 0 ? 'N' : 'S'}`;
  const lngStr = `${Math.abs(data.longitude).toFixed(2)}°${data.longitude >= 0 ? 'E' : 'W'}`;
  return `${countryPrefix}${latStr}, ${lngStr}`;
}
