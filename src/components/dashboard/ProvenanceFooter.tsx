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
  const isStation = report?.sourceType === 'station';

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
              <span className="text-[var(--ink-secondary)]">Attribution &amp; Source Verification</span>
              <span aria-hidden="true" className="text-xs text-[var(--ink-muted)] group-open:rotate-180 transition-transform duration-200 ml-1">
                ▼
              </span>
            </h2>
            <span className="text-xs font-mono font-bold text-[var(--brand-primary)] bg-[var(--surface-card)] px-2.5 py-0.5 rounded border border-[var(--border-subtle)] shadow-2xs">
              {isStation ? 'OpenAQ Reference Monitor' : 'Open Science'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[var(--ink-muted)]">
            <span className="group-open:hidden">
              {isStation
                ? `Ground station: ${report?.stationName || 'Nearby'} (${report?.distanceKm} km away) · OpenAQ${report?.distanceKm && report.distanceKm > 10 ? ' (station far from you)' : ''} ▾`
                : `Modeled estimate: Copernicus CAMS (${report?.modelFallbackReason || 'no recent station within 25 km'}) ▾`}
            </span>
            <span className="hidden group-open:inline text-[var(--brand-primary)] font-semibold">
              Hide Details ▴
            </span>
          </div>
        </summary>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 mt-4 pt-4 border-t border-[var(--border-subtle)]">
          <div className="max-w-2xl space-y-3">
            {isStation ? (
              <p className="leading-relaxed text-xs sm:text-sm text-[var(--ink-secondary)]">
                In-situ particulate matter measurements (PM2.5 and PM10) from ground monitoring station{' '}
                <strong className="text-[var(--ink-primary)]">{report?.stationName}</strong> ({report?.distanceKm} km away), accessed via the{' '}
                <a
                  href="https://openaq.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="OpenAQ v3 Platform (opens in a new tab)"
                  className="font-bold text-[var(--brand-primary)] underline hover:text-[var(--brand-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] rounded"
                >
                  OpenAQ v3 Platform
                </a>
                . Gaseous background species and hourly forecasts remain integrated via the{' '}
                <a
                  href="https://atmosphere.copernicus.eu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Copernicus Atmosphere Monitoring Service (opens in a new tab)"
                  className="font-bold text-[var(--brand-primary)] underline hover:text-[var(--brand-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] rounded"
                >
                  Copernicus Atmosphere Monitoring Service (CAMS)
                </a>
                .
              </p>
            ) : (
              <p className="leading-relaxed text-xs sm:text-sm text-[var(--ink-secondary)]">
                Current modelled air-quality data from{' '}
                <a
                  href="https://open-meteo.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open-Meteo Weather API (opens in a new tab)"
                  className="font-bold text-[var(--brand-primary)] underline hover:text-[var(--brand-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] rounded"
                >
                  Open-Meteo
                </a>
                , powered by the{' '}
                <a
                  href="https://atmosphere.copernicus.eu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Copernicus Atmosphere Monitoring Service (opens in a new tab)"
                  className="font-bold text-[var(--brand-primary)] underline hover:text-[var(--brand-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] rounded"
                >
                  Copernicus Atmosphere Monitoring Service (CAMS)
                </a>
                . Numerical models assimilate satellite atmospheric observations, meteorological forecasts, and emission inventories.
              </p>
            )}

            <div className="p-3.5 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-xs text-[var(--ink-secondary)] leading-relaxed font-mono">
              {isStation ? (
                <span>
                  <strong className="text-[var(--ink-primary)]">Telemetry Source:</strong> Ground station: {report?.stationName}, {report?.distanceKm} km away · OpenAQ · Observed {report?.observedAt || report?.modelTimestamp} ({formatDataAge(report?.observedAt || report?.modelTimestamp)}).
                  {report?.distanceKm && report.distanceKm > 10 ? ' · This station is far from you; air near you may differ.' : ''}
                </span>
              ) : isEurope ? (
                <span>
                  <strong className="text-[var(--ink-primary)]">Model Domain:</strong> CAMS European regional ensemble (~11 km horizontal grid, 0.1° resolution).
                </span>
              ) : (
                <span>
                  <strong className="text-[var(--ink-primary)]">Model Domain:</strong> Modeled estimate (Copernicus CAMS via Open-Meteo, ~45 km grid) · {report?.modelFallbackReason || 'no recent station within 25 km'}. CAMS Global atmospheric composition (~45 km horizontal grid). Modelled regional grid output does not provide street-level precision and reflects atmospheric transport simulations rather than in-situ ground monitoring stations (such as physical CAAQMS stations in India).
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
