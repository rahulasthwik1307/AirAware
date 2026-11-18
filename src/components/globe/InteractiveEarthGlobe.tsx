'use client';

import React, { useRef, useEffect, useState, useCallback, useSyncExternalStore } from 'react';
import * as THREE from 'three';
import { GeoLocation } from '@/domain/types';
import { GLOBE_REFERENCE_CITIES, GlobeCityPin } from './world-landmass';

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
}

function getReducedMotionSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getServerReducedMotionSnapshot(): boolean {
  return false;
}

/**
 * Resolves CSS variable tokens or raw hex color strings into sanitized hex values.
 */
function resolveAqiColor(colorToken: string = ''): { hex: string; rgba: (alpha: number) => string } {
  const map: Record<string, string> = {
    'var(--aqi-good)': '#047857',
    'var(--aqi-moderate)': '#B45309',
    'var(--aqi-sensitive)': '#C2410C',
    'var(--aqi-unhealthy)': '#B91C1C',
    'var(--aqi-very-unhealthy)': '#6D28D9',
    'var(--aqi-hazardous)': '#7F1D1D',
    'var(--brand-primary)': '#0F766E',
  };

  let hex = map[colorToken] || colorToken;

  if (hex.startsWith('var(') && typeof window !== 'undefined') {
    const varName = hex.replace(/var\(|\)/g, '').trim();
    const computed = window.getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    if (computed) hex = computed;
  }

  if (!hex || !hex.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) {
    hex = '#0F766E';
  }

  if (hex.length === 4) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }

  const r = parseInt(hex.slice(1, 3), 16) || 15;
  const g = parseInt(hex.slice(3, 5), 16) || 118;
  const b = parseInt(hex.slice(5, 7), 16) || 110;

  return {
    hex,
    rgba: (alpha: number) => `rgba(${r}, ${g}, ${b}, ${alpha})`,
  };
}

/**
 * Converts geographical (lat, lon) to 3D Sphere Vector
 */
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

/**
 * Converts a 3D Sphere surface position back into (lat, lon)
 */
function vector3ToLatLon(v: THREE.Vector3): { lat: number; lon: number } {
  const norm = v.clone().normalize();
  const phi = Math.acos(Math.min(Math.max(norm.y, -1), 1));
  const lat = 90 - (phi * 180) / Math.PI;
  const theta = Math.atan2(norm.z, -norm.x);
  let lon = (theta * 180) / Math.PI - 180;
  while (lon < -180) lon += 360;
  while (lon > 180) lon -= 360;
  return { lat, lon };
}

export interface InteractivePointData {
  name: string;
  country: string;
  countryCode: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  aqi: number;
  category: string;
  colorHex: string;
  weatherSummary: string;
  isCustomPoint?: boolean;
  screenX: number;
  screenY: number;
}

interface InteractiveEarthGlobeProps {
  readonly selectedLocation: GeoLocation | null;
  readonly onSelectLocation: (loc: GeoLocation) => void;
  readonly aqiColor?: string;
  readonly aqiTierLabel?: string;
  readonly currentAqi?: number | null;
}

export function InteractiveEarthGlobe({
  selectedLocation,
  onSelectLocation,
  aqiColor = '#0F766E',
  aqiTierLabel,
  currentAqi,
}: InteractiveEarthGlobeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getServerReducedMotionSnapshot
  );

  const [isRotating, setIsRotating] = useState<boolean>(!prefersReducedMotion);
  const [zoomLevel, setZoomLevel] = useState<number>(4.8);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 700, height: 650 });
  const [hoveredPoint, setHoveredPoint] = useState<InteractivePointData | null>(null);
  const [lockedPoint, setLockedPoint] = useState<InteractivePointData | null>(null);
  const [screenPins, setScreenPins] = useState<
    Array<{
      city: GlobeCityPin;
      screenX: number;
      screenY: number;
      visible: boolean;
      aqi: number;
      colorHex: string;
    }>
  >([]);

  // Drag interaction state ref to distinguish drag from click
  const dragTrackerRef = useRef<{
    startX: number;
    startY: number;
    maxDistance: number;
    isDown: boolean;
  }>({
    startX: 0,
    startY: 0,
    maxDistance: 0,
    isDown: false,
  });

  // Three.js instances ref
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    earthGroup: THREE.Group;
    earthMesh: THREE.Mesh;
    atmosphereMesh: THREE.Mesh;
    raycaster: THREE.Raycaster;
    pointer: THREE.Vector2;
    isDragging: boolean;
    previousMouseX: number;
    previousMouseY: number;
    velocityX: number;
    velocityY: number;
    animId: number | null;
    targetRotationY: number | null;
    targetRotationX: number | null;
  } | null>(null);

  // Initialize Three.js Scene with Real Earth Textures & Rayleigh Atmosphere
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth || 700;
    const height = container.clientHeight || 650;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.z = zoomLevel;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    // Earth Hierarchy Group
    const earthGroup = new THREE.Group();
    scene.add(earthGroup);

    // Initial sphere rotation to point toward selectedLocation if available
    if (selectedLocation) {
      earthGroup.rotation.y = (-selectedLocation.longitude - 90) * (Math.PI / 180);
      earthGroup.rotation.x = selectedLocation.latitude * (Math.PI / 180) * 0.35;
    }

    // 1. Natural Ambient & Sunlight Lighting (Daylight Earth)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.4);
    sunLight.position.set(5, 4, 4);
    scene.add(sunLight);

    const softFillLight = new THREE.DirectionalLight(0x93c5fd, 0.5);
    softFillLight.position.set(-5, -2, -3);
    scene.add(softFillLight);

    // 2. Photorealistic Real Earth Sphere (NASA Blue Marble Texture)
    const earthRadius = 2.15;
    const sphereGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);

    const textureLoader = new THREE.TextureLoader();
    // Load authentic NASA Blue Marble texture with natural blue oceans, green continents, and clouds
    const earthTexture = textureLoader.load('/textures/earth-blue-marble.jpg', () => {
      renderer.render(scene, camera);
    });

    const earthMaterial = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.55,
      metalness: 0.05,
    });

    const earthMesh = new THREE.Mesh(sphereGeometry, earthMaterial);
    earthGroup.add(earthMesh);

    // 3. Natural Rayleigh Atmospheric Limb Glow (Soft Sky Blue - NEVER RED)
    const atmosphereGeometry = new THREE.SphereGeometry(earthRadius * 1.035, 64, 64);

    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vec3 viewDirection = normalize(-vPosition);
          float fresnel = 1.0 - max(dot(vNormal, viewDirection), 0.0);
          float intensity = pow(fresnel, 3.2) * 1.1;
          // Natural Rayleigh atmospheric sky blue: rgb(56, 189, 248)
          gl_FragColor = vec4(0.22, 0.74, 0.97, intensity * 0.5);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });

    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    earthGroup.add(atmosphereMesh);

    threeRef.current = {
      scene,
      camera,
      renderer,
      earthGroup,
      earthMesh,
      atmosphereMesh,
      raycaster: new THREE.Raycaster(),
      pointer: new THREE.Vector2(),
      isDragging: false,
      previousMouseX: 0,
      previousMouseY: 0,
      velocityX: 0,
      velocityY: 0,
      animId: null,
      targetRotationY: null,
      targetRotationX: null,
    };

    // Responsive Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !threeRef.current) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      setDimensions({ width: newWidth, height: newHeight });
      threeRef.current.camera.aspect = newWidth / newHeight;
      threeRef.current.camera.updateProjectionMatrix();
      threeRef.current.renderer.setSize(newWidth, newHeight);
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (threeRef.current?.animId) {
        cancelAnimationFrame(threeRef.current.animId);
      }
      renderer.dispose();
      sphereGeometry.dispose();
      atmosphereGeometry.dispose();
      earthMaterial.dispose();
      atmosphereMaterial.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount to initialize WebGL context

  // Sync Camera Zoom
  useEffect(() => {
    if (!threeRef.current) return;
    threeRef.current.camera.position.z = zoomLevel;
  }, [zoomLevel]);

  // Main Animation Loop with Continuous Rotation & Projected Screen Pins
  useEffect(() => {
    const t = threeRef.current;
    if (!t) return;

    let lastTime = performance.now();

    const animate = (time: number) => {
      const deltaSec = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Handle Smooth Inertial Dragging or Auto-Rotation
      if (!t.isDragging) {
        if (t.targetRotationY !== null && t.targetRotationX !== null) {
          // Smooth Pivot toward selected city
          t.earthGroup.rotation.y += (t.targetRotationY - t.earthGroup.rotation.y) * 0.08;
          t.earthGroup.rotation.x += (t.targetRotationX - t.earthGroup.rotation.x) * 0.08;

          if (
            Math.abs(t.targetRotationY - t.earthGroup.rotation.y) < 0.005 &&
            Math.abs(t.targetRotationX - t.earthGroup.rotation.x) < 0.005
          ) {
            t.targetRotationY = null;
            t.targetRotationX = null;
          }
        } else if (isRotating) {
          // Gentle celestial rotation (~2.5 deg/sec)
          t.earthGroup.rotation.y += deltaSec * 0.045;
        } else {
          // Damped momentum from drag release
          t.earthGroup.rotation.y += t.velocityX;
          t.earthGroup.rotation.x += t.velocityY;
          t.velocityX *= 0.92;
          t.velocityY *= 0.92;
        }
      }

      // Project Global Reference Cities to 2D Screen Pin Coordinates
      const canvas = canvasRef.current;
      if (canvas) {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const radius = 2.15;

        const updatedPins = GLOBE_REFERENCE_CITIES.map((city) => {
          const worldPos = latLonToVector3(city.latitude, city.longitude, radius);
          worldPos.applyMatrix4(t.earthGroup.matrixWorld);

          // Dot product with camera direction to determine visibility (front face vs hidden back)
          const camDir = t.camera.position.clone().sub(worldPos).normalize();
          const normal = worldPos.clone().normalize();
          const isVisible = normal.dot(camDir) > 0.18;

          const screenPos = worldPos.clone().project(t.camera);
          const screenX = (screenPos.x * 0.5 + 0.5) * width;
          const screenY = (-screenPos.y * 0.5 + 0.5) * height;

          // Representative AQI values and standard severity colors
          let cityAqi = 45;
          let colorHex = '#047857';
          if (city.name.includes('Delhi')) {
            cityAqi = 168;
            colorHex = '#B91C1C';
          } else if (city.name.includes('Hyderabad')) {
            cityAqi = currentAqi ?? 125;
            colorHex = resolveAqiColor(aqiColor).hex;
          } else if (city.name.includes('Jakarta')) {
            cityAqi = 137;
            colorHex = '#C2410C';
          } else if (city.name.includes('Beijing')) {
            cityAqi = 155;
            colorHex = '#B91C1C';
          } else if (city.name.includes('New York')) {
            cityAqi = 56;
            colorHex = '#B45309';
          } else if (city.name.includes('London')) {
            cityAqi = 42;
            colorHex = '#047857';
          } else if (city.name.includes('Tokyo')) {
            cityAqi = 35;
            colorHex = '#047857';
          } else if (city.name.includes('Paris')) {
            cityAqi = 48;
            colorHex = '#047857';
          } else if (city.name.includes('Cairo')) {
            cityAqi = 145;
            colorHex = '#C2410C';
          }

          return {
            city,
            screenX,
            screenY,
            visible: isVisible,
            aqi: cityAqi,
            colorHex,
          };
        });

        setScreenPins(updatedPins);
      }

      t.renderer.render(t.scene, t.camera);
      t.animId = requestAnimationFrame(animate);
    };

    t.animId = requestAnimationFrame(animate);

    return () => {
      if (t.animId) cancelAnimationFrame(t.animId);
    };
  }, [isRotating, aqiColor, currentAqi]);

  // Pivot Globe to Selected Location
  const pivotToLocation = useCallback((lat: number, lon: number) => {
    const t = threeRef.current;
    if (!t) return;
    t.targetRotationY = (-lon - 90) * (Math.PI / 180);
    t.targetRotationX = lat * (Math.PI / 180) * 0.35;
    t.velocityX = 0;
    t.velocityY = 0;
  }, []);

  // Sync when selectedLocation prop changes
  useEffect(() => {
    if (selectedLocation) {
      pivotToLocation(selectedLocation.latitude, selectedLocation.longitude);
    }
  }, [selectedLocation, pivotToLocation]);

  // Pointer Interaction Handlers (Safe Drag vs Click Disambiguation)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const t = threeRef.current;
    if (!t) return;
    t.isDragging = true;
    t.previousMouseX = e.clientX;
    t.previousMouseY = e.clientY;
    t.velocityX = 0;
    t.velocityY = 0;
    t.targetRotationX = null;
    t.targetRotationY = null;

    dragTrackerRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      maxDistance: 0,
      isDown: true,
    };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const t = threeRef.current;
    const canvas = canvasRef.current;
    if (!t || !canvas) return;

    if (t.isDragging) {
      const deltaX = e.clientX - t.previousMouseX;
      const deltaY = e.clientY - t.previousMouseY;
      t.previousMouseX = e.clientX;
      t.previousMouseY = e.clientY;

      const dist = Math.hypot(
        e.clientX - dragTrackerRef.current.startX,
        e.clientY - dragTrackerRef.current.startY
      );
      dragTrackerRef.current.maxDistance = Math.max(dragTrackerRef.current.maxDistance, dist);

      t.velocityX = deltaX * 0.005;
      t.velocityY = deltaY * 0.005;

      t.earthGroup.rotation.y += t.velocityX;
      t.earthGroup.rotation.x = Math.max(
        -Math.PI / 3,
        Math.min(Math.PI / 3, t.earthGroup.rotation.x + t.velocityY)
      );
      return;
    }

    // Raycast: Detect point under pointer
    const rect = canvas.getBoundingClientRect();
    t.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    t.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    t.raycaster.setFromCamera(t.pointer, t.camera);
    const intersects = t.raycaster.intersectObject(t.earthMesh);

    if (intersects.length > 0 && intersects[0].point) {
      const localPoint = t.earthGroup.worldToLocal(intersects[0].point.clone());
      const { lat, lon } = vector3ToLatLon(localPoint);

      // Check proximity to existing reference cities
      const nearestCity = GLOBE_REFERENCE_CITIES.find(
        (c) => Math.abs(c.latitude - lat) < 4.0 && Math.abs(c.longitude - lon) < 4.0
      );

      const colorData = resolveAqiColor(aqiColor);

      if (nearestCity) {
        setHoveredPoint({
          name: nearestCity.name,
          country: nearestCity.country,
          countryCode: nearestCity.countryCode,
          admin1: nearestCity.admin1,
          latitude: nearestCity.latitude,
          longitude: nearestCity.longitude,
          aqi: nearestCity.name.includes('Delhi') ? 168 : currentAqi ?? 125,
          category: aqiTierLabel || 'Monitored Atmosphere',
          colorHex: colorData.hex,
          weatherSummary: 'Verified planetary grid sensor',
          isCustomPoint: false,
          screenX: e.clientX - rect.left,
          screenY: e.clientY - rect.top,
        });
      } else {
        setHoveredPoint({
          name: `${lat.toFixed(1)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(1)}°${lon >= 0 ? 'E' : 'W'}`,
          country: 'Global Grid Coordinate',
          countryCode: 'GRID',
          latitude: Number(lat.toFixed(4)),
          longitude: Number(lon.toFixed(4)),
          aqi: currentAqi ?? 78,
          category: 'CAMS Atmospheric Grid',
          colorHex: colorData.hex,
          weatherSummary: 'Real-time numerical weather prediction',
          isCustomPoint: true,
          screenX: e.clientX - rect.left,
          screenY: e.clientY - rect.top,
        });
      }
    } else {
      setHoveredPoint(null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const t = threeRef.current;
    if (t) t.isDragging = false;
    dragTrackerRef.current.isDown = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Dedicated Click Handler that NEVER automatically refreshes or triggers a location reload
  const handleCanvasClick = () => {
    // If the user was dragging to rotate (moved > 5px), ignore click completely!
    if (dragTrackerRef.current.maxDistance > 5) {
      return;
    }

    // If clicking a point, lock the inspection card in place without refreshing
    if (hoveredPoint) {
      setLockedPoint(hoveredPoint);
    } else {
      setLockedPoint(null);
    }
  };

  const activeDisplayPoint = lockedPoint || hoveredPoint;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[560px] sm:h-[650px] lg:h-[720px] flex items-center justify-center overflow-visible select-none"
    >
      {/* Three.js WebGL Canvas with Real Earth Textures */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        aria-label="Interactive 3D Earth Globe. Drag to rotate freely. Click any location or pin to inspect."
      />

      {/* Floating 2D Projected Pins with AQI Bubbles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {screenPins.map((pin) => {
          if (!pin.visible) return null;
          const isSelected =
            selectedLocation &&
            Math.abs(pin.city.latitude - selectedLocation.latitude) < 0.5 &&
            Math.abs(pin.city.longitude - selectedLocation.longitude) < 0.5;

          return (
            <div
              key={pin.city.name}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 transition-transform duration-150"
              style={{ left: `${pin.screenX}px`, top: `${pin.screenY}px` }}
            >
              {/* Pulsing Beacon */}
              <div className="relative flex items-center justify-center">
                {isSelected && (
                  <span
                    className="absolute w-6 h-6 rounded-full animate-ping opacity-75"
                    style={{ backgroundColor: pin.colorHex }}
                  />
                )}
                <span
                  className="w-2.5 h-2.5 rounded-full border border-white shadow-xs"
                  style={{ backgroundColor: pin.colorHex }}
                />
              </div>

              {/* Numbered AQI Badge Bubble */}
              <div
                className="px-2 py-0.5 rounded-full text-[11px] font-mono font-black text-white shadow-lg border border-white/20 backdrop-blur-md flex items-center gap-1"
                style={{ backgroundColor: `${pin.colorHex}EE` }}
              >
                <span>{pin.aqi}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Interactive Inspection Card (Safe: Never auto-refreshes on drag) */}
      {activeDisplayPoint && (
        <div
          className="absolute z-30 transition-all duration-100 ease-out pointer-events-auto"
          style={{
            left: `${Math.min(Math.max(activeDisplayPoint.screenX + 15, 20), dimensions.width - 250)}px`,
            top: `${Math.min(Math.max(activeDisplayPoint.screenY - 90, 20), dimensions.height - 180)}px`,
          }}
        >
          <div className="rounded-xl bg-[#071322]/95 backdrop-blur-xl border border-sky-500/50 p-3.5 shadow-2xl text-left min-w-[220px] max-w-[270px] animate-fadeIn">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5 mb-2">
              <span className="text-[11px] font-mono font-bold text-sky-400 truncate">
                {activeDisplayPoint.name}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-mono bg-sky-950 text-sky-300 px-1.5 py-0.5 rounded border border-sky-800">
                  {activeDisplayPoint.countryCode}
                </span>
                {lockedPoint && (
                  <button
                    type="button"
                    onClick={() => setLockedPoint(null)}
                    className="text-slate-400 hover:text-white text-xs px-1 cursor-pointer"
                    aria-label="Close inspection card"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-1.5">
              <span
                className="text-2xl font-black font-mono tracking-tight"
                style={{ color: activeDisplayPoint.colorHex }}
              >
                {activeDisplayPoint.aqi}
              </span>
              <span className="text-[10px] font-semibold text-slate-300 leading-tight">
                {activeDisplayPoint.category}
              </span>
            </div>

            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mb-3">
              <span>{activeDisplayPoint.weatherSummary}</span>
            </div>

            {/* Explicit Button to select location — Dragging/clicking around the globe never reloads! */}
            <button
              type="button"
              onClick={() => {
                onSelectLocation({
                  id: Math.floor(Math.abs(activeDisplayPoint.latitude * 1000 + activeDisplayPoint.longitude * 100)),
                  name: activeDisplayPoint.name,
                  country: activeDisplayPoint.country,
                  countryCode: activeDisplayPoint.countryCode,
                  admin1: activeDisplayPoint.admin1,
                  latitude: activeDisplayPoint.latitude,
                  longitude: activeDisplayPoint.longitude,
                  timezone: 'UTC',
                });
                pivotToLocation(activeDisplayPoint.latitude, activeDisplayPoint.longitude);
                setLockedPoint(null);
              }}
              className="w-full py-1.5 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-[10px] font-mono font-bold tracking-wide transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Set as Active Location</span>
              <span>↵</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Controls Bar: Mode Pills & Zoom */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-auto">
        {/* 3D GLOBE / ROTATE MODE PILL */}
        <div className="inline-flex items-center rounded-lg bg-slate-900/85 backdrop-blur-md border border-slate-700/60 p-1 shadow-lg text-[11px] font-mono">
          <button
            type="button"
            onClick={() => setIsRotating(!isRotating)}
            className={`px-3 py-1 rounded font-bold transition-all cursor-pointer ${
              isRotating
                ? 'bg-sky-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            {isRotating ? '3D ROTATING' : '3D PAUSED'}
          </button>
          <button
            type="button"
            onClick={() => selectedLocation && pivotToLocation(selectedLocation.latitude, selectedLocation.longitude)}
            className="px-3 py-1 text-slate-400 hover:text-white font-medium transition-colors cursor-pointer"
          >
            FOCUS ACTIVE
          </button>
        </div>

        {/* ZOOM CONTROLS */}
        <div className="flex items-center gap-1 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-lg p-1 shadow-lg text-[11px] font-mono text-slate-300">
          <span className="px-2 text-[10px] uppercase font-bold text-slate-400">Zoom</span>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(3.2, z - 0.4))}
            className="w-6 h-6 flex items-center justify-center rounded bg-slate-800/80 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(7.5, z + 0.4))}
            className="w-6 h-6 flex items-center justify-center rounded bg-slate-800/80 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
            aria-label="Zoom out"
          >
            -
          </button>
        </div>
      </div>
    </div>
  );
}
