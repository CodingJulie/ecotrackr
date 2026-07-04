import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterPage from './page';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('RegisterPage', () => {
    const mockReplace = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useRouter as any).mockReturnValue({ replace: mockReplace, push: vi.fn() });
        (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } });
    });

    it('успешная регистрация', async () => {
        const user = userEvent.setup();
        (supabase.auth.signUp as any).mockResolvedValue({
            data: { user: { id: '1', email: 'test@example.com' } },
            error: null,
        });

        await act(async () => {
            render(<RegisterPage />);
        });
        await screen.findByText('create_account');

        await user.type(screen.getByLabelText('name'), 'Test User');
        await user.type(screen.getByLabelText('email'), 'test@example.com');
        await user.type(screen.getByLabelText(/^password$/), 'password123');
        await user.type(screen.getByLabelText('confirm_new_password'), 'password123');
        await user.click(screen.getByLabelText('agree_to_terms'));

        await act(async () => {
            await user.click(screen.getByRole('button', { name: 'register' }));
        });

        await screen.findByText('registration_success');
        expect(supabase.auth.signUp).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'password123',
            options: { data: { name: 'Test User' } },
        });
    });

    it('показывает ошибку при коротком пароле', async () => {
        const user = userEvent.setup();
        await act(async () => {
            render(<RegisterPage />);
        });
        await screen.findByText('create_account');

        await user.type(screen.getByLabelText('email'), 'test@example.com');
        await user.type(screen.getByLabelText(/^password$/), '123');
        await user.type(screen.getByLabelText('confirm_new_password'), '123');
        await user.click(screen.getByLabelText('agree_to_terms'));
        await act(async () => {
            await user.click(screen.getByRole('button', { name: 'register' }));
        });

        await screen.findByText('password_min_length');
    });

    it('показывает ошибку при несовпадении паролей', async () => {
        const user = userEvent.setup();
        await act(async () => {
            render(<RegisterPage />);
        });
        await screen.findByText('create_account');

        await user.type(screen.getByLabelText('email'), 'test@example.com');
        await user.type(screen.getByLabelText(/^password$/), 'password123');
        await user.type(screen.getByLabelText('confirm_new_password'), 'password456');
        await user.click(screen.getByLabelText('agree_to_terms'));
        await act(async () => {
            await user.click(screen.getByRole('button', { name: 'register' }));
        });

        await screen.findByText('passwords_do_not_match');
    });
});