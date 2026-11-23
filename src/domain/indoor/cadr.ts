import { CadrCalculation } from './types';

/**
 * Calculates Clean Air Delivery Rate (CADR) and Air Changes per Hour (ACH).
 *
 * Formulas:
 * Room Volume (m³) = Floor Area (m²) × Ceiling Height (m)
 * Required CADR (m³/h) = Room Volume (m³) × Target ACH
 * Estimated ACH = Selected CADR (m³/h) / Room Volume (m³)
 * Derated Sleep ACH = (Selected CADR × 0.4) / Room Volume (m³)
 */
export function calculateCadrAch(
  floorAreaM2: number,
  ceilingHeightM: number,
  targetAch: number = 4.0,
  selectedCadrM3h: number = 250
): CadrCalculation {
  const safeArea = Math.max(1, floorAreaM2);
  const safeHeight = Math.max(1.8, ceilingHeightM);
  const safeTargetAch = Math.max(1, targetAch);
  const safeCadr = Math.max(0, selectedCadrM3h);

  const roomVolumeM3 = Math.round(safeArea * safeHeight * 10) / 10;
  const requiredCadrM3h = Math.round(roomVolumeM3 * safeTargetAch);
  const estimatedAch = roomVolumeM3 > 0 ? Math.round((safeCadr / roomVolumeM3) * 10) / 10 : 0;
  // Disclose that on quiet/sleep mode, fan speed drops output by approx 60%
  const deratedSleepAch = roomVolumeM3 > 0 ? Math.round(((safeCadr * 0.4) / roomVolumeM3) * 10) / 10 : 0;

  return {
    floorAreaM2: safeArea,
    ceilingHeightM: safeHeight,
    roomVolumeM3,
    targetAch: safeTargetAch,
    requiredCadrM3h,
    selectedCadrM3h: safeCadr,
    estimatedAch,
    isUnderpowered: estimatedAch < 2.0,
    isTargetMet: estimatedAch >= safeTargetAch,
    deratedSleepAch,
  };
}
