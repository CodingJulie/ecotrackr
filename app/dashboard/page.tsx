'use client';

import { useDashboardData } from '@/hooks/useDashboardData';
import { MainLoader } from '@/components/ui/MainLoader';
import { useTranslation } from 'react-i18next';
import DashboardContent from '@/components/dashboard/DashboardContent';

export default function DashboardPage() {
    const { t } = useTranslation('common');
    const { data, loading, error, refetch } = useDashboardData();

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <MainLoader />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-500 p-8">
                {t('load_error')}: {error}
            </div>
        );
    }

    if (!data) return null;

    return (
        <DashboardContent
            data={data}
            onRefetch={async () => {
                await refetch();
            }}
        />
    );
}
