import { RoomProfile } from './types';

export const STANDARD_ROOM_PROFILES: readonly RoomProfile[] = [
  {
    id: 'living_room',
    name: 'Living Room',
    defaultAreaM2: 22,
    ceilingHeightM: 2.7,
    icon: '🛋️',
    tag: 'Shared Breathing Zone',
    primaryPollutantRisks: [
      {
        pollutant: 'Resuspended Dust & PM10',
        source: 'Foot traffic, vacuuming without sealed exhaust, and upholstered furniture',
        severity: 'moderate',
      },
      {
        pollutant: 'Outdoor Smog Infiltration',
        source: 'Frequent balcony and exterior door openings during evening inversions',
        severity: 'high',
      },
    ],
    practicalMitigations: [
      {
        action: 'Damp-wipe surfaces and mop hard floors',
        detail: 'Dry brooms resuspend settled particles back into the breathing zone for 2–4 hours.',
      },
      {
        action: 'Inspect perimeter weatherstripping',
        detail: 'Draft stoppers and window seals reduce uncontrolled outdoor smog infiltration by 30–50%.',
      },
      {
        action: 'Position air cleaner in central airflow path',
        detail: 'Avoid tucking purifiers behind curtains or deep inside sofa corners where circulation is blocked.',
      },
    ],
    filtrationAdvice: 'Maintain continuous medium airflow during daytime; ensure pre-filter is vacuumed monthly to preserve CADR.',
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    defaultAreaM2: 12,
    ceilingHeightM: 2.7,
    icon: '🍳',
    tag: 'Combustion & Aerosol Zone',
    primaryPollutantRisks: [
      {
        pollutant: 'Nitrogen Dioxide (NO2) & Carbon Monoxide',
        source: 'Unvented natural gas or LPG combustion burners',
        severity: 'high',
      },
      {
        pollutant: 'Ultrafine Particulates & Cooking Fumes',
        source: 'High-temperature oil frying, sautéing, and charring',
        severity: 'high',
      },
    ],
    practicalMitigations: [
      {
        action: 'Run exhaust hood before and after cooking',
        detail: 'Turn range hood on 2 minutes before lighting flame and keep running 10–15 minutes after cooking completes.',
      },
      {
        action: 'Cook on rear burners under the hood canopy',
        detail: 'Rear burners capture up to 70% more cooking fumes than front burners under standard over-the-range hoods.',
      },
      {
        action: 'Isolate kitchen from bedrooms during frying',
        detail: 'Close interior doors to prevent fine oil aerosols from migrating and settling on bedroom fabrics.',
      },
    ],
    filtrationAdvice: 'Dedicated ducted range hoods provide primary source capture. Standalone room purifiers require activated carbon to capture gaseous NO2.',
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    defaultAreaM2: 16,
    ceilingHeightM: 2.7,
    icon: '🛏️',
    tag: '8-Hour Rest & Exposure Zone',
    primaryPollutantRisks: [
      {
        pollutant: 'Nocturnal CO2 Accumulation',
        source: 'Closed doors and windows with continuous occupant respiration',
        severity: 'moderate',
      },
      {
        pollutant: 'Outdoor Inversion Smog',
        source: 'Nighttime surface cooling trapping particulate smog near ground level',
        severity: 'high',
      },
    ],
    practicalMitigations: [
      {
        action: 'Keep interior bedroom door slightly ajar',
        detail: 'Allows air exchange with the rest of the dwelling to prevent sleeping CO2 levels from exceeding 1,200 ppm.',
      },
      {
        action: 'Size purifier with a quiet-mode margin',
        detail: 'Choose a purifier rated for a larger room so it delivers 3–4 ACH on low/sleep fan mode without sleep-disrupting noise.',
      },
      {
        action: 'Wash bedding in hot water (55°C+)',
        detail: 'Reduces biological dust mite allergens without introducing chemical disinfectant sprays.',
      },
    ],
    filtrationAdvice: 'HEPA air cleaner operated continuously on quiet mode provides uninterrupted breathing zone particulate protection.',
  },
  {
    id: 'study',
    name: 'Study / Home Office',
    defaultAreaM2: 14,
    ceilingHeightM: 2.7,
    icon: '📚',
    tag: 'Cognitive Focus Space',
    primaryPollutantRisks: [
      {
        pollutant: 'Elevated Carbon Dioxide (CO2)',
        source: 'Enclosed workspace respiration causing drowsiness and reduced cognitive throughput',
        severity: 'moderate',
      },
      {
        pollutant: 'Electronics & Printer VOCs',
        source: 'Laser printer fusers and warm plastic electronic enclosures',
        severity: 'moderate',
      },
    ],
    practicalMitigations: [
      {
        action: 'Brief airing when outdoor conditions permit',
        detail: 'A 5–10 minute cross-ventilation flush during cleaner outdoor hours rapidly drops indoor CO2.',
      },
      {
        action: 'Separate printing equipment from desk',
        detail: 'Position laser printers at least 1.5 meters away from the primary seated breathing zone.',
      },
    ],
    filtrationAdvice: 'Compact portable HEPA filtration unit maintains clean ambient air and low particulate loading.',
  },
];

/**
 * Returns the list of standard residential room profiles with typical floor areas and indoor pollution risks.
 */
export function getStandardRoomProfiles(): readonly RoomProfile[] {
  return STANDARD_ROOM_PROFILES;
}
