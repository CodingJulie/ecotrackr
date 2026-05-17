'use client';

import { CO2Calculator as PackageCO2Calculator } from '@ecotrackr/co2-calculator';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';

interface CO2CalculatorProps {
    onDataChange?: () => void | Promise<void>;
    className?: string;
}

export default function CO2Calculator({ onDataChange, className }: CO2CalculatorProps = {}) {
    const { t } = useTranslation('common');

    const handleDataChange = () => {
        void onDataChange?.();
    };

    return (
        <PackageCO2Calculator
            supabase={supabase}
            t={t}
            className={className}
            onEntryAdded={handleDataChange}
            onEntryDeleted={handleDataChange}
        />
    );
}
