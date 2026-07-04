import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InstallButton from './InstallButton';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('InstallButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('не отображается, если событие beforeinstallprompt не произошло', () => {
        render(<InstallButton />);
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('отображается, когда событие beforeinstallprompt сработало', async () => {
        render(<InstallButton />);
        const event = new Event('beforeinstallprompt') as any;
        event.prompt = vi.fn();
        event.userChoice = Promise.resolve({ outcome: 'accepted' });
        window.dispatchEvent(event);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /install_app/i })).toBeInTheDocument();
        });
    });

    it('вызывает prompt при клике', async () => {
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