// app/community/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, Globe, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const leaderboard = [
    { rank: 1, name: "Анна Ковалёва", reduction: 1240, country: "🇷🇺", avatar: "🌱" },
    { rank: 2, name: "Максим Турсунов", reduction: 980, country: "🇰🇿", avatar: "🏆" },
    { rank: 3, name: "Елена Воронова", reduction: 850, country: "🇷🇺", avatar: "🌍" },
    { rank: 4, name: "Дмитрий Соколов", reduction: 720, country: "🇧🇾", avatar: "🍃" },
    { rank: 5, name: "Софья Морозова", reduction: 650, country: "🇷🇺", avatar: "🌿" },
];

export default function CommunityPage() {
    return (
        <div className="space-y-12">
            <div className="text-center">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ duration: 0.6 }}>
                    <Globe className="w-20 h-20 mx-auto text-emerald-600 mb-6" />
                </motion.div>
                <h1 className="text-5xl font-bold tracking-tighter mb-4">Сообщество EcoTrackr</h1>
                <p className="text-2xl text-muted-foreground">
                    Вместе мы уже сэкономили <span className="font-semibold text-emerald-600">34.8 тонн CO₂e</span>
                </p>
            </div>

            {/* Статистика сообщества */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Участников", value: "2,847", icon: Users },
                    { label: "Стран", value: "28", icon: Globe },
                    { label: "Сэкономлено сегодня", value: "184 кг", icon: TrendingUp },
                ].map((stat, i) => (
                    <Card key={i}>
                        <CardContent className="p-8 text-center">
                            <stat.icon className="w-10 h-10 mx-auto mb-4 text-emerald-600" />
                            <div className="text-4xl font-bold">{stat.value}</div>
                            <p className="text-muted-foreground mt-2">{stat.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Лидерборд */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl">
                        <Trophy className="text-amber-500" /> Глобальный Лидерборд
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {leaderboard.map((user, index) => (
                            <motion.div
                                key={user.rank}
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.08 }}
                                className="flex items-center justify-between p-6 bg-white dark:bg-zinc-900 rounded-3xl border hover:shadow-md transition-all group"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-12 text-center">
                                        <span className="text-4xl font-bold text-amber-500">#{user.rank}</span>
                                    </div>
                                    <div className="text-5xl transition-transform group-hover:scale-110">{user.avatar}</div>
                                    <div>
                                        <div className="font-semibold text-xl">{user.name}</div>
                                        <div className="text-sm text-muted-foreground">{user.country}</div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-3xl font-bold text-emerald-600">-{user.reduction} кг</div>
                                    <p className="text-sm uppercase tracking-widest text-emerald-600/80">CO₂e</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}