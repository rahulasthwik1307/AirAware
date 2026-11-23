// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { LocationSearch } from '@/components/dashboard/LocationSearch';

describe('LocationSearch Component Flow', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    globalThis.fetch = originalFetch;
  });

  it('debounces text input and displays search results dropdown', async () => {
    const mockResults = [
      {
        id: 101,
        name: 'Dehradun',
        country: 'India',
        countryCode: 'IN',
        admin1: 'Uttarakhand',
        latitude: 30.3165,
        longitude: 78.0322,
        timezone: 'Asia/Kolkata',
      },
    ];

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ results: mockResults }),
    } as Response);

    const handleSelectLocation = vi.fn();

    render(
      <LocationSearch
        onSelectLocation={handleSelectLocation}
        selectedLocation={null}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Dehradun' } });

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/locations/search?name=Dehradun'),
        expect.anything()
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Dehradun')).toBeDefined();
    });

    // Click result
    fireEvent.click(screen.getByText('Dehradun'));
    expect(handleSelectLocation).toHaveBeenCalledWith(mockResults[0]);
  });

  it('displays no atmospheric grid matches message when search results are empty', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ results: [] }),
    } as Response);

    render(
      <LocationSearch
        onSelectLocation={vi.fn()}
        selectedLocation={null}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'NonExistentPlaceXYZ' } });

    await waitFor(() => {
      expect(screen.getByRole('status').textContent).toContain(
        'No atmospheric grid matches found for NonExistentPlaceXYZ'
      );
    });
  });

  it('displays GPS permission denied message when user denies geolocation', async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn((_success, error) => {
        error({
          code: 1, // PERMISSION_DENIED
          PERMISSION_DENIED: 1,
          message: 'User denied Geolocation',
        });
      }),
    };
    vi.stubGlobal('navigator', { geolocation: mockGeolocation });

    render(
      <LocationSearch
        onSelectLocation={vi.fn()}
        selectedLocation={null}
      />
    );

    const gpsBtn = screen.getByRole('button', { name: /locate/i });
    fireEvent.click(gpsBtn);

    await waitFor(() => {
      expect(screen.getByRole('status').textContent).toContain(
        'Geolocation permission was denied. You may search for any coordinate or city manually.'
      );
    });
  });

  it('allows clicking quick preset cities directly', () => {
    const handleSelect = vi.fn();

    render(
      <LocationSearch
        onSelectLocation={handleSelect}
        selectedLocation={null}
      />
    );

    const noidaBtn = screen.getByRole('button', { name: /^Noida/i });
    fireEvent.click(noidaBtn);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect.mock.calls[0][0].name).toBe('Noida');
  });
});
