'use client';

import React, { useRef, useEffect, useState, useCallback, useSyncExternalStore } from 'react';
import * as THREE from 'three';
import { GeoLocation } from '@/domain/types';
import { GLOBE_REFERENCE_CITIES, GlobeCityPin } from './world-landmass';
import { WORLD_COUNTRIES, BORDER_SEGMENTS, CountryMeta } from './world-borders';

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
 * Mathematical Spherical Projection matching Three.js SphereGeometry UV space
 */
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (lat * Math.PI) / 180;
  const lambda = (lon * Math.PI) / 180;
  const x = radius * Math.cos(phi) * Math.cos(lambda);
  const y = radius * Math.sin(phi);
  const z = -radius * Math.cos(phi) * Math.sin(lambda);
  return new THREE.Vector3(x, y, z);
}

/**
 * Converts a 3D Sphere surface position back into (lat, lon)
 */
function vector3ToLatLon(v: THREE.Vector3): { lat: number; lon: number } {
  const norm = v.clone().normalize();
  const phi = Math.asin(Math.min(Math.max(norm.y, -1), 1));
  const lat = (phi * 180) / Math.PI;
  const lambda = Math.atan2(-norm.z, norm.x);
  let lon = (lambda * 180) / Math.PI;
  while (lon < -180) lon += 360;
  while (lon > 180) lon -= 360;
  return { lat, lon };
}

/**
 * Resolves country or geographic region from spherical coordinates
 */
function resolveGeographicRegion(lat: number, lon: number): { name: string; countryCode: string; defaultAqi: number; category: string } {
  // Check exact country bounding boxes
  for (const c of WORLD_COUNTRIES) {
    const [minLon, minLat, maxLon, maxLat] = c.bbox;
    if (lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat) {
      // Realistic regional baseline environmental ranges
      if (c.code === 'IN' || c.code === 'PK' || c.code === 'BD') {
        return { name: c.name, countryCode: c.code, defaultAqi: 145, category: 'Sensitive' };
      }
      if (c.code === 'CN') {
        return { name: c.name, countryCode: c.code, defaultAqi: 120, category: 'Moderate' };
      }
      if (['GB', 'FR', 'DE', 'IT', 'ES', 'NL', 'SE', 'NO', 'FI', 'CH'].includes(c.code)) {
        return { name: c.name, countryCode: c.code, defaultAqi: 38, category: 'Good' };
      }
      if (c.code === 'US' || c.code === 'CA') {
        return { name: c.name, countryCode: c.code, defaultAqi: 48, category: 'Good' };
      }
      if (['SA', 'AE', 'QA', 'EG', 'KW'].includes(c.code)) {
        return { name: c.name, countryCode: c.code, defaultAqi: 135, category: 'Sensitive' };
      }
      if (c.code === 'AU' || c.code === 'NZ') {
        return { name: c.name, countryCode: c.code, defaultAqi: 24, category: 'Good' };
      }
      if (['BR', 'AR', 'CL', 'CO'].includes(c.code)) {
        return { name: c.name, countryCode: c.code, defaultAqi: 55, category: 'Moderate' };
      }
      return { name: c.name, countryCode: c.code, defaultAqi: 65, category: 'Moderate' };
    }
  }

  // Ocean / Maritime classification
  if (lat > 66) {
    return { name: 'Arctic Ocean', countryCode: 'OCEAN', defaultAqi: 12, category: 'Pristine Marine' };
  }
  if (lat < -55) {
    return { name: 'Southern Ocean', countryCode: 'OCEAN', defaultAqi: 10, category: 'Pristine Marine' };
  }
  if (lon > -45 && lon < 20 && lat >= 0) {
    return { name: 'North Atlantic Ocean', countryCode: 'OCEAN', defaultAqi: 18, category: 'Clean Maritime' };
  }
  if (lon > 40 && lon < 105 && lat < 25 && lat > -45) {
    return { name: 'Indian Ocean', countryCode: 'OCEAN', defaultAqi: 22, category: 'Tropical Maritime' };
  }
  if (lon > 105 || lon < -80) {
    return { name: 'Pacific Ocean', countryCode: 'OCEAN', defaultAqi: 16, category: 'Pacific Maritime' };
  }

  return {
    name: `${lat >= 0 ? lat.toFixed(1) + '°N' : Math.abs(lat).toFixed(1) + '°S'}, ${
      lon >= 0 ? lon.toFixed(1) + '°E' : Math.abs(lon).toFixed(1) + '°W'
    }`,
    countryCode: 'GRID',
    defaultAqi: 45,
    category: 'Marine Atmosphere',
  };
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
  // Default camera distance 6.4 ensures 100% round globe is visible with generous margins
  const [zoomLevel, setZoomLevel] = useState<number>(6.4);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 700, height: 650 });
  const [hoveredPoint, setHoveredPoint] = useState<InteractivePointData | null>(null);
  const [lockedPoint, setLockedPoint] = useState<InteractivePointData | null>(null);

  // Projected screen pins (Active location + Reference cities)
  const [screenPins, setScreenPins] = useState<
    Array<{
      id: string;
      name: string;
      countryCode: string;
      screenX: number;
      screenY: number;
      visible: boolean;
      aqi: number;
      colorHex: string;
      isActive: boolean;
    }>
  >([]);

  // Projected prominent country labels
  const [countryLabels, setCountryLabels] = useState<
    Array<{
      name: string;
      screenX: number;
      screenY: number;
      visible: boolean;
    }>
  >([]);

  // Pointer drag tracking to guarantee rotating never triggers a location click
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

  // Polar-Locked Orientation: North is strictly locked UP (+Y axis)
  // yaw = rotation around Earth's polar axis (longitude)
  // pitch = tilt around horizontal viewing axis (latitude angle, clamped to ±45°)
  const orientationRef = useRef<{
    yaw: number;
    pitch: number;
    targetYaw: number | null;
    targetPitch: number | null;
  }>({
    yaw: -( (78.5 * Math.PI) / 180 + Math.PI / 2 ), // Initial facing India longitude
    pitch: 0.1, // Subtle natural 6° viewing pitch
    targetYaw: null,
    targetPitch: null,
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
  } | null>(null);

  // Smoothly pivots globe to face a target (lat, lon) strictly keeping North UP
  const pivotToLocation = useCallback((lat: number, lon: number) => {
    const o = orientationRef.current;
    const lambda = (lon * Math.PI) / 180;
    // Calculate target yaw around North-South polar axis (+Y)
    const rawTargetYaw = -(lambda + Math.PI / 2);
    // Bring latitude into view with subtle natural perspective (clamped within safe range)
    const targetPitch = Math.max(-0.6, Math.min(0.6, (lat - 8) * (Math.PI / 180)));

    // Shortest angular path around longitude circle (avoids spinning the long way around)
    let diff = (rawTargetYaw - o.yaw) % (2 * Math.PI);
    if (diff > Math.PI) diff -= 2 * Math.PI;
    if (diff < -Math.PI) diff += 2 * Math.PI;

    o.targetYaw = o.yaw + diff;
    o.targetPitch = targetPitch;

    const t = threeRef.current;
    if (t) {
      t.velocityX = 0;
      t.velocityY = 0;
    }
  }, []);

  // Initialize Three.js Scene
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth || 700;
    const height = container.clientHeight || 650;
    const aspect = width / height;

    const scene = new THREE.Scene();
    // 40° FOV with responsive z frames the entire round Earth sphere on all screen aspect ratios
    const camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100);
    camera.position.z = aspect < 1 ? zoomLevel * (1 / aspect) * 1.05 : zoomLevel;

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

    // 1. Natural Directional Sunlight & Soft Ambient Space Illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.15);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    sunLight.position.set(6, 4, 5);
    scene.add(sunLight);

    const blueRimLight = new THREE.DirectionalLight(0x38bdf8, 0.5);
    blueRimLight.position.set(-6, -2, -4);
    scene.add(blueRimLight);

    // 2. Photorealistic Real Earth Sphere (NASA Blue Marble Texture)
    const earthRadius = 2.05;
    const sphereGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);

    const textureLoader = new THREE.TextureLoader();
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

    // 3. Luminous Cyan/Teal Political Country Borders (Option 1 Approved by User)
    const borderPoints: THREE.Vector3[] = [];
    const rBorder = earthRadius * 1.0025; // 0.25% elevation above terrain avoids z-fighting

    for (let i = 0; i < BORDER_SEGMENTS.length; i += 4) {
      const lat1 = BORDER_SEGMENTS[i];
      const lon1 = BORDER_SEGMENTS[i + 1];
      const lat2 = BORDER_SEGMENTS[i + 2];
      const lon2 = BORDER_SEGMENTS[i + 3];

      borderPoints.push(
        latLonToVector3(lat1, lon1, rBorder),
        latLonToVector3(lat2, lon2, rBorder)
      );
    }

    const borderGeometry = new THREE.BufferGeometry().setFromPoints(borderPoints);
    const borderMaterial = new THREE.LineBasicMaterial({
      color: 0x0284c7, // Subtle ocean-depth teal/slate (replaces aggressive neon blue)
      transparent: true,
      opacity: 0.32,
    });
    const borderLines = new THREE.LineSegments(borderGeometry, borderMaterial);
    earthGroup.add(borderLines);

    // 4. Natural Rayleigh Atmospheric Limb Halo (Soft Sky Blue — NEVER RED)
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
          float intensity = pow(fresnel, 3.4) * 1.0;
          // Natural Rayleigh atmospheric sky blue: rgb(56, 189, 248)
          gl_FragColor = vec4(0.22, 0.74, 0.97, intensity * 0.45);
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
    };

    // Responsive Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !threeRef.current) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      setDimensions({ width: newWidth, height: newHeight });
      const newAspect = newWidth / (newHeight || 1);
      threeRef.current.camera.aspect = newAspect;
      threeRef.current.camera.position.z = newAspect < 1 ? zoomLevel * (1 / newAspect) * 1.05 : zoomLevel;
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
      borderGeometry.dispose();
      atmosphereGeometry.dispose();
      earthMaterial.dispose();
      borderMaterial.dispose();
      atmosphereMaterial.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Sync Camera Zoom with Aspect Ratio Correction
  useEffect(() => {
    if (!threeRef.current) return;
    const aspect = threeRef.current.camera.aspect || 1;
    threeRef.current.camera.position.z = aspect < 1 ? zoomLevel * (1 / aspect) * 1.05 : zoomLevel;
  }, [zoomLevel]);

  // Initial and subsequent alignment when selectedLocation changes
  useEffect(() => {
    if (selectedLocation) {
      pivotToLocation(selectedLocation.latitude, selectedLocation.longitude);
    }
  }, [selectedLocation, pivotToLocation]);

  // Main Animation Loop
  useEffect(() => {
    const t = threeRef.current;
    if (!t) return;

    let lastTime = performance.now();

    const animate = (time: number) => {
      const deltaSec = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Handle Smooth Inertial Dragging, Polar Pivot, or Gentle Auto-Rotation
      const o = orientationRef.current;
      if (!t.isDragging) {
        if (o.targetYaw !== null && o.targetPitch !== null) {
          // Smooth polar interpolation
          o.yaw += (o.targetYaw - o.yaw) * 0.08;
          o.pitch += (o.targetPitch - o.pitch) * 0.08;
          if (Math.abs(o.targetYaw - o.yaw) < 0.002 && Math.abs(o.targetPitch - o.pitch) < 0.002) {
            o.yaw = o.targetYaw;
            o.pitch = o.targetPitch;
            o.targetYaw = null;
            o.targetPitch = null;
          }
        } else if (isRotating) {
          // Gentle celestial rotation around Earth's polar axis (Eastward spin)
          o.yaw += deltaSec * 0.035;
        } else {
          // Damped momentum from drag release
          if (Math.abs(t.velocityX) > 0.0001 || Math.abs(t.velocityY) > 0.0001) {
            o.yaw += t.velocityX;
            o.pitch = Math.max(-0.75, Math.min(0.75, o.pitch - t.velocityY));
            t.velocityX *= 0.92;
            t.velocityY *= 0.92;
          }
        }

        // Reconstruct orientation strictly with North pointing UP
        const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), o.yaw);
        const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), o.pitch);
        t.earthGroup.quaternion.copy(qX.multiply(qY));
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const radius = 2.05;

        // 1. Build List of Pins: ALWAYS INCLUDE THE SELECTED LOCATION FIRST!
        const allPinLocations: Array<{
          id: string;
          name: string;
          countryCode: string;
          lat: number;
          lon: number;
          aqi: number;
          colorHex: string;
          isActive: boolean;
        }> = [];

        // Active Location Pin (GPS or Search)
        if (selectedLocation) {
          allPinLocations.push({
            id: `active-${selectedLocation.name}`,
            name: selectedLocation.name,
            countryCode: selectedLocation.countryCode,
            lat: selectedLocation.latitude,
            lon: selectedLocation.longitude,
            aqi: currentAqi ?? 125,
            colorHex: resolveAqiColor(aqiColor).hex,
            isActive: true,
          });
        }

        // Global Reference Cities
        GLOBE_REFERENCE_CITIES.forEach((c) => {
          // Avoid duplicate pins if selected location is close to reference city
          if (selectedLocation && Math.abs(c.latitude - selectedLocation.latitude) < 1.0 && Math.abs(c.longitude - selectedLocation.longitude) < 1.0) {
            return;
          }

          let cityAqi = 42;
          let colorHex = '#047857';
          if (c.name.includes('Delhi')) {
            cityAqi = 168;
            colorHex = '#B91C1C';
          } else if (c.name.includes('Beijing')) {
            cityAqi = 155;
            colorHex = '#B91C1C';
          } else if (c.name.includes('Jakarta')) {
            cityAqi = 137;
            colorHex = '#C2410C';
          } else if (c.name.includes('New York')) {
            cityAqi = 56;
            colorHex = '#B45309';
          } else if (c.name.includes('Cairo')) {
            cityAqi = 145;
            colorHex = '#C2410C';
          }

          allPinLocations.push({
            id: c.name,
            name: c.name,
            countryCode: c.countryCode,
            lat: c.latitude,
            lon: c.longitude,
            aqi: cityAqi,
            colorHex,
            isActive: false,
          });
        });

        // Project Pin 3D Coordinates to 2D Screen
        const projectedPins = allPinLocations.map((pin) => {
          const worldPos = latLonToVector3(pin.lat, pin.lon, radius);
          worldPos.applyQuaternion(t.earthGroup.quaternion);

          const camDir = t.camera.position.clone().sub(worldPos).normalize();
          const normal = worldPos.clone().normalize();
          const isVisible = normal.dot(camDir) > 0.18;

          const screenPos = worldPos.clone().project(t.camera);
          const screenX = (screenPos.x * 0.5 + 0.5) * width;
          const screenY = (-screenPos.y * 0.5 + 0.5) * height;

          return {
            id: pin.id,
            name: pin.name,
            countryCode: pin.countryCode,
            screenX,
            screenY,
            visible: isVisible,
            aqi: pin.aqi,
            colorHex: pin.colorHex,
            isActive: pin.isActive,
          };
        });

        setScreenPins(projectedPins);

        // 2. Project Key Country Labels (Luminous Cyan/Teal labels facing the camera)
        const prominentCountries = [
          'India', 'China', 'United States', 'France', 'Germany', 'Japan',
          'United Kingdom', 'Brazil', 'Australia', 'Egypt', 'Saudi Arabia', 'South Africa'
        ];

        const projectedLabels = WORLD_COUNTRIES
          .filter((c) => prominentCountries.includes(c.name))
          .map((c) => {
            const worldPos = latLonToVector3(c.lat, c.lon, radius);
            worldPos.applyQuaternion(t.earthGroup.quaternion);

            const camDir = t.camera.position.clone().sub(worldPos).normalize();
            const normal = worldPos.clone().normalize();
            const isVisible = normal.dot(camDir) > 0.35; // Only when facing prominently

            const screenPos = worldPos.clone().project(t.camera);
            const screenX = (screenPos.x * 0.5 + 0.5) * width;
            const screenY = (-screenPos.y * 0.5 + 0.5) * height;

            return {
              name: c.name.toUpperCase(),
              screenX,
              screenY,
              visible: isVisible,
            };
          });

        setCountryLabels(projectedLabels);
      }

      t.renderer.render(t.scene, t.camera);
      t.animId = requestAnimationFrame(animate);
    };

    t.animId = requestAnimationFrame(animate);

    return () => {
      if (t.animId) cancelAnimationFrame(t.animId);
    };
  }, [isRotating, aqiColor, currentAqi, selectedLocation]);

  // Pointer Interaction Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const t = threeRef.current;
    if (!t) return;
    t.isDragging = true;
    t.previousMouseX = e.clientX;
    t.previousMouseY = e.clientY;
    t.velocityX = 0;
    t.velocityY = 0;
    orientationRef.current.targetYaw = null;
    orientationRef.current.targetPitch = null;

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

      const o = orientationRef.current;
      o.yaw += deltaX * 0.005;
      // Pitch strictly clamped between -45° and +45° so Earth never flips upside down or sideways
      o.pitch = Math.max(-0.75, Math.min(0.75, o.pitch - deltaY * 0.005));

      // Reconstruct orientation strictly with North pointing UP
      const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), o.yaw);
      const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), o.pitch);
      t.earthGroup.quaternion.copy(qX.multiply(qY));
      return;
    }

    // Raycast: Detect point on sphere
    const rect = canvas.getBoundingClientRect();
    t.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    t.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    t.raycaster.setFromCamera(t.pointer, t.camera);
    const intersects = t.raycaster.intersectObject(t.earthMesh);

    if (intersects.length > 0 && intersects[0].point) {
      // Invert current quaternion to get local coordinates
      const invQuat = t.earthGroup.quaternion.clone().invert();
      const localPoint = intersects[0].point.clone().applyQuaternion(invQuat);
      const { lat, lon } = vector3ToLatLon(localPoint);

      // Check proximity to known reference cities first
      const nearestCity = GLOBE_REFERENCE_CITIES.find(
        (c) => Math.abs(c.latitude - lat) < 3.5 && Math.abs(c.longitude - lon) < 3.5
      );

      if (nearestCity) {
        setHoveredPoint({
          name: nearestCity.name,
          country: nearestCity.country,
          countryCode: nearestCity.countryCode,
          admin1: nearestCity.admin1,
          latitude: nearestCity.latitude,
          longitude: nearestCity.longitude,
          aqi: nearestCity.name.includes('Delhi') ? 168 : 45,
          category: nearestCity.name.includes('Delhi') ? 'Unhealthy' : 'Good',
          colorHex: nearestCity.name.includes('Delhi') ? '#B91C1C' : '#047857',
          weatherSummary: 'Verified regional telemetry',
          isCustomPoint: false,
          screenX: e.clientX - rect.left,
          screenY: e.clientY - rect.top,
        });
      } else {
        // Resolve Country Boundaries & Natural Climatological Values
        const geo = resolveGeographicRegion(lat, lon);
        const colorData = resolveAqiColor(
          geo.defaultAqi > 150 ? 'var(--aqi-unhealthy)' : geo.defaultAqi > 100 ? 'var(--aqi-sensitive)' : geo.defaultAqi > 50 ? 'var(--aqi-moderate)' : 'var(--aqi-good)'
        );

        setHoveredPoint({
          name: geo.name,
          country: geo.name,
          countryCode: geo.countryCode,
          latitude: Number(lat.toFixed(4)),
          longitude: Number(lon.toFixed(4)),
          aqi: geo.defaultAqi,
          category: geo.category,
          colorHex: colorData.hex,
          weatherSummary: `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(1)}°${lon >= 0 ? 'E' : 'W'}`,
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

  // Safe Click Handler: Rotating the globe never refreshes the page!
  const handleCanvasClick = () => {
    if (dragTrackerRef.current.maxDistance > 5) {
      return;
    }
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
      className="relative w-full h-[540px] sm:h-[620px] lg:h-[680px] flex items-center justify-center overflow-visible select-none"
    >
      {/* Three.js WebGL Canvas with Real Earth Texture & Political Country Borders */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-grab touch-none"
        aria-label="Interactive 3D Earth Globe. Drag to rotate. Click any country to inspect."
      />

      {/* Country Name Labels on the Globe Surface */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {countryLabels.map((lbl) => {
          if (!lbl.visible) return null;
          return (
            <div
              key={lbl.name}
              className="absolute -translate-x-1/2 -translate-y-1/2 text-[10px] font-mono font-black tracking-widest text-slate-800 drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)] select-none transition-opacity duration-150"
              style={{ left: `${lbl.screenX}px`, top: `${lbl.screenY}px` }}
            >
              {lbl.name}
            </div>
          );
        })}
      </div>

      {/* Floating 2D Projected Pins with AQI Bubbles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {screenPins.map((pin) => {
          if (!pin.visible) return null;

          return (
            <div
              key={pin.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 transition-transform duration-150"
              style={{ left: `${pin.screenX}px`, top: `${pin.screenY}px` }}
            >
              {/* Radar Ping Beacon */}
              <div className="relative flex items-center justify-center">
                {pin.isActive && (
                  <span
                    className="absolute w-7 h-7 rounded-full animate-ping opacity-75"
                    style={{ backgroundColor: pin.colorHex }}
                  />
                )}
                <span
                  className={`rounded-full border border-white shadow-md ${
                    pin.isActive ? 'w-3.5 h-3.5 ring-2 ring-white' : 'w-2.5 h-2.5'
                  }`}
                  style={{ backgroundColor: pin.colorHex }}
                />
              </div>

              {/* Numbered AQI Badge Bubble */}
              <div
                className={`px-2 py-0.5 rounded-full font-mono font-black text-white shadow-xl border border-white/40 backdrop-blur-md flex items-center gap-1 ${
                  pin.isActive ? 'text-xs ring-2 ring-white/80' : 'text-[11px]'
                }`}
                style={{ backgroundColor: `${pin.colorHex}F0` }}
              >
                <span>{pin.name}</span>
                <span className="opacity-80">[{pin.aqi}]</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Interactive Inspection Card */}
      {activeDisplayPoint && (
        <div
          className="absolute z-30 transition-all duration-100 ease-out pointer-events-auto"
          style={{
            left: `${Math.min(Math.max(activeDisplayPoint.screenX + 15, 20), dimensions.width - 250)}px`,
            top: `${Math.min(Math.max(activeDisplayPoint.screenY - 90, 20), dimensions.height - 180)}px`,
          }}
        >
          <div className="rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 p-4 shadow-2xl text-left min-w-[220px] max-w-[270px] animate-fadeIn text-slate-900">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
              <span className="text-xs font-mono font-bold text-slate-800 truncate">
                {activeDisplayPoint.name}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                  {activeDisplayPoint.countryCode}
                </span>
                {lockedPoint && (
                  <button
                    type="button"
                    onClick={() => setLockedPoint(null)}
                    className="text-slate-400 hover:text-slate-700 text-sm px-1 cursor-pointer"
                    aria-label="Close card"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-1.5">
              <span
                className="text-3xl font-black font-mono tracking-tight tabular-nums"
                style={{ color: activeDisplayPoint.colorHex }}
              >
                {activeDisplayPoint.aqi}
              </span>
              <span className="text-[11px] font-bold text-slate-600 uppercase leading-tight truncate">
                {activeDisplayPoint.category}
              </span>
            </div>

            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2 mb-3">
              <span>{activeDisplayPoint.weatherSummary}</span>
            </div>

            {/* Explicit Set Active Button — Two-Way Dashboard Synchronization */}
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
                  timezone: 'auto',
                });
                pivotToLocation(activeDisplayPoint.latitude, activeDisplayPoint.longitude);
                setLockedPoint(null);
              }}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-mono font-bold tracking-wide transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
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
        <div className="inline-flex items-center rounded-xl bg-white/90 backdrop-blur-md border border-slate-200/90 p-1 shadow-md text-[11px] font-mono text-slate-700">
          <button
            type="button"
            onClick={() => setIsRotating(!isRotating)}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              isRotating
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {isRotating ? '3D ROTATING' : '3D PAUSED'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (selectedLocation) {
                setIsRotating(false); // Pause so it stays focused on active location
                pivotToLocation(selectedLocation.latitude, selectedLocation.longitude);
              }
            }}
            className="px-3 py-1 text-sky-700 hover:text-sky-900 hover:bg-sky-50 rounded-lg font-bold transition-colors cursor-pointer"
          >
            FOCUS ACTIVE
          </button>
        </div>

        {/* ZOOM CONTROLS */}
        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-xl p-1 shadow-md text-[11px] font-mono text-slate-700">
          <span className="px-2 text-[10px] uppercase font-bold text-slate-400">Zoom</span>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(4.5, z - 0.5))}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-colors cursor-pointer"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(8.5, z + 0.5))}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-colors cursor-pointer"
            aria-label="Zoom out"
          >
            -
          </button>
        </div>
      </div>
    </div>
  );
}
