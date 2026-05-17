'use client';

import { useEffect, useState } from 'react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { computeDashboardStats } from '@/lib/dashboard-stats';
import { formatCo2e } from '@/lib/utils';
import { resolveTreeType, type TreeTypeId } from '@/lib/tree';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Leaf, TrendingDown, Award, Target } from 'lucide-react';
import dynamic from 'next/dynamic';
import ExportButton from '@/components/ui/ExportButton';
import { useTranslation } from 'react-i18next';
import { useHydrated } from '@/hooks/useHydrated';
import en from '@/public/locales/en/common.json';

const CO2Calculator = dynamic(
    () => import('@/components/calculator/CO2Calculator'),
    {
        ssr: false,
        loading: () => <div className="h-[400px] animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />,
    }
);

const CO2CalculatorDemo = dynamic(
    () => import('@/components/calculator/CO2CalculatorDemo'),
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

interface DashboardContentProps {
    data: DashboardData;
    demoMode?: boolean;
    demoSupabase?: ReturnType<typeof import('@/lib/demo-supabase').createDemoSupabaseClient>;
    onRefetch?: () => void | Promise<void>;
}

export default function DashboardContent({
    data,
    demoMode = false,
    demoSupabase,
    onRefetch,
}: DashboardContentProps) {
    const { t } = useTranslation('common');
    const hydrated = useHydrated();
    const [selectedTreeType, setSelectedTreeType] = useState<TreeTypeId | null>(null);
    const [forestRefreshKey, setForestRefreshKey] = useState(0);

    const { entries, mapPoints, user, profile, tree } = data;

    useEffect(() => {
        if (tree?.tree_type) {
            setSelectedTreeType(resolveTreeType(tree.tree_type));
        }
    }, [tree?.tree_type]);

    const dashboardStats = computeDashboardStats(entries);
    const totalCO2 = dashboardStats.totalCo2;

    const handleEntriesGenerated = async () => {
        await onRefetch?.();
    };

    const statCards = [
        {
            title: t('total_footprint'),
            value: `${formatCo2e(dashboardStats.totalCo2)} ${t('kg')}`,
            change: `${formatCo2e(dashboardStats.thisMonthCo2)} ${t('kg_per_month')}`,
            subtitle: t('total_footprint_all_time'),
            icon: Leaf,
        },
        {
            title: t('reduction'),
            value: `${formatCo2e(dashboardStats.reductionKg)} ${t('kg')}`,
            change: t('from_last_month'),
            subtitle: undefined,
            icon: TrendingDown,
        },
        {
            title: t('streak'),
            value: `${dashboardStats.streak} ${t('days')}`,
            change: dashboardStats.streak > 0 ? t('continue_streak') : t('start_today'),
            subtitle: undefined,
            icon: Award,
        },
        {
            title: t('goal_progress'),
            value: `${dashboardStats.goalProgress}%`,
            change: `${t('of')} ${dashboardStats.monthlyGoalKg} ${t('kg')}`,
            subtitle: undefined,
            icon: Target,
        },
    ];

    const demoWelcome = hydrated ? t('demo.welcome') : en.demo.welcome;
    const demoSubtitle = hydrated ? t('demo.subtitle') : en.demo.subtitle;

    return (
        <div className="space-y-12 pb-12">
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    {demoMode ? demoWelcome : t('welcome_back')}
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400 mt-2">
                    {demoMode ? demoSubtitle : t('progress')}
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

            {!demoMode && (
                <div className="mt-8">
                    <AutoGenerationWidget entries={entries} user={user} onGenerated={handleEntriesGenerated} />
                    <div className="mt-4 flex justify-end">
                        <ExportButton entries={entries} userProfile={profile} />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <UserTree
                    userId={user.id}
                    treeData={tree}
                    entries={entries}
                    demoMode={demoMode}
                    onTreeTypeChange={setSelectedTreeType}
                    onPlanted={() => {
                        setForestRefreshKey((key) => key + 1);
                        void onRefetch?.();
                    }}
                />
                <CommunityForest
                    currentUserId={user.id}
                    currentUserTreeType={selectedTreeType ?? tree.tree_type}
                    refreshKey={forestRefreshKey}
                    demoMode={demoMode}
                />
            </div>

            <div>
                <EmissionsTrend entries={entries} />
            </div>

            <div className="mt-8">
                <OpenStreetMap mapPoints={mapPoints} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
                <AIInsights entries={entries} totalCO2={totalCO2} />
                {demoMode && demoSupabase ? (
                    <CO2CalculatorDemo
                        supabase={demoSupabase}
                        onDataChange={() => { void onRefetch?.(); }}
                    />
                ) : (
                    <CO2Calculator onDataChange={() => { void onRefetch?.(); }} />
                )}
            </div>
        </div>
    );
}
