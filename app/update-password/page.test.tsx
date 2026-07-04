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
        // ВАЖНО: это простой объект-заглушка, а не настоящий jsdom Location —
        // он не добавляет "#" автоматически при присвоении hash, как это
        // делает браузер. Компонент делает window.location.hash.substring(1),
        // поэтому во всех тестах ниже значение hash ДОЛЖНО начинаться с "#",
        // иначе substring(1) отрежет первый символ реальных данных, а не "#",
        // и access_token не распознается (URLSearchParams получит "ccess_token").
        (supabase.auth.setSession as any).mockResolvedValue({ data: { user: { id: '1' } }, error: null });
        (supabase.auth.getSession as any).mockResolvedValue({
            data: { session: { user: { id: '1' } } },
            error: null,
        });
    });

    it('показывает лоадер при проверке токена', async () => {
        // Не оборачиваем render в `await act(async () => {...})`: это дождалось бы
        // завершения checkToken() (эффект внутри компонента), и isChecking уже
        // стал бы false к моменту проверки — лоадер физически нельзя было бы
        // поймать. render() сам оборачивает синхронную часть в act(), поэтому
        // сразу после него компонент ещё в состоянии "isChecking: true".
        render(<UpdatePasswordPage />);
        expect(screen.getByText('checking_link')).toBeInTheDocument();

        // Дожидаемся завершения асинхронной проверки токена, чтобы эффект
        // не "утёк" в следующий тест и не вызвал предупреждение act().
        await waitFor(() => {
            expect(supabase.auth.getSession).toHaveBeenCalled();
        });
    });

    it('показывает ошибку при невалидном токене', async () => {
        (supabase.auth.setSession as any).mockResolvedValue({ error: new Error('Invalid token') });
        window.location.hash = '#access_token=test&type=recovery';
        await act(async () => {
            render(<UpdatePasswordPage />);
        });
        await screen.findByText('invalid_link');
        expect(screen.getByText('request_new_link')).toBeInTheDocument();
    });

    it('показывает форму при валидном токене', async () => {
        window.location.hash = '#access_token=test&type=recovery';
        await act(async () => {
            render(<UpdatePasswordPage />);
        });
        await screen.findByText('new_password_desc');
        expect(screen.getByPlaceholderText('min_6_chars')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('repeat_new_password')).toBeInTheDocument();
    });

    it('обновляет пароль и перенаправляет на логин', async () => {
        const user = userEvent.setup({ delay: null });
        (supabase.auth.updateUser as any).mockResolvedValue({ error: null });
        (supabase.auth.signOut as any).mockResolvedValue({ error: null });

        // Компонент нарочно откладывает signOut()/redirect на 3 секунды после
        // успеха (чтобы пользователь успел увидеть экран "password_updated").
        // Реальные таймеры + дефолтный waitFor (~1с) никогда не дождутся этого —
        // нужны fake timers с shouldAdvanceTime, чтобы фоновая асинхронщина
        // (рендер, userEvent) отрабатывала нормально, а затем вручную
        // "перемотать" 3 секунды, чтобы отложенный код сработал.
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

        // Перематываем отложенный signOut()/redirect.
        act(() => { vi.advanceTimersByTime(3000); });
        await waitFor(() => {
            expect(supabase.auth.signOut).toHaveBeenCalled();
            expect(mockPush).toHaveBeenCalledWith('/login');
        });

        vi.useRealTimers();
    });

    it('показывает ошибку при коротком пароле', async () => {
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
