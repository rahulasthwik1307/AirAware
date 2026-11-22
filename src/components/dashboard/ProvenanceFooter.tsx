'use client';

import React from 'react';
import { AirQualityReport } from '@/domain/types';

interface ProvenanceFooterProps {
  readonly report: AirQualityReport | null;
}

function formatDataAge(timestampStr?: string): string {
  if (!timestampStr) return 'recent';
  try {
    const iso = timestampStr.includes('T') ? timestampStr : timestampStr.replace(' ', 'T');
    const time = new Date(iso).getTime();
    if (isNaN(time)) return 'recent';
    const diffMs = Date.now() - time;
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    return `${diffHours}h ${diffMin % 60}m ago`;
  } catch {
    return 'recent';
  }
}

export function ProvenanceFooter({ report }: ProvenanceFooterProps) {
  const isEurope = report?.modelMetadata.domain === 'CAMS_EUROPE';

  return (
    <footer
      aria-labelledby="provenance-heading"
      className="mt-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)]/70 p-4 sm:p-6 text-xs text-[var(--ink-secondary)] shadow-xs transition-all"
    >
      <details className="group">
        <summary className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer list-none select-none">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              id="provenance-heading"
              className="text-xs sm:text-sm font-bold text-[var(--ink-primary)] font-sans flex flex-wrap items-center gap-2"
            >
              <span className="flex items-center gap-1.5 text-[var(--brand-primary)]">
                <span>🌐</span>
                <span>Scientific Data Provenance</span>
              </span>
              <span className="text-[var(--ink-secondary)]">Attribution &amp; Model Domain</span>
              <span aria-hidden="true" className="text-xs text-[var(--ink-muted)] group-open:rotate-180 transition-transform duration-200 ml-1">
                ▼
              </span>
            </h2>
            <span className="text-xs font-mono font-bold text-[var(--brand-primary)] bg-[var(--surface-card)] px-2.5 py-0.5 rounded border border-[var(--border-subtle)] shadow-2xs">
              Open Science
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[var(--ink-muted)]">
            <span className="group-open:hidden">
              Copernicus CAMS IFS and Open-Meteo disclosure ▾
            </span>
            <span className="hidden group-open:inline text-[var(--brand-primary)] font-semibold">
              Hide Details ▴
            </span>
          </div>
        </summary>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 mt-4 pt-4 border-t border-[var(--border-subtle)]">
          <div className="max-w-2xl space-y-3">
            <p className="leading-relaxed text-xs sm:text-sm text-[var(--ink-secondary)]">
              Current modelled air-quality data from{' '}
              <a
                href="https://open-meteo.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[var(--brand-primary)] underline hover:text-[var(--brand-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] rounded"
              >
                Open-Meteo
              </a>
              , powered by the{' '}
              <a
                href="https://atmosphere.copernicus.eu/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[var(--brand-primary)] underline hover:text-[var(--brand-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] rounded"
              >
                Copernicus Atmosphere Monitoring Service (CAMS)
              </a>
              . Numerical models assimilate satellite atmospheric observations, meteorological forecasts, and emission inventories.
            </p>

            <div className="p-3.5 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-xs text-[var(--ink-secondary)] leading-relaxed font-mono">
              {isEurope ? (
                <span>
                  <strong className="text-[var(--ink-primary)]">Model Domain:</strong> CAMS European regional ensemble (~11 km horizontal grid, 0.1° resolution).
                </span>
              ) : (
                <span>
                  <strong className="text-[var(--ink-primary)]">Model Domain:</strong> CAMS Global atmospheric composition (~45 km horizontal grid, 0.4° resolution). Modelled regional grid output does not provide street-level precision and reflects atmospheric transport simulations rather than in-situ ground monitoring stations (such as physical CAAQMS stations in India).
                </span>
              )}
            </div>

            <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
              <strong>Notice:</strong> Modelled environmental simulations reflect ambient regional atmospheric conditions for general public awareness. They do not constitute verified ground-truth sensor measurements or official civil emergency directives.
            </p>
          </div>

          {report && (
            <div className="flex flex-col sm:items-end gap-2 text-xs text-[var(--ink-muted)] flex-shrink-0 font-mono bg-[var(--surface-card)] p-4 rounded-xl border border-[var(--border-subtle)] shadow-2xs">
              <span className="font-bold text-sm text-[var(--ink-primary)]">
                Observation Time: {report.modelTimestamp}
              </span>
              <span>
                Data Age: <strong className="text-[var(--ink-primary)] font-bold">{formatDataAge(report.modelTimestamp)}</strong>
              </span>
              <span>Cadence: <strong className="text-[var(--ink-secondary)]">{report.modelMetadata.temporalResolution}</strong></span>
              <span>Dataset: <strong className="text-[var(--ink-secondary)]">{report.modelMetadata.domainName}</strong></span>
              <span className="text-xs font-bold text-[var(--brand-primary)] bg-[var(--brand-surface)] px-2.5 py-1 rounded-md border border-[var(--brand-primary)]/30 mt-1">
                Modeled estimate (Copernicus CAMS via Open-Meteo, ~45 km grid) • Modelled Environmental Simulation
              </span>
              <span className="text-[10px] text-[var(--ink-muted)] italic">
                Numerical atmospheric simulation · Not ground station reading
              </span>
            </div>
          )}
        </div>
      </details>
    </footer>
  );
}
