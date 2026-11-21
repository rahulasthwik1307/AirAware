'use client';

import React, { useEffect } from 'react';
import { TRANSIT_MODES } from '@/domain/choices/constants';

interface ScientificInspectorModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function ScientificInspectorModal({
  isOpen,
  onClose,
}: ScientificInspectorModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modes = Object.values(TRANSIT_MODES);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inspector-modal-title"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-5">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🔬</span>
              <h3
                id="inspector-modal-title"
                className="text-lg font-bold text-slate-900 font-sans"
              >
                Scientific Calculation &amp; Emission Factor Inspector
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Auditable operational tailpipe emission factors, citations, and mathematical formulas.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close inspector modal"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Mathematical Formulas Section */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700">
            Authoritative Formulations (Master Spec Section 11)
          </h4>
          <div className="space-y-2 text-xs text-slate-800">
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 font-mono text-[11px]">
              <span className="font-bold text-emerald-800">E_avoided (kg CO₂e)</span> = Distance (km) × [EF_baseline - EF_alternative] × Trips
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 font-mono text-[11px]">
              <span className="font-bold text-sky-800">ΔC Exposure Shift (µg/m³)</span> = C_peak(t) - C_shifted(t&apos;) [Derived from CAMS forecast wave]
            </div>
          </div>
        </div>

        {/* Emission Factors Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700">
            Direct Operational Tailpipe Factors (DEFRA 2023 &amp; CEA India)
          </h4>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-mono border-b border-slate-200">
                  <th className="p-2.5">Mode</th>
                  <th className="p-2.5">CO₂e (kg/km)</th>
                  <th className="p-2.5">NOx (g/km)</th>
                  <th className="p-2.5">PM₂.₅ (g/km)</th>
                  <th className="p-2.5">Occupancy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {modes.map((m) => (
                  <tr key={m.mode} className="hover:bg-slate-50">
                    <td className="p-2.5 font-medium text-slate-900 flex items-center gap-1.5">
                      <span>{m.icon}</span> {m.shortLabel}
                    </td>
                    <td className="p-2.5 font-mono">{m.factorKgCo2ePerKm.toFixed(3)}</td>
                    <td className="p-2.5 font-mono">{m.factorGramsNoxPerKm.toFixed(3)}</td>
                    <td className="p-2.5 font-mono">{m.factorGramsPm25PerKm.toFixed(3)}</td>
                    <td className="p-2.5 font-mono">{m.typicalOccupancy} pax</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Scientific Disclaimers & Integrity Note */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-1.5">
          <p className="font-bold flex items-center gap-1.5">
            <span>⚖️</span> Dual-Impact Anti-Conflation Principle:
          </p>
          <p className="leading-relaxed text-[11px] text-amber-900">
            Avoided transport emissions reduce collective greenhouse gases and secondary smog precursors, but do not directly clean the measured ambient air quality of your neighborhood. Personal exposure protection (ΔC) measures hours shifted out of inversion smog, not clinical inhaled dose.
          </p>
        </div>

        {/* Modal Close Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
