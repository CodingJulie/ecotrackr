// hooks/useDashboardData.ts
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface DashboardData {
    entries: any[];
    mapPoints: any[];
    user: any;
    profile: any;
    tree: any;
    forest: any;
}

export function useDashboardData() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Пользователь не авторизован');

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

            const { data: tree, error: treeError } = await supabase
                .from('user_trees')
                .select('tree_level, total_co2_saved')
                .eq('user_id', user.id)
                .maybeSingle();

            if (treeError && treeError.code !== 'PGRST116') throw treeError;

            const { data: forest, error: forestError } = await supabase
                .from('community_forest')
                .select('total_trees')
                .maybeSingle();

            if (forestError && forestError.code !== 'PGRST116') throw forestError;

            const { data: mapPoints, error: mapError } = await supabase
                .from('user_map_points')
                .select('*')
                .eq('user_id', user.id);

            if (mapError) throw mapError;

            setData({
                entries: entries || [],
                mapPoints: mapPoints || [],
                user,
                profile: profile || null,
                tree: tree || null,
                forest: forest || null,
            });
            setError(null);
            return entries || [];
        } catch (err: any) {
            setError(err.message);
            return null;
        }
    }, []);

    useEffect(() => {
        refetch().finally(() => setLoading(false));
    }, [refetch]);

    return { data, loading, error, refetch };
}