import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

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

vi.mock('lucide-react', () => ({
    Sparkles: () => React.createElement('div', null, 'Sparkles'),
    TrendingUp: () => React.createElement('div', null, 'TrendingUp'),
    Lightbulb: () => React.createElement('div', null, 'Lightbulb'),
    Heart: () => React.createElement('div', null, 'Heart'),
    RefreshCw: () => React.createElement('div', null, 'RefreshCw'),
    Leaf: () => React.createElement('div', null, 'Leaf'),
    AlertCircle: () => React.createElement('div', null, 'AlertCircle'),
}));

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

// Stable t/i18n refs so useTranslation does not trigger extra re-renders.
const mockT = (key: string) => key;
const mockI18n = {
    language: 'ru',
    t: (key: string, options?: { lng?: string }) => `${options?.lng ?? mockI18n.language}:${key}`,
    changeLanguage: vi.fn(),
};

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: mockT,
        i18n: mockI18n,
    }),
}));

import AIInsights from './AIInsights';

global.fetch = vi.fn();

describe('AIInsights', () => {
    const mockEntries = [{ category: 'transport', activity: 'car', value: 10, co2e: 50, date: '2025-01-01' }];
    const totalCO2 = 50;

    beforeEach(() => {
        vi.clearAllMocks();
        (global.fetch as any).mockReset();
        mockI18n.language = 'ru';
    });

    it('displays insights after loading', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ insights: ['Tip 1', 'Tip 2', 'Tip 3', 'Tip 4'], model: 'gemini', cached: false }),
        });

        await act(async () => {
            render(<AIInsights entries={mockEntries} totalCO2={totalCO2} />);
        });

        await screen.findByText('Tip 1');
        expect(screen.getByText('Tip 2')).toBeInTheDocument();
    });

    it('shows fallback messages when there are no entries', async () => {
        await act(async () => {
            render(<AIInsights entries={[]} totalCO2={0} />);
        });

        await screen.findByText('ru:no_data_insights');
        expect(screen.getByText('ru:add_first_entries')).toBeInTheDocument();
    });

    it('refreshes insights when Refresh is clicked', async () => {
        const user = userEvent.setup();
        (global.fetch as any)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ insights: ['Old tips'], model: 'gemini', cached: false }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ insights: ['New tips'], model: 'gemini', cached: false }),
            });

        await act(async () => {
            render(<AIInsights entries={mockEntries} totalCO2={totalCO2} />);
        });

        await screen.findByText('Old tips');

        const refreshButton = screen.getByRole('button', { name: /refresh/i });
        await act(async () => {
            await user.click(refreshButton);
        });

        await screen.findByText('New tips');
    });

    it('handles API error', async () => {
        (global.fetch as any).mockResolvedValue({ ok: false, status: 500 });

        await act(async () => {
            render(<AIInsights entries={mockEntries} totalCO2={totalCO2} />);
        });

        await screen.findByText('ru:insights_error');
        expect(screen.getByText('ru:keep_tracking')).toBeInTheDocument();
    });

    it('makes one auto-request when language changes', async () => {
        mockI18n.language = 'en';
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ insights: ['Tip 1', 'Tip 2', 'Tip 3', 'Tip 4'], model: 'gemini', cached: false }),
        });

        const { rerender } = render(<AIInsights entries={mockEntries} totalCO2={totalCO2} />);
        await screen.findByText('Tip 1');
        expect(global.fetch).toHaveBeenCalledTimes(1);

        await act(async () => {
            mockI18n.language = 'ru';
            rerender(<AIInsights entries={mockEntries} totalCO2={totalCO2} />);
        });

        expect(global.fetch).toHaveBeenCalledTimes(2);
    });
});
