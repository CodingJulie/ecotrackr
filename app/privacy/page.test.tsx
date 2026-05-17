import { render, screen } from '@testing-library/react';
import PrivacyPage from './page';
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

describe('PrivacyPage', () => {
    it('renders correctly', async () => {
        render(<PrivacyPage />);
        await screen.findByText(/last_updated \d{1,2} \S+ \d{4}/);
        expect(screen.getAllByText('privacy_policy').length).toBeGreaterThan(0);
    });

    it('displays main sections', async () => {
        render(<PrivacyPage />);
        // Each label appears at least twice (sidebar nav + section h2).
        expect(screen.getAllByText('privacy_policy').length).toBeGreaterThan(0);
        expect(screen.getAllByText('introduction').length).toBeGreaterThan(0);
        expect(screen.getAllByText('data_collection').length).toBeGreaterThan(0);
        expect(screen.getAllByText('data_usage').length).toBeGreaterThan(0);
        expect(screen.getAllByText('data_security').length).toBeGreaterThan(0);
        expect(screen.getAllByText('cookies').length).toBeGreaterThan(0);
        expect(screen.getAllByText('user_rights').length).toBeGreaterThan(0);
        expect(screen.getAllByText('contacts').length).toBeGreaterThan(0);
    });
});
