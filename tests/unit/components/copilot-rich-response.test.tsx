// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { CopilotRichResponse } from '@/components/copilot/CopilotRichResponse';
import { CopilotDrawerShell } from '@/components/shell/CopilotDrawerShell';
import { CopilotResponse } from '@/lib/ai/types';
import { AirQualityReport } from '@/domain/types';

describe('CopilotRichResponse Component & Intent Selector', () => {
  const mockReport: AirQualityReport = {
    providerAqi: 72,
    dominantPollutant: 'pm2_5',
    sourceType: 'station',
    stationName: 'Anand Vihar, Delhi - DPCC',
    distanceKm: 4.5,
    observedAt: '2026-11-23T10:00:00Z',
    modelTimestamp: '2026-11-23T10:00:00Z',
    tier: {
      level: 2,
      label: 'Satisfactory',
      colorToken: '#4d7c0f',
      bgToken: '#F7FEE7',
      borderToken: '#D9F99D',
      description: 'Acceptable',
      healthAdvisory: 'Acceptable',
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
        concentration: 42,
        unit: 'µg/m³',
        displayName: 'PM2.5',
        subIndex: 72,
        tier: null,
      },
    },
    forecast: [
      {
        time: '2026-11-23T10:00:00Z',
        displayTime: '10:00',
        activeAqi: 72,
        usAqi: 72,
        europeanAqi: null,
        tier: null,
        pm25: 42,
      },
      {
        time: '2026-11-23T11:00:00Z',
        displayTime: '11:00',
        activeAqi: 68,
        usAqi: 68,
        europeanAqi: null,
        tier: null,
        pm25: 39,
      },
    ],
    activeStandard: 'CPCB_NAQI',
  } as unknown as AirQualityReport;

  const validResponse: CopilotResponse = {
    directAnswer: 'Air quality is satisfactory. Outdoor exercise is safe right now.',
    environmentalConditions: 'Boundary layer height is healthy at 800m with moderate winds.',
    recommendedAction: 'Ideal window for morning workouts and short errands.',
    practicalAlternatives: ['Jog in public parks', 'Open north-facing windows briefly'],
    explanation: 'Current PM2.5 concentrations remain below 60 µg/m³.',
    dataSourceAndFreshness: 'Observed 10m ago via OpenAQ',
    limitationsOrUncertainty: 'Micro-climate variations may occur near major roads.',
    isDeterministicFallback: false,
    modelName: '@cf/meta/llama-3.1-8b-instruct',
  };

  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it('facts chips use the report AQI, scale name, and category', () => {
    render(
      <CopilotRichResponse
        question="Is it safe to run outside?"
        response={validResponse}
        report={mockReport}
      />
    );

    // Direct answer headline
    expect(screen.getByText(validResponse.directAnswer)).toBeTruthy();

    // Facts chips
    expect(screen.getByText(/AQI 70/i)).toBeTruthy();
    expect(screen.getByText(/\(Satisfactory\)/i)).toBeTruthy();
    expect(screen.getByText(/CPCB NAQI/i)).toBeTruthy();
    expect(screen.getByText(/📍 New Delhi/i)).toBeTruthy();
  });

  it('renders timing strip when question asks about best time or forecast timing', () => {
    render(
      <CopilotRichResponse
        question="What is the best time to open windows today?"
        response={validResponse}
        report={mockReport}
      />
    );

    // Strip shown for timing questions
    expect(screen.getByText(/Next 12-Hour Air Quality Window/i)).toBeTruthy();
    expect(screen.getAllByText('10:00')[0]).toBeTruthy();
    expect(screen.getAllByText('11:00')[0]).toBeTruthy();
  });

  it('renders raw text fallback in conversation stream when structured response parsing is null', () => {
    // In CopilotDrawerShell, messages with response: null render raw text fallback
    render(
      <CopilotDrawerShell
        isOpen={true}
        onClose={() => {}}
        activeWorkspace="air-intelligence"
        report={mockReport}
      />
    );

    // Default welcoming message has no structured response object and renders text fallback
    expect(
      screen.getByText(/I am your AirAware Copilot/i)
    ).toBeTruthy();
  });
});
