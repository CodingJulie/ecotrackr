import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPasswordPage from './page';
import { supabase } from '@/lib/supabase';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('ForgotPasswordPage', () => {
    // userEvent inserts delays on real timers; with fake timers those never
    // fire and type/click hang until testTimeout. delay: null skips that.
    const user = userEvent.setup({ delay: null });

    beforeEach(() => {
        vi.clearAllMocks();
        // Plain useFakeTimers freezes the clock unless advanced manually.
        // shouldAdvanceTime lets background timers (userEvent, React) run
        // while still allowing a manual jump for cooldown assertions.
        vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['setTimeout', 'clearTimeout'] });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('sends password reset email', async () => {
        (supabase.auth.resetPasswordForEmail as any).mockResolvedValue({ error: null });

        await act(async () => {
            render(<ForgotPasswordPage />);
        });
        await screen.findByText('reset_password');

        await user.type(screen.getByLabelText('email'), 'test@example.com');
        await act(async () => {
            await user.click(screen.getByRole('button', { name: /send_link/i }));
        });

        await screen.findByText('email_sent');
        expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
            'test@example.com',
            expect.objectContaining({ redirectTo: expect.stringContaining('/update-password') })
        );
    });

    it('shows error on failure', async () => {
        (supabase.auth.resetPasswordForEmail as any).mockResolvedValue({
            error: new Error('User not found'),
        });

        await act(async () => {
            render(<ForgotPasswordPage />);
        });
        await screen.findByText('reset_password');

        await user.type(screen.getByLabelText('email'), 'test@example.com');
        await act(async () => {
            await user.click(screen.getByRole('button', { name: /send_link/i }));
        });

        await screen.findByText('User not found');
    });

    it('blocks resend for 60 seconds (cooldown)', async () => {
        (supabase.auth.resetPasswordForEmail as any).mockResolvedValue({ error: null });

        await act(async () => {
            render(<ForgotPasswordPage />);
        });
        await screen.findByText('reset_password');

        await user.type(screen.getByLabelText('email'), 'test@example.com');
        await act(async () => {
            await user.click(screen.getByRole('button', { name: /send_link/i }));
        });

        // After success the form is replaced; cooldown shows as cooldown_message text.
        await screen.findByText('email_sent');
        expect(screen.getByText('cooldown_message')).toBeInTheDocument();

        act(() => { vi.advanceTimersByTime(61000); });
        await waitFor(() => {
            expect(screen.queryByText('cooldown_message')).not.toBeInTheDocument();
        });
    });
});
