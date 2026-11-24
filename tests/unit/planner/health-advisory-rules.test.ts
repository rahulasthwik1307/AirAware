import { describe, it, expect } from 'vitest';
import { getHealthActionCards, ActionCard } from '@/domain/planner/health-advisory-rules';

describe('health-advisory-rules domain module', () => {
  const verifyCardStructure = (cards: ActionCard[]) => {
    expect(cards).toHaveLength(4);
    const icons = cards.map((c) => c.iconType);
    expect(icons).toContain('mask');
    expect(icons).toContain('window');
    expect(icons).toContain('exercise');
    expect(icons).toContain('sensitive');

    for (const card of cards) {
      expect(card.title).toBeTruthy();
      expect(card.recommendation).toBeTruthy();
      expect(card.practicalTip).toBeTruthy();
      expect(card.badge).toBeTruthy();
      expect(['good', 'moderate', 'warning', 'alert']).toContain(card.badgeType);
    }
  };

  it('generates tier 1 (Good) action cards', () => {
    const cards = getHealthActionCards(1);
    verifyCardStructure(cards);
    expect(cards.every((c) => c.badgeType === 'good')).toBe(true);
    expect(cards.find((c) => c.iconType === 'mask')?.badge).toBe('Not Required');
    expect(cards.find((c) => c.iconType === 'window')?.targetWorkspace).toBe('indoor-air');
    expect(cards.find((c) => c.iconType === 'exercise')?.targetWorkspace).toBe('family-planner');
  });

  it('generates tier 2 (Moderate) action cards', () => {
    const cards = getHealthActionCards(2);
    verifyCardStructure(cards);
    expect(cards.every((c) => c.badgeType === 'moderate')).toBe(true);
    expect(cards.find((c) => c.iconType === 'mask')?.badge).toBe('Optional in Traffic');
    expect(cards.find((c) => c.iconType === 'exercise')?.badge).toBe('Pacing Advised');
  });

  it('generates tier 3 (Unhealthy for Sensitive Groups) action cards', () => {
    const cards = getHealthActionCards(3);
    verifyCardStructure(cards);
    expect(cards.every((c) => c.badgeType === 'warning')).toBe(true);
    expect(cards.find((c) => c.iconType === 'mask')?.badge).toBe('N95 Recommended');
    expect(cards.find((c) => c.iconType === 'window')?.badge).toBe('Seal Morning Smog');
  });

  it('generates tier 4 (Unhealthy) action cards', () => {
    const cards = getHealthActionCards(4);
    verifyCardStructure(cards);
    expect(cards.every((c) => c.badgeType === 'alert')).toBe(true);
    expect(cards.find((c) => c.iconType === 'mask')?.badge).toBe('N95 Mandatory');
    expect(cards.find((c) => c.iconType === 'exercise')?.badge).toBe('Cancel Outdoor Cardio');
  });

  it('generates tier 5 & 6 (Severe Winter Smog) emergency action cards', () => {
    const tier5Cards = getHealthActionCards(5);
    verifyCardStructure(tier5Cards);
    expect(tier5Cards.every((c) => c.badgeType === 'alert')).toBe(true);
    expect(tier5Cards.find((c) => c.iconType === 'mask')?.badge).toBe('N95/FFP3 Required');
    expect(tier5Cards.find((c) => c.iconType === 'window')?.badge).toBe('Sanctuary Protocol');
    expect(tier5Cards.find((c) => c.iconType === 'exercise')?.badge).toBe('Zero Outdoor Cardio');

    const tier6Cards = getHealthActionCards(6);
    expect(tier6Cards).toEqual(tier5Cards);
  });
});
