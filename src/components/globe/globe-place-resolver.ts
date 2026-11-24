/**
 * AirAware — Global Place & Geographic Entity Resolver
 * Resolves any latitude/longitude coordinate on Earth or clicked MapLibre feature
 * into accurate, human-readable place names (cities, countries, territories, oceanic basins).
 * Guarantees zero "Global Grid Coordinate" robot headings.
 */

import { WORLD_COUNTRIES, CountryMeta } from './world-countries';
import { WORLD_CONTINENTS } from './world-landmass';

export interface ResolvedGlobePlace {
  readonly name: string;
  readonly country: string;
  readonly countryCode: string;
  readonly region: string;
  readonly isCity: boolean;
  readonly isMarine: boolean;
}

/**
 * Key global metropolitan and regional urban reference centers
 * Provides instant city-level precision across all continents.
 */
interface CityAnchor {
  readonly name: string;
  readonly country: string;
  readonly countryCode: string;
  readonly region: string;
  readonly lat: number;
  readonly lng: number;
}

const GLOBAL_CITY_ANCHORS: readonly CityAnchor[] = [
  // West & Central Africa
  { name: 'Bamako', country: 'Mali', countryCode: 'ML', region: 'West Africa', lat: 12.6392, lng: -8.0029 },
  { name: 'Timbuktu', country: 'Mali', countryCode: 'ML', region: 'West Africa', lat: 16.7666, lng: -3.0026 },
  { name: 'Gao', country: 'Mali', countryCode: 'ML', region: 'West Africa', lat: 16.2717, lng: -0.0447 },
  { name: 'Ouagadougou', country: 'Burkina Faso', countryCode: 'BF', region: 'West Africa', lat: 12.3714, lng: -1.5197 },
  { name: 'Niamey', country: 'Niger', countryCode: 'NE', region: 'West Africa', lat: 13.5116, lng: 2.1254 },
  { name: 'Dakar', country: 'Senegal', countryCode: 'SN', region: 'West Africa', lat: 14.7167, lng: -17.4677 },
  { name: 'Accra', country: 'Ghana', countryCode: 'GH', region: 'West Africa', lat: 5.6037, lng: -0.187 },
  { name: 'Lagos', country: 'Nigeria', countryCode: 'NG', region: 'West Africa', lat: 6.5244, lng: 3.3792 },
  { name: 'Abuja', country: 'Nigeria', countryCode: 'NG', region: 'West Africa', lat: 9.0765, lng: 7.3986 },
  { name: 'Abidjan', country: "Côte d'Ivoire", countryCode: 'CI', region: 'West Africa', lat: 5.36, lng: -4.0083 },
  { name: 'N\'Djamena', country: 'Chad', countryCode: 'TD', region: 'Central Africa', lat: 12.1348, lng: 15.0557 },
  { name: 'Kinshasa', country: 'DR Congo', countryCode: 'CD', region: 'Central Africa', lat: -4.4419, lng: 15.2663 },

  // North Africa & Middle East
  { name: 'Cairo', country: 'Egypt', countryCode: 'EG', region: 'North Africa', lat: 30.0444, lng: 31.2357 },
  { name: 'Alexandria', country: 'Egypt', countryCode: 'EG', region: 'North Africa', lat: 31.2001, lng: 29.9187 },
  { name: 'Algiers', country: 'Algeria', countryCode: 'DZ', region: 'North Africa', lat: 36.7538, lng: 3.0588 },
  { name: 'Casablanca', country: 'Morocco', countryCode: 'MA', region: 'North Africa', lat: 33.5731, lng: -7.5898 },
  { name: 'Tunis', country: 'Tunisia', countryCode: 'TN', region: 'North Africa', lat: 36.8065, lng: 10.1815 },
  { name: 'Tripoli', country: 'Libya', countryCode: 'LY', region: 'North Africa', lat: 32.8872, lng: 13.1913 },
  { name: 'Riyadh', country: 'Saudi Arabia', countryCode: 'SA', region: 'Middle East', lat: 24.7136, lng: 46.6753 },
  { name: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE', region: 'Middle East', lat: 25.2048, lng: 55.2708 },
  { name: 'Abu Dhabi', country: 'United Arab Emirates', countryCode: 'AE', region: 'Middle East', lat: 24.4539, lng: 54.3773 },
  { name: 'Doha', country: 'Qatar', countryCode: 'QA', region: 'Middle East', lat: 25.2854, lng: 51.531 },
  { name: 'Kuwait City', country: 'Kuwait', countryCode: 'KW', region: 'Middle East', lat: 29.3759, lng: 47.9774 },
  { name: 'Muscat', country: 'Oman', countryCode: 'OM', region: 'Middle East', lat: 23.588, lng: 58.3829 },
  { name: 'Amman', country: 'Jordan', countryCode: 'JO', region: 'Middle East', lat: 31.9454, lng: 35.9284 },
  { name: 'Baghdad', country: 'Iraq', countryCode: 'IQ', region: 'Middle East', lat: 33.3152, lng: 44.3661 },
  { name: 'Tehran', country: 'Iran', countryCode: 'IR', region: 'Middle East', lat: 35.6892, lng: 51.389 },
  { name: 'Istanbul', country: 'Turkey', countryCode: 'TR', region: 'Eurasia', lat: 41.0082, lng: 28.9784 },
  { name: 'Ankara', country: 'Turkey', countryCode: 'TR', region: 'Eurasia', lat: 39.9334, lng: 32.8597 },

  // East & Southern Africa
  { name: 'Nairobi', country: 'Kenya', countryCode: 'KE', region: 'East Africa', lat: -1.2921, lng: 36.8219 },
  { name: 'Addis Ababa', country: 'Ethiopia', countryCode: 'ET', region: 'East Africa', lat: 9.03, lng: 38.74 },
  { name: 'Dar es Salaam', country: 'Tanzania', countryCode: 'TZ', region: 'East Africa', lat: -6.7924, lng: 39.2083 },
  { name: 'Johannesburg', country: 'South Africa', countryCode: 'ZA', region: 'Southern Africa', lat: -26.2041, lng: 28.0473 },
  { name: 'Cape Town', country: 'South Africa', countryCode: 'ZA', region: 'Southern Africa', lat: -33.9249, lng: 18.4241 },

  // South Asia
  { name: 'New Delhi', country: 'India', countryCode: 'IN', region: 'South Asia', lat: 28.6139, lng: 77.209 },
  { name: 'Mumbai', country: 'India', countryCode: 'IN', region: 'South Asia', lat: 19.076, lng: 72.8777 },
  { name: 'Kolkata', country: 'India', countryCode: 'IN', region: 'South Asia', lat: 22.5726, lng: 88.3639 },
  { name: 'Bangalore', country: 'India', countryCode: 'IN', region: 'South Asia', lat: 12.9716, lng: 77.5946 },
  { name: 'Chennai', country: 'India', countryCode: 'IN', region: 'South Asia', lat: 13.0827, lng: 80.2707 },
  { name: 'Hyderabad', country: 'India', countryCode: 'IN', region: 'South Asia', lat: 17.385, lng: 78.4867 },
  { name: 'Dhaka', country: 'Bangladesh', countryCode: 'BD', region: 'South Asia', lat: 23.8103, lng: 90.4125 },
  { name: 'Karachi', country: 'Pakistan', countryCode: 'PK', region: 'South Asia', lat: 24.8607, lng: 67.0011 },
  { name: 'Lahore', country: 'Pakistan', countryCode: 'PK', region: 'South Asia', lat: 31.5204, lng: 74.3587 },
  { name: 'Islamabad', country: 'Pakistan', countryCode: 'PK', region: 'South Asia', lat: 33.6844, lng: 73.0479 },
  { name: 'Colombo', country: 'Sri Lanka', countryCode: 'LK', region: 'South Asia', lat: 6.9271, lng: 79.8612 },
  { name: 'Kathmandu', country: 'Nepal', countryCode: 'NP', region: 'South Asia', lat: 27.7172, lng: 85.324 },

  // East & Southeast Asia
  { name: 'Tokyo', country: 'Japan', countryCode: 'JP', region: 'East Asia', lat: 35.6762, lng: 139.6503 },
  { name: 'Osaka', country: 'Japan', countryCode: 'JP', region: 'East Asia', lat: 34.6937, lng: 135.5023 },
  { name: 'Seoul', country: 'South Korea', countryCode: 'KR', region: 'East Asia', lat: 37.5665, lng: 126.978 },
  { name: 'Beijing', country: 'China', countryCode: 'CN', region: 'East Asia', lat: 39.9042, lng: 116.4074 },
  { name: 'Shanghai', country: 'China', countryCode: 'CN', region: 'East Asia', lat: 31.2304, lng: 121.4737 },
  { name: 'Guangzhou', country: 'China', countryCode: 'CN', region: 'East Asia', lat: 23.1291, lng: 113.2644 },
  { name: 'Hong Kong', country: 'Hong Kong', countryCode: 'HK', region: 'East Asia', lat: 22.3193, lng: 114.1694 },
  { name: 'Taipei', country: 'Taiwan', countryCode: 'TW', region: 'East Asia', lat: 25.033, lng: 121.5654 },
  { name: 'Bangkok', country: 'Thailand', countryCode: 'TH', region: 'Southeast Asia', lat: 13.7563, lng: 100.5018 },
  { name: 'Singapore', country: 'Singapore', countryCode: 'SG', region: 'Southeast Asia', lat: 1.3521, lng: 103.8198 },
  { name: 'Jakarta', country: 'Indonesia', countryCode: 'ID', region: 'Southeast Asia', lat: -6.2088, lng: 106.8456 },
  { name: 'Kuala Lumpur', country: 'Malaysia', countryCode: 'MY', region: 'Southeast Asia', lat: 3.139, lng: 101.6869 },
  { name: 'Manila', country: 'Philippines', countryCode: 'PH', region: 'Southeast Asia', lat: 14.5995, lng: 120.9842 },
  { name: 'Hanoi', country: 'Vietnam', countryCode: 'VN', region: 'Southeast Asia', lat: 21.0285, lng: 105.8542 },

  // Europe
  { name: 'London', country: 'United Kingdom', countryCode: 'GB', region: 'Western Europe', lat: 51.5074, lng: -0.1278 },
  { name: 'Paris', country: 'France', countryCode: 'FR', region: 'Western Europe', lat: 48.8566, lng: 2.3522 },
  { name: 'Berlin', country: 'Germany', countryCode: 'DE', region: 'Central Europe', lat: 52.52, lng: 13.405 },
  { name: 'Rome', country: 'Italy', countryCode: 'IT', region: 'Southern Europe', lat: 41.9028, lng: 12.4964 },
  { name: 'Madrid', country: 'Spain', countryCode: 'ES', region: 'Southern Europe', lat: 40.4168, lng: -3.7038 },
  { name: 'Amsterdam', country: 'Netherlands', countryCode: 'NL', region: 'Western Europe', lat: 52.3676, lng: 4.9041 },
  { name: 'Brussels', country: 'Belgium', countryCode: 'BE', region: 'Western Europe', lat: 50.8503, lng: 4.3517 },
  { name: 'Vienna', country: 'Austria', countryCode: 'AT', region: 'Central Europe', lat: 48.2082, lng: 16.3738 },
  { name: 'Warsaw', country: 'Poland', countryCode: 'PL', region: 'Eastern Europe', lat: 52.2297, lng: 21.0122 },
  { name: 'Stockholm', country: 'Sweden', countryCode: 'SE', region: 'Northern Europe', lat: 59.3293, lng: 18.0686 },
  { name: 'Athens', country: 'Greece', countryCode: 'GR', region: 'Southern Europe', lat: 37.9838, lng: 23.7275 },
  { name: 'Lisbon', country: 'Portugal', countryCode: 'PT', region: 'Southern Europe', lat: 38.7223, lng: -9.1393 },
  { name: 'Moscow', country: 'Russia', countryCode: 'RU', region: 'Eastern Europe', lat: 55.7558, lng: 37.6173 },

  // North America
  { name: 'New York', country: 'United States', countryCode: 'US', region: 'North America', lat: 40.7128, lng: -74.006 },
  { name: 'Los Angeles', country: 'United States', countryCode: 'US', region: 'North America', lat: 34.0522, lng: -118.2437 },
  { name: 'Chicago', country: 'United States', countryCode: 'US', region: 'North America', lat: 41.8781, lng: -87.6298 },
  { name: 'Toronto', country: 'Canada', countryCode: 'CA', region: 'North America', lat: 43.6532, lng: -79.3832 },
  { name: 'Vancouver', country: 'Canada', countryCode: 'CA', region: 'North America', lat: 49.2827, lng: -123.1207 },
  { name: 'Mexico City', country: 'Mexico', countryCode: 'MX', region: 'North America', lat: 19.4326, lng: -99.1332 },

  // South America
  { name: 'São Paulo', country: 'Brazil', countryCode: 'BR', region: 'South America', lat: -23.5505, lng: -46.6333 },
  { name: 'Rio de Janeiro', country: 'Brazil', countryCode: 'BR', region: 'South America', lat: -22.9068, lng: -43.1729 },
  { name: 'Buenos Aires', country: 'Argentina', countryCode: 'AR', region: 'South America', lat: -34.6037, lng: -58.3816 },
  { name: 'Santiago', country: 'Chile', countryCode: 'CL', region: 'South America', lat: -33.4489, lng: -70.6693 },
  { name: 'Lima', country: 'Peru', countryCode: 'PE', region: 'South America', lat: -12.0464, lng: -77.0428 },
  { name: 'Bogotá', country: 'Colombia', countryCode: 'CO', region: 'South America', lat: 4.711, lng: -74.0721 },

  // Oceania & Islands
  { name: 'Sydney', country: 'Australia', countryCode: 'AU', region: 'Oceania', lat: -33.8688, lng: 151.2093 },
  { name: 'Melbourne', country: 'Australia', countryCode: 'AU', region: 'Oceania', lat: -37.8136, lng: 144.9631 },
  { name: 'Auckland', country: 'New Zealand', countryCode: 'NZ', region: 'Oceania', lat: -36.8485, lng: 174.7633 },
  { name: 'Honolulu', country: 'United States', countryCode: 'US', region: 'Pacific Islands', lat: 21.3069, lng: -157.8583 },
  { name: 'Reykjavik', country: 'Iceland', countryCode: 'IS', region: 'North Atlantic', lat: 64.1466, lng: -21.9426 },
  { name: 'Havana', country: 'Cuba', countryCode: 'CU', region: 'Caribbean', lat: 23.1136, lng: -82.3666 },
];

/**
 * Clean mainland boundaries for nations whose raw bboxes span multiple continents/oceans
 */
const COUNTRY_BBOX_OVERRIDES: Record<string, [number, number, number, number]> = {
  // Metropolitan France (excluding French Guiana)
  France: [-5.15, 41.3, 9.56, 51.15],
  // Metropolitan Netherlands (excluding Caribbean islands)
  Netherlands: [3.36, 50.75, 7.23, 53.55],
  // Mainland Portugal (excluding Azores/Madeira)
  Portugal: [-9.53, 36.96, -6.19, 42.15],
  // Mainland Spain (excluding Canary Islands)
  Spain: [-9.3, 36.0, 3.32, 43.79],
};

function isPointInPolygonRing(lat: number, lon: number, ring: readonly (readonly [number, number])[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [latI, lonI] = ring[i];
    const [latJ, lonJ] = ring[j];
    const intersect =
      latI > lat !== latJ > lat &&
      lon < ((lonJ - lonI) * (lat - latI)) / (latJ - latI) + lonI;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function isPointOnGlobalLandmass(lat: number, lon: number): boolean {
  for (const ring of WORLD_CONTINENTS) {
    if (isPointInPolygonRing(lat, lon, ring)) {
      return true;
    }
  }
  return false;
}

/**
 * Determine the oceanic basin for maritime coordinates
 */
function resolveOceanicBasin(lat: number, lng: number): ResolvedGlobePlace {
  let name = 'Global Ocean';
  let region = 'Marine Biosphere';

  if (lat > 66) {
    name = 'Arctic Ocean';
    region = 'Polar Maritime Basin';
  } else if (lat < -60) {
    name = 'Southern Ocean';
    region = 'Antarctic Circumpolar Current';
  } else if (lat >= 30 && lat <= 46 && lng >= -6 && lng <= 36) {
    name = 'Mediterranean Sea';
    region = 'Mediterranean Basin';
  } else if (lat >= 9 && lat <= 24 && lng >= -88 && lng <= -60) {
    name = 'Caribbean Sea';
    region = 'Tropical Atlantic Basin';
  } else if (lat >= 12 && lat <= 30 && lng >= 32 && lng <= 44) {
    name = 'Red Sea';
    region = 'Rift Marine Basin';
  } else if (lat >= 23 && lat <= 30 && lng >= 48 && lng <= 57) {
    name = 'Persian Gulf';
    region = 'Arabian Gulf Basin';
  } else if (lat >= 0 && lat <= 30 && lng >= 50 && lng <= 78) {
    name = 'Arabian Sea';
    region = 'North Indian Ocean';
  } else if (lat >= 5 && lat <= 23 && lng >= 80 && lng <= 95) {
    name = 'Bay of Bengal';
    region = 'North Indian Ocean';
  } else if (lng >= -70 && lng <= 20) {
    name = lat >= 0 ? 'North Atlantic Ocean' : 'South Atlantic Ocean';
    region = 'Atlantic Ocean Basin';
  } else if (lng >= 20 && lng <= 100 && lat <= 30) {
    name = 'Indian Ocean';
    region = 'Indian Ocean Basin';
  } else {
    name = lat >= 0 ? 'North Pacific Ocean' : 'South Pacific Ocean';
    region = 'Pacific Ocean Basin';
  }

  return {
    name,
    country: 'International Waters',
    countryCode: 'OCEAN',
    region,
    isCity: false,
    isMarine: true,
  };
}

/**
 * Main reverse-geocoding engine for globe interaction.
 * Evaluates in priority order:
 * 1. Rendered MapLibre vector features (if a city/country label was clicked)
 * 2. Proximity to global urban anchors (~160km radius)
 * 3. Landmass containment & country boundary centroids
 * 4. Oceanic and marine basin mapping
 */
export function resolveGlobePlace(
  lat: number,
  lng: number,
  renderedFeatures?: Array<{ properties?: Record<string, unknown> }>
): ResolvedGlobePlace {
  // 1. Check if rendered features on screen contain a place label
  if (renderedFeatures && renderedFeatures.length > 0) {
    for (const feat of renderedFeatures) {
      const props = feat.properties;
      if (props) {
        const placeName =
          props.name_en ||
          props.name ||
          props['name:latin'] ||
          props.name_int ||
          props.name_s ||
          props.nameascii;

        if (typeof placeName === 'string' && placeName.trim().length > 1) {
          const cleanName = placeName.trim();
          const matchedCountry = WORLD_COUNTRIES.find(
            (c) => c.name.toLowerCase() === cleanName.toLowerCase()
          );
          if (matchedCountry) {
            return {
              name: matchedCountry.name,
              country: matchedCountry.name,
              countryCode: matchedCountry.code === '-99' ? 'TERR' : matchedCountry.code,
              region: 'National Territory',
              isCity: false,
              isMarine: false,
            };
          }
          return {
            name: cleanName,
            country: String(props.country || props.adm0name || 'Regional Territory'),
            countryCode: String(props.iso_a2 || props.country_code || 'TERR').toUpperCase(),
            region: 'Geographic Region',
            isCity: true,
            isMarine: false,
          };
        }
      }
    }
  }

  // 2. Proximity check to key urban anchors (~1.8° ≈ 180km)
  const nearbyAnchor = GLOBAL_CITY_ANCHORS.find((c) => {
    const dLat = c.lat - lat;
    const dLng = (c.lng - lng) * Math.cos((lat * Math.PI) / 180);
    return Math.hypot(dLat, dLng) < 1.8;
  });

  if (nearbyAnchor) {
    return {
      name: nearbyAnchor.name,
      country: nearbyAnchor.country,
      countryCode: nearbyAnchor.countryCode,
      region: nearbyAnchor.region,
      isCity: true,
      isMarine: false,
    };
  }

  // 3. Check if coordinate falls on continental landmass or island
  const onLand = isPointOnGlobalLandmass(lat, lng);

  // If not on land, immediately map to ocean
  if (!onLand) {
    return resolveOceanicBasin(lat, lng);
  }

  // 4. Country bounding box matching on land
  const matchingCountries = WORLD_COUNTRIES.filter((c: CountryMeta) => {
    const bbox = COUNTRY_BBOX_OVERRIDES[c.name] ?? c.bbox;
    const [minLon, minLat, maxLon, maxLat] = bbox;
    return lng >= minLon && lat >= minLat && lng <= maxLon && lat <= maxLat;
  });

  if (matchingCountries.length > 0) {
    let closestCountry = matchingCountries[0];
    let minDistance = Infinity;

    for (const c of matchingCountries) {
      const dLat = c.lat - lat;
      const dLng = (c.lon - lng) * Math.cos((lat * Math.PI) / 180);
      const dist = Math.hypot(dLat, dLng);
      if (dist < minDistance) {
        minDistance = dist;
        closestCountry = c;
      }
    }

    return {
      name: closestCountry.name,
      country: closestCountry.name,
      countryCode: closestCountry.code === '-99' ? 'TERR' : closestCountry.code,
      region: 'National Territory',
      isCity: false,
      isMarine: false,
    };
  }

  // Fallback to Oceanic / Marine Basin
  return resolveOceanicBasin(lat, lng);
}
