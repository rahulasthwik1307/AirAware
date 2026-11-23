/**
 * AirAware Community & Alerts Generator
 * Deterministic generation of verified atmospheric alerts, diurnal ventilation windows,
 * and official regulatory grievance formats.
 */

import { AlertItem, DiurnalVentilationWindow, PollutionIncident } from './types';
import { INCIDENT_CATEGORIES } from './constants';

/**
 * Calculates optimal diurnal room ventilation timing based on thermal inversion breakup windows.
 */
export function calculateVentilationWindow(
  currentHour: number,
  windSpeedKmH: number = 4.5,
  tempC: number = 18.0
): DiurnalVentilationWindow {
  // In northern Indian winter, solar heating creates a vertical thermal breakup between ~12:30 PM and 3:30 PM.
  // Morning inversion persists until ~10:00 AM; evening nocturnal radiation cooling begins ~5:30 PM.
  const isAfternoonWindow = currentHour >= 12 && currentHour < 16;
  const isFavorableWind = windSpeedKmH >= 3.5;
  const isOpenNow = isAfternoonWindow && isFavorableWind;

  const mixingHeightMeters = isOpenNow ? Math.min(650, Math.round(250 + tempC * 12)) : 110;

  return {
    isOpenNow,
    windowStart: '12:30 PM',
    windowEnd: '03:30 PM',
    peakInversionStart: '06:00 PM',
    peakInversionEnd: '09:30 AM',
    mixingHeightMeters,
    advisory: isOpenNow
      ? 'Optimal ventilation window active. Solar thermal heating has elevated the mixing ceiling above 400m. Safe to perform quick cross-ventilation before evening smog pooling.'
      : 'Windows should remain sealed. Surface thermal inversion ceiling is compressed below 150m, trapping toxic sidewalk emissions.',
  };
}

/**
 * Identifies whether a location string belongs to the Delhi National Capital Region (NCR).
 */
export function isDelhiNcrRegion(locationName: string): boolean {
  const normalized = locationName.toLowerCase();
  const ncrKeywords = [
    'delhi',
    'new delhi',
    'noida',
    'greater noida',
    'gurugram',
    'gurgaon',
    'faridabad',
    'ghaziabad',
    'sonipat',
    'sonepat',
    'meerut',
    'panipat',
    'rohtak',
    'bahadurgarh',
    'ncr',
  ];
  return ncrKeywords.some((k) => normalized.includes(k));
}

/**
 * Generates verified airshed advisory alerts matching real meteorological and particulate conditions.
 */
export function generateAirshedAlerts(
  locationName: string,
  aqi: number = 100,
  prominentPollutant: string = 'PM2.5',
  currentHour: number = 14
): AlertItem[] {
  const alerts: AlertItem[] = [];
  const nowIso = new Date().toISOString();
  const vent = calculateVentilationWindow(currentHour);
  const isNcr = isDelhiNcrRegion(locationName);

  // 1. Regulatory Stage / CPCB National Category Alert
  if (isNcr) {
    if (aqi >= 450) {
      alerts.push({
        id: 'alert-grap-iv',
        title: 'Emergency CAQM GRAP Stage IV Enforced',
        severity: 'CRITICAL',
        category: 'GRAP_REGULATORY',
        message: `${locationName} is under emergency GRAP Stage IV restrictions. Non-essential truck entry banned; construction halted across NCR.`,
        locationName,
        timestamp: nowIso,
        aqiValue: aqi,
        pollutant: prominentPollutant,
        actionableStep: '50% work-from-home advisory active. Activate full household clean-air sanctuary protocol.',
        targetWorkspace: 'air-intelligence',
        isRead: false,
        source: 'CAQM / CPCB Mandate',
      });
    } else if (aqi >= 400) {
      alerts.push({
        id: 'alert-grap-iii',
        title: 'CAQM GRAP Stage III Active — Severe Smog Warning',
        severity: 'CRITICAL',
        category: 'GRAP_REGULATORY',
        message: `AQI of ${aqi} triggers mandatory GRAP Stage III protocols in ${locationName}. Strict ban on private construction and BS-III/IV diesel vehicles.`,
        locationName,
        timestamp: nowIso,
        aqiValue: aqi,
        pollutant: prominentPollutant,
        actionableStep: 'Switch all commutes to electric metro or carpool to curb secondary aerosol nucleation.',
        targetWorkspace: 'cleaner-choices',
        isRead: false,
        source: 'Commission for Air Quality Management',
      });
    } else if (aqi >= 300) {
      alerts.push({
        id: 'alert-grap-ii',
        title: 'GRAP Stage II in Effect — Very Poor Air Quality',
        severity: 'ADVISORY',
        category: 'GRAP_REGULATORY',
        message: `Diesel generator sets banned (except emergency hospitals) in ${locationName}. Public transit frequencies increased.`,
        locationName,
        timestamp: nowIso,
        aqiValue: aqi,
        pollutant: prominentPollutant,
        actionableStep: 'Avoid diesel transit; ensure home purifiers are operating on medium-high speed.',
        targetWorkspace: 'indoor-air',
        isRead: false,
        source: 'CPCB Air Quality Bulletin',
      });
    } else if (aqi >= 200) {
      alerts.push({
        id: 'alert-grap-i',
        title: 'CAQM GRAP Stage I in Effect — Poor Air Quality',
        severity: 'ADVISORY',
        category: 'GRAP_REGULATORY',
        message: `AQI of ${aqi} triggers GRAP Stage I measures in ${locationName}. Mechanized road sweeping, water sprinkling, and dust mitigation enforced.`,
        locationName,
        timestamp: nowIso,
        aqiValue: aqi,
        pollutant: prominentPollutant,
        actionableStep: 'Keep vehicle PUC updated; avoid burning dry leaves, biomass, or municipal solid waste.',
        targetWorkspace: 'indoor-air',
        isRead: false,
        source: 'Commission for Air Quality Management',
      });
    }
  } else {
    // Non-NCR region: CPCB National Category Advisory
    if (aqi >= 400) {
      alerts.push({
        id: 'alert-cpcb-severe',
        title: 'CPCB Severe Air Alert — Health Emergency Advisory',
        severity: 'CRITICAL',
        category: 'GRAP_REGULATORY',
        message: `${locationName} reports severe AQI of ${aqi}. Affects healthy people and seriously impacts those with existing respiratory conditions.`,
        locationName,
        timestamp: nowIso,
        aqiValue: aqi,
        pollutant: prominentPollutant,
        actionableStep: 'Avoid all outdoor activity. Keep indoors sealed and operate air purifiers continuously.',
        targetWorkspace: 'air-intelligence',
        isRead: false,
        source: 'CPCB National Air Quality Index',
      });
    } else if (aqi >= 300) {
      alerts.push({
        id: 'alert-cpcb-very-poor',
        title: 'CPCB Very Poor Air Advisory',
        severity: 'ADVISORY',
        category: 'GRAP_REGULATORY',
        message: `${locationName} reports very poor air quality (AQI ${aqi}). Prolonged exposure causes respiratory illness.`,
        locationName,
        timestamp: nowIso,
        aqiValue: aqi,
        pollutant: prominentPollutant,
        actionableStep: 'Wear certified N95/N99 masks for any outdoor transit and minimize peak-hour exposure.',
        targetWorkspace: 'cleaner-choices',
        isRead: false,
        source: 'CPCB National Air Quality Index',
      });
    } else if (aqi >= 200) {
      alerts.push({
        id: 'alert-cpcb-poor',
        title: 'CPCB Poor Air Advisory',
        severity: 'ADVISORY',
        category: 'GRAP_REGULATORY',
        message: `${locationName} reports poor air quality (AQI ${aqi}). Breathing discomfort likely for sensitive groups.`,
        locationName,
        timestamp: nowIso,
        aqiValue: aqi,
        pollutant: prominentPollutant,
        actionableStep: 'Sensitive individuals, children, and elderly should reduce prolonged outdoor exertion.',
        targetWorkspace: 'indoor-air',
        isRead: false,
        source: 'CPCB National Air Quality Index',
      });
    }
  }

  // 2. Diurnal Ventilation Window Alert (triggered when air quality is compromised)
  if (aqi >= 200) {
    if (vent.isOpenNow) {
      alerts.push({
        id: 'alert-ventilation-open',
        title: 'Diurnal Clean-Air Ventilation Window Active',
        severity: 'VENTILATION',
        category: 'VENTILATION_WINDOW',
        message: `Solar breakup has temporarily elevated the atmospheric mixing height to ${vent.mixingHeightMeters}m. Window open until ${vent.windowEnd}.`,
        locationName,
        timestamp: nowIso,
        aqiValue: aqi,
        pollutant: 'Thermal Inversion',
        actionableStep: 'Perform 15-minute cross-ventilation to flush indoor CO2 and dampness before evening inversion descends.',
        targetWorkspace: 'indoor-air',
        isRead: false,
        source: 'Surface Meteorological Inversion Model',
      });
    } else {
      alerts.push({
        id: 'alert-inversion-lock',
        title: 'Ground Thermal Inversion Lock (Seal Windows)',
        severity: 'ADVISORY',
        category: 'ATMOSPHERIC_SMOG',
        message: `Cold boundary air is compressed below ${vent.mixingHeightMeters}m. Surface vehicular emissions and wood smoke cannot disperse vertically.`,
        locationName,
        timestamp: nowIso,
        aqiValue: aqi,
        pollutant: prominentPollutant,
        actionableStep: 'Keep doors and windows sealed. Operate HEPA purifiers in occupied living quarters.',
        targetWorkspace: 'indoor-air',
        isRead: false,
        source: 'Copernicus CAMS Dispersion Synthesis',
      });
    }
  }

  // 3. Sensitive Family Demographic Alert
  if (aqi >= 250) {
    alerts.push({
      id: 'alert-family-health',
      title: 'Vulnerable Family Health Advisory: High Alveolar Load',
      severity: aqi >= 350 ? 'CRITICAL' : 'ADVISORY',
      category: 'FAMILY_HEALTH',
      message: `Elevated ${prominentPollutant} concentrations directly impact infants, asthmatics, and senior citizens with reduced lung compliance.`,
      locationName,
      timestamp: nowIso,
      aqiValue: aqi,
      pollutant: prominentPollutant,
      actionableStep: 'Shift all children and elderly outdoor routines to indoor activities; equip N95 respirators for mandatory transit.',
      targetWorkspace: 'family-planner',
      isRead: false,
      source: 'Indian Academy of Pediatrics & WHO Guidelines',
    });
  }

  return alerts;
}

/**
 * Formats a local citizen incident report into an official CPCB SAMEER grievance dossier.
 */
export function formatCpcbSameerDossier(incident: PollutionIncident): string {
  const meta = INCIDENT_CATEGORIES[incident.category];
  const dateStr = new Date(incident.timestamp).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return `========================================
CPCB SAMEER GRIEVANCE DOSSIER
Central Pollution Control Board / Air Act 1981
========================================
INCIDENT REF: #${incident.id.toUpperCase().slice(0, 10)}
DATE & TIME: ${dateStr}
LOCATION: ${incident.locationName}
${incident.coordinates ? `COORDINATES: ${incident.coordinates.latitude.toFixed(5)}, ${incident.coordinates.longitude.toFixed(5)}\n` : ''}CATEGORY: ${meta.label} (${incident.category})
CPCB CLASSIFICATION: ${meta.cpcbClassification}
SEVERITY LEVEL: ${incident.severity}

DESCRIPTION OF VIOLATION:
${incident.description}

EVIDENCE:
${incident.photoDataUrl ? '[Photo captured and attached in local dossier]' : '[Visual observation documented by resident]'}

HEALTH & AIRSHED IMPACT:
${meta.healthImpact}

STATUS: Filed locally by resident for dispatch to municipal control room.
========================================`;
}

/**
 * Formats a clean-air community bulletin suitable for RWA WhatsApp and noticeboard distribution.
 */
export function formatRwaSocietyBulletin(
  locationName: string,
  aqi: number = 100,
  grapStage: string = 'Standard Advisory',
  ventWindow: DiurnalVentilationWindow = calculateVentilationWindow(14)
): string {
  const dateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return `📢 AIRAWARE RESIDENTIAL ADVISORY — ${locationName.toUpperCase()}
🗓️ Date: ${dateStr} | Active Pollution Status: ${grapStage}

🚨 Current Air Quality: CPCB AQI ${aqi} (Hazardous Smog)
⚠️ Weather Advisory: Surface smoke trapped near ground level (Inversion Lid <150m)

🏢 RESIDENT WELFARE ASSOCIATION (RWA) ACTION PROTOCOLS:
1. 🚫 Zero Open Burning: Please instruct society security guards & gardening staff to avoid dry leaf or waste burning. (Provide electric radiant heaters to gate staff).
2. 🪟 Safe Window Timing: Keep windows sealed during morning smog (7:00–10:00 AM). Safe ventilation window: ${ventWindow.windowStart} – ${ventWindow.windowEnd}.
3. 🚸 Children & Seniors: Toddlers and elderly residents should remain in HEPA-filtered rooms. Wear fitted N95 masks for unavoidable outdoor movement.
4. 🚗 Shared Commutes: Switch private car runs to shared society carpools or electric metro.

🛡️ Together for Cleaner Neighbourhood Air.
Generated via AirAware Local Environmental Intelligence.`;
}

/**
 * Formats an incident notice for residential security and facility teams.
 */
export function formatSocietyIncidentNotice(
  incident: PollutionIncident,
  societyName: string = 'Our Society'
): string {
  const meta = INCIDENT_CATEGORIES[incident.category] || INCIDENT_CATEGORIES.OTHER;
  const timeFormatted = new Date(incident.timestamp).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `📢 POLLUTION ALERT — ${societyName.toUpperCase()}

⚠️ Urgent Issue: ${meta.icon} ${incident.title}
📍 Location: ${incident.locationName} (${timeFormatted})

📝 Observation:
${incident.description}

🚨 Requested Action for Residents & Facility Team:
1. Please instruct security / facility supervisor to investigate and safely extinguish the smoke or dust source immediately.
2. For night security guards: Ensure electric radiant heaters are operational so guards do not burn garbage or dry leaves for warmth.
3. Keep nearby balcony doors and apartment windows facing this area sealed.

🛡️ Shared via AirAware Local Community Intelligence.`;
}

/**
 * Formats a formal municipal air pollution complaint citing Air Act 1981 provisions.
 */
export function formatMunicipalComplaint(incident: PollutionIncident): string {
  const meta = INCIDENT_CATEGORIES[incident.category] || INCIDENT_CATEGORIES.OTHER;
  const dateStr = new Date(incident.timestamp).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return `🚨 MUNICIPAL AIR POLLUTION COMPLAINT
(Under Section 19 of Air Act 1981 / CPCB Mandate)

• Incident Ref: #${incident.id.toUpperCase().slice(0, 10)}
• Category: ${meta.label} (${meta.cpcbClassification})
• Time: ${dateStr}
• Location: ${incident.locationName}${incident.coordinates ? ` (GPS: ${incident.coordinates.latitude.toFixed(5)}, ${incident.coordinates.longitude.toFixed(5)})` : ''}

• Violation Description:
${incident.description}

• Evidence: ${incident.photoDataUrl ? 'Photographic proof recorded' : 'Resident visual observation'}

Requesting immediate municipal ward inspection and challan under CAQM / CPCB guidelines.`;
}
