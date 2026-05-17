import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

vi.mock('lucide-react', () => ({
    ChevronUp: () => React.createElement('div', null, 'ChevronUp'),
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

import ScrollToTop from './ScrollToTop';

describe('ScrollToTop', () => {
    beforeEach(() => {
        Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
        Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });
        vi.clearAllMocks();
    });

    it('is hidden when scrollY < 500', () => {
        render(<ScrollToTop />);
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('is visible when scrollY > 500', async () => {
        Object.defineProperty(window, 'scrollY', { value: 600, writable: true });
        render(<ScrollToTop />);

        await act(async () => {
            window.dispatchEvent(new Event('scroll'));
        });

        await waitFor(() => {
            expect(screen.getByRole('button')).toBeInTheDocument();
        });
    });

    it('scrolls to top on click', async () => {
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
