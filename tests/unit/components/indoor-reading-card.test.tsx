// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { IndoorAirReadingCard } from '@/components/indoor/IndoorAirReadingCard';
import { loadIndoorState } from '@/domain/indoor/storage';

describe('IndoorAirReadingCard Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders rough estimate path with ~60% building infiltration when user has no monitor', () => {
    render(
      <IndoorAirReadingCard
        outdoorPm25={100}
        savedReading={null}
        hasMonitor={false}
      />
    );

    // Should indicate rough estimate
    expect(screen.getByText(/Rough estimate · not a measurement/i)).toBeTruthy();
    expect(screen.getByText(/~60% of ambient outdoor PM2.5/i)).toBeTruthy();
    // 60% of 100 µg/m³ = 60 µg/m³
    expect(document.body.textContent).toContain('60 µg/m³');
    // 60 µg/m³ is CPCB Satisfactory
    expect(screen.getByText('Satisfactory')).toBeTruthy();
  });

  it('classifies custom indoor sensor reading and allows switching to monitor mode', () => {
    render(
      <IndoorAirReadingCard
        outdoorPm25={120}
        savedReading={25}
        hasMonitor={true}
      />
    );

    // 25 µg/m³ is classified as Good
    expect(screen.getByText('Good')).toBeTruthy();
    expect(screen.getByRole('button', { name: /I have a monitor \/ purifier reading/i })).toBeTruthy();
  });

  it('persists entered monitor reading to localStorage when user saves', () => {
    render(
      <IndoorAirReadingCard
        outdoorPm25={80}
        savedReading={null}
        hasMonitor={true}
      />
    );

    const input = screen.getByLabelText(/Your indoor PM2\.5 reading/i);
    expect(input).toBeTruthy();

    fireEvent.change(input, { target: { value: '35' } });
    const saveBtn = screen.getByRole('button', { name: /Update reading/i });
    fireEvent.click(saveBtn);

    // Verify persistence in local storage
    const state = loadIndoorState();
    expect(state.hasMonitor).toBe(true);
    expect(state.indoorPm25Reading).toBe(35);
  });
});
