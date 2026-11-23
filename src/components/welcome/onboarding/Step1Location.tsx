'use client';

import React, { RefObject } from 'react';
import { GeoLocation } from '@/domain/types';
import { CITY_PRESETS } from './constants';

interface Step1LocationProps {
  readonly selectedLocation: GeoLocation;
  readonly onSelectLocation: (loc: GeoLocation) => void;
  readonly onDetectGps: () => void;
  readonly gpsLoading: boolean;
  readonly gpsStatus: string | null;
  readonly searchQuery: string;
  readonly onSearchQueryChange: (query: string) => void;
  readonly searchResults: readonly GeoLocation[];
  readonly isSearching: boolean;
  readonly onSelectSearchResult: (loc: GeoLocation) => void;
  readonly searchContainerRef: RefObject<HTMLDivElement | null>;
}

export function Step1Location({
  selectedLocation,
  onSelectLocation,
  onDetectGps,
  gpsLoading,
  gpsStatus,
  searchQuery,
  onSearchQueryChange,
  searchResults,
  isSearching,
  onSelectSearchResult,
  searchContainerRef,
}: Step1LocationProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2
          id="onboarding-modal-title"
          className="text-xl sm:text-2xl font-black text-slate-900 font-sans tracking-tight"
        >
          Where do you breathe most days?
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
          AirAware connects to local environmental satellites, ground stations, and CPCB standards based on your location.
        </p>
      </div>

      {/* Hardware GPS Detection & City Search Action Cluster */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Dedicated GPS Detection Button */}
          <button
            type="button"
            onClick={onDetectGps}
            disabled={gpsLoading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-teal-300 bg-teal-50/80 hover:bg-teal-100 text-teal-900 text-xs font-mono font-bold transition-all cursor-pointer disabled:opacity-50 shrink-0 shadow-2xs"
          >
            <svg
              className={`w-3.5 h-3.5 text-teal-800 ${gpsLoading ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.071-7.071l-1.414 1.414M8.343 15.657l-1.414 1.414m12.728 0l-1.414-1.414M8.343 8.343L6.929 6.929M12 8a4 4 0 100 8 4 4 0 000-8z"
              />
            </svg>
            <span>{gpsLoading ? 'Acquiring GPS...' : 'Detect with Device GPS'}</span>
          </button>

          {/* Search Any City Input */}
          <div ref={searchContainerRef} className="relative flex-1">
            <label htmlFor="onboarding-city-search" className="block w-full">
              <span className="sr-only">Search city or region</span>
              <input
                id="onboarding-city-search"
                name="citySearch"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="Search any city in India (e.g. Mumbai, Patna, Lucknow, Bengaluru)..."
                aria-label="Search any city or region"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:ring-1 focus:ring-teal-700 focus:outline-none transition-all"
              />
            </label>
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchQueryChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
                aria-label="Clear city search"
              >
                ✕
              </button>
            )}

            {/* Auto-suggest dropdown for any city */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-30 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden py-1 max-h-48 overflow-y-auto">
                <div className="px-3 py-1 text-[11px] font-sans font-semibold text-slate-500 border-b border-slate-100">
                  Locations found
                </div>
                {searchResults.map((result) => (
                  <button
                    key={`${result.id}-${result.latitude}`}
                    type="button"
                    onClick={() => onSelectSearchResult(result)}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-teal-50/80 flex items-center justify-between border-b border-slate-50 last:border-0 cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{result.name}</span>
                      {result.admin1 && (
                        <span className="text-slate-500 ml-1">({result.admin1})</span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                      {result.country} [{result.countryCode}]
                    </span>
                  </button>
                ))}
              </div>
            )}

            {isSearching && (
              <div className="absolute top-full left-0 right-0 mt-1 z-30 rounded-xl border border-slate-200 bg-white shadow-md p-2 text-xs font-mono text-slate-500">
                Searching city database...
              </div>
            )}
          </div>
        </div>

        {/* GPS / Search Feedback Status */}
        {gpsStatus && (
          <div className="text-[11px] font-mono text-teal-800 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200">
            {gpsStatus}
          </div>
        )}
      </div>

      {/* Quick 1-Tap City Presets */}
      <div className="space-y-2">
        <label className="text-xs font-mono font-bold uppercase text-slate-500 block">
          Or Select from Common City Presets
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CITY_PRESETS.map((city) => {
            const isSelected = selectedLocation.name === city.name;
            return (
              <button
                key={city.id}
                type="button"
                onClick={() => onSelectLocation(city)}
                className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-teal-700 bg-teal-50/70 shadow-2xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="block text-sm font-bold text-slate-900">
                    {city.name}
                  </span>
                  {isSelected && (
                    <span className="text-xs font-mono font-bold text-teal-800">✓</span>
                  )}
                </div>
                <span className="block text-[11px] font-mono text-slate-500 mt-0.5">
                  {city.admin1 || city.country} [{city.countryCode}]
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Selected Location Confirmation Card */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-0.5">
          <span className="text-[11px] font-sans font-semibold text-slate-500 block">
            Selected Location
          </span>
          <span className="font-bold text-slate-900 text-sm">
            {selectedLocation.name}
            {selectedLocation.admin1 ? `, ${selectedLocation.admin1}` : ''} ({selectedLocation.country})
          </span>
        </div>
        <div className="font-mono text-slate-500 self-start sm:self-auto sm:text-right">
          <span className="block">{selectedLocation.latitude.toFixed(2)}°N, {selectedLocation.longitude.toFixed(2)}°E</span>
          <span className="text-[10px] text-teal-800 font-bold">Ready to Connect</span>
        </div>
      </div>
    </div>
  );
}
