'use client';

import React, { useState } from 'react';

interface SourceItem {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly pollutantType: 'particulate' | 'gaseous' | 'mixed';
  readonly typeLabel: string;
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
    whyItMatters:
      'High-heat oil frying generates dense ultrafine particulate aerosols, while natural gas and LPG burners release nitrogen dioxide (NO2) and carbon monoxide directly into living spaces.',
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
    whyItMatters:
      'Aerosolized bleach, pine/citrus terpenoid fragrances, and air fresheners emit volatile organic compounds (VOCs) that react with indoor ozone to generate secondary organic aerosols and formaldehyde.',
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
    whyItMatters:
      'During thermal inversions, fine outdoor combustion soot penetrates building cracks, unsealed window frames, and exterior door perimeters even when windows remain shut.',
    keyActions: [
      'Apply self-adhesive foam or rubber weatherstripping along window frames and balcony sliders.',
      'Install brush door sweeps or use fabric draft stoppers under exterior doors.',
      'Run indoor HEPA purifiers continuously to filter incoming air leakage.',
    ],
    technicalDetail:
      'Infiltration factor (Finf) in typical urban homes ranges from 0.3 to 0.7 without active sealing, meaning 30% to 70% of outdoor ambient smog naturally enters indoor living spaces.',
  },
  {
    id: 'combustion',
    name: 'Mosquito Coils, Incense & Candles',
    icon: '🕯️',
    pollutantType: 'mixed',
    typeLabel: 'Mixed: High Particulate + Benzene',
    whyItMatters:
      'Burning a single mosquito coil produces particulate emissions equivalent to 75–130 cigarettes, alongside hazardous volatile organic byproducts like formaldehyde and benzene.',
    keyActions: [
      'Replace burning mosquito coils with electric evaporators or window insect screens.',
      'Avoid regular indoor incense burning, particularly in enclosed or poorly ventilated rooms.',
      'Use LED or wick-trimmed pure beeswax candles rather than synthetic paraffin candles.',
    ],
    technicalDetail:
      'Pyrolysis of biomass binding agents in coils and incense produces polycyclic aromatic hydrocarbons (PAHs) that linger in indoor air and deposit on walls and upholstery.',
  },
];

interface PollutionSourceMatrixProps {
  readonly onAskCopilot?: (question: string) => void;
}

export function PollutionSourceMatrix({ onAskCopilot }: PollutionSourceMatrixProps) {
  const [selectedSourceId, setSelectedSourceId] = useState<string>(SOURCES[0].id);
  const activeSource = SOURCES.find((s) => s.id === selectedSourceId) || SOURCES[0];

  return (
    <section
      aria-labelledby="source-matrix-heading"
      className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 sm:p-6 shadow-xs space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <h2
            id="source-matrix-heading"
            className="text-base sm:text-lg font-bold text-[var(--ink-primary)] font-sans flex items-center gap-2"
          >
            <span>🔬 Indoor Pollution Source Intelligence</span>
          </h2>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">
            Understand common indoor emission sources, particle vs. gas distinctions, and evidence-backed mitigations.
          </p>
        </div>

        {onAskCopilot && (
          <button
            type="button"
            onClick={() =>
              onAskCopilot(`How can I reduce indoor pollution from ${activeSource.name}?`)
            }
            className="px-3 py-1.5 rounded-lg bg-[var(--surface-subtle)] text-[var(--ink-secondary)] hover:text-[var(--brand-primary)] hover:bg-[var(--surface-card)] text-xs font-mono font-medium border border-[var(--border-subtle)] transition-all cursor-pointer self-start sm:self-auto shrink-0 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
          >
            <span>🤖</span>
            <span>Ask Copilot about {activeSource.name.split(' ')[0]}</span>
          </button>
        )}
      </div>

      {/* Source Selector Chips */}
      <div className="flex flex-wrap gap-2">
        {SOURCES.map((source) => {
          const isSelected = source.id === selectedSourceId;

          return (
            <button
              key={source.id}
              type="button"
              onClick={() => setSelectedSourceId(source.id)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer border flex items-center gap-2 ${
                isSelected
                  ? 'bg-[var(--brand-surface)] text-[var(--brand-primary)] border-[var(--brand-primary)] shadow-xs font-semibold'
                  : 'bg-white hover:bg-[var(--surface-subtle)] text-[var(--ink-secondary)] border-[var(--border-subtle)]'
              }`}
              aria-pressed={isSelected}
            >
              <span className="text-base" aria-hidden="true">{source.icon}</span>
              <span>{source.name}</span>
            </button>
          );
        })}
      </div>

      {/* Active Source Card Detail */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)]/40 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl" aria-hidden="true">{activeSource.icon}</span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[var(--ink-primary)] font-sans">
                {activeSource.name}
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-[var(--border-subtle)] text-[var(--brand-primary)] font-semibold inline-block mt-0.5">
                {activeSource.typeLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Why it Matters */}
        <div>
          <h4 className="text-xs font-mono font-bold text-[var(--ink-muted)] uppercase tracking-wider mb-1">
            Why It Matters
          </h4>
          <p className="text-xs sm:text-sm text-[var(--ink-primary)] leading-relaxed font-sans">
            {activeSource.whyItMatters}
          </p>
        </div>

        {/* Key Actions Checklist */}
        <div>
          <h4 className="text-xs font-mono font-bold text-[var(--ink-muted)] uppercase tracking-wider mb-2">
            Actionable Mitigations
          </h4>
          <div className="space-y-2">
            {activeSource.keyActions.map((action, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-2.5 rounded-lg border border-[var(--border-subtle)] bg-white text-xs text-[var(--ink-secondary)]"
              >
                <span className="text-[var(--brand-primary)] font-bold text-sm leading-none mt-0.5">✓</span>
                <span className="leading-relaxed font-sans">{action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scientific In-Depth Footnote */}
        <div className="p-3 rounded-lg bg-white border border-[var(--border-subtle)] text-[11px] text-[var(--ink-muted)] space-y-0.5">
          <span className="font-bold font-mono text-[var(--ink-secondary)] uppercase text-[10px] block">
            Scientific Context:
          </span>
          <p className="leading-relaxed">
            {activeSource.technicalDetail}
          </p>
        </div>
      </div>
    </section>
  );
}
