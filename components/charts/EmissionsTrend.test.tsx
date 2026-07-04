import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';

// ✅ Мокаем recharts
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    LineChart: ({ children }: any) => <div>{children}</div>,
    Line: () => <div />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    Tooltip: () => <div />,
    CartesianGrid: () => <div />,
    Legend: () => <div />,
}));

// ✅ Мокаем react-i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: {
            language: 'ru',
        },
    }),
}));

// ✅ Мокаем lucide-react
vi.mock('lucide-react', () => ({
    TrendingUp: () => <div>TrendingUp</div>,
    AlertCircle: () => <div>AlertCircle</div>,
    Loader2: () => <div>Loader2</div>,
}));

// ✅ Импортируем компонент после моков
import EmissionsTrend from './EmissionsTrend';

describe('EmissionsTrend', () => {
    const mockEntries = [
        { date: '2025-01-01', co2e: 10, is_auto_generated: false },
        { date: '2025-01-02', co2e: 20, is_auto_generated: true },
        { date: '2025-01-03', co2e: 15, is_auto_generated: false },
    ];

    // ✅ Очищаем все моки после каждого теста
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('отображает график с данными', async () => {
        render(<EmissionsTrend entries={mockEntries} />);

        // ✅ Ждём появления заголовка
        await waitFor(() => {
            expect(screen.getByText('emissions_trend_kg')).toBeInTheDocument();
        });

        expect(screen.getByText('overall_trend')).toBeInTheDocument();
        expect(screen.getByText('your_entries')).toBeInTheDocument();
        expect(screen.getByText('auto_generation')).toBeInTheDocument();
    });

    it('показывает сообщение при отсутствии данных', async () => {
        render(<EmissionsTrend entries={[]} />);

        await waitFor(() => {
            expect(screen.getByText('no_data_to_display')).toBeInTheDocument();
        });
    });

    it('показывает сообщение при null данных', async () => {
        render(<EmissionsTrend entries={null as any} />);

        await waitFor(() => {
            expect(screen.getByText('no_data_to_display')).toBeInTheDocument();
        });
    });

    it('корректно группирует записи по датам', async () => {
        const entriesWithSameDate = [
            { date: '2025-01-01', co2e: 10, is_auto_generated: false },
            { date: '2025-01-01', co2e: 5, is_auto_generated: true },
            { date: '2025-01-02', co2e: 20, is_auto_generated: false },
        ];

        render(<EmissionsTrend entries={entriesWithSameDate} />);

        await waitFor(() => {
            expect(screen.getByText('emissions_trend_kg')).toBeInTheDocument();
        });
    });
});