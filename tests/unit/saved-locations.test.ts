import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const GeoLocationSchema = z.object({
  id: z.number(),
  name: z.string(),
  country: z.string(),
  countryCode: z.string(),
  admin1: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
  isPrimary: z.boolean().optional(),
});

const SavedLocationsSchema = z.array(GeoLocationSchema);

describe('Saved Locations Domain Schema', () => {
  it('validates a correct list of saved locations', () => {
    const locations = [
      {
        id: 1273294,
        name: 'New Delhi',
        country: 'India',
        countryCode: 'IN',
        admin1: 'Delhi',
        latitude: 28.6139,
        longitude: 77.209,
        timezone: 'Asia/Kolkata',
        isPrimary: true,
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
        isPrimary: false,
      },
    ];

    const result = SavedLocationsSchema.safeParse(locations);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(2);
      expect(result.data[0].isPrimary).toBe(true);
    }
  });

  it('rejects corrupted or malicious data in storage', () => {
    const maliciousPayload = [
      {
        id: 'not-a-number',
        name: '<script>alert(1)</script>',
      },
    ];

    const result = SavedLocationsSchema.safeParse(maliciousPayload);
    expect(result.success).toBe(false);
  });
});
