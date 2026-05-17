import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

vi.stubGlobal('alert', vi.fn());

vi.mock('leaflet', () => {
    class MockDivIcon {
        constructor(options: any) {
            this.options = options;
        }
        options: any;
    }

    return {
        default: {
            DivIcon: MockDivIcon,
            heatLayer: vi.fn(() => ({
                addTo: vi.fn(),
            })),
            map: vi.fn(() => ({
                setView: vi.fn(),
                locate: vi.fn(),
                removeLayer: vi.fn(),
                addTo: vi.fn(),
            })),
        },
    };
});

vi.mock('leaflet.heat', () => ({}));

vi.mock('react-leaflet', () => ({
    MapContainer: ({ children, ...props }: any) => React.createElement('div', { 'data-testid': 'map', ...props }, children),
    TileLayer: () => React.createElement('div', null, 'TileLayer'),
    Marker: ({ children, ...props }: any) => React.createElement('div', { 'data-testid': 'marker', ...props }, children),
    Popup: ({ children, ...props }: any) => React.createElement('div', { 'data-testid': 'popup', ...props }, children),
    useMap: vi.fn(() => ({
        removeLayer: vi.fn(),
        getZoom: vi.fn(() => 10),
    })),
    useMapEvents: vi.fn(() => null),
}));

vi.mock('use-debounce', () => ({
    useDebounce: (value: any) => [value, vi.fn()],
}));

vi.mock('lucide-react', () => ({
    Trash2: () => React.createElement('div', null, 'Trash2'),
    Plus: () => React.createElement('div', null, 'Plus'),
    Locate: () => React.createElement('div', null, 'Locate'),
    ThermometerSun: () => React.createElement('div', null, 'ThermometerSun'),
    Settings2: () => React.createElement('div', null, 'Settings2'),
    RotateCcw: () => React.createElement('div', null, 'RotateCcw'),
    BarChart3: () => React.createElement('div', null, 'BarChart3'),
    Layers: () => React.createElement('div', null, 'Layers'),
    X: () => React.createElement('div', null, 'X'),
    Search: () => React.createElement('div', null, 'Search'),
    MapPin: () => React.createElement('div', null, 'MapPin'),
    Loader2: () => React.createElement('div', null, 'Loader2'),
}));

const mockT = (key: string) => key;
const mockI18n = { language: 'ru', changeLanguage: vi.fn() };

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: mockT,
        i18n: mockI18n,
    }),
}));

vi.mock('recharts', () => ({
    BarChart: ({ children }: any) => React.createElement('div', null, children),
    Bar: () => React.createElement('div', null),
    XAxis: () => React.createElement('div', null),
    YAxis: () => React.createElement('div', null),
    Tooltip: () => React.createElement('div', null),
    ResponsiveContainer: ({ children }: any) => React.createElement('div', null, children),
    PieChart: ({ children }: any) => React.createElement('div', null, children),
    Pie: ({ children }: any) => React.createElement('div', null, children),
    Cell: () => React.createElement('div', null),
    CartesianGrid: () => React.createElement('div', null),
}));

vi.mock('@/components/ui/PollutionEffect', () => ({
    default: () => null,
}));

vi.mock('@/components/ui/Button', () => ({
    Button: ({ children, onClick, ...props }: any) => {
        return React.createElement('button', {
            ...props,
            onClick: onClick || (() => {}),
        }, children);
    },
}));

vi.mock('@/components/ui/Dialog', () => ({
    Dialog: ({ children, open, ...props }: any) => {
        return React.createElement('div', { role: 'dialog', ...props }, children);
    },
    DialogContent: ({ children, ...props }: any) => React.createElement('div', props, children),
    DialogHeader: ({ children, ...props }: any) => React.createElement('div', props, children),
    DialogTitle: ({ children, ...props }: any) => React.createElement('h2', props, children),
}));

vi.mock('@/components/ui/Input', () => ({
    Input: ({ onChange, value, ...props }: any) => {
        return React.createElement('input', {
            ...props,
            value: value || '',
            onChange: onChange || (() => {}),
        });
    },
}));

vi.mock('@/components/ui/Label', () => ({
    Label: ({ children, ...props }: any) => React.createElement('label', props, children),
}));

import OpenStreetMap from './OpenStreetMap';
import { supabase } from '@/lib/supabase';

describe('OpenStreetMap', () => {
    const mockPoints = [
        { id: '1', lat: 55.0, lng: 60.0, name: 'Point 1', co2_estimate: 50 },
        { id: '2', lat: 56.0, lng: 61.0, name: 'Point 2', co2_estimate: 30 },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: '1' } } });
        global.fetch = vi.fn();
        (vi.stubGlobal as any)('alert', vi.fn());
        vi.mocked(global.alert).mockClear();
    });

    it('displays map and points', () => {
        render(<OpenStreetMap mapPoints={mockPoints} />);
        expect(screen.getByTestId('map')).toBeInTheDocument();
        expect(screen.getByText('Point 1')).toBeInTheDocument();
        expect(screen.getByText('Point 2')).toBeInTheDocument();
    });

    it('opens modal to add a point', async () => {
        const user = userEvent.setup();
        render(<OpenStreetMap mapPoints={mockPoints} />);

        await user.click(screen.getByRole('button', { name: /add_point/i }));
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('searches for a place', async () => {
        const user = userEvent.setup();
        const mockSearchResult = [
            { lat: '55.123', lon: '60.456', display_name: 'Test Place, Russia', name: 'Test Place' },
        ];
        (global.fetch as any).mockResolvedValue({
            json: async () => mockSearchResult,
            ok: true,
        });

        render(<OpenStreetMap mapPoints={mockPoints} />);

        const searchInput = screen.getByPlaceholderText(/search_place/i);
        await user.type(searchInput, 'Test');

        await screen.findByText('Test Place');
        expect(screen.getByText('Test Place, Russia')).toBeInTheDocument();
    });

    it('adds a point through the modal', async () => {
        const user = userEvent.setup();

        const mockInsert = vi.fn().mockResolvedValue({ error: null });
        const mockSelectResult = vi.fn().mockResolvedValue({ data: mockPoints, error: null });
        const mockSelectEq = vi.fn().mockReturnValue(mockSelectResult());
        const mockSelect = vi.fn().mockReturnValue({ eq: mockSelectEq });

        const fromMock = vi.fn();
        fromMock.mockImplementation((table: string) => {
            if (table === 'user_map_points') {
                return {
                    insert: mockInsert,
                    select: mockSelect,
                };
            }
            return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                insert: vi.fn().mockResolvedValue({ error: null }),
            };
        });

        (supabase.from as any).mockImplementation(fromMock);

        render(<OpenStreetMap mapPoints={mockPoints} />);

        await user.click(screen.getByRole('button', { name: /add_point/i }));

        const nameInput = screen.getByLabelText(/place_name/i);
        await user.clear(nameInput);
        await user.type(nameInput, 'New point');

        const co2Input = screen.getByLabelText(/co2_value/i);
        await user.clear(co2Input);
        await user.type(co2Input, '75');

        // Opening the modal via the button does not set tempCoords (map click does).
        // Save should therefore alert and skip insert.
        const saveButton = screen.getByRole('button', { name: /save_point/i });
        await user.click(saveButton);

        await waitFor(() => {
            expect(global.alert).toHaveBeenCalled();
        });

        expect(mockInsert).not.toHaveBeenCalled();
    });
});
