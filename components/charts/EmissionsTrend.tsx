'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, AlertCircle, Loader2 } from 'lucide-react';

interface EmissionsTrendProps {
    entries: any[];
}

export default function EmissionsTrend({ entries }: EmissionsTrendProps) {
    const { t, i18n } = useTranslation('common');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!entries) {
            setData([]);
            setLoading(false);
            return;
        }
        try {
            if (entries.length === 0) {
                setData([]);
                setLoading(false);
                return;
            }
            const grouped = entries.reduce((acc: any, entry) => {
                const date = entry.date;
                if (!acc[date]) {
                    const formattedDate = new Date(date).toLocaleDateString(i18n.language, {
                        day: 'numeric',
                        month: 'short'
                    });
                    acc[date] = {
                        date: formattedDate,
                        fullDate: date,
                        manual: 0,
                        auto: 0,
                        total: 0
                    };
                }
                if (entry.is_auto_generated) {
                    acc[date].auto += entry.co2e;
                } else {
                    acc[date].manual += entry.co2e;
                }
                acc[date].total += entry.co2e;
                return acc;
            }, {});
            const chartData = Object.values(grouped).slice(-30);
            setData(chartData);
        } catch (_e) {
            setError(t('error_processing_data'));
        } finally {
            setLoading(false);
        }
    }, [entries]);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                        {t('emissions_trend')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center items-center h-[300px]">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                        {t('emissions_trend')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center items-center h-[300px] text-center">
                    <div>
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" aria-hidden="true" />
                        <p className="text-muted-foreground">{error}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                        {t('emissions_trend')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center items-center h-[300px] text-center">
                    <div>
                        <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
                        <p className="text-muted-foreground">{t('no_data_to_display')}</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            {t('add_entries_or_use_auto_generation')}
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                    {t('emissions_trend_kg')}
                </CardTitle>
                <p className="text-sm text-muted-foreground">📈 {t('trend_line_note')}</p>
            </CardHeader>
            <CardContent>
                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                            <XAxis dataKey="date" fontSize={11} angle={-45} textAnchor="end" height={60} interval={0} />
                            <YAxis fontSize={11} tickFormatter={(value) => `${value} ${t('kg')}`} />
                            <Tooltip
                                formatter={(value: any, name: any) => {
                                    if (name === 'total') return [`${value.toFixed(1)} ${t('kg')}`, t('total')];
                                    return [`${value.toFixed(1)} ${t('kg')}`, name === 'manual' ? t('your_entries') : t('auto_generation')];
                                }}
                                labelFormatter={(label) => `${t('date')}: ${label}`}
                            />
                            <Legend
                                formatter={(value) => {
                                    if (value === 'total') return t('overall_trend');
                                    if (value === 'manual') return t('your_entries');
                                    return t('auto_generation');
                                }}
                            />
                            <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} name="total" />
                            <Line type="monotone" dataKey="manual" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', strokeWidth: 1, r: 3 }} name="manual" strokeDasharray="5 5" />
                            <Line type="monotone" dataKey="auto" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', strokeWidth: 1, r: 3 }} name="auto" strokeDasharray="5 5" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}