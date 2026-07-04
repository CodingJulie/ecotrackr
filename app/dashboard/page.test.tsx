import { render, screen } from '@testing-library/react';
import DashboardPage from './page';
import { useDashboardData } from '@/hooks/useDashboardData';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/hooks/useDashboardData', () => ({
    useDashboardData: vi.fn(),
}));

vi.mock('@/components/calculator/CO2Calculator', () => ({
    default: () => <div>CO2Calculator</div>,
}));
vi.mock('@/components/insights/AIInsights', () => ({
    default: () => <div>AIInsights</div>,
}));
vi.mock('@/components/charts/EmissionsTrend', () => ({
    default: () => <div>EmissionsTrend</div>,
}));
vi.mock('@/components/maps/OpenStreetMap', () => ({
    default: () => <div>OpenStreetMap</div>,
}));
vi.mock('@/components/forest/UserTree', () => ({
    default: () => <div>UserTree</div>,
}));
vi.mock('@/components/forest/CommunityForest', () => ({
    default: () => <div>CommunityForest</div>,
}));
vi.mock('@/components/dashboard/AutoGenerationWidget', () => ({
    default: () => <div>AutoGenerationWidget</div>,
}));

describe('DashboardPage', () => {
    const mockData = {
        entries: [{ id: '1', co2e: 10, date: '2025-01-01' }, { id: '2', co2e: 20, date: '2025-01-02' }],
        mapPoints: [],
        user: { id: '1' },
        profile: { name: 'Test' },
        tree: { tree_level: 2 },
        forest: { total_trees: 100 },
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('показывает лоадер во время загрузки', () => {
        (useDashboardData as any).mockReturnValue({ data: null, loading: true, error: null });
        render(<DashboardPage />);
        expect(screen.getByText('main_loader_title')).toBeInTheDocument();
    });

    it('показывает ошибку при неудаче', () => {
        (useDashboardData as any).mockReturnValue({ data: null, loading: false, error: 'Ошибка' });
        render(<DashboardPage />);
        expect(screen.getByText(/Ошибка/)).toBeInTheDocument();
    });

    it('рендерит дашборд с данными', async () => {
        (useDashboardData as any).mockReturnValue({ data: mockData, loading: false, error: null });
        render(<DashboardPage />);
        expect(screen.getByText('welcome_back')).toBeInTheDocument();
        expect(screen.getByText(/30 kg/i)).toBeInTheDocument();
        // Эти компоненты загружаются через next/dynamic (ssr: false), поэтому
        // даже с замоканными модулями они появляются асинхронно — нужен findBy*.
        expect(await screen.findByText('AutoGenerationWidget')).toBeInTheDocument();
        expect(await screen.findByText('UserTree')).toBeInTheDocument();
        expect(await screen.findByText('CommunityForest')).toBeInTheDocument();
        expect(await screen.findByText('EmissionsTrend')).toBeInTheDocument();
        expect(await screen.findByText('OpenStreetMap')).toBeInTheDocument();
        expect(await screen.findByText('AIInsights')).toBeInTheDocument();
        expect(await screen.findByText('CO2Calculator')).toBeInTheDocument();
    });
});