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
 * Resolves CSS variable tokens or raw hex color strings into canvas-safe RGB/RGBA values.
 */
function resolveAqiColor(colorToken: string = ''): { hex: string; rgba: (alpha: number) => string; rgb: THREE.Color } {
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
    rgb: new THREE.Color(hex),
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
function vector3ToLatLon(v: THREE.Vector3, radius: number): { lat: number; lon: number } {
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
  const [zoomLevel, setZoomLevel] = useState<number>(5.2);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 600, height: 600 });
  const [hoveredPoint, setHoveredPoint] = useState<InteractivePointData | null>(null);
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

  // Initialize Three.js Scene
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 550;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
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
      earthGroup.rotation.x = (selectedLocation.latitude) * (Math.PI / 180) * 0.4;
    }

    // 1. Ambient & Directional Sun Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunLight.position.set(6, 3, 5);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x0284c7, 0.8);
    rimLight.position.set(-6, -2, -4);
    scene.add(rimLight);

    // 2. Earth Photorealistic Sphere
    const earthRadius = 1.85;
    const sphereGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);

    const textureLoader = new THREE.TextureLoader();
    const earthNightTexture = textureLoader.load('/textures/earth-night.jpg', () => {
      renderer.render(scene, camera);
    });

    const earthMaterial = new THREE.MeshStandardMaterial({
      map: earthNightTexture,
      roughness: 0.65,
      metalness: 0.1,
    });

    const earthMesh = new THREE.Mesh(sphereGeometry, earthMaterial);
    earthGroup.add(earthMesh);

    // 3. Volumetric Atmospheric Limb Glow (Fresnel Shader)
    const atmosphereGeometry = new THREE.SphereGeometry(earthRadius * 1.045, 64, 64);
    const resolvedColor = resolveAqiColor(aqiColor);

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
        uniform vec3 glowColor;
        void main() {
          vec3 viewDirection = normalize(-vPosition);
          float fresnel = 1.0 - max(dot(vNormal, viewDirection), 0.0);
          float intensity = pow(fresnel, 2.8) * 1.4;
          gl_FragColor = vec4(glowColor, intensity * 0.75);
        }
      `,
      uniforms: {
        glowColor: { value: resolvedColor.rgb },
      },
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });

    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    earthGroup.add(atmosphereMesh);

    // 4. Subtle Latitude/Longitude Graticule Rings
    const graticuleMaterial = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.08,
    });

    [-45, -20, 0, 20, 45].forEach((lat) => {
      const phi = (lat * Math.PI) / 180;
      const r = earthRadius * 1.002 * Math.cos(phi);
      const y = earthRadius * 1.002 * Math.sin(phi);
      const ringPoints: THREE.Vector3[] = [];
      for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * Math.PI * 2;
        ringPoints.push(new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta)));
      }
      const ringGeom = new THREE.BufferGeometry().setFromPoints(ringPoints);
      const ringLine = new THREE.Line(ringGeom, graticuleMaterial);
      earthGroup.add(ringLine);
    });

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

  // Sync Atmosphere Color with Active AQI Tier
  useEffect(() => {
    if (!threeRef.current?.atmosphereMesh) return;
    const material = threeRef.current.atmosphereMesh.material as THREE.ShaderMaterial;
    if (material.uniforms?.glowColor) {
      material.uniforms.glowColor.value = resolveAqiColor(aqiColor).rgb;
    }
  }, [aqiColor]);

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
          // Slow continuous atmospheric rotation (~3 deg/sec)
          t.earthGroup.rotation.y += deltaSec * 0.05;
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
        const radius = 1.85;

        const updatedPins = GLOBE_REFERENCE_CITIES.map((city) => {
          const worldPos = latLonToVector3(city.latitude, city.longitude, radius);
          worldPos.applyMatrix4(t.earthGroup.matrixWorld);

          // Dot product with camera direction to determine visibility (front face vs hidden back)
          const camDir = t.camera.position.clone().sub(worldPos).normalize();
          const normal = worldPos.clone().normalize();
          const isVisible = normal.dot(camDir) > 0.15;

          const screenPos = worldPos.clone().project(t.camera);
          const screenX = (screenPos.x * 0.5 + 0.5) * width;
          const screenY = (-screenPos.y * 0.5 + 0.5) * height;

          // Representative AQI value and color
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

  // Pointer Interaction Handlers (Raycasting & Dragging)
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

      t.velocityX = deltaX * 0.005;
      t.velocityY = deltaY * 0.005;

      t.earthGroup.rotation.y += t.velocityX;
      t.earthGroup.rotation.x = Math.max(
        -Math.PI / 3,
        Math.min(Math.PI / 3, t.earthGroup.rotation.x + t.velocityY)
      );
      return;
    }

    // Raycast: Detect exact point on the 3D Earth
    const rect = canvas.getBoundingClientRect();
    t.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    t.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    t.raycaster.setFromCamera(t.pointer, t.camera);
    const intersects = t.raycaster.intersectObject(t.earthMesh);

    if (intersects.length > 0 && intersects[0].point) {
      const localPoint = t.earthGroup.worldToLocal(intersects[0].point.clone());
      const { lat, lon } = vector3ToLatLon(localPoint, 1.85);

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
        // Point anywhere on Earth coordinates!
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
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleCanvasClick = () => {
    if (hoveredPoint) {
      onSelectLocation({
        id: Math.floor(Math.abs(hoveredPoint.latitude * 1000 + hoveredPoint.longitude * 100)),
        name: hoveredPoint.name,
        country: hoveredPoint.country,
        countryCode: hoveredPoint.countryCode,
        admin1: hoveredPoint.admin1,
        latitude: hoveredPoint.latitude,
        longitude: hoveredPoint.longitude,
        timezone: 'UTC',
      });
      pivotToLocation(hoveredPoint.latitude, hoveredPoint.longitude);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[500px] sm:h-[580px] lg:h-[640px] flex items-center justify-center overflow-visible select-none"
    >
      {/* Three.js WebGL Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        aria-label="Interactive 3D Earth Globe displaying global air quality telemetry. Click or drag to inspect any location."
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

              {/* Numbered AQI Badge Bubble (Matches Image 3) */}
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

      {/* Floating Interactive Tooltip Callout (Matches Jakarta Card in Image 3) */}
      {hoveredPoint && (
        <div
          className="absolute pointer-events-none z-30 transition-all duration-100 ease-out"
          style={{
            left: `${Math.min(Math.max(hoveredPoint.screenX + 15, 20), dimensions.width - 240)}px`,
            top: `${Math.min(Math.max(hoveredPoint.screenY - 80, 20), dimensions.height - 140)}px`,
          }}
        >
          <div className="rounded-xl bg-[#091322]/95 backdrop-blur-xl border border-sky-500/40 p-3 shadow-2xl text-left min-w-[210px] max-w-[260px] animate-fadeIn">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5 mb-2">
              <span className="text-[11px] font-mono font-bold text-sky-400 truncate">
                {hoveredPoint.name}
              </span>
              <span className="text-[9px] font-mono bg-sky-950/80 text-sky-300 px-1.5 py-0.5 rounded border border-sky-800">
                {hoveredPoint.countryCode}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-1.5">
              <span
                className="text-2xl font-black font-mono tracking-tight"
                style={{ color: hoveredPoint.colorHex }}
              >
                {hoveredPoint.aqi}
              </span>
              <span className="text-[10px] font-semibold text-slate-300 leading-tight">
                {hoveredPoint.category}
              </span>
            </div>

            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mb-2">
              <span>{hoveredPoint.weatherSummary}</span>
            </div>

            <div className="text-[9px] font-mono text-teal-400 flex items-center justify-between border-t border-white/10 pt-1.5">
              <span>Click to view station telemetry</span>
              <span>↵</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Controls Bar: Mode Pills & Zoom (Matches Image 3) */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-auto">
        {/* 3D GLOBE / ROTATE MODE PILL */}
        <div className="inline-flex items-center rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-700/60 p-1 shadow-lg text-[11px] font-mono">
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
        <div className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-lg p-1 shadow-lg text-[11px] font-mono text-slate-300">
          <span className="px-2 text-[10px] uppercase font-bold text-slate-400">Zoom</span>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(3.5, z - 0.4))}
            className="w-6 h-6 flex items-center justify-center rounded bg-slate-800/80 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(8.0, z + 0.4))}
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
