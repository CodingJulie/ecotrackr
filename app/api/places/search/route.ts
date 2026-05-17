const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_USER_AGENT = 'EcoTrackr/0.1.0 (carbon footprint tracker; privacy@ecotrackr.com)';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const lang = searchParams.get('lang')?.trim() || 'ru';

    if (!query || query.length < 3) {
        return Response.json([]);
    }

    const url = new URL(NOMINATIM_SEARCH_URL);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '5');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('accept-language', lang);

    try {
        const response = await fetch(url.toString(), {
            headers: {
                'User-Agent': NOMINATIM_USER_AGENT,
                Accept: 'application/json',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            return Response.json({ error: 'Search failed' }, { status: response.status });
        }

        return Response.json(await response.json());
    } catch (error) {
        console.error('Nominatim search error:', error);
        return Response.json({ error: 'Search failed' }, { status: 502 });
    }
}
