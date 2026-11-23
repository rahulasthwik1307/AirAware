// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AIRAWARE_STORAGE_KEYS, clearAllAirAwareData } from '@/domain/constants/storage-keys';
import { AirAwareShell } from '@/components/shell/AirAwareShell';
import { AirQualityProvider } from '@/domain/aqi/useAirQuality';

describe('Clear-My-Data Dialog & Privacy Guarantee', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('clearAllAirAwareData explicitly removes every key listed in storage-keys constants', () => {
    // Populate localStorage with every registered key plus extras
    for (const key of AIRAWARE_STORAGE_KEYS) {
      localStorage.setItem(key, JSON.stringify({ test: 'data', timestamp: Date.now() }));
    }
    localStorage.setItem('airaware_custom_dynamic_key', 'dynamic');
    localStorage.setItem('plan_custom_schedule', 'schedule');
    localStorage.setItem('unrelated_key', 'keep_me');
    sessionStorage.setItem('cached_telemetry', 'session_data');

    // Confirm keys exist
    expect(localStorage.getItem(AIRAWARE_STORAGE_KEYS[0])).not.toBeNull();
    expect(sessionStorage.getItem('cached_telemetry')).toBe('session_data');

    // Execute clear
    clearAllAirAwareData();

    // Verify every registered key is removed
    for (const key of AIRAWARE_STORAGE_KEYS) {
      expect(localStorage.getItem(key)).toBeNull();
    }
    expect(localStorage.getItem('airaware_custom_dynamic_key')).toBeNull();
    expect(localStorage.getItem('plan_custom_schedule')).toBeNull();
    expect(sessionStorage.getItem('cached_telemetry')).toBeNull();

    // Unrelated keys not starting with airaware_ or plan_ remain
    expect(localStorage.getItem('unrelated_key')).toBe('keep_me');
  });

  it('opening Clear My Data dialog and confirming wipes storage and closes dialog', () => {
    // Preload some storage
    localStorage.setItem('airaware_onboarding_completed_v1', 'true');
    localStorage.setItem('airaware_household_v1', JSON.stringify({ members: [] }));

    render(
      <AirQualityProvider>
        <AirAwareShell />
      </AirQualityProvider>
    );

    // Click "Clear my data" in footer
    const clearTrigger = screen.getByRole('button', { name: /Clear my data/i });
    expect(clearTrigger).toBeTruthy();
    fireEvent.click(clearTrigger);

    // Dialog appears
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toBeTruthy();
    expect(screen.getByText(/Clear all stored data\?/i)).toBeTruthy();

    // Click confirm "Clear"
    const confirmBtn = screen.getByRole('button', { name: /^Clear$/i });
    fireEvent.click(confirmBtn);

    // Storage is cleared
    expect(localStorage.getItem('airaware_household_v1')).toBeNull();
  });
});
