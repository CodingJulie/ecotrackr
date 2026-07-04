import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

// ✅ Мокаем framer-motion с AnimatePresence
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => React.createElement('div', props, children),
        button: ({ children, ...props }: any) => React.createElement('button', props, children),
        span: ({ children, ...props }: any) => React.createElement('span', props, children),
    },
    AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
    useAnimation: vi.fn(() => ({
        start: vi.fn(),
        stop: vi.fn(),
    })),
    useInView: vi.fn(() => true),
    useMotionValue: vi.fn(() => ({ get: vi.fn(), set: vi.fn() })),
    useTransform: vi.fn(() => ({ get: vi.fn() })),
    useSpring: vi.fn(() => ({ get: vi.fn() })),
    useScroll: vi.fn(() => ({ scrollY: { get: vi.fn() } })),
    useTime: vi.fn(() => ({ get: vi.fn() })),
    useCycle: vi.fn(() => [true, vi.fn()]),
    usePresence: vi.fn(() => [true, vi.fn()]),
    MotionConfig: ({ children }: any) => children,
    LazyMotion: ({ children }: any) => children,
    domAnimation: {},
    domMax: {},
}));

// ✅ Мокаем lucide-react
vi.mock('lucide-react', () => ({
    RefreshCw: () => <div>RefreshCw</div>,
    Leaf: () => <div>Leaf</div>,
    Loader2: () => <div>Loader2</div>,
    Settings2: () => <div>Settings2</div>,
    TrendingUp: () => <div>TrendingUp</div>,
    Car: () => <div>Car</div>,
    Home: () => <div>Home</div>,
    Utensils: () => <div>Utensils</div>,
    Zap: () => <div>Zap</div>,
    Calendar: () => <div>Calendar</div>,
    ChevronDownIcon: () => <div>ChevronDownIcon</div>,
    CheckIcon: () => <div>CheckIcon</div>,
    ChevronUpIcon: () => <div>ChevronUpIcon</div>,
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

// ✅ Мокаем Select компоненты
vi.mock('@/components/ui/Select', () => ({
    Select: ({ children, ...props }: any) => React.createElement('div', { 'data-testid': 'select', ...props }, children),
    SelectContent: ({ children, ...props }: any) => React.createElement('div', { 'data-testid': 'select-content', ...props }, children),
    SelectItem: ({ children, ...props }: any) => React.createElement('div', { 'data-testid': 'select-item', ...props }, children),
    SelectTrigger: ({ children, ...props }: any) => React.createElement('button', { 'data-testid': 'select-trigger', ...props }, children),
    SelectValue: ({ children, ...props }: any) => React.createElement('span', { 'data-testid': 'select-value', ...props }, children),
}));

// ✅ Мокаем Input компонент
vi.mock('@/components/ui/Input', () => ({
    Input: ({ className, ...props }: any) => React.createElement('input', {
        className,
        ...props,
        'data-testid': 'mock-input'
    }),
}));

// ✅ Мокаем Switch компонент
vi.mock('@/components/ui/Switch', () => ({
    Switch: ({ checked, onCheckedChange, ...props }: any) =>
        React.createElement('input', {
            type: 'checkbox',
            checked,
            onChange: (e: any) => onCheckedChange?.(e.target.checked),
            'data-testid': 'mock-switch',
            ...props
        }),
}));

// ✅ Импортируем компонент после всех моков
import AutoGenerationWidget from './AutoGenerationWidget';
import { supabase } from '@/lib/supabase';

describe('AutoGenerationWidget', () => {
    const mockUser = { id: '1' };
    const mockEntries: any[] = [];

    beforeEach(() => {
        vi.clearAllMocks();
        (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });
    });

    it('отображает виджет и рассчитывает оценку', async () => {
        const mockEq = vi.fn().mockReturnThis();
        const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
        const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
        (supabase.from as any).mockImplementation(mockFrom);

        await act(async () => {
            render(<AutoGenerationWidget entries={mockEntries} user={mockUser} />);
        });
        await screen.findByText('auto_generation');

        const calculateButton = screen.getByRole('button', { name: /calculate_estimate/i });
        await act(async () => {
            await userEvent.click(calculateButton);
        });

        const numbers = await screen.findAllByText((content) => {
            return /^[1-9]\d+$/.test(content);
        });
        expect(numbers.length).toBeGreaterThanOrEqual(4);
    });

    it('генерирует записи при нажатии кнопки', async () => {
        const user = userEvent.setup();

        const mockDeleteSecondEq = vi.fn().mockResolvedValue({ error: null });
        const mockDeleteIn = vi.fn().mockResolvedValue({ error: null });
        const mockDeleteFirstEq = vi.fn().mockReturnValue({
            eq: mockDeleteSecondEq,
            in: mockDeleteIn,
        });
        const mockDeleteFn = vi.fn().mockReturnValue({
            eq: mockDeleteFirstEq,
        });
        const mockSelectFn = vi.fn().mockResolvedValue({
            data: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
            error: null,
        });
        const mockInsertFn = vi.fn().mockReturnValue({ select: mockSelectFn });

        const mockSingle = vi.fn().mockResolvedValue({ data: { lifestyle_settings: null }, error: null });
        const mockSelectEq = vi.fn().mockReturnValue({ single: mockSingle });
        const mockSelect = vi.fn().mockReturnValue({ eq: mockSelectEq });

        const mockFrom = vi.fn().mockImplementation((table: string) => {
            if (table === 'profiles') {
                return { select: mockSelect };
            }
            if (table === 'footprint_entries') {
                return {
                    delete: mockDeleteFn,
                    insert: mockInsertFn,
                };
            }
            return {};
        });

        (supabase.from as any).mockImplementation(mockFrom);

        await act(async () => {
            render(<AutoGenerationWidget entries={mockEntries} user={mockUser} />);
        });
        await screen.findByText('auto_generation');

        const generateButton = screen.getByRole('button', { name: /generate_for_period/i });
        await act(async () => {
            await user.click(generateButton);
        });

        await waitFor(() => {
            expect(mockDeleteFn).toHaveBeenCalled();
            expect(mockInsertFn).toHaveBeenCalled();
        }, { timeout: 5000 });
    });

    it('сохраняет настройки образа жизни', async () => {
        const user = userEvent.setup();
        const mockUpdate = vi.fn().mockResolvedValue({ error: null });

        const mockSingle = vi.fn().mockResolvedValue({ data: { lifestyle_settings: null }, error: null });
        const mockSelectEq = vi.fn().mockReturnValue({ single: mockSingle });
        const mockSelect = vi.fn().mockReturnValue({ eq: mockSelectEq });

        const mockFrom = vi.fn().mockImplementation((table: string) => {
            if (table === 'profiles') {
                return {
                    select: mockSelect,
                    update: mockUpdate,
                };
            }
            return {};
        });

        (supabase.from as any).mockImplementation(mockFrom);

        await act(async () => {
            render(<AutoGenerationWidget entries={mockEntries} user={mockUser} />);
        });
        await screen.findByText('auto_generation');

        // Открываем настройки
        const settingsButton = screen.getByRole('button', { name: /settings/i });
        await user.click(settingsButton);

        // ✅ Ищем поле ввода по типу или по placeholder вместо label
        // Так как Label не связан с Input через htmlFor, используем другие методы

        // Вариант 1: Ищем по плейсхолдеру
        const areaInput = screen.getByPlaceholderText('area_placeholder');
        await user.clear(areaInput);
        await user.type(areaInput, '80');

        // Вариант 2: Ищем по data-testid
        // const areaInput = screen.getByTestId('mock-input');
        // await user.clear(areaInput);
        // await user.type(areaInput, '80');

        // Сохраняем настройки
        const saveButton = screen.getByRole('button', { name: /save_settings/i });
        await act(async () => {
            await user.click(saveButton);
        });

        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    lifestyle_settings: expect.objectContaining({ house_area: 80 }),
                })
            );
        });
    });
});