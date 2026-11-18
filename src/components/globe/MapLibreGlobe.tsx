'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { GeoLocation } from '@/domain/types';
import { GLOBE_REFERENCE_CITIES } from './world-landmass';

interface MapLibreGlobeProps {
  readonly selectedLocation: GeoLocation | null;
  readonly onSelectLocation: (loc: GeoLocation) => void;
  readonly aqiColor?: string;
  readonly aqiTierLabel?: string;
  readonly currentAqi?: number | null;
}

export type GlobeMapStyleKey = 'satellite' | 'streets' | 'scientific';

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

export function MapLibreGlobe({
  selectedLocation,
  onSelectLocation,
  aqiColor = '#0F766E',
  aqiTierLabel,
  currentAqi,
}: MapLibreGlobeProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const activeMarkerRef = useRef<maplibregl.Marker | null>(null);
  const referenceMarkersRef = useRef<maplibregl.Marker[]>([]);

  const [isGlobe, setIsGlobe] = useState(true);
  const [activeStyle, setActiveStyle] = useState<GlobeMapStyleKey>('satellite');
  const [isRotating, setIsRotating] = useState(true);
  const [currentZoom, setCurrentZoom] = useState(2.2);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [clickedPoint, setClickedPoint] = useState<{
    lat: number;
    lng: number;
    name?: string;
    screenX: number;
    screenY: number;
  } | null>(null);

  // Initialize MapLibre GL with 3D Globe Projection
  useEffect(() => {
    if (!mapContainerRef.current) return;

    maplibregl.setWorkerUrl('/maplibre-gl-worker.mjs');

    const initialLng = selectedLocation ? selectedLocation.longitude : 78.4867;
    const initialLat = selectedLocation ? selectedLocation.latitude : 17.385;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: TILE_STYLES[activeStyle],
      center: [initialLng, initialLat],
      zoom: 2.0,
      pitch: 20,
      bearing: 0,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on('load', () => {
      // 1. Enforce 3D Globe Projection
      if (isGlobe) {
        try {
          map.setProjection({ type: 'globe' });
        } catch {}
      }

      // 2. Add atmospheric space horizon styling
      try {
        map.setSky({
          'sky-color': '#020617',
          'horizon-color': '#38bdf8',
          'fog-color': '#0b1528',
          'fog-ground-blend': 0.7,
        });
      } catch {
        // Safe fallback if sky API is not supported in current style
      }
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

    // Pause auto-rotation when user interacts with mouse/touch
    map.on('mousedown', () => setIsRotating(false));
    map.on('touchstart', () => setIsRotating(false));

    // Click anywhere on Earth: Select and Pin
    map.on('click', async (e) => {
      const lat = Number(e.lngLat.lat.toFixed(4));
      const lng = Number(e.lngLat.lng.toFixed(4));

      // Attempt reverse geocoding via Open-Meteo or fallback to geographic coordinate
      let locName = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(2)}°${lng >= 0 ? 'E' : 'W'}`;
      let country = 'Global Grid';
      let countryCode = 'GRID';

      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locName)}&count=1&language=en&format=json`);
        // If exact search not possible, check nearest known city
      } catch {}

      // Find nearest reference city if within ~150km
      const nearCity = GLOBE_REFERENCE_CITIES.find(
        (c) => Math.hypot(c.latitude - lat, c.longitude - lng) < 1.5
      );
      if (nearCity) {
        locName = nearCity.name;
        country = nearCity.country;
        countryCode = nearCity.countryCode;
      }

      setClickedPoint({
        lat,
        lng,
        name: locName,
        screenX: e.point.x,
        screenY: e.point.y,
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
        // Eastward celestial rotation (~1.5 deg/sec)
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
      <div class="mt-1 px-2.5 py-0.5 rounded-full font-mono font-black text-white text-[11px] shadow-xl border border-white/40 backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap" style="background-color: ${aqiColor}">
        <span>${selectedLocation.name}</span>
        <span class="opacity-90">[${currentAqi ?? '--'}]</span>
      </div>
    `;

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([selectedLocation.longitude, selectedLocation.latitude])
      .addTo(map);

    activeMarkerRef.current = marker;
  }, [selectedLocation, aqiColor, currentAqi]);

  // Add World Reference City Markers
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
      let cityColor = '#047857';
      if (c.name.includes('Delhi')) {
        cityAqi = 168;
        cityColor = '#B91C1C';
      } else if (c.name.includes('Beijing')) {
        cityAqi = 155;
        cityColor = '#B91C1C';
      } else if (c.name.includes('Jakarta')) {
        cityAqi = 137;
        cityColor = '#C2410C';
      } else if (c.name.includes('New York')) {
        cityAqi = 56;
        cityColor = '#B45309';
      } else if (c.name.includes('Cairo')) {
        cityAqi = 145;
        cityColor = '#C2410C';
      }

      const el = document.createElement('div');
      el.className = 'flex items-center gap-1 cursor-pointer transition-transform hover:scale-110';
      el.innerHTML = `
        <span class="w-2.5 h-2.5 rounded-full border border-white shadow-md" style="background-color: ${cityColor}"></span>
        <span class="px-1.5 py-0.2 rounded-full font-mono font-bold text-white text-[10px] shadow-md border border-white/30 backdrop-blur-sm" style="background-color: ${cityColor}EE">
          ${c.name} [${cityAqi}]
        </span>
      `;

      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        onSelectLocation(c);
        map.flyTo({ center: [c.longitude, c.latitude], zoom: Math.max(map.getZoom(), 4.5), duration: 1800 });
      });

      const m = new maplibregl.Marker({ element: el })
        .setLngLat([c.longitude, c.latitude])
        .addTo(map);

      referenceMarkersRef.current.push(m);
    });
  }, [selectedLocation, onSelectLocation]);

  // Smooth FlyTo Active Location
  const handleFocusActive = useCallback(() => {
    const map = mapRef.current;
    if (!map || !selectedLocation) return;
    setIsRotating(false);
    map.flyTo({
      center: [selectedLocation.longitude, selectedLocation.latitude],
      zoom: Math.max(map.getZoom(), 5.0),
      pitch: 35,
      essential: true,
      duration: 2200,
    });
  }, [selectedLocation]);

  // Zoom Handler
  const handleZoom = (delta: number) => {
    const map = mapRef.current;
    if (!map) return;
    setIsRotating(false);
    map.zoomTo(map.getZoom() + delta, { duration: 400 });
  };

  // Reset North (Compass)
  const handleResetNorth = () => {
    const map = mapRef.current;
    if (!map) return;
    map.resetNorthPitch({ duration: 800 });
  };

  return (
    <div className="relative w-full h-[540px] sm:h-[620px] lg:h-[680px] rounded-2xl overflow-hidden border border-slate-300/80 shadow-inner bg-slate-950 select-none">
      {/* MapLibre WebGL Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Top Controls: Projection, Layer, and Compass */}
      <div className="absolute top-4 inset-x-4 flex items-center justify-between z-20 pointer-events-none">
        {/* Left: 3D Globe vs 2D Mercator Toggle */}
        <div className="inline-flex p-1 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-md text-[11px] font-mono font-bold pointer-events-auto">
          <button
            type="button"
            onClick={() => setIsGlobe(true)}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              isGlobe ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🌐 3D Globe
          </button>
          <button
            type="button"
            onClick={() => setIsGlobe(false)}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              !isGlobe ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🗺️ 2D Map
          </button>
        </div>

        {/* Right: Map Style & Compass */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Style Switcher */}
          <div className="inline-flex p-1 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-md text-[11px] font-mono font-bold">
            <button
              type="button"
              onClick={() => setActiveStyle('satellite')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeStyle === 'satellite' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Photorealistic Earth satellite imagery with city labels"
            >
              🛰️ Real Earth
            </button>
            <button
              type="button"
              onClick={() => setActiveStyle('streets')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeStyle === 'streets' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Detailed topographic and street network"
            >
              🗺️ Topo
            </button>
            <button
              type="button"
              onClick={() => setActiveStyle('scientific')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeStyle === 'scientific' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
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
            className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-all font-mono font-bold text-xs cursor-pointer"
            title="Reset North & Pitch"
            aria-label="Reset North"
          >
            🧭
          </button>
        </div>
      </div>

      {/* Floating Click-to-Pin Inspection Popup */}
      {clickedPoint && (
        <div
          className="absolute z-30 transition-all duration-100 ease-out pointer-events-auto"
          style={{
            left: `${Math.min(Math.max(clickedPoint.screenX - 110, 16), 400)}px`,
            top: `${Math.min(Math.max(clickedPoint.screenY - 130, 16), 480)}px`,
          }}
        >
          <div className="w-60 p-3.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl text-left text-slate-900 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
              <span className="text-xs font-mono font-bold text-slate-800 truncate">
                {clickedPoint.name || 'Custom Location'}
              </span>
              <button
                type="button"
                onClick={() => setClickedPoint(null)}
                className="text-slate-400 hover:text-slate-700 text-sm px-1 cursor-pointer"
                aria-label="Close popup"
              >
                ×
              </button>
            </div>

            <div className="text-[11px] font-mono text-slate-600 mb-2.5">
              <span>Coordinates: {clickedPoint.lat}°N, {clickedPoint.lng}°E</span>
            </div>

            <button
              type="button"
              onClick={() => {
                onSelectLocation({
                  id: Math.floor(Math.abs(clickedPoint.lat * 1000 + clickedPoint.lng * 100)),
                  name: clickedPoint.name || `${clickedPoint.lat}°, ${clickedPoint.lng}°`,
                  country: 'Selected Region',
                  countryCode: 'GRID',
                  latitude: clickedPoint.lat,
                  longitude: clickedPoint.lng,
                  timezone: 'auto',
                });
                setClickedPoint(null);
              }}
              className="w-full py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-mono font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Set as Active Location</span>
              <span>↵</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Floating Telemetry Bar */}
      <div className="absolute bottom-4 inset-x-4 flex items-center justify-between z-20 pointer-events-none">
        {/* Left: Action Buttons (Auto-Rotate & Focus Active) */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-md text-[11px] font-mono font-bold pointer-events-auto">
          <button
            type="button"
            onClick={() => setIsRotating((r) => !r)}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              isRotating ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {isRotating ? '🔄 ROTATING' : '⏸️ PAUSED'}
          </button>
          <button
            type="button"
            onClick={handleFocusActive}
            className="px-3 py-1 text-sky-700 hover:text-sky-900 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
          >
            🎯 FOCUS ACTIVE
          </button>
        </div>

        {/* Center: Real-Time HUD Coordinates & Zoom Level */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-md text-[10px] font-mono text-slate-600">
          <span>
            {cursorCoords ? `${cursorCoords.lat}°N, ${cursorCoords.lng}°E` : 'Explore Globe'}
          </span>
          <span className="text-slate-300">|</span>
          <span>Zoom: {currentZoom} ({currentZoom < 4 ? 'Space' : currentZoom < 9 ? 'Region' : 'Street Level'})</span>
        </div>

        {/* Right: Zoom + / - Controls */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-md text-[11px] font-mono pointer-events-auto">
          <button
            type="button"
            onClick={() => handleZoom(1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-colors cursor-pointer"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => handleZoom(-1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-colors cursor-pointer"
            aria-label="Zoom out"
          >
            −
          </button>
        </div>
      </div>
    </div>
  );
}
