'use client';

import React from 'react';
import { AirQualityReport } from '@/domain/types';

interface ProvenanceFooterProps {
  readonly report: AirQualityReport | null;
}

export function ProvenanceFooter({ report }: ProvenanceFooterProps) {
  const isEurope = report?.modelMetadata.domain === 'CAMS_EUROPE';

  return (
    <footer
      aria-labelledby="provenance-heading"
      className="mt-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-5 sm:p-6 text-xs text-[var(--ink-secondary)]"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-1.5">
            <h2
              id="provenance-heading"
              className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--ink-primary)]"
            >
              Scientific Data Provenance &amp; Attribution
            </h2>
            <span className="text-[10px] font-mono text-[var(--brand-primary)] bg-[var(--surface-card)] px-1.5 py-0.2 rounded border border-[var(--border-subtle)]">
              Open Science
            </span>
          </div>

          <p className="leading-relaxed text-[var(--ink-secondary)]">
            Current modelled air-quality data from{' '}
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
            . Numerical models assimilate satellite atmospheric observations, meteorological forecasts, and emission inventories.
          </p>

          <p className="mt-2 text-[11px] text-[var(--ink-muted)] leading-relaxed font-mono">
            {isEurope ? (
              <span>
                <strong>Model Domain:</strong> CAMS European regional ensemble (~11 km horizontal grid, 0.1° resolution).
              </span>
            ) : (
              <span>
                <strong>Model Domain:</strong> CAMS Global atmospheric composition (~45 km horizontal grid, 0.4° resolution). Modelled regional grid output does not provide street-level precision and reflects atmospheric transport simulations rather than in-situ ground monitoring stations (such as physical CAAQMS stations in India).
              </span>
            )}
          </p>

          <p className="mt-1.5 text-[10px] text-[var(--ink-muted)] leading-relaxed">
            <strong>Notice:</strong> Modelled environmental simulations reflect ambient regional atmospheric conditions for general public awareness. They do not constitute verified ground-truth sensor measurements or official civil emergency directives.
          </p>
        </div>

        {report && (
          <div className="flex flex-col sm:items-end gap-1.5 text-[11px] text-[var(--ink-muted)] flex-shrink-0 font-mono">
            <span className="font-semibold text-[var(--ink-primary)]">
              Model Run: {report.modelTimestamp}
            </span>
            <span>Cadence: {report.modelMetadata.temporalResolution}</span>
            <span>Dataset: {report.modelMetadata.domainName}</span>
            <span className="text-[10px] font-bold text-[var(--brand-primary)] bg-[var(--surface-card)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
              Modelled Environmental Simulation
            </span>
          </div>
        )}
      </div>
    </footer>
  );
}
