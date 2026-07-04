import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

// ✅ Мокаем framer-motion с AnimatePresence
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => React.createElement('div', props, children),
    },
    AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
    useAnimation: vi.fn(() => ({
        start: vi.fn(),
        stop: vi.fn(),
    })),
    useInView: vi.fn(() => true),
}));

// ✅ Мокаем lucide-react
vi.mock('lucide-react', () => ({
    Sparkles: () => React.createElement('div', null, 'Sparkles'),
    TrendingUp: () => React.createElement('div', null, 'TrendingUp'),
    Lightbulb: () => React.createElement('div', null, 'Lightbulb'),
    Heart: () => React.createElement('div', null, 'Heart'),
    RefreshCw: () => React.createElement('div', null, 'RefreshCw'),
    Leaf: () => React.createElement('div', null, 'Leaf'),
    AlertCircle: () => React.createElement('div', null, 'AlertCircle'),
}));

// ✅ Мокаем UI компоненты
vi.mock('@/components/ui/Card', () => ({
    Card: ({ children, ...props }: any) => React.createElement('div', { className: 'mock-card', ...props }, children),
    CardContent: ({ children, ...props }: any) => React.createElement('div', { className: 'mock-card-content', ...props }, children),
    CardHeader: ({ children, ...props }: any) => React.createElement('div', { className: 'mock-card-header', ...props }, children),
    CardTitle: ({ children, ...props }: any) => React.createElement('div', { className: 'mock-card-title', ...props }, children),
}));

vi.mock('@/components/ui/Button', () => ({
    Button: ({ children, ...props }: any) => React.createElement('button', props, children),
}));

vi.mock('@/components/ui/Badge', () => ({
    Badge: ({ children, ...props }: any) => React.createElement('span', { className: 'mock-badge', ...props }, children),
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
import AIInsights from './AIInsights';

// ✅ Мокаем глобальный fetch
global.fetch = vi.fn();

describe('AIInsights', () => {
    const mockEntries = [{ category: 'transport', activity: 'car', value: 10, co2e: 50, date: '2025-01-01' }];
    const totalCO2 = 50;

    beforeEach(() => {
        vi.clearAllMocks();
        (global.fetch as any).mockReset();
    });

    it('отображает инсайты после загрузки', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ insights: ['Совет 1', 'Совет 2', 'Совет 3', 'Совет 4'], model: 'gemini', cached: false }),
        });

        await act(async () => {
            render(<AIInsights entries={mockEntries} totalCO2={totalCO2} />);
        });

        await screen.findByText('Совет 1');
        expect(screen.getByText('Совет 2')).toBeInTheDocument();
    });

    it('показывает fallback-сообщения при отсутствии записей', async () => {
        await act(async () => {
            render(<AIInsights entries={[]} totalCO2={0} />);
        });

        await screen.findByText('no_data_insights');
        expect(screen.getByText('add_first_entries')).toBeInTheDocument();
    });

    it('обновляет инсайты по кнопке Refresh', async () => {
        const user = userEvent.setup();
        (global.fetch as any)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ insights: ['Старые советы'], model: 'gemini', cached: false }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ insights: ['Новые советы'], model: 'gemini', cached: false }),
            });

        await act(async () => {
            render(<AIInsights entries={mockEntries} totalCO2={totalCO2} />);
        });

        await screen.findByText('Старые советы');

        const refreshButton = screen.getByRole('button', { name: /refresh/i });
        await act(async () => {
            await user.click(refreshButton);
        });

        await screen.findByText('Новые советы');
    });

    it('обрабатывает ошибку API', async () => {
        (global.fetch as any).mockResolvedValue({ ok: false, status: 500 });

        await act(async () => {
            render(<AIInsights entries={mockEntries} totalCO2={totalCO2} />);
        });

        await screen.findByText('insights_error');
        expect(screen.getByText('keep_tracking')).toBeInTheDocument();
    });
});