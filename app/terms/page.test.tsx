// app/terms/page.test.tsx
import { render, screen } from '@testing-library/react';
import TermsPage from './page';
import { describe, it, expect, vi } from 'vitest';

// Мок для next/link (уже есть в глобальных, но оставим для ясности)
vi.mock('next/link', () => ({
    default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Мок для компонентов shadcn/ui (если они используются и не замоканы глобально)
vi.mock('@/components/ui/Button', () => ({
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));
vi.mock('@/components/ui/Card', () => ({
    Card: ({ children }: any) => <div data-testid="card">{children}</div>,
}));

describe('TermsPage', () => {
    it('рендерится корректно и соответствует снапшоту', async () => {
        const { container } = render(<TermsPage />);
        // Ищем строку "last_updated" с датой (например, "last_updated 28 июня 2026").
        // \w не матчит кириллицу, поэтому используем \S+ (любые непробельные символы).
        await screen.findByText(/last_updated \d{1,2} \S+ \d{4}/);
        expect(container).toMatchSnapshot();
    });

    it('отображает основные разделы', async () => {
        render(<TermsPage />);
        // Каждый из этих текстов встречается несколько раз: в боковой навигации
        // (sections), в заголовке h1/хлебных крошках и/или в заголовке h2 секции.
        expect(screen.getAllByText('terms_of_use').length).toBeGreaterThan(0);
        expect(screen.getAllByText('general_provisions').length).toBeGreaterThan(0);
        expect(screen.getAllByText('obligations').length).toBeGreaterThan(0);
        expect(screen.getAllByText('liability').length).toBeGreaterThan(0);
        expect(screen.getAllByText('intellectual_property').length).toBeGreaterThan(0);
        expect(screen.getAllByText('termination').length).toBeGreaterThan(0);
        expect(screen.getAllByText('contacts').length).toBeGreaterThan(0);
    });
});