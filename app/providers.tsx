// app/providers.tsx
'use client';

import {ThemeProvider} from 'next-themes';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {useState} from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,
                refetchOnWindowFocus: false,
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider
                attribute="class"
                defaultTheme="light"
                enableSystem={false}
                storageKey="theme"
            >
                {children}
            </ThemeProvider>
        </QueryClientProvider>
    );
}