/**
 * AirAware World Landmass Coordinate Polygons
 * Simplified, lightweight continental boundary vectors for orthographic projection.
 * Coordinates are [latitude, longitude] pairs.
 */

export type LatLonPoint = readonly [latitude: number, longitude: number];
export type PolygonRing = readonly LatLonPoint[];

export const WORLD_CONTINENTS: readonly PolygonRing[] = [
  // North America
  [
    [71, -156], [71, -128], [69, -100], [60, -64], [50, -56], [44, -64],
    [32, -80], [25, -80], [21, -89], [19, -96], [16, -93], [8, -77],
    [9, -83], [14, -92], [20, -105], [30, -114], [34, -120], [48, -124],
    [58, -136], [60, -145], [64, -165], [71, -156],
  ],
  // South America
  [
    [12, -72], [10, -61], [4, -51], [-4, -36], [-12, -37], [-22, -41],
    [-33, -51], [-45, -66], [-54, -68], [-53, -74], [-42, -74], [-30, -71],
    [-17, -75], [-4, -81], [5, -77], [12, -72],
  ],
  // Europe
  [
    [71, 26], [68, 49], [60, 30], [55, 38], [47, 40], [44, 28],
    [40, 26], [36, -5], [43, -9], [48, -4], [54, 8], [58, 6],
    [64, 10], [71, 26],
  ],
  // United Kingdom & Ireland
  [
    [58, -6], [58, -2], [51, 1], [50, -5], [55, -5], [58, -6],
  ],
  // Africa
  [
    [37, 10], [32, 32], [22, 37], [12, 51], [5, 48], [-11, 40],
    [-26, 33], [-34, 18], [-34, 26], [-22, 14], [-5, 12], [4, 9],
    [5, -1], [5, -10], [15, -17], [28, -13], [35, -6], [36, 1], [37, 10],
  ],
  // Madagascar
  [
    [-12, 49], [-16, 50], [-25, 47], [-25, 43], [-16, 44], [-12, 49],
  ],
  // Asia
  [
    [77, 105], [73, 140], [66, 170], [60, 162], [50, 156], [43, 132],
    [38, 128], [30, 122], [22, 114], [21, 108], [10, 107], [1, 104],
    [14, 101], [22, 89], [13, 80], [8, 77], [20, 73], [24, 67],
    [25, 62], [26, 56], [30, 48], [30, 35], [37, 36], [41, 29],
    [42, 45], [47, 53], [54, 53], [60, 60], [70, 66], [73, 73], [77, 105],
  ],
  // Japan
  [
    [45, 142], [43, 145], [35, 140], [31, 131], [35, 133], [41, 140], [45, 142],
  ],
  // Australia
  [
    [-11, 142], [-15, 145], [-24, 152], [-32, 152], [-38, 146], [-38, 140],
    [-32, 132], [-35, 117], [-22, 114], [-15, 124], [-12, 131], [-11, 142],
  ],
  // New Zealand
  [
    [-35, 173], [-37, 178], [-41, 175], [-46, 168], [-44, 171], [-35, 173],
  ],
  // Greenland
  [
    [83, -30], [82, -18], [76, -18], [65, -40], [60, -44], [64, -52],
    [72, -56], [78, -69], [82, -60], [83, -30],
  ],
  // Antarctica (top perimeter)
  [
    [-65, -64], [-68, -40], [-72, 0], [-66, 40], [-66, 90], [-66, 140],
    [-71, 170], [-74, -170], [-72, -120], [-70, -80], [-65, -64],
  ],
];

/**
 * Global major urban reference coordinates for interactive pins
 */
export interface GlobeCityPin {
  readonly id: number;
  readonly name: string;
  readonly country: string;
  readonly countryCode: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly admin1?: string;
  readonly timezone: string;
}

export const GLOBE_REFERENCE_CITIES: readonly GlobeCityPin[] = [
  {
    id: 1273294,
    name: 'New Delhi',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Delhi (NCR)',
    latitude: 28.6139,
    longitude: 77.209,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 7279746,
    name: 'Noida',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Uttar Pradesh',
    latitude: 28.5355,
    longitude: 77.391,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 1270583,
    name: 'Gurugram',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Haryana',
    latitude: 28.4595,
    longitude: 77.0266,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 1271308,
    name: 'Ghaziabad',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Uttar Pradesh',
    latitude: 28.6692,
    longitude: 77.4538,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 1260086,
    name: 'Patna',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Bihar',
    latitude: 25.5941,
    longitude: 85.1376,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 1264733,
    name: 'Lucknow',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Uttar Pradesh',
    latitude: 26.8467,
    longitude: 80.9462,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 1275004,
    name: 'Kolkata',
    country: 'India',
    countryCode: 'IN',
    admin1: 'West Bengal',
    latitude: 22.5726,
    longitude: 88.3639,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 1275339,
    name: 'Mumbai',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Maharashtra',
    latitude: 19.076,
    longitude: 72.8777,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 1277333,
    name: 'Bengaluru',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Karnataka',
    latitude: 12.9716,
    longitude: 77.5946,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 1269843,
    name: 'Hyderabad',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Telangana',
    latitude: 17.385,
    longitude: 78.4867,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 2643743,
    name: 'London',
    country: 'United Kingdom',
    countryCode: 'GB',
    admin1: 'England',
    latitude: 51.5085,
    longitude: -0.1257,
    timezone: 'Europe/London',
  },
  {
    id: 1850147,
    name: 'Tokyo',
    country: 'Japan',
    countryCode: 'JP',
    admin1: 'Tokyo',
    latitude: 35.6895,
    longitude: 139.6917,
    timezone: 'Asia/Tokyo',
  },
];
