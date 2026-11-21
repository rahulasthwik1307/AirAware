'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { GeoLocation, WorkspaceKey } from '@/domain/types';

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

const CITY_PRESETS: readonly GeoLocation[] = [
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
    id: 1269843,
    name: 'Hyderabad',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Telangana',
    latitude: 17.385,
    longitude: 78.4867,
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
    id: 1264527,
    name: 'Chennai',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Tamil Nadu',
    latitude: 13.0827,
    longitude: 80.2707,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 1259229,
    name: 'Pune',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Maharashtra',
    latitude: 18.5204,
    longitude: 73.8567,
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
    id: 2643743,
    name: 'London',
    country: 'United Kingdom',
    countryCode: 'GB',
    admin1: 'England',
    latitude: 51.5085,
    longitude: -0.1257,
    timezone: 'Europe/London',
  },
];

const HEALTH_OPTIONS = [
  {
    id: 'infants_children',
    title: 'Infants or School Children',
    desc: 'Pediatric airway vulnerability; triggers earlier N95 mask alerts during morning school transit.',
    badge: 'Pediatric Shield',
  },
  {
    id: 'elderly_parents',
    title: 'Elderly Family Members (65+)',
    desc: 'Cardiovascular defense; shifts morning walking routines away from peak ground thermal inversion.',
    badge: 'Cardiovascular',
  },
  {
    id: 'asthma_respiratory',
    title: 'Asthma or Respiratory Sensitivity',
    desc: 'Strict CPCB exposure thresholds; alerts on fine particulate spikes above 150 μg/m³.',
    badge: 'Respiratory',
  },
  {
    id: 'active_commuter',
    title: 'Active Daily Commuter or Runner',
    desc: 'Evaluates outdoor inhalation volumes and suggests low-emission Delhi Metro transit alternatives.',
    badge: 'Commuter',
  },
  {
    id: 'healthy_adult',
    title: 'General Healthy Household',
    desc: 'Standard WHO ambient guidelines with regular diurnal cross-ventilation advisories.',
    badge: 'General',
  },
];

const FOCUS_GOALS: readonly {
  readonly workspace: WorkspaceKey;
  readonly title: string;
  readonly desc: string;
}[] = [
  {
    workspace: 'air-intelligence',
    title: 'Outdoor Air Quality & Global Smog Tracking',
    desc: 'View real-time Copernicus satellite models, 3D Earth dispersion, and CPCB standard benchmarks.',
  },
  {
    workspace: 'family-planner',
    title: 'Family Morning Routines & Commute Timing Shifts',
    desc: 'Protect vulnerable family members by rescheduling outdoor hours away from ground inversion smog.',
  },
  {
    workspace: 'indoor-air',
    title: 'Indoor Air Purifier Sizing & Safe Window Timing',
    desc: 'Calculate room CADR/ACH and discover exact afternoon hours when solar heating safely opens windows.',
  },
  {
    workspace: 'cleaner-choices',
    title: 'Sustainable Commute & Tailpipe Carbon Reduction',
    desc: 'Audit solo car emissions against electric metro transit and build low-emission daily habits.',
  },
  {
    workspace: 'community-alerts',
    title: 'Society WhatsApp Alerts & Citizen Pollution Reporting',
    desc: 'Dispatch apartment clean-air notices to security guards and record geo-tagged visual evidence.',
  },
];

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
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
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
      setGpsStatus('Device geolocation is not supported in this browser.');
      return;
    }

    setGpsLoading(true);
    setGpsStatus('Acquiring hardware GPS coordinates...');

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
      <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-5 sm:p-7 space-y-4 sm:space-y-5 z-10 max-h-[92vh] flex flex-col justify-between overflow-y-auto scrollbar-none animate-scaleUp">
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

        {/* STEP 1: Select Primary City (MANDATORY with GPS + Any City Search) */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2
                id="onboarding-modal-title"
                className="text-xl sm:text-2xl font-black text-slate-900 font-sans tracking-tight"
              >
                Where do you breathe most days?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                AirAware connects to local Copernicus CAMS satellite telemetry and regional CPCB airshed standards based on your location.
              </p>
            </div>

            {/* Hardware GPS Detection & City Search Action Cluster */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Dedicated GPS Detection Button */}
                <button
                  type="button"
                  onClick={handleDetectGps}
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
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search any city (e.g. Hyderabad, Pune, London)..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:ring-1 focus:ring-teal-700 focus:outline-none transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
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
                          onClick={() => handleSelectSearchResult(result)}
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
                      Searching global airshed database...
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

            {/* Quick 1-Tap City Presets (Expanded with Hyderabad & Major Hubs) */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold uppercase text-slate-500 block">
                Or Select from Major Airshed Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CITY_PRESETS.map((city) => {
                  const isSelected = selectedLocation.name === city.name;
                  return (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => {
                        setSelectedLocation(city);
                        setGpsStatus(null);
                      }}
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
        )}

        {/* STEP 2: Household & Sensitivity Profile (OPTIONAL) */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2
                id="onboarding-modal-title"
                className="text-xl sm:text-2xl font-black text-slate-900 font-sans tracking-tight"
              >
                Who are you protecting in your home?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                Select all that apply. AirAware will customize your morning exposure thresholds, school transit shifts, and N95 respirator alerts.
              </p>
            </div>

            {/* Health Sensitivity Multi-Select Cards */}
            <div className="space-y-2">
              {HEALTH_OPTIONS.map((opt) => {
                const isChecked = selectedSensitivities.includes(opt.id);
                return (
                  <div
                    key={opt.id}
                    onClick={() => toggleSensitivity(opt.id)}
                    className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isChecked
                        ? 'border-teal-700 bg-teal-50/50 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // handled by parent div
                      className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-teal-700 focus:ring-teal-700"
                    />
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">
                          {opt.title}
                        </span>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {opt.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-sans">
                        {opt.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Primary Focus Workspace Routing */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2
                id="onboarding-modal-title"
                className="text-xl sm:text-2xl font-black text-slate-900 font-sans tracking-tight"
              >
                What is your main focus today?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                Choose what matters most to your routine right now. This selects your primary landing workspace upon launch.
              </p>
            </div>

            {/* Workspace Select Options */}
            <div className="space-y-2">
              {FOCUS_GOALS.map((goal) => {
                const isSelected = selectedWorkspace === goal.workspace;
                return (
                  <div
                    key={goal.workspace}
                    onClick={() => setSelectedWorkspace(goal.workspace)}
                    className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'border-teal-700 bg-teal-50/60 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-teal-700">
                      {isSelected && (
                        <div className="h-2 w-2 rounded-full bg-teal-700" />
                      )}
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <span className="text-sm font-bold text-slate-900 block">
                        {goal.title}
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed font-sans">
                        {goal.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
                onClick={() => setStep((prev) => (prev - 1) as any)}
                className="px-4 py-2 text-xs font-mono font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Back
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((prev) => (prev + 1) as any)}
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
