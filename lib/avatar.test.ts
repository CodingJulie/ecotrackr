import { describe, expect, it, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import {
    validateAvatarFile,
    withAvatarCacheBust,
    uploadUserAvatar,
    removeUserAvatar,
    AVATAR_MAX_BYTES,
} from './avatar';

describe('avatar utils', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('validateAvatarFile accepts jpeg/png/webp/gif within size limit', () => {
        const file = new File(['x'], 'a.png', { type: 'image/png' });
        expect(validateAvatarFile(file)).toEqual({ valid: true });
    });

    it('validateAvatarFile rejects invalid type', () => {
        const file = new File(['x'], 'a.pdf', { type: 'application/pdf' });
        expect(validateAvatarFile(file)).toEqual({
            valid: false,
            errorKey: 'avatar_invalid_type',
        });
    });

    it('validateAvatarFile rejects oversized file', () => {
        const big = new File([new Uint8Array(AVATAR_MAX_BYTES + 1)], 'a.png', {
            type: 'image/png',
        });
        expect(validateAvatarFile(big)).toEqual({
            valid: false,
            errorKey: 'avatar_too_large',
        });
    });

    it('withAvatarCacheBust adds t query param', () => {
        const result = withAvatarCacheBust('https://cdn.example.com/avatars/u/avatar.jpg');
        expect(result).toContain('t=');
        expect(result.startsWith('https://cdn.example.com/avatars/u/avatar.jpg?')).toBe(true);
    });

    it('uploadUserAvatar uploads file and returns public URL', async () => {
        const list = vi.fn().mockResolvedValue({ data: [], error: null });
        const remove = vi.fn().mockResolvedValue({ error: null });
        const upload = vi.fn().mockResolvedValue({ error: null });
        const getPublicUrl = vi.fn().mockReturnValue({
            data: { publicUrl: 'https://cdn.example.com/avatars/user-1/avatar.png' },
        });

        (supabase as any).storage = {
            from: vi.fn(() => ({ list, remove, upload, getPublicUrl })),
        };

        const file = new File(['img'], 'photo.png', { type: 'image/png' });
        const url = await uploadUserAvatar('user-1', file);

        expect(upload).toHaveBeenCalledWith(
            'user-1/avatar.png',
            file,
            expect.objectContaining({ upsert: true, contentType: 'image/png' })
        );
        expect(url).toContain('https://cdn.example.com/avatars/user-1/avatar.png');
        expect(url).toContain('t=');
    });

    it('removeUserAvatar deletes files in user folder', async () => {
        const list = vi.fn().mockResolvedValue({
            data: [{ name: 'avatar.jpg' }],
            error: null,
        });
        const remove = vi.fn().mockResolvedValue({ error: null });

        (supabase as any).storage = {
            from: vi.fn(() => ({ list, remove })),
        };

        await removeUserAvatar('user-1');
        expect(remove).toHaveBeenCalledWith(['user-1/avatar.jpg']);
    });
});
