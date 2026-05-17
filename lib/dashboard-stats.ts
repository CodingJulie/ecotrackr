import {
  computeActivityStreak,
  computeMonthOverMonthReduction,
  sumCo2e,
  sumCo2eForCalendarMonth,
  type Co2Entry,
} from '@/lib/utils';

export const MONTHLY_GOAL_KG = 300;

export interface DashboardStats {
  totalCo2: number;
  thisMonthCo2: number;
  reductionKg: number;
  streak: number;
  goalProgress: number;
  monthlyGoalKg: number;
}

export function computeDashboardStats(
  entries: Co2Entry[],
  now: Date = new Date()
): DashboardStats {
  const totalCo2 = sumCo2e(entries);
  const thisMonthCo2 = sumCo2eForCalendarMonth(
    entries,
    now.getFullYear(),
    now.getMonth()
  );
  const { kg: reductionKg } = computeMonthOverMonthReduction(entries, now);
  const streak = computeActivityStreak(entries, now);
  const goalProgress = Math.min(
    100,
    Math.round((thisMonthCo2 / MONTHLY_GOAL_KG) * 100)
  );

  return {
    totalCo2,
    thisMonthCo2,
    reductionKg,
    streak,
    goalProgress,
    monthlyGoalKg: MONTHLY_GOAL_KG,
  };
}
