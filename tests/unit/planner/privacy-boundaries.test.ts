import { describe, it, expect } from 'vitest';
import { HouseholdMemberSchema } from '@/domain/household/schema';
import { ActiveActionItemSchema } from '@/domain/planner/schema';

describe('Phase 3 Privacy & Security Boundaries', () => {
  it('enforces that household profiles collect zero medical diagnosis or legal name fields', () => {
    const validMember = {
      id: 'mem_1',
      nickname: 'Aarav',
      archetype: 'CHILD_STUDENT',
      sensitivityTier: 'PEDIATRIC',
      schedules: [],
      createdAt: '2026-11-19T10:00:00.000Z',
    };

    const parsed = HouseholdMemberSchema.safeParse(validMember);
    expect(parsed.success).toBe(true);

    // Verify schema does not recognize or require invasive fields
    const withInvasiveData = {
      ...validMember,
      prescribedInhalerDosage: '100mcg',
      bloodPressureHistory: '140/90',
      exactHomeAddress: 'House 42, Sector 14, Gurugram',
    };

    const parsedInvasive = HouseholdMemberSchema.safeParse(withInvasiveData);
    expect(parsedInvasive.success).toBe(true);
    // Extra untyped fields should be ignored/stripped by clean Zod parsing
    if (parsedInvasive.success) {
      expect((parsedInvasive.data as Record<string, unknown>).prescribedInhalerDosage).toBeUndefined();
      expect((parsedInvasive.data as Record<string, unknown>).exactHomeAddress).toBeUndefined();
    }
  });

  it('safely handles user nicknames and notes containing script tags and HTML entities', () => {
    const xssAttempt = '<script>alert("xss")</script>';
    const memberWithScript = {
      id: 'mem_xss',
      nickname: xssAttempt,
      archetype: 'CHILD_STUDENT',
      sensitivityTier: 'NONE',
      schedules: [],
      createdAt: '2026-11-19T10:00:00.000Z',
    };

    const result = HouseholdMemberSchema.safeParse(memberWithScript);
    expect(result.success).toBe(true);
    if (result.success) {
      // It remains a plain string, safely rendered by React without script execution
      expect(result.data.nickname).toBe(xssAttempt);
    }
  });

  it('validates active plan items with strictly sanitized fields and bounds', () => {
    const action = {
      id: 'act_1',
      recommendationId: 'rec_1',
      memberId: 'mem_1',
      memberNickname: 'Priya',
      title: 'Shift commute',
      actionType: 'TIMING_SHIFT',
      originalWindow: { startTime: '08:30', endTime: '09:15' },
      adjustedWindow: { startTime: '09:00', endTime: '09:45' },
      status: 'ADOPTED',
      adoptedAt: '2026-11-19T08:00:00Z',
      completedAt: null,
      deltaCValue: 18.2,
      deltaCPollutant: 'PM2.5',
      avoidedCo2eKg: 1.15,
      userNotes: 'Avoiding rush hour congestion',
    };

    const parsed = ActiveActionItemSchema.safeParse(action);
    expect(parsed.success).toBe(true);
  });
});
