// app/dashboard/page.tsx
'use client';

import CO2Calculator from '@/components/calculator/CO2Calculator';
import AIInsights from '@/components/insights/AIInsights';
import EmissionsTrend from '@/components/charts/EmissionsTrend';
import OpenStreetMap from '@/components/maps/OpenStreetMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, TrendingDown, Award, Target } from 'lucide-react';

export default function DashboardPage() {
    const stats = [
        { title: "Общий след", value: "184 кг", change: "-18% за месяц", icon: Leaf },
        { title: "Снижение", value: "42 кг", change: "с прошлого месяца", icon: TrendingDown },
        { title: "Стрик", value: "14 дней", change: "🔥", icon: Award },
        { title: "Прогресс цели", value: "68%", change: "из 300 кг", icon: Target },
    ];

    return (
        <div className="space-y-12 pb-12">
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    Добро пожаловать обратно!
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400 mt-2">
                    Ваш климатический прогресс
                </p>
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <Card key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
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
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Графики */}
            <div>
                <EmissionsTrend />
            </div>

            {/* Карта с большим отступом сверху */}
            <div className="mt-12">
                <OpenStreetMap />
            </div>

            {/* Нижние компоненты */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
                <AIInsights />
                <CO2Calculator />
            </div>
        </div>
    );
}