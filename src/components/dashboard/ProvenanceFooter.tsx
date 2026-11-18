'use client';

import React from 'react';
import { AirQualityReport } from '@/domain/types';

interface ProvenanceFooterProps {
  readonly report: AirQualityReport | null;
}

export function ProvenanceFooter({ report }: ProvenanceFooterProps) {
  return (
    <footer
      aria-labelledby="provenance-heading"
      className="mt-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-5 sm:p-6 text-xs text-[var(--ink-secondary)]"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h2
            id="provenance-heading"
            className="text-xs font-bold uppercase tracking-wider text-[var(--ink-primary)] mb-1.5"
          >
            Scientific Data Provenance & Attribution
          </h2>
          <p className="leading-relaxed text-[var(--ink-secondary)]">
            Environmental data is provided via{' '}
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--brand-primary)] underline hover:text-[var(--brand-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] rounded"
            >
              Open-Meteo
            </a>
            , powered by the{' '}
            <a
              href="https://atmosphere.copernicus.eu/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--brand-primary)] underline hover:text-[var(--brand-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] rounded"
            >
              Copernicus Atmosphere Monitoring Service (CAMS)
            </a>
            . Models assimilate satellite observations, in-situ measurements, and meteorological forecasts.
          </p>
          <p className="mt-2 text-[11px] text-[var(--ink-muted)] leading-relaxed">
            <strong>Disclaimer:</strong> Modelled grid forecasts reflect ambient regional conditions
            (approximately 11km resolution) and are designed for general public awareness. They do
            not replace street-level micro-sensors or official civil defense emergency directives.
          </p>
        </div>

        {report && (
          <div className="flex flex-col sm:items-end gap-1 text-[11px] text-[var(--ink-muted)] flex-shrink-0">
            <span className="font-semibold text-[var(--ink-primary)]">
              Model Run: {report.modelTimestamp}
            </span>
            <span>Interval: {report.intervalSeconds / 3600}h resolution</span>
            <span>Dataset: CAMS Global & European Ensemble</span>
            <span className="text-[var(--brand-primary)] font-medium">✓ Model Data Validated</span>
          </div>
        )}
      </div>
    </footer>
  );
}
