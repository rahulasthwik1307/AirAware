import { GeoLocation, WorkspaceKey } from '@/domain/types';

export const CITY_PRESETS: readonly GeoLocation[] = [
  {
    id: 1273294,
    name: 'New Delhi',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Delhi (NCR)',
    latitude: 28.6139,
    longitude: 77.209,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 1269843,
    name: 'Hyderabad',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Telangana',
    latitude: 17.385,
    longitude: 78.4867,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 1277333,
    name: 'Bengaluru',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Karnataka',
    latitude: 12.9716,
    longitude: 77.5946,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 1275339,
    name: 'Mumbai',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Maharashtra',
    latitude: 19.076,
    longitude: 72.8777,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 1275004,
    name: 'Kolkata',
    country: 'India',
    countryCode: 'IN',
    admin1: 'West Bengal',
    latitude: 22.5726,
    longitude: 88.3639,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 1264527,
    name: 'Chennai',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Tamil Nadu',
    latitude: 13.0827,
    longitude: 80.2707,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 1259229,
    name: 'Pune',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Maharashtra',
    latitude: 18.5204,
    longitude: 73.8567,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 7279746,
    name: 'Noida',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Uttar Pradesh',
    latitude: 28.5355,
    longitude: 77.391,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 1279233,
    name: 'Ahmedabad',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Gujarat',
    latitude: 23.0225,
    longitude: 72.5714,
    timezone: 'Asia/Kolkata',
  },
];

export interface HealthOption {
  readonly id: string;
  readonly title: string;
  readonly desc: string;
  readonly badge: string;
}

export const HEALTH_OPTIONS: readonly HealthOption[] = [
  {
    id: 'infants_children',
    title: 'Infants or School Children',
    desc: 'Pediatric airway vulnerability; triggers earlier N95 mask alerts during morning school transit.',
    badge: 'Pediatric Shield',
  },
  {
    id: 'elderly_parents',
    title: 'Elderly Family Members (65+)',
    desc: 'Cardiovascular defense; shifts morning walking routines away from peak ground thermal inversion.',
    badge: 'Cardiovascular',
  },
  {
    id: 'asthma_respiratory',
    title: 'Asthma or Respiratory Sensitivity',
    desc: 'Strict CPCB exposure thresholds; alerts on fine particulate spikes above 150 μg/m³.',
    badge: 'Respiratory',
  },
  {
    id: 'active_commuter',
    title: 'Active Daily Commuter or Runner',
    desc: 'Evaluates outdoor inhalation volumes and suggests low-emission Delhi Metro transit alternatives.',
    badge: 'Commuter',
  },
  {
    id: 'healthy_adult',
    title: 'General Healthy Household',
    desc: 'Standard WHO ambient guidelines with regular diurnal cross-ventilation advisories.',
    badge: 'General',
  },
];

export interface FocusGoal {
  readonly workspace: WorkspaceKey;
  readonly title: string;
  readonly desc: string;
}

export const FOCUS_GOALS: readonly FocusGoal[] = [
  {
    workspace: 'air-intelligence',
    title: 'Outdoor Air Quality & Global Smog Tracking',
    desc: 'View real-time Copernicus satellite models, 3D Earth dispersion, and CPCB standard benchmarks.',
  },
  {
    workspace: 'family-planner',
    title: 'Family Morning Routines & Commute Timing Shifts',
    desc: 'Protect vulnerable family members by rescheduling outdoor hours away from ground inversion smog.',
  },
  {
    workspace: 'indoor-air',
    title: 'Indoor Air Purifier Sizing & Safe Window Timing',
    desc: 'Calculate room CADR/ACH and discover exact afternoon hours when solar heating safely opens windows.',
  },
  {
    workspace: 'cleaner-choices',
    title: 'Sustainable Commute & Tailpipe Carbon Reduction',
    desc: 'Audit solo car emissions against electric metro transit and build low-emission daily habits.',
  },
  {
    workspace: 'community-alerts',
    title: 'Society WhatsApp Alerts & Citizen Pollution Reporting',
    desc: 'Dispatch apartment clean-air notices to security guards and record geo-tagged visual evidence.',
  },
];
