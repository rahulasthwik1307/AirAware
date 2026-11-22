import { describe, it, expect } from 'vitest';
import { detectCopilotIntent } from '@/domain/ai/copilot-intent';

describe('detectCopilotIntent', () => {
  it('identifies timing and outdoor questions as forecast_timing', () => {
    expect(detectCopilotIntent('Can I dry clothes outside today?')).toBe('forecast_timing');
    expect(detectCopilotIntent('When is the best time for my morning jog?')).toBe('forecast_timing');
    expect(detectCopilotIntent('When should I open my windows?')).toBe('forecast_timing');
    expect(
      detectCopilotIntent('Is it okay to go out?', 'Wait until 3 PM when solar heating disperses the smog layer.')
    ).toBe('forecast_timing');
  });

  it('identifies mask, purifier and commuting questions as action_mitigation', () => {
    expect(detectCopilotIntent('Which mask should I buy for winter smog?')).toBe('action_mitigation');
    expect(detectCopilotIntent('What CADR purifier do I need for a 200 sq ft room?')).toBe('action_mitigation');
    expect(detectCopilotIntent('How should working commuters travel during smog peaks?')).toBe('action_mitigation');
    expect(detectCopilotIntent('Can indoor plants clean my bedroom air?')).toBe('action_mitigation');
  });

  it('identifies educational questions as concept_education', () => {
    expect(detectCopilotIntent('What is thermal inversion?')).toBe('concept_education');
    expect(detectCopilotIntent('Why does winter trap toxic smog near the ground?')).toBe('concept_education');
    expect(detectCopilotIntent('What is the difference between PM2.5 soot and Ozone?')).toBe('concept_education');
  });

  it('defaults to general for non-specific queries', () => {
    expect(detectCopilotIntent('Hello there')).toBe('general');
  });
});
