import { describe, expect, it } from 'vitest';
import {
    computePublicProfileStats,
    filterEntriesByPeriod,
    getPublicProfileUrl,
    normalizeUsername,
    parseProfilePeriod,
    suggestUsernameFromName,
    validateUsername,
} from './profile';

describe('profile utils', () => {
    it('normalizeUsername converts string to slug', () => {
        expect(normalizeUsername('  Julie  ')).toBe('julie');
        expect(normalizeUsername('Eco_User')).toBe('eco_user');
    });

    it('validateUsername checks format and reserved names', () => {
        expect(validateUsername('ab').errorKey).toBe('username_too_short');
        expect(validateUsername('-bad').errorKey).toBe('username_invalid');
        expect(validateUsername('admin').errorKey).toBe('username_reserved');
        expect(validateUsername('julia_trif')).toEqual({ valid: true });
    });

    it('filterEntriesByPeriod filters entries', () => {
        const now = new Date();
        now.setHours(12, 0, 0, 0);

        const recent = new Date(now);
        recent.setDate(recent.getDate() - 2);
        const old = new Date(now);
        old.setMonth(old.getMonth() - 2);

        const toKey = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const entries = [
            { date: toKey(recent), co2e: 10 },
            { date: toKey(old), co2e: 20 },
        ];

        const filtered = filterEntriesByPeriod(entries, 'month');
        expect(filtered).toHaveLength(1);
        expect(filtered[0].co2e).toBe(10);
    });

    it('suggestUsernameFromName generates slug from name', () => {
        expect(suggestUsernameFromName('Julie')).toBe('julie');
        expect(suggestUsernameFromName('A')).toMatch(/^eco-/);
        expect(suggestUsernameFromName('  -ab-  ')).toMatch(/^eco-/);
    });

    it('parseProfilePeriod returns all by default', () => {
        expect(parseProfilePeriod(undefined)).toBe('all');
        expect(parseProfilePeriod('month')).toBe('month');
        expect(parseProfilePeriod('invalid')).toBe('all');
    });

    it('computePublicProfileStats computes aggregates', () => {
        const stats = computePublicProfileStats(
            [
                { co2e: 10, date: '2026-01-01', category: 'transport' },
                { co2e: 5, date: '2026-01-02', category: 'food' },
                { co2e: 3, date: '2026-01-03', category: 'transport' },
            ],
            { tree_level: 2, total_co2_saved: 12.4 }
        );

        expect(stats.totalCo2).toBe(18);
        expect(stats.entriesCount).toBe(3);
        expect(stats.treeLevel).toBe(2);
        expect(stats.co2Saved).toBe(12);
        expect(stats.byCategory).toEqual({ transport: 13, food: 5 });
    });

    it('getPublicProfileUrl builds URL with period', () => {
        expect(getPublicProfileUrl('julia', 'month', 'https://ecotrackr.com')).toBe(
            'https://ecotrackr.com/u/julia?period=month'
        );
        expect(getPublicProfileUrl('julia', 'all', 'https://ecotrackr.com')).toBe(
            'https://ecotrackr.com/u/julia'
        );
    });
});
