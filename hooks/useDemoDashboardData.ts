'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { DashboardData, DashboardEntry } from '@/hooks/useDashboardData';
import { buildDemoDashboardData, createDemoEntries } from '@/lib/demo-mock-data';
import { createDemoSupabaseClient } from '@/lib/demo-supabase';

export function useDemoDashboardData() {
    const [entries, setEntries] = useState(createDemoEntries);
    const entriesRef = useRef(entries);
    entriesRef.current = entries;

    const addEntries = useCallback((newEntries: DashboardEntry[]) => {
        setEntries((current) => [...newEntries, ...current]);
    }, []);

    const removeEntry = useCallback((id: string) => {
        setEntries((current) => current.filter((entry) => entry.id !== id));
    }, []);

    const demoSupabase = useMemo(
        () =>
            createDemoSupabaseClient(() => entriesRef.current, {
                onInsert: addEntries,
                onDelete: removeEntry,
            }),
        [addEntries, removeEntry]
    );

    const data = useMemo(
        (): DashboardData => buildDemoDashboardData(entries),
        [entries]
    );

    const refetch = useCallback(async () => entriesRef.current, []);

    return { data, demoSupabase, refetch };
}
