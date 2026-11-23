/**
 * AirAware — Interactive Earth Globe Math & Spatial Helpers
 * Pure mathematical spherical projections, vector transformations, and geographic metadata.
 */

import * as THREE from 'three';
import { GeoLocation } from '@/domain/types';
import { GLOBE_REFERENCE_CITIES } from './world-landmass';
import { WORLD_COUNTRIES } from './world-borders';

export interface InteractivePointData {
  name: string;
  country: string;
  countryCode: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  aqi: number;
  category: string;
  colorHex: string;
  weatherSummary: string;
  isCustomPoint?: boolean;
  screenX: number;
  screenY: number;
}

export interface GlobePinLocation {
  id: string;
  name: string;
  countryCode: string;
  lat: number;
  lon: number;
  aqi: number;
  colorHex: string;
  isActive: boolean;
}

export function subscribeReducedMotion(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
}

export function getReducedMotionSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function getServerReducedMotionSnapshot(): boolean {
  return false;
}

/**
 * Resolves CSS variable tokens or raw hex color strings into sanitized hex values.
 */
export function resolveAqiColor(colorToken: string = ''): { hex: string; rgba: (alpha: number) => string } {
  const map: Record<string, string> = {
    'var(--aqi-good)': '#047857',
    'var(--aqi-moderate)': '#B45309',
    'var(--aqi-sensitive)': '#C2410C',
    'var(--aqi-unhealthy)': '#B91C1C',
    'var(--aqi-very-unhealthy)': '#6D28D9',
    'var(--aqi-hazardous)': '#7F1D1D',
    'var(--brand-primary)': '#0F766E',
  };

  let hex = map[colorToken] || colorToken;

  if (hex.startsWith('var(') && typeof window !== 'undefined') {
    const varName = hex.replace(/var\(|\)/g, '').trim();
    const computed = window.getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    if (computed) hex = computed;
  }

  if (!hex || !hex.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) {
    hex = '#0F766E';
  }

  if (hex.length === 4) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }

  const r = parseInt(hex.slice(1, 3), 16) || 15;
  const g = parseInt(hex.slice(3, 5), 16) || 118;
  const b = parseInt(hex.slice(5, 7), 16) || 110;

  return {
    hex,
    rgba: (alpha: number) => `rgba(${r}, ${g}, ${b}, ${alpha})`,
  };
}

/**
 * Mathematical Spherical Projection matching Three.js SphereGeometry UV space
 */
export function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (lat * Math.PI) / 180;
  const lambda = (lon * Math.PI) / 180;
  const x = radius * Math.cos(phi) * Math.cos(lambda);
  const y = radius * Math.sin(phi);
  const z = -radius * Math.cos(phi) * Math.sin(lambda);
  return new THREE.Vector3(x, y, z);
}

/**
 * Converts a 3D Sphere surface position back into (lat, lon)
 */
export function vector3ToLatLon(v: THREE.Vector3): { lat: number; lon: number } {
  const norm = v.clone().normalize();
  const phi = Math.asin(Math.min(Math.max(norm.y, -1), 1));
  const lat = (phi * 180) / Math.PI;
  const lambda = Math.atan2(-norm.z, norm.x);
  let lon = (lambda * 180) / Math.PI;
  while (lon < -180) lon += 360;
  while (lon > 180) lon -= 360;
  return { lat, lon };
}

/**
 * Resolves country or geographic region from spherical coordinates
 */
export function resolveGeographicRegion(lat: number, lon: number): { name: string; countryCode: string; defaultAqi: number; category: string } {
  // Check exact country bounding boxes
  for (const c of WORLD_COUNTRIES) {
    const [minLon, minLat, maxLon, maxLat] = c.bbox;
    if (lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat) {
      if (c.code === 'IN' || c.code === 'PK' || c.code === 'BD') {
        return { name: c.name, countryCode: c.code, defaultAqi: 145, category: 'Sensitive' };
      }
      if (c.code === 'CN') {
        return { name: c.name, countryCode: c.code, defaultAqi: 120, category: 'Moderate' };
      }
      if (['GB', 'FR', 'DE', 'IT', 'ES', 'NL', 'SE', 'NO', 'FI', 'CH'].includes(c.code)) {
        return { name: c.name, countryCode: c.code, defaultAqi: 38, category: 'Good' };
      }
      if (c.code === 'US' || c.code === 'CA') {
        return { name: c.name, countryCode: c.code, defaultAqi: 48, category: 'Good' };
      }
      if (['SA', 'AE', 'QA', 'EG', 'KW'].includes(c.code)) {
        return { name: c.name, countryCode: c.code, defaultAqi: 135, category: 'Sensitive' };
      }
      if (c.code === 'AU' || c.code === 'NZ') {
        return { name: c.name, countryCode: c.code, defaultAqi: 24, category: 'Good' };
      }
      if (['BR', 'AR', 'CL', 'CO'].includes(c.code)) {
        return { name: c.name, countryCode: c.code, defaultAqi: 55, category: 'Moderate' };
      }
      return { name: c.name, countryCode: c.code, defaultAqi: 65, category: 'Moderate' };
    }
  }

  // Ocean / Maritime classification
  if (lat > 66) {
    return { name: 'Arctic Ocean', countryCode: 'OCEAN', defaultAqi: 12, category: 'Pristine Marine' };
  }
  if (lat < -55) {
    return { name: 'Southern Ocean', countryCode: 'OCEAN', defaultAqi: 10, category: 'Pristine Marine' };
  }
  if (lon > -45 && lon < 20 && lat >= 0) {
    return { name: 'North Atlantic Ocean', countryCode: 'OCEAN', defaultAqi: 18, category: 'Clean Maritime' };
  }
  if (lon > 40 && lon < 105 && lat < 25 && lat > -45) {
    return { name: 'Indian Ocean', countryCode: 'OCEAN', defaultAqi: 22, category: 'Tropical Maritime' };
  }
  if (lon > 105 || lon < -80) {
    return { name: 'Pacific Ocean', countryCode: 'OCEAN', defaultAqi: 16, category: 'Pacific Maritime' };
  }

  return {
    name: `${lat >= 0 ? lat.toFixed(1) + '°N' : Math.abs(lat).toFixed(1) + '°S'}, ${
      lon >= 0 ? lon.toFixed(1) + '°E' : Math.abs(lon).toFixed(1) + '°W'
    }`,
    countryCode: 'GRID',
    defaultAqi: 45,
    category: 'Marine Atmosphere',
  };
}

/**
 * Pure data preparation: builds the list of active and reference city pin locations.
 */
export function buildGlobePinLocations(
  selectedLocation: GeoLocation | null,
  currentAqi: number | null | undefined,
  resolvedColorHex: string
): GlobePinLocation[] {
  const allPinLocations: GlobePinLocation[] = [];

  // Active Location Pin (GPS or Search)
  if (selectedLocation) {
    allPinLocations.push({
      id: `active-${selectedLocation.name}`,
      name: selectedLocation.name,
      countryCode: selectedLocation.countryCode,
      lat: selectedLocation.latitude,
      lon: selectedLocation.longitude,
      aqi: currentAqi ?? 125,
      colorHex: resolvedColorHex,
      isActive: true,
    });
  }

  // Global Reference Cities
  GLOBE_REFERENCE_CITIES.forEach((c) => {
    // Avoid duplicate pins if selected location is close to reference city
    if (selectedLocation && Math.abs(c.latitude - selectedLocation.latitude) < 1.0 && Math.abs(c.longitude - selectedLocation.longitude) < 1.0) {
      return;
    }

    let cityAqi = 42;
    let colorHex = '#047857';
    if (c.name.includes('Delhi')) {
      cityAqi = 168;
      colorHex = '#B91C1C';
    } else if (c.name.includes('Beijing')) {
      cityAqi = 155;
      colorHex = '#B91C1C';
    } else if (c.name.includes('Jakarta')) {
      cityAqi = 137;
      colorHex = '#C2410C';
    } else if (c.name.includes('New York')) {
      cityAqi = 56;
      colorHex = '#B45309';
    } else if (c.name.includes('London')) {
      cityAqi = 34;
      colorHex = '#047857';
    } else if (c.name.includes('Paris')) {
      cityAqi = 38;
      colorHex = '#047857';
    } else if (c.name.includes('Tokyo')) {
      cityAqi = 45;
      colorHex = '#047857';
    } else if (c.name.includes('Sydney')) {
      cityAqi = 22;
      colorHex = '#047857';
    } else if (c.name.includes('Cairo')) {
      cityAqi = 142;
      colorHex = '#C2410C';
    } else if (c.name.includes('São Paulo')) {
      cityAqi = 58;
      colorHex = '#B45309';
    }

    allPinLocations.push({
      id: `ref-${c.name}`,
      name: c.name,
      countryCode: c.countryCode,
      lat: c.latitude,
      lon: c.longitude,
      aqi: cityAqi,
      colorHex,
      isActive: false,
    });
  });

  return allPinLocations;
}
