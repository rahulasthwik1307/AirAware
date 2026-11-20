'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GeoLocation } from '@/domain/types';
import { SavedLocationsManager } from './SavedLocationsManager';

interface LocationSearchProps {
  readonly onSelectLocation: (location: GeoLocation) => void;
  readonly selectedLocation: GeoLocation | null;
  readonly isLoading?: boolean;
  readonly isDefaultLocation?: boolean;
}

const QUICK_PICK_CITIES: readonly GeoLocation[] = [
  {
    id: 1273294,
    name: 'New Delhi',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Delhi (NCR)',
    latitude: 28.6139,
    longitude: 77.209,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 7279746,
    name: 'Noida',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Uttar Pradesh',
    latitude: 28.5355,
    longitude: 77.391,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 1275339,
    name: 'Mumbai',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Maharashtra',
    latitude: 19.076,
    longitude: 72.8777,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 1275004,
    name: 'Kolkata',
    country: 'India',
    countryCode: 'IN',
    admin1: 'West Bengal',
    latitude: 22.5726,
    longitude: 88.3639,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 1277333,
    name: 'Bengaluru',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Karnataka',
    latitude: 12.9716,
    longitude: 77.5946,
    timezone: 'Asia/Kolkata',
  },
];

export function LocationSearch({
  onSelectLocation,
  selectedLocation,
  isLoading = false,
  isDefaultLocation = false,
}: LocationSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<readonly GeoLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced search logic with AbortController
  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (trimmed.length < 2) {
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      setStatusMessage(`Searching locations for ${trimmed}...`);

      try {
        const res = await fetch(
          `/api/locations/search?name=${encodeURIComponent(trimmed)}&count=6`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        const results: GeoLocation[] = data.results || [];
        setSuggestions(results);
        setIsOpen(results.length > 0);
        setActiveIndex(-1);
        setStatusMessage(
          results.length > 0
            ? `${results.length} locations resolved for ${trimmed}. Use up and down arrows to navigate.`
            : `No atmospheric grid matches found for ${trimmed}.`
        );
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setSuggestions([]);
          setStatusMessage(`Could not search locations. Please try again.`);
        }
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchTerm]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (val.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setIsSearching(false);
    }
  };

  const handleSelect = useCallback(
    (loc: GeoLocation) => {
      setSearchTerm('');
      setSuggestions([]);
      setIsOpen(false);
      setStatusMessage(`Location selected: ${loc.name}, ${loc.country}`);
      onSelectLocation(loc);
    },
    [onSelectLocation]
  );

  // Keyboard navigation for combobox
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelect(suggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  // Browser Geolocation with Client-Side Reverse Geocoding
  const handleGpsLocation = () => {
    if (!navigator.geolocation) {
      setStatusMessage('Geolocation sensor is not supported by your browser environment.');
      return;
    }

    setGpsLoading(true);
    setStatusMessage('Acquiring hardware GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let resolvedName = 'Current Location';
        let resolvedCountry = 'Device GPS';
        let resolvedCountryCode = '';
        let resolvedAdmin = '';

        try {
          // Free, keyless client reverse geocoding
          const revRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          if (revRes.ok) {
            const geo = await revRes.json();
            resolvedName = geo.city || geo.locality || 'Current Area';
            resolvedCountry = geo.countryName || 'Current Country';
            resolvedCountryCode = geo.countryCode || '';
            resolvedAdmin = geo.principalSubdivision || '';
          }
        } catch {
          // Fallback to coordinates on network error
          resolvedName = `GPS (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)`;
        }

        setGpsLoading(false);
        const gpsLocation: GeoLocation = {
          id: Math.round(latitude * 10000 + longitude * 100),
          name: resolvedName,
          country: resolvedCountry,
          countryCode: resolvedCountryCode,
          admin1: resolvedAdmin,
          latitude,
          longitude,
          timezone: 'auto',
        };
        handleSelect(gpsLocation);
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setStatusMessage(
            'GPS sensor permission was denied. You may search for any coordinate or city manually.'
          );
        } else {
          setStatusMessage('GPS coordinate acquisition timed out or failed.');
        }
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  return (
    <section aria-labelledby="location-search-heading" className="w-full">
      <h2 id="location-search-heading" className="sr-only">
        Global Environmental Location Selection
      </h2>

      {/* Accessible Polite Status Messenger for Screen Readers */}
      <div role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </div>

      <div ref={containerRef} className="relative w-full">
        {/* Header Bar with Saved Locations Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <label
              htmlFor="location-search-input"
              className="text-xs font-bold tracking-wider text-[var(--ink-secondary)] uppercase font-mono"
            >
              Location Discovery &amp; Global Grid
            </label>
            {selectedLocation && (
              <span className="text-[11px] font-mono text-[var(--ink-muted)]">
                ({selectedLocation.latitude.toFixed(2)}°N, {selectedLocation.longitude.toFixed(2)}°E)
                {isDefaultLocation && (
                  <span className="ml-1 text-amber-700 font-semibold">• Default starting reference (Not your detected location)</span>
                )}
              </span>
            )}
          </div>

          {/* Saved Locations Manager Integration */}
          <SavedLocationsManager
            currentLocation={selectedLocation}
            onSelectLocation={onSelectLocation}
          />
        </div>

        {/* Input & Precision GPS Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          {/* Main Search Input Container */}
          <div className="relative flex-1">
            <div className="relative flex items-center">
              <span
                className="absolute left-3.5 text-sm text-[var(--ink-muted)] pointer-events-none select-none"
                aria-hidden="true"
              >
                🔍
              </span>
              <input
                id="location-search-input"
                type="search"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={isOpen}
                aria-controls="location-results-list"
                aria-activedescendant={
                  activeIndex >= 0 ? `location-option-${activeIndex}` : undefined
                }
                value={searchTerm}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => suggestions.length > 0 && setIsOpen(true)}
                placeholder="Search any global city or coordinates (e.g. New Delhi, London, Tokyo, Paris)..."
                autoComplete="off"
                spellCheck="false"
                className="w-full h-11 pl-9 pr-10 text-sm font-medium text-[var(--ink-primary)] bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl shadow-xs placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/40 focus:border-[var(--brand-primary)] transition-all font-sans"
              />
              {isSearching && (
                <div
                  className="absolute right-3.5 h-4 w-4 rounded-full border-2 border-[var(--brand-primary)] border-t-transparent animate-spin"
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Results Dropdown */}
            {isOpen && suggestions.length > 0 && (
              <ul
                id="location-results-list"
                role="listbox"
                aria-label="Location search suggestions"
                className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-64 overflow-y-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-1.5 shadow-xl"
              >
                {suggestions.map((loc, idx) => {
                  const isSelected = idx === activeIndex;
                  return (
                    <li
                      key={loc.id}
                      id={`location-option-${idx}`}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(loc)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[var(--brand-surface)] text-[var(--brand-primary)] font-bold'
                          : 'text-[var(--ink-primary)] hover:bg-[var(--surface-subtle)]'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs text-[var(--ink-primary)]">
                          {loc.name}
                        </span>
                        <span className="text-[11px] text-[var(--ink-muted)]">
                          {[loc.admin1, loc.country].filter(Boolean).join(', ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-[var(--ink-muted)]">
                          {loc.latitude.toFixed(1)}°, {loc.longitude.toFixed(1)}°
                        </span>
                        <span className="text-[10px] font-mono font-bold text-[var(--ink-primary)] bg-[var(--surface-subtle)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">
                          {loc.countryCode || 'INTL'}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* GPS Button */}
          <button
            type="button"
            onClick={handleGpsLocation}
            disabled={gpsLoading || isLoading}
            aria-label="Acquire coordinates from browser GPS"
            className="w-full sm:w-auto h-11 px-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] text-xs font-semibold text-[var(--ink-primary)] shadow-xs hover:bg-[var(--surface-subtle)] hover:border-[var(--border-strong)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/40 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer font-mono shrink-0"
          >
            {gpsLoading ? (
              <span className="h-3.5 w-3.5 rounded-full border-2 border-[var(--brand-primary)] border-t-transparent animate-spin" />
            ) : (
              <span className="text-base" aria-hidden="true">📍</span>
            )}
            <span>GPS LOCATE</span>
          </button>
        </div>

        {/* Global Quick-Pick Reference Cities */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono text-[var(--ink-muted)] uppercase tracking-wider mr-1">
            Presets:
          </span>
          {QUICK_PICK_CITIES.map((city) => {
            const isCityActive =
              selectedLocation?.name.toLowerCase() === city.name.toLowerCase();
            return (
              <button
                key={city.id}
                type="button"
                onClick={() => handleSelect(city)}
                className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  isCityActive
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-surface)] text-[var(--brand-primary)] font-bold shadow-xs'
                    : 'border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--ink-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--ink-primary)]'
                }`}
              >
                {city.name} [{city.countryCode}]
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
