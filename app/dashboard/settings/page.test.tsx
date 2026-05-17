import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPage from './page';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('SettingsPage', () => {
    const mockPush = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useRouter as any).mockReturnValue({ push: mockPush });
        (supabase.auth.getUser as any).mockResolvedValue({
            data: { user: { id: '1', email: 'test@test.com' } },
            error: null,
        });
        const query = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: { name: 'Test User', username: '', is_public: false, avatar_url: null },
                error: null,
            }),
            update: vi.fn().mockResolvedValue({ error: null }),
            delete: vi.fn().mockResolvedValue({ error: null }),
        };
        (supabase.from as any).mockReturnValue(query);
    });

    it('loads profile and displays it', async () => {
        await act(async () => {
            render(<SettingsPage />);
        });
        await screen.findByText('Test User');
        expect(screen.getByDisplayValue('test@test.com')).toBeInTheDocument();
    });

    it('updates user name', async () => {
        const user = userEvent.setup();
        const mockUpdate = vi.fn().mockResolvedValue({ error: null });
        const query = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: { name: 'Test User', username: '', is_public: false, avatar_url: null },
                error: null,
            }),
            update: mockUpdate,
        };
        (supabase.from as any).mockReturnValue(query);

        await act(async () => {
            render(<SettingsPage />);
        });
        await screen.findByText('Test User');

        const nameInput = screen.getByLabelText('name');
        await user.clear(nameInput);
        await user.type(nameInput, 'New Name');

        const saveButton = screen.getByRole('button', { name: 'save_changes' });
        await act(async () => {
            await user.click(saveButton);
        });

        await waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith('profiles');
            expect(mockUpdate).toHaveBeenCalledWith({
                name: 'New Name',
                username: null,
                is_public: false,
            });
        });
    });

    it('changes password', async () => {
        const user = userEvent.setup();

        await act(async () => {
            render(<SettingsPage />);
        });
        await screen.findByText('Test User');

        await user.click(screen.getByRole('button', { name: 'security' }));

        await user.type(screen.getByLabelText('current_password'), 'oldpass');
        await user.type(screen.getByLabelText(/^new_password$/), 'newpass123');
        await user.type(screen.getByLabelText('confirm_new_password'), 'newpass123');

        (supabase.auth.signInWithPassword as any).mockResolvedValue({ data: { user: {} }, error: null });
        (supabase.auth.updateUser as any).mockResolvedValue({ error: null });

        await act(async () => {
            await user.click(screen.getByRole('button', { name: 'change_password_btn' }));
        });

        await screen.findByText('password_changed_success');
        expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'newpass123' });
    });

    it('logs out', async () => {
        const user = userEvent.setup();

        await act(async () => {
            render(<SettingsPage />);
        });
        await screen.findByText('Test User');

        await user.click(screen.getByRole('button', { name: 'security' }));
        const logoutButton = screen.getByRole('button', { name: 'sign_out' });

        await act(async () => {
            await user.click(logoutButton);
        });

        expect(supabase.auth.signOut).toHaveBeenCalled();
        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/login');
        });
    });
});