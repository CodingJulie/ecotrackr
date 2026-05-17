import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const rpcMock = vi.fn();
const fromMock = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => ({
        rpc: rpcMock,
        from: fromMock,
    })),
}));

describe('GET /api/global-stats', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://test.supabase.co';
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'anon-key';
        delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    });

    it('returns stats from RPC', async () => {
        rpcMock.mockResolvedValue({
            data: {
                total_users: 2,
                total_entries: 5,
                total_co2e: 100,
                countries_count: 1,
                trees_equivalent: 4,
                co2_reduction_kg: 10,
                co2_reduction_percent: 20,
                co2_per_user_kg: 50,
            },
            error: null,
        });

        const response = await GET();
        const data = await response.json();

        expect(data.totalUsers).toBe(2);
        expect(data.totalCo2e).toBe(100);
        expect(rpcMock).toHaveBeenCalledWith('get_community_stats');
    });

    it('returns zeros when Supabase is not configured', async () => {
        delete process.env.NEXT_PUBLIC_SUPABASE_URL;
        delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

        const response = await GET();
        const data = await response.json();

        expect(data.totalUsers).toBe(0);
        expect(data.totalCo2e).toBe(0);
        expect(rpcMock).not.toHaveBeenCalled();
    });

    it('returns zeros when RPC is unavailable', async () => {
        rpcMock.mockResolvedValue({
            data: null,
            error: { message: 'function does not exist' },
        });

        const response = await GET();
        const data = await response.json();

        expect(data.totalUsers).toBe(0);
        expect(data.totalCo2e).toBe(0);
    });
});
