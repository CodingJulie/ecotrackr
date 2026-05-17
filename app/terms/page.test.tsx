import { render, screen } from '@testing-library/react';
import TermsPage from './page';
import { describe, it, expect, vi } from 'vitest';

vi.mock('next/link', () => ({
    default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

vi.mock('@/components/ui/Button', () => ({
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));
vi.mock('@/components/ui/Card', () => ({
    Card: ({ children }: any) => <div data-testid="card">{children}</div>,
}));

describe('TermsPage', () => {
    it('renders correctly', async () => {
        render(<TermsPage />);
        await screen.findByText(/last_updated \d{1,2} \S+ \d{4}/);
        expect(screen.getAllByText('terms_of_use').length).toBeGreaterThan(0);
    });

    it('displays main sections', async () => {
        render(<TermsPage />);
        // Each label appears more than once (sidebar nav + section headings).
        expect(screen.getAllByText('terms_of_use').length).toBeGreaterThan(0);
        expect(screen.getAllByText('general_provisions').length).toBeGreaterThan(0);
        expect(screen.getAllByText('obligations').length).toBeGreaterThan(0);
        expect(screen.getAllByText('liability').length).toBeGreaterThan(0);
        expect(screen.getAllByText('intellectual_property').length).toBeGreaterThan(0);
        expect(screen.getAllByText('termination').length).toBeGreaterThan(0);
        expect(screen.getAllByText('contacts').length).toBeGreaterThan(0);
    });
});
