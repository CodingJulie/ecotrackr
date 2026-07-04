// app/dashboard/page.tsx
'use client';

import { useDashboardData } from '@/hooks/useDashboardData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Leaf, TrendingDown, Award, Target } from 'lucide-react';
import dynamic from 'next/dynamic';
import ExportButton from '@/components/ui/ExportButton';
import { MainLoader } from '@/components/ui/MainLoader';
import { useTranslation } from 'react-i18next';

// Динамический импорт с ssr: false – компоненты загружаются только на клиенте
const CO2Calculator = dynamic(
    () => import('@/components/calculator/CO2Calculator'),
    {
        ssr: false,
        loading: () => <div className="h-[400px] animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />,
    }
);

const AIInsights = dynamic(
    () => import('@/components/insights/AIInsights'),
    {
        ssr: false,
        loading: () => <div className="h-[300px] animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />,
    }
);

const EmissionsTrend = dynamic(
    () => import('@/components/charts/EmissionsTrend'),
    {
        ssr: false,
        loading: () => <div className="h-[350px] animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />,
    }
);

const OpenStreetMap = dynamic(
    () => import('@/components/maps/OpenStreetMap'),
    {
        ssr: false,
        loading: () => <div className="h-[520px] animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />,
    }
);

const UserTree = dynamic(
    () => import('@/components/forest/UserTree'),
    {
        ssr: false,
        loading: () => <div className="h-[300px] animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />,
    }
);

const CommunityForest = dynamic(
    () => import('@/components/forest/CommunityForest'),
    {
        ssr: false,
        loading: () => <div className="h-[300px] animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />,
    }
);

const AutoGenerationWidget = dynamic(
    () => import('@/components/dashboard/AutoGenerationWidget'),
    {
        ssr: false,
        loading: () => <div className="h-[400px] animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />,
    }
);

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

    const { entries, mapPoints, user, profile, tree, forest } = data;

    const totalCO2 = entries.reduce((sum, e) => sum + (e.co2e || 0), 0);

    const now = new Date();
    const lastMonth = new Date(now);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const twoMonthsAgo = new Date(now);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const lastMonthEntries = entries.filter((e) => new Date(e.date) >= lastMonth);
    const prevMonthEntries = entries.filter(
        (e) => new Date(e.date) >= twoMonthsAgo && new Date(e.date) < lastMonth
    );

    const lastMonthTotal = lastMonthEntries.reduce((s, e) => s + (e.co2e || 0), 0);
    const prevMonthTotal = prevMonthEntries.reduce((s, e) => s + (e.co2e || 0), 0);
    const reduction = prevMonthTotal > 0 ? Math.max(0, prevMonthTotal - lastMonthTotal) : 0;

    const uniqueDates = new Set(entries.map((e) => e.date));
    const streak = Math.min(uniqueDates.size, 14);

    const goal = 300;
    const goalProgress = Math.min(100, Math.round((totalCO2 / goal) * 100));

    const stats = {
        total_co2: Math.round(totalCO2),
        reduction: Math.round(reduction),
        streak,
        goal_progress: goalProgress,
    };

    const handleEntriesGenerated = async () => {
        await refetch();
    };

    const statCards = [
        {
            title: t('total_footprint'),
            value: `${stats.total_co2} ${t('kg')}`,
            change: `${stats.reduction} ${t('kg_per_month')}`,
            subtitle: t('total_footprint_all_time'),
            icon: Leaf,
        },
        {
            title: t('reduction'),
            value: `${stats.reduction} ${t('kg')}`,
            change: t('from_last_month'),
            subtitle: undefined,
            icon: TrendingDown,
        },
        {
            title: t('streak'),
            value: `${stats.streak} ${t('days')}`,
            change: stats.streak > 0 ? t('continue_streak') : t('start_today'),
            subtitle: undefined,
            icon: Award,
        },
        {
            title: t('goal_progress'),
            value: `${stats.goal_progress}%`,
            change: `${t('of')} ${goal} ${t('kg')}`,
            subtitle: undefined,
            icon: Target,
        },
    ];

    return (
        <div className="space-y-12 pb-12">
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    {t('welcome_back')}
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400 mt-2">
                    {t('progress')}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, i) => (
                    <Card
                        key={i}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                    >
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-sm text-zinc-500 dark:text-zinc-400">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className="w-6 h-6 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-zinc-900 dark:text-white">
                                {stat.value}
                            </div>
                            <p className="text-emerald-600 text-sm mt-1">{stat.change}</p>
                            {stat.subtitle && (
                                <p className="text-xs text-muted-foreground mt-0.5">{stat.subtitle}</p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="mt-8">
                <AutoGenerationWidget entries={entries} user={user} onGenerated={handleEntriesGenerated} />
                <div className="mt-4 flex justify-end">
                    <ExportButton entries={entries} userProfile={profile} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <UserTree treeData={tree} entries={entries} />
                <CommunityForest forestData={forest} />
            </div>

            <div>
                <EmissionsTrend entries={entries} />
            </div>

            <div className="mt-8">
                <OpenStreetMap mapPoints={mapPoints} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
                <AIInsights entries={entries} totalCO2={totalCO2} />
                <CO2Calculator onDataChange={() => { void refetch(); }} />
            </div>
        </div>
    );
}