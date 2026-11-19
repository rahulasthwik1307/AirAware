/**
 * Authoritative Pollutant Educational Metadata & Standards Averaging Windows
 * Grounded in US EPA NAAQS (EPA-454/B-18-007), European Environment Agency (EEA Directive 2008/50/EC),
 * and WHO Global Air Quality Guidelines (2021).
 */

import { PollutantKey } from '../types';

export interface WhoBenchmark {
  readonly value: number;
  readonly unit: string;
  readonly period: string;
  readonly label: string;
}

export interface PollutantEducationalData {
  readonly key: PollutantKey;
  readonly fullName: string;
  readonly chemicalFormula: string;
  readonly screenReaderName: string;
  readonly standardUnit: string;
  readonly concentrationBasis: string;
  readonly sources: string;
  readonly healthEffects: string;
  readonly seasonalBehavior: string;
  readonly regulatoryWindows: {
    readonly usEpa: string;
    readonly europeanEaqi: string;
    readonly instantaneousModel: string;
  };
  readonly who2021Guidelines: {
    readonly shortTerm: WhoBenchmark;
    readonly annual?: WhoBenchmark;
    readonly disclosure: string;
  };
}

export const POLLUTANT_EDUCATIONAL_DATA: Record<PollutantKey, PollutantEducationalData> = {
  pm2_5: {
    key: 'pm2_5',
    fullName: 'Particulate Matter 2.5',
    chemicalFormula: 'PM₂.₅',
    screenReaderName: 'Particulate Matter 2.5 micrometers or smaller (PM 2.5)',
    standardUnit: 'μg/m³',
    concentrationBasis: 'Instantaneous 1-hour Open-Meteo model concentration',
    sources:
      'High-temperature fuel combustion in motor vehicles, thermal power plants, industrial facilities, and residential biomass/wood burning, supplemented by secondary atmospheric reactions from gaseous SO₂, NOₓ, and ammonia.',
    healthEffects:
      'Microscopic inhalable particles penetrate deep into the alveolar regions of the lungs and can translocate into the vascular system. Prolonged or acute exposure may exacerbate asthma, diminish lung capacity, and increase cardiovascular strain.',
    seasonalBehavior:
      'Atmospheric dispersion and seasonal patterns vary substantially across geography, local topography, prevailing weather, emissions sources, and seasonal heating demands. In temperate and continental valleys, stagnant winter weather and shallow thermal inversions frequently concentrate emissions from heating and traffic. In tropical, arid, or forested regions, dry-season agricultural burning, seasonal dust storms, or warm-season wildfire smoke drive elevated periods.',
    regulatoryWindows: {
      usEpa:
        'Preceding 24-hour rolling average (US EPA NAAQS regulatory calculation). The application displays instantaneous 1-hour model data and provider sub-indices; it does not compute 24-hour rolling averages locally.',
      europeanEaqi:
        'Hourly concentration (European EAQI evaluates its five pollutant sub-indices using 1-hour concentrations).',
      instantaneousModel: 'Instantaneous 1-hour atmospheric model grid estimate',
    },
    who2021Guidelines: {
      shortTerm: {
        value: 15.0,
        unit: 'μg/m³',
        period: '24-hour mean',
        label: 'WHO 24-hour guideline level',
      },
      annual: {
        value: 5.0,
        unit: 'μg/m³',
        period: 'Annual mean',
        label: 'WHO annual guideline level',
      },
      disclosure:
        'WHO air quality guidelines are health-based advisory reference levels, not legal limits or guarantees of safety. Modelled 1-hour concentrations cannot be directly equated with 24-hour or annual chronic guideline levels.',
    },
  },

  pm10: {
    key: 'pm10',
    fullName: 'Particulate Matter 10',
    chemicalFormula: 'PM₁₀',
    screenReaderName: 'Particulate Matter 10 micrometers or smaller (PM 10)',
    standardUnit: 'μg/m³',
    concentrationBasis: 'Instantaneous 1-hour Open-Meteo model concentration',
    sources:
      'Mechanical crushing, road dust resuspension by moving vehicular traffic, construction and demolition operations, agricultural tilling, and windblown soil and desert dust.',
    healthEffects:
      'Coarse inhalable particles deposit predominantly in the upper thoracic respiratory tract, provoking airway irritation, coughing, eye irritation, and exacerbating bronchitis and asthma symptoms.',
    seasonalBehavior:
      'Concentrations and patterns vary with regional climate, land use, weather, and seasonal human activities. Dry, arid regions often see peaks during windy seasons and dust storms, while agricultural areas experience spikes during tilling or harvest. In urban settings, resuspended road dust and construction activity produce localized patterns that fluctuate with precipitation, wind speed, and traffic.',
    regulatoryWindows: {
      usEpa:
        'Preceding 24-hour rolling average (US EPA NAAQS regulatory calculation). The application displays instantaneous 1-hour model data and provider sub-indices; it does not compute 24-hour rolling averages locally.',
      europeanEaqi:
        'Hourly concentration (European EAQI evaluates its five pollutant sub-indices using 1-hour concentrations).',
      instantaneousModel: 'Instantaneous 1-hour atmospheric model grid estimate',
    },
    who2021Guidelines: {
      shortTerm: {
        value: 45.0,
        unit: 'μg/m³',
        period: '24-hour mean',
        label: 'WHO 24-hour guideline level',
      },
      annual: {
        value: 15.0,
        unit: 'μg/m³',
        period: 'Annual mean',
        label: 'WHO annual guideline level',
      },
      disclosure:
        'WHO air quality guidelines are health-based advisory reference levels, not legal limits or guarantees of safety. Modelled 1-hour concentrations cannot be directly equated with 24-hour or annual chronic guideline levels.',
    },
  },

  nitrogen_dioxide: {
    key: 'nitrogen_dioxide',
    fullName: 'Nitrogen Dioxide',
    chemicalFormula: 'NO₂',
    screenReaderName: 'Nitrogen Dioxide (NO2)',
    standardUnit: 'μg/m³',
    concentrationBasis: 'Instantaneous 1-hour Open-Meteo model concentration',
    sources:
      'High-temperature fuel combustion, predominantly on-road motor vehicle traffic (diesel and petrol engines), thermal power plants, industrial furnaces, and unvented indoor gas stoves.',
    healthEffects:
      'Airway irritant causing bronchial inflammation, increased airway hyperresponsiveness, aggravated asthma symptoms, and heightened susceptibility to respiratory infections on repeated exposure.',
    seasonalBehavior:
      'Diurnal and seasonal patterns vary significantly across local geography, traffic flow, urban street canyon geometry, meteorological conditions, and weather. Urban areas commonly exhibit morning and evening rush-hour traffic peaks. In colder climates, winter concentrations are often elevated due to lower boundary layer mixing depths and weaker dispersion, whereas well-ventilated or coastal locations exhibit different diurnal dispersion cycles.',
    regulatoryWindows: {
      usEpa:
        '1-hour daily maximum concentration (US EPA NAAQS 1-hour standard). The application displays instantaneous 1-hour model concentrations and provider sub-indices.',
      europeanEaqi:
        'Hourly concentration (European EAQI evaluates its five pollutant sub-indices using 1-hour concentrations).',
      instantaneousModel: 'Instantaneous 1-hour atmospheric model grid estimate',
    },
    who2021Guidelines: {
      shortTerm: {
        value: 25.0,
        unit: 'μg/m³',
        period: '24-hour mean',
        label: 'WHO 24-hour guideline level',
      },
      annual: {
        value: 10.0,
        unit: 'μg/m³',
        period: 'Annual mean',
        label: 'WHO annual guideline level',
      },
      disclosure:
        'WHO air quality guidelines are health-based advisory reference levels, not legal limits or guarantees of safety. Modelled 1-hour concentrations cannot be directly equated with 24-hour or annual chronic guideline levels.',
    },
  },

  ozone: {
    key: 'ozone',
    fullName: 'Ground-level Ozone',
    chemicalFormula: 'O₃',
    screenReaderName: 'Ground-level Ozone (O3)',
    standardUnit: 'μg/m³',
    concentrationBasis: 'Instantaneous 1-hour Open-Meteo model concentration',
    sources:
      'Secondary photochemical oxidant formed through chemical reactions between nitrogen oxides (NOₓ) and volatile organic compounds (VOCs) in the presence of intense solar ultraviolet radiation and heat. Not emitted directly from tailpipes.',
    healthEffects:
      'Powerful oxidizing gas that inflames respiratory mucosal membranes, provokes chest tightness, coughing, throat irritation, and impairs lung function during outdoor physical exercise.',
    seasonalBehavior:
      'Ground-level ozone formation is governed by sunlight, temperature, and local precursor emissions (NOx and VOCs). Elevated concentrations typically occur on clear, hot, stagnant afternoons during sunny months. Diurnal and seasonal patterns vary significantly across latitude, elevation, weather, cloud cover, and regional air mass transport; high-elevation or rural downwind sites may experience persistent nighttime ozone.',
    regulatoryWindows: {
      usEpa:
        '8-hour rolling average (US EPA NAAQS standard calculation). The application displays instantaneous 1-hour model data and provider sub-indices; it does not compute 8-hour rolling averages locally.',
      europeanEaqi:
        'Hourly concentration (European EAQI evaluates its five pollutant sub-indices using 1-hour concentrations).',
      instantaneousModel: 'Instantaneous 1-hour atmospheric model grid estimate',
    },
    who2021Guidelines: {
      shortTerm: {
        value: 100.0,
        unit: 'μg/m³',
        period: '8-hour daily max',
        label: 'WHO 8-hour guideline level',
      },
      annual: {
        value: 60.0,
        unit: 'μg/m³',
        period: 'Peak season mean',
        label: 'WHO peak season benchmark',
      },
      disclosure:
        'WHO air quality guidelines are health-based advisory reference levels, not legal limits or guarantees of safety. Modelled 1-hour concentrations cannot be directly equated with 8-hour or peak-season guideline levels.',
    },
  },

  sulphur_dioxide: {
    key: 'sulphur_dioxide',
    fullName: 'Sulphur Dioxide',
    chemicalFormula: 'SO₂',
    screenReaderName: 'Sulphur Dioxide (SO2)',
    standardUnit: 'μg/m³',
    concentrationBasis: 'Instantaneous 1-hour Open-Meteo model concentration',
    sources:
      'Combustion of sulphur-rich fossil fuels (coal and heavy fuel oil in thermal electricity generation and industrial boilers), metal ore extraction and smelting, oil refining, and marine shipping.',
    healthEffects:
      'Pungent, reactive gas provoking rapid bronchoconstriction and airway narrowing within 5–15 minutes of inhalation, posing acute risks to individuals with pre-existing asthma or COPD.',
    seasonalBehavior:
      'Patterns depend primarily on proximity to industrial emission sources, power plants, oil refineries, and marine shipping corridors, rather than universal seasonal cycles. Concentrations vary significantly with industrial operating schedules, prevailing wind direction, and weather. Areas using high-sulphur coal or fuel oil for winter heating may observe seasonal cold-weather elevations.',
    regulatoryWindows: {
      usEpa:
        '1-hour daily maximum concentration (US EPA NAAQS 1-hour standard based on 99th percentile of 1-hour daily maximums).',
      europeanEaqi:
        'Hourly concentration (European EAQI evaluates its five pollutant sub-indices using 1-hour concentrations).',
      instantaneousModel: 'Instantaneous 1-hour atmospheric model grid estimate',
    },
    who2021Guidelines: {
      shortTerm: {
        value: 40.0,
        unit: 'μg/m³',
        period: '24-hour mean',
        label: 'WHO 24-hour guideline level',
      },
      disclosure:
        'WHO 2021 air quality guidelines are health-based advisory reference levels, not legal limits or guarantees of safety. Modelled 1-hour concentrations cannot be directly equated with 24-hour guideline levels.',
    },
  },

  carbon_monoxide: {
    key: 'carbon_monoxide',
    fullName: 'Carbon Monoxide',
    chemicalFormula: 'CO',
    screenReaderName: 'Carbon Monoxide (CO)',
    standardUnit: 'μg/m³',
    concentrationBasis: 'Instantaneous 1-hour Open-Meteo model concentration',
    sources:
      'Incomplete combustion of carbon-based fuels in motor vehicles (especially idling, cold starts, and congested urban stop-and-go driving), industrial furnaces, and unvented fuel-burning domestic heaters.',
    healthEffects:
      'Affinity for blood hemoglobin exceeds oxygen by over 200 times, forming carboxyhemoglobin (COHb) and diminishing oxygen delivery to vital tissues. Poses heightened cardiovascular risk for individuals with coronary artery disease.',
    seasonalBehavior:
      'Concentrations depend on localized fuel combustion, vehicular traffic congestion, and terrain. Cold-weather conditions in urban valleys can elevate surface concentrations during cold vehicle starts and nighttime temperature inversions, but patterns vary with local fleet composition, topography, weather, and heating practices.',
    regulatoryWindows: {
      usEpa:
        '8-hour rolling average (US EPA NAAQS 8-hour standard: 9 ppm ≈ 10,000 μg/m³; 1-hour standard: 35 ppm ≈ 40,000 μg/m³). The application displays instantaneous 1-hour model data and provider sub-indices; it does not compute 8-hour rolling averages locally.',
      europeanEaqi:
        'Not evaluated under European EAQI (EEA index convention excludes CO).',
      instantaneousModel: 'Instantaneous 1-hour atmospheric model grid estimate',
    },
    who2021Guidelines: {
      shortTerm: {
        value: 4000.0,
        unit: 'μg/m³',
        period: '24-hour mean',
        label: 'WHO 24-hour guideline level',
      },
      annual: {
        value: 10000.0,
        unit: 'μg/m³',
        period: '8-hour mean',
        label: 'WHO 8-hour guideline level',
      },
      disclosure:
        'WHO air quality guidelines are health-based advisory reference levels, not legal limits or guarantees of safety. Modelled 1-hour concentrations cannot be directly equated with 8-hour or 24-hour guideline levels.',
    },
  },
};
