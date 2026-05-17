'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { BarChart3, Leaf, LogOut, Moon, Settings, Sun, Users } from 'lucide-react';
import ScrollToTop from '@/components/ui/ScrollToTop';
import { MainLoader } from "@/components/ui/MainLoader";
import InstallButton from '@/components/ui/InstallButton';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const navItems = [
    { href: '/dashboard', labelKey: 'dashboard', icon: BarChart3 },
    { href: '/dashboard/community', labelKey: 'leaderboard', icon: Users },
    { href: '/dashboard/settings', labelKey: 'settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useTranslation('common');
    const { resolvedTheme, setTheme } = useTheme();
    const [themeMounted, setThemeMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userInitial, setUserInitial] = useState<string>('?');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    useEffect(() => {
        setThemeMounted(true);
    }, []);

    useEffect(() => {
        const init = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.replace('/login');
                    return;
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('name, avatar_url')
                    .eq('id', session.user.id)
                    .single();

                const name = profile?.name || session.user.email?.split('@')[0] || t('user');
                setUserInitial(name[0]?.toUpperCase() || '?');
                setAvatarUrl(profile?.avatar_url ?? null);
            } catch (error) {
                console.error('Init error:', error);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [router, t]);

    const isDark = themeMounted && resolvedTheme === 'dark';

    const toggleTheme = () => {
        setTheme(isDark ? 'light' : 'dark');
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-40 flex items-center justify-center overflow-hidden bg-white dark:bg-zinc-950 w-screen h-screen">
                <MainLoader />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <header className="hidden md:block sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                        <div className="w-9 h-9 bg-emerald-600 rounded-2xl flex items-center justify-center">
                            <Leaf className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-2xl tracking-tight">{t('app_name')}</span>
                    </Link>

                    <nav className="flex items-center gap-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                                        isActive ? 'bg-emerald-700 text-white' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                    }`}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {t(item.labelKey)}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={isDark ? t('switch_to_light_theme') : t('switch_to_dark_theme')}>
                            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </Button>

                        <LanguageSwitcher />

                        <Avatar className="w-9 h-9 cursor-pointer" onClick={() => router.push('/dashboard/settings')}>
                            {avatarUrl ? (
                                <AvatarImage key={avatarUrl} src={avatarUrl} alt={t('user')} />
                            ) : null}
                            <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-sm font-medium">
                                {userInitial}
                            </AvatarFallback>
                        </Avatar>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleLogout}
                            aria-label={t('sign_out')}
                            title={t('sign_out')}
                            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                            <LogOut className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </header>

            <div className="flex">
                <aside className="fixed left-0 top-0 bottom-0 z-50 w-16 border-r border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl py-3 px-2 flex md:hidden flex-col items-center overflow-y-auto">
                    <Link
                        href="/dashboard"
                        aria-label={t('app_name')}
                        className="flex items-center justify-center w-10 h-10 mb-4 rounded-2xl hover:opacity-80 transition-opacity shrink-0"
                    >
                        <div className="w-9 h-9 bg-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                            <Leaf className="w-5 h-5 text-white" />
                        </div>
                    </Link>

                    <div className="flex-1 w-full min-h-0">
                        <nav className="space-y-1.5">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        aria-label={t(item.labelKey)}
                                        title={t(item.labelKey)}
                                        className={`flex items-center justify-center w-full aspect-square rounded-2xl transition-all ${
                                            isActive
                                                ? 'bg-emerald-700 text-white'
                                                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                        }`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="pt-3 mt-auto border-t border-zinc-200 dark:border-zinc-800 w-full flex flex-col items-center gap-2 shrink-0">
                        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={isDark ? t('switch_to_light_theme') : t('switch_to_dark_theme')}>
                            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </Button>
                        <LanguageSwitcher compact />
                        <Avatar className="w-9 h-9 cursor-pointer" onClick={() => router.push('/dashboard/settings')}>
                            {avatarUrl ? (
                                <AvatarImage key={avatarUrl} src={avatarUrl} alt={t('user')} />
                            ) : null}
                            <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-sm font-medium">
                                {userInitial}
                            </AvatarFallback>
                        </Avatar>
                        <InstallButton iconOnly />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleLogout}
                            aria-label={t('sign_out')}
                            title={t('sign_out')}
                            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                            <LogOut className="w-5 h-5" />
                        </Button>
                    </div>
                </aside>

                <main className="flex-1 ml-16 md:ml-0 p-4 md:p-6 lg:p-10">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>

            <ScrollToTop />
        </div>
    );
}