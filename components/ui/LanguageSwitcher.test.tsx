import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('react-i18next', () => ({
    useTranslation: vi.fn(),
}));

describe('LanguageSwitcher', () => {
    const mockChangeLanguage = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useTranslation as any).mockReturnValue({
            i18n: {
                language: 'en',
                changeLanguage: mockChangeLanguage,
            },
        });
    });

    it('displays EN and RU buttons', () => {
        render(<LanguageSwitcher />);
        expect(screen.getByRole('button', { name: 'EN' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'RU' })).toBeInTheDocument();
    });

    it('active button has bg-emerald-600 class', () => {
        render(<LanguageSwitcher />);
        const enBtn = screen.getByRole('button', { name: 'EN' });
        expect(enBtn).toHaveClass('bg-emerald-600');
        expect(screen.getByRole('button', { name: 'RU' })).not.toHaveClass('bg-emerald-600');
    });

    it('switches language when RU is clicked', async () => {
        const user = userEvent.setup();
        render(<LanguageSwitcher />);
        await user.click(screen.getByRole('button', { name: 'RU' }));
        expect(mockChangeLanguage).toHaveBeenCalledWith('ru');
    });

    it('persists language in localStorage', async () => {
        const user = userEvent.setup();
        const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
        render(<LanguageSwitcher />);
        await user.click(screen.getByRole('button', { name: 'RU' }));
        expect(setItemSpy).toHaveBeenCalledWith('i18nextLng', 'ru');
    });
});