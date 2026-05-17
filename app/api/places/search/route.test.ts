import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

describe('GET /api/places/search', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    it('returns empty array for short query', async () => {
        const response = await GET(new Request('http://localhost/api/places/search?q=ab'));
        const data = await response.json();

        expect(data).toEqual([]);
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('proxies request to Nominatim', async () => {
        const mockResults = [
            { lat: '55.123', lon: '60.456', display_name: 'Test Place, Russia', name: 'Test Place' },
        ];

        vi.mocked(global.fetch).mockResolvedValue({
            ok: true,
            json: async () => mockResults,
        } as Response);

        const response = await GET(new Request('http://localhost/api/places/search?q=Moscow&lang=en'));
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual(mockResults);

        const [requestUrl, requestInit] = vi.mocked(global.fetch).mock.calls[0] as [string, RequestInit];
        expect(requestUrl).toContain('https://nominatim.openstreetmap.org/search');
        expect(requestUrl).toContain('q=Moscow');
        expect(requestInit.headers).toMatchObject({
            Accept: 'application/json',
            'User-Agent': expect.stringContaining('EcoTrackr'),
        });
    });

    it('returns error when Nominatim is unavailable', async () => {
        vi.mocked(global.fetch).mockResolvedValue({
            ok: false,
            status: 503,
        } as Response);

        const response = await GET(new Request('http://localhost/api/places/search?q=Moscow'));
        const data = await response.json();

        expect(response.status).toBe(503);
        expect(data).toEqual({ error: 'Search failed' });
    });
});
