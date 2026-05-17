import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '@/lib/supabase';
import { getAuthUser, initAuthSessionCache, resetAuthSessionCache } from '@/lib/auth-client';

describe('getAuthUser', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        resetAuthSessionCache();
    });

    it('returns user from getSession without calling getUser', async () => {
        const mockUser = { id: '123', email: 'test@test.com' };
        (supabase.auth.getSession as any).mockResolvedValue({
            data: { session: { user: mockUser } },
        });

        initAuthSessionCache();
        const user = await getAuthUser();

        expect(user).toEqual(mockUser);
        expect(supabase.auth.getUser).not.toHaveBeenCalled();
    });
});
