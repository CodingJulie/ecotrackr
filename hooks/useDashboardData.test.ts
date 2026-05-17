import { renderHook, waitFor } from '@testing-library/react';
import { useDashboardData } from './useDashboardData';
import { supabase } from '@/lib/supabase';
import { resetAuthSessionCache } from '@/lib/auth-client';
import { saveDashboardCache } from '@/lib/dashboard-cache';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('useDashboardData', () => {
    const originalOnLine = navigator.onLine;

    beforeEach(() => {
        vi.clearAllMocks();
        resetAuthSessionCache();
        Object.defineProperty(navigator, 'onLine', {
            value: true,
            configurable: true,
        });
        localStorage.clear();
    });

    afterEach(() => {
        Object.defineProperty(navigator, 'onLine', {
            value: originalOnLine,
            configurable: true,
        });
    });

    it('loads data, syncs tree, and returns them', async () => {
        const mockUser = { id: '123', email: 'test@test.com' };
        const mockEntries = [{ id: '1', co2e: 10, date: '2026-06-01' }];
        const mockProfile = { name: 'Test' };
        const mockTree = { tree_type: 'oak', tree_level: 1, total_co2_saved: 0 };
        const mockMapPoints = [{ lat: 55, lng: 60, name: 'Point' }];

        (supabase.auth.getSession as any).mockResolvedValue({
            data: { session: { user: mockUser } },
        });

        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'footprint_entries') {
                const orderFn = vi.fn().mockResolvedValue({ data: mockEntries, error: null });
                const eqFn = vi.fn().mockReturnValue({ order: orderFn });
                const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
                return { select: selectFn, eq: eqFn, order: orderFn };
            }

            if (table === 'profiles') {
                const maybeSingleFn = vi.fn().mockResolvedValue({ data: mockProfile, error: null });
                const eqFn = vi.fn().mockReturnValue({ maybeSingle: maybeSingleFn });
                const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
                return { select: selectFn, eq: eqFn, maybeSingle: maybeSingleFn };
            }

            if (table === 'user_trees') {
                const maybeSingleFn = vi.fn().mockResolvedValue({ data: mockTree, error: null });
                const updateEqFn = vi.fn().mockResolvedValue({ data: null, error: null });
                const updateFn = vi.fn().mockReturnValue({ eq: updateEqFn });
                const upsertFn = vi.fn().mockResolvedValue({ data: null, error: null });
                const eqFn = vi.fn().mockReturnValue({ maybeSingle: maybeSingleFn });
                const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
                return {
                    select: selectFn,
                    eq: eqFn,
                    maybeSingle: maybeSingleFn,
                    update: updateFn,
                    upsert: upsertFn,
                };
            }

            if (table === 'user_map_points') {
                const eqFn = vi.fn().mockResolvedValue({ data: mockMapPoints, error: null });
                const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
                return { select: selectFn, eq: eqFn };
            }

            return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
                update: vi.fn().mockReturnThis(),
                upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
        });

        const { result } = renderHook(() => useDashboardData());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data?.entries).toEqual(mockEntries);
        expect(result.current.data?.profile).toEqual(mockProfile);
        expect(result.current.data?.user).toEqual(mockUser);
        expect(result.current.data?.tree?.tree_type).toBe('oak');
        expect(result.current.data?.tree?.tree_level).toBeGreaterThanOrEqual(1);
        expect(result.current.data?.mapPoints).toEqual(mockMapPoints);
        expect(result.current.error).toBeNull();
    });

    it('handles error when user is missing', async () => {
        (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } });

        const { result } = renderHook(() => useDashboardData());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });
        expect(result.current.error).toBe('user_not_authorized');
    });

    it('uses local cache in offline mode', async () => {
        const mockUser = { id: '123', email: 'test@test.com' };
        const mockEntries = [{ id: '1', co2e: 10, date: '2026-06-01', category: 'transport' }];
        const mockProfile = { name: 'Test', avatar_url: null };
        const mockTree = {
            tree_type: 'oak' as const,
            tree_level: 1,
            total_co2_saved: 0,
            cycle_co2_saved: 0,
            current_progress: 0,
            matured_at: null,
            cycle_baseline_co2: 0,
            trees_completed: 0,
            status: 'growing' as const,
        };
        const mockMapPoints = [{ id: 'p1', user_id: '123', lat: 55, lng: 60, name: 'Point', co2_estimate: 1 }];

        saveDashboardCache({
            entries: mockEntries,
            mapPoints: mockMapPoints,
            user: mockUser as any,
            profile: mockProfile,
            tree: mockTree,
        });

        Object.defineProperty(navigator, 'onLine', {
            value: false,
            configurable: true,
        });
        (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } });

        const { result } = renderHook(() => useDashboardData());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data?.entries).toEqual(mockEntries);
        expect(result.current.error).toBeNull();
        expect(supabase.from).not.toHaveBeenCalled();
    });
});
