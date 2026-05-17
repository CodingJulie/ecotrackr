import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

let memorySession: Session | null = null;
let initialized = false;

export function resetAuthSessionCache(): void {
    memorySession = null;
    initialized = false;
}

/**
 * Keeps the last known auth session in memory so offline reads do not depend
 * on token refresh or another round-trip to Supabase Auth.
 */
export function initAuthSessionCache(): void {
    if (typeof window === 'undefined' || initialized) return;
    initialized = true;

    void supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) memorySession = session;
    });

    supabase.auth.onAuthStateChange((_event, session) => {
        memorySession = session;
    });
}

function getMemoryUser(): User | null {
    return memorySession?.user ?? null;
}

/**
 * Returns the authenticated user from local session state.
 * Avoids `getUser()` on the client — it validates over the network and can
 * clear the session when offline or when middleware already refreshed tokens.
 */
export async function getAuthUser(): Promise<User | null> {
    initAuthSessionCache();

    const memoryUser = getMemoryUser();
    if (memoryUser) return memoryUser;

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
        memorySession = session;
        return session.user;
    }

    return getMemoryUser();
}
