import { describe, expect, it } from 'vitest';
import { computeDashboardStats, MONTHLY_GOAL_KG } from './dashboard-stats';

describe('computeDashboardStats', () => {
    const now = new Date(2026, 7, 2); // Aug 2026

    it('separates all-time and current month', () => {
        const stats = computeDashboardStats(
            [
                { co2e: 1000, date: '2026-06-15' },
                { co2e: 500, date: '2026-07-10' },
                { co2e: 40, date: '2026-08-01' },
            ],
            now
        );

        expect(stats.totalCo2).toBe(1540);
        expect(stats.thisMonthCo2).toBe(40);
        expect(stats.reductionKg).toBe(460); // July 500 - Aug 40
        expect(stats.goalProgress).toBe(Math.round((40 / MONTHLY_GOAL_KG) * 100));
    });

    it('does not show 100% goal from all-time footprint', () => {
        const stats = computeDashboardStats(
            [{ co2e: 1659.7, date: '2026-05-01' }],
            now
        );

        expect(stats.totalCo2).toBe(1659.7);
        expect(stats.thisMonthCo2).toBe(0);
        expect(stats.goalProgress).toBe(0);
    });

    it('counts consecutive-day streak', () => {
        const stats = computeDashboardStats(
            [
                { co2e: 1, date: '2026-08-02' },
                { co2e: 1, date: '2026-08-01' },
                { co2e: 1, date: '2026-07-31' },
                { co2e: 1, date: '2026-07-29' },
            ],
            now
        );

        expect(stats.streak).toBe(3);
    });
});
