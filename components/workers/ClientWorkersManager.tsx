'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// dynamic(..., { ssr: false }) only works inside a client component
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