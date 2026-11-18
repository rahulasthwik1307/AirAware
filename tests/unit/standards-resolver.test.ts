import { describe, it, expect } from 'vitest';
import {
  getDefaultStandardForCountry,
  resolveStandardMetadata,
} from '@/domain/aqi/standards-resolver';

describe('Geographic AQI Standards Resolver', () => {
  describe('Default Standard Selection by Country', () => {
    it('defaults to US_EPA for United States', () => {
      expect(getDefaultStandardForCountry('US')).toBe('US_EPA');
      expect(getDefaultStandardForCountry('us')).toBe('US_EPA');
    });

    it('defaults to EUROPEAN_EAQI for European countries (GB, DE, FR, IT, ES)', () => {
      expect(getDefaultStandardForCountry('GB')).toBe('EUROPEAN_EAQI');
      expect(getDefaultStandardForCountry('DE')).toBe('EUROPEAN_EAQI');
      expect(getDefaultStandardForCountry('FR')).toBe('EUROPEAN_EAQI');
      expect(getDefaultStandardForCountry('IT')).toBe('EUROPEAN_EAQI');
      expect(getDefaultStandardForCountry('ES')).toBe('EUROPEAN_EAQI');
    });

    it('defaults to US_EPA as international reference for India (IN) and other global countries', () => {
      expect(getDefaultStandardForCountry('IN')).toBe('US_EPA');
      expect(getDefaultStandardForCountry('JP')).toBe('US_EPA');
      expect(getDefaultStandardForCountry('CA')).toBe('US_EPA');
      expect(getDefaultStandardForCountry('AU')).toBe('US_EPA');
    });
  });

  describe('Standard Role & Metadata Classification', () => {
    it('classifies US_EPA as LOCAL_OFFICIAL only in the United States', () => {
      const usMeta = resolveStandardMetadata('US_EPA', 'US');
      expect(usMeta.role).toBe('LOCAL_OFFICIAL');
      expect(usMeta.roleLabel).toBe('US Local Official Standard');
    });

    it('classifies US_EPA as INTERNATIONAL_REFERENCE in India (IN) with explicit CPCB non-claim', () => {
      const inMeta = resolveStandardMetadata('US_EPA', 'IN');
      expect(inMeta.role).toBe('INTERNATIONAL_REFERENCE');
      expect(inMeta.roleLabel).toBe('International Reference Index');
      expect(inMeta.description).toContain('official Indian CPCB National AQI is not integrated');
    });

    it('classifies EUROPEAN_EAQI as REGIONAL_INDEX in European countries', () => {
      const gbMeta = resolveStandardMetadata('EUROPEAN_EAQI', 'GB');
      expect(gbMeta.role).toBe('REGIONAL_INDEX');
      expect(gbMeta.roleLabel).toBe('European Regional Index');

      const deMeta = resolveStandardMetadata('EUROPEAN_EAQI', 'DE');
      expect(deMeta.role).toBe('REGIONAL_INDEX');
    });

    it('classifies EUROPEAN_EAQI as INTERNATIONAL_REFERENCE outside Europe', () => {
      const usMeta = resolveStandardMetadata('EUROPEAN_EAQI', 'US');
      expect(usMeta.role).toBe('INTERNATIONAL_REFERENCE');

      const inMeta = resolveStandardMetadata('EUROPEAN_EAQI', 'IN');
      expect(inMeta.role).toBe('INTERNATIONAL_REFERENCE');
    });
  });
});
