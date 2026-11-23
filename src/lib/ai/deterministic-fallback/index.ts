import { GuidanceRequest, GuidanceResponse, CopilotRequest, CopilotResponse } from '../types';
import { evaluateTierGuidance } from './guidance-rules';
import { buildHouseholdPlan } from './profile-plans';
import { getDeterministicCopilotAnswer } from './copilot-answers';

export { getDeterministicCopilotAnswer };

/**
 * Generates deterministic proactive guidance cards from verified environmental rules.
 */
export function getDeterministicGuidance(data: GuidanceRequest): GuidanceResponse {
  const { category, userContext } = data;
  const activity = userContext.primaryActivity;

  const tierGuidance = evaluateTierGuidance(data);
  const actionRecommendations = [...tierGuidance.actionRecommendations];

  // Activity-specific refinement
  if (
    activity === 'daily_commute' &&
    (category === 'Unhealthy' ||
      category === 'Very Unhealthy' ||
      category === 'Hazardous' ||
      category === 'Poor' ||
      category === 'Very Poor' ||
      category === 'Severe')
  ) {
    actionRecommendations.unshift(
      'Use closed-window transit (metro or car with recirculated AC) rather than walking or open cycling.'
    );
  }

  const todayHouseholdPlan = buildHouseholdPlan(data);

  return {
    headline: tierGuidance.headline,
    healthSummary: tierGuidance.healthSummary,
    actionRecommendations: actionRecommendations.slice(0, 4),
    sensitiveGroupAdvisory: tierGuidance.sensitiveGroupAdvisory,
    ventilationRecommendation: tierGuidance.ventilationRecommendation,
    todayHouseholdPlan,
    modelName: 'Rule-based fallback',
    isDeterministicFallback: true,
  };
}
