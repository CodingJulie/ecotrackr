import { render, screen, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

// ✅ Мокаем framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => React.createElement('div', props, children),
    },
}));

// ✅ Мокаем lucide-react
vi.mock('lucide-react', () => ({
    Users: () => React.createElement('div', null, 'Users'),
    Trees: () => React.createElement('div', null, 'Trees'),
    Leaf: () => React.createElement('div', null, 'Leaf'),
    TrendingUp: () => React.createElement('div', null, 'TrendingUp'),
    Sparkles: () => React.createElement('div', null, 'Sparkles'),
    Loader2: () => React.createElement('div', null, 'Loader2'),
}));

// ✅ Мокаем react-i18next со стабильной ссылкой на t
const mockT = (key: string) => key;
const mockI18n = { language: 'ru', changeLanguage: vi.fn() };

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: mockT,
        i18n: mockI18n,
    }),
}));

// ✅ Мокаем supabase
vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
        auth: {
            getUser: vi.fn(),
        },
    },
}));

// ✅ Импортируем компонент после моков
import CommunityForest from './CommunityForest';
import { supabase } from '@/lib/supabase';

describe('CommunityForest', () => {
    const mockForest = {
        total_trees: 1234,
        total_co2_saved: 5678,
        last_updated: new Date().toISOString(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('отображает общую статистику леса', async () => {
        // ✅ Мокаем запрос к БД чтобы он ничего не возвращал (чтобы не было дополнительных эффектов)
        const mockLimit = vi.fn().mockResolvedValue({ data: [], error: null });
        const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
        const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });

        (supabase.from as any).mockReturnValue({ select: mockSelect });

        await act(async () => {
            render(<CommunityForest forestData={mockForest} />);
        });

        // ✅ Ждём появления заголовка
        await screen.findByText('community_forest');

        // ✅ Проверяем числа с запятыми
        expect(screen.getByText((content) => /1[,\s]?234/.test(content))).toBeInTheDocument();
        expect(screen.getByText((content) => /5[,\s]?678/.test(content))).toBeInTheDocument();

        const hectaresElements = screen.getAllByText(/hectares/i);
        expect(hectaresElements.length).toBeGreaterThan(0);
    });

    it('загружает и отображает топ-пользователей', async () => {
        const mockUsers = [
            { user_id: '1', tree_level: 5, total_co2_saved: 1000 },
            { user_id: '2', tree_level: 4, total_co2_saved: 800 },
        ];
        const mockProfiles = [
            { id: '1', name: 'Alice' },
            { id: '2', name: 'Bob' },
        ];

        // ✅ Создаём моки для цепочки методов
        const mockLimit = vi.fn().mockResolvedValue({ data: mockUsers, error: null });
        const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
        const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });

        const mockIn = vi.fn().mockResolvedValue({ data: mockProfiles, error: null });
        const mockSelectProfiles = vi.fn().mockReturnValue({ in: mockIn });

        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'user_trees') {
                return { select: mockSelect };
            }
            if (table === 'profiles') {
                return { select: mockSelectProfiles };
            }
            return { select: vi.fn().mockReturnThis() };
        });

        await act(async () => {
            render(<CommunityForest forestData={mockForest} />);
        });

        // ✅ Ждём появления лидеров
        await screen.findByText('forest_leaders');
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
        // Проверяем, что есть хотя бы один медальный символ
        expect(screen.getByText('🥇')).toBeInTheDocument();
    });

    it('показывает сообщение, если лес пуст', async () => {
        // ✅ Мокаем запрос к БД
        const mockLimit = vi.fn().mockResolvedValue({ data: [], error: null });
        const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
        const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });

        (supabase.from as any).mockReturnValue({ select: mockSelect });

        await act(async () => {
            render(<CommunityForest forestData={{ total_trees: 0, total_co2_saved: 0 }} />);
        });

        // ✅ Ждём появления сообщения о пустом лесе
        await screen.findByText('forest_empty');
        expect(screen.getByText('forest_empty_desc')).toBeInTheDocument();
    });
});