import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PublicProfilePage from './page';
import { supabase } from '@/lib/supabase';
import { useParams, useSearchParams } from 'next/navigation';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('PublicProfilePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useParams as any).mockReturnValue({ username: 'julia' });
        (useSearchParams as any).mockReturnValue(new URLSearchParams());

        Object.defineProperty(window, 'location', {
            value: { href: 'http://localhost/u/julia', origin: 'http://localhost' },
            writable: true,
        });
    });

    it('показывает публичный профиль и статистику', async () => {
        const profileQuery = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
                data: {
                    id: 'user-1',
                    name: 'Julia',
                    username: 'julia',
                    avatar_url: null,
                },
                error: null,
            }),
        };

        const entriesQuery = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
                data: [
                    { id: '1', co2e: 10, date: new Date().toISOString(), category: 'transport' },
                ],
                error: null,
            }),
        };

        const treeQuery = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
                data: { tree_level: 2, total_co2_saved: 5 },
                error: null,
            }),
        };

        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'profiles') return profileQuery;
            if (table === 'footprint_entries') return entriesQuery;
            if (table === 'user_trees') return treeQuery;
            return profileQuery;
        });

        await act(async () => {
            render(<PublicProfilePage />);
        });

        await screen.findByText('Julia');
        expect(screen.getByText('@julia')).toBeInTheDocument();
        expect(screen.getByText('10 kg')).toBeInTheDocument();
    });

    it('показывает 404 для приватного или отсутствующего профиля', async () => {
        const profileQuery = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
        (supabase.from as any).mockReturnValue(profileQuery);

        await act(async () => {
            render(<PublicProfilePage />);
        });

        await screen.findByText('public_profile_not_found_title');
    });

    it('копирует ссылку на профиль', async () => {
        const user = userEvent.setup();
        const profileQuery = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
                data: {
                    id: 'user-1',
                    name: 'Julia',
                    username: 'julia',
                    avatar_url: null,
                },
                error: null,
            }),
        };
        const entriesQuery = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
        const treeQuery = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };

        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'profiles') return profileQuery;
            if (table === 'footprint_entries') return entriesQuery;
            if (table === 'user_trees') return treeQuery;
            return profileQuery;
        });

        await act(async () => {
            render(<PublicProfilePage />);
        });

        await screen.findByText('Julia');
        await user.click(screen.getByRole('button', { name: 'copy_profile_link' }));

        await screen.findByText('link_copied');
    });
});
