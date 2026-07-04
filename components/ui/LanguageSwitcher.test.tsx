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

    it('отображает кнопки EN и RU', () => {
        render(<LanguageSwitcher />);
        expect(screen.getByRole('button', { name: 'EN' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'RU' })).toBeInTheDocument();
    });

    it('активная кнопка имеет класс bg-emerald-600', () => {
        render(<LanguageSwitcher />);
        const enBtn = screen.getByRole('button', { name: 'EN' });
        expect(enBtn).toHaveClass('bg-emerald-600');
        expect(screen.getByRole('button', { name: 'RU' })).not.toHaveClass('bg-emerald-600');
    });

    it('переключает язык при клике на RU', async () => {
        const user = userEvent.setup();
        render(<LanguageSwitcher />);
        await user.click(screen.getByRole('button', { name: 'RU' }));
        expect(mockChangeLanguage).toHaveBeenCalledWith('ru');
    });

    it('сохраняет язык в localStorage', async () => {
        const user = userEvent.setup();
        const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
        render(<LanguageSwitcher />);
        await user.click(screen.getByRole('button', { name: 'RU' }));
        expect(setItemSpy).toHaveBeenCalledWith('i18nextLng', 'ru');
    });
});