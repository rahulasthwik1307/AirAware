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
  'Moderate',
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

// ==============================================================================
// 1. Proactive Guidance Schemas (Dashboard Health & Action Cards)
// ==============================================================================

export const GuidanceRequestSchema = z.object({
  aqi: z.number().int().min(0).max(500),
  category: AqiCategoryEnum,
  dominantPollutant: PollutantEnum,
  pollutantConcentration: z.number().nonnegative(),
  pollutantUnit: z.string().default('µg/m³'),
  weather: z.object({
    temperatureC: z.number(),
    humidityPercent: z.number().min(0).max(100),
    windSpeedKmh: z.number().nonnegative(),
  }),
  userContext: z.object({
    isSensitiveGroup: z.boolean().default(false),
    primaryActivity: ActivityEnum.default('general'),
    locale: z.string().default('en'),
  }),
});
export type GuidanceRequest = z.infer<typeof GuidanceRequestSchema>;

export const GuidanceResponseSchema = z.object({
  headline: z.string().min(5).max(100),
  healthSummary: z.string().min(10).max(350),
  actionRecommendations: z.array(z.string().min(5).max(150)).min(2).max(5),
  sensitiveGroupAdvisory: z.string().min(5).max(250),
  ventilationRecommendation: VentilationEnum,
  isDeterministicFallback: z.boolean().default(false),
});
export type GuidanceResponse = z.infer<typeof GuidanceResponseSchema>;

// ==============================================================================
// 2. Air Copilot Conversational Schemas (Master Specification §4.4)
// ==============================================================================

export const CopilotRequestSchema = z.object({
  question: z
    .string()
    .min(3, 'Question must be at least 3 characters long')
    .max(200, 'Question must not exceed 200 characters')
    .transform((str) => str.replace(/[\x00-\x1F\x7F]/g, '').trim()), // Strip non-printable ASCII
  aqi: z.number().int().min(0).max(500),
  category: AqiCategoryEnum,
  dominantPollutant: PollutantEnum,
  pollutantConcentration: z.number().nonnegative(),
  pollutantUnit: z.string().default('µg/m³'),
  weather: z.object({
    temperatureC: z.number(),
    humidityPercent: z.number().min(0).max(100),
    windSpeedKmh: z.number().nonnegative(),
  }),
  userContext: z
    .object({
      isSensitiveGroup: z.boolean().default(false),
      primaryActivity: ActivityEnum.default('general'),
      locale: z.string().default('en'),
    })
    .default({ isSensitiveGroup: false, primaryActivity: 'general', locale: 'en' }),
});
export type CopilotRequest = z.infer<typeof CopilotRequestSchema>;

export const CopilotResponseSchema = z.object({
  directAnswer: z.string().min(5).max(250),
  environmentalConditions: z.string().min(5).max(200),
  recommendedAction: z.string().min(5).max(200),
  explanation: z.string().min(10).max(350),
  practicalAlternatives: z.array(z.string().min(5).max(150)).min(1).max(4),
  dataSourceAndFreshness: z.string().min(5).max(150),
  limitationsOrUncertainty: z.string().min(5).max(200),
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
