import { supabase } from '@/lib/supabase';

export const AVATAR_BUCKET = 'avatars';
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

export function validateAvatarFile(
    file: File
): { valid: true } | { valid: false; errorKey: string } {
    if (!AVATAR_MIME_TYPES.includes(file.type as (typeof AVATAR_MIME_TYPES)[number])) {
        return { valid: false, errorKey: 'avatar_invalid_type' };
    }
    if (file.size > AVATAR_MAX_BYTES) {
        return { valid: false, errorKey: 'avatar_too_large' };
    }
    return { valid: true };
}

function extensionFromMime(mime: string): string {
    if (mime === 'image/jpeg') return 'jpg';
    return mime.split('/')[1] || 'jpg';
}

/** Public URL with cache-bust query so the browser picks up replacements. */
export function withAvatarCacheBust(publicUrl: string): string {
    const url = new URL(publicUrl);
    url.searchParams.set('t', String(Date.now()));
    return url.toString();
}

export async function uploadUserAvatar(userId: string, file: File): Promise<string> {
    const validation = validateAvatarFile(file);
    if (!validation.valid) {
        throw new Error(validation.errorKey);
    }

    const ext = extensionFromMime(file.type);
    const path = `${userId}/avatar.${ext}`;

    // Remove previous avatar variants (different extensions) before upload
    const { data: existing } = await supabase.storage.from(AVATAR_BUCKET).list(userId);
    if (existing?.length) {
        await supabase.storage
            .from(AVATAR_BUCKET)
            .remove(existing.map((item) => `${userId}/${item.name}`));
    }

    const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: '3600',
    });

    if (error) throw error;

    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    return withAvatarCacheBust(data.publicUrl);
}

export async function removeUserAvatar(userId: string): Promise<void> {
    const { data: existing } = await supabase.storage.from(AVATAR_BUCKET).list(userId);
    if (!existing?.length) return;

    const { error } = await supabase.storage
        .from(AVATAR_BUCKET)
        .remove(existing.map((item) => `${userId}/${item.name}`));

    if (error) throw error;
}
