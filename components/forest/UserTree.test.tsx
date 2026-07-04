import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import React from 'react';

// ✅ Мокаем framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => React.createElement('div', props, children),
    },
}));

// ✅ Мокаем lucide-react
vi.mock('lucide-react', () => ({
    Leaf: () => React.createElement('div', null, 'Leaf'),
    TrendingUp: () => React.createElement('div', null, 'TrendingUp'),
    Award: () => React.createElement('div', null, 'Award'),
    Sparkles: () => React.createElement('div', null, 'Sparkles'),
    Loader2: () => React.createElement('div', null, 'Loader2'),
}));

// ✅ Мокаем react-i18next со стабильной ссылкой
const mockT = (key: string) => key;
const mockI18n = { language: 'ru', changeLanguage: vi.fn() };

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: mockT,
        i18n: mockI18n,
    }),
}));

// ✅ Импортируем компонент после моков
import UserTree from './UserTree';

describe('UserTree', () => {
    const mockTree = {
        tree_type: 'oak',
        tree_level: 3,
        total_co2_saved: 150,
        current_progress: 60,
    };
    const mockEntries = [{ co2e: 10 }, { co2e: 20 }, { co2e: 30 }];

    it('отображает дерево пользователя', () => {
        render(<UserTree treeData={mockTree} entries={mockEntries} />);

        expect(screen.getByText('your_eco_tree')).toBeInTheDocument();

        // ✅ Ищем "Дуб" в любом текстовом содержимом
        expect(screen.getByText((content) => content.includes('Дуб'))).toBeInTheDocument();

        // ✅ Используем getAllByText для поиска всех иконок дерева
        const treeIcons = screen.getAllByText((content) => {
            return /[🌳🌿🌰🌸🍁🌴🎄]/.test(content);
        });
        expect(treeIcons.length).toBeGreaterThanOrEqual(2);

        expect(screen.getByText('level_progress')).toBeInTheDocument();
        expect(screen.getByText('to_next_level')).toBeInTheDocument();
        expect(screen.getByText('150')).toBeInTheDocument();
    });

    it('отображает уровень развития (Award)', () => {
        render(<UserTree treeData={mockTree} entries={mockEntries} />);
        expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('показывает лоадер, если treeData отсутствует', () => {
        render(<UserTree treeData={null} entries={[]} />);
        expect(screen.getByText('your_eco_tree')).toBeInTheDocument();
        // Дерево по умолчанию имеет уровень 1
        expect(screen.getByText('1')).toBeInTheDocument();
        // Иконка дуба по умолчанию - 🌰 (первая стадия)
        expect(screen.getByText('🌰')).toBeInTheDocument();
    });

    it('рассчитывает прогресс на основе записей', () => {
        const highEntries = Array(10).fill({ co2e: 100 });
        render(<UserTree treeData={mockTree} entries={highEntries} />);

        // Проверяем, что прогресс отображается
        expect(screen.getByText((content) => /to_next_level/.test(content))).toBeInTheDocument();
    });
});