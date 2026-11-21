'use client';

import React, { useState } from 'react';

interface WorkspaceDetail {
  readonly id: string;
  readonly number: string;
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly badges: readonly string[];
  readonly metrics: readonly { readonly label: string; readonly value: string }[];
}

const WORKSPACES: readonly WorkspaceDetail[] = [
  {
    id: 'air-intelligence',
    number: '01',
    title: 'Air Intelligence Studio',
    subtitle: 'Global 3D Airshed Models & Dual CPCB Benchmarks',
    description:
      'Continuous surface telemetry derived from European Copernicus CAMS Global IFS (~45km grid) synchronized with India Central Pollution Control Board (CPCB) NAQI standards. Evaluates thermal boundary height, secondary aerosol precursors, and criteria pollutants (PM₂.₅, PM₁₀, O₃, NO₂).',
    badges: ['Copernicus CAMS IFS', 'CPCB NAQI Dual Standard', 'MapLibre 3D Earth'],
    metrics: [
      { label: 'Forecast Horizon', value: '7 Days' },
      { label: 'Spatial Resolution', value: '0.4° (~45 km)' },
      { label: 'Averaging Period', value: 'Instant CAMS & 24h CPCB' },
    ],
  },
  {
    id: 'family-planner',
    number: '02',
    title: 'Family Daily Planner',
    subtitle: 'Vulnerable Exposure Defense & Smog Timing Shifts',
    description:
      'Northern India winter smog peaks between 7:00 AM and 10:00 AM due to ground thermal inversion. The planner models individual family archetypes (pediatric, senior, asthmatic) and shifts outdoor routines to safe afternoon hours with transparent ΔC exposure accounting.',
    badges: ['Pediatric Defense', 'Senior Inversion Shield', 'Automated ΔC Accounting'],
    metrics: [
      { label: 'Avg Exposure Reduction', value: '45–60%' },
      { label: 'Inversion Shift Window', value: '12:30 – 15:30' },
      { label: 'Storage Privacy', value: '100% Local-First' },
    ],
  },
  {
    id: 'indoor-air',
    number: '03',
    title: 'Indoor Air Intelligence',
    subtitle: 'Room Volume CADR Sizing & Diurnal Ventilation Window',
    description:
      'Indoor air is not safe by default. Calculates precise Clean Air Delivery Rate (CADR) and Air Changes per Hour (ACH) for your living room, kitchen, and bedrooms, paired with a deterministic diurnal meteorological model identifying safe cross-ventilation hours.',
    badges: ['CADR / ACH Math', 'Solar Mixing Ceiling', 'HEPA Maintenance Log'],
    metrics: [
      { label: 'Target ACH', value: '4.8 – 5.0x / hr' },
      { label: 'Ventilation Window', value: '12:30 PM – 3:30 PM' },
      { label: 'Inversion Ceiling', value: '<150m Morning / >450m Noon' },
    ],
  },
  {
    id: 'cleaner-choices',
    number: '04',
    title: 'Cleaner Choices & Impact',
    subtitle: 'Direct Tailpipe Emissions vs. Delhi Metro Transit',
    description:
      'Quantifies the immediate environmental and health benefits of modal shifts from solo private cars to shared carpooling and electric metro transit. Uses verified DEFRA and CPCB tailpipe emission factors with weekly habit streak tracking.',
    badges: ['DEFRA & CPCB Factors', 'Dual-Impact Ledger', 'Weekly Habit Streaks'],
    metrics: [
      { label: 'Avg Commute Saving', value: '2.3 kg CO₂ / 10 km' },
      { label: 'Avoided Precursors', value: '4.5g NOx / trip' },
      { label: 'Occupancy Baseline', value: '1.2 Car / 800+ Metro' },
    ],
  },
  {
    id: 'community-alerts',
    number: '05',
    title: 'Community & Alerts',
    subtitle: 'RWA Notice Board & Section 19 Citizen Grievance Journal',
    description:
      'Equips apartment Resident Welfare Associations (RWAs) with 1-tap WhatsApp notices to instruct security guards and gardeners against dry waste burning. Empowers residents to document visible emissions under Section 19 of the Air Act 1981.',
    badges: ['RWA Bulletin Dispatcher', 'Air Act 1981 §19(5)', '100% Offline Journal'],
    metrics: [
      { label: 'Active CAQM Stage', value: 'GRAP Stage II' },
      { label: 'Dispatch Channels', value: 'WhatsApp & CPCB Sameer' },
      { label: 'Evidence Format', value: 'Geo-Stamped Dossier' },
    ],
  },
];

export function WorkspaceShowcaseStudio() {
  const [activeTab, setActiveTab] = useState<string>('air-intelligence');
  const [simulatedAqi, setSimulatedAqi] = useState<number>(378);

  const activeWs = WORKSPACES.find((w) => w.id === activeTab) ?? WORKSPACES[0];

  return (
    <section
      aria-labelledby="workspace-studio-heading"
      className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 lg:p-10 shadow-sm"
    >
      <div className="flex flex-col gap-2 pb-6 border-b border-slate-100">
        <h2
          id="workspace-studio-heading"
          className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-sans"
        >
          Built for every scale of atmospheric exposure
        </h2>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
          AirAware is engineered as five interoperable workspaces. Explore each domain below to see how authoritative data becomes personal, household, and civic action.
        </p>
      </div>

      {/* Segmented Workspace Tabs */}
      <div
        className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-none border-b border-slate-100 select-none"
        role="tablist"
      >
        {WORKSPACES.map((ws) => {
          const isActive = activeTab === ws.id;
          return (
            <button
              key={ws.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(ws.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer border ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <span className="text-[10px] text-slate-400 font-normal">{ws.number}</span>
              <span>{ws.title.replace(' Studio', '')}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Split Presentation for Active Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-8">
        {/* Left Column: Conceptual & Practical Deep-Dive (6 cols) */}
        <div className="lg:col-span-6 space-y-3.5">
          <span className="text-xs font-sans font-bold text-teal-800 uppercase tracking-wider block">
            {activeWs.subtitle}
          </span>

          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-sans">
            {activeWs.title}
          </h3>

          <p className="text-sm text-slate-600 leading-relaxed font-sans">
            {activeWs.description}
          </p>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 pt-1">
            {activeWs.badges.map((b) => (
              <span
                key={b}
                className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-slate-100 text-slate-800 border border-slate-200"
              >
                {b}
              </span>
            ))}
          </div>

          {/* Key Architectural Metrics */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
            {activeWs.metrics.map((m) => (
              <div key={m.label} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="block text-xs sm:text-sm font-black font-mono text-slate-900 truncate">
                  {m.value}
                </span>
                <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-0.5 truncate">
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Interactive Live Archetype Preview (6 cols) */}
        <div className="lg:col-span-6">
          {activeWs.id === 'air-intelligence' && (
            <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-teal-50/40 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-xs font-mono font-bold uppercase text-slate-500">
                  Dual Standard Converter
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                  Active Simulation
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-black font-mono text-rose-700">
                    {simulatedAqi} AQI
                  </span>
                  <span className="text-xs font-mono text-slate-600 font-semibold">
                    US EPA (0–500 Scale)
                  </span>
                </div>
                <label htmlFor="simulated-aqi-slider" className="block w-full">
                  <span className="sr-only">Simulate US EPA Air Quality Index value</span>
                  <input
                    id="simulated-aqi-slider"
                    name="simulatedAqi"
                    type="range"
                    min="30"
                    max="500"
                    value={simulatedAqi}
                    aria-label="Simulate US EPA Air Quality Index value"
                    onChange={(e) => setSimulatedAqi(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-700"
                  />
                </label>
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>50 (Good)</span>
                  <span>150 (Unhealthy)</span>
                  <span>300 (Very Poor)</span>
                  <span>450+ (Severe)</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1 text-xs">
                <div className="flex items-center justify-between font-mono font-bold">
                  <span className="text-slate-700">India CPCB Equivalent:</span>
                  <span className="text-rose-900 font-black">
                    {simulatedAqi > 400
                      ? 'Severe Smog'
                      : simulatedAqi > 300
                      ? 'Very Poor Air'
                      : simulatedAqi > 200
                      ? 'Poor Air'
                      : simulatedAqi > 100
                      ? 'Moderate'
                      : 'Satisfactory'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {simulatedAqi > 300
                    ? 'CAQM GRAP Stage II/III enforced. Mechanical street sweeping active; diesel genset ban.'
                    : 'Standard ambient air quality. Normal outdoor activities permissible with routine monitoring.'}
                </p>
              </div>
            </div>
          )}

          {activeWs.id === 'family-planner' && (
            <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50/40 via-white to-slate-50 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-mono font-bold uppercase text-slate-600">
                  Automated Routine Shift Protocol
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                  Pediatric Shield
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">Outdoor School Sports (Aarav, 8)</span>
                  <span className="font-mono text-[10px] text-rose-700 line-through">08:00 AM</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-800 font-bold">Shifted to Safe Afternoon Window:</span>
                  <span className="text-emerald-700 font-black">01:15 PM</span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-950 flex items-center justify-between font-mono">
                  <span>Exposure Delta (ΔC):</span>
                  <span className="font-extrabold">-142 μg/m³ PM₂.₅ Avoided</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-snug">
                Protects developing bronchial tissue by moving heavy cardiovascular exertion from peak inversion hours to solar breakup hours.
              </p>
            </div>
          )}

          {activeWs.id === 'indoor-air' && (
            <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-teal-50/50 via-white to-slate-50 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-mono font-bold uppercase text-slate-600">
                  CADR &amp; ACH Sizing Engine
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-900 border border-teal-200">
                  Living Room (22 m²)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="block text-xl font-black font-mono text-teal-950">285 m³/h</span>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Target CADR</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="block text-xl font-black font-mono text-emerald-700">5.0x / hr</span>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Air Changes (ACH)</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-teal-50/90 border border-teal-200 text-xs text-teal-950 space-y-1">
                <div className="font-bold flex items-center justify-between font-mono">
                  <span>Diurnal Ventilation Window:</span>
                  <span className="text-emerald-800">12:30 PM – 03:30 PM</span>
                </div>
                <p className="text-[11px] text-teal-900/80 leading-snug">
                  Thermal boundary layer elevated to 450m. Safe for 15-minute cross-ventilation to flush trapped indoor CO₂.
                </p>
              </div>
            </div>
          )}

          {activeWs.id === 'cleaner-choices' && (
            <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-mono font-bold uppercase text-slate-600">
                  Tailpipe Precursor Audit (12 km Route)
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 border border-indigo-200">
                  DEFRA &amp; CPCB Factors
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">Solo Petrol/Diesel Car</span>
                    <span className="text-[10px] font-mono text-slate-400">0.210 kg CO₂e / km • 0.38g NOx</span>
                  </div>
                  <span className="font-mono font-black text-rose-700">2.52 kg CO₂</span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-950 block">Delhi Electric Metro</span>
                    <span className="text-[10px] font-mono text-emerald-700">0.021 kg CO₂e / km • Zero Tailpipe</span>
                  </div>
                  <span className="font-mono font-black text-emerald-800">0.25 kg CO₂</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs font-mono font-bold">
                <span>Net Route Avoided:</span>
                <span className="text-emerald-400">-2.27 kg CO₂e &amp; -4.5g NOx</span>
              </div>
            </div>
          )}

          {activeWs.id === 'community-alerts' && (
            <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50/40 via-white to-slate-50 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-mono font-bold uppercase text-slate-600">
                  RWA Action Bulletin Dispatcher
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-900 border border-rose-200">
                  GRAP Stage II Active
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 text-xs font-sans">
                <span className="font-mono font-bold text-[10px] uppercase tracking-wider text-slate-400 block">
                  Pre-Composed Society WhatsApp Notice:
                </span>
                <p className="text-slate-800 font-semibold leading-snug">
                  AIRAWARE RESIDENTIAL ADVISORY — GREEN MEADOWS RWA
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed font-mono">
                  1. Zero open burning: Prohibit dry leaves or garbage burning by guards.<br />
                  2. Gate heaters: Provide electric radiant heaters to all night watchmen.<br />
                  3. Safe window timing: 12:30 PM – 3:30 PM only.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                <span>Citizen reporting under Air Act §19</span>
                <span className="font-mono font-bold text-slate-900">One-Tap WhatsApp Share</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
