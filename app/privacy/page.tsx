// app/privacy/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
    Leaf,
    Shield,
    Lock,
    Eye,
    Database,
    Cookie,
    Mail,
    User,
    Trash2,
    CheckCircle,
    AlertCircle,
    ArrowLeft,
    FileText,
    Globe,
    Server,
    Users,
    Clock,
    Download,
    MailCheck,
    Key
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PrivacyPage() {
    const { t } = useTranslation('common');
    const [lastUpdated, setLastUpdated] = useState<string>('');
    const [activeSection, setActiveSection] = useState<string>('intro');

    // ✅ Компактное создание refs через useMemo
    const sectionRefs = useMemo(() => {
        const refs: Record<string, React.MutableRefObject<HTMLDivElement | null>> = {};
        ['intro', 'collect', 'use', 'security', 'cookies', 'rights', 'contact']
            .forEach(key => refs[key] = { current: null });
        return refs;
    }, []);

    useEffect(() => {
        setLastUpdated(new Date().toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }));
    }, []);

    const scrollToSection = useCallback((sectionId: string) => {
        setActiveSection(sectionId);
        const ref = sectionRefs[sectionId];
        if (ref?.current) {
            const offset = 100;
            const elementPosition = ref.current.getBoundingClientRect().top;
            window.scrollTo({ top: elementPosition + window.pageYOffset - offset, behavior: 'smooth' });
        }
    }, [sectionRefs]);

    const sections = useMemo(() => [
        { id: 'intro', label: t('introduction'), icon: FileText },
        { id: 'collect', label: t('data_collection'), icon: Database },
        { id: 'use', label: t('data_usage'), icon: Eye },
        { id: 'security', label: t('data_security'), icon: Shield },
        { id: 'cookies', label: t('cookies'), icon: Cookie },
        { id: 'rights', label: t('user_rights'), icon: Users },
        { id: 'contact', label: t('contacts'), icon: Mail },
    ], [t]);

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 120;
            for (const [id, ref] of Object.entries(sectionRefs)) {
                if (ref.current) {
                    const el = ref.current;
                    const offsetTop = el.offsetTop;
                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + el.offsetHeight) {
                        setActiveSection(id);
                        break;
                    }
                }
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [sectionRefs]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-white dark:from-zinc-950 dark:to-zinc-900">
            {/* Хлебные крошки */}
            <div className="max-w-4xl mx-auto pt-8 px-6">
                <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link href="/" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
                        <Leaf className="w-3 h-3" />
                        {t('home')}
                    </Link>
                    <span>/</span>
                    <span className="text-foreground font-medium">{t('privacy_policy')}</span>
                </nav>
            </div>

            <div className="max-w-6xl mx-auto py-8 px-6">
                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Боковая навигация */}
                    <aside className="lg:col-span-1">
                        <div className="sticky top-24 space-y-4">
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
                                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                                    <Shield className="w-5 h-5 text-emerald-600" />
                                    <span className="font-semibold text-sm">{t('contents')}</span>
                                </div>
                                <nav className="space-y-1">
                                    {sections.map(({ id, label, icon: Icon }) => (
                                        <button
                                            key={id}
                                            onClick={() => scrollToSection(id)}
                                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left ${
                                                activeSection === id
                                                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                                                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground'
                                            }`}
                                        >
                                            <Icon className="w-4 h-4 flex-shrink-0" />
                                            <span>{label}</span>
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 p-4 text-center">
                                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                                    {t('your_data_is_safe')}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {t('gdpr_compliant')}
                                </p>
                            </Card>
                        </div>
                    </aside>

                    {/* Основной контент */}
                    <main className="lg:col-span-3">
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 md:p-12">
                            {/* Заголовок */}
                            <div className="mb-8 pb-8 border-b border-zinc-200 dark:border-zinc-800">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center">
                                        <Shield className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold">{t('privacy_policy')}</h1>
                                        <p className="text-sm text-muted-foreground">
                                            {t('last_updated')} {lastUpdated}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs">
                                        <Lock className="w-3 h-3" />
                                        {t('confidential')}
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 rounded-full text-xs">
                                        <Globe className="w-3 h-3" />
                                        {t('gdpr_compliant')}
                                    </span>
                                </div>
                            </div>

                            {/* Содержание с рефами */}
                            <div className="prose prose-emerald dark:prose-invert max-w-none">
                                {/* 1. Введение */}
                                <div ref={sectionRefs.intro} className="scroll-mt-24">
                                    <section className="mb-10">
                                        <h2 className="text-2xl font-bold flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-emerald-600" />
                                            {t('introduction')}
                                        </h2>
                                        <p className="text-muted-foreground leading-relaxed">
                                            EcoTrackr (далее — «Сервис») уважает вашу конфиденциальность и обязуется защищать
                                            ваши персональные данные. Настоящая Политика конфиденциальности объясняет,
                                            как мы собираем, используем и защищаем вашу информацию при использовании нашего сервиса.
                                        </p>
                                        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl my-4">
                                            <AlertCircle className="w-4 h-4 text-amber-600 inline mr-2" />
                                            <span className="text-sm text-amber-700 dark:text-amber-400">
                                                {t('using_ecotrackr_accepts_privacy')}
                                            </span>
                                        </div>
                                    </section>
                                </div>

                                {/* 2. Какие данные мы собираем */}
                                <div ref={sectionRefs.collect} className="scroll-mt-24">
                                    <section className="mb-10">
                                        <h2 className="text-2xl font-bold flex items-center gap-2">
                                            <Database className="w-5 h-5 text-emerald-600" />
                                            {t('data_collection')}
                                        </h2>
                                        <p className="text-muted-foreground leading-relaxed">
                                            Мы собираем только данные, необходимые для работы сервиса:
                                        </p>

                                        <div className="grid md:grid-cols-2 gap-4 my-4">
                                            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <User className="w-4 h-4 text-emerald-600" />
                                                    <h3 className="font-semibold text-sm">{t('profile_data')}</h3>
                                                </div>
                                                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                                    <li>{t('name_and_email')}</li>
                                                    <li>{t('avatar_optional')}</li>
                                                    <li>{t('user_settings')}</li>
                                                </ul>
                                            </div>

                                            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Database className="w-4 h-4 text-emerald-600" />
                                                    <h4 className="font-semibold text-sm">{t('ecological_data')}</h4>
                                                </div>
                                                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                                    <li>{t('co2_entries')}</li>
                                                    <li>{t('map_points')}</li>
                                                    <li>{t('progress_achievements')}</li>
                                                </ul>
                                            </div>

                                            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Server className="w-4 h-4 text-emerald-600" />
                                                    <h4 className="font-semibold text-sm">{t('technical_data')}</h4>
                                                </div>
                                                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                                    <li>{t('ip_anonymized')}</li>
                                                    <li>{t('browser_type_device')}</li>
                                                    <li>{t('visit_time')}</li>
                                                </ul>
                                            </div>

                                            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Cookie className="w-4 h-4 text-emerald-600" />
                                                    <h4 className="font-semibold text-sm">{t('cookies_and_analytics')}</h4>
                                                </div>
                                                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                                    <li>{t('session_cookies')}</li>
                                                    <li>{t('theme_preferences')}</li>
                                                    <li>{t('anonymous_analytics')}</li>
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl">
                                            <CheckCircle className="w-4 h-4 text-green-600 inline mr-2" />
                                            <span className="text-sm text-green-700 dark:text-green-400">
                                                <strong>{t('important')}:</strong> {t('no_payment_data')}
                                            </span>
                                        </div>
                                    </section>
                                </div>

                                {/* 3. Как мы используем ваши данные */}
                                <div ref={sectionRefs.use} className="scroll-mt-24">
                                    <section className="mb-10">
                                        <h2 className="text-2xl font-bold flex items-center gap-2">
                                            <Eye className="w-5 h-5 text-emerald-600" />
                                            {t('data_usage')}
                                        </h2>
                                        <p className="text-muted-foreground leading-relaxed">
                                            Ваши данные используются исключительно для:
                                        </p>
                                        <ul className="space-y-2 my-4">
                                            <li className="flex items-start gap-3">
                                                <CheckCircle className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                                                <div>
                                                    <span className="font-medium">{t('footprint_calculation')}</span>
                                                    <p className="text-sm text-muted-foreground">{t('footprint_calculation_desc')}</p>
                                                </div>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <CheckCircle className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                                                <div>
                                                    <span className="font-medium">{t('personalized_recommendations')}</span>
                                                    <p className="text-sm text-muted-foreground">{t('personalized_recommendations_desc')}</p>
                                                </div>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <CheckCircle className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                                                <div>
                                                    <span className="font-medium">{t('progress_visualization')}</span>
                                                    <p className="text-sm text-muted-foreground">{t('progress_visualization_desc')}</p>
                                                </div>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <CheckCircle className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                                                <div>
                                                    <span className="font-medium">{t('service_improvement')}</span>
                                                    <p className="text-sm text-muted-foreground">{t('service_improvement_desc')}</p>
                                                </div>
                                            </li>
                                        </ul>
                                    </section>
                                </div>

                                {/* 4. Безопасность данных */}
                                <div ref={sectionRefs.security} className="scroll-mt-24">
                                    <section className="mb-10">
                                        <h2 className="text-2xl font-bold flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-emerald-600" />
                                            {t('data_security')}
                                        </h2>
                                        <p className="text-muted-foreground leading-relaxed">
                                            Мы принимаем серьёзные меры для защиты ваших данных:
                                        </p>

                                        <div className="grid sm:grid-cols-2 gap-4 my-4">
                                            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                                <Lock className="w-5 h-5 text-emerald-600 mb-2" />
                                                <h4 className="font-semibold text-sm">{t('encryption')}</h4>
                                                <p className="text-xs text-muted-foreground">{t('encryption_desc')}</p>
                                            </div>
                                            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                                <Key className="w-5 h-5 text-emerald-600 mb-2" />
                                                <h4 className="font-semibold text-sm">{t('authentication')}</h4>
                                                <p className="text-xs text-muted-foreground">{t('authentication_desc')}</p>
                                            </div>
                                            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                                <Clock className="w-5 h-5 text-emerald-600 mb-2" />
                                                <h4 className="font-semibold text-sm">{t('regular_audits')}</h4>
                                                <p className="text-xs text-muted-foreground">{t('regular_audits_desc')}</p>
                                            </div>
                                            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                                <Server className="w-5 h-5 text-emerald-600 mb-2" />
                                                <h4 className="font-semibold text-sm">{t('secure_storage')}</h4>
                                                <p className="text-xs text-muted-foreground">{t('secure_storage_desc')}</p>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                {/* 5. Cookie */}
                                <div ref={sectionRefs.cookies} className="scroll-mt-24">
                                    <section className="mb-10">
                                        <h2 className="text-2xl font-bold flex items-center gap-2">
                                            <Cookie className="w-5 h-5 text-emerald-600" />
                                            {t('cookies')}
                                        </h2>
                                        <p className="text-muted-foreground leading-relaxed">
                                            Мы используем cookie для улучшения работы сервиса:
                                        </p>
                                        <div className="overflow-x-auto my-4">
                                            <table className="w-full text-sm border-collapse">
                                                <thead>
                                                <tr className="bg-zinc-50 dark:bg-zinc-800">
                                                    <th className="p-3 text-left border border-zinc-200 dark:border-zinc-700">{t('type')}</th>
                                                    <th className="p-3 text-left border border-zinc-200 dark:border-zinc-700">{t('purpose')}</th>
                                                    <th className="p-3 text-left border border-zinc-200 dark:border-zinc-700">{t('duration')}</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                <tr>
                                                    <td className="p-3 border border-zinc-200 dark:border-zinc-700 font-medium">{t('session')}</td>
                                                    <td className="p-3 border border-zinc-200 dark:border-zinc-700">{t('session_purpose')}</td>
                                                    <td className="p-3 border border-zinc-200 dark:border-zinc-700">{t('session_duration')}</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-3 border border-zinc-200 dark:border-zinc-700 font-medium">{t('preferences')}</td>
                                                    <td className="p-3 border border-zinc-200 dark:border-zinc-700">{t('preferences_purpose')}</td>
                                                    <td className="p-3 border border-zinc-200 dark:border-zinc-700">{t('preferences_duration')}</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-3 border border-zinc-200 dark:border-zinc-700 font-medium">{t('analytics')}</td>
                                                    <td className="p-3 border border-zinc-200 dark:border-zinc-700">{t('analytics_purpose')}</td>
                                                    <td className="p-3 border border-zinc-200 dark:border-zinc-700">{t('analytics_duration')}</td>
                                                </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {t('cookie_management')}
                                        </p>
                                    </section>
                                </div>

                                {/* 6. Права пользователей */}
                                <div ref={sectionRefs.rights} className="scroll-mt-24">
                                    <section className="mb-10">
                                        <h2 className="text-2xl font-bold flex items-center gap-2">
                                            <Users className="w-5 h-5 text-emerald-600" />
                                            {t('user_rights')}
                                        </h2>
                                        <p className="text-muted-foreground leading-relaxed">
                                            В соответствии с GDPR и ФЗ-152, вы имеете право:
                                        </p>
                                        <div className="grid sm:grid-cols-2 gap-3 my-4">
                                            <div className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                                                <Eye className="w-4 h-4 text-emerald-600 mt-0.5" />
                                                <div>
                                                    <span className="font-medium text-sm">{t('right_to_access')}</span>
                                                    <p className="text-xs text-muted-foreground">{t('right_to_access_desc')}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                                                <Download className="w-4 h-4 text-emerald-600 mt-0.5" />
                                                <div>
                                                    <span className="font-medium text-sm">{t('right_to_export')}</span>
                                                    <p className="text-xs text-muted-foreground">{t('right_to_export_desc')}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                                                <Trash2 className="w-4 h-4 text-red-500 mt-0.5" />
                                                <div>
                                                    <span className="font-medium text-sm">{t('right_to_delete')}</span>
                                                    <p className="text-xs text-muted-foreground">{t('right_to_delete_desc')}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                                                <MailCheck className="w-4 h-4 text-emerald-600 mt-0.5" />
                                                <div>
                                                    <span className="font-medium text-sm">{t('right_to_unsubscribe')}</span>
                                                    <p className="text-xs text-muted-foreground">{t('right_to_unsubscribe_desc')}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                                            <AlertCircle className="w-4 h-4 text-blue-600 inline mr-2" />
                                            <span className="text-sm text-blue-700 dark:text-blue-400">
                                                {t('rights_contact')} <strong>privacy@ecotrackr.com</strong>
                                            </span>
                                        </div>
                                    </section>
                                </div>

                                {/* 7. Контакты */}
                                <div ref={sectionRefs.contact} className="scroll-mt-24">
                                    <section className="mb-10">
                                        <h2 className="text-2xl font-bold flex items-center gap-2">
                                            <Mail className="w-5 h-5 text-emerald-600" />
                                            {t('contacts')}
                                        </h2>
                                        <p className="text-muted-foreground leading-relaxed">
                                            По вопросам конфиденциальности обращайтесь:
                                        </p>
                                        <div className="grid sm:grid-cols-2 gap-4 my-4">
                                            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                                <Mail className="w-5 h-5 text-emerald-600 mb-2" />
                                                <p className="font-medium text-sm">{t('email')}</p>
                                                <p className="text-sm text-muted-foreground">privacy@ecotrackr.com</p>
                                            </div>
                                            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                                <Clock className="w-5 h-5 text-emerald-600 mb-2" />
                                                <p className="font-medium text-sm">{t('response_time')}</p>
                                                <p className="text-sm text-muted-foreground">{t('response_time_48h')}</p>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                {/* Согласие */}
                                <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle className="w-6 h-6 text-emerald-600" />
                                            <div>
                                                <p className="font-medium">{t('accept_privacy')}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {t('accept_privacy_desc')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <Link href="/">
                                                <Button variant="outline" className="gap-2">
                                                    <ArrowLeft className="w-4 h-4" />
                                                    {t('home')}
                                                </Button>
                                            </Link>
                                            <Link href="/register">
                                                <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                                                    <CheckCircle className="w-4 h-4" />
                                                    {t('accept')}
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}