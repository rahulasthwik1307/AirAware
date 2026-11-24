/**
 * AirAware — Health Advisory Protocols Domain Module
 * Pure TypeScript business rules mapping AQI tier levels to actionable household,
 * commuter, and sensitive group protection protocols.
 * Strictly 0 React or UI dependencies.
 */

import { WorkspaceKey } from '@/domain/types';

export type ActionCardIconType = 'mask' | 'window' | 'exercise' | 'sensitive';
export type ActionBadgeType = 'good' | 'moderate' | 'warning' | 'alert';

export interface ActionCard {
  readonly iconType: ActionCardIconType;
  readonly title: string;
  readonly recommendation: string;
  readonly practicalTip: string;
  readonly badge: string;
  readonly badgeType: ActionBadgeType;
  readonly actionLabel?: string;
  readonly targetWorkspace?: WorkspaceKey;
}

/**
 * Derives deterministic, evidence-grounded action protocol cards based on AQI tier level (1 to 6).
 *
 * @param level - AQI severity tier level (1 = Good, 2 = Moderate, 3 = Sensitive, 4 = Unhealthy, 5 = Very Unhealthy, 6 = Hazardous)
 * @returns Array of 4 categorized action cards
 */
export function getHealthActionCards(level: number): ActionCard[] {
  switch (level) {
    case 1: // Good
      return [
        {
          iconType: 'mask',
          title: 'Mask & Respiratory',
          recommendation:
            'Ambient concentrations are in the lowest index category. Routine outdoor mask use is not required for daily errands.',
          practicalTip:
            'Keep a certified N95 respirator in your vehicle or bag for unexpected localized construction dust or heavy diesel corridors.',
          badge: 'Not Required',
          badgeType: 'good',
          actionLabel: 'Air Quality Normal',
        },
        {
          iconType: 'window',
          title: 'Indoor Ventilation',
          recommendation:
            'Modelled outdoor concentrations are in the clean category. Open windows across rooms to flush accumulated indoor carbon dioxide.',
          practicalTip:
            'Create natural cross-ventilation for 30–45 minutes during morning hours to refresh bedroom air while temperatures are pleasant.',
          badge: 'Ventilation Favorable',
          badgeType: 'good',
          actionLabel: 'Ventilate Indoors',
          targetWorkspace: 'indoor-air',
        },
        {
          iconType: 'exercise',
          title: 'Outdoor Exercise',
          recommendation:
            'Modelled air quality represents optimal outdoor conditions. Ideal for morning jogging, outdoor cycling, and school sports.',
          practicalTip:
            'Outdoor cardio and children sports can proceed with zero restrictions. Maintain normal hydration.',
          badge: 'Ideal For Sports',
          badgeType: 'good',
          actionLabel: 'Plan Outdoor Routine',
          targetWorkspace: 'family-planner',
        },
        {
          iconType: 'sensitive',
          title: 'Sensitive Groups',
          recommendation:
            'Modelled concentrations are within safe baseline bands. Safe for infants, pregnant women, asthmatics, and senior citizens.',
          practicalTip:
            'Senior citizens can enjoy uninterrupted morning walks in local parks or open residential areas.',
          badge: 'Safe For Seniors',
          badgeType: 'good',
          actionLabel: 'Review Family Profiles',
          targetWorkspace: 'family-planner',
        },
      ];

    case 2: // Moderate
      return [
        {
          iconType: 'mask',
          title: 'Mask & Respiratory',
          recommendation:
            'Intermediate atmospheric category. Commuters in open autorickshaws or on two-wheelers should consider wearing a particulate mask.',
          practicalTip:
            'Ordinary cloth scarves/gamchas filter less than 25% of fine exhaust soot. A snug N95 or surgical mask blocks road dust in stop-and-go traffic.',
          badge: 'Optional in Traffic',
          badgeType: 'moderate',
          actionLabel: 'Optional in Traffic',
        },
        {
          iconType: 'window',
          title: 'Indoor Ventilation',
          recommendation:
            'Ambient concentrations are acceptable. Check hourly local forecast before opening windows for extended periods.',
          practicalTip:
            'Always run kitchen range hood exhaust when frying with mustard oil or tadka to prevent indoor PM2.5 build-up.',
          badge: 'Selective Flush',
          badgeType: 'moderate',
          actionLabel: 'Check Cooking Exhaust',
          targetWorkspace: 'indoor-air',
        },
        {
          iconType: 'exercise',
          title: 'Outdoor Exercise',
          recommendation:
            'Modelled air quality falls into the moderate band. Safe for general workouts; sensitive individuals pace heavy cardio.',
          practicalTip:
            'If jogging near major ring roads or arterial highways, consider shifting to an inner residential park or indoor treadmill.',
          badge: 'Pacing Advised',
          badgeType: 'moderate',
          actionLabel: 'Pace Outdoor Workouts',
          targetWorkspace: 'family-planner',
        },
        {
          iconType: 'sensitive',
          title: 'Sensitive Groups',
          recommendation:
            'People with asthma or chronic respiratory conditions should keep rescue inhalers accessible during early morning outings.',
          practicalTip:
            'Monitor elderly family members for mild dry coughing or throat irritation after prolonged exposure.',
          badge: 'Monitor Symptoms',
          badgeType: 'moderate',
          actionLabel: 'Monitor Symptoms',
          targetWorkspace: 'family-planner',
        },
      ];

    case 3: // Unhealthy for Sensitive Groups
      return [
        {
          iconType: 'mask',
          title: 'Mask & Respiratory',
          recommendation:
            'Elevated particulate smog. Well-fitted particulate respirators (N95 / FFP2) are strongly advised for children, seniors, and daily commuters.',
          practicalTip:
            'Ensure a snug nose-clip fit. A loose mask with air gaps leaks over 50% of toxic sub-micron combustion soot.',
          badge: 'N95 Recommended',
          badgeType: 'warning',
          actionLabel: 'Wear N95 Outdoors',
        },
        {
          iconType: 'window',
          title: 'Indoor Ventilation',
          recommendation:
            'Keep windows sealed during early morning and late night inversion hours. Use localized mechanical kitchen exhaust.',
          practicalTip:
            'Damp-mop hard floors with wet microfiber mops; avoid dry broom sweeping (jharoo) which resuspends settled particles into breathing zones.',
          badge: 'Seal Morning Smog',
          badgeType: 'warning',
          actionLabel: 'Mitigate Indoor Air',
          targetWorkspace: 'indoor-air',
        },
        {
          iconType: 'exercise',
          title: 'Outdoor Exercise',
          recommendation:
            'Elevated pollutant levels. Avoid high-intensity outdoor running or heavy aerobic workouts before 9:30 AM.',
          practicalTip:
            'Take advantage of the 1:00 PM – 3:30 PM afternoon solar window when surface inversion lifts and ground soot temporarily dilutes.',
          badge: 'Shift To Afternoon',
          badgeType: 'warning',
          actionLabel: 'Reschedule Workouts',
          targetWorkspace: 'family-planner',
        },
        {
          iconType: 'sensitive',
          title: 'Sensitive Groups',
          recommendation:
            'Children and older adults face heightened irritation. School transit should keep vehicle windows closed.',
          practicalTip:
            'Switch evening children outdoor playground playtime to indoor activities or board games during smog alerts.',
          badge: 'Protect Children',
          badgeType: 'warning',
          actionLabel: 'Shift Child/Senior Plan',
          targetWorkspace: 'family-planner',
        },
      ];

    case 4: // Unhealthy
      return [
        {
          iconType: 'mask',
          title: 'Mask & Respiratory',
          recommendation:
            'High ambient pollutant concentrations. Well-fitted particulate respirators (N95 / FFP2) are necessary for all outdoor travel.',
          practicalTip:
            'Cloth handkerchiefs and scarves provide false security. Use certified N95 respirators with headbands or earloop adjusters for a true seal.',
          badge: 'N95 Mandatory',
          badgeType: 'alert',
          actionLabel: 'Wear N95/FFP2',
        },
        {
          iconType: 'window',
          title: 'Indoor Ventilation',
          recommendation:
            'Keep all exterior windows and balcony doors tightly closed. Run HEPA air purifiers continuously on auto/medium mode.',
          practicalTip:
            'Place rolled towels or silicone draft stoppers under entrance doors to block pressurized corridor smog infiltration.',
          badge: 'Keep Sealed',
          badgeType: 'alert',
          actionLabel: 'Run Purifiers / Close Windows',
          targetWorkspace: 'indoor-air',
        },
        {
          iconType: 'exercise',
          title: 'Outdoor Exercise',
          recommendation:
            'Strictly avoid outdoor jogging, fast walking, or outdoor sports. Deep breathing during exercise pulls soot deep into lower alveoli.',
          practicalTip:
            'Transition completely to indoor yoga, bodyweight training, or indoor stair climbing until thermal dispersion improves.',
          badge: 'Cancel Outdoor Cardio',
          badgeType: 'alert',
          actionLabel: 'Move Cardio Indoors',
          targetWorkspace: 'family-planner',
        },
        {
          iconType: 'sensitive',
          title: 'Sensitive Groups',
          recommendation:
            'High-risk alert for asthmatics, COPD patients, elderly citizens, and toddlers. Remain in HEPA-filtered indoor environments.',
          practicalTip:
            'Senior morning walkers must pause park walks; shift to gentle corridor or living-room walking routines.',
          badge: 'Remain Indoors',
          badgeType: 'alert',
          actionLabel: 'Protect Sensitive Members',
          targetWorkspace: 'family-planner',
        },
      ];

    default: // 5 & 6 Very Unhealthy / Hazardous (Severe Winter Smog)
      return [
        {
          iconType: 'mask',
          title: 'Mask & Respiratory',
          recommendation:
            'Severe winter smog and thermal inversion crisis. High-grade particulate respirators (N95 / FFP3) are essential for any unavoidable outdoor step.',
          practicalTip:
            'Replace N95 masks every 3–4 days during severe winter smog as soot accumulation increases breathing resistance.',
          badge: 'N95/FFP3 Required',
          badgeType: 'alert',
          actionLabel: 'N95/FFP3 Required Outdoors',
        },
        {
          iconType: 'window',
          title: 'Indoor Ventilation',
          recommendation:
            'Emergency outdoor air ingress alert. Seal all vents and windows. Create a designated clean air sanctuary in the family bedroom.',
          practicalTip:
            'Operate your HEPA purifier on maximum fan speed in the closed bedroom for 40 minutes, then maintain on quiet mode through the night.',
          badge: 'Sanctuary Protocol',
          badgeType: 'alert',
          actionLabel: 'Deploy Indoor Defense',
          targetWorkspace: 'indoor-air',
        },
        {
          iconType: 'exercise',
          title: 'Outdoor Exercise',
          recommendation:
            'Complete prohibition on outdoor physical exertion. Ambient PM2.5 levels equal smoking multiple packs of cigarettes per day.',
          practicalTip:
            'All physical workouts must stay strictly indoors in filtered rooms. Keep exertion gentle to prevent deep lung irritation.',
          badge: 'Zero Outdoor Cardio',
          badgeType: 'alert',
          actionLabel: 'Cancel Outdoor Activity',
          targetWorkspace: 'family-planner',
        },
        {
          iconType: 'sensitive',
          title: 'Sensitive Groups',
          recommendation:
            'Critical medical protection alert. Vulnerable members, elderly, and young children must remain indoors in filtered rooms.',
          practicalTip:
            'Keep emergency bronchodilator inhalers ready. Ensure elderly members avoid unheated drafty rooms during cold morning smog peaks.',
          badge: 'Emergency Defense',
          badgeType: 'alert',
          actionLabel: 'Keep Indoors at All Times',
          targetWorkspace: 'family-planner',
        },
      ];
  }
}
