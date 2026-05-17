import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InstallButton from './InstallButton';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('InstallButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('is hidden when beforeinstallprompt did not fire', () => {
        render(<InstallButton />);
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('is visible when beforeinstallprompt fires', async () => {
        render(<InstallButton />);
        const event = new Event('beforeinstallprompt') as any;
        event.prompt = vi.fn();
        event.userChoice = Promise.resolve({ outcome: 'accepted' });
        window.dispatchEvent(event);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /install_app/i })).toBeInTheDocument();
        });
    });

    it('calls prompt on click', async () => {
        const user = userEvent.setup();
        render(<InstallButton />);
        const event = new Event('beforeinstallprompt') as any;
        event.prompt = vi.fn();
        event.userChoice = Promise.resolve({ outcome: 'accepted' });
        window.dispatchEvent(event);

        const button = await screen.findByRole('button');
        await user.click(button);
        expect(event.prompt).toHaveBeenCalled();
    });
});