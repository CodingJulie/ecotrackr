// components/workers/ClientWorkersManager.tsx
'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Динамический импорт с ssr: false работает только в клиентском компоненте
const WorkersManagerComponent = dynamic(
    () => import('@/components/workers/WorkersManager'),
    { ssr: false }
);

export default function ClientWorkersManager() {
    return (
        <Suspense fallback={null}>
            <WorkersManagerComponent />
        </Suspense>
    );
}