'use client';

import React, { useState, useMemo, useCallback, useSyncExternalStore } from 'react';
import { z } from 'zod';
import { GeoLocation } from '@/domain/types';

const GeoLocationSchema = z.object({
  id: z.number(),
  name: z.string(),
  country: z.string(),
  countryCode: z.string(),
  admin1: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
  isPrimary: z.boolean().optional(),
});

const SavedLocationsSchema = z.array(GeoLocationSchema);

const SAVED_LOCATIONS_STORAGE_KEY = 'airaware_saved_locations';

function subscribeToSavedStorage(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getSavedStorageSnapshot(): string {
  try {
    return localStorage.getItem(SAVED_LOCATIONS_STORAGE_KEY) || '[]';
  } catch {
    return '[]';
  }
}

function getServerSavedStorageSnapshot(): string {
  return '[]';
}

interface SavedLocationsManagerProps {
  readonly currentLocation: GeoLocation | null;
  readonly onSelectLocation: (loc: GeoLocation) => void;
}

export function SavedLocationsManager({
  currentLocation,
  onSelectLocation,
}: SavedLocationsManagerProps) {
  // Use React 19 recommended useSyncExternalStore for localStorage synchronization
  const rawStorage = useSyncExternalStore(
    subscribeToSavedStorage,
    getSavedStorageSnapshot,
    getServerSavedStorageSnapshot
  );

  const [localLocations, setLocalLocations] = useState<GeoLocation[] | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const storedLocations = useMemo<GeoLocation[]>(() => {
    try {
      const parsed = JSON.parse(rawStorage);
      const valid = SavedLocationsSchema.safeParse(parsed);
      return valid.success ? valid.data : [];
    } catch {
      return [];
    }
  }, [rawStorage]);

  const savedLocations = localLocations ?? storedLocations;

  // Save locations back to localStorage whenever they change
  const persistLocations = useCallback((locations: GeoLocation[]) => {
    setLocalLocations(locations);
    try {
      localStorage.setItem(SAVED_LOCATIONS_STORAGE_KEY, JSON.stringify(locations));
      // Dispatch storage event so other subscribers update
      window.dispatchEvent(new Event('storage'));
    } catch {
      // Ignore localStorage write quota/permission errors
    }
  }, []);

  // Check if current location is saved
  const isCurrentSaved = currentLocation
    ? savedLocations.some(
        (loc) =>
          loc.id === currentLocation.id ||
          (Math.abs(loc.latitude - currentLocation.latitude) < 0.05 &&
            Math.abs(loc.longitude - currentLocation.longitude) < 0.05)
      )
    : false;

  // Toggle Save current location
  const handleToggleSaveCurrent = () => {
    if (!currentLocation) return;

    if (isCurrentSaved) {
      // Remove from saved
      const updated = savedLocations.filter(
        (loc) =>
          loc.id !== currentLocation.id &&
          !(
            Math.abs(loc.latitude - currentLocation.latitude) < 0.05 &&
            Math.abs(loc.longitude - currentLocation.longitude) < 0.05
          )
      );
      persistLocations(updated);
    } else {
      // Add to saved (limit to 10 cities for storage sanity)
      const isFirst = savedLocations.length === 0;
      const newLoc: GeoLocation = {
        ...currentLocation,
        isPrimary: isFirst,
      };
      const updated = [newLoc, ...savedLocations.slice(0, 9)];
      persistLocations(updated);
    }
  };

  const handleSetPrimary = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const updated = savedLocations.map((loc) => ({
      ...loc,
      isPrimary: loc.id === id,
    }));
    persistLocations(updated);
  };

  const handleRemove = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const updated = savedLocations.filter((loc) => loc.id !== id);
    persistLocations(updated);
  };

  return (
    <div className="flex items-center gap-2">
      {/* 1. Quick Star Bookmark Button */}
      {currentLocation && (
        <button
          type="button"
          onClick={handleToggleSaveCurrent}
          aria-label={isCurrentSaved ? 'Remove from saved locations' : 'Save this location'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
            isCurrentSaved
              ? 'bg-[var(--brand-surface)] text-[var(--brand-primary)] border-[var(--brand-primary)] shadow-xs'
              : 'bg-[var(--surface-card)] text-[var(--ink-secondary)] border-[var(--border-subtle)] hover:text-[var(--ink-primary)] hover:border-[var(--border-strong)]'
          }`}
        >
          <span className="text-sm select-none" aria-hidden="true">
            {isCurrentSaved ? '★' : '☆'}
          </span>
          <span className="font-mono text-[11px]">
            {isCurrentSaved ? 'SAVED' : 'SAVE CITY'}
          </span>
        </button>
      )}

      {/* 2. Saved Cities Drawer / Dropdown Trigger */}
      {savedLocations.length > 0 && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-controls="saved-locations-menu"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--ink-primary)] hover:bg-[var(--surface-subtle)] transition-all cursor-pointer shadow-xs"
          >
            <span>SAVED ({savedLocations.length})</span>
            <span className="text-[10px]" aria-hidden="true">
              {isOpen ? '▲' : '▼'}
            </span>
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div
              id="saved-locations-menu"
              role="menu"
              className="absolute right-0 top-full mt-1.5 z-50 w-64 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-2 shadow-lg"
            >
              <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-[var(--border-subtle)] text-[10px] font-mono text-[var(--ink-muted)] uppercase">
                <span>Bookmarked Locations</span>
                <span>Actions</span>
              </div>

              <ul className="space-y-1">
                {savedLocations.map((loc) => {
                  const isCurrent =
                    currentLocation &&
                    Math.abs(loc.latitude - currentLocation.latitude) < 0.05 &&
                    Math.abs(loc.longitude - currentLocation.longitude) < 0.05;

                  return (
                    <li
                      key={loc.id}
                      role="menuitem"
                      onClick={() => {
                        onSelectLocation(loc);
                        setIsOpen(false);
                      }}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        isCurrent
                          ? 'bg-[var(--brand-surface)] text-[var(--brand-primary)] font-bold'
                          : 'text-[var(--ink-primary)] hover:bg-[var(--surface-subtle)]'
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{loc.name}</span>
                          {loc.isPrimary && (
                            <span className="text-[9px] font-mono font-bold bg-[var(--brand-primary)] text-white px-1 rounded">
                              HOME
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[var(--ink-muted)] truncate">
                          {[loc.admin1, loc.countryCode].filter(Boolean).join(', ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {!loc.isPrimary && (
                          <button
                            type="button"
                            title="Set as Home location"
                            onClick={(e) => handleSetPrimary(e, loc.id)}
                            className="p-1 text-[10px] text-[var(--ink-muted)] hover:text-[var(--brand-primary)]"
                          >
                            🏠
                          </button>
                        )}
                        <button
                          type="button"
                          title="Remove saved city"
                          onClick={(e) => handleRemove(e, loc.id)}
                          className="p-1 text-[10px] text-[var(--ink-muted)] hover:text-[var(--aqi-unhealthy)] font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
