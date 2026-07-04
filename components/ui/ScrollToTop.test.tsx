import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

// ✅ Мокаем framer-motion с AnimatePresence
vi.mock('framer-motion', () => ({
    motion: {
        button: ({ children, ...props }: any) => React.createElement('button', props, children),
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
    ChevronUp: () => React.createElement('div', null, 'ChevronUp'),
}));

// ✅ Импортируем компонент после моков
import ScrollToTop from './ScrollToTop';

describe('ScrollToTop', () => {
    beforeEach(() => {
        Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
        Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });
        // ✅ Очищаем моки
        vi.clearAllMocks();
    });

    it('не отображается, если scrollY < 500', () => {
        render(<ScrollToTop />);
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('отображается, если scrollY > 500', async () => {
        Object.defineProperty(window, 'scrollY', { value: 600, writable: true });
        render(<ScrollToTop />);

        await act(async () => {
            window.dispatchEvent(new Event('scroll'));
        });

        await waitFor(() => {
            expect(screen.getByRole('button')).toBeInTheDocument();
        });
    });

    it('прокручивает наверх при клике', async () => {
        const user = userEvent.setup();
        Object.defineProperty(window, 'scrollY', { value: 600, writable: true });

        render(<ScrollToTop />);

        await act(async () => {
            window.dispatchEvent(new Event('scroll'));
        });

        const button = await screen.findByRole('button');
        await user.click(button);

        expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });
});