/**
 * AirAware — Authoritative Telemetry & Environmental Domain Constants
 */

// Timeouts
export const TELEMETRY_FETCH_TIMEOUT_MS = 12000; // 12 seconds abort limit for external weather/AQI endpoints

// Cache TTLs
export const TELEMETRY_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes client SWR cache TTL (aligned with Open-Meteo update cadence)
export const OPEN_METEO_REVALIDATE_SECONDS = 600; // 10 minutes Next.js CDN cache revalidation
export const OPEN_METEO_STALE_WHILE_REVALIDATE_SECONDS = 300; // 5 minutes stale grace period

// Search Radii & Distance Bounds
export const OPENAQ_MAX_SEARCH_RADIUS_KM = 25; // 25 km max acceptable radius for ground station physical sensor fallback

// Environmental & Health Thresholds
export const CPCB_PM25_SAFE_LIMIT_UG_M3 = 60; // 60 µg/m³ 24-hour safe threshold under Indian NAAQS
export const CPCB_PM10_SAFE_LIMIT_UG_M3 = 100; // 100 µg/m³ 24-hour safe threshold under Indian NAAQS
export const WHO_PM25_ANNUAL_UG_M3 = 15; // 15 µg/m³ 24-hour guideline under WHO Global Air Quality Guidelines 2021
export const WHO_PM10_ANNUAL_UG_M3 = 45; // 45 µg/m³ 24-hour guideline under WHO Global Air Quality Guidelines 2021

export const MODERATE_AQI_THRESHOLD = 100; // AQI 100 upper boundary for satisfactory / acceptable air
export const SEVERE_SMOG_AQI_THRESHOLD = 300; // AQI 300 CPCB emergency action threshold (GRAP Stage III/IV)
export const CRITICAL_EMERGENCY_AQI_THRESHOLD = 400; // AQI 400 severe emergency threshold

// Daily Timing & Diurnal Inversion
export const INVERSION_MORNING_CUTOFF_HOUR = 9; // 09:00 AM diurnal radiation inversion dissipation hour
export const SOLAR_PEAK_VENTILATION_START_HOUR = 13; // 13:00 (1 PM) optimal window opening start
export const SOLAR_PEAK_VENTILATION_END_HOUR = 15; // 15:00 (3 PM) solar boundary layer peak dilution
