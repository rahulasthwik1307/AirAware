import { describe, it, expect } from 'vitest';
import { resolveGlobePlace } from '@/components/globe/globe-place-resolver';

describe('Global Place & Geographic Entity Resolver', () => {
  it('resolves coordinates in West Africa (e.g. Mali / Burkina Faso region) to a real country, never Global Grid', () => {
    // 12.28°N, 1.18°W from user screenshot
    const place = resolveGlobePlace(12.28, -1.18);
    expect(place.name).not.toContain('Global Grid');
    expect(place.country).not.toBe('Global Grid');
    expect(place.countryCode).not.toBe('GRID');
    expect(['Mali', 'Burkina Faso']).toContain(place.country);
  });

  it('resolves direct coordinates in Mali to Mali or specific Mali city', () => {
    // 21.0°N, -2.0°W (northern Mali desert region away from city anchors)
    const place = resolveGlobePlace(21.0, -2.0);
    expect(place.name).toBe('Mali');
    expect(place.country).toBe('Mali');
    expect(place.countryCode).toBe('ML');

    // Central Mali near Timbuktu resolves to Timbuktu
    const timbuktu = resolveGlobePlace(16.76, -3.00);
    expect(timbuktu.name).toBe('Timbuktu');
    expect(timbuktu.country).toBe('Mali');
  });

  it('resolves known urban anchors to exact city names', () => {
    const tokyo = resolveGlobePlace(35.6895, 139.6917);
    expect(tokyo.name).toBe('Tokyo');
    expect(tokyo.country).toBe('Japan');
    expect(tokyo.countryCode).toBe('JP');

    const paris = resolveGlobePlace(48.8566, 2.3522);
    expect(paris.name).toBe('Paris');
    expect(paris.country).toBe('France');
    expect(paris.countryCode).toBe('FR');

    const newDelhi = resolveGlobePlace(28.6139, 77.209);
    expect(newDelhi.name).toBe('New Delhi');
    expect(newDelhi.country).toBe('India');
    expect(newDelhi.countryCode).toBe('IN');

    const rio = resolveGlobePlace(-22.9068, -43.1729);
    expect(rio.name).toBe('Rio de Janeiro');
    expect(rio.country).toBe('Brazil');
    expect(rio.countryCode).toBe('BR');
  });

  it('resolves coordinates in national territory to country name when not near a major city', () => {
    // Middle of Australia outback: -25.0°S, 133.0°E
    const outback = resolveGlobePlace(-25.0, 133.0);
    expect(outback.name).toBe('Australia');
    expect(outback.countryCode).toBe('AU');

    // Middle of Egypt desert: 26.0°N, 28.0°E
    const desert = resolveGlobePlace(26.0, 28.0);
    expect(desert.name).toBe('Egypt');
    expect(desert.countryCode).toBe('EG');
  });

  it('resolves maritime coordinates to named oceanic basins, never Global Grid', () => {
    // Mid North Atlantic: 30°N, -40°W
    const atlantic = resolveGlobePlace(30.0, -40.0);
    expect(atlantic.name).toBe('North Atlantic Ocean');
    expect(atlantic.isMarine).toBe(true);
    expect(atlantic.countryCode).toBe('OCEAN');

    // Mid South Pacific: -20°S, -140°W
    const pacific = resolveGlobePlace(-20.0, -140.0);
    expect(pacific.name).toBe('South Pacific Ocean');
    expect(pacific.isMarine).toBe(true);

    // Mediterranean Sea: 36°N, 15°E
    const med = resolveGlobePlace(36.0, 15.0);
    expect(med.name).toBe('Mediterranean Sea');
    expect(med.isMarine).toBe(true);
  });

  it('respects rendered vector feature labels if clicked on a map feature', () => {
    const renderedFeatures = [
      {
        properties: {
          name: 'Mali',
          name_en: 'Mali',
        },
      },
    ];
    const place = resolveGlobePlace(14.0, -2.0, renderedFeatures);
    expect(place.name).toBe('Mali');
    expect(place.country).toBe('Mali');
    expect(place.countryCode).toBe('ML');
  });
});
