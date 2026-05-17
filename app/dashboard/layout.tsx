// app/(dashboard)/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Leaf, BarChart3, Settings, Users, Sun, Moon } from 'lucide-react';

const navItems = [
    { href: '/dashboard', label: 'Дашборд', icon: BarChart3 },
    { href: '/community', label: 'Сообщество', icon: Users },
    { href: '/settings', label: 'Настройки', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [isDark, setIsDark] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        // Загрузка темы из localStorage
        const savedTheme = localStorage.getItem('theme');
        const isDarkTheme = savedTheme === 'dark';
        setIsDark(isDarkTheme);
        document.documentElement.classList.toggle('dark', isDarkTheme);

        // Проверка авторизации
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) router.push('/login');
            else setLoading(false);
        });
    }, [router]);

    const toggleTheme = () => {
        const newDark = !isDark;
        setIsDark(newDark);
        localStorage.setItem('theme', newDark ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', newDark);
    };

    if (!mounted || loading) {
        return <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
            Загрузка...
        </div>;
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            {/* HEADER - максимальный z-index, чтобы быть выше всего */}
            <header className="sticky top-0 z-[99999] border-b border-zinc-200 dark:border-zinc-800
                       bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                        {pathname === '/dashboard' && 'Дашборд'}
                        {pathname === '/community' && 'Сообщество'}
                        {pathname === '/settings' && 'Настройки профиля'}
                    </h1>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        className="w-10 h-10 rounded-xl"
                    >
                        {isDark ? (
                            <Sun className="w-5 h-5 text-yellow-500" />
                        ) : (
                            <Moon className="w-5 h-5 text-zinc-700" />
                        )}
                    </Button>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar - высокий z-index, но ниже header */}
                <div className="fixed left-0 top-[73px] bottom-0 w-72 border-r border-zinc-200 dark:border-zinc-800
                      bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl
                      p-6 hidden lg:block overflow-auto z-[99998]">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center">
                            <Leaf className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-bold text-3xl tracking-tight text-zinc-900 dark:text-white">EcoTrackr</span>
                    </div>

                    <nav className="space-y-1.5">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[15px] font-medium transition-all ${
                                        isActive
                                            ? 'bg-emerald-600 text-white'
                                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                    }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Main content */}
                <main className="flex-1 lg:ml-72 p-6 lg:p-10">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}