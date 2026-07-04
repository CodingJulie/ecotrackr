import { renderHook, waitFor } from '@testing-library/react';
import { useDashboardData } from './useDashboardData';
import { supabase } from '@/lib/supabase';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('useDashboardData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('загружает данные и возвращает их', async () => {
        const mockUser = { id: '123', email: 'test@test.com' };
        const mockEntries = [{ id: '1', co2e: 10 }];
        const mockProfile = { name: 'Test' };
        const mockTree = { tree_level: 2 };
        const mockForest = { total_trees: 100 };
        const mockMapPoints = [{ lat: 55, lng: 60, name: 'Point' }];

        (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });

        // ✅ Создаём правильные моки для каждой таблицы
        (supabase.from as any).mockImplementation((table: string) => {
            // ✅ Для footprint_entries - используем order
            if (table === 'footprint_entries') {
                const orderFn = vi.fn().mockResolvedValue({ data: mockEntries, error: null });
                const eqFn = vi.fn().mockReturnValue({ order: orderFn });
                const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
                return {
                    select: selectFn,
                    eq: eqFn,
                    order: orderFn,
                };
            }

            // ✅ Для profiles - используем maybeSingle
            if (table === 'profiles') {
                const maybeSingleFn = vi.fn().mockResolvedValue({ data: mockProfile, error: null });
                const eqFn = vi.fn().mockReturnValue({ maybeSingle: maybeSingleFn });
                const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
                return {
                    select: selectFn,
                    eq: eqFn,
                    maybeSingle: maybeSingleFn,
                };
            }

            // ✅ Для user_trees - используем maybeSingle
            if (table === 'user_trees') {
                const maybeSingleFn = vi.fn().mockResolvedValue({ data: mockTree, error: null });
                const eqFn = vi.fn().mockReturnValue({ maybeSingle: maybeSingleFn });
                const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
                return {
                    select: selectFn,
                    eq: eqFn,
                    maybeSingle: maybeSingleFn,
                };
            }

            // ✅ Для community_forest - используем maybeSingle (без eq)
            if (table === 'community_forest') {
                const maybeSingleFn = vi.fn().mockResolvedValue({ data: mockForest, error: null });
                const selectFn = vi.fn().mockReturnValue({ maybeSingle: maybeSingleFn });
                return {
                    select: selectFn,
                    maybeSingle: maybeSingleFn,
                };
            }

            // ✅ Для user_map_points - возвращаем массив (НЕ maybeSingle)
            if (table === 'user_map_points') {
                const eqFn = vi.fn().mockResolvedValue({ data: mockMapPoints, error: null });
                const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
                return {
                    select: selectFn,
                    eq: eqFn,
                };
            }

            // Default
            return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
            };
        });

        const { result } = renderHook(() => useDashboardData());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // ✅ Проверяем каждый элемент отдельно для более понятных сообщений об ошибках
        expect(result.current.data?.entries).toEqual(mockEntries);
        expect(result.current.data?.profile).toEqual(mockProfile);
        expect(result.current.data?.user).toEqual(mockUser);
        expect(result.current.data?.tree).toEqual(mockTree);
        expect(result.current.data?.forest).toEqual(mockForest);
        expect(result.current.data?.mapPoints).toEqual(mockMapPoints);
        expect(result.current.error).toBeNull();
    });

    it('обрабатывает ошибку при отсутствии пользователя', async () => {
        (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } });

        const { result } = renderHook(() => useDashboardData());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });
        expect(result.current.error).toBe('Пользователь не авторизован');
    });
});