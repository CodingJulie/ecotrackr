'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Sparkles, TrendingUp, Lightbulb, Heart, RefreshCw, Leaf, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AIInsightsProps {
    entries: any[];
    totalCO2: number;
}

export default function AIInsights({ entries, totalCO2 }: AIInsightsProps) {
    const { t, i18n } = useTranslation('common');
    const [insights, setInsights] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchInsights = useCallback(async (forceRefresh = false) => {
        if (entries.length === 0) {
            setInsights([
                t('no_data_insights'),
                t('add_first_entries'),
                t('start_with_transport'),
                t('more_data_more_tips')
            ]);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/ai-insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    totalCO2,
                    entries: entries.slice(0, 10).map(e => ({ category: e.category, activity: e.activity, value: e.value, co2e: e.co2e, date: e.date })),
                    refresh: forceRefresh,
                    lang: i18n.language
                })
            });
            if (!res.ok) throw new Error('Ошибка получения данных');
            const data = await res.json();
            setInsights(data.insights || []);
            setLastUpdated(new Date());
        } catch (_e) {
            setError(t('insights_error'));
            setInsights([
                t('keep_tracking'),
                t('regularity_is_key'),
                t('share_success'),
                t('every_action_matters')
            ]);
        } finally {
            setLoading(false);
        }
    }, [entries, totalCO2, i18n.language, t]);

    useEffect(() => {
        fetchInsights(false);
    }, [fetchInsights]);

    return (
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                        <CardTitle>{t('ai_analytics')}</CardTitle>
                        <Badge variant="outline" className="text-xs bg-emerald-100 dark:bg-emerald-900">{t('gemini_ai')}</Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => fetchInsights(true)} disabled={loading} className="gap-2" aria-label={t('refresh')}>
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
                        {loading ? t('refreshing') : t('refresh')}
                    </Button>
                </div>
                {entries.length > 0 && (
                    <div className="flex items-center gap-4 mt-2 pt-2 border-t border-emerald-100 dark:border-emerald-800">
                        <span className="text-xs text-muted-foreground">{t('total_footprint')}: <span className="font-semibold text-emerald-600">{Math.round(totalCO2)} кг</span></span>
                        <span className="text-xs text-muted-foreground">{t('entries')}: <span className="font-semibold">{entries.length}</span></span>
                    </div>
                )}
            </CardHeader>
            <CardContent className="space-y-5">
                {error && (
                    <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-xl">
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}
                <AnimatePresence mode="wait">
                    <motion.div key={insights.join(',')} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-3">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Lightbulb className="w-4 h-4 text-amber-500" aria-hidden="true" />
                                <h3 className="font-semibold text-sm">{entries.length ? t('personal_recommendations') : t('tips_to_start')}</h3>
                            </div>
                            <div className="space-y-2">
                                {insights.map((rec, index) => (
                                    <motion.div key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="flex items-start gap-3 p-3 bg-white/50 dark:bg-black/20 rounded-xl hover:bg-white/70 dark:hover:bg-black/30 transition-colors">
                                        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0">
                                            {index === 0 ? <TrendingUp className="w-3 h-3 text-emerald-600" aria-hidden="true" /> : <span className="text-xs font-bold text-emerald-600">{index + 1}</span>}
                                        </div>
                                        <p className="text-sm leading-relaxed" aria-label={`${t('tip')} ${index + 1}: ${rec}`}>{rec}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                        <div className="p-3 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 rounded-xl text-center">
                            <Heart className="w-4 h-4 text-emerald-500 mx-auto mb-1" aria-hidden="true" />
                            <p className="text-xs text-muted-foreground">{entries.length ? t('insights_note') : t('insights_empty_note')}</p>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg">
                            <Leaf className="w-3 h-3 text-emerald-500 flex-shrink-0" aria-hidden="true" />
                            <p className="text-xs text-muted-foreground">{t('tree_absorbs_co2')}</p>
                        </div>
                        {lastUpdated && entries.length > 0 && <p className="text-xs text-center text-muted-foreground pt-1">{t('updated_at', { time: lastUpdated.toLocaleTimeString('ru-RU') })}</p>}
                    </motion.div>
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}