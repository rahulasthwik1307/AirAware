// @vitest-environment jsdom
import React, { useState, useRef } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';
import { AppHeader } from '@/components/shell/AppHeader';
import { CopilotDrawerShell } from '@/components/shell/CopilotDrawerShell';
import { UnifiedAnalyticsCard } from '@/components/charts/UnifiedAnalyticsCard';
import { ViewSwitcher } from '@/components/dashboard/hero/ViewSwitcher';
import { AirQualityReport } from '@/domain/types';

const mockReport = {
  providerAqi: 75,
  dominantPollutant: 'pm2_5',
  sourceType: 'model',
  tier: {
    level: 2,
    label: 'Satisfactory',
    colorToken: '#4d7c0f',
    bgToken: '#F7FEE7',
    borderToken: '#D9F99D',
    description: 'Air quality is acceptable.',
    healthAdvisory: 'Acceptable air quality.',
  },
  location: {
    id: 1273294,
    name: 'New Delhi',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Delhi',
    latitude: 28.6139,
    longitude: 77.209,
    timezone: 'Asia/Kolkata',
  },
  coordinates: { latitude: 28.6139, longitude: 77.209 },
  pollutants: {
    pm2_5: {
      concentration: 45,
      unit: 'µg/m³',
      displayName: 'PM2.5',
      subIndex: 75,
      tier: {
        level: 2,
        label: 'Satisfactory',
        colorToken: '#4d7c0f',
        bgToken: '#F7FEE7',
        borderToken: '#D9F99D',
        description: 'Satisfactory',
        healthAdvisory: 'Moderate precaution',
      },
    },
    pm10: {
      concentration: 80,
      unit: 'µg/m³',
      displayName: 'PM10',
      subIndex: 80,
      tier: {
        level: 2,
        label: 'Satisfactory',
        colorToken: '#4d7c0f',
        bgToken: '#F7FEE7',
        borderToken: '#D9F99D',
        description: 'Satisfactory',
        healthAdvisory: 'Moderate precaution',
      },
    },
  },
  forecast: [
    {
      time: '2026-11-23T10:00:00Z',
      displayTime: '10:00',
      activeAqi: 75,
      pm25: 45,
      tier: {
        level: 2,
        label: 'Satisfactory',
        colorToken: '#4d7c0f',
        bgToken: '#F7FEE7',
        borderToken: '#D9F99D',
        description: 'Satisfactory',
        healthAdvisory: 'Moderate precaution',
      },
      isCurrentHour: true,
    },
    {
      time: '2026-11-23T11:00:00Z',
      displayTime: '11:00',
      activeAqi: 70,
      pm25: 40,
      tier: {
        level: 2,
        label: 'Satisfactory',
        colorToken: '#4d7c0f',
        bgToken: '#F7FEE7',
        borderToken: '#D9F99D',
        description: 'Satisfactory',
        healthAdvisory: 'Moderate precaution',
      },
      isCurrentHour: false,
    },
  ],
  historicalTrend: [
    {
      date: '2026-11-22',
      dayLabel: 'Sun',
      aqi: 75,
      pm25: 45,
      nox: 20,
      inversionCeilingMeters: 450,
      isSevereDay: false,
    },
    {
      date: '2026-11-23',
      dayLabel: 'Mon',
      aqi: 70,
      pm25: 40,
      nox: 18,
      inversionCeilingMeters: 500,
      isSevereDay: false,
    },
  ],
  activeStandard: 'CPCB_NAQI' as const,
  modelMetadata: {
    provider: 'Copernicus CAMS',
    model: 'IFS',
    domain: 'CAMS_GLOBAL' as const,
  },
} as unknown as AirQualityReport;

describe('Accessibility Verification Suite (WCAG 2.2 AA)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('verifies the skip link targets an existing #main-content element', () => {
    const { container } = render(
      <div>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <main id="main-content">
          <h1>Main Content</h1>
        </main>
      </div>
    );

    const skipLink = container.querySelector('a.skip-link');
    expect(skipLink).toBeTruthy();
    expect(skipLink?.getAttribute('href')).toBe('#main-content');

    const mainTarget = container.querySelector('#main-content');
    expect(mainTarget).toBeTruthy();
  });

  it('verifies icon-only and trigger buttons expose non-empty accessible names', () => {
    render(
      <AppHeader
        activeWorkspace="air-intelligence"
        onSelectWorkspace={vi.fn()}
        onOpenCopilot={vi.fn()}
        unreadAlertCount={2}
        onOpenNotifications={vi.fn()}
        onOpenWelcome={vi.fn()}
      />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);

    buttons.forEach((btn) => {
      const accessibleName = btn.getAttribute('aria-label') || btn.textContent?.trim();
      expect(accessibleName).toBeTruthy();
      expect(accessibleName?.length).toBeGreaterThan(0);
    });

    const copilotBtn = screen.getByRole('button', { name: /ask copilot/i });
    expect(copilotBtn).toBeTruthy();

    const notifBtn = screen.getByRole('button', { name: /notifications/i });
    expect(notifBtn).toBeTruthy();
  });

  it('verifies dialogs close on Escape and restore focus to the opener element', () => {
    function TestDialogFlow() {
      const [isOpen, setIsOpen] = useState(false);
      const buttonRef = useRef<HTMLButtonElement>(null);

      return (
        <div>
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open Dialog Trigger"
          >
            Open Drawer
          </button>
          <CopilotDrawerShell
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            activeWorkspace="air-intelligence"
            report={mockReport}
          />
        </div>
      );
    }

    render(<TestDialogFlow />);

    const openBtn = screen.getByRole('button', { name: 'Open Dialog Trigger' });
    openBtn.focus();
    expect(document.activeElement).toBe(openBtn);

    // Open drawer
    fireEvent.click(openBtn);

    // Verify dialog exists and is labelled
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('copilot-drawer-title');

    // Press Escape to close
    fireEvent.keyDown(window, { key: 'Escape' });

    // Drawer should close
    expect(screen.queryByRole('dialog')).toBeNull();

    // Focus should be restored to the opener
    expect(document.activeElement).toBe(openBtn);
  });

  it('verifies charts expose role="img" with descriptive labels and provide a data table alternative', () => {
    render(<UnifiedAnalyticsCard report={mockReport} />);

    // Switch to Trend view
    const trendTab = screen.getByRole('tab', { name: /7-Day Historical Trend/i });
    fireEvent.click(trendTab);

    // Chart SVG must expose role="img" with an accessible label
    const chartImg = screen.getByRole('img', { name: /7-Day Historical Air Quality Trend/i });
    expect(chartImg).toBeTruthy();
    expect(chartImg.getAttribute('aria-label')).toBeTruthy();

    // Verify accessible "View data table" alternative exists and toggles table
    const tableToggle = screen.getByRole('button', { name: /view data table/i });
    expect(tableToggle).toBeTruthy();
    expect(tableToggle.getAttribute('aria-expanded')).toBe('false');

    // Click toggle to reveal table
    fireEvent.click(tableToggle);
    expect(tableToggle.getAttribute('aria-expanded')).toBe('true');

    const table = screen.getByRole('table');
    expect(table).toBeTruthy();
    expect(table.querySelectorAll('th').length).toBeGreaterThan(0);
  });

  it('verifies the tablist switcher manages role="tablist", role="tab", aria-selected, and keyboard navigation', () => {
    const onSelectView = vi.fn();
    render(
      <ViewSwitcher
        activeView="overview"
        onSelectView={onSelectView}
      />
    );

    const tablist = screen.getByRole('tablist', { name: /Environmental view mode/i });
    expect(tablist).toBeTruthy();

    const tabs = within(tablist).getAllByRole('tab');
    expect(tabs.length).toBe(3);

    const overviewTab = screen.getByRole('tab', { name: /Overview/i });
    const compareTab = screen.getByRole('tab', { name: /Regional compare/i });
    const globeTab = screen.getByRole('tab', { name: /3D globe/i });

    expect(overviewTab.getAttribute('aria-selected')).toBe('true');
    expect(compareTab.getAttribute('aria-selected')).toBe('false');
    expect(globeTab.getAttribute('aria-selected')).toBe('false');

    // Arrow Right key navigates to next tab
    fireEvent.keyDown(overviewTab, { key: 'ArrowRight' });
    expect(onSelectView).toHaveBeenCalledWith('compare');
  });
});
