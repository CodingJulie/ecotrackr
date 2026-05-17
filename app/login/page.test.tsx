import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './page';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/supabase', () => ({
    supabase: {
        auth: {
            signInWithPassword: vi.fn(),
            getSession: vi.fn(),
        },
    },
}));

vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
}));

describe('LoginPage', () => {
    const mockPush = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useRouter as any).mockReturnValue({ push: mockPush });
        (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } });
    });

    it('logs in with valid credentials', async () => {
        const user = userEvent.setup();
        render(<LoginPage />);

        await screen.findByRole('heading', { name: /login_to_ecotrackr/i });

        await user.type(screen.getByLabelText(/email/i), 'test@test.com');
        await user.type(screen.getByLabelText(/password/i), 'password123');

        (supabase.auth.signInWithPassword as any).mockResolvedValue({
            data: { session: { user: { id: '1' } } },
            error: null,
        });

        await user.click(screen.getByRole('button', { name: /login/i }));

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/dashboard');
        });
    });

    it('shows error with invalid credentials', async () => {
        const user = userEvent.setup();
        render(<LoginPage />);

        await user.type(screen.getByLabelText(/email/i), 'wrong@test.com');
        await user.type(screen.getByLabelText(/password/i), 'wrong');

        (supabase.auth.signInWithPassword as any).mockResolvedValue({
            data: { session: null },
            error: new Error('Invalid credentials'),
        });

        await user.click(screen.getByRole('button', { name: /login/i }));

        await screen.findByText(/Invalid credentials/i);
    });

    it('shows a friendly message for network failures', async () => {
        const user = userEvent.setup();
        render(<LoginPage />);

        await user.type(screen.getByLabelText(/email/i), 'test@test.com');
        await user.type(screen.getByLabelText(/password/i), 'password123');

        (supabase.auth.signInWithPassword as any).mockRejectedValue(new Error('Load failed'));

        await user.click(screen.getByRole('button', { name: /login/i }));

        await screen.findByText(/auth_network_error/i);
    });
});