const PLACEHOLDER_SUPABASE_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_SUPABASE_KEY = 'placeholder-key';

function trimEnv(value: string | undefined): string | undefined {
    const trimmed = value?.trim();
    return trimmed || undefined;
}

export function getSupabaseUrl(): string {
    // Must reference NEXT_PUBLIC_* directly so Next.js inlines values in client bundles.
    const url = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
    if (!url) return PLACEHOLDER_SUPABASE_URL;

    try {
        new URL(url);
        return url;
    } catch {
        return PLACEHOLDER_SUPABASE_URL;
    }
}

export function getSupabaseAnonKey(): string {
    return trimEnv(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ?? PLACEHOLDER_SUPABASE_KEY;
}

export function isSupabaseConfigured(): boolean {
    const url = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const key = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
    if (!url || !key) return false;

    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}
