import { describe, expect, it, vi } from 'vitest';
import {
    computeCycleTreeState,
    computeTreeState,
    deriveTreeStatus,
    getTreeStageIcon,
    kgToNextLevel,
    MAX_TREE_LEVEL,
    plantNewTree,
    resolveTreeType,
    syncUserTree,
    updateUserTreeType,
} from './tree';

describe('computeTreeState', () => {
    it('returns level 1 with no entries', () => {
        expect(computeTreeState([])).toEqual({
            tree_level: 1,
            total_co2_saved: 0,
            current_progress: 0,
        });
    });

    it('accounts for emission gap between months', () => {
        const now = new Date(2026, 7, 2); // Aug 2026
        const result = computeTreeState(
            [
                { co2e: 400, date: '2026-06-10' },
                { co2e: 300, date: '2026-06-20' },
            ],
            now
        );

        // June 700 → July 0 (+700) → August 0 (+0) = 700 saved → level 5
        expect(result.total_co2_saved).toBe(700);
        expect(result.tree_level).toBe(MAX_TREE_LEVEL);
        expect(result.current_progress).toBe(100);
    });

    it('computes month-over-month reduction', () => {
        const now = new Date(2026, 7, 2);
        const result = computeTreeState(
            [
                { co2e: 200, date: '2026-06-01' },
                { co2e: 50, date: '2026-07-01' },
                { co2e: 20, date: '2026-08-01' },
            ],
            now
        );

        // 200→50 = 150, 50→20 = 30 → 180 saved → level 2, progress 80%
        expect(result.total_co2_saved).toBe(180);
        expect(result.tree_level).toBe(2);
        expect(result.current_progress).toBe(80);
    });
});

describe('computeCycleTreeState', () => {
    it('computes cycle progress relative to baseline', () => {
        const cycle = computeCycleTreeState(500, 400);
        expect(cycle.cycle_co2_saved).toBe(100);
        expect(cycle.tree_level).toBe(2);
        expect(cycle.current_progress).toBe(0);
    });

    it('does not go below zero when baseline exceeds lifetime', () => {
        const cycle = computeCycleTreeState(100, 200);
        expect(cycle.cycle_co2_saved).toBe(0);
        expect(cycle.tree_level).toBe(1);
    });
});

describe('kgToNextLevel', () => {
    it('computes remaining amount to next level', () => {
        expect(kgToNextLevel(0)).toBe(100);
        expect(kgToNextLevel(40)).toBe(60);
        expect(kgToNextLevel(400)).toBe(0);
    });
});

describe('resolveTreeType', () => {
    it('returns valid type or oak by default', () => {
        expect(resolveTreeType('cherry')).toBe('cherry');
        expect(resolveTreeType(null)).toBe('oak');
        expect(resolveTreeType('unknown')).toBe('oak');
    });
});

describe('getTreeStageIcon', () => {
    it('returns stage emoji by type and level', () => {
        expect(getTreeStageIcon('cherry', 1)).toBe('🍒');
        expect(getTreeStageIcon('cherry', 4)).toBe('🌸');
        expect(getTreeStageIcon(null, 1)).toBe('🌰');
    });
});

describe('deriveTreeStatus', () => {
    it('is growing while level is below maximum', () => {
        expect(deriveTreeStatus(3)).toBe('growing');
    });

    it('is ready_to_plant immediately at level 5', () => {
        expect(deriveTreeStatus(5)).toBe('ready_to_plant');
    });
});

describe('syncUserTree', () => {
    it('sets matured_at on first reach of level 5', async () => {
        const now = new Date(2026, 7, 2);
        const upsert = vi.fn().mockResolvedValue({ error: null });
        const client = { from: vi.fn().mockReturnValue({ upsert }) } as any;

        const tree = await syncUserTree(
            client,
            'u1',
            [
                { co2e: 400, date: '2026-06-10' },
                { co2e: 300, date: '2026-06-20' },
            ],
            null,
            now
        );

        expect(tree.tree_level).toBe(5);
        expect(tree.matured_at).toBe(now.toISOString());
        expect(tree.status).toBe('ready_to_plant');
        expect(upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                matured_at: now.toISOString(),
                trees_completed: 0,
                cycle_baseline_co2: 0,
            }),
            { onConflict: 'user_id' }
        );
    });
});

describe('plantNewTree', () => {
    it('resets cycle and increments trees_completed', async () => {
        const now = new Date(2026, 8, 2);
        const maturedAt = new Date(2026, 6, 1).toISOString();
        const eq = vi.fn().mockResolvedValue({ error: null });
        const update = vi.fn().mockReturnValue({ eq });
        const client = { from: vi.fn().mockReturnValue({ update }) } as any;

        const result = await plantNewTree(
            client,
            'u1',
            [
                { co2e: 400, date: '2026-06-10' },
                { co2e: 300, date: '2026-06-20' },
            ],
            {
                tree_type: 'cherry',
                tree_level: 5,
                total_co2_saved: 700,
                matured_at: maturedAt,
                cycle_baseline_co2: 0,
                trees_completed: 0,
            },
            now
        );

        expect(result.error).toBeNull();
        expect(result.tree?.trees_completed).toBe(1);
        expect(result.tree?.tree_level).toBe(1);
        expect(result.tree?.cycle_co2_saved).toBe(0);
        expect(result.tree?.matured_at).toBeNull();
        expect(result.tree?.status).toBe('growing');
        expect(update).toHaveBeenCalledWith(
            expect.objectContaining({
                trees_completed: 1,
                matured_at: null,
                cycle_baseline_co2: 700,
                tree_level: 1,
            })
        );
    });

    it('rejects planting until tree reaches level 5', async () => {
        const client = { from: vi.fn() } as any;

        const result = await plantNewTree(
            client,
            'u1',
            [{ co2e: 50, date: '2026-06-01' }],
            {
                matured_at: null,
                cycle_baseline_co2: 0,
                trees_completed: 0,
            },
            new Date(2026, 6, 15)
        );

        expect(result.error).toBe('not_ready_to_plant');
        expect(result.tree).toBeNull();
        expect(client.from).not.toHaveBeenCalled();
    });
});

describe('updateUserTreeType', () => {
    it('updates existing row', async () => {
        const maybeSingle = vi.fn().mockResolvedValue({ data: { user_id: 'u1' }, error: null });
        const select = vi.fn().mockReturnValue({ maybeSingle });
        const eq = vi.fn().mockReturnValue({ select });
        const update = vi.fn().mockReturnValue({ eq });
        const client = { from: vi.fn().mockReturnValue({ update }) } as any;

        const result = await updateUserTreeType(client, 'u1', 'cherry');

        expect(client.from).toHaveBeenCalledWith('user_trees');
        expect(update).toHaveBeenCalledWith({ tree_type: 'cherry' });
        expect(result).toEqual({ error: null });
    });

    it('creates row when it does not exist yet', async () => {
        const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
        const select = vi.fn().mockReturnValue({ maybeSingle });
        const eq = vi.fn().mockReturnValue({ select });
        const update = vi.fn().mockReturnValue({ eq });
        const upsert = vi.fn().mockResolvedValue({ error: null });
        const client = {
            from: vi.fn().mockReturnValue({ update, upsert }),
        } as any;

        const result = await updateUserTreeType(client, 'u1', 'palm');

        expect(upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                user_id: 'u1',
                tree_type: 'palm',
                tree_level: 1,
                total_co2_saved: 0,
            }),
            { onConflict: 'user_id' }
        );
        expect(result).toEqual({ error: null });
    });
});
