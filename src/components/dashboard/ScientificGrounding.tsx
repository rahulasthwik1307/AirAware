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
      className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-4 sm:p-5 text-xs text-[var(--ink-secondary)]"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3 mb-3">
        <div>
          <h2
            id="scientific-grounding-heading"
            className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--ink-primary)]"
          >
            Scientific Grounding // Multi-Standard &amp; Sensor Calibration
          </h2>
          <p className="text-[11px] text-[var(--ink-muted)]">
            Transparent comparison of regulatory averaging intervals, national standards, and CAMS grid physics.
          </p>
        </div>
        <span className="text-[10px] font-mono font-bold text-[var(--brand-primary)] bg-[var(--surface-card)] px-2 py-0.5 rounded border border-[var(--border-subtle)] self-start sm:self-auto">
          OPEN SCIENCE AUDIT
        </span>
      </div>

      <div className="space-y-3 leading-relaxed">
        {/* Specific Indian CPCB Context when viewing Indian Locations */}
        {cpcbComparison && (
          <div className="p-3 rounded-md bg-[var(--surface-card)] border border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm font-bold text-[var(--ink-primary)]">
                🇮🇳 India CPCB PM2.5 Regulatory Benchmark
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--ink-primary)]">
                CPCB PM2.5 BENCHMARK: {cpcbComparison.estimatedAqiRange} ({cpcbComparison.equivalentCategory})
              </span>
            </div>
            <p className="text-[11px] text-[var(--ink-secondary)]">
              {cpcbComparison.methodologyDifference}
            </p>
            <p className="text-[11px] text-[var(--ink-muted)] mt-1.5 font-mono">
              Ground Station Reality: {cpcbComparison.stationContext}
            </p>
          </div>
        )}

        {/* Multi-standard Cross-Comparison Table */}
        <div className="overflow-x-auto rounded-md border border-[var(--border-subtle)] bg-[var(--surface-card)]">
          <table className="w-full text-left text-[11px] border-collapse font-mono">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-[10px] uppercase text-[var(--ink-muted)]">
                <th className="p-2.5">Standard / Agency</th>
                <th className="p-2.5">Averaging Period</th>
                <th className="p-2.5">PM2.5 Breakpoint for Current Value ({pm25Val ?? '—'} μg/m³)</th>
                <th className="p-2.5">Health Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              <tr>
                <td className="p-2.5 font-bold text-[var(--ink-primary)]">US EPA AQI</td>
                <td className="p-2.5">Preceding 24-hour rolling average (provider-modelled sub-index; not computed locally)</td>
                <td className="p-2.5">{epaBreakpoint}</td>
                <td className={`p-2.5 font-bold ${epaColor}`}>{epaClass}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-[var(--ink-primary)]">European EAQI</td>
                <td className="p-2.5">Hourly concentration (EEA)</td>
                <td className="p-2.5">{eaqiBreakpoint}</td>
                <td className={`p-2.5 font-bold ${eaqiColor}`}>{eaqiClass}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-[var(--ink-primary)]">India CPCB NAQI</td>
                <td className="p-2.5">
                  24-hour arithmetic mean at physical CAAQMS stations (single-pollutant PM2.5 reference benchmark only; not an official composite CPCB NAQI calculation; CAAQMS physical stations are not integrated)
                </td>
                <td className="p-2.5">
                  {cpcbClassification.aqiRange !== 'N/A'
                    ? `${cpcbClassification.concentrationRange} (AQI ${cpcbClassification.aqiRange})`
                    : cpcbClassification.concentrationRange}
                </td>
                <td className="p-2.5 font-bold" style={{ color: cpcbClassification.colorToken }}>
                  {cpcbClassification.category}
                </td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-[var(--ink-primary)]">WHO 2021 Guideline</td>
                <td className="p-2.5">WHO 24-hour guideline level: 15 μg/m³ • WHO annual guideline level: 5 μg/m³ (Health-based reference)</td>
                <td className="p-2.5">15 μg/m³ (24-hour reference level) • 5 μg/m³ (annual reference level)</td>
                <td className="p-2.5 text-[var(--ink-secondary)]">Advisory reference level (incompatible averaging period; 1-hour model data cannot be evaluated for direct compliance)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Spatial Resolution & Scientific Model Physics */}
        <div className="text-[11px] text-[var(--ink-muted)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 font-mono">
          <span>MODEL PHYSICS: {report.modelMetadata.domainName} ({report.modelMetadata.spatialResolution})</span>
          <span>CADENCE: {report.modelMetadata.temporalResolution} • {report.modelMetadata.updateCadence}</span>
        </div>
      </div>
    </section>
  );
}
