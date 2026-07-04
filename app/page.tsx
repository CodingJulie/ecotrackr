// app/page.tsx
'use client';

import {Button} from '@/components/ui/Button';
import {Card, CardContent} from '@/components/ui/Card';
import {Badge} from '@/components/ui/Badge';
import {
    ArrowRight,
    BarChart3,
    Calendar,
    Car,
    ChevronUp,
    Cloud,
    Globe,
    Heart,
    Home,
    Leaf,
    LineChart,
    MapPin,
    Moon,
    Recycle,
    Shield,
    ShoppingBag,
    Sun,
    Target,
    TreePine,
    TrendingDown,
    Users,
    Utensils
} from 'lucide-react';
import {AnimatePresence, motion} from 'framer-motion';
import Link from 'next/link';
import {useEffect, useRef, useState} from 'react';
import {useTheme} from 'next-themes';
import {supabase} from '@/lib/supabase';
import {MainLoader} from "@/components/ui/MainLoader";
import InstallButton from "@/components/ui/InstallButton";
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import {useTranslation} from 'react-i18next';

function Loader() {
    const [mounted, setMounted] = useState(false);
    const { resolvedTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="fixed inset-0 z-40 flex items-center justify-center transition-colors duration-300 bg-white dark:bg-zinc-950">
                <MainLoader/>
            </div>
        );
    }

    const isDark = resolvedTheme === 'dark';

    return (
        <div className={`fixed inset-0 z-40 flex items-center justify-center transition-colors duration-300 ${
            isDark ? 'bg-zinc-950' : 'bg-white'
        }`}>
            <MainLoader/>
        </div>
    );
}

function FeaturesSection() {
    const { t } = useTranslation('common');

    const features = [
        {
            icon: Car,
            title: t('landing.feature.transport_title'),
            description: t('landing.feature.transport_desc'),
            color: "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
        },
        {
            icon: Utensils,
            title: t('landing.feature.food_title'),
            description: t('landing.feature.food_desc'),
            color: "bg-green-100 text-green-600 dark:bg-green-950/50 dark:text-green-400"
        },
        {
            icon: ShoppingBag,
            title: t('landing.feature.shopping_title'),
            description: t('landing.feature.shopping_desc'),
            color: "bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400"
        },
        {
            icon: Home,
            title: t('landing.feature.home_title'),
            description: t('landing.feature.home_desc'),
            color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-950/50 dark:text-yellow-400"
        },
        {
            icon: LineChart,
            title: t('landing.feature.analytics_title'),
            description: t('landing.feature.analytics_desc'),
            color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
        },
        {
            icon: MapPin,
            title: t('landing.feature.map_title'),
            description: t('landing.feature.map_desc'),
            color: "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400"
        },
        {
            icon: BarChart3,
            title: t('landing.feature.leaderboard_title'),
            description: t('landing.feature.leaderboard_desc'),
            color: "bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400"
        },
        {
            icon: Heart,
            title: t('landing.feature.ai_title'),
            description: t('landing.feature.ai_desc'),
            color: "bg-pink-100 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400"
        },
    ];

    return (
        <section id="features" className="py-24 px-6 bg-white dark:bg-zinc-900">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <Badge variant="outline" className="mb-4 border-emerald-200 text-emerald-700 dark:text-emerald-400">
                        {t('landing.features.title')}
                    </Badge>
                    <h2 className="text-4xl font-bold tracking-tight mb-4 dark:text-white">
                        {t('landing.features.subtitle')}
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto dark:text-zinc-400">
                        {t('landing.features.description')}
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            viewport={{ once: true }}
                            className="group p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300 hover:shadow-lg bg-white dark:bg-zinc-900/50"
                        >
                            <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <feature.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2 dark:text-white">{feature.title}</h3>
                            <p className="text-muted-foreground dark:text-zinc-400">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default function LandingPage() {
    const { t } = useTranslation('common');
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [globalStats, setGlobalStats] = useState({
        totalUsers: 0,
        totalCO2Saved: 0,
        totalEntries: 0,
        countriesCount: 0,
        treesPlanted: 0,
        co2Reduction: 0
    });
    const { theme, setTheme, resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';
    const featuresRef = useRef<HTMLElement | null>(null);
    const screenshotsRef = useRef<HTMLElement | null>(null);
    const impactRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        setMounted(true);
        fetchGlobalStats();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 500);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fetchGlobalStats = async () => {
        try {
            const { count: totalUsers } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            const { data: entries, count: entriesCount } = await supabase
                .from('footprint_entries')
                .select('co2e', { count: 'exact' });

            const totalCO2 = entries?.reduce((sum, e) => sum + (e.co2e || 0), 0) || 0;

            const treesSaved = Math.floor(totalCO2 / 22);
            const reduction = Math.floor(totalCO2 * 0.15);

            setGlobalStats({
                totalUsers: totalUsers || 0,
                totalCO2Saved: Math.round(totalCO2),
                totalEntries: entriesCount || 0,
                countriesCount: 1,
                treesPlanted: treesSaved,
                co2Reduction: reduction
            });
        } catch (error) {
            console.error('Error fetching global stats:', error);
        }
    };

    const scrollToSection = (ref: React.RefObject<HTMLElement | null>) => {
        if (ref.current) {
            const offset = 80;
            const elementPosition = ref.current.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleLogoClick = (e: React.MouseEvent) => {
        e.preventDefault();
        scrollToTop();
    };

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    if (isLoading) {
        return <Loader />;
    }

    if (!mounted) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-900 overflow-hidden">
                <div className="fixed top-0 w-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-200 dark:border-zinc-800 z-50">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-emerald-600 rounded-2xl flex items-center justify-center">
                                <Leaf className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-semibold text-2xl tracking-tight">EcoTrackr</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-emerald-200 rounded-full animate-pulse" />
                            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-emerald-600 rounded-full animate-spin border-t-transparent" />
                            <Leaf className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-emerald-600 animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-900 overflow-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 w-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-200 dark:border-zinc-800 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <button onClick={handleLogoClick} className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                        <div className="w-9 h-9 bg-emerald-600 rounded-2xl flex items-center justify-center">
                            <Leaf className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-semibold text-2xl tracking-tight dark:text-white">EcoTrackr</span>
                    </button>

                    <div className="hidden md:flex items-center gap-8 text-sm dark:text-zinc-300">
                        <button onClick={() => scrollToSection(featuresRef)} className="hover:text-emerald-600 transition-colors cursor-pointer">
                            {t('landing.nav.features')}
                        </button>
                        <button onClick={() => scrollToSection(screenshotsRef)} className="hover:text-emerald-600 transition-colors cursor-pointer">
                            {t('landing.nav.how_it_looks')}
                        </button>
                        <button onClick={() => scrollToSection(impactRef)} className="hover:text-emerald-600 transition-colors cursor-pointer">
                            {t('landing.nav.impact')}
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full" aria-label={isDark ? "Переключить на светлую тему" : "Переключить на тёмную тему"}>
                            {isDark ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-zinc-700" />}
                        </Button>

                        <LanguageSwitcher />

                        <Link href="/login">
                            <Button variant="ghost" className="dark:text-white dark:hover:bg-zinc-800">{t('landing.nav.login')}</Button>
                        </Link>
                        <Link href="/register">
                            <Button className="bg-emerald-600 hover:bg-emerald-700">{t('landing.nav.start_free')}</Button>
                        </Link>

                        <InstallButton />
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 relative">
                <div className="max-w-6xl mx-auto text-center">
                    <Badge variant="outline" className="mb-6 border-emerald-200 text-emerald-700 dark:text-emerald-400 dark:border-emerald-800">
                        {t('landing.hero.badge')}
                    </Badge>

                    <h1 className="text-6xl md:text-7xl font-bold tracking-tighter mb-6 leading-tight dark:text-white">
                        {t('landing.hero.title_part1')}<br />
                        <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                            {t('landing.hero.title_part2')}
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 dark:text-zinc-300">
                        {t('landing.hero.description')}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link href="/register">
                            <Button size="lg" className="text-lg px-10 py-7 rounded-2xl font-medium bg-emerald-600 hover:bg-emerald-700">
                                {t('landing.hero.start_free')}
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>

                        <Button
                            size="lg"
                            variant="outline"
                            className="text-lg px-10 py-7 rounded-2xl dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800 cursor-pointer"
                            onClick={() => scrollToSection(screenshotsRef)}
                            aria-label={t('landing.hero.view_demo')}
                        >
                            {t('landing.hero.view_demo')}
                        </Button>

                        <InstallButton />
                    </div>

                    <p className="mt-6 text-sm text-muted-foreground dark:text-zinc-400">
                        {t('landing.hero.users', { count: globalStats.totalUsers.toLocaleString() })}
                    </p>
                </div>

                {/* Hero Image */}
                <div className="mt-16 max-w-5xl mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="relative rounded-3xl overflow-hidden shadow-2xl border border-emerald-100 dark:border-emerald-900 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 h-[400px] flex items-center justify-center"
                    >
                        <div className="text-center">
                            <Leaf className="w-20 h-20 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
                            <p className="text-emerald-700 dark:text-emerald-300 font-medium">{t('landing.hero.preview_title')}</p>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2">{t('landing.hero.preview_subtitle')}</p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Real Stats Section */}
            <section className="py-16 px-6 bg-gradient-to-r from-emerald-900 to-teal-900 text-white">
                <div className="max-w-6xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-12">{t('landing.stats.title')}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        <div className="text-center">
                            <Users className="w-10 h-10 mx-auto mb-3 text-emerald-400" />
                            <p className="text-3xl font-bold">{globalStats.totalUsers || 1}</p>
                            <p className="text-sm text-emerald-200">{t('landing.stats.active_users')}</p>
                        </div>
                        <div className="text-center">
                            <Cloud className="w-10 h-10 mx-auto mb-3 text-emerald-400" />
                            <p className="text-3xl font-bold">{globalStats.totalCO2Saved.toLocaleString()}</p>
                            <p className="text-sm text-emerald-200">{t('landing.stats.co2_reduced')}</p>
                        </div>
                        <div className="text-center">
                            <TreePine className="w-10 h-10 mx-auto mb-3 text-emerald-400" />
                            <p className="text-3xl font-bold">{globalStats.treesPlanted.toLocaleString()}</p>
                            <p className="text-sm text-emerald-200">{t('landing.stats.trees_saved')}</p>
                        </div>
                        <div className="text-center">
                            <Globe className="w-10 h-10 mx-auto mb-3 text-emerald-400" />
                            <p className="text-3xl font-bold">{globalStats.countriesCount}</p>
                            <p className="text-sm text-emerald-200">{t('landing.stats.countries')}</p>
                        </div>
                        <div className="text-center">
                            <Recycle className="w-10 h-10 mx-auto mb-3 text-emerald-400" />
                            <p className="text-3xl font-bold">{globalStats.totalEntries.toLocaleString()}</p>
                            <p className="text-sm text-emerald-200">{t('landing.stats.entries')}</p>
                        </div>
                        <div className="text-center">
                            <TrendingDown className="w-10 h-10 mx-auto mb-3 text-emerald-400" />
                            <p className="text-3xl font-bold">{Math.round(globalStats.co2Reduction / 1000)}т</p>
                            <p className="text-sm text-emerald-200">{t('landing.stats.co2_prevented')}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section ref={featuresRef} id="features">
                <FeaturesSection />
            </section>

            {/* Screenshots Section */}
            <section ref={screenshotsRef} id="screenshots" className="py-24 px-6 bg-white dark:bg-zinc-900">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <Badge variant="outline" className="mb-4 border-emerald-200 text-emerald-700 dark:text-emerald-400">
                            {t('landing.screenshots.title')}
                        </Badge>
                        <h2 className="text-4xl font-bold tracking-tight mb-4 dark:text-white">
                            {t('landing.screenshots.subtitle')}
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto dark:text-zinc-400">
                            {t('landing.screenshots.description')}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {[
                            {
                                title: t('landing.screenshots.dashboard_title'),
                                desc: t('landing.screenshots.dashboard_desc'),
                                icon: BarChart3,
                                color: "from-emerald-500 to-teal-500"
                            },
                            {
                                title: t('landing.screenshots.ai_title'),
                                desc: t('landing.screenshots.ai_desc'),
                                icon: Heart,
                                color: "from-rose-500 to-pink-500"
                            },
                            {
                                title: t('landing.screenshots.add_title'),
                                desc: t('landing.screenshots.add_desc'),
                                icon: Calendar,
                                color: "from-blue-500 to-cyan-500"
                            },
                            {
                                title: t('landing.screenshots.community_title'),
                                desc: t('landing.screenshots.community_desc'),
                                icon: Target,
                                color: "from-purple-500 to-indigo-500"
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
                                <div className={`relative rounded-3xl overflow-hidden shadow-xl border border-emerald-100 dark:border-zinc-800 aspect-video bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                                    <item.icon className="w-16 h-16 text-white opacity-50 group-hover:scale-110 transition-transform duration-500" />
                                </div>
                                <div className="mt-6">
                                    <h3 className="text-2xl font-semibold mb-2 dark:text-white">{item.title}</h3>
                                    <p className="text-muted-foreground dark:text-zinc-400">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Impact Section */}
            <section ref={impactRef} id="impact" className="py-24 px-6 bg-emerald-950 text-white">
                <div className="max-w-5xl mx-auto text-center">
                    <Globe className="w-20 h-20 mx-auto mb-8 text-emerald-400" />

                    <h2 className="text-5xl font-bold tracking-tighter mb-6">
                        {t('landing.impact.title')}
                    </h2>

                    <p className="text-xl text-emerald-100/80 max-w-2xl mx-auto mb-12">
                        {t('landing.impact.description', {
                            co2: Math.round(globalStats.co2Reduction / 1000),
                            trees: globalStats.treesPlanted.toLocaleString()
                        })}
                    </p>

                    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <Card className="bg-white/10 border-white/20 text-white hover:bg-white/15 transition-all">
                            <CardContent className="pt-8 pb-8 text-center">
                                <Users className="w-10 h-10 mx-auto mb-4 text-emerald-400" />
                                <div className="text-5xl font-bold mb-3">{globalStats.totalUsers.toLocaleString()}</div>
                                <p className="text-emerald-100/80">{t('landing.impact.active_users')}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-white/10 border-white/20 text-white hover:bg-white/15 transition-all">
                            <CardContent className="pt-8 pb-8 text-center">
                                <Cloud className="w-10 h-10 mx-auto mb-4 text-emerald-400" />
                                <div className="text-5xl font-bold mb-3">{Math.round(globalStats.totalCO2Saved / 1000)}т</div>
                                <p className="text-emerald-100/80">{t('landing.impact.co2_saved')}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-white/10 border-white/20 text-white hover:bg-white/15 transition-all">
                            <CardContent className="pt-8 pb-8 text-center">
                                <TreePine className="w-10 h-10 mx-auto mb-4 text-emerald-400" />
                                <div className="text-5xl font-bold mb-3">{globalStats.treesPlanted.toLocaleString()}</div>
                                <p className="text-emerald-100/80">{t('landing.impact.trees')}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-emerald-400">{globalStats.totalEntries.toLocaleString()}</div>
                            <div className="text-xs text-emerald-200">{t('landing.impact.entries')}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-emerald-400">{globalStats.countriesCount}</div>
                            <div className="text-xs text-emerald-200">{t('landing.impact.countries')}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-emerald-400">-15%</div>
                            <div className="text-xs text-emerald-200">{t('landing.impact.avg_reduction')}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-emerald-400">3.2т</div>
                            <div className="text-xs text-emerald-200">{t('landing.impact.co2_per_user')}</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-24 px-6 bg-white dark:bg-zinc-900">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-4xl font-bold mb-6 dark:text-white">{t('landing.cta.title')}</h2>
                    <p className="text-lg text-muted-foreground mb-10 dark:text-zinc-400">
                        {t('landing.cta.description', { count: globalStats.totalUsers.toLocaleString() })}
                    </p>

                    <Link href="/register">
                        <Button size="lg" className="text-lg px-12 py-7 rounded-2xl bg-emerald-600 hover:bg-emerald-700">
                            {t('landing.cta.button')}
                        </Button>
                    </Link>

                    <p className="text-xs text-muted-foreground mt-8 flex items-center justify-center gap-4 dark:text-zinc-400">
                        <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {t('landing.cta.no_card')}</span>
                        <span className="flex items-center gap-1"><Leaf className="w-3 h-3" /> {t('landing.cta.open_source')}</span>
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {t('landing.cta.transparent')}</span>
                    </p>
                </div>
            </section>

            {/* Кнопка прокрутки наверх */}
            <AnimatePresence>
                {showScrollTop && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={scrollToTop}
                        className="fixed bottom-6 right-6 z-50 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-3 shadow-lg transition-all duration-300 group"
                        aria-label="Прокрутить страницу вверх"
                    >
                        <ChevronUp className="w-6 h-6 group-hover:-translate-y-0.5 transition-transform" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}