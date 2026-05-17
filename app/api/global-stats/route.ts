import { createClient } from '@supabase/supabase-js';
import {
    computeCommunityStatsFromDb,
    EMPTY_COMMUNITY_STATS,
    mapCommunityStatsRow,
    type CommunityStatsRow,
} from '@/lib/community-stats';
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from '@/lib/supabase-env';

export const revalidate = 60;

function createStatsClient() {
    if (!isSupabaseConfigured()) {
        return null;
    }

    const url = getSupabaseUrl();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    const key = serviceRoleKey || getSupabaseAnonKey();

    try {
        return createClient(url, key, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    } catch {
        return null;
    }
}

export async function GET() {
    const supabase = createStatsClient();

    if (!supabase) {
        return Response.json(EMPTY_COMMUNITY_STATS);
    }

    try {
        const { data, error } = await supabase.rpc('get_community_stats');

        if (!error && data) {
            return Response.json(mapCommunityStatsRow(data as CommunityStatsRow));
        }

        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const stats = await computeCommunityStatsFromDb(supabase);
            return Response.json(stats);
        }

        console.error('get_community_stats RPC failed:', error?.message);
        return Response.json(EMPTY_COMMUNITY_STATS);
    } catch (error) {
        console.error('Error fetching global stats:', error);
        return Response.json(EMPTY_COMMUNITY_STATS);
    }
}
