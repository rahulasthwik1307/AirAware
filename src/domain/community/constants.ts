/**
 * AirAware Community & Alerts Constants
 * Standard CPCB classification taxonomies, GRAP stage definitions,
 * and scientific airshed benchmarks for Indian winter smog.
 */

import { IncidentCategory, IncidentCategoryMeta, HistoricalAirshedPoint } from './types';

export const INCIDENT_CATEGORIES: Record<IncidentCategory, IncidentCategoryMeta> = {
  WASTE_BURNING: {
    category: 'WASTE_BURNING',
    label: 'Open Garbage Burning',
    icon: '🗑️',
    cpcbClassification: 'Solid Waste Burning / Section 19(5) Air Act',
    healthImpact: 'Releases toxic smoke and fine soot directly into the air people breathe.',
    badgeColor: 'text-rose-800 bg-rose-50 border-rose-200',
  },
  CONSTRUCTION_DUST: {
    category: 'CONSTRUCTION_DUST',
    label: 'Road & Construction Dust',
    icon: '🏗️',
    cpcbClassification: 'C&D Waste Rules 2016 / Dust Mitigation Failure',
    healthImpact: 'Heavy mineral dust causing throat irritation, coughing, and breathing difficulty.',
    badgeColor: 'text-amber-800 bg-amber-50 border-amber-200',
  },
  INDUSTRIAL_SMOKE: {
    category: 'INDUSTRIAL_SMOKE',
    label: 'Factory / Industrial Smoke',
    icon: '🏭',
    cpcbClassification: 'Industrial Point Source / Unapproved Fuel Combustion',
    healthImpact: 'Strong chemical fumes and toxic gases released from factory chimneys.',
    badgeColor: 'text-purple-800 bg-purple-50 border-purple-200',
  },
  TRAFFIC_IDLING: {
    category: 'TRAFFIC_IDLING',
    label: 'Heavy Truck / Vehicle Smoke',
    icon: '🚗',
    cpcbClassification: 'Vehicular Emission Hotspot / Jam Stagnation',
    healthImpact: 'Dense black diesel exhaust trapped at street level in heavy traffic.',
    badgeColor: 'text-orange-800 bg-orange-50 border-orange-200',
  },
  LEAF_BURNING: {
    category: 'LEAF_BURNING',
    label: 'Dry Leaves & Garden Burning',
    icon: '🍂',
    cpcbClassification: 'Biomass Burning / NGT Prohibition Violation',
    healthImpact: 'Heavy surface smoke that irritates eyes and enters nearby homes.',
    badgeColor: 'text-amber-800 bg-amber-50 border-amber-200',
  },
  OTHER: {
    category: 'OTHER',
    label: 'Other Smoke or Dust Hazard',
    icon: '⚠️',
    cpcbClassification: 'General Environmental Nuisance / Local Airshed Threat',
    healthImpact: 'Visible pollution accumulation trapped by cold winter air near the ground.',
    badgeColor: 'text-slate-800 bg-slate-50 border-slate-200',
  },
};

export const GRAP_STAGES = [
  {
    stage: 'Stage I',
    name: 'Poor Air Quality (AQI 201–300)',
    restrictions: [
      'Strict ban on open burning of garbage and biomass',
      'Water sprinkling on unpaved roads and dust control at construction sites',
      'Anti-dust guidelines enforcement at construction sites > 500 sq meters',
    ],
    citizenGuidance: 'Avoid dry sweeping; report waste burning on CPCB Sameer.',
  },
  {
    stage: 'Stage II',
    name: 'Very Poor Air Quality (AQI 301–400)',
    restrictions: [
      'Ban on diesel generator sets (except essential emergency services)',
      'Enhanced parking fees to discourage private vehicular transit',
      'Increase electric metro and public bus trip frequency by 20%',
    ],
    citizenGuidance: 'Switch daily commutes to electric metro or carpool; seal drafts.',
  },
  {
    stage: 'Stage III',
    name: 'Severe Air Quality (AQI 401–450)',
    restrictions: [
      'Strict halt on non-essential construction and demolition activities',
      'Ban on BS-III petrol and BS-IV diesel 4-wheelers in Delhi NCR',
      'Primary schools hybrid or remote classes advised',
    ],
    citizenGuidance: 'Vulnerable members stay indoors in HEPA-filtered rooms; wear N95.',
  },
  {
    stage: 'Stage IV',
    name: 'Severe+ / Emergency Air Quality (AQI > 450)',
    restrictions: [
      'Ban on entry of non-essential trucks into municipal limits',
      'Closure of stone crushers, brick kilns, and mining operations',
      '50% work-from-home mandate across government and corporate offices',
    ],
    citizenGuidance: 'Complete emergency indoor air sanctuary protocol; zero outdoor exertion.',
  },
];

export const DEFAULT_HISTORICAL_TREND: readonly HistoricalAirshedPoint[] = [];
