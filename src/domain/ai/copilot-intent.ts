/**
 * AirAware — Copilot Intent & Query Classifier
 * Pure deterministic classifier that analyzes the user's question and direct answer
 * to select the optimal rich presentation layout (Timing Strip, Action Checklist, Concept Explainer).
 */

export type CopilotQueryIntent =
  | 'forecast_timing'
  | 'action_mitigation'
  | 'concept_education'
  | 'general';

const TIMING_KEYWORDS = [
  'when',
  'time',
  'timing',
  'hour',
  'morning',
  'afternoon',
  'evening',
  'night',
  'window',
  'wait',
  'run',
  'walk',
  'jog',
  'exercise',
  'workout',
  'cycling',
  'laundry',
  'dry clothes',
  'ventilate',
  'open window',
  'outside',
  'outdoor',
];

const ACTION_KEYWORDS = [
  'mask',
  'n95',
  'purifier',
  'filter',
  'cadr',
  'commute',
  'metro',
  'traffic',
  'transit',
  'travel',
  'plants',
  'indoor plant',
  'air cleaner',
  'protect',
  'precaution',
  'symptom',
  'headache',
  'cough',
  'throat',
  'asthma',
  'what should i do',
  'how can i',
];

const CONCEPT_KEYWORDS = [
  'what is',
  'why does',
  'explain',
  'meaning',
  'difference',
  'definition',
  'inversion',
  'thermal inversion',
  'cpcb',
  'naqi',
  'pm2.5',
  'pm10',
  'ozone',
  'soot',
  'smog',
];

/**
 * Pure function to detect the intent of a copilot interaction.
 *
 * Checks both the user's query and the model's directAnswer for timing/scheduling cues,
 * protective actions, or conceptual educational questions.
 */
export function detectCopilotIntent(
  question: string,
  directAnswer?: string
): CopilotQueryIntent {
  const qLower = (question || '').toLowerCase();
  const aLower = (directAnswer || '').toLowerCase();
  const combined = `${qLower} ${aLower}`;

  // 1. Timing & Outdoor Safe Window Queries
  const hasTimingTrigger =
    TIMING_KEYWORDS.some((kw) => qLower.includes(kw)) ||
    /\b(safe window|wait until|best time|hours|am|pm)\b/i.test(aLower);

  if (hasTimingTrigger) {
    return 'forecast_timing';
  }

  // 2. Protective Mitigation & Practical Action Queries
  const hasActionTrigger = ACTION_KEYWORDS.some((kw) => combined.includes(kw));
  if (hasActionTrigger) {
    return 'action_mitigation';
  }

  // 3. Factual & Conceptual Queries
  const hasConceptTrigger = CONCEPT_KEYWORDS.some((kw) => qLower.includes(kw));
  if (hasConceptTrigger) {
    return 'concept_education';
  }

  return 'general';
}
