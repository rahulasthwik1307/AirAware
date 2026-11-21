'use client';

import React from 'react';
import { AirQualityReport } from '@/domain/types';
import { classifyCpcbPm25 } from '@/domain/aqi/cpcb-benchmark';

interface ScientificGroundingProps {
  readonly report: AirQualityReport;
}

export function ScientificGrounding({ report }: ScientificGroundingProps) {
  const { location, pollutants, cpcbComparison } = report;
  const pm25Val = pollutants.pm2_5.concentration;

  const cpcbClassification = classifyCpcbPm25(pm25Val);

  // Dynamic PM2.5 Breakpoints for current value (only populated when concentration is valid)
  let epaBreakpoint = '—';
  let epaClass = 'Data not reported';
  let epaColor = 'text-[var(--ink-muted)]';

  if (pm25Val !== null && pm25Val !== undefined && Number.isFinite(pm25Val) && pm25Val >= 0) {
    if (pm25Val <= 12.0) {
      epaBreakpoint = '0 – 12.0 μg/m³ (AQI 0–50)';
      epaClass = 'Good';
      epaColor = 'text-[var(--aqi-good)]';
    } else if (pm25Val <= 35.4) {
      epaBreakpoint = '12.1 – 35.4 μg/m³ (AQI 51–100)';
      epaClass = 'Moderate';
      epaColor = 'text-[var(--aqi-moderate)]';
    } else if (pm25Val <= 55.4) {
      epaBreakpoint = '35.5 – 55.4 μg/m³ (AQI 101–150)';
      epaClass = 'Unhealthy for Sensitive Groups';
      epaColor = 'text-[var(--aqi-sensitive)]';
    } else if (pm25Val <= 150.4) {
      epaBreakpoint = '55.5 – 150.4 μg/m³ (AQI 151–200)';
      epaClass = 'Unhealthy';
      epaColor = 'text-[var(--aqi-unhealthy)]';
    } else if (pm25Val <= 250.4) {
      epaBreakpoint = '150.5 – 250.4 μg/m³ (AQI 201–300)';
      epaClass = 'Very Unhealthy';
      epaColor = 'text-[var(--aqi-unhealthy)]';
    } else {
      epaBreakpoint = '> 250.4 μg/m³ (AQI 301–500)';
      epaClass = 'Hazardous';
      epaColor = 'text-[var(--aqi-hazardous)]';
    }
  }

  let eaqiBreakpoint = '—';
  let eaqiClass = 'Data not reported';
  let eaqiColor = 'text-[var(--ink-muted)]';

  if (pm25Val !== null && pm25Val !== undefined && Number.isFinite(pm25Val) && pm25Val >= 0) {
    if (pm25Val <= 10) {
      eaqiBreakpoint = '0 – 10 μg/m³';
      eaqiClass = 'Good';
      eaqiColor = 'text-[var(--aqi-good)]';
    } else if (pm25Val <= 20) {
      eaqiBreakpoint = '10 – 20 μg/m³';
      eaqiClass = 'Fair';
      eaqiColor = 'text-[var(--aqi-good)]';
    } else if (pm25Val <= 25) {
      eaqiBreakpoint = '20 – 25 μg/m³';
      eaqiClass = 'Moderate';
      eaqiColor = 'text-[var(--aqi-moderate)]';
    } else if (pm25Val <= 50) {
      eaqiBreakpoint = '25 – 50 μg/m³';
      eaqiClass = 'Poor';
      eaqiColor = 'text-[var(--aqi-unhealthy)]';
    } else if (pm25Val <= 75) {
      eaqiBreakpoint = '50 – 75 μg/m³';
      eaqiClass = 'Very Poor';
      eaqiColor = 'text-[var(--aqi-unhealthy)]';
    } else {
      eaqiBreakpoint = '> 75 μg/m³';
      eaqiClass = 'Extremely Poor';
      eaqiColor = 'text-[var(--aqi-hazardous)]';
    }
  }

  return (
    <section
      aria-labelledby="scientific-grounding-heading"
      className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)]/70 p-4 sm:p-6 text-xs text-[var(--ink-secondary)] shadow-xs transition-all"
    >
      <details className="group">
        <summary className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer list-none select-none">
          <div>
            <h2
              id="scientific-grounding-heading"
              className="text-xs sm:text-sm font-bold text-[var(--ink-primary)] font-sans flex flex-wrap items-center gap-2"
            >
              <span className="flex items-center gap-1.5 text-[var(--brand-primary)]">
                <span>🔬</span>
                <span>Scientific Grounding</span>
              </span>
              <span className="text-[var(--ink-secondary)]">Multi-Standard Sensor Calibration</span>
              <span aria-hidden="true" className="text-xs text-[var(--ink-muted)] group-open:rotate-180 transition-transform duration-200 ml-1">
                ▼
              </span>
            </h2>
            <p className="text-xs text-[var(--ink-muted)] mt-1 font-sans">
              Transparent mathematical comparison of regulatory averaging intervals, national standards, and CAMS grid physics.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-[var(--brand-primary)] bg-[var(--surface-card)] px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] self-start sm:self-auto shadow-2xs group-open:bg-[var(--brand-surface)] transition-colors">
            Inspect Calibration ▾
          </span>
        </summary>

        <div className="space-y-4 leading-relaxed mt-4 pt-4 border-t border-[var(--border-subtle)]">
          {/* Specific Indian CPCB Context when viewing Indian Locations */}
          {cpcbComparison && (
            <div className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-sm font-bold text-[var(--ink-primary)] flex items-center gap-2 font-sans">
                  <span>🇮🇳</span>
                  <span>India CPCB PM2.5 Regulatory Benchmark</span>
                </span>
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-[var(--surface-subtle)] text-[var(--ink-primary)] border border-[var(--border-subtle)]">
                  CPCB Benchmark: {cpcbComparison.estimatedAqiRange} ({cpcbComparison.equivalentCategory})
                </span>
              </div>
              <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
                {cpcbComparison.methodologyDifference}
              </p>
              <p className="text-xs text-[var(--ink-muted)] mt-2 font-mono bg-[var(--surface-subtle)]/60 p-2 rounded-lg border border-[var(--border-subtle)]/50">
                Ground Station Reality: {cpcbComparison.stationContext}
              </p>
            </div>
          )}

          {/* Attractive Multi-standard Cross-Comparison Table with Larger Font Size */}
          <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-xs">
            <table className="w-full text-left text-xs sm:text-sm border-collapse font-sans">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-xs uppercase tracking-wider font-mono text-[var(--ink-secondary)] font-bold">
                  <th className="p-3.5 sm:p-4">Standard / Agency</th>
                  <th className="p-3.5 sm:p-4">Averaging Period</th>
                  <th className="p-3.5 sm:p-4">PM2.5 Breakpoint for Current Value ({pm25Val ?? '—'} μg/m³)</th>
                  <th className="p-3.5 sm:p-4">Health Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-xs sm:text-sm">
                <tr className="hover:bg-[var(--surface-subtle)]/40 transition-colors">
                  <td className="p-3.5 sm:p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--ink-primary)]">US EPA AQI</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        EPA Reference
                      </span>
                    </div>
                  </td>
                  <td className="p-3.5 sm:p-4 text-[var(--ink-secondary)] font-mono text-xs">
                    Preceding 24-hour rolling average (provider-modelled sub-index; not computed locally)
                  </td>
                  <td className="p-3.5 sm:p-4 font-mono font-medium text-[var(--ink-primary)]">
                    {epaBreakpoint}
                  </td>
                  <td className="p-3.5 sm:p-4">
                    <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold font-mono ${epaColor} bg-[var(--surface-subtle)] border border-[var(--border-subtle)]`}>
                      {epaClass}
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-[var(--surface-subtle)]/40 transition-colors">
                  <td className="p-3.5 sm:p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--ink-primary)]">European EAQI</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        EEA Standard
                      </span>
                    </div>
                  </td>
                  <td className="p-3.5 sm:p-4 text-[var(--ink-secondary)] font-mono text-xs">
                    Hourly concentration (EEA)
                  </td>
                  <td className="p-3.5 sm:p-4 font-mono font-medium text-[var(--ink-primary)]">
                    {eaqiBreakpoint}
                  </td>
                  <td className="p-3.5 sm:p-4">
                    <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold font-mono ${eaqiColor} bg-[var(--surface-subtle)] border border-[var(--border-subtle)]`}>
                      {eaqiClass}
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-[var(--surface-subtle)]/40 transition-colors">
                  <td className="p-3.5 sm:p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--ink-primary)]">India CPCB NAQI</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        CPCB Benchmark
                      </span>
                    </div>
                  </td>
                  <td className="p-3.5 sm:p-4 text-[var(--ink-secondary)] font-mono text-xs">
                    24-hour arithmetic mean at physical CAAQMS stations (single-pollutant PM2.5 reference benchmark only; not an official composite CPCB NAQI calculation; CAAQMS physical stations are not integrated)
                  </td>
                  <td className="p-3.5 sm:p-4 font-mono font-medium text-[var(--ink-primary)]">
                    {cpcbClassification.aqiRange !== 'N/A'
                      ? `${cpcbClassification.concentrationRange} (AQI ${cpcbClassification.aqiRange})`
                      : cpcbClassification.concentrationRange}
                  </td>
                  <td className="p-3.5 sm:p-4">
                    <span
                      className="inline-block px-2.5 py-1 rounded-md text-xs font-bold font-mono border"
                      style={{
                        color: cpcbClassification.colorToken,
                        backgroundColor: 'var(--surface-subtle)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      {cpcbClassification.category}
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-[var(--surface-subtle)]/40 transition-colors">
                  <td className="p-3.5 sm:p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--ink-primary)]">WHO 2021 Guideline</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Health Baseline
                      </span>
                    </div>
                  </td>
                  <td className="p-3.5 sm:p-4 text-[var(--ink-secondary)] font-mono text-xs">
                    WHO 24-hour guideline level: 15 μg/m³ • WHO annual guideline level: 5 μg/m³ (Health-based reference)
                  </td>
                  <td className="p-3.5 sm:p-4 font-mono text-xs text-[var(--ink-primary)]">
                    15 μg/m³ (24-hour reference level) • 5 μg/m³ (annual reference level)
                  </td>
                  <td className="p-3.5 sm:p-4 text-xs text-[var(--ink-secondary)]">
                    Advisory reference level (incompatible averaging period; 1-hour model data cannot be evaluated for direct compliance)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Spatial Resolution & Scientific Model Physics */}
          <div className="text-xs text-[var(--ink-muted)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 font-mono border-t border-[var(--border-subtle)]/60">
            <span>MODEL PHYSICS: <strong className="text-[var(--ink-secondary)]">{report.modelMetadata.domainName}</strong> ({report.modelMetadata.spatialResolution})</span>
            <span>CADENCE: <strong className="text-[var(--ink-secondary)]">{report.modelMetadata.temporalResolution}</strong> • {report.modelMetadata.updateCadence}</span>
          </div>
        </div>
      </details>
    </section>
  );
}
