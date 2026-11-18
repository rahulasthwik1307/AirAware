/**
 * Pollutant Unit Converters & Chemical Metadata
 * Provides safe conversions with documented physical assumptions and WHO 2021 guidelines.
 */

import { PollutantKey, PollutantMetadata } from '../types';

export const POLLUTANT_METADATA: Record<PollutantKey, PollutantMetadata> = {
  pm2_5: {
    key: 'pm2_5',
    label: 'Particulate Matter 2.5',
    chemicalFormula: 'PM₂.₅',
    standardUnit: 'μg/m³',
    description: 'Fine inhalable particles with aerodynamic diameter 2.5 micrometers and smaller.',
    whoGuideline: 15.0, // WHO 2021 24-hour guideline: 15 μg/m³
  },
  pm10: {
    key: 'pm10',
    label: 'Particulate Matter 10',
    chemicalFormula: 'PM₁₀',
    standardUnit: 'μg/m³',
    description: 'Inhalable coarse particles with aerodynamic diameter 10 micrometers and smaller.',
    whoGuideline: 45.0, // WHO 2021 24-hour guideline: 45 μg/m³
  },
  nitrogen_dioxide: {
    key: 'nitrogen_dioxide',
    label: 'Nitrogen Dioxide',
    chemicalFormula: 'NO₂',
    standardUnit: 'μg/m³',
    description: 'Combustion gas primarily emitted by vehicles, transport, and thermal generation.',
    whoGuideline: 25.0, // WHO 2021 24-hour guideline: 25 μg/m³
  },
  ozone: {
    key: 'ozone',
    label: 'Ground-level Ozone',
    chemicalFormula: 'O₃',
    standardUnit: 'μg/m³',
    description: 'Secondary photochemical oxidant formed by sunlight reacting with hydrocarbons and NOx.',
    whoGuideline: 100.0, // WHO 2021 8-hour guideline: 100 μg/m³
  },
  sulphur_dioxide: {
    key: 'sulphur_dioxide',
    label: 'Sulphur Dioxide',
    chemicalFormula: 'SO₂',
    standardUnit: 'μg/m³',
    description: 'Reactive pungent gas produced by fossil fuel burning and industrial smelters.',
    whoGuideline: 40.0, // WHO 2021 24-hour guideline: 40 μg/m³
  },
  carbon_monoxide: {
    key: 'carbon_monoxide',
    label: 'Carbon Monoxide',
    chemicalFormula: 'CO',
    standardUnit: 'μg/m³',
    description: 'Toxic, colorless, odorless gas from incomplete combustion of carbon-based fuels.',
    whoGuideline: 4000.0, // WHO 2021 24-hour guideline: 4 mg/m³ = 4000 μg/m³
  },
};

/**
 * Converts Carbon Monoxide from μg/m³ to ppm under Standard Temperature and Pressure (STP):
 * T = 25°C (298.15 K), P = 101.325 kPa (1 atm).
 * Molecular Weight of CO = 28.01 g/mol.
 * Molar volume of ideal gas at 25°C = 24.45 L/mol.
 * 1 ppm CO ≈ 1,145.6 μg/m³.
 *
 * NOTE: This is an idealized STP estimation for reference calculations and is not universally exact.
 */
export function convertCoUgM3ToPpm(coUgM3: number | null): number | null {
  if (coUgM3 === null || !Number.isFinite(coUgM3) || coUgM3 < 0) {
    return null;
  }
  const ppm = coUgM3 / 1145.6;
  // Round to nearest tenth of a ppm per EPA convention
  return Math.round(ppm * 10) / 10;
}
