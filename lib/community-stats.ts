import type { SupabaseClient } from '@supabase/supabase-js';
import { computeMonthOverMonthReduction, sumCo2e } from '@/lib/utils';

export interface CommunityStats {
    totalUsers: number;
    totalCo2e: number;
    totalEntries: number;
    countriesCount: number;
    treesEquivalent: number;
    co2ReductionKg: number;
    co2ReductionPercent: number | null;
    co2PerUserKg: number;
}

export interface CommunityStatsRow {
    total_users: number;
    total_entries: number;
    total_co2e: number;
    countries_count: number;
    trees_equivalent: number;
    co2_reduction_kg: number;
    co2_reduction_percent: number | null;
    co2_per_user_kg: number;
}

export const EMPTY_COMMUNITY_STATS: CommunityStats = {
    totalUsers: 0,
    totalCo2e: 0,
    totalEntries: 0,
    countriesCount: 0,
    treesEquivalent: 0,
    co2ReductionKg: 0,
    co2ReductionPercent: null,
    co2PerUserKg: 0,
};

export function mapCommunityStatsRow(row: CommunityStatsRow): CommunityStats {
    return {
        totalUsers: row.total_users ?? 0,
        totalCo2e: Number(row.total_co2e ?? 0),
        totalEntries: row.total_entries ?? 0,
        countriesCount: row.countries_count ?? 0,
        treesEquivalent: row.trees_equivalent ?? 0,
        co2ReductionKg: Number(row.co2_reduction_kg ?? 0),
        co2ReductionPercent: row.co2_reduction_percent ?? null,
        co2PerUserKg: Number(row.co2_per_user_kg ?? 0),
    };
}

export async function computeCommunityStatsFromDb(
    supabase: SupabaseClient
): Promise<CommunityStats> {
    const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;

    const { data: entries, count: totalEntries, error: entriesError } = await supabase
        .from('footprint_entries')
        .select('co2e, date', { count: 'exact' });

    if (entriesError) throw entriesError;

    const totalCo2e = sumCo2e(entries || []);
    const { kg: co2ReductionKg, percent: co2ReductionPercent } =
        computeMonthOverMonthReduction(entries || []);
    const usersCount = totalUsers || 0;

    return {
        totalUsers: usersCount,
        totalCo2e,
        totalEntries: totalEntries || 0,
        countriesCount: usersCount > 0 ? 1 : 0,
        treesEquivalent: Math.floor(totalCo2e / 22),
        co2ReductionKg,
        co2ReductionPercent,
        co2PerUserKg: usersCount > 0 ? totalCo2e / usersCount : 0,
    };
}
