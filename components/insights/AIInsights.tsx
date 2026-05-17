'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Sparkles, TrendingUp, Lightbulb, Heart, RefreshCw, Leaf, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCo2e } from '@/lib/utils';
import type { FootprintEntry } from '@/lib/profile';

interface AIInsightsProps {
    entries: FootprintEntry[];
    totalCO2: number;
}

export default function AIInsights({ entries, totalCO2 }: AIInsightsProps) {
    const { t, i18n } = useTranslation('common');
    const [insights, setInsights] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const requestIdRef = useRef(0);
    const abortControllerRef = useRef<AbortController | null>(null);
    const lastAutoFetchKeyRef = useRef('');

    const appLanguage = i18n.language.toLowerCase().startsWith('ru') ? 'ru' : 'en';
    const entriesRef = useRef(entries);
    const totalCO2Ref = useRef(totalCO2);
    entriesRef.current = entries;
    totalCO2Ref.current = totalCO2;

    const getLocalFallbackInsights = (lang: 'en' | 'ru') => ([
        i18n.t('keep_tracking', { lng: lang }),
        i18n.t('regularity_is_key', { lng: lang }),
        i18n.t('share_success', { lng: lang }),
        i18n.t('every_action_matters', { lng: lang }),
    ]);

    const fetchInsights = useCallback(async (forceRefresh = false) => {
        const currentEntries = entriesRef.current;
        const currentTotal = totalCO2Ref.current;
        const lang = i18n.language.toLowerCase().startsWith('ru') ? 'ru' : 'en';

        if (currentEntries.length === 0) {
            setInsights([
                i18n.t('no_data_insights', { lng: lang }),
                i18n.t('add_first_entries', { lng: lang }),
                i18n.t('start_with_transport', { lng: lang }),
                i18n.t('more_data_more_tips', { lng: lang }),
            ]);
            return;
        }

        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;
        const requestId = ++requestIdRef.current;

        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/ai-insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    totalCO2: currentTotal,
                    entries: currentEntries.slice(0, 10).map(e => ({ category: e.category, activity: e.activity, value: e.value, co2e: e.co2e, date: e.date })),
                    refresh: forceRefresh,
                    lang,
                    labels: {
                        noEntries: i18n.t('no_entries', { lng: lang }),
                        units: i18n.t('units', { lng: lang }),
                        kg: i18n.t('kg', { lng: lang }),
                    },
                })
            });
            if (requestId !== requestIdRef.current) return;
            if (!res.ok) throw new Error(i18n.t('insights_error', { lng: lang }));
            const data = await res.json();
            if (requestId !== requestIdRef.current) return;

            const nextInsights = Array.isArray(data.insights) && data.insights.length > 0
                ? data.insights
                : getLocalFallbackInsights(lang);

            setInsights(nextInsights);
            setLastUpdated(new Date());
        } catch (e) {
            if (e instanceof DOMException && e.name === 'AbortError') return;
            if (requestId !== requestIdRef.current) return;
            setError(i18n.t('insights_error', { lng: lang }));
            setInsights(getLocalFallbackInsights(lang));
        } finally {
            if (requestId === requestIdRef.current) {
                setLoading(false);
            }
        }
    }, [i18n]);

    useEffect(() => {
        const fetchKey = `${appLanguage}:${totalCO2}:${entries.length}:${entries[0]?.date ?? ''}:${entries[0]?.activity ?? ''}`;
        if (lastAutoFetchKeyRef.current === fetchKey) {
            return;
        }
        lastAutoFetchKeyRef.current = fetchKey;

        void fetchInsights(false);
        return () => {
            abortControllerRef.current?.abort();
        };
    }, [appLanguage, entries, totalCO2, fetchInsights]);

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
                        <span className="text-xs text-muted-foreground">{t('total_footprint')}: <span className="font-semibold text-emerald-600">{formatCo2e(totalCO2)} {t('kg')}</span></span>
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
                        {lastUpdated && entries.length > 0 && (
                            <p className="text-xs text-center text-muted-foreground pt-1">
                                {t('updated_at', {
                                    time: lastUpdated.toLocaleTimeString(appLanguage === 'ru' ? 'ru-RU' : 'en-US'),
                                })}
                            </p>
                        )}
                    </motion.div>
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}