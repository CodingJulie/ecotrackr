import { render, screen, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => React.createElement('div', props, children),
    },
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, opts?: { amount?: number }) => {
            if (key === 'pollution_co2_added') return `+${opts?.amount} kg CO₂`;
            if (key === 'pollution_added_to_atmosphere') return 'Added to the atmosphere';
            return key;
        },
    }),
}));

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

    it('displays effect and hides after timeout', () => {
        const onComplete = vi.fn();
        render(<PollutionEffect co2Amount={150} onComplete={onComplete} />);
        expect(screen.getByText('+150 kg CO₂')).toBeInTheDocument();
        expect(screen.getByText('Added to the atmosphere')).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(2500);
        });

        expect(screen.queryByText('+150 kg CO₂')).not.toBeInTheDocument();
        expect(onComplete).toHaveBeenCalled();
    });

    it('adds shake animation when co2Amount > 300', () => {
        render(<PollutionEffect co2Amount={350} />);
        expect(document.body.style.animation).toContain('shake');

        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(document.body.style.animation).toBe('');
    });

    it('does not add shake when co2Amount <= 300', () => {
        render(<PollutionEffect co2Amount={200} />);
        expect(document.body.style.animation).toBe('');
    });
});
