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
    it('normalizeUsername приводит строку к slug', () => {
        expect(normalizeUsername('  Julia Trif  ')).toBe('julia-trif');
        expect(normalizeUsername('Eco_User')).toBe('eco_user');
    });

    it('validateUsername проверяет формат и зарезервированные имена', () => {
        expect(validateUsername('ab').errorKey).toBe('username_too_short');
        expect(validateUsername('-bad').errorKey).toBe('username_invalid');
        expect(validateUsername('admin').errorKey).toBe('username_reserved');
        expect(validateUsername('julia_trif')).toEqual({ valid: true });
    });

    it('suggestUsernameFromName генерирует slug из имени', () => {
        expect(suggestUsernameFromName('Julia Trifonova')).toBe('julia-trifonova');
        expect(suggestUsernameFromName('A')).toMatch(/^eco-/);
    });

    it('parseProfilePeriod возвращает all по умолчанию', () => {
        expect(parseProfilePeriod(undefined)).toBe('all');
        expect(parseProfilePeriod('month')).toBe('month');
        expect(parseProfilePeriod('invalid')).toBe('all');
    });

    it('filterEntriesByPeriod фильтрует записи', () => {
        const now = new Date();
        const recent = new Date(now);
        recent.setDate(recent.getDate() - 2);
        const old = new Date(now);
        old.setMonth(old.getMonth() - 2);

        const entries = [
            { date: recent.toISOString(), co2e: 10 },
            { date: old.toISOString(), co2e: 20 },
        ];

        const filtered = filterEntriesByPeriod(entries, 'month');
        expect(filtered).toHaveLength(1);
        expect(filtered[0].co2e).toBe(10);
    });

    it('computePublicProfileStats считает агрегаты', () => {
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

    it('getPublicProfileUrl строит ссылку с period', () => {
        expect(getPublicProfileUrl('julia', 'month', 'https://ecotrackr.com')).toBe(
            'https://ecotrackr.com/u/julia?period=month'
        );
        expect(getPublicProfileUrl('julia', 'all', 'https://ecotrackr.com')).toBe(
            'https://ecotrackr.com/u/julia'
        );
    });
});
