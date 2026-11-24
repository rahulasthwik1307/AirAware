'use client';

import React, { useEffect, useRef, useState, useCallback, useSyncExternalStore } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { GeoLocation } from '@/domain/types';
import { resolveGlobePlace } from './globe-place-resolver';
import {
  type GlobeMapStyleKey,
  type LocationInspectData,
  TILE_STYLES,
  subscribeReducedMotion,
  getReducedMotionSnapshot,
  getReducedMotionServerSnapshot,
  resolveInspectTelemetry,
} from './maplibre-styles';
import {
  DEFAULT_SKY_CONFIG,
  updateActiveLocationMarker,
  updateReferenceCityMarkers,
} from './maplibre-helpers';
import { GlobeTelemetryHud } from './GlobeTelemetryHud';
import { GlobeControlsOverlay } from './GlobeControlsOverlay';

export type { GlobeMapStyleKey, LocationInspectData };

export interface MapLibreGlobeProps {
  readonly selectedLocation: GeoLocation | null;
  readonly onSelectLocation: (loc: GeoLocation) => void;
  readonly aqiColor?: string;
  readonly aqiTierLabel?: string;
  readonly currentAqi?: number | null;
  readonly theme?: 'light' | 'dark';
}

/**
 * 3D Interactive WebGL Earth Globe powered by MapLibre GL.
 * Features real-time atmospheric lighting, celestial aura, multi-style layer switching,
 * auto-rotation, and interactive global air quality telemetry inspection.
 *
 * @param props - MapLibreGlobe configuration, location callbacks, and AQI metrics
 */
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
    } catch {}

    mapRef.current = map;

    map.on('load', () => {
      if (isGlobe) {
        try {
          map.setProjection({ type: 'globe' });
        } catch {}
      }

      try {
        map.setSky(DEFAULT_SKY_CONFIG);
      } catch {}
    });

    map.on('zoom', () => setCurrentZoom(Number(map.getZoom().toFixed(1))));
    map.on('mousemove', (e) => {
      setCursorCoords({ lat: Number(e.lngLat.lat.toFixed(4)), lng: Number(e.lngLat.lng.toFixed(4)) });
    });

    ['mousedown', 'touchstart', 'dragstart', 'rotatestart', 'wheel'].forEach((ev) => {
      map.on(ev as keyof maplibregl.MapEventType, () => setUserPaused(true));
    });

    map.on('click', async (e) => {
      const lat = Number(e.lngLat.lat.toFixed(4));
      const lng = Number(e.lngLat.lng.toFixed(4));

      let renderedFeatures: Array<{ properties?: Record<string, unknown> }> = [];
      try {
        renderedFeatures = map.queryRenderedFeatures(e.point);
      } catch {
        renderedFeatures = [];
      }

      const place = resolveGlobePlace(lat, lng, renderedFeatures);
      setInspectData(resolveInspectTelemetry(lat, lng, place, e.point));
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
      map.once('style.load', () => applyProjection(isGlobe));
    }
  }, [activeStyle, isGlobe, applyProjection]);

  // Update Projection: 3D Globe vs 2D Mercator
  useEffect(() => applyProjection(isGlobe), [isGlobe, applyProjection]);

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

    activeMarkerRef.current = updateActiveLocationMarker(
      map,
      selectedLocation,
      aqiColor,
      currentAqi,
      setInspectData,
      activeMarkerRef.current
    );
  }, [selectedLocation, aqiColor, currentAqi]);

  // Add World Reference City Markers with Hover / Click Intelligence
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    referenceMarkersRef.current = updateReferenceCityMarkers(
      map,
      selectedLocation,
      setInspectData,
      referenceMarkersRef.current
    );
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

  // Focus and select location from inspect card
  const handleSelectInspectLocation = useCallback(
    (data: LocationInspectData) => {
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
    },
    [onSelectLocation]
  );

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

      {/* MapLibre WebGL Canvas Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full -translate-y-0.5 sm:-translate-y-1 cursor-grab"
      />

      {/* Floating Glassmorphism Controls */}
      <GlobeControlsOverlay
        isGlobe={isGlobe}
        onToggleGlobe={setIsGlobe}
        activeStyle={activeStyle}
        onSelectStyle={setActiveStyle}
        onResetNorth={() => mapRef.current?.resetNorthPitch({ duration: 800 })}
        isRotating={isRotating}
        onToggleRotation={() => setUserPaused((p) => !p)}
        onFocusActive={handleFocusActive}
        cursorCoords={cursorCoords}
        currentZoom={currentZoom}
        onZoom={(delta) => {
          if (mapRef.current) {
            setUserPaused(true);
            mapRef.current.zoomTo(mapRef.current.getZoom() + delta, { duration: 400 });
          }
        }}
      />

      {/* Floating Interactive Environmental Intelligence Card */}
      {inspectData && (
        <GlobeTelemetryHud
          inspectData={inspectData}
          onClose={() => setInspectData(null)}
          onSelectLocation={handleSelectInspectLocation}
        />
      )}
    </div>
  );
}
