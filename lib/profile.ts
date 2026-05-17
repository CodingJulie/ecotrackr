import { getSiteUrl } from '@/lib/site';
import { groupByCategory, parseEntryDate, sumCo2e } from '@/lib/utils';

export type ProfilePeriod = 'week' | 'month' | 'year' | 'all';

export const PROFILE_PERIODS: ProfilePeriod[] = ['week', 'month', 'year', 'all'];

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;
export const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$/;

export const RESERVED_USERNAMES = new Set([
    'admin',
    'api',
    'community',
    'dashboard',
    'login',
    'privacy',
    'profile',
    'register',
    'settings',
    'terms',
    'u',
    'www',
]);

export interface PublicProfile {
    id: string;
    name: string;
    username: string;
    avatar_url?: string | null;
}

export interface FootprintEntry {
    id?: string;
    co2e: number;
    date: string;
    category: string;
    activity?: string;
    value?: number;
}

export interface PublicProfileStats {
    totalCo2: number;
    entriesCount: number;
    treeLevel: number;
    co2Saved: number;
    byCategory: Record<string, number>;
}

export function normalizeUsername(raw: string): string {
    return raw.trim().toLowerCase().replace(/\s+/g, '-');
}

export function validateUsername(username: string): { valid: boolean; errorKey?: string } {
    const normalized = normalizeUsername(username);

    if (normalized.length < USERNAME_MIN) {
        return { valid: false, errorKey: 'username_too_short' };
    }

    if (normalized.length > USERNAME_MAX) {
        return { valid: false, errorKey: 'username_too_long' };
    }

    if (!USERNAME_PATTERN.test(normalized)) {
        return { valid: false, errorKey: 'username_invalid' };
    }

    if (RESERVED_USERNAMES.has(normalized)) {
        return { valid: false, errorKey: 'username_reserved' };
    }

    return { valid: true };
}

export function suggestUsernameFromName(name: string): string {
    const slug = normalizeUsername(name.replace(/[^a-zA-Z0-9\s_-]/g, '')).replace(
        /^[_-]+|[_-]+$/g,
        ''
    );
    if (slug.length >= USERNAME_MIN && USERNAME_PATTERN.test(slug)) {
        return slug.slice(0, USERNAME_MAX);
    }

    const fallback = normalizeUsername(`eco-${slug || 'user'}`);
    return fallback.slice(0, USERNAME_MAX);
}

export function parseProfilePeriod(value: string | null | undefined): ProfilePeriod {
    if (value && PROFILE_PERIODS.includes(value as ProfilePeriod)) {
        return value as ProfilePeriod;
    }

    return 'all';
}

export function getPeriodStart(period: ProfilePeriod): Date | null {
    if (period === 'all') return null;

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    if (period === 'week') start.setDate(start.getDate() - 7);
    if (period === 'month') start.setMonth(start.getMonth() - 1);
    if (period === 'year') start.setFullYear(start.getFullYear() - 1);

    return start;
}

export function filterEntriesByPeriod<T extends { date: string }>(
    entries: T[],
    period: ProfilePeriod
): T[] {
    const start = getPeriodStart(period);
    if (!start) return entries;

    return entries.filter((entry) => parseEntryDate(entry.date) >= start);
}

export function computePublicProfileStats(
    entries: FootprintEntry[],
    tree?: { tree_level?: number | null; total_co2_saved?: number | null } | null
): PublicProfileStats {
    return {
        totalCo2: Number(sumCo2e(entries).toFixed(1)),
        entriesCount: entries.length,
        treeLevel: tree?.tree_level ?? 0,
        co2Saved: Math.round(tree?.total_co2_saved ?? 0),
        byCategory: groupByCategory(entries),
    };
}

export function getPublicProfileUrl(
    username: string,
    period?: ProfilePeriod,
    origin?: string
): string {
    const base = (origin ?? getSiteUrl()).replace(/\/$/, '');
    const slug = normalizeUsername(username);
    const path = `/u/${encodeURIComponent(slug)}`;

    if (period && period !== 'all') {
        return `${base}${path}?period=${period}`;
    }

    return `${base}${path}`;
}

export function isUsernameTakenError(error: { code?: string; message?: string } | null): boolean {
    if (!error) return false;
    return error.code === '23505' || Boolean(error.message?.includes('profiles_username_key'));
}
