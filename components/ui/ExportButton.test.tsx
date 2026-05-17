import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';

vi.mock('@/components/workers/WorkersManager', () => ({
    useWorkers: vi.fn(),
}));

vi.mock('jspdf', () => ({
    default: vi.fn().mockImplementation(() => ({
        addImage: vi.fn(),
        save: vi.fn(),
    })),
}));

vi.mock('html2canvas', () => ({
    default: vi.fn().mockResolvedValue({
        toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mock'),
        width: 800,
        height: 600,
    }),
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: {
            language: 'ru',
        },
    }),
}));

vi.mock('@/components/ui/Button', () => ({
    Button: ({ children, onClick, disabled, ...props }: any) =>
        React.createElement('button', { onClick, disabled, ...props }, children),
}));

vi.mock('@/components/ui/DropdownMenu', () => ({
    DropdownMenu: ({ children }: any) => React.createElement('div', { 'data-testid': 'dropdown-menu' }, children),
    DropdownMenuTrigger: ({ children }: any) => children,
    DropdownMenuContent: ({ children }: any) => React.createElement('div', { 'data-testid': 'dropdown-content' }, children),
    DropdownMenuItem: ({ children, onClick, ...props }: any) =>
        React.createElement('button', { onClick, 'data-testid': 'dropdown-item', ...props }, children),
}));

vi.mock('lucide-react', () => ({
    Download: () => React.createElement('div', null, 'Download'),
    File: () => React.createElement('div', null, 'File'),
    FileJson: () => React.createElement('div', null, 'FileJson'),
    FileSpreadsheet: () => React.createElement('div', null, 'FileSpreadsheet'),
    FileText: () => React.createElement('div', null, 'FileText'),
    Loader2: () => React.createElement('div', null, 'Loader2'),
}));

import ExportButton from './ExportButton';
import { useWorkers } from '@/components/workers/WorkersManager';

describe('ExportButton', () => {
    const mockEntries = [
        {
            id: '1',
            date: '2025-01-01',
            category: 'transport',
            activity: 'car',
            co2e: 50,
            value: 10,
            user_id: '123'
        },
        {
            id: '2',
            date: '2025-01-02',
            category: 'food',
            activity: 'beef',
            co2e: 99.5,
            value: 1,
            user_id: '123'
        },
    ];
    const mockUserProfile = { name: 'Test', email: 'test@test.com' };
    const mockExport = vi.fn();

    const originalCreateElement = document.createElement;
    const originalAppendChild = document.body.appendChild;
    const originalRemoveChild = document.body.removeChild;

    beforeEach(() => {
        vi.clearAllMocks();
        (useWorkers as any).mockReturnValue({ exportData: mockExport });

        global.URL.createObjectURL = vi.fn(() => 'blob:url');
        global.URL.revokeObjectURL = vi.fn();
        vi.stubGlobal('alert', vi.fn());

        document.createElement = originalCreateElement;
        document.body.appendChild = originalAppendChild;
        document.body.removeChild = originalRemoveChild;
    });

    afterEach(() => {
        document.createElement = originalCreateElement;
        document.body.appendChild = originalAppendChild;
        document.body.removeChild = originalRemoveChild;
    });

    it('is visible only when entries exist', () => {
        render(<ExportButton entries={mockEntries} userProfile={mockUserProfile} />);
        expect(screen.getByText('export_button_label')).toBeInTheDocument();
    });

    it('is hidden when there are no entries', () => {
        render(<ExportButton entries={[]} userProfile={mockUserProfile} />);
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('opens dropdown menu on click', async () => {
        const user = userEvent.setup();
        render(<ExportButton entries={mockEntries} userProfile={mockUserProfile} />);

        await user.click(screen.getByText('export_button_label'));

        expect(screen.getByTestId('dropdown-content')).toBeInTheDocument();
    });

    it('exports to CSV', async () => {
        const user = userEvent.setup();
        mockExport.mockResolvedValue({ data: 'test,csv', format: 'csv' });

        render(<ExportButton entries={mockEntries} userProfile={mockUserProfile} />);

        await user.click(screen.getByText('export_button_label'));
        const csvItem = screen.getAllByTestId('dropdown-item')[1];
        await user.click(csvItem);

        expect(mockExport).toHaveBeenCalledWith(
            mockEntries,
            'csv',
            mockUserProfile,
            expect.objectContaining({
                locale: 'ru',
                labels: expect.objectContaining({
                    noData: 'export_no_data',
                    date: 'pdf_date_header',
                }),
            })
        );
        expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    it('exports to JSON', async () => {
        const user = userEvent.setup();
        mockExport.mockResolvedValue({ data: JSON.stringify({ test: 'data' }), format: 'json' });

        render(<ExportButton entries={mockEntries} userProfile={mockUserProfile} />);

        await user.click(screen.getByText('export_button_label'));
        const jsonItem = screen.getAllByTestId('dropdown-item')[2];
        await user.click(jsonItem);

        expect(mockExport).toHaveBeenCalledWith(
            mockEntries,
            'json',
            mockUserProfile,
            expect.objectContaining({ locale: 'ru' })
        );
    });

    it('exports to HTML', async () => {
        const user = userEvent.setup();
        mockExport.mockResolvedValue({ data: '<html>test</html>', format: 'html' });

        render(<ExportButton entries={mockEntries} userProfile={mockUserProfile} />);

        await user.click(screen.getByText('export_button_label'));
        const htmlItem = screen.getAllByTestId('dropdown-item')[3];
        await user.click(htmlItem);

        expect(mockExport).toHaveBeenCalledWith(
            mockEntries,
            'html',
            mockUserProfile,
            expect.objectContaining({ locale: 'ru' })
        );
    });

    it('exports to PDF', async () => {
        const user = userEvent.setup();

        render(<ExportButton entries={mockEntries} userProfile={mockUserProfile} />);

        await user.click(screen.getByText('export_button_label'));
        const pdfItem = screen.getAllByTestId('dropdown-item')[0];
        await user.click(pdfItem);

        await waitFor(() => {
            expect(screen.getByText('export_button_label')).toBeInTheDocument();
        });
    });

    it('shows spinner while loading', async () => {
        const user = userEvent.setup();
        mockExport.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

        render(<ExportButton entries={mockEntries} userProfile={mockUserProfile} />);

        const mainButton = screen.getByLabelText('export_aria_label');
        await user.click(mainButton);

        const csvItem = screen.getAllByTestId('dropdown-item')[1];
        await user.click(csvItem);

        expect(mainButton).toBeDisabled();

        expect(screen.getByText('Loader2')).toBeInTheDocument();
    });

    it('handles export error', async () => {
        const user = userEvent.setup();
        mockExport.mockRejectedValue(new Error('Export failed'));

        render(<ExportButton entries={mockEntries} userProfile={mockUserProfile} />);

        await user.click(screen.getByText('export_button_label'));
        const csvItem = screen.getAllByTestId('dropdown-item')[1];
        await user.click(csvItem);

        await waitFor(() => {
            expect(global.alert).toHaveBeenCalledWith('export_error');
        });
    });
});
