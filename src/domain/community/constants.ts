/**
 * AirAware Community & Alerts Constants
 * Standard CPCB classification taxonomies, GRAP stage definitions,
 * and scientific airshed benchmarks for Indian winter smog.
 */

import { IncidentCategory, IncidentCategoryMeta, HistoricalAirshedPoint } from './types';

export const INCIDENT_CATEGORIES: Record<IncidentCategory, IncidentCategoryMeta> = {
  WASTE_BURNING: {
    category: 'WASTE_BURNING',
    label: 'Municipal Solid Waste Burning',
    icon: '🗑️',
    cpcbClassification: 'Solid Waste Burning / Section 19(5) Air Act',
    healthImpact: 'Releases dioxins, furans, and toxic black carbon at ground breathing height.',
    badgeColor: 'text-rose-800 bg-rose-50 border-rose-200',
  },
  CONSTRUCTION_DUST: {
    category: 'CONSTRUCTION_DUST',
    label: 'Uncovered Construction Dust',
    icon: '🏗️',
    cpcbClassification: 'C&D Waste Rules 2016 / Dust Mitigation Failure',
    healthImpact: 'Coarse and fine silica particles causing acute upper respiratory distress.',
    badgeColor: 'text-amber-800 bg-amber-50 border-amber-200',
  },
  INDUSTRIAL_SMOKE: {
    category: 'INDUSTRIAL_SMOKE',
    label: 'Industrial Stack Emissions',
    icon: '🏭',
    cpcbClassification: 'Industrial Point Source / Unapproved Fuel Combustion',
    healthImpact: 'High concentrations of SO2, toxic VOCs, and heavy chemical aerosols.',
    badgeColor: 'text-purple-800 bg-purple-50 border-purple-200',
  },
  TRAFFIC_IDLING: {
    category: 'TRAFFIC_IDLING',
    label: 'Heavy Commercial Vehicle Idling',
    icon: '🚗',
    cpcbClassification: 'Vehicular Emission Hotspot / Jam Stagnation',
    healthImpact: 'Concentrated tailpipe NOx and unburnt diesel soot in sidewalk corridors.',
    badgeColor: 'text-orange-800 bg-orange-50 border-orange-200',
  },
  LEAF_BURNING: {
    category: 'LEAF_BURNING',
    label: 'Horticultural Biomass / Leaf Burning',
    icon: '🍂',
    cpcbClassification: 'Biomass Burning / NGT Prohibition Violation',
    healthImpact: 'Dense surface smoke trapping carbon monoxide in residential gardens.',
    badgeColor: 'text-amber-800 bg-amber-50 border-amber-200',
  },
  OTHER: {
    category: 'OTHER',
    label: 'Other Visible Emission Hazard',
    icon: '⚠️',
    cpcbClassification: 'General Environmental Nuisance / Local Airshed Threat',
    healthImpact: 'Localized ground-level pollutant accumulation under thermal inversion.',
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

export const DEFAULT_HISTORICAL_TREND: readonly HistoricalAirshedPoint[] = [
  {
    date: '2026-11-14',
    dayLabel: 'Fri 14',
    aqi: 284,
    pm25: 142.5,
    nox: 54.2,
    inversionCeilingMeters: 280,
    isSevereDay: false,
  },
  {
    date: '2026-11-15',
    dayLabel: 'Sat 15',
    aqi: 318,
    pm25: 174.0,
    nox: 68.1,
    inversionCeilingMeters: 210,
    isSevereDay: false,
  },
  {
    date: '2026-11-16',
    dayLabel: 'Sun 16',
    aqi: 356,
    pm25: 215.3,
    nox: 72.4,
    inversionCeilingMeters: 175,
    isSevereDay: false,
  },
  {
    date: '2026-11-17',
    dayLabel: 'Mon 17',
    aqi: 412,
    pm25: 298.0,
    nox: 95.8,
    inversionCeilingMeters: 120,
    isSevereDay: true,
  },
  {
    date: '2026-11-18',
    dayLabel: 'Tue 18',
    aqi: 445,
    pm25: 345.5,
    nox: 112.0,
    inversionCeilingMeters: 95,
    isSevereDay: true,
  },
  {
    date: '2026-11-19',
    dayLabel: 'Wed 19',
    aqi: 388,
    pm25: 275.2,
    nox: 88.4,
    inversionCeilingMeters: 145,
    isSevereDay: false,
  },
  {
    date: '2026-11-20',
    dayLabel: 'Today (Thu)',
    aqi: 378,
    pm25: 262.0,
    nox: 82.5,
    inversionCeilingMeters: 130,
    isSevereDay: false,
  },
];
