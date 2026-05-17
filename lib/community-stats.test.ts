import { describe, expect, it } from 'vitest';
import {
    computeCommunityStatsFromDb,
    EMPTY_COMMUNITY_STATS,
    mapCommunityStatsRow,
} from './community-stats';

describe('community-stats', () => {
    it('mapCommunityStatsRow converts snake_case to camelCase', () => {
        expect(
            mapCommunityStatsRow({
                total_users: 3,
                total_entries: 12,
                total_co2e: 1626.4,
                countries_count: 1,
                trees_equivalent: 73,
                co2_reduction_kg: 100,
                co2_reduction_percent: 15,
                co2_per_user_kg: 542.13,
            })
        ).toEqual({
            totalUsers: 3,
            totalCo2e: 1626.4,
            totalEntries: 12,
            countriesCount: 1,
            treesEquivalent: 73,
            co2ReductionKg: 100,
            co2ReductionPercent: 15,
            co2PerUserKg: 542.13,
        });
    });

    it('computeCommunityStatsFromDb computes aggregates', async () => {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-10`;
        const prev = new Date(now.getFullYear(), now.getMonth() - 1, 10);
        const prevMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-10`;
        const older = new Date(now.getFullYear(), now.getMonth() - 2, 10);
        const olderMonth = `${older.getFullYear()}-${String(older.getMonth() + 1).padStart(2, '0')}-10`;

        const supabase = {
            from(table: string) {
                if (table === 'profiles') {
                    return {
                        select: async () => ({ count: 2, error: null }),
                    };
                }

                if (table === 'footprint_entries') {
                    return {
                        select: async () => ({
                            data: [
                                { co2e: 100, date: currentMonth },
                                { co2e: 50, date: olderMonth },
                                { co2e: 200, date: prevMonth },
                            ],
                            count: 3,
                            error: null,
                        }),
                    };
                }

                throw new Error(`Unexpected table: ${table}`);
            },
        };

        const stats = await computeCommunityStatsFromDb(supabase as never);

        expect(stats.totalUsers).toBe(2);
        expect(stats.totalEntries).toBe(3);
        expect(stats.totalCo2e).toBe(350);
        expect(stats.treesEquivalent).toBe(15);
        expect(stats.co2ReductionKg).toBe(100);
        expect(stats.co2ReductionPercent).toBe(50);
        expect(stats.co2PerUserKg).toBe(175);
    });

    it('EMPTY_COMMUNITY_STATS contains zeros', () => {
        expect(EMPTY_COMMUNITY_STATS.totalUsers).toBe(0);
        expect(EMPTY_COMMUNITY_STATS.co2ReductionPercent).toBeNull();
    });
});
