'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Plus, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const categories = [
    { value: 'transport', label: '🚗 Транспорт' },
    { value: 'energy', label: '⚡ Энергия' },
    { value: 'food', label: '🍎 Питание' },
    { value: 'shopping', label: '🛍️ Покупки' },
];

const emissionFactors: any = {
    transport: { car: 0.192, plane: 0.24, train: 0.041, bus: 0.089 },
    energy: { electricity: 0.475, gas: 0.202 },
    food: { beef: 99.5, chicken: 14.0, vegetables: 2.5, dairy: 8.5 },
    shopping: { clothes: 15, electronics: 120, plastic: 3.5 },
};

export default function CO2Calculator() {
    const [entries, setEntries] = useState<any[]>([]);
    const [currentEntry, setCurrentEntry] = useState({
        category: 'transport',
        activity: 'car',
        value: 10,
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchEntries();
    }, []);

    const fetchEntries = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('footprint_entries')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (data) setEntries(data);
        setLoading(false);
    };

    const addEntry = async () => {
        const factor = emissionFactors[currentEntry.category]?.[currentEntry.activity] || 0;
        const co2e = Number((currentEntry.value * factor).toFixed(2));

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const newEntry = {
            user_id: user.id,
            category: currentEntry.category,
            activity: currentEntry.activity,
            value: currentEntry.value,
            co2e,
            date: new Date().toISOString().split('T')[0],
        };

        const { error } = await supabase.from('footprint_entries').insert(newEntry);
        if (!error) {
            fetchEntries();
            setCurrentEntry({ ...currentEntry, value: 10 });
        }
    };

    const deleteEntry = async (id: string) => {
        await supabase.from('footprint_entries').delete().eq('id', id);
        fetchEntries();
    };

    const totalCO2 = useMemo(() =>
        entries.reduce((sum, entry) => sum + entry.co2e, 0), [entries]
    );

    const categoryData = useMemo(() => {
        const grouped = entries.reduce((acc: any, entry) => {
            acc[entry.category] = (acc[entry.category] || 0) + entry.co2e;
            return acc;
        }, {});
        return Object.entries(grouped).map(([name, value]) => ({ name, value: Number(value) }));
    }, [entries]);

    return (
        <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl text-zinc-900 dark:text-white">
                    <Leaf className="text-emerald-600" />
                    Калькулятор углеродного следа
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-8">
                {/* Форма добавления */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <Label>Категория</Label>
                        <Select
                            value={currentEntry.category}
                            onValueChange={(v) => setCurrentEntry({
                                ...currentEntry,
                                category: v,
                                activity: Object.keys(emissionFactors[v])[0]
                            })}
                        >
                            <SelectTrigger className="bg-white dark:bg-zinc-900">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(cat => (
                                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Активность</Label>
                        <Select
                            value={currentEntry.activity}
                            onValueChange={(v) => setCurrentEntry({ ...currentEntry, activity: v })}
                        >
                            <SelectTrigger className="bg-white dark:bg-zinc-900">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.keys(emissionFactors[currentEntry.category] || {}).map(key => (
                                    <SelectItem key={key} value={key}>{key}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Значение</Label>
                        <Input
                            type="number"
                            value={currentEntry.value}
                            onChange={(e) => setCurrentEntry({ ...currentEntry, value: Number(e.target.value) })}
                            className="bg-white dark:bg-zinc-900"
                        />
                    </div>

                    <div className="flex items-end">
                        <Button onClick={addEntry} className="w-full h-11">
                            <Plus className="mr-2" /> Добавить
                        </Button>
                    </div>
                </div>

                {/* Графики */}
                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        <CardHeader><CardTitle className="text-lg">По категориям</CardTitle></CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={categoryData}>
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#10b981" radius={8} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        <CardHeader><CardTitle className="text-lg">Структура следа</CardTitle></CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} dataKey="value">
                                        {categoryData.map((_, index) => (
                                            <Cell key={index} fill={['#10b981', '#34d399', '#6ee7b7', '#a1f2c5'][index % 4]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Итог */}
                <div className="bg-emerald-50 dark:bg-emerald-950/50 p-8 rounded-3xl text-center border border-emerald-100 dark:border-emerald-900">
                    <p className="text-zinc-600 dark:text-zinc-400">Общий углеродный след</p>
                    <p className="text-6xl font-bold text-emerald-600 mt-3">
                        {totalCO2.toFixed(1)} <span className="text-3xl">кг CO₂e</span>
                    </p>
                </div>

                {/* Список записей */}
                {entries.length > 0 && (
                    <div>
                        <h3 className="font-semibold mb-4 text-zinc-900 dark:text-white">Ваши записи ({entries.length})</h3>
                        <div className="space-y-3 max-h-96 overflow-auto">
                            {entries.map(entry => (
                                <div key={entry.id} className="flex justify-between items-center bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                                    <div>
                                        <div className="font-medium capitalize">{entry.category} — {entry.activity}</div>
                                        <div className="text-sm text-zinc-500 dark:text-zinc-400">{entry.date}</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right font-mono">
                                            {entry.value} → <span className="text-emerald-600 font-semibold">{entry.co2e} кг</span>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => deleteEntry(entry.id)}>
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}