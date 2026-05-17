// components/insights/AIInsights.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, RefreshCw, Loader2 } from 'lucide-react';

const mockInsights = [
    "Вы уже снизили свой след на 18% по сравнению со средним показателем. Отличный результат!",
    "Транспорт составляет большую часть вашего следа. Замена хотя бы 30% поездок на общественный транспорт даст хороший эффект.",
    "Рекомендация: попробуйте 2 мясных дня в неделю заменить на растительные — это минус ~80-100 кг CO₂e в месяц.",
    "Вы в топ-25% самых экологичных пользователей приложения. Продолжайте в том же духе!",
];

export default function AIInsights() {
    const [insights, setInsights] = useState(mockInsights);
    const [loading, setLoading] = useState(false);

    const generateInsights = () => {
        setLoading(true);
        setTimeout(() => {
            const shuffled = [...mockInsights].sort(() => 0.5 - Math.random());
            setInsights(shuffled);
            setLoading(false);
        }, 1200);
    };

    return (
        <Card className="h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <Lightbulb className="text-amber-500 w-6 h-6" />
                    AI Персональные рекомендации
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {insights.map((insight, i) => (
                    <div
                        key={i}
                        className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900 text-zinc-700 dark:text-zinc-300"
                    >
                        {insight}
                    </div>
                ))}

                <Button
                    onClick={generateInsights}
                    className="w-full"
                    disabled={loading}
                >
                    {loading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> AI думает...</>
                    ) : (
                        <><RefreshCw className="mr-2 h-4 w-4" /> Новые рекомендации</>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}