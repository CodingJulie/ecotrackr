import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPasswordPage from './page';
import { supabase } from '@/lib/supabase';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('ForgotPasswordPage', () => {
    // userEvent вставляет между действиями небольшие задержки на реальных таймерах.
    // Если включены fake timers, эти таймеры никогда не сработают сами по себе,
    // и `await user.type(...)` / `await user.click(...)` зависнут до истечения
    // testTimeout. Отключаем искусственную задержку через delay: null, чтобы
    // userEvent не полагался на реальные таймеры вовсе.
    const user = userEvent.setup({ delay: null });

    beforeEach(() => {
        vi.clearAllMocks();
        // Проблема: обычный vi.useFakeTimers() полностью останавливает часы —
        // они двигаются только по явному vi.advanceTimersByTime(). Но userEvent,
        // React-скедулер и многие UI-эффекты используют таймеры в фоне между
        // ожидаемыми (await) шагами — без "тика" часов эти операции зависают
        // навсегда. shouldAdvanceTime: true заставляет фейковые часы идти вперёд
        // synchronно с реальным временем (фоновые операции проходят нормально),
        // но при этом позволяет вручную "прыгнуть" вперёд для проверки cooldown.
        vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['setTimeout', 'clearTimeout'] });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('отправляет письмо для сброса пароля', async () => {
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

    it('показывает ошибку при неудаче', async () => {
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

    it('блокирует повторную отправку на 60 секунд (cooldown)', async () => {
        (supabase.auth.resetPasswordForEmail as any).mockResolvedValue({ error: null });

        await act(async () => {
            render(<ForgotPasswordPage />);
        });
        await screen.findByText('reset_password');

        await user.type(screen.getByLabelText('email'), 'test@example.com');
        await act(async () => {
            await user.click(screen.getByRole('button', { name: /send_link/i }));
        });

        // После успешной отправки компонент переключается на экран успеха
        // (форма с кнопкой send_link/cooldown_button исчезает насовсем).
        // Cooldown в этом состоянии отображается как текстовая подсказка
        // cooldown_message, а не как состояние кнопки.
        await screen.findByText('email_sent');
        expect(screen.getByText('cooldown_message')).toBeInTheDocument();

        act(() => { vi.advanceTimersByTime(61000); });
        await waitFor(() => {
            expect(screen.queryByText('cooldown_message')).not.toBeInTheDocument();
        });
    });
});
