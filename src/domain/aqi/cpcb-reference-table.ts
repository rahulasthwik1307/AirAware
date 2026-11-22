/**
 * AirAware — Official Indian CPCB NAQI Reference Table & Guidance Rules
 *
 * Authoritative Central Pollution Control Board (CPCB) National Air Quality Index (NAQI)
 * 6-band standard and official health impact statements for Indian airsheds.
 */

export interface CpcbBandDefinition {
  readonly category: 'Good' | 'Satisfactory' | 'Moderate' | 'Poor' | 'Very Poor' | 'Severe';
  readonly minAqi: number;
  readonly maxAqi: number;
  readonly pm25Range: string;
  readonly pm10Range: string;
  readonly officialHealthStatement: string;
  readonly familyGuidance: string;
}

export const OFFICIAL_CPCB_BANDS: readonly CpcbBandDefinition[] = [
  {
    category: 'Good',
    minAqi: 0,
    maxAqi: 50,
    pm25Range: '0–30 µg/m³',
    pm10Range: '0–50 µg/m³',
    officialHealthStatement: 'Minimal impact',
    familyGuidance: 'Ideal for all outdoor activities, natural room ventilation, and morning exercise.',
  },
  {
    category: 'Satisfactory',
    minAqi: 51,
    maxAqi: 100,
    pm25Range: '31–60 µg/m³',
    pm10Range: '51–100 µg/m³',
    officialHealthStatement: 'Minor breathing discomfort to sensitive people',
    familyGuidance: 'Generally safe for outdoor sports and clothes drying; unusually sensitive individuals limit prolonged heavy exertion.',
  },
  {
    category: 'Moderate',
    minAqi: 101,
    maxAqi: 200,
    pm25Range: '61–90 µg/m³',
    pm10Range: '101–250 µg/m³',
    officialHealthStatement: 'Breathing discomfort to the people with lungs, asthma and heart diseases',
    familyGuidance: 'Children, seniors, and asthma patients should reduce prolonged outdoor exertion; shift workouts to midday windows.',
  },
  {
    category: 'Poor',
    minAqi: 201,
    maxAqi: 300,
    pm25Range: '91–120 µg/m³',
    pm10Range: '251–350 µg/m³',
    officialHealthStatement: 'Breathing discomfort to most people on prolonged exposure',
    familyGuidance: 'Avoid early morning jogs and outdoor workouts; keep windows closed during thermal inversions; wear N95 outdoors.',
  },
  {
    category: 'Very Poor',
    minAqi: 301,
    maxAqi: 400,
    pm25Range: '121–250 µg/m³',
    pm10Range: '351–430 µg/m³',
    officialHealthStatement: 'Respiratory illness on prolonged exposure',
    familyGuidance: 'Strictly avoid outdoor exercise; run indoor HEPA purifiers; keep children indoors during morning/evening smog peaks.',
  },
  {
    category: 'Severe',
    minAqi: 401,
    maxAqi: 500,
    pm25Range: '> 250 µg/m³',
    pm10Range: '> 430 µg/m³',
    officialHealthStatement: 'Affects healthy people and seriously impacts those with existing diseases',
    familyGuidance: 'Public health emergency: halt all outdoor activities; seal room draft gaps; mandatory N95 if venturing outside.',
  },
];

/**
 * Formatted prompt block injected into AI system prompts to ensure the model
 * strictly uses Indian CPCB terminology and never US EPA band names when interpreting CPCB data.
 */
export const CPCB_REFERENCE_PROMPT_SNIPPET = `Official Indian CPCB NAQI Scale & Categories (NEVER use US EPA labels like "Unhealthy" or "Hazardous" when interpreting CPCB numbers):
- 0–50: Good (Minimal impact)
- 51–100: Satisfactory (Minor breathing discomfort to sensitive people)
- 101–200: Moderate (Breathing discomfort to people with asthma/heart disease)
- 201–300: Poor (Breathing discomfort to most people on prolonged exposure)
- 301–400: Very Poor (Respiratory illness on prolonged exposure)
- 401–500: Severe (Affects healthy people and seriously impacts vulnerable groups)`;
