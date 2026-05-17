'use client';

import DashboardContent from '@/components/dashboard/DashboardContent';
import { useDemoDashboardData } from '@/hooks/useDemoDashboardData';

export default function DemoPage() {
    const { data, demoSupabase, refetch } = useDemoDashboardData();

    return (
        <DashboardContent
            data={data}
            demoMode
            demoSupabase={demoSupabase}
            onRefetch={async () => {
                await refetch();
            }}
        />
    );
}
