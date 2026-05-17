'use client';

import { CO2Calculator as PackageCO2Calculator } from '@ecotrackr/co2-calculator';
import { useTranslation } from 'react-i18next';

interface CO2CalculatorDemoProps {
    supabase: ReturnType<typeof import('@/lib/demo-supabase').createDemoSupabaseClient>;
    onDataChange?: () => void | Promise<void>;
    className?: string;
}

export default function CO2CalculatorDemo({ supabase, onDataChange, className }: CO2CalculatorDemoProps) {
    const { t } = useTranslation('common');

    const handleDataChange = () => {
        void onDataChange?.();
    };

    return (
        <PackageCO2Calculator
            supabase={supabase as never}
            t={t}
            className={className}
            onEntryAdded={handleDataChange}
            onEntryDeleted={handleDataChange}
        />
    );
}
