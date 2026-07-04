import { render, screen, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
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

// ✅ Мокаем react-i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, opts?: { amount?: number }) => {
            if (key === 'pollution_co2_added') return `+${opts?.amount} kg CO₂`;
            if (key === 'pollution_added_to_atmosphere') return 'Added to the atmosphere';
            return key;
        },
    }),
}));

// ✅ Импортируем компонент после мока
import PollutionEffect from './PollutionEffect';

describe('PollutionEffect', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        document.body.style.animation = '';
    });

    afterEach(() => {
        vi.useRealTimers();
        document.body.style.animation = '';
    });

    it('отображает эффект и скрывается по таймеру', () => {
        const onComplete = vi.fn();
        render(<PollutionEffect co2Amount={150} onComplete={onComplete} />);
        expect(screen.getByText('+150 kg CO₂')).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(2500);
        });

        expect(screen.queryByText('+150 kg CO₂')).not.toBeInTheDocument();
        expect(onComplete).toHaveBeenCalled();
    });

    it('вызывает onComplete после завершения', () => {
        const onComplete = vi.fn();
        render(<PollutionEffect co2Amount={50} onComplete={onComplete} />);
        act(() => { vi.advanceTimersByTime(2500); });
        expect(onComplete).toHaveBeenCalled();
    });

    it('интенсивность зависит от co2Amount', () => {
        render(<PollutionEffect co2Amount={350} />);
        expect(screen.getByText('+350 kg CO₂')).toBeInTheDocument();
    });

    it('добавляет анимацию тряски при co2Amount > 300', () => {
        render(<PollutionEffect co2Amount={350} />);

        // ✅ Тряска добавляется сразу при рендере через useEffect
        // Проверяем, что анимация была установлена
        expect(document.body.style.animation).toContain('shake');

        // ✅ Продвигаем таймеры на 500ms, чтобы убрать анимацию
        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(document.body.style.animation).toBe('');
    });

    it('не добавляет тряску при co2Amount <= 300', () => {
        render(<PollutionEffect co2Amount={200} />);

        // ✅ Анимация не должна быть установлена
        expect(document.body.style.animation).toBe('');
    });
});