import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** `ru` → dd.mm.yyyy; otherwise en-US. */
export function formatDate(date: Date, locale: string = 'ru'): string {
  return date.toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function groupByCategory(
    entries: { category: string; co2e: number }[]
): Record<string, number> {
  return entries.reduce((acc, entry) => {
    acc[entry.category] = (acc[entry.category] || 0) + entry.co2e;
    return acc;
  }, {} as Record<string, number>);
}

export interface Co2Entry {
  co2e?: number | null;
  date?: string;
}

/**
 * Parses an entry date (YYYY-MM-DD) as a local calendar day.
 * Avoids the UTC day-shift from `new Date('YYYY-MM-DD')`.
 */
export function parseEntryDate(dateStr: string): Date {
  const [year, month, day] = dateStr.slice(0, 10).split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function monthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function sumCo2e(entries: Co2Entry[]): number {
  return entries.reduce((sum, entry) => sum + (entry.co2e || 0), 0);
}

export function sumCo2eForCalendarMonth(
  entries: Co2Entry[],
  year: number,
  monthIndex: number
): number {
  return entries.reduce((sum, entry) => {
    if (!entry.date) return sum;
    const date = parseEntryDate(entry.date);
    if (date.getFullYear() === year && date.getMonth() === monthIndex) {
      return sum + (entry.co2e || 0);
    }
    return sum;
  }, 0);
}

export function formatCo2e(value: number, decimals = 1): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatCo2eTons(valueKg: number, decimals = 1): string {
  return formatCo2e(valueKg / 1000, decimals);
}

export function computeMonthOverMonthReduction(
  entries: Co2Entry[],
  now: Date = new Date()
): { kg: number; percent: number | null } {
  const currentTotal = sumCo2eForCalendarMonth(
    entries,
    now.getFullYear(),
    now.getMonth()
  );
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthTotal = sumCo2eForCalendarMonth(
    entries,
    prev.getFullYear(),
    prev.getMonth()
  );

  if (prevMonthTotal <= 0) {
    return { kg: 0, percent: null };
  }

  const delta = prevMonthTotal - currentTotal;
  const kg = Math.max(0, delta);
  const percent = Math.round((delta / prevMonthTotal) * 100);

  return { kg, percent: Math.max(0, percent) };
}

/**
 * Streak of consecutive days with entries (ending today or yesterday).
 */
export function computeActivityStreak(
  entries: Co2Entry[],
  now: Date = new Date()
): number {
  const days = new Set(
    entries
      .filter((entry): entry is Co2Entry & { date: string } => Boolean(entry.date))
      .map((entry) => entry.date.slice(0, 10))
  );

  if (days.size === 0) return 0;

  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!days.has(toLocalDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (days.has(toLocalDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
