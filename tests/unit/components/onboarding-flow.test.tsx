// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { OnboardingModal } from '@/components/welcome/OnboardingModal';

describe('OnboardingModal Component Flow', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    globalThis.fetch = originalFetch;
  });

  it('renders step 1 with presets and advances through steps to completion', async () => {
    const handleComplete = vi.fn();
    const handleCancel = vi.fn();
    const handleSkip = vi.fn();

    render(
      <OnboardingModal
        isOpen={true}
        onComplete={handleComplete}
        onCancel={handleCancel}
        onSkip={handleSkip}
      />
    );

    // Step 1: Step indicator and presets
    expect(screen.getByText('Step 1 of 3')).toBeDefined();
    expect(screen.getByText('Where do you breathe most days?')).toBeDefined();

    // Select a city preset (e.g. Mumbai)
    const mumbaiPreset = screen.getByRole('button', { name: /mumbai/i });
    fireEvent.click(mumbaiPreset);

    // Proceed to Step 2
    const nextBtn1 = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(nextBtn1);

    // Step 2: Household sensitivities
    expect(screen.getByText('Step 2 of 3')).toBeDefined();
    expect(screen.getByText('Who are you protecting in your home?')).toBeDefined();

    // Toggle a sensitivity checkbox
    const seniorOption = screen.getByLabelText(/elderly/i);
    fireEvent.click(seniorOption);

    // Proceed to Step 3
    const nextBtn2 = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(nextBtn2);

    // Step 3: Focus goal / initial workspace
    expect(screen.getByText('Step 3 of 3')).toBeDefined();
    expect(screen.getByText('What is your main focus today?')).toBeDefined();

    // Select a workspace goal (Family Planner)
    const routineGoal = screen.getByText(/family morning routines/i);
    fireEvent.click(routineGoal);

    // Finish Setup
    const finishBtn = screen.getByRole('button', { name: /finish & open my dashboard/i });
    fireEvent.click(finishBtn);

    expect(handleComplete).toHaveBeenCalledTimes(1);
    const result = handleComplete.mock.calls[0][0];
    expect(result.location.name).toBe('Mumbai');
    expect(result.householdSensitivities).toContain('elderly_parents');
    expect(result.initialWorkspace).toBe('family-planner');
  });

  it('handles GPS location denial gracefully on Step 1', async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn((_success, error) => {
        error({ code: 1, message: 'User denied Geolocation' });
      }),
    };
    vi.stubGlobal('navigator', { geolocation: mockGeolocation });

    render(
      <OnboardingModal
        isOpen={true}
        onComplete={vi.fn()}
        onCancel={vi.fn()}
        onSkip={vi.fn()}
      />
    );

    const gpsBtn = screen.getByRole('button', { name: /detect with device gps/i });
    fireEvent.click(gpsBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Location permission denied. Please select or search your city below./i)
      ).toBeDefined();
    });
  });

  it('triggers onCancel when Escape key is pressed or close button is clicked', () => {
    const handleCancel = vi.fn();

    render(
      <OnboardingModal
        isOpen={true}
        onComplete={vi.fn()}
        onCancel={handleCancel}
        onSkip={vi.fn()}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /close setup modal/i });
    fireEvent.click(closeBtn);
    expect(handleCancel).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleCancel).toHaveBeenCalledTimes(2);
  });
});
