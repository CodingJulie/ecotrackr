import { describe, expect, it } from 'vitest';
import {
    cn,
    formatDate,
    groupByCategory,
    sumCo2e,
    formatCo2e,
    formatCo2eTons,
    computeMonthOverMonthReduction,
    sumCo2eForCalendarMonth,
    computeActivityStreak,
} from './utils';

describe('utils', () => {
    it('cn merges class names', () => {
        expect(cn('a', 'b')).toBe('a b');
        expect(cn('a', { b: true, c: false })).toBe('a b');
    });

    it('formatDate formats correctly', () => {
        const date = new Date('2025-06-28T12:00:00');
        expect(formatDate(date, 'ru')).toBe('28.06.2025');
        expect(formatDate(date, 'en')).toBe('06/28/2025');
    });

    it('groupByCategory groups entries', () => {
        const entries = [
            { category: 'transport', co2e: 10 },
            { category: 'food', co2e: 20 },
            { category: 'transport', co2e: 15 },
        ];
        const result = groupByCategory(entries);
        expect(result).toEqual({ transport: 25, food: 20 });
    });

    it('sumCo2e sums emissions', () => {
        expect(sumCo2e([{ co2e: 10.5 }, { co2e: 5.2 }, { co2e: null }])).toBe(15.7);
    });

    it('formatCo2e and formatCo2eTons format values', () => {
        expect(formatCo2e(1626.4)).toBe(
            (1626.4).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
        );
        expect(formatCo2eTons(1626400)).toBe('1,626.4');
    });

    it('sumCo2eForCalendarMonth sums only the target month', () => {
        const entries = [
            { co2e: 10, date: '2026-07-31' },
            { co2e: 20, date: '2026-08-01' },
            { co2e: 5, date: '2026-08-15' },
        ];
        expect(sumCo2eForCalendarMonth(entries, 2026, 7)).toBe(25);
        expect(sumCo2eForCalendarMonth(entries, 2026, 6)).toBe(10);
    });

    it('computeMonthOverMonthReduction computes calendar months', () => {
        const now = new Date(2026, 7, 2); // Aug 2026
        const result = computeMonthOverMonthReduction(
            [
                { co2e: 100, date: '2026-08-01' },
                { co2e: 200, date: '2026-07-10' },
            ],
            now
        );

        expect(result.kg).toBe(100);
        expect(result.percent).toBe(50);
    });

    it('computeMonthOverMonthReduction does not return negative reduction', () => {
        const now = new Date(2026, 7, 2);
        const result = computeMonthOverMonthReduction(
            [
                { co2e: 300, date: '2026-08-01' },
                { co2e: 100, date: '2026-07-10' },
            ],
            now
        );

        expect(result.kg).toBe(0);
        expect(result.percent).toBe(0);
    });

    it('computeActivityStreak counts consecutive days', () => {
        const now = new Date(2026, 7, 2);
        expect(
            computeActivityStreak(
                [
                    { co2e: 1, date: '2026-08-02' },
                    { co2e: 1, date: '2026-08-01' },
                    { co2e: 1, date: '2026-07-30' },
                ],
                now
            )
        ).toBe(2);
    });
});