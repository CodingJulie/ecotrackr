import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => React.createElement('div', props, children),
    },
}));

vi.mock('lucide-react', () => ({
    Leaf: () => React.createElement('div', null, 'Leaf'),
    TrendingUp: () => React.createElement('div', null, 'TrendingUp'),
    Award: () => React.createElement('div', null, 'Award'),
    Sparkles: () => React.createElement('div', null, 'Sparkles'),
}));

const mockT = (key: string, opts?: { co2?: number; level?: number; progress?: number; days?: number }) => {
    if (key === 'tree_growth_tip') return `tip:${opts?.co2}`;
    if (key === 'level_progress') return `level:${opts?.level}`;
    if (key === 'to_next_level') return `progress:${opts?.progress}`;
    if (key === 'tree_ready_in_days') return `ready_in:${opts?.days}`;
    return key;
};
const mockI18n = { language: 'ru', changeLanguage: vi.fn() };

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: mockT,
        i18n: mockI18n,
    }),
}));

const updateUserTreeType = vi.fn();
const plantNewTree = vi.fn();

vi.mock('@/lib/tree', async () => {
    const actual = await vi.importActual<typeof import('@/lib/tree')>('@/lib/tree');
    return {
        ...actual,
        updateUserTreeType: (...args: unknown[]) => updateUserTreeType(...args),
        plantNewTree: (...args: unknown[]) => plantNewTree(...args),
    };
});

vi.mock('@/lib/supabase', () => ({
    supabase: { from: vi.fn() },
}));

import UserTree from './UserTree';

describe('UserTree', () => {
    const nowYear = new Date().getFullYear();
    const prevMonth = String(((new Date().getMonth() + 11) % 12) + 1).padStart(2, '0');
    const prevYear = new Date().getMonth() === 0 ? nowYear - 1 : nowYear;

    beforeEach(() => {
        updateUserTreeType.mockReset();
        updateUserTreeType.mockResolvedValue({ error: null });
        plantNewTree.mockReset();
        plantNewTree.mockResolvedValue({
            tree: {
                tree_type: 'oak',
                tree_level: 1,
                total_co2_saved: 400,
                cycle_co2_saved: 0,
                current_progress: 0,
                matured_at: null,
                cycle_baseline_co2: 400,
                trees_completed: 1,
                status: 'growing',
            },
            error: null,
        });
    });

    it('displays user tree and calculates growth from reduction', () => {
        const entries = [
            { co2e: 250, date: `${prevYear}-${prevMonth}-05` },
            { co2e: 50, date: `${nowYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01` },
        ];

        render(
            <UserTree
                userId="user-1"
                treeData={{ tree_type: 'oak', tree_level: 1, total_co2_saved: 0 }}
                entries={entries}
            />
        );

        expect(screen.getByText('your_eco_tree')).toBeInTheDocument();
        expect(screen.getByText((content) => content.includes('tree_types.oak.name'))).toBeInTheDocument();
        expect(screen.getByText('tree_types.oak.description')).toBeInTheDocument();
        // 250 → 50 = 200 saved → level 3
        expect(screen.getByText('200')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('level:3')).toBeInTheDocument();
    });

    it('shows default oak when data is missing', () => {
        render(<UserTree userId="user-1" treeData={null} entries={[]} />);
        expect(screen.getByText('your_eco_tree')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('🌰')).toBeInTheDocument();
        expect(screen.queryByText('tree_max_level_tip')).not.toBeInTheDocument();
        expect(screen.getByText('tip:100')).toBeInTheDocument();
    });

    it('saves selected tree type', async () => {
        const user = userEvent.setup();
        const onTreeTypeChange = vi.fn();
        render(
            <UserTree
                userId="user-1"
                treeData={{ tree_type: 'oak', tree_level: 1, total_co2_saved: 0 }}
                entries={[]}
                onTreeTypeChange={onTreeTypeChange}
            />
        );

        await user.click(screen.getByRole('radio', { name: 'tree_types.cherry.name' }));

        await waitFor(() => {
            expect(updateUserTreeType).toHaveBeenCalledWith(
                expect.anything(),
                'user-1',
                'cherry'
            );
        });
        expect(onTreeTypeChange).toHaveBeenCalledWith('cherry');
        expect(screen.getByText('tree_types.cherry.description')).toBeInTheDocument();
    });

    it('shows plant button at level 5', async () => {
        const user = userEvent.setup();
        const onPlanted = vi.fn();
        const maxEntries = [
            { co2e: 400, date: '2026-06-10' },
            { co2e: 300, date: '2026-06-20' },
        ];

        const { rerender } = render(
            <UserTree
                userId="user-1"
                treeData={{
                    tree_type: 'oak',
                    cycle_baseline_co2: 0,
                    trees_completed: 0,
                    matured_at: null,
                }}
                entries={[]}
            />
        );

        expect(screen.queryByRole('button', { name: 'plant_new_tree' })).not.toBeInTheDocument();

        rerender(
            <UserTree
                userId="user-1"
                treeData={{
                    tree_type: 'oak',
                    cycle_baseline_co2: 0,
                    trees_completed: 0,
                    matured_at: '2026-06-01T00:00:00.000Z',
                }}
                entries={maxEntries}
                onPlanted={onPlanted}
            />
        );

        const plantBtn = screen.getByRole('button', { name: 'plant_new_tree' });
        await user.click(plantBtn);

        await waitFor(() => {
            expect(plantNewTree).toHaveBeenCalled();
        });
        expect(onPlanted).toHaveBeenCalled();
    });
});
