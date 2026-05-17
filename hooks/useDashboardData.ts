import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { User } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth-client';
import { loadAnyDashboardCache, loadDashboardCache, saveDashboardCache } from '@/lib/dashboard-cache';
import { supabase } from '@/lib/supabase';
import { syncUserTree, type TreeState } from '@/lib/tree';

export interface DashboardEntry {
    id: string;
    co2e: number;
    date: string;
    category: string;
    activity?: string;
    value?: number;
    is_auto_generated?: boolean | null;
}

export interface DashboardProfile {
    name: string | null;
    avatar_url: string | null;
}

export interface DashboardMapPoint {
    id: string;
    user_id: string;
    lat: number;
    lng: number;
    name: string | null;
    co2_estimate: number | null;
}

export interface DashboardData {
    entries: DashboardEntry[];
    mapPoints: DashboardMapPoint[];
    user: User;
    profile: DashboardProfile | null;
    tree: TreeState;
}

function errorMessage(err: unknown, fallback: string): string {
    if (err instanceof Error && err.message) return err.message;
    if (typeof err === 'object' && err !== null && 'message' in err) {
        const msg = (err as { message: unknown }).message;
        if (typeof msg === 'string' && msg) return msg;
    }
    return fallback;
}

function isOfflineOrNetworkError(err: unknown): boolean {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
    if (err instanceof Error) {
        const message = err.message.toLowerCase();
        return (
            message.includes('fetch') ||
            message.includes('network') ||
            message.includes('failed to fetch')
        );
    }
    return false;
}

function applyCachedDashboard(
    userId: string | null,
    setData: (data: DashboardData) => void,
    setError: (error: string | null) => void
): DashboardEntry[] | null {
    const cached = userId ? loadDashboardCache(userId) : loadAnyDashboardCache();
    if (!cached) return null;

    setData(cached);
    setError(null);
    return cached.entries;
}

async function resolveDashboardUser() {
    const user = await getAuthUser();
    if (user) return user;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return loadAnyDashboardCache()?.user ?? null;
    }

    return null;
}

export function useDashboardData() {
    const { t } = useTranslation('common');
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        try {
            const user = await resolveDashboardUser();
            if (!user) {
                if (typeof navigator !== 'undefined' && !navigator.onLine) {
                    const cachedEntries = applyCachedDashboard(null, setData, setError);
                    if (cachedEntries) return cachedEntries;
                    throw new Error(t('offline_no_cached_data'));
                }
                throw new Error(t('user_not_authorized'));
            }

            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                const cachedEntries = applyCachedDashboard(user.id, setData, setError);
                if (cachedEntries) return cachedEntries;
                throw new Error(t('offline_no_cached_data'));
            }

            const { data: entries, error: entriesError } = await supabase
                .from('footprint_entries')
                .select('id, co2e, date, category, activity, value, is_auto_generated')
                .eq('user_id', user.id)
                .order('date', { ascending: false });

            if (entriesError) throw entriesError;

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('name, avatar_url')
                .eq('id', user.id)
                .maybeSingle();

            if (profileError && profileError.code !== 'PGRST116') throw profileError;

            const { data: existingTree, error: treeError } = await supabase
                .from('user_trees')
                .select('tree_type, tree_level, total_co2_saved, matured_at, cycle_baseline_co2, trees_completed')
                .eq('user_id', user.id)
                .maybeSingle();

            if (treeError && treeError.code !== 'PGRST116') throw treeError;

            const tree = await syncUserTree(
                supabase,
                user.id,
                entries || [],
                existingTree
            );

            const { data: mapPoints, error: mapError } = await supabase
                .from('user_map_points')
                .select('id, user_id, lat, lng, name, co2_estimate')
                .eq('user_id', user.id);

            if (mapError) throw mapError;

            const nextData: DashboardData = {
                entries: (entries || []) as DashboardEntry[],
                mapPoints: (mapPoints || []) as DashboardMapPoint[],
                user,
                profile: (profile as DashboardProfile | null) || null,
                tree,
            };

            setData(nextData);
            saveDashboardCache(nextData);
            setError(null);
            return entries || [];
        } catch (err: unknown) {
            console.error('Dashboard data load failed:', err);

            if (isOfflineOrNetworkError(err)) {
                const user = await resolveDashboardUser();
                const cachedEntries = applyCachedDashboard(user?.id ?? null, setData, setError);
                if (cachedEntries) return cachedEntries;
            }

            setError(errorMessage(err, t('load_error')));
            return null;
        }
    }, [t]);

    useEffect(() => {
        refetch().finally(() => setLoading(false));
    }, [refetch]);

    return { data, loading, error, refetch };
}
