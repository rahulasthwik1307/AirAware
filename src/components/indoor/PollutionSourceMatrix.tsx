'use client';

import React, { useState } from 'react';

interface SourceItem {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly pollutantType: 'particulate' | 'gaseous' | 'mixed';
  readonly typeLabel: string;
  readonly emissionScore: number; // 1 to 5 scale
  readonly emissionLabel: string;
  readonly whyItMatters: string;
  readonly keyActions: readonly string[];
  readonly technicalDetail: string;
}

const SOURCES: readonly SourceItem[] = [
  {
    id: 'cooking',
    name: 'Cooking & High-Heat Frying',
    icon: '🍳',
    pollutantType: 'mixed',
    typeLabel: 'Mixed: Ultrafine PM + NO₂ Gas',
    emissionScore: 4,
    emissionLabel: 'High PM & Combustion Gases',
    whyItMatters:
      'High-heat oil frying generates dense ultrafine particulate aerosols, while natural gas and LPG burners release nitrogen dioxide (NO2) and carbon monoxide directly into breathing zones.',
    keyActions: [
      'Turn on range hood 2 minutes before lighting flame; keep running for 10–15 min after.',
      'Cook on rear burners under the hood canopy to increase fume capture efficiency up to 70%.',
      'Keep interior kitchen doors closed to prevent oil aerosols from migrating into bedrooms.',
    ],
    technicalDetail:
      'Gas stove combustion releases unburned hydrocarbons and NO2. Standard mechanical ventilation with exterior exhaust is the primary protection; recirculating range hoods only trap grease unless equipped with heavy carbon canisters.',
  },
  {
    id: 'dusting',
    name: 'Dust & Cleaning Resuspension',
    icon: '🧹',
    pollutantType: 'particulate',
    typeLabel: 'Particulate: Coarse PM₁₀ & Fine PM₂.₅',
    emissionScore: 3,
    emissionLabel: 'High Mechanical Resuspension',
    whyItMatters:
      'Dry sweeping, vigorous bed-making, and unsealed vacuum exhausts kick settled dust and allergen reservoirs back into the breathing zone, keeping them airborne for 2 to 4 hours.',
    keyActions: [
      'Use damp microfiber mops and cloths instead of dry feather dusters or dry brooms.',
      'Ensure vacuum cleaner has an airtight sealed HEPA exhaust to prevent blowing fine dust into rooms.',
      'Allow airborne dust to settle before vacuuming, or run room air purifiers on high during cleaning.',
    ],
    technicalDetail:
      'Resuspension physics shows that particles larger than 5 µm resuspend easily with walking and sweeping. Damp capture traps particles by surface adhesion rather than dispersing them.',
  },
  {
    id: 'cleaners',
    name: 'Cleaning Products & Scented Sprays',
    icon: '🧴',
    pollutantType: 'gaseous',
    typeLabel: 'Gaseous: Chemical VOCs & SOA',
    emissionScore: 3,
    emissionLabel: 'Volatile Chemical Off-Gassing',
    whyItMatters:
      'Aerosolized bleach, pine/citrus fragrances, and air fresheners emit volatile organic compounds (VOCs) that react with indoor ozone to generate secondary organic aerosols and formaldehyde.',
    keyActions: [
      'Choose unscented or low-VOC cleaning agents without synthetic terpene fragrances.',
      'Never mix bleach with ammonia or acidic cleaning products (releases toxic chloramine gas).',
      'Open windows or run ventilation when cleaning bathroom and tiled surfaces.',
    ],
    technicalDetail:
      'Limonene and pinene emit pleasant scents but react photochemically with ambient ozone, forming ultrafine liquid aerosol droplets that penetrate deep into pulmonary alveoli.',
  },
  {
    id: 'infiltration',
    name: 'Outdoor Smog Infiltration',
    icon: '🪟',
    pollutantType: 'particulate',
    typeLabel: 'Particulate: Ambient PM₂.₅ & Black Carbon',
    emissionScore: 4,
    emissionLabel: 'Continuous Leakage (30–70%)',
    whyItMatters:
      'During thermal inversions, fine outdoor combustion soot penetrates building cracks, unsealed window frames, and exterior door perimeters even when windows remain shut.',
    keyActions: [
      'Apply self-adhesive foam or rubber weatherstripping along window frames and balcony sliders.',
      'Install brush door sweeps or use fabric draft stoppers under exterior doors.',
      'Run indoor HEPA purifiers continuously to filter incoming air leakage.',
    ],
    technicalDetail:
      'Infiltration factor in typical urban homes ranges from 0.3 to 0.7 without active sealing, meaning 30% to 70% of outdoor ambient smog naturally enters indoor living spaces.',
  },
  {
    id: 'combustion',
    name: 'Mosquito Coils, Incense & Candles',
    icon: '🕯️',
    pollutantType: 'mixed',
    typeLabel: 'Mixed: High Particulate + Benzene',
    emissionScore: 5,
    emissionLabel: 'Extreme Toxic Particulate Mass',
    whyItMatters:
      'Burning a single mosquito coil produces particulate emissions equivalent to 75–130 cigarettes, alongside hazardous volatile organic byproducts like formaldehyde and benzene.',
    keyActions: [
      'Replace burning mosquito coils with electric evaporators or window insect screens.',
      'Avoid continuous smoldering incense in unventilated living or sleeping spaces.',
      'Use natural beeswax candles with lead-free wicks rather than paraffin novelty candles.',
    ],
    technicalDetail:
      'Smoldering combustion produces submicron tar aerosols with high polycyclic aromatic hydrocarbon (PAH) content that linger in stagnant indoor air for many hours.',
  },
];

interface PollutionSourceMatrixProps {
  readonly onAskCopilot?: (question: string) => void;
}

export function PollutionSourceMatrix({ onAskCopilot }: PollutionSourceMatrixProps) {
  const [activeSourceId, setActiveSourceId] = useState<string>('cooking');
  const activeSource = SOURCES.find((s) => s.id === activeSourceId) || SOURCES[0];

  return (
    <section
      aria-labelledby="pollution-source-heading"
      className="w-full rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-5 overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="min-w-0 flex-1 pr-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl shrink-0" aria-hidden="true">🔬</span>
            <h2
              id="pollution-source-heading"
              className="text-base sm:text-lg font-bold text-slate-900 font-sans tracking-tight"
            >
              Indoor Pollution Source Intelligence &amp; Particle-to-Gas Spectrum
            </h2>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
              Source Attribution &amp; Physics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Identify aerosol diameters, combustion emission volumes, and targeted physical mitigations.
          </p>
        </div>

        {onAskCopilot && (
          <button
            type="button"
            onClick={() =>
              onAskCopilot(
                `What are the most effective ways to mitigate indoor air pollution from ${activeSource.name.toLowerCase()}?`
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50 hover:from-sky-100 hover:to-blue-100 text-sky-800 text-xs font-mono font-bold border border-sky-200/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer self-start sm:self-center shrink-0"
          >
            <span className="text-sm">🤖</span>
            <span>Ask Copilot about {activeSource.name.split(' ')[0]}</span>
          </button>
        )}
      </div>

      {/* Aerodynamic Particle-to-Gas Spectrum Visualization */}
      <div className="rounded-xl border border-slate-200/90 bg-gradient-to-r from-slate-50 via-sky-50/40 to-slate-50 p-4 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-600">
          <span className="font-bold uppercase tracking-wider text-slate-700">
            Aerodynamic Size Spectrum (Logarithmic Microns)
          </span>
          <span>HEPA traps particles ≥ 0.3µm • Carbon traps gases &lt; 0.01µm</span>
        </div>

        {/* Visual Spectrum Bar */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-mono font-bold text-amber-700 block">10 µm (PM₁₀)</span>
            <strong className="text-slate-900 block text-xs mt-0.5">Coarse Dust &amp; Pollen</strong>
            <span className="text-[9px] text-slate-500 block leading-tight mt-1">
              Resuspended by sweeping; trapped by pre-filter
            </span>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-mono font-bold text-sky-700 block">2.5 µm (PM₂.₅)</span>
            <strong className="text-slate-900 block text-xs mt-0.5">Soot &amp; Infiltration</strong>
            <span className="text-[9px] text-slate-500 block leading-tight mt-1">
              Enters via cracks; 99.97% trapped by HEPA
            </span>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-mono font-bold text-rose-700 block">0.1 µm (Ultrafine)</span>
            <strong className="text-slate-900 block text-xs mt-0.5">Cooking Aerosols</strong>
            <span className="text-[9px] text-slate-500 block leading-tight mt-1">
              Deep alveolar penetration; captured by range hood
            </span>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-mono font-bold text-purple-700 block">&lt;0.001 µm (Gas)</span>
            <strong className="text-slate-900 block text-xs mt-0.5">NO₂ &amp; Chemical VOCs</strong>
            <span className="text-[9px] text-slate-500 block leading-tight mt-1">
              Bypasses HEPA; requires activated carbon
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Source Selector & Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: 5 Clickable Source Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-2">
          <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Household Emission Categories
          </span>
          {SOURCES.map((source) => {
            const isSelected = source.id === activeSourceId;
            return (
              <button
                key={source.id}
                type="button"
                onClick={() => setActiveSourceId(source.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-sky-50/80 border-sky-500 shadow-xs ring-1 ring-sky-500'
                    : 'bg-white hover:bg-slate-50 border-slate-200/90'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl" aria-hidden="true">{source.icon}</span>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                      {source.name}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-500">
                      {source.emissionLabel}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-2 w-1.5 rounded-xs ${
                        i < source.emissionScore ? 'bg-rose-500' : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Deep Dive Action Panel (7 cols) */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden="true">{activeSource.icon}</span>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 font-sans">
                    {activeSource.name}
                  </h3>
                  <span className="text-xs font-mono font-semibold text-rose-700">
                    {activeSource.typeLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Physical Mechanism
                </span>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">
                  {activeSource.whyItMatters}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Practical Mitigation Checklist
                </span>
                <div className="space-y-1.5">
                  {activeSource.keyActions.map((act, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg bg-white p-2.5 border border-slate-200 text-xs flex items-start gap-2 text-slate-800 shadow-2xs"
                    >
                      <span className="text-emerald-700 font-bold shrink-0 mt-0.5" aria-hidden="true">✓</span>
                      <span className="leading-snug">{act}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-2.5 border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <strong className="text-slate-800 font-mono text-[10px] uppercase block">
              Scientific Background:
            </strong>
            <p className="leading-normal">{activeSource.technicalDetail}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
