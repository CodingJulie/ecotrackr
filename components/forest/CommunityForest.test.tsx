import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => React.createElement('div', props, children),
    },
}));

vi.mock('lucide-react', () => ({
    Users: () => React.createElement('div', null, 'Users'),
    Trees: () => React.createElement('div', null, 'Trees'),
    Leaf: () => React.createElement('div', null, 'Leaf'),
    TrendingUp: () => React.createElement('div', null, 'TrendingUp'),
    Sparkles: () => React.createElement('div', null, 'Sparkles'),
    Loader2: () => React.createElement('div', null, 'Loader2'),
}));

const mockT = (key: string, options?: { count?: number }) => {
    if (key === 'trees_planted_count' && options?.count != null) {
        return `${options.count} trees`;
    }
    return key;
};
const mockI18n = { language: 'ru', changeLanguage: vi.fn() };

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: mockT,
        i18n: mockI18n,
    }),
}));

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
        auth: {
            getUser: vi.fn(),
        },
    },
}));

import CommunityForest from './CommunityForest';
import { supabase } from '@/lib/supabase';

describe('CommunityForest', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('aggregates stats from user_trees', async () => {
        const mockUsers = [
            { user_id: '1', tree_type: 'oak', tree_level: 5, total_co2_saved: 1000, trees_completed: 1 },
            { user_id: '2', tree_type: 'cherry', tree_level: 4, total_co2_saved: 800, trees_completed: 0 },
        ];
        const mockProfiles = [
            { id: '1', name: 'Alice' },
            { id: '2', name: 'Bob' },
        ];

        const mockOrderSaved = vi.fn().mockResolvedValue({ data: mockUsers, error: null });
        const mockOrderLevel = vi.fn().mockReturnValue({ order: mockOrderSaved });
        const mockSelectTrees = vi.fn().mockReturnValue({ order: mockOrderLevel });

        const mockIn = vi.fn().mockResolvedValue({ data: mockProfiles, error: null });
        const mockSelectProfiles = vi.fn().mockReturnValue({ in: mockIn });

        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'user_trees') {
                return { select: mockSelectTrees };
            }
            if (table === 'profiles') {
                return { select: mockSelectProfiles };
            }
            return { select: vi.fn().mockReturnThis() };
        });

        render(<CommunityForest />);

        await screen.findByText('forest_leaders');
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.queryByText('Bob')).not.toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText((content) => /1[,\s]?800/.test(content))).toBeInTheDocument();
        expect(screen.getByText('🥇')).toBeInTheDocument();
        expect(screen.getAllByText('👑🌳').length).toBeGreaterThan(0);
        expect(screen.queryByText('🌸')).not.toBeInTheDocument();
    });

    it('updates current user icon when type changes', async () => {
        const mockUsers = [
            { user_id: '1', tree_type: 'oak', tree_level: 2, total_co2_saved: 1000, trees_completed: 1 },
        ];
        const mockProfiles = [{ id: '1', name: 'Alice' }];

        const mockOrderSaved = vi.fn().mockResolvedValue({ data: mockUsers, error: null });
        const mockOrderLevel = vi.fn().mockReturnValue({ order: mockOrderSaved });
        const mockSelectTrees = vi.fn().mockReturnValue({ order: mockOrderLevel });
        const mockIn = vi.fn().mockResolvedValue({ data: mockProfiles, error: null });
        const mockSelectProfiles = vi.fn().mockReturnValue({ in: mockIn });

        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'user_trees') return { select: mockSelectTrees };
            if (table === 'profiles') return { select: mockSelectProfiles };
            return { select: vi.fn().mockReturnThis() };
        });

        const { rerender } = render(
            <CommunityForest
                currentUserId="1"
                currentUserTreeType="oak"
            />
        );

        await screen.findByText('Alice');
        expect(screen.getAllByText('👑🌳').length).toBeGreaterThan(0);

        rerender(
            <CommunityForest
                currentUserId="1"
                currentUserTreeType="cherry"
            />
        );

        expect(screen.getAllByText('✨🌸').length).toBeGreaterThan(0);
    });

    it('shows message when forest is empty', async () => {
        const mockOrderSaved = vi.fn().mockResolvedValue({ data: [], error: null });
        const mockOrderLevel = vi.fn().mockReturnValue({ order: mockOrderSaved });
        const mockSelect = vi.fn().mockReturnValue({ order: mockOrderLevel });

        (supabase.from as any).mockReturnValue({ select: mockSelect });

        render(<CommunityForest />);

        await screen.findByText('forest_empty');
        expect(screen.getByText('forest_empty_desc')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText('be_first')).toBeInTheDocument();
        });
    });
});
