'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { GeoLocation, WorkspaceKey } from '@/domain/types';
import { CITY_PRESETS } from './onboarding/constants';
import { Step1Location } from './onboarding/Step1Location';
import { Step2Sensitivities } from './onboarding/Step2Sensitivities';
import { Step3FocusGoal } from './onboarding/Step3FocusGoal';

export { CITY_PRESETS };

export interface OnboardingResult {
  readonly location: GeoLocation;
  readonly householdSensitivities: readonly string[];
  readonly initialWorkspace: WorkspaceKey;
}

interface OnboardingModalProps {
  readonly isOpen: boolean;
  readonly onComplete: (result: OnboardingResult) => void;
  readonly onSkip: () => void;
  readonly onCancel: () => void;
}

export function OnboardingModal({
  isOpen,
  onComplete,
  onSkip,
  onCancel,
}: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedLocation, setSelectedLocation] = useState<GeoLocation>(CITY_PRESETS[0]);
  const [selectedSensitivities, setSelectedSensitivities] = useState<string[]>(['infants_children']);
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceKey>('air-intelligence');
  const [mounted, setMounted] = useState(false);

  // Search & GPS states for Step 1
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<readonly GeoLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounced search for any city globally via /api/locations/search
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/locations/search?name=${encodeURIComponent(trimmed)}&count=6`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch {
        // Search aborted or network failure
      } finally {
        setIsSearching(false);
      }
    }, 240);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchQuery]);

  // Keyboard navigation & body scroll lock
  useEffect(() => {
    if (!isOpen) {
      if (openerRef.current) {
        openerRef.current.focus();
      }
      return;
    }

    openerRef.current = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus first interactive element in modal
    setTimeout(() => {
      const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled])'
      );
      firstFocusable?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen || !mounted) return null;

  const handleDetectGps = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsStatus('Geolocation not supported in this browser environment.');
      return;
    }

    setGpsLoading(true);
    setGpsStatus('Requesting device location...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let resolvedName = 'Current Location';
        let resolvedCountry = 'Device GPS';
        let resolvedCountryCode = 'IN';
        let resolvedAdmin = '';

        try {
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
          resolvedName = `GPS (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)`;
        }

        setGpsLoading(false);
        const gpsLoc: GeoLocation = {
          id: Math.round(latitude * 10000 + longitude * 100),
          name: resolvedName,
          country: resolvedCountry,
          countryCode: resolvedCountryCode,
          admin1: resolvedAdmin,
          latitude,
          longitude,
          timezone: 'auto',
        };
        setSelectedLocation(gpsLoc);
        setGpsStatus(`GPS Acquired: ${resolvedName}${resolvedAdmin ? `, ${resolvedAdmin}` : ''}`);
      },
      (err) => {
        setGpsLoading(false);
        setGpsStatus(
          err.code === 1
            ? 'Location permission denied. Please select or search your city below.'
            : 'Unable to acquire GPS coordinates. Please select or search your city below.'
        );
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelectSearchResult = (loc: GeoLocation) => {
    setSelectedLocation(loc);
    setSearchQuery('');
    setSearchResults([]);
    setGpsStatus(null);
  };

  const toggleSensitivity = (id: string) => {
    setSelectedSensitivities((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleFinish = () => {
    onComplete({
      location: selectedLocation,
      householdSensitivities: selectedSensitivities,
      initialWorkspace: selectedWorkspace,
    });
  };

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={onCancel}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fadeIn"
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div ref={modalRef} className="relative w-full max-w-2xl rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-5 sm:p-7 space-y-4 sm:space-y-5 z-10 max-h-[92vh] flex flex-col justify-between overflow-y-auto scrollbar-none animate-scaleUp">
        {/* Step Indicator Header */}
        <div className="space-y-3 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-sans font-bold text-slate-900">
                Personalize Setup
              </span>
              <span className="text-xs font-sans text-slate-400">•</span>
              <span className="text-xs font-sans text-slate-500 font-medium">
                Step {step} of 3
              </span>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-700 text-sm p-1 rounded-lg transition-colors cursor-pointer"
              aria-label="Close setup modal"
            >
              ✕
            </button>
          </div>

          {/* Stepper Progress Bar */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-teal-700 h-full transition-all duration-300 ease-out"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <Step1Location
            selectedLocation={selectedLocation}
            onSelectLocation={(loc) => {
              setSelectedLocation(loc);
              setGpsStatus(null);
            }}
            onDetectGps={handleDetectGps}
            gpsLoading={gpsLoading}
            gpsStatus={gpsStatus}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            searchResults={searchResults}
            isSearching={isSearching}
            onSelectSearchResult={handleSelectSearchResult}
            searchContainerRef={searchContainerRef}
          />
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <Step2Sensitivities
            selectedSensitivities={selectedSensitivities}
            onToggleSensitivity={toggleSensitivity}
          />
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <Step3FocusGoal
            selectedWorkspace={selectedWorkspace}
            onSelectWorkspace={setSelectedWorkspace}
          />
        )}

        {/* Bottom Actions Bar */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="text-xs font-mono text-slate-500 hover:text-slate-800 underline cursor-pointer order-2 sm:order-1"
          >
            Skip Setup &amp; Explore App →
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((prev) => (prev === 3 ? 2 : 1))}
                className="px-4 py-2 text-xs font-mono font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Back
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((prev) => (prev === 1 ? 2 : 3))}
                className="px-5 py-2 text-xs font-mono font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-all shadow-xs cursor-pointer hover:shadow-md"
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="px-6 py-2.5 text-xs font-mono font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-all shadow-md cursor-pointer hover:shadow-lg active:scale-98"
              >
                Finish &amp; Open My Dashboard →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
