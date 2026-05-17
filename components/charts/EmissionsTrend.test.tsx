import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';

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

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: {
            language: 'ru',
        },
    }),
}));

vi.mock('lucide-react', () => ({
    TrendingUp: () => <div>TrendingUp</div>,
    AlertCircle: () => <div>AlertCircle</div>,
    Loader2: () => <div>Loader2</div>,
}));

import EmissionsTrend from './EmissionsTrend';

describe('EmissionsTrend', () => {
    const mockEntries = [
        { date: '2025-01-01', co2e: 10, is_auto_generated: false },
        { date: '2025-01-02', co2e: 20, is_auto_generated: true },
        { date: '2025-01-03', co2e: 15, is_auto_generated: false },
    ];

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('displays chart with data', async () => {
        render(<EmissionsTrend entries={mockEntries} />);

        await waitFor(() => {
            expect(screen.getByText('emissions_trend_kg')).toBeInTheDocument();
            expect(screen.getByText(/trend_line_note/)).toBeInTheDocument();
        });
    });

    it('shows message when data is empty', async () => {
        render(<EmissionsTrend entries={[]} />);

        await waitFor(() => {
            expect(screen.getByText('no_data_to_display')).toBeInTheDocument();
        });
    });

    it('shows message when data is null', async () => {
        render(<EmissionsTrend entries={null as any} />);

        await waitFor(() => {
            expect(screen.getByText('no_data_to_display')).toBeInTheDocument();
        });
    });

    it('groups entries by date correctly', async () => {
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
