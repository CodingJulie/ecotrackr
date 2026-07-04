// vitest.setup.ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import React from 'react';

afterEach(() => {
    cleanup();
});

// Создаём объект запроса с цепочкой
const createMockQuery = () => {
    const query: any = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
    };
    return query;
};

vi.mock('@/lib/supabase', () => ({
    supabase: {
        auth: {
            getUser: vi.fn(),
            signInWithPassword: vi.fn(),
            signUp: vi.fn(),
            updateUser: vi.fn(),
            signOut: vi.fn(),
            getSession: vi.fn(),
            setSession: vi.fn(),
            resetPasswordForEmail: vi.fn(),
        },
        from: vi.fn(() => createMockQuery()),
    },
}));

// Мок next/navigation
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(() => ({
        push: vi.fn(),
        replace: vi.fn(),
        back: vi.fn(),
    })),
    usePathname: vi.fn(() => '/'),
    useSearchParams: vi.fn(() => new URLSearchParams()),
    useParams: vi.fn(() => ({})),
}));

// Мок react-i18next с обязательным language (стабильные ссылки — иначе [t] в deps → бесконечный цикл)
vi.mock('react-i18next', () => {
    const t = (key: string) => key;
    const i18n = {
        language: 'ru',
        changeLanguage: vi.fn(),
    };
    return {
        useTranslation: () => ({ t, i18n }),
    };
});

// Мок framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => React.createElement('div', props, children),
    },
}));

// Мок браузерных API
Object.defineProperty(window, 'alert', { value: vi.fn() });
Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });
Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
});