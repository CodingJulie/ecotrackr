import { describe, expect, it } from 'vitest';
import { aggregateCommunityForest, decorativeTreeHeight, expandCompletedTreesForDisplay, getForestLeaders } from './forest';

describe('aggregateCommunityForest', () => {
    it('counts only fully planted trees and CO₂ total', () => {
        expect(
            aggregateCommunityForest([
                { total_co2_saved: 400, trees_completed: 2 },
                { total_co2_saved: 120.4, trees_completed: 0 },
            ])
        ).toEqual({
            total_trees: 2,
            total_co2_saved: 520.4,
        });
    });

    it('returns zeros for empty forest', () => {
        expect(aggregateCommunityForest([])).toEqual({
            total_trees: 0,
            total_co2_saved: 0,
        });
    });
});

describe('getForestLeaders', () => {
    it('returns only users with planted trees', () => {
        const leaders = getForestLeaders([
            { user_id: '1', trees_completed: 2, total_co2_saved: 400 },
            { user_id: '2', trees_completed: 0, total_co2_saved: 800, tree_level: 5 },
            { user_id: '3', trees_completed: 1, total_co2_saved: 200 },
        ]);

        expect(leaders.map((leader) => leader.user_id)).toEqual(['1', '3']);
    });
});

describe('expandCompletedTreesForDisplay', () => {
    it('expands only completed trees', () => {
        expect(
            expandCompletedTreesForDisplay(
                [
                    { user_id: '1', tree_type: 'oak', trees_completed: 2 },
                    { user_id: '2', tree_type: 'pine', trees_completed: 0 },
                ],
                7
            )
        ).toEqual([
            { id: '1-0', user_id: '1', tree_type: 'oak' },
            { id: '1-1', user_id: '1', tree_type: 'oak' },
        ]);
    });
});

describe('decorativeTreeHeight', () => {
    it('is deterministic for a given index', () => {
        expect(decorativeTreeHeight(0)).toBe(decorativeTreeHeight(0));
        expect(decorativeTreeHeight(3)).toBeGreaterThanOrEqual(30);
        expect(decorativeTreeHeight(3)).toBeLessThan(90);
    });
});
