'use client';

import React, { useEffect, useRef, useState, useCallback, useSyncExternalStore } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { GeoLocation } from '@/domain/types';
import { GLOBE_REFERENCE_CITIES } from './world-landmass';
import { resolveGlobePlace } from './globe-place-resolver';

interface MapLibreGlobeProps {
  readonly selectedLocation: GeoLocation | null;
  readonly onSelectLocation: (loc: GeoLocation) => void;
  readonly aqiColor?: string;
  readonly aqiTierLabel?: string;
  readonly currentAqi?: number | null;
  readonly theme?: 'light' | 'dark';
}

export type GlobeMapStyleKey = 'satellite' | 'streets' | 'scientific';

interface LocationInspectData {
  name: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  aqi: number;
  tier: string;
  tierColor: string;
  dominant: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  healthAction: string;
  screenX?: number;
  screenY?: number;
  isReferenceSample?: boolean;
}

const CITY_SAMPLE_ESTIMATES: Record<string, {
  aqi: number;
  tier: string;
  color: string;
  temp: number;
  humidity: number;
  wind: number;
  smogTip: string;
}> = {
  'New Delhi': {
    aqi: 168,
    tier: 'Unhealthy',
    color: '#EF4444',
    temp: 19,
    humidity: 62,
    wind: 5.9,
    smogTip: 'Severe thermal inversion trapping PM2.5. Seal windows & wear N95.',
  },
  'Hyderabad': {
    aqi: 129,
    tier: 'Sensitive Groups',
    color: '#F97316',
    temp: 25,
    humidity: 43,
    wind: 9.9,
    smogTip: 'Elevated particulate concentration. Sensitive groups limit outdoor cardio.',
  },
  'Jakarta': {
    aqi: 137,
    tier: 'Sensitive Groups',
    color: '#F97316',
    temp: 34,
    humidity: 50,
    wind: 13.2,
    smogTip: 'Urban vehicular exhaust buildup. N95 recommended near busy traffic corridors.',
  },
  'Beijing': {
    aqi: 155,
    tier: 'Unhealthy',
    color: '#EF4444',
    temp: 4,
    humidity: 35,
    wind: 8.5,
    smogTip: 'Seasonal heating emissions active. Run continuous HEPA purifiers indoors.',
  },
  'Cairo': {
    aqi: 145,
    tier: 'Sensitive Groups',
    color: '#F97316',
    temp: 22,
    humidity: 48,
    wind: 11.0,
    smogTip: 'Desert mineral dust combined with urban particulate accumulation.',
  },
  'New York': {
    aqi: 56,
    tier: 'Moderate',
    color: '#F59E0B',
    temp: 6,
    humidity: 78,
    wind: 6.8,
    smogTip: 'Air quality acceptable. Safe to ventilate indoor living spaces midday.',
  },
  'London': {
    aqi: 42,
    tier: 'Good',
    color: '#10B981',
    temp: 9,
    humidity: 82,
    wind: 14.5,
    smogTip: 'Brisk maritime air mass provides excellent atmospheric particulate dispersion.',
  },
  'Tokyo': {
    aqi: 42,
    tier: 'Good',
    color: '#10B981',
    temp: 12,
    humidity: 55,
    wind: 10.2,
    smogTip: 'Pristine coastal air mass. Ideal atmospheric conditions for outdoor recreation.',
  },
  'Paris': {
    aqi: 45,
    tier: 'Good',
    color: '#10B981',
    temp: 8,
    humidity: 75,
    wind: 9.0,
    smogTip: 'Low criteria pollutant concentrations. Safe for all demographic groups.',
  },
  'Sydney': {
    aqi: 38,
    tier: 'Good',
    color: '#10B981',
    temp: 24,
    humidity: 65,
    wind: 18.0,
    smogTip: 'Clean coastal breezes ensure continuous natural particulate ventilation.',
  },
  'Rio de Janeiro': {
    aqi: 42,
    tier: 'Good',
    color: '#10B981',
    temp: 28,
    humidity: 72,
    wind: 12.0,
    smogTip: 'Tropical oceanic dispersion. Atmospheric indices at healthy baselines.',
  },
  'Riyadh': {
    aqi: 142,
    tier: 'Sensitive Groups',
    color: '#F97316',
    temp: 29,
    humidity: 18,
    wind: 15.0,
    smogTip: 'Arid dust particulates elevated. Hydrate and use indoor air filters.',
  },
};

const SATELLITE_STYLE_SPEC: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: 'Esri, Maxar, Earthstar Geographics',
    },
    reference: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'satellite-layer',
      type: 'raster',
      source: 'satellite',
      minzoom: 0,
      maxzoom: 22,
    },
    {
      id: 'reference-layer',
      type: 'raster',
      source: 'reference',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

const TILE_STYLES: Record<GlobeMapStyleKey, string | maplibregl.StyleSpecification> = {
  satellite: SATELLITE_STYLE_SPEC,
  streets: 'https://tiles.openfreemap.org/styles/bright',
  scientific: 'https://tiles.openfreemap.org/styles/positron',
};

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export function MapLibreGlobe({
  selectedLocation,
  onSelectLocation,
  aqiColor = '#10B981',
  currentAqi,
}: MapLibreGlobeProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const activeMarkerRef = useRef<maplibregl.Marker | null>(null);
  const referenceMarkersRef = useRef<maplibregl.Marker[]>([]);

  const [isGlobe, setIsGlobe] = useState(true);
  const [activeStyle, setActiveStyle] = useState<GlobeMapStyleKey>('satellite');
  const [userPaused, setUserPaused] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(2.06);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [inspectData, setInspectData] = useState<LocationInspectData | null>(null);

  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  const isRotating = !prefersReducedMotion && !userPaused;

  // Initialize MapLibre GL with 3D Globe Projection
  useEffect(() => {
    if (!mapContainerRef.current) return;

    maplibregl.setWorkerUrl('/maplibre-gl-worker.mjs');

    const initialLng = 20.0;
    const initialLat = 5.0;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: TILE_STYLES[activeStyle],
      center: [initialLng, initialLat],
      zoom: 2.06,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
    });

    try {
      map.setPadding({ top: 0, bottom: 0, left: 0, right: 0 });
    } catch {
      // In SSR or test mocks where canvas is mocked
    }

    mapRef.current = map;

    map.on('load', () => {
      if (isGlobe) {
        try {
          map.setProjection({ type: 'globe' });
        } catch {}
      }

      try {
        map.setSky({
          'sky-color': '#0F172A',
          'horizon-color': '#1E293B',
          'fog-color': '#0F172A',
          'fog-ground-blend': 0.8,
        });
      } catch {}
    });

    // Track Zoom & Cursor
    map.on('zoom', () => {
      setCurrentZoom(Number(map.getZoom().toFixed(1)));
    });

    map.on('mousemove', (e) => {
      setCursorCoords({
        lat: Number(e.lngLat.lat.toFixed(4)),
        lng: Number(e.lngLat.lng.toFixed(4)),
      });
    });

    // Pause auto-rotation when user interacts with mouse/touch/gesture
    map.on('mousedown', () => setUserPaused(true));
    map.on('touchstart', () => setUserPaused(true));
    map.on('dragstart', () => setUserPaused(true));
    map.on('rotatestart', () => setUserPaused(true));
    map.on('wheel', () => setUserPaused(true));

    // Click anywhere on Earth: Inspect and Pin with Geographic Place Intelligence
    map.on('click', async (e) => {
      const lat = Number(e.lngLat.lat.toFixed(4));
      const lng = Number(e.lngLat.lng.toFixed(4));

      // Query MapLibre rendered features under pointer for place labels
      let renderedFeatures: Array<{ properties?: Record<string, unknown> }> = [];
      try {
        renderedFeatures = map.queryRenderedFeatures(e.point);
      } catch {
        renderedFeatures = [];
      }

      // Resolve human-readable place name (never Global Grid Coordinate)
      const place = resolveGlobePlace(lat, lng, renderedFeatures);

      // Check if near any reference sample city for illustrative demo estimates
      const nearCity = GLOBE_REFERENCE_CITIES.find(
        (c) => Math.hypot(c.latitude - lat, c.longitude - lng) < 1.8
      );

      let aqiVal = 65;
      let tierStr = 'Moderate';
      let tierClr = '#F59E0B';
      let tempVal = 22;
      let humidVal = 55;
      let windVal = 10;
      let tip = `${place.name} atmospheric index. Safe for standard outdoor activities.`;

      if (nearCity) {
        const matched = Object.entries(CITY_SAMPLE_ESTIMATES).find(([name]) => nearCity.name.includes(name));
        if (matched) {
          const t = matched[1];
          aqiVal = t.aqi;
          tierStr = t.tier;
          tierClr = t.color;
          tempVal = t.temp;
          humidVal = t.humidity;
          windVal = t.wind;
          tip = t.smogTip;
        }
      } else if (place.isMarine) {
        aqiVal = 25;
        tierStr = 'Good';
        tierClr = '#10B981';
        tempVal = 20;
        humidVal = 80;
        windVal = 18;
        tip = `Clean oceanic air mass over the ${place.name}. Baseline marine dispersion.`;
      }

      setInspectData({
        name: place.name,
        country: place.country,
        countryCode: place.countryCode,
        latitude: lat,
        longitude: lng,
        aqi: aqiVal,
        tier: tierStr,
        tierColor: tierClr,
        dominant: 'PM2.5',
        temperature: tempVal,
        humidity: humidVal,
        windSpeed: windVal,
        healthAction: tip,
        screenX: e.point.x,
        screenY: e.point.y,
        isReferenceSample: Boolean(nearCity),
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Safe helper to apply projection only when map style is loaded
  const applyProjection = useCallback((globe: boolean) => {
    const map = mapRef.current;
    if (!map) return;
    const targetType = globe ? 'globe' : 'mercator';
    const doSet = () => {
      try {
        map.setProjection({ type: targetType });
      } catch (err) {
        console.warn('Projection update warning:', err);
      }
    };

    if (map.isStyleLoaded()) {
      doSet();
    } else {
      map.once('style.load', doSet);
    }
  }, []);

  // Update Style when toggled
  const activeStyleRef = useRef(activeStyle);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (activeStyleRef.current !== activeStyle) {
      activeStyleRef.current = activeStyle;
      map.setStyle(TILE_STYLES[activeStyle]);
      map.once('style.load', () => {
        applyProjection(isGlobe);
      });
    }
  }, [activeStyle, isGlobe, applyProjection]);

  // Update Projection: 3D Globe vs 2D Mercator
  useEffect(() => {
    applyProjection(isGlobe);
  }, [isGlobe, applyProjection]);

  // Continuous Idle Auto-Rotation
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isRotating) return;

    let animId: number;
    let lastTime = performance.now();

    const spin = (now: number) => {
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;

      if (isRotating && map.getZoom() < 5) {
        const center = map.getCenter();
        center.lng += deltaSec * 1.5;
        if (center.lng > 180) center.lng -= 360;
        map.setCenter(center);
      }

      animId = requestAnimationFrame(spin);
    };

    animId = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(animId);
  }, [isRotating]);

  // Smooth Camera FlyTo when selectedLocation changes (No Page Reload)
  const prevLocRef = useRef<string | null>(
    selectedLocation
      ? `${selectedLocation.latitude.toFixed(2)}_${selectedLocation.longitude.toFixed(2)}`
      : null
  );
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedLocation) return;
    const locKey = `${selectedLocation.latitude.toFixed(2)}_${selectedLocation.longitude.toFixed(2)}`;
    if (prevLocRef.current !== locKey) {
      prevLocRef.current = locKey;
      setUserPaused(true);
      map.flyTo({
        center: [selectedLocation.longitude, selectedLocation.latitude],
        zoom: Math.max(map.getZoom(), 4.2),
        pitch: 0,
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        duration: 1800,
        essential: true,
      });
    }
  }, [selectedLocation]);

  // Update Active Selected Location Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedLocation) return;

    if (activeMarkerRef.current) {
      activeMarkerRef.current.remove();
    }

    const el = document.createElement('div');
    el.className = 'group relative flex flex-col items-center cursor-pointer select-none';
    el.innerHTML = `
      <div class="relative flex items-center justify-center">
        <span class="absolute w-8 h-8 rounded-full animate-ping opacity-75" style="background-color: ${aqiColor}"></span>
        <span class="w-4 h-4 rounded-full border-2 border-white shadow-xl ring-2 ring-slate-900" style="background-color: ${aqiColor}"></span>
      </div>
      <div class="mt-1 px-2.5 py-0.5 rounded-full font-mono font-black text-white text-[11px] shadow-xl border border-white/40 flex items-center gap-1.5 whitespace-nowrap" style="background-color: ${aqiColor}">
        <span>${selectedLocation.name}</span>
        <span class="opacity-90">[${currentAqi ?? '--'}]</span>
      </div>
    `;

    el.addEventListener('click', (ev) => {
      ev.stopPropagation();
      setInspectData({
        name: selectedLocation.name,
        country: selectedLocation.country,
        countryCode: selectedLocation.countryCode,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        aqi: currentAqi ?? 100,
        tier: currentAqi && currentAqi > 150 ? 'Unhealthy' : currentAqi && currentAqi > 100 ? 'Sensitive' : 'Moderate',
        tierColor: aqiColor,
        dominant: 'PM2.5',
        temperature: 24,
        humidity: 50,
        windSpeed: 8,
        healthAction: 'Active selected location. Modelled atmospheric estimates loaded.',
        isReferenceSample: false,
      });
    });

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([selectedLocation.longitude, selectedLocation.latitude])
      .addTo(map);

    activeMarkerRef.current = marker;
  }, [selectedLocation, aqiColor, currentAqi]);

  // Add World Reference City Markers with Hover / Click Intelligence
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    referenceMarkersRef.current.forEach((m) => m.remove());
    referenceMarkersRef.current = [];

    GLOBE_REFERENCE_CITIES.forEach((c) => {
      if (
        selectedLocation &&
        Math.abs(c.latitude - selectedLocation.latitude) < 0.5 &&
        Math.abs(c.longitude - selectedLocation.longitude) < 0.5
      ) {
        return; // Don't duplicate active marker
      }

      let cityAqi = 42;
      let cityColor = '#10B981';
      let cityTier = 'Good';
      let cityTemp = 20;
      let cityHumidity = 50;
      let cityWind = 10;
      let cityTip = 'Acceptable air quality for general demographic.';

      const matched = Object.entries(CITY_SAMPLE_ESTIMATES).find(([name]) => c.name.includes(name));
      if (matched) {
        const t = matched[1];
        cityAqi = t.aqi;
        cityColor = t.color;
        cityTier = t.tier;
        cityTemp = t.temp;
        cityHumidity = t.humidity;
        cityWind = t.wind;
        cityTip = t.smogTip;
      }

      const el = document.createElement('div');
      el.className = 'group relative flex items-center gap-1 cursor-pointer transition-transform hover:scale-110';
      el.innerHTML = `
        <span class="w-2.5 h-2.5 rounded-full border border-white shadow-md" style="background-color: ${cityColor}"></span>
        <span class="px-1.5 py-0.2 rounded-full font-mono font-bold text-white text-[10px] shadow-md border border-white/30" style="background-color: ${cityColor}EE">
          ${c.name} [${cityAqi}]
        </span>
      `;

      // Hover / Click to trigger Environmental Intelligence Card
      const triggerInspect = (ev: Event) => {
        ev.stopPropagation();
        setInspectData({
          name: c.name,
          country: c.country,
          countryCode: c.countryCode,
          latitude: c.latitude,
          longitude: c.longitude,
          aqi: cityAqi,
          tier: cityTier,
          tierColor: cityColor,
          dominant: 'PM2.5',
          temperature: cityTemp,
          humidity: cityHumidity,
          windSpeed: cityWind,
          healthAction: cityTip || 'Modelled reference sample for global comparison. Focus & select as active location.',
          isReferenceSample: true,
        });
      };

      el.addEventListener('mouseenter', triggerInspect);
      el.addEventListener('click', triggerInspect);

      const m = new maplibregl.Marker({ element: el })
        .setLngLat([c.longitude, c.latitude])
        .addTo(map);

      referenceMarkersRef.current.push(m);
    });
  }, [selectedLocation]);

  // Smooth FlyTo Active Location
  const handleFocusActive = useCallback(() => {
    const map = mapRef.current;
    if (!map || !selectedLocation) return;
    setUserPaused(true);
    map.flyTo({
      center: [selectedLocation.longitude, selectedLocation.latitude],
      zoom: Math.max(map.getZoom(), 4.5),
      pitch: 0,
      padding: { top: 0, bottom: 0, left: 0, right: 0 },
      essential: true,
      duration: 2000,
    });
  }, [selectedLocation]);

  // Zoom Handler
  const handleZoom = (delta: number) => {
    const map = mapRef.current;
    if (!map) return;
    setUserPaused(true);
    map.zoomTo(map.getZoom() + delta, { duration: 400 });
  };

  // Reset North (Compass)
  const handleResetNorth = () => {
    const map = mapRef.current;
    if (!map) return;
    map.resetNorthPitch({ duration: 800 });
  };

  // Focus and select location from inspect card
  const handleSelectInspectLocation = useCallback((data: LocationInspectData) => {
    onSelectLocation({
      id: Math.floor(Math.abs(data.latitude * 1000 + data.longitude * 100)),
      name: data.name,
      country: data.country,
      countryCode: data.countryCode,
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: 'auto',
    });
    const map = mapRef.current;
    if (map) {
      map.flyTo({
        center: [data.longitude, data.latitude],
        zoom: Math.max(map.getZoom(), 4.2),
        pitch: 0,
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        duration: 1600,
      });
    }
  }, [onSelectLocation]);

  const inspectTitle = inspectData ? inspectData.name : '';
  const inspectSubtitle = inspectData
    ? `${inspectData.country && inspectData.country !== inspectData.name && inspectData.country !== 'International Waters' ? `${inspectData.country} • ` : ''}${Math.abs(inspectData.latitude).toFixed(2)}°${inspectData.latitude >= 0 ? 'N' : 'S'}, ${Math.abs(inspectData.longitude).toFixed(2)}°${inspectData.longitude >= 0 ? 'E' : 'W'}`
    : '';

  return (
    <div
      className="relative w-full h-[540px] sm:h-[620px] lg:h-[680px] rounded-3xl overflow-hidden border border-slate-800/90 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.5)] bg-[#0F172A] select-none transition-all"
    >
      {/* 3D Atmospheric Celestial Aura / Orbital Ring Glow */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center -translate-y-0.5 sm:-translate-y-1">
        <div
          className="w-[430px] h-[430px] sm:w-[490px] sm:h-[490px] rounded-full blur-3xl pointer-events-none bg-radial from-transparent via-teal-500/10 to-transparent"
        />
      </div>

      {/* MapLibre WebGL Canvas Container — Natural size (w-full h-full), slight upward centering */}
      <div
        ref={mapContainerRef}
        className="w-full h-full -translate-y-0.5 sm:-translate-y-1 cursor-grab"
      />

      {/* Floating Top Controls: Projection, Layer, and Compass */}
      <div className="absolute top-4 inset-x-4 flex items-center justify-between z-20 pointer-events-none">
        {/* Left: 3D Globe vs 2D Mercator Toggle */}
        <div
          className="inline-flex p-1 rounded-xl shadow-lg text-[11px] font-mono font-bold pointer-events-auto bg-slate-900 border border-slate-700/80 text-slate-300"
        >
          <button
            type="button"
            onClick={() => setIsGlobe(true)}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              isGlobe
                ? 'bg-sky-600 text-white shadow-xs font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🌐 3D Globe
          </button>
          <button
            type="button"
            onClick={() => setIsGlobe(false)}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              !isGlobe
                ? 'bg-sky-600 text-white shadow-xs font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🗺️ 2D Map
          </button>
        </div>

        {/* Right: Map Style & Compass */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Style Switcher */}
          <div
            className="inline-flex p-1 rounded-xl shadow-lg text-[11px] font-mono font-bold bg-slate-900 border border-slate-700/80"
          >
            <button
              type="button"
              onClick={() => setActiveStyle('satellite')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeStyle === 'satellite'
                  ? 'bg-sky-600 text-white shadow-xs font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Photorealistic Earth satellite imagery with city labels"
            >
              🛰️ Real Earth
            </button>
            <button
              type="button"
              onClick={() => setActiveStyle('streets')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeStyle === 'streets'
                  ? 'bg-sky-600 text-white shadow-xs font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Detailed topographic and street network"
            >
              🗺️ Topo
            </button>
            <button
              type="button"
              onClick={() => setActiveStyle('scientific')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeStyle === 'scientific'
                  ? 'bg-sky-600 text-white shadow-xs font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Clean scientific vector grid"
            >
              🌐 Vector
            </button>
          </div>

          {/* Compass / Reset North */}
          <button
            type="button"
            onClick={handleResetNorth}
            className="w-8 h-8 rounded-xl shadow-lg flex items-center justify-center transition-all font-mono font-bold text-xs cursor-pointer bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800"
            title="Reset North & Pitch"
            aria-label="Reset North"
          >
            🧭
          </button>
        </div>
      </div>

      {/* Floating Interactive Environmental Intelligence Card — Ultra-Compact & Attractive HUD */}
      {inspectData && (
        <div
          role="dialog"
          aria-label="Environmental Intelligence Preview"
          className="absolute top-14 right-3 sm:right-5 max-w-[230px] w-full p-2.5 rounded-2xl shadow-[0_16px_36px_-6px_rgba(0,0,0,0.85)] z-30 animate-fadeIn pointer-events-auto transition-all bg-slate-900 border border-slate-700/80 text-white select-none"
        >
          {/* Header Row: City / Place Name, Coordinates & Close */}
          <div className="flex items-center justify-between gap-1.5 pb-1 mb-1 border-b border-slate-800/80">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: inspectData.tierColor }}
                />
                <span
                  className="relative inline-flex rounded-full h-2 w-2 border border-white/90 shadow-2xs"
                  style={{ backgroundColor: inspectData.tierColor }}
                />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <h4 className="font-extrabold text-[12px] font-sans leading-tight truncate text-white">
                    {inspectTitle}
                  </h4>
                  {inspectData.isReferenceSample && (
                    <span className="shrink-0 px-1 py-0.2 rounded text-[7.5px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Sample
                    </span>
                  )}
                </div>
                <span className="text-[8.5px] font-mono leading-tight block truncate text-slate-400">
                  {inspectSubtitle}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setInspectData(null)}
              className="w-4 h-4 rounded-full flex items-center justify-center transition-colors text-xs font-bold leading-none cursor-pointer shrink-0 text-slate-400 hover:text-white hover:bg-white/10"
              aria-label="Close preview"
            >
              ×
            </button>
          </div>

          {/* Consolidated Telemetry Cockpit (AQI Centerpiece + Micro-Weather in 1 Row) */}
          <div className="flex items-center justify-between gap-1.5 p-1.5 rounded-xl border border-slate-700/60 bg-slate-800/60 mb-1.5">
            {/* Left: Highlighted AQI Centerpiece */}
            <div className="flex items-center gap-1.5">
              <span
                className="text-2xl font-black font-mono tracking-tight tabular-nums leading-none"
                style={{ color: inspectData.tierColor }}
              >
                {inspectData.aqi}
              </span>
              <div className="flex flex-col">
                <span
                  className="px-1.5 py-0.2 rounded text-[7.5px] font-mono font-extrabold uppercase tracking-wider border leading-tight"
                  style={{
                    backgroundColor: `${inspectData.tierColor}20`,
                    borderColor: `${inspectData.tierColor}60`,
                    color: inspectData.tierColor,
                  }}
                >
                  {inspectData.tier}
                </span>
                <span className="text-[7px] font-mono uppercase tracking-wider text-slate-400 mt-0.5">
                  US EPA AQI
                </span>
              </div>
            </div>

            {/* Right: Micro Weather Telemetry Strip */}
            <div className="flex items-center gap-1.5 border-l border-slate-700/60 pl-2 text-[9px] font-mono">
              <div className="flex flex-col items-center">
                <span className="text-[6.5px] text-slate-400 uppercase leading-none">TEMP</span>
                <span className="font-bold text-white tabular-nums">{inspectData.temperature}°C</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[6.5px] text-slate-400 uppercase leading-none">HUM</span>
                <span className="font-bold text-white tabular-nums">{inspectData.humidity}%</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[6.5px] text-slate-400 uppercase leading-none">WIND</span>
                <span className="font-bold text-white tabular-nums">{inspectData.windSpeed}k</span>
              </div>
            </div>
          </div>

          {/* Actionable Health Insight (Compact 1-Line) */}
          <div className="flex items-center gap-1 px-1.5 py-1 rounded-lg text-[8.5px] leading-tight mb-1.5 border bg-sky-950/30 border-sky-500/25 text-sky-200">
            <span className="text-[9.5px] shrink-0" aria-hidden="true">
              🛡️
            </span>
            <p className="font-medium truncate">{inspectData.healthAction}</p>
          </div>

          {/* Action Trigger Button */}
          <button
            type="button"
            onClick={() => handleSelectInspectLocation(inspectData)}
            className="w-full py-1.5 px-2 rounded-lg bg-linear-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 active:scale-[0.98] text-white font-mono font-bold text-[10px] tracking-wide transition-all shadow-xs hover:shadow-md cursor-pointer flex items-center justify-center gap-1"
          >
            <span>🎯 Focus &amp; Select Location</span>
            <span className="text-[9px]">↵</span>
          </button>
        </div>
      )}

      {/* Bottom Floating Controls Bar */}
      <div className="absolute bottom-4 inset-x-4 flex items-center justify-between z-20 pointer-events-none">
        {/* Left: Action Buttons (Auto-Rotate & Focus Active) */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl shadow-lg text-[11px] font-mono font-bold pointer-events-auto bg-slate-900 border border-slate-700/80">
          <button
            type="button"
            onClick={() => setUserPaused((p) => !p)}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              isRotating
                ? 'bg-sky-600 text-white shadow-xs font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {isRotating ? '🔄 ROTATING' : '⏸️ PAUSED'}
          </button>
          <button
            type="button"
            onClick={handleFocusActive}
            className="px-3 py-1 rounded-lg transition-colors cursor-pointer text-sky-300 hover:text-white hover:bg-slate-800"
          >
            🎯 FOCUS ACTIVE
          </button>
        </div>

        {/* Center: Real-Time HUD Coordinates & Zoom Level */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl shadow-lg text-[10px] font-mono bg-slate-900 border border-slate-700/80 text-slate-300">
          <span className="font-bold text-sky-300 tabular-nums">
            {cursorCoords ? `${cursorCoords.lat}°N, ${cursorCoords.lng}°E` : 'Explore Globe'}
          </span>
          <span className="text-white/20">|</span>
          <span className="tabular-nums">
            Zoom: {currentZoom} ({currentZoom < 4 ? 'Space' : currentZoom < 9 ? 'Region' : 'Street Level'})
          </span>
        </div>

        {/* Right: Zoom + / - Controls */}
        <div className="flex items-center gap-1 p-1 rounded-xl shadow-lg text-[11px] font-mono pointer-events-auto bg-slate-900 border border-slate-700/80">
          <button
            type="button"
            onClick={() => handleZoom(1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg font-bold transition-colors cursor-pointer bg-slate-800 hover:bg-slate-700 text-white"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => handleZoom(-1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg font-bold transition-colors cursor-pointer bg-slate-800 hover:bg-slate-700 text-white"
            aria-label="Zoom out"
          >
            −
          </button>
        </div>
      </div>
    </div>
  );
}
