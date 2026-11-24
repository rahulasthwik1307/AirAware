/**
 * AirAware — Global Country Metadata and Bounding Boxes
 * Typed re-export of pre-extracted Natural Earth 110m political boundaries.
 */

import countriesJson from './world-countries.json';

export interface CountryMeta {
  readonly name: string;
  readonly code: string;
  readonly lat: number;
  readonly lon: number;
  readonly bbox: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
}

/**
 * Collection of world country metadata, centroids, and bounding boxes.
 */
export const WORLD_COUNTRIES: CountryMeta[] = countriesJson as CountryMeta[];
