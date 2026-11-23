// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { HouseholdProfilesManager } from '@/components/planner/HouseholdProfilesManager';
import { HouseholdMember } from '@/domain/household/types';

describe('Household Profile Add/Edit/Remove Flow', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  const initialMembers: HouseholdMember[] = [
    {
      id: 'm1',
      nickname: 'Aarav',
      archetype: 'CHILD_STUDENT',
      sensitivityTier: 'PEDIATRIC',
      createdAt: '2026-11-23T10:00:00Z',
      schedules: [],
    },
    {
      id: 'm2',
      nickname: 'Priya',
      archetype: 'WORKING_COMMUTER',
      sensitivityTier: 'NONE',
      createdAt: '2026-11-23T10:00:00Z',
      schedules: [],
    },
  ];

  it('renders member filter pills and switches active view filter', () => {
    const handleSelectFilter = vi.fn();

    render(
      <HouseholdProfilesManager
        members={initialMembers}
        selectedViewFilter="ALL_FAMILY"
        onSelectViewFilter={handleSelectFilter}
        onAddMember={vi.fn()}
        onUpdateMember={vi.fn()}
        onRemoveMember={vi.fn()}
        onAddSchedule={vi.fn()}
        onRemoveSchedule={vi.fn()}
        isSettingsOpen={false}
        onToggleSettings={vi.fn()}
      />
    );

    expect(screen.getByText('All Family')).toBeDefined();
    expect(screen.getByText('Aarav')).toBeDefined();
    expect(screen.getByText('Priya')).toBeDefined();

    // Click Aarav pill
    fireEvent.click(screen.getByText('Aarav'));
    expect(handleSelectFilter).toHaveBeenCalledWith('m1');
  });

  it('toggles settings drawer and provides add/edit/remove controls', () => {
    const handleToggleSettings = vi.fn();
    const handleRemoveMember = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <HouseholdProfilesManager
        members={initialMembers}
        selectedViewFilter="ALL_FAMILY"
        onSelectViewFilter={vi.fn()}
        onAddMember={vi.fn()}
        onUpdateMember={vi.fn()}
        onRemoveMember={handleRemoveMember}
        onAddSchedule={vi.fn()}
        onRemoveSchedule={vi.fn()}
        isSettingsOpen={true}
        onToggleSettings={handleToggleSettings}
      />
    );

    // When settings is open, member management drawer renders
    expect(screen.getByText(/Household Profiles & Baseline Schedules/i)).toBeDefined();
    expect(screen.getByText('2/4 Configured')).toBeDefined();

    // Remove Aarav
    const removeAaravBtn = screen.getByRole('button', { name: 'Remove member Aarav' });
    fireEvent.click(removeAaravBtn);
    expect(handleRemoveMember).toHaveBeenCalledWith('m1');
  });

  it('enforces maximum 4 household members limit', () => {
    const fourMembers: HouseholdMember[] = [
      ...initialMembers,
      {
        id: 'm3',
        nickname: 'Grandma',
        archetype: 'SENIOR_VULNERABLE',
        sensitivityTier: 'SENIOR',
        createdAt: '2026-11-23T10:00:00Z',
        schedules: [],
      },
      {
        id: 'm4',
        nickname: 'Grandpa',
        archetype: 'SENIOR_VULNERABLE',
        sensitivityTier: 'SENIOR',
        createdAt: '2026-11-23T10:00:00Z',
        schedules: [],
      },
    ];

    render(
      <HouseholdProfilesManager
        members={fourMembers}
        selectedViewFilter="ALL_FAMILY"
        onSelectViewFilter={vi.fn()}
        onAddMember={vi.fn()}
        onUpdateMember={vi.fn()}
        onRemoveMember={vi.fn()}
        onAddSchedule={vi.fn()}
        onRemoveSchedule={vi.fn()}
        isSettingsOpen={true}
        onToggleSettings={vi.fn()}
      />
    );

    const addBtn = screen.getByRole('button', { name: /\+ Add Member/i });
    expect((addBtn as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('4/4 Configured')).toBeDefined();
  });
});
