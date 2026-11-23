'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { GeoLocation } from '@/domain/types';
import { ComponentErrorBoundary } from '@/components/common/ComponentErrorBoundary';

// Dynamically import MapLibre 3D Globe with SSR disabled to protect WebGL contexts
const MapLibreGlobe = dynamic(
  () => import('@/components/globe/MapLibreGlobe').then((mod) => mod.MapLibreGlobe),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[540px] sm:h-[620px] lg:h-[680px] rounded-3xl flex flex-col items-center justify-center bg-[#0F172A] text-slate-200 gap-3 border border-slate-800/90 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.5)] select-none">
        <div className="h-9 w-9 animate-spin rounded-full border-3 border-teal-500 border-t-transparent" />
        <span className="text-xs font-mono text-slate-400 font-medium">
          Loading 3D Atmospheric Globe...
        </span>
      </div>
    ),
  }
);

interface GlobePanelProps {
  readonly selectedLocation: GeoLocation;
  readonly onSelectLocation: (loc: GeoLocation) => void;
  readonly aqiColor: string;
  readonly effectiveTierLabel: string;
  readonly effectiveAqi: number | null;
}

export function GlobePanel({
  selectedLocation,
  onSelectLocation,
  aqiColor,
  effectiveTierLabel,
  effectiveAqi,
}: GlobePanelProps) {
  return (
    <div
      id="panel-globe"
      role="tabpanel"
      aria-labelledby="tab-globe"
      className="w-full relative flex items-center justify-center animate-fadeIn overflow-y-auto"
    >
      <ComponentErrorBoundary
        fallbackTitle="3D Atmospheric Globe Unavailable"
        fallbackMessage="WebGL 3D globe visualization could not initialize on this hardware. Planetary dispersion data remains accessible via Regional Compare."
      >
        <MapLibreGlobe
          selectedLocation={selectedLocation}
          onSelectLocation={onSelectLocation}
          aqiColor={aqiColor}
          aqiTierLabel={effectiveTierLabel}
          currentAqi={effectiveAqi}
          theme="light"
        />
      </ComponentErrorBoundary>
    </div>
  );
}
