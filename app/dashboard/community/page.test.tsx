import { render, screen, act } from '@testing-library/react';
import CommunityPage from './page';
import { supabase } from '@/lib/supabase';
import { useWorkers } from '@/components/workers/WorkersManager';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/components/workers/WorkersManager', () => ({
    useWorkers: vi.fn(),
}));

describe('CommunityPage', () => {
    const mockEntries = [
        { user_id: '1', co2e: 100, category: 'transport' },
        { user_id: '2', co2e: 50, category: 'food' },
        { user_id: '1', co2e: 200, category: 'energy' },
    ];
    const mockProfiles = [
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
    ];
    const mockLeaderboard = {
        leaderboard: [
            { id: '1', name: 'Alice', totalCO2: 300, entriesCount: 2, rank: 1, medal: '🥇' },
            { id: '2', name: 'Bob', totalCO2: 50, entriesCount: 1, rank: 2, medal: '🥈' },
        ],
    };

    let mockCalculateLeaderboard: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockCalculateLeaderboard = vi.fn().mockResolvedValue(mockLeaderboard);
        (useWorkers as any).mockReturnValue({ calculateLeaderboard: mockCalculateLeaderboard });

        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'footprint_entries') {
                return {
                    select: vi.fn().mockResolvedValue({ data: mockEntries, error: null }),
                };
            }
            if (table === 'profiles') {
                return {
                    select: vi.fn().mockReturnThis(),
                    in: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
                };
            }
            return {
                select: vi.fn().mockReturnThis(),
                in: vi.fn().mockResolvedValue({ data: [], error: null }),
            };
        });
    });

    it('displays leaderboard', async () => {
        await act(async () => {
            render(<CommunityPage />);
        });
        await screen.findByText('leaderboard');
        expect(screen.getAllByText('Alice').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Bob')).toBeInTheDocument();
        expect(screen.getByText('🥇')).toBeInTheDocument();
    });

    it('shows loader while loading', async () => {
        (useWorkers as any).mockReturnValue({
            calculateLeaderboard: vi.fn(() => new Promise(() => {})),
        });
        await act(async () => {
            render(<CommunityPage />);
        });
        const spinner = document.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
    });

    it('shows error when loading fails', async () => {
        (useWorkers as any).mockReturnValue({
            calculateLeaderboard: vi.fn().mockRejectedValue(new Error('Load failed')),
        });
        await act(async () => {
            render(<CommunityPage />);
        });
        await screen.findByText('load_error');
    });
});