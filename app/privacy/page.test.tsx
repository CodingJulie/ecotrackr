// app/privacy/page.test.tsx
import { render, screen } from '@testing-library/react';
import PrivacyPage from './page';
import { describe, it, expect, vi } from 'vitest';

// Мок для next/link
vi.mock('next/link', () => ({
    default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Мок для компонентов shadcn/ui
vi.mock('@/components/ui/Button', () => ({
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));
vi.mock('@/components/ui/Card', () => ({
    Card: ({ children }: any) => <div data-testid="card">{children}</div>,
}));

describe('PrivacyPage', () => {
    it('рендерится корректно и соответствует снапшоту', async () => {
        const { container } = render(<PrivacyPage />);
        // \w не matches кириллицу (месяц вида "июля" отрендерен через
        // toLocaleDateString('ru-RU', { month: 'long' })), поэтому используем
        // \S+, который матчит любые не-пробельные символы, включая кириллицу.
        await screen.findByText(/last_updated \d{1,2} \S+ \d{4}/);
        expect(container).toMatchSnapshot();
    });

    it('отображает основные разделы', async () => {
        render(<PrivacyPage />);
        // Каждый из этих текстов встречается минимум дважды: один раз в
        // боковой навигации (sections) и один раз в заголовке h2 секции.
        expect(screen.getAllByText('privacy_policy').length).toBeGreaterThan(0);
        expect(screen.getAllByText('introduction').length).toBeGreaterThan(0);
        expect(screen.getAllByText('data_collection').length).toBeGreaterThan(0);
        expect(screen.getAllByText('data_usage').length).toBeGreaterThan(0);
        expect(screen.getAllByText('data_security').length).toBeGreaterThan(0);
        expect(screen.getAllByText('cookies').length).toBeGreaterThan(0);
        expect(screen.getAllByText('user_rights').length).toBeGreaterThan(0);
        expect(screen.getAllByText('contacts').length).toBeGreaterThan(0);
    });
});
