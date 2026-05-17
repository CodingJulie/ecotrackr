'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { RefreshCw, Leaf, Loader2, Settings2, TrendingUp, Car, Home, Utensils, Zap, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserLifestyle {
    housing_type: 'apartment' | 'house';
    location_type: 'city' | 'suburb' | 'rural';
    house_area: number;
    residents_count: number;
    transport_primary: 'car_petrol' | 'car_diesel' | 'car_hybrid' | 'car_electric' | 'bus' | 'metro' | 'train' | 'bicycle' | 'walking';
    transport_days_per_week: number;
    transport_distance_km: number;
    meals_per_day: number;
    meat_frequency: 'often' | 'moderate' | 'rare' | 'none';
    showers_per_day: number;
    computer_hours_per_day: number;
    heating_type: 'gas' | 'electricity' | 'solar' | 'none';
    weekly_flights: number;
}

interface GenerationPeriod {
    value: 'week' | 'month' | 'quarter' | 'year';
    days: number;
}

const GENERATION_PERIODS: GenerationPeriod[] = [
    { value: 'week', days: 7 },
    { value: 'month', days: 30 },
    { value: 'quarter', days: 90 },
    { value: 'year', days: 365 },
];

const EMISSION_FACTORS = {
    housing: {
        apartment: { city: 0.8, suburb: 0.6, rural: 0.4 },
        house: { city: 1.2, suburb: 1.0, rural: 0.8 },
        heating: { gas: 0.202, electricity: 0.475, solar: 0.05, none: 0 },
    },
    transport: {
        car_petrol: 0.192,
        car_diesel: 0.168,
        car_hybrid: 0.11,
        car_electric: 0.05,
        bus: 0.089,
        metro: 0.033,
        train: 0.041,
        bicycle: 0,
        walking: 0,
    },
    food: {
        meals_base: 2.5,
        meat_multiplier: { often: 1.5, moderate: 1.0, rare: 0.6, none: 0.3 },
    },
    home: {
        shower: 0.5,
        computer: 0.05,
    },
    flight: 0.255,
};

const DEFAULT_LIFESTYLE: UserLifestyle = {
    housing_type: 'apartment',
    location_type: 'city',
    house_area: 60,
    residents_count: 2,
    transport_primary: 'car_petrol',
    transport_days_per_week: 5,
    transport_distance_km: 15,
    meals_per_day: 3,
    meat_frequency: 'moderate',
    showers_per_day: 1,
    computer_hours_per_day: 8,
    heating_type: 'gas',
    weekly_flights: 0,
};

function calculatePeriodCO2(lifestyle: UserLifestyle, days: number) {
    const weeks = days / 7;
    const housingFactor = EMISSION_FACTORS.housing[lifestyle.housing_type][lifestyle.location_type];
    const heatingFactor = EMISSION_FACTORS.housing.heating[lifestyle.heating_type];
    const housingCO2 = (lifestyle.house_area / lifestyle.residents_count) * housingFactor * days;
    const heatingCO2 = lifestyle.house_area * heatingFactor * days;
    const transportFactor = EMISSION_FACTORS.transport[lifestyle.transport_primary];
    const transportCO2 = lifestyle.transport_days_per_week * weeks * lifestyle.transport_distance_km * transportFactor;
    const meatMultiplier = EMISSION_FACTORS.food.meat_multiplier[lifestyle.meat_frequency];
    const foodCO2 = EMISSION_FACTORS.food.meals_base * lifestyle.meals_per_day * meatMultiplier * days;
    const homeDaily = lifestyle.showers_per_day * EMISSION_FACTORS.home.shower
        + lifestyle.computer_hours_per_day * EMISSION_FACTORS.home.computer;
    const homeCO2 = homeDaily * days;
    const flightCO2 = lifestyle.weekly_flights * weeks * 500 * EMISSION_FACTORS.flight;

    return {
        housing: housingCO2 + heatingCO2,
        transport: transportCO2,
        food: foodCO2,
        home: homeCO2,
        additional: flightCO2,
        total: housingCO2 + heatingCO2 + transportCO2 + foodCO2 + homeCO2 + flightCO2,
    };
}

function buildEntriesForBatch(
    lifestyle: UserLifestyle,
    userId: string,
    dateStr: string,
    days: number,
) {
    const co2 = calculatePeriodCO2(lifestyle, days);
    const weeks = days / 7;
    const meatMultiplier = EMISSION_FACTORS.food.meat_multiplier[lifestyle.meat_frequency];
    const transportValue = Math.round(lifestyle.transport_days_per_week * weeks * lifestyle.transport_distance_km);
    const entries = [
        {
            user_id: userId,
            category: 'transport',
            activity: lifestyle.transport_primary,
            value: transportValue,
            co2e: Math.round(co2.transport),
            date: dateStr,
            is_auto_generated: true,
        },
        {
            user_id: userId,
            category: 'food',
            activity: meatMultiplier > 1 ? 'meat_heavy' : meatMultiplier > 0.8 ? 'mixed' : 'vegetarian',
            value: lifestyle.meals_per_day,
            co2e: Math.round(co2.food),
            date: dateStr,
            is_auto_generated: true,
        },
        {
            user_id: userId,
            category: 'home',
            activity: 'utilities',
            value: lifestyle.showers_per_day + lifestyle.computer_hours_per_day,
            co2e: Math.round(co2.home),
            date: dateStr,
            is_auto_generated: true,
        },
        {
            user_id: userId,
            category: 'energy',
            activity: lifestyle.heating_type,
            value: lifestyle.house_area,
            co2e: Math.round(co2.housing),
            date: dateStr,
            is_auto_generated: true,
        },
    ];

    if (lifestyle.weekly_flights > 0) {
        entries.push({
            user_id: userId,
            category: 'transport',
            activity: 'plane',
            value: Math.round(lifestyle.weekly_flights * weeks * 500),
            co2e: Math.round(lifestyle.weekly_flights * weeks * 500 * EMISSION_FACTORS.flight),
            date: dateStr,
            is_auto_generated: true,
        });
    }

    return entries;
}

function NumberInput({
    value,
    onChange,
    min = 0,
    max = 999,
    placeholder,
}: {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    placeholder?: string;
}) {
    const [text, setText] = useState(String(value));

    useEffect(() => {
        setText(String(value));
    }, [value]);

    return (
        <Input
            type="text"
            inputMode="numeric"
            pattern="\d*"
            value={text}
            onChange={(e) => {
                const raw = e.target.value;
                if (raw !== '' && !/^\d+$/.test(raw)) return;
                setText(raw);
                if (raw === '') return;
                onChange(Math.min(max, Math.max(min, parseInt(raw, 10))));
            }}
            onBlur={() => {
                if (text === '') {
                    setText(String(min));
                    onChange(min);
                    return;
                }
                const num = Math.min(max, Math.max(min, parseInt(text, 10) || min));
                setText(String(num));
                onChange(num);
            }}
            placeholder={placeholder}
            className="h-8 text-sm bg-white dark:bg-zinc-800"
        />
    );
}

interface AutoGenerationWidgetProps {
    entries: { id?: string }[];
    user: { id: string } | null;
    onGenerated?: () => void | Promise<void>;
}

export default function AutoGenerationWidget({ entries, user, onGenerated }: AutoGenerationWidgetProps) {
    const { t } = useTranslation('common');
    const [lifestyle, setLifestyle] = useState<UserLifestyle>(DEFAULT_LIFESTYLE);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [estimatedCO2, setEstimatedCO2] = useState<number | null>(null);
    const [breakdown, setBreakdown] = useState<ReturnType<typeof calculatePeriodCO2> | null>(null);
    const [generationPeriod, setGenerationPeriod] = useState<GenerationPeriod>(GENERATION_PERIODS[1]);
    const [generationMessage, setGenerationMessage] = useState<string | null>(null);

    useEffect(() => {
        const loadSettings = async () => {
            if (!user) return;
            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('lifestyle_settings')
                    .eq('id', user.id)
                    .single();
                if (data?.lifestyle_settings) {
                    setLifestyle({ ...DEFAULT_LIFESTYLE, ...data.lifestyle_settings });
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, [user]);

    const saveSettings = async () => {
        try {
            if (!user) return;
            await supabase
                .from('profiles')
                .update({ lifestyle_settings: lifestyle })
                .eq('id', user.id);
            alert(t('settings_saved'));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    };

    const calculateDetailedCO2 = () => {
        const co2 = calculatePeriodCO2(lifestyle, generationPeriod.days);
        setBreakdown({
            housing: Math.round(co2.housing),
            transport: Math.round(co2.transport),
            food: Math.round(co2.food),
            home: Math.round(co2.home),
            additional: Math.round(co2.additional),
            total: Math.round(co2.total),
        });
        setEstimatedCO2(Math.round(co2.total));
        return co2.total;
    };

    const generateEntries = async () => {
        setGenerating(true);
        setGenerationMessage(null);
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            const activeUser = authUser ?? user;
            if (!activeUser) throw new Error(t('user_not_authorized'));

            const totalCO2 = calculateDetailedCO2();
            const batchDays = generationPeriod.value === 'week' || generationPeriod.value === 'month'
                ? generationPeriod.days
                : 30;
            const numPeriods = generationPeriod.value === 'week' || generationPeriod.value === 'month'
                ? 1
                : generationPeriod.value === 'quarter' ? 3 : 12;

            const entriesToInsert = [];
            for (let period = 0; period < numPeriods; period++) {
                const currentDate = new Date();
                if (generationPeriod.value === 'month') currentDate.setMonth(currentDate.getMonth() - period);
                else if (generationPeriod.value === 'quarter') currentDate.setMonth(currentDate.getMonth() - period * 3);
                else if (generationPeriod.value === 'year') currentDate.setMonth(currentDate.getMonth() - period);
                const dateStr = currentDate.toISOString().split('T')[0];
                entriesToInsert.push(
                    ...buildEntriesForBatch(lifestyle, activeUser.id, dateStr, batchDays)
                );
            }

            await supabase
                .from('footprint_entries')
                .delete()
                .eq('user_id', activeUser.id)
                .eq('is_auto_generated', true);

            const { data: inserted, error: insertError } = await supabase
                .from('footprint_entries')
                .insert(entriesToInsert)
                .select('id, co2e, date, category, activity, value, is_auto_generated');

            if (insertError) throw insertError;
            if (!inserted?.length) throw new Error(t('generation_error'));

            const periodLabel = t(`period_${generationPeriod.value}`).toLowerCase();
            await onGenerated?.();
            setGenerationMessage(t('generation_success', {
                count: inserted.length,
                total: totalCO2.toFixed(2),
                period: periodLabel,
            }));
        } catch (error: unknown) {
            console.error('Error generating entries:', error);
            const message = error instanceof Error ? error.message : t('generation_error');
            setGenerationMessage(t('generation_error_detail', { message }));
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex justify-center items-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                </CardContent>
            </Card>
        );
    }

    const transportOptions = [
        { value: 'car_petrol', label: t('transport_option_car_petrol') },
        { value: 'car_diesel', label: t('transport_option_car_diesel') },
        { value: 'car_hybrid', label: t('transport_option_car_hybrid') },
        { value: 'car_electric', label: t('transport_option_car_electric') },
        { value: 'bus', label: t('transport_option_bus') },
        { value: 'metro', label: t('transport_option_metro') },
        { value: 'train', label: t('transport_option_train') },
        { value: 'bicycle', label: t('transport_option_bicycle') },
        { value: 'walking', label: t('transport_option_walking') },
    ] as const;

    return (
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="flex items-center gap-2">
                        <Leaf className="text-emerald-600" aria-hidden="true" />
                        {t('auto_generation')}
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSettings(!showSettings)}
                        aria-label={showSettings ? t('hide_settings') : t('show_settings')}
                    >
                        <Settings2 className="w-4 h-4 mr-2" aria-hidden="true" />
                        {showSettings ? t('hide') : t('settings')}
                    </Button>
                </div>
                {entries.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {t('existing_entries_note', { count: entries.length })}
                    </p>
                )}
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                    <Calendar className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                    <div className="flex-1">
                        <Label className="text-sm">{t('generation_period')}</Label>
                        <Select
                            value={generationPeriod.value}
                            onValueChange={(v) => setGenerationPeriod(
                                GENERATION_PERIODS.find(p => p.value === v) || GENERATION_PERIODS[1]
                            )}
                        >
                            <SelectTrigger className="bg-white dark:bg-zinc-800">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                                {GENERATION_PERIODS.map(period => (
                                    <SelectItem key={period.value} value={period.value}>
                                        {t(`period_${period.value}`)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {estimatedCO2 !== null && breakdown && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        <div className="text-center p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                            <Home className="w-4 h-4 mx-auto mb-1 text-emerald-600" aria-hidden="true" />
                            <p className="text-lg font-bold">{breakdown.housing}</p>
                            <p className="text-xs">{t('housing_short')}</p>
                        </div>
                        <div className="text-center p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                            <Car className="w-4 h-4 mx-auto mb-1 text-emerald-600" aria-hidden="true" />
                            <p className="text-lg font-bold">{breakdown.transport}</p>
                            <p className="text-xs">{t('transport_short')}</p>
                        </div>
                        <div className="text-center p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                            <Utensils className="w-4 h-4 mx-auto mb-1 text-emerald-600" aria-hidden="true" />
                            <p className="text-lg font-bold">{breakdown.food}</p>
                            <p className="text-xs">{t('food_short')}</p>
                        </div>
                        <div className="text-center p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                            <Zap className="w-4 h-4 mx-auto mb-1 text-emerald-600" aria-hidden="true" />
                            <p className="text-lg font-bold">{breakdown.home}</p>
                            <p className="text-xs">{t('home_short')}</p>
                        </div>
                        <div className="text-center p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                            <TrendingUp className="w-4 h-4 mx-auto mb-1 text-emerald-600" aria-hidden="true" />
                            <p className="text-lg font-bold">{breakdown.additional}</p>
                            <p className="text-xs">{t('additional_short')}</p>
                        </div>
                    </div>
                )}

                <Button variant="outline" onClick={calculateDetailedCO2} className="w-full">
                    {t('calculate_estimate')}
                </Button>

                {estimatedCO2 !== null && (
                    <div className="p-4 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-xl text-center">
                        <p className="text-3xl font-bold text-emerald-600">{estimatedCO2}</p>
                        <p className="text-xs text-muted-foreground">
                            {t('kg_co2_period', { period: t(`period_${generationPeriod.value}`).toLowerCase() })}
                        </p>
                    </div>
                )}

                <Button
                    onClick={generateEntries}
                    disabled={generating}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    aria-label={t('generate_for_period_aria', { period: t(`period_${generationPeriod.value}`) })}
                >
                    <RefreshCw className={`mr-2 h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
                    {generating
                        ? t('generating')
                        : t('generate_for_period', { period: t(`period_${generationPeriod.value}`).toLowerCase() })}
                </Button>

                {generationMessage && (
                    <div
                        role="status"
                        className={`p-3 rounded-lg text-sm whitespace-pre-line ${
                            generationMessage.startsWith('✅')
                                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200'
                                : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'
                        }`}
                    >
                        {generationMessage}
                    </div>
                )}

                <AnimatePresence>
                    {showSettings && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4 pt-4 border-t"
                        >
                            <h4 className="font-semibold text-sm">{t('housing')}</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs">{t('housing_type')}</Label>
                                    <Select
                                        value={lifestyle.housing_type}
                                        onValueChange={(v) => setLifestyle({
                                            ...lifestyle,
                                            housing_type: v as UserLifestyle['housing_type'],
                                        })}
                                    >
                                        <SelectTrigger className="h-8 text-sm bg-white dark:bg-zinc-800">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                                            <SelectItem value="apartment">{t('apartment')}</SelectItem>
                                            <SelectItem value="house">{t('house')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs">{t('location_type')}</Label>
                                    <Select
                                        value={lifestyle.location_type}
                                        onValueChange={(v) => setLifestyle({
                                            ...lifestyle,
                                            location_type: v as UserLifestyle['location_type'],
                                        })}
                                    >
                                        <SelectTrigger className="h-8 text-sm bg-white dark:bg-zinc-800">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                                            <SelectItem value="city">{t('city')}</SelectItem>
                                            <SelectItem value="suburb">{t('suburb')}</SelectItem>
                                            <SelectItem value="rural">{t('rural')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs">{t('area')}</Label>
                                    <NumberInput
                                        value={lifestyle.house_area}
                                        onChange={(val) => setLifestyle({ ...lifestyle, house_area: val })}
                                        min={1}
                                        placeholder={t('area_placeholder')}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">{t('residents')}</Label>
                                    <NumberInput
                                        value={lifestyle.residents_count}
                                        onChange={(val) => setLifestyle({ ...lifestyle, residents_count: val })}
                                        min={1}
                                        placeholder={t('residents_placeholder')}
                                    />
                                </div>
                            </div>

                            <h4 className="font-semibold text-sm mt-3">{t('transport')}</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <Label className="text-xs">{t('primary_transport')}</Label>
                                    <Select
                                        value={lifestyle.transport_primary}
                                        onValueChange={(v) => setLifestyle({
                                            ...lifestyle,
                                            transport_primary: v as UserLifestyle['transport_primary'],
                                        })}
                                    >
                                        <SelectTrigger className="h-8 text-sm bg-white dark:bg-zinc-800">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                                            {transportOptions.map(option => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs">{t('days_per_week')}</Label>
                                    <NumberInput
                                        value={lifestyle.transport_days_per_week}
                                        onChange={(val) => setLifestyle({ ...lifestyle, transport_days_per_week: val })}
                                        min={0}
                                        max={7}
                                        placeholder={t('days_placeholder')}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">{t('km_per_day')}</Label>
                                    <NumberInput
                                        value={lifestyle.transport_distance_km}
                                        onChange={(val) => setLifestyle({ ...lifestyle, transport_distance_km: val })}
                                        min={0}
                                        placeholder={t('km_placeholder')}
                                    />
                                </div>
                            </div>

                            <h4 className="font-semibold text-sm mt-3">{t('food')}</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs">{t('meals_per_day')}</Label>
                                    <NumberInput
                                        value={lifestyle.meals_per_day}
                                        onChange={(val) => setLifestyle({ ...lifestyle, meals_per_day: val })}
                                        min={0}
                                        max={10}
                                        placeholder={t('meals_placeholder')}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">{t('meat_frequency')}</Label>
                                    <Select
                                        value={lifestyle.meat_frequency}
                                        onValueChange={(v) => setLifestyle({
                                            ...lifestyle,
                                            meat_frequency: v as UserLifestyle['meat_frequency'],
                                        })}
                                    >
                                        <SelectTrigger className="h-8 text-sm bg-white dark:bg-zinc-800">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                                            <SelectItem value="often">{t('often')}</SelectItem>
                                            <SelectItem value="moderate">{t('moderate')}</SelectItem>
                                            <SelectItem value="rare">{t('rare')}</SelectItem>
                                            <SelectItem value="none">{t('none')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <h4 className="font-semibold text-sm mt-3">{t('home_life')}</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs">{t('showers_per_day')}</Label>
                                    <NumberInput
                                        value={lifestyle.showers_per_day}
                                        onChange={(val) => setLifestyle({ ...lifestyle, showers_per_day: val })}
                                        min={0}
                                        max={10}
                                        placeholder={t('showers_placeholder')}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">{t('computer_hours')}</Label>
                                    <NumberInput
                                        value={lifestyle.computer_hours_per_day}
                                        onChange={(val) => setLifestyle({ ...lifestyle, computer_hours_per_day: val })}
                                        min={0}
                                        max={24}
                                        placeholder={t('hours_placeholder')}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">{t('heating')}</Label>
                                    <Select
                                        value={lifestyle.heating_type}
                                        onValueChange={(v) => setLifestyle({
                                            ...lifestyle,
                                            heating_type: v as UserLifestyle['heating_type'],
                                        })}
                                    >
                                        <SelectTrigger className="h-8 text-sm bg-white dark:bg-zinc-800">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                                            <SelectItem value="gas">{t('gas')}</SelectItem>
                                            <SelectItem value="electricity">{t('electricity')}</SelectItem>
                                            <SelectItem value="solar">{t('solar')}</SelectItem>
                                            <SelectItem value="none">{t('none')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <h4 className="font-semibold text-sm mt-3">{t('additional')}</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs">{t('flights')}</Label>
                                    <NumberInput
                                        value={lifestyle.weekly_flights}
                                        onChange={(val) => setLifestyle({ ...lifestyle, weekly_flights: val })}
                                        min={0}
                                        placeholder={t('flights_placeholder')}
                                    />
                                </div>
                            </div>

                            <Button onClick={saveSettings} variant="outline" size="sm" className="w-full mt-2">
                                {t('save_settings')}
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}
