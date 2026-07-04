import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CO2Calculator from './CO2Calculator';
import { supabase } from '@/lib/supabase';

const mockPackageCalculator = vi.fn(({ t }: { t: (key: string) => string }) => (
    <div>{t('carbon_footprint_calculator')}</div>
));

vi.mock('@ecotrackr/co2-calculator', () => ({
    CO2Calculator: (props: unknown) => mockPackageCalculator(props as { t: (key: string) => string }),
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

describe('CO2Calculator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('передаёт supabase и t в пакетный компонент', () => {
        render(<CO2Calculator />);

        expect(screen.getByText('carbon_footprint_calculator')).toBeInTheDocument();
        expect(mockPackageCalculator).toHaveBeenCalledWith(
            expect.objectContaining({
                supabase,
                t: expect.any(Function),
            })
        );
    });

    it('вызывает onDataChange при добавлении и удалении записи', () => {
        const onDataChange = vi.fn();

        render(<CO2Calculator onDataChange={onDataChange} />);

        const props = mockPackageCalculator.mock.calls[0][0] as {
            onEntryAdded: () => void;
            onEntryDeleted: () => void;
        } & { t: (key: string) => string };

        props.onEntryAdded();
        props.onEntryDeleted();

        expect(onDataChange).toHaveBeenCalledTimes(2);
    });
});
