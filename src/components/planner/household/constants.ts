import { SelectOption } from '../CustomSelect';
import {
  HouseholdArchetype,
  SensitivityTier,
  ActivityType,
  CommuteMode,
} from '@/domain/household/types';

export const ARCHETYPE_ICONS: Record<HouseholdArchetype, string> = {
  CHILD_STUDENT: '🎒',
  WORKING_COMMUTER: '💼',
  SENIOR_VULNERABLE: '🌿',
  OUTDOOR_ENTHUSIAST: '🏃',
};

export const ARCHETYPE_LABELS: Record<HouseholdArchetype, string> = {
  CHILD_STUDENT: 'Child / Student',
  WORKING_COMMUTER: 'Working Commuter',
  SENIOR_VULNERABLE: 'Senior / Vulnerable',
  OUTDOOR_ENTHUSIAST: 'Outdoor Enthusiast',
};

export const ARCHETYPE_SELECT_OPTIONS: readonly SelectOption<HouseholdArchetype>[] = [
  { value: 'CHILD_STUDENT', label: 'Child / Student', icon: '🎒', subtitle: 'Developing lungs & sensitive respiratory tract' },
  { value: 'WORKING_COMMUTER', label: 'Working Commuter', icon: '💼', subtitle: 'Peak transit & traffic corridor exposure' },
  { value: 'SENIOR_VULNERABLE', label: 'Senior / Vulnerable Adult', icon: '🌿', subtitle: 'Cardiovascular & chronic condition precaution' },
  { value: 'OUTDOOR_ENTHUSIAST', label: 'Outdoor Enthusiast', icon: '🏃', subtitle: 'Elevated exertion & heavy ventilation' },
];

export const SENSITIVITY_SELECT_OPTIONS: readonly SelectOption<SensitivityTier>[] = [
  { value: 'NONE', label: 'General Population (No specific sensitivity)', subtitle: 'Standard environmental exposure profile' },
  { value: 'PEDIATRIC', label: 'Pediatric (Developing Airways)', subtitle: 'Higher breath rate per body mass' },
  { value: 'RESPIRATORY', label: 'Respiratory (Asthma, COPD)', subtitle: 'Sensitive airway bronchospasm protection' },
  { value: 'CARDIOVASCULAR', label: 'Cardiovascular (Hypertension, CAD)', subtitle: 'Elevated arterial strain & PM2.5 protection' },
];

export const ACTIVITY_TYPE_SELECT_OPTIONS: readonly SelectOption<ActivityType>[] = [
  { value: 'OUTDOOR_EXERCISE', label: 'Outdoor Exercise / Sports', icon: '🏃', subtitle: 'Jogging, football, outdoor yoga, high ventilation' },
  { value: 'COMMUTE', label: 'Work Commute', icon: '💼', subtitle: 'Transit, driving, or active road commute' },
  { value: 'SCHOOL_TRAVEL', label: 'School Run / Transit', icon: '🎒', subtitle: 'Morning & afternoon school journey' },
  { value: 'VENTILATION', label: 'Natural Home Ventilation', icon: '🪟', subtitle: 'Opening windows during lower forecast pollution window' },
  { value: 'INDOOR_CHORE', label: 'Indoor Cleaning / Chore', icon: '🧹', subtitle: 'Vacuuming, sweeping, or domestic chores' },
  { value: 'ERRAND', label: 'Outdoor Errand / Shopping', icon: '🛒', subtitle: 'Local neighborhood market trips' },
];

export const COMMUTE_MODE_SELECT_OPTIONS: readonly SelectOption<CommuteMode>[] = [
  { value: 'WALKING', label: 'Walking', icon: '🚶', subtitle: 'Direct ambient air exposure' },
  { value: 'CYCLING', label: 'Bicycle / Cycling', icon: '🚲', subtitle: 'High ventilation rate along roadways' },
  { value: 'PUBLIC_TRANSIT', label: 'Public Transit / Metro', icon: '🚇', subtitle: 'Shared cabin & station platforms' },
  { value: 'PRIVATE_CAR', label: 'Solo Private Car', icon: '🚗', subtitle: 'Cabin air filter option available' },
  { value: 'CARPOOL', label: 'Shared Carpool', icon: '🚙', subtitle: 'Efficient vehicle occupancy' },
];
