'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Leaf,
    TrendingDown,
    Users,
    Award,
    ArrowRight,
    Globe,
    Zap,
    Shield,
    Star
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white dark:from-zinc-950 dark:to-zinc-900 overflow-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 w-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-lg border-b z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-600 rounded-2xl flex items-center justify-center">
                            <Leaf className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-semibold text-2xl tracking-tight">EcoTrackr</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm">
                        <a href="#features" className="hover:text-emerald-600 transition-colors">Возможности</a>
                        <a href="#screenshots" className="hover:text-emerald-600 transition-colors">Как это выглядит</a>
                        <a href="#impact" className="hover:text-emerald-600 transition-colors">Влияние</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/login">
                            <Button variant="ghost">Войти</Button>
                        </Link>
                        <Link href="/register">
                            <Button>Начать бесплатно</Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 relative">
                <div className="max-w-6xl mx-auto text-center">
                    <Badge variant="outline" className="mb-6 border-emerald-200 text-emerald-700 dark:text-emerald-400">
                        Open Source • Для планеты
                    </Badge>

                    <h1 className="text-6xl md:text-7xl font-bold tracking-tighter mb-6 leading-tight">
                        Следи за своим<br />
                        <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              углеродным следом
            </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10">
                        Красивое приложение, которое превращает заботу о климате в привычку.
                        Точные расчёты, персональные советы ИИ и геймификация.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link href="/register">
                            <Button size="lg" className="text-lg px-10 py-7 rounded-2xl font-medium">
                                Начать бесплатно
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>

                        <a href="#screenshots">
                            <Button size="lg" variant="outline" className="text-lg px-10 py-7 rounded-2xl">
                                Посмотреть демо
                            </Button>
                        </a>
                    </div>

                    <p className="mt-6 text-sm text-muted-foreground">
                        Уже более 2 400 человек снижают свой след • Полностью бесплатно
                    </p>
                </div>

                {/* Hero Image */}
                <div className="mt-16 max-w-5xl mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="relative rounded-3xl overflow-hidden shadow-2xl border border-emerald-100 dark:border-emerald-900"
                    >
                        <Image
                            src="/images/dashboard-hero.jpg"
                            alt="EcoTrackr Dashboard"
                            width={1200}
                            height={720}
                            className="w-full object-cover"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </motion.div>
                </div>
            </section>

            {/* Screenshots / Features */}
            <section id="screenshots" className="py-24 px-6 bg-white dark:bg-zinc-900">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold tracking-tight mb-4">Так выглядит EcoTrackr</h2>
                        <p className="text-muted-foreground text-lg">Интуитивно. Красиво. Полезно.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {[
                            {
                                src: "/images/screenshot-dashboard.jpg",
                                title: "Главный дашборд",
                                desc: "Обзор твоего воздействия и прогресса"
                            },
                            {
                                src: "/images/screenshot-insights.jpg",
                                title: "AI Insights",
                                desc: "Персональные рекомендации от искусственного интеллекта"
                            },
                            {
                                src: "/images/screenshot-entry.jpg",
                                title: "Быстрое добавление записи",
                                desc: "Логирование поездок, покупок и питания за секунды"
                            },
                            {
                                src: "/images/screenshot-leaderboard.jpg",
                                title: "Сообщество и лидерборд",
                                desc: "Соревнуйся и мотивируй других"
                            },
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="group"
                            >
                                <div className="relative rounded-3xl overflow-hidden shadow-xl border border-emerald-100 dark:border-zinc-800 aspect-video bg-zinc-100 dark:bg-zinc-800">
                                    <Image
                                        src={item.src}
                                        alt={item.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                                <div className="mt-6">
                                    <h3 className="text-2xl font-semibold mb-2">{item.title}</h3>
                                    <p className="text-muted-foreground">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Impact Section */}
            <section id="impact" className="py-24 px-6 bg-emerald-950 text-white">
                <div className="max-w-5xl mx-auto text-center">
                    <Globe className="w-20 h-20 mx-auto mb-8 text-emerald-400" />

                    <h2 className="text-5xl font-bold tracking-tighter mb-6">
                        Маленькие действия.<br />Большое влияние.
                    </h2>

                    <p className="text-xl text-emerald-100/80 max-w-2xl mx-auto mb-12">
                        Если каждый из нас снизит свой углеродный след хотя бы на 10–15%,
                        мы вместе сможем существенно помочь планете.
                    </p>

                    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        {[
                            { number: "12.4т", label: "CO₂e уже сэкономлено пользователями" },
                            { number: "94%", label: "пользователей снизили свой footprint" },
                            { number: "28", label: "стран представлено в сообществе" },
                        ].map((stat, i) => (
                            <Card key={i} className="bg-white/10 border-white/20 text-white">
                                <CardContent className="pt-8 pb-8 text-center">
                                    <div className="text-5xl font-bold mb-3">{stat.number}</div>
                                    <p className="text-emerald-100/80">{stat.label}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-24 px-6">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-4xl font-bold mb-6">Готов сделать свой вклад?</h2>
                    <p className="text-lg text-muted-foreground mb-10">
                        Присоединяйся к тысячам людей, которые уже меняют свои привычки.
                    </p>

                    <Link href="/register">
                        <Button size="lg" className="text-lg px-12 py-7 rounded-2xl">
                            Создать аккаунт бесплатно
                        </Button>
                    </Link>

                    <p className="text-xs text-muted-foreground mt-8 flex items-center justify-center gap-2">
                        <Shield className="w-4 h-4" /> Без карты • Открытый исходный код • Полная прозрачность данных
                    </p>
                </div>
            </section>
        </div>
    );
}