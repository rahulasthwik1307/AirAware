// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { AirshedSourceAttributionCard } from '@/components/community/AirshedSourceAttributionCard';
import { PollutionIncident } from '@/domain/community/types';

describe('AirshedSourceAttributionCard', () => {
  afterEach(() => {
    cleanup();
  });
  const defaultProps = {
    locationName: 'Connaught Place, New Delhi',
    onNavigateWorkspace: vi.fn(),
    onAskCopilot: vi.fn(),
  };

  it('renders qualitative knowledge badge without any invented percentages', () => {
    const { container } = render(<AirshedSourceAttributionCard {...defaultProps} incidents={[]} />);

    expect(screen.getByText(/General information, not measured for your area/i)).toBeTruthy();
    expect(screen.getByText(/Solid Waste & Biomass Burning/i)).toBeTruthy();
    expect(screen.getByText(/Road & Construction Dust/i)).toBeTruthy();
    expect(screen.getByText(/Vehicular Tailpipe & Idling Smog/i)).toBeTruthy();

    // Verify there are no mock percentage symbols or fake hard-coded percentages in the card
    expect(container.textContent).not.toContain('42%');
    expect(container.textContent).not.toContain('33%');
    expect(container.textContent).not.toContain('25%');
    expect(container.textContent).not.toContain('EST. INVERSION SHARE');
    expect(container.textContent).not.toContain('~18 kg');
    expect(container.textContent).not.toContain('Soot Prevented');
  });

  it('displays friendly empty state when user has logged 0 incidents', () => {
    render(<AirshedSourceAttributionCard {...defaultProps} incidents={[]} />);

    expect(screen.getByText('No reports yet. Report an incident to see it here')).toBeTruthy();
    expect(screen.queryByText('4 Alerts Dispatched')).toBeNull();
  });

  it('displays real counters derived from user device incidents', () => {
    const mockIncidents: PollutionIncident[] = [
      {
        id: 'inc-1',
        category: 'WASTE_BURNING',
        title: 'Garbage fire',
        description: 'Leaf burning',
        locationName: 'Sector 4',
        timestamp: new Date().toISOString(),
        status: 'LOGGED_LOCALLY',
        severity: 'HIGH',
      },
      {
        id: 'inc-2',
        category: 'CONSTRUCTION_DUST',
        title: 'Cement plume',
        description: 'Uncovered dust',
        locationName: 'Sector 5',
        timestamp: new Date().toISOString(),
        status: 'EXPORTED_CPCB',
        severity: 'HIGH',
      },
      {
        id: 'inc-3',
        category: 'TRAFFIC_IDLING',
        title: 'School bus idling',
        description: 'Heavy diesel exhaust',
        locationName: 'Gate 1',
        timestamp: new Date().toISOString(),
        status: 'RESOLVED_LOCALLY',
        severity: 'LOW',
      },
    ];

    render(<AirshedSourceAttributionCard {...defaultProps} incidents={mockIncidents} />);

    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('Reports Logged')).toBeTruthy();
    expect(screen.getByText('CPCB Escalated')).toBeTruthy();
    expect(screen.getByText('Resolved Locally')).toBeTruthy();
    expect(screen.getByText('✓ Real Local Actions')).toBeTruthy();
  });

  it('expands source details when clicked', () => {
    render(<AirshedSourceAttributionCard {...defaultProps} incidents={[]} />);

    const sourceItem = screen.getByText('Solid Waste & Biomass Burning');
    fireEvent.click(sourceItem);

    expect(screen.getByText(/Elemental Black Carbon/i)).toBeTruthy();
    expect(screen.getByText(/Provide electric radiant heaters to gate guards/i)).toBeTruthy();
  });
});
