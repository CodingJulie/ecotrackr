import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UpdatePasswordPage from './page';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('UpdatePasswordPage', () => {
    const mockPush = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useRouter as any).mockReturnValue({ push: mockPush });
        Object.defineProperty(window, 'location', {
            value: { hash: '' },
            writable: true,
        });
        // Stub location is not a real jsdom Location — assigning hash does not
        // auto-prefix "#". Component uses hash.substring(1), so values must
        // start with "#" or the first char of access_token is stripped.
        (supabase.auth.setSession as any).mockResolvedValue({ data: { user: { id: '1' } }, error: null });
        (supabase.auth.getSession as any).mockResolvedValue({
            data: { session: { user: { id: '1' } } },
            error: null,
        });
    });

    it('shows loader while verifying token', async () => {
        // Do not await act around render: that would wait for checkToken() to
        // finish, so isChecking would already be false and the loader gone.
        // Synchronous render leaves the component still checking.
        render(<UpdatePasswordPage />);
        expect(screen.getByText('checking_link')).toBeInTheDocument();

        // Drain the async token check so it does not leak into the next test.
        await waitFor(() => {
            expect(supabase.auth.getSession).toHaveBeenCalled();
        });
    });

    it('shows error for invalid token', async () => {
        (supabase.auth.setSession as any).mockResolvedValue({ error: new Error('Invalid token') });
        window.location.hash = '#access_token=test&type=recovery';
        await act(async () => {
            render(<UpdatePasswordPage />);
        });
        await screen.findByText('invalid_link');
        expect(screen.getByText('request_new_link')).toBeInTheDocument();
    });

    it('shows form for valid token', async () => {
        window.location.hash = '#access_token=test&type=recovery';
        await act(async () => {
            render(<UpdatePasswordPage />);
        });
        await screen.findByText('new_password_desc');
        expect(screen.getByPlaceholderText('min_6_chars')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('repeat_new_password')).toBeInTheDocument();
    });

    it('updates password and redirects to login', async () => {
        const user = userEvent.setup({ delay: null });
        (supabase.auth.updateUser as any).mockResolvedValue({ error: null });
        (supabase.auth.signOut as any).mockResolvedValue({ error: null });

        // Component delays signOut/redirect by 3s after success. Fake timers
        // with shouldAdvanceTime keep userEvent/React working while we can
        // still advance past the delay manually.
        vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['setTimeout', 'clearTimeout'] });

        window.location.hash = '#access_token=test&type=recovery';
        await act(async () => {
            render(<UpdatePasswordPage />);
        });
        await screen.findByText('new_password_desc');

        await user.type(screen.getByPlaceholderText('min_6_chars'), 'newpass123');
        await user.type(screen.getByPlaceholderText('repeat_new_password'), 'newpass123');
        await act(async () => {
            await user.click(screen.getByRole('button', { name: 'save_password' }));
        });

        await screen.findByText('password_updated');
        expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'newpass123' });

        // Fast-forward the delayed signOut/redirect.
        act(() => { vi.advanceTimersByTime(3000); });
        await waitFor(() => {
            expect(supabase.auth.signOut).toHaveBeenCalled();
            expect(mockPush).toHaveBeenCalledWith('/login');
        });

        vi.useRealTimers();
    });

    it('shows error for short password', async () => {
        const user = userEvent.setup();
        window.location.hash = '#access_token=test&type=recovery';
        await act(async () => {
            render(<UpdatePasswordPage />);
        });
        await screen.findByText('new_password_desc');

        await user.type(screen.getByPlaceholderText('min_6_chars'), '123');
        await user.type(screen.getByPlaceholderText('repeat_new_password'), '123');
        await act(async () => {
            await user.click(screen.getByRole('button', { name: 'save_password' }));
        });

        await screen.findByText('password_min_length');
        expect(supabase.auth.updateUser).not.toHaveBeenCalled();
    });
});
