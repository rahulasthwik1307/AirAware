/**
 * AirAware — AI Subsystem Contracts & Validation Schemas
 *
 * Strict Zod validation schemas for server route inputs and model outputs.
 * Follows the "pit of success" principle: inputs and outputs must validate
 * or fail closed to deterministic guidance.
 */

import { z } from 'zod';

export const AqiCategoryEnum = z.enum([
  'Good',
  'Satisfactory',
  'Moderate',
  'Poor',
  'Very Poor',
  'Severe',
  'Unhealthy for Sensitive Groups',
  'Unhealthy',
  'Very Unhealthy',
  'Hazardous',
]);
export type AqiCategory = z.infer<typeof AqiCategoryEnum>;

export const PollutantEnum = z.enum(['pm25', 'pm10', 'o3', 'no2', 'so2', 'co']);
export type PollutantType = z.infer<typeof PollutantEnum>;

export const ActivityEnum = z.enum([
  'outdoor_exercise',
  'daily_commute',
  'indoor_resting',
  'general',
]);
export type UserActivity = z.infer<typeof ActivityEnum>;

export const VentilationEnum = z.enum([
  'open_windows',
  'keep_closed_use_purifier',
  'ventilate_briefly',
]);
export type VentilationAdvice = z.infer<typeof VentilationEnum>;

export const HouseholdMemberSummarySchema = z.object({
  id: z.string(),
  nickname: z.string().max(50),
  archetype: z.string().max(50),
  sensitivityTier: z.string().max(50),
  schedules: z
    .array(
      z.object({
        activityName: z.string().max(100),
        startTime: z.string().max(10),
        durationMinutes: z.number().int().min(5).max(720),
        commuteMode: z.string().max(50).optional(),
      }).strict()
    )
    .max(10)
    .optional(),
}).strict();
export type HouseholdMemberSummary = z.infer<typeof HouseholdMemberSummarySchema>;

export const DailyPlanActionSchema = z.object({
  period: z.enum(['morning', 'afternoon', 'evening']),
  area: z.string().max(50),
  action: z.string().max(250),
  why: z.string().max(350),
  expectedImpact: z.string().max(200),
}).strict();
export type DailyPlanAction = z.infer<typeof DailyPlanActionSchema>;

export const TodayHouseholdPlanSchema = z.object({
  morning: DailyPlanActionSchema,
  afternoon: DailyPlanActionSchema,
  evening: DailyPlanActionSchema,
}).strict();
export type TodayHouseholdPlan = z.infer<typeof TodayHouseholdPlanSchema>;

// ==============================================================================
// 1. Proactive Guidance Schemas (Dashboard Health & Action Cards)
// ==============================================================================

export const GuidanceRequestSchema = z.object({
  aqi: z.number().int().min(0).max(500),
  category: AqiCategoryEnum,
  dominantPollutant: PollutantEnum,
  pollutantConcentration: z.number().nonnegative().max(10000),
  pollutantUnit: z.string().max(20).default('µg/m³'),
  weather: z.object({
    temperatureC: z.number().min(-60).max(60),
    humidityPercent: z.number().min(0).max(100),
    windSpeedKmh: z.number().nonnegative().max(300),
  }).strict(),
  userContext: z.object({
    isSensitiveGroup: z.boolean().default(false),
    primaryActivity: ActivityEnum.default('general'),
    locale: z.string().max(10).default('en'),
  }).strict(),
  cityName: z.string().max(100).optional(),
  householdMembers: z.array(HouseholdMemberSummarySchema).max(10).optional(),
  scheduleSummary: z.string().max(500).optional(),
  sourceType: z.enum(['station', 'model']).optional(),
  stationName: z.string().max(100).optional().nullable(),
  distanceKm: z.number().nonnegative().max(500).optional().nullable(),
  observationTime: z.string().max(50).optional().nullable(),
  indoorPm25: z.number().nonnegative().max(1000).optional().nullable(),
  scaleName: z.string().max(50).optional(),
  modelFallbackReason: z.string().max(200).optional().nullable(),
}).strict();
export type GuidanceRequest = z.infer<typeof GuidanceRequestSchema>;

export const GuidanceResponseSchema = z.object({
  headline: z.string().min(5).max(100),
  healthSummary: z.string().min(10).max(400),
  actionRecommendations: z.array(z.string().min(5).max(250)).min(2).max(5),
  sensitiveGroupAdvisory: z.string().min(5).max(300),
  ventilationRecommendation: VentilationEnum,
  todayHouseholdPlan: TodayHouseholdPlanSchema.optional(),
  modelName: z.string().optional(),
  isDeterministicFallback: z.boolean().default(false),
}).strict();
export type GuidanceResponse = z.infer<typeof GuidanceResponseSchema>;

// ==============================================================================
// 2. Air Copilot Conversational Schemas (Master Specification §4.4)
// ==============================================================================

export const WorkspaceEnum = z.enum([
  'air-intelligence',
  'family-planner',
  'indoor-air',
  'cleaner-choices',
  'community-alerts',
]);
export type WorkspaceContext = z.infer<typeof WorkspaceEnum>;

export const RoomContextSchema = z.object({
  roomName: z.string().max(50),
  floorAreaM2: z.number().positive().max(200).optional(),
  cadrM3h: z.number().positive().max(2000).optional(),
}).strict();
export type RoomContext = z.infer<typeof RoomContextSchema>;

export const CopilotRequestSchema = z.object({
  question: z
    .string()
    .trim()
    .min(2, 'Question must be at least 2 characters long')
    .max(200, 'Question must not exceed 200 characters')
    .transform((str) => str.replace(/[\x00-\x1F\x7F]/g, '').trim()), // Strip non-printable ASCII
  workspace: WorkspaceEnum.optional().default('air-intelligence'),
  roomContext: RoomContextSchema.optional(),
  aqi: z.number().int().min(0).max(500),
  category: AqiCategoryEnum,
  dominantPollutant: PollutantEnum,
  pollutantConcentration: z.number().nonnegative().max(10000),
  pollutantUnit: z.string().max(20).default('µg/m³'),
  weather: z.object({
    temperatureC: z.number().min(-60).max(60),
    humidityPercent: z.number().min(0).max(100),
    windSpeedKmh: z.number().nonnegative().max(300),
  }).strict(),
  userContext: z
    .object({
      isSensitiveGroup: z.boolean().default(false),
      primaryActivity: ActivityEnum.default('general'),
      locale: z.string().max(10).default('en'),
      vulnerabilityTiers: z.array(z.string().max(50)).max(10).optional(),
    })
    .strict()
    .default({ isSensitiveGroup: false, primaryActivity: 'general', locale: 'en' }),
  cityName: z.string().max(100).optional(),
  observationTime: z.string().max(50).optional(),
  dataSource: z.string().max(200).optional(),
  sourceType: z.enum(['station', 'model']).optional(),
  stationName: z.string().max(100).optional().nullable(),
  distanceKm: z.number().nonnegative().max(500).optional().nullable(),
  indoorPm25: z.number().nonnegative().max(1000).optional().nullable(),
  scaleName: z.string().max(50).optional(),
  modelFallbackReason: z.string().max(200).optional().nullable(),
}).strict();
export type CopilotRequest = Omit<z.infer<typeof CopilotRequestSchema>, 'workspace'> & {
  workspace?: WorkspaceContext;
};

export const CopilotResponseSchema = z.object({
  directAnswer: z.string().min(5).max(250),
  environmentalConditions: z.string().min(5).max(200),
  recommendedAction: z.string().min(5).max(200),
  explanation: z.string().min(10).max(350),
  practicalAlternatives: z.array(z.string().min(5).max(150)).min(1).max(4),
  dataSourceAndFreshness: z.string().min(5).max(150),
  limitationsOrUncertainty: z.string().min(5).max(200),
  modelName: z.string().optional(),
  fallbackReason: z.string().optional(),
  isDeterministicFallback: z.boolean().default(false),
});
export type CopilotResponse = z.infer<typeof CopilotResponseSchema>;

// ==============================================================================
// 3. Error Classification
// ==============================================================================

export type AiErrorCode =
  | 'CONFIG_MISSING'
  | 'RATE_LIMITED_BURST'
  | 'QUOTA_EXHAUSTED_DAILY'
  | 'PROVIDER_OVERLOAD'
  | 'TIMEOUT'
  | 'SCHEMA_VALIDATION_ERROR'
  | 'MODEL_UNAVAILABLE'
  | 'NETWORK_ERROR';

export class AiServiceError extends Error {
  constructor(
    public readonly code: AiErrorCode,
    message: string,
    public readonly status: number = 500,
    public readonly isDailyQuota: boolean = false
  ) {
    super(message);
    this.name = 'AiServiceError';
  }
}
