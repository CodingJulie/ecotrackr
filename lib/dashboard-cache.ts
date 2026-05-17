import type { User } from '@supabase/supabase-js';
import type {
    DashboardData,
    DashboardEntry,
    DashboardMapPoint,
    DashboardProfile,
} from '@/hooks/useDashboardData';
import type { TreeState } from '@/lib/tree';

const CACHE_PREFIX = 'ecotrackr_dashboard_';

interface CachedDashboardPayload {
    entries: DashboardEntry[];
    mapPoints: DashboardMapPoint[];
    user: Pick<User, 'id' | 'email'>;
    profile: DashboardProfile | null;
    tree: TreeState;
    savedAt: string;
}

function cacheKey(userId: string): string {
    return `${CACHE_PREFIX}${userId}`;
}

export function saveDashboardCache(data: DashboardData): void {
    if (typeof window === 'undefined') return;

    const payload: CachedDashboardPayload = {
        entries: data.entries,
        mapPoints: data.mapPoints,
        user: { id: data.user.id, email: data.user.email },
        profile: data.profile,
        tree: data.tree,
        savedAt: new Date().toISOString(),
    };

    try {
        localStorage.setItem(cacheKey(data.user.id), JSON.stringify(payload));
    } catch (err) {
        console.error('Failed to save dashboard cache:', err);
    }
}

export function loadDashboardCache(userId: string): DashboardData | null {
    if (typeof window === 'undefined') return null;

    try {
        const raw = localStorage.getItem(cacheKey(userId));
        if (!raw) return null;

        const payload = JSON.parse(raw) as CachedDashboardPayload;
        return {
            entries: payload.entries,
            mapPoints: payload.mapPoints,
            user: payload.user as User,
            profile: payload.profile,
            tree: payload.tree,
        };
    } catch (err) {
        console.error('Failed to load dashboard cache:', err);
        return null;
    }
}

export function loadAnyDashboardCache(): DashboardData | null {
    if (typeof window === 'undefined') return null;

    try {
        for (let index = 0; index < localStorage.length; index += 1) {
            const key = localStorage.key(index);
            if (!key?.startsWith(CACHE_PREFIX)) continue;

            const userId = key.slice(CACHE_PREFIX.length);
            const cached = loadDashboardCache(userId);
            if (cached) return cached;
        }
    } catch (err) {
        console.error('Failed to scan dashboard cache:', err);
    }

    return null;
}
