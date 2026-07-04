// app/terms/page.tsx
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
    AlertCircle,
    AlertTriangle,
    ArrowLeft,
    BookOpen,
    CheckCircle,
    Clock,
    FileText,
    Gavel,
    Globe,
    Heart,
    Leaf,
    Mail,
    Scale,
    Shield,
    Users
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function TermsPage() {
    const { t } = useTranslation('common');
    const [lastUpdated, setLastUpdated] = useState<string>('');
    const [activeSection, setActiveSection] = useState<string>('general');

    // ✅ Компактное создание refs через useMemo
    const sectionRefs = useMemo(() => {
        const refs: Record<string, React.MutableRefObject<HTMLDivElement | null>> = {};
        const keys = ['general', 'terms', 'obligations', 'liability', 'intellectual', 'termination', 'contact'];
        keys.forEach(key => {
            refs[key] = { current: null };
        });
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
        { id: 'general', label: t('general_provisions'), icon: FileText },
        { id: 'terms', label: t('terms_of_use'), icon: Gavel },
        { id: 'obligations', label: t('obligations'), icon: Shield },
        { id: 'liability', label: t('liability'), icon: AlertTriangle },
        { id: 'intellectual', label: t('intellectual_property'), icon: Scale },
        { id: 'termination', label: t('termination'), icon: AlertCircle },
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
                    <span className="text-foreground font-medium">{t('terms_of_use')}</span>
                </nav>
            </div>

            <div className="max-w-6xl mx-auto py-8 px-6">
                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Боковая навигация */}
                    <aside className="lg:col-span-1">
                        <div className="sticky top-24 space-y-4">
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
                                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                                    <Gavel className="w-5 h-5 text-emerald-600" />
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
                            <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 p-4">
                                <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                                <p className="text-sm font-medium text-amber-700 dark:text-amber-400 text-center">
                                    {t('legal_document')}
                                </p>
                                <p className="text-xs text-muted-foreground text-center mt-1">
                                    {t('please_read_carefully')}
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
                                        <Gavel className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold">{t('terms_of_use')}</h1>
                                        <p className="text-sm text-muted-foreground">
                                            {t('last_updated')} {lastUpdated}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs">
                                        <Scale className="w-3 h-3" />
                                        {t('legally_binding')}
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 rounded-full text-xs">
                                        <Globe className="w-3 h-3" />
                                        {t('international_law')}
                                    </span>
                                </div>
                            </div>

                            {/* Содержание с рефами */}
                            <div className="prose prose-emerald dark:prose-invert max-w-none">
                                {/* 1. Общие положения */}
                                <div ref={sectionRefs.general} className="scroll-mt-24">
                                    <section className="mb-10">
                                        <h2 className="text-2xl font-bold flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-emerald-600" />
                                            {t('general_provisions')}
                                        </h2>
                                        <p className="text-muted-foreground leading-relaxed">
                                            Настоящие Условия использования (далее — «Условия») регулируют отношения между
                                            EcoTrackr (далее — «Сервис», «Мы») и пользователем (далее — «Вы», «Пользователь»)
                                            при использовании сервиса EcoTrackr для отслеживания углеродного следа.
                                        </p>

                                        <div className="grid sm:grid-cols-2 gap-4 my-4">
                                            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Users className="w-4 h-4 text-emerald-600" />
                                                    <h3 className="font-semibold text-sm">{t('parties')}</h3>
                                                </div>
                                                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                                    <li>EcoTrackr (исполнитель)</li>
                                                    <li>{t('user')} (заказчик)</li>
                                                </ul>
                                            </div>
                                            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Globe className="w-4 h-4 text-emerald-600" />
                                                    <h4 className="font-semibold text-sm">{t('applicable_law')}</h4>
                                                </div>
                                                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                                    <li>{t('law_rf')}</li>
                                                    <li>{t('international_norms')}</li>
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                                            <BookOpen className="w-4 h-4 text-blue-600 inline mr-2" />
                                            <span className="text-sm text-blue-700 dark:text-blue-400">
                                                {t('using_ecotrackr_accepts_terms')}
                                            </span>
                                        </div>
                                    </section>
                                </div>

                                {/* 2. Условия использования */}
                                <div ref={sectionRefs.terms} className="scroll-mt-24">
                                    <section className="mb-10">
                                        <h2 className="text-2xl font-bold flex items-center gap-2">
                                            <Gavel className="w-5 h-5 text-emerald-600" />
                                            {t('terms_of_use')}
                                        </h2>

                                        <h3 className="text-xl font-semibold mt-6">{t('registration')}</h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            Для использования сервиса необходима регистрация. Вы обязуетесь предоставлять
                                            достоверные данные и нести ответственность за сохранность своих учётных данных.
                                        </p>

                                        <h3 className="text-xl font-semibold mt-6">{t('use_of_service')}</h3>
                                        <ul className="space-y-2 my-4">
                                            <li className="flex items-start gap-3">
                                                <CheckCircle className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                                                <div>
                                                    <span className="font-medium">{t('data_entry')}</span>
                                                    <p className="text-sm text-muted-foreground">
                                                        {t('data_entry_desc')}
                                                    </p>
                                                </div>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <CheckCircle className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                                                <div>
                                                    <span className="font-medium">{t('analytics')}</span>
                                                    <p className="text-sm text-muted-foreground">
                                                        {t('analytics_desc')}
                                                    </p>
                                                </div>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <CheckCircle className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                                                <div>
                                                    <span className="font-medium">{t('ai_recommendations')}</span>
                                                    <p className="text-sm text-muted-foreground">
                                                        {t('ai_recommendations_desc')}
                                                    </p>
                                                </div>
                                            </li>
                                        </ul>

                                        <h3 className="text-xl font-semibold mt-6">{t('prohibited_actions')}</h3>
                                        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl my-4">
                                            <AlertTriangle className="w-4 h-4 text-red-600 inline mr-2" />
                                            <span className="text-sm text-red-700 dark:text-red-400">
                                                {t('prohibited_actions_text')}
                                            </span>
                                        </div>
                                    </section>
                                </div>

                                {/* 3. Обязанности сторон */}
                                <div ref={sectionRefs.obligations} className="scroll-mt-24">
                                    <section className="mb-10">
                                        <h2 className="text-2xl font-bold flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-emerald-600" />
                                            {t('obligations')}
                                        </h2>

                                        <h3 className="text-xl font-semibold mt-6">{t('obligations_ecotrackr')}</h3>
                                        <ul className="space-y-2 my-4">
                                            <li className="flex items-start gap-3">
                                                <CheckCircle className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                                                <div>
                                                    <span className="font-medium">{t('service_operation')}</span>
                                                    <p className="text-sm text-muted-foreground">
                                                        {t('service_operation_desc')}
                                                    </p>
                                                </div>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <CheckCircle className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                                                <div>
                                                    <span className="font-medium">{t('security_obligation')}</span>
                                                    <p className="text-sm text-muted-foreground">
                                                        {t('security_obligation_desc')}
                                                    </p>
                                                </div>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <CheckCircle className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                                                <div>
                                                    <span className="font-medium">{t('support')}</span>
                                                    <p className="text-sm text-muted-foreground">
                                                        {t('support_desc')}
                                                    </p>
                                                </div>
                                            </li>
                                        </ul>

                                        <h3 className="text-xl font-semibold mt-6">{t('obligations_user')}</h3>
                                        <ul className="space-y-2 my-4">
                                            <li className="flex items-start gap-3">
                                                <CheckCircle className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                                                <div>
                                                    <span className="font-medium">{t('data_accuracy')}</span>
                                                    <p className="text-sm text-muted-foreground">
                                                        {t('data_accuracy_desc')}
                                                    </p>
                                                </div>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <CheckCircle className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                                                <div>
                                                    <span className="font-medium">{t('account_security')}</span>
                                                    <p className="text-sm text-muted-foreground">
                                                        {t('account_security_desc')}
                                                    </p>
                                                </div>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <CheckCircle className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                                                <div>
                                                    <span className="font-medium">{t('compliance')}</span>
                                                    <p className="text-sm text-muted-foreground">
                                                        {t('compliance_desc')}
                                                    </p>
                                                </div>
                                            </li>
                                        </ul>
                                    </section>
                                </div>

                                {/* 4. Ответственность */}
                                <div ref={sectionRefs.liability} className="scroll-mt-24">
                                    <section className="mb-10">
                                        <h2 className="text-2xl font-bold flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5 text-emerald-600" />
                                            {t('liability')}
                                        </h2>
                                        <p className="text-muted-foreground leading-relaxed">
                                            EcoTrackr не несёт ответственности за:
                                        </p>
                                        <ul className="space-y-2 my-4">
                                            <li className="flex items-start gap-3">
                                                <AlertCircle className="w-4 h-4 text-amber-600 mt-1 flex-shrink-0" />
                                                <div>
                                                    <span className="font-medium">{t('data_accuracy_liability')}</span>
                                                    <p className="text-sm text-muted-foreground">
                                                        {t('data_accuracy_liability_desc')}
                                                    </p>
                                                </div>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <AlertCircle className="w-4 h-4 text-amber-600 mt-1 flex-shrink-0" />
                                                <div>
                                                    <span className="font-medium">{t('technical_failures')}</span>
                                                    <p className="text-sm text-muted-foreground">
                                                        {t('technical_failures_desc')}
                                                    </p>
                                                </div>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <AlertCircle className="w-4 h-4 text-amber-600 mt-1 flex-shrink-0" />
                                                <div>
                                                    <span className="font-medium">{t('third_party_actions')}</span>
                                                    <p className="text-sm text-muted-foreground">
                                                        {t('third_party_actions_desc')}
                                                    </p>
                                                </div>
                                            </li>
                                        </ul>
                                        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                                            <AlertCircle className="w-4 h-4 text-amber-600 inline mr-2" />
                                            <span className="text-sm text-amber-700 dark:text-amber-400">
                                                <strong>{t('liability_limit')}:</strong> {t('liability_limit_text')}
                                            </span>
                                        </div>
                                    </section>
                                </div>

                                {/* 5. Интеллектуальная собственность */}
                                <div ref={sectionRefs.intellectual} className="scroll-mt-24">
                                    <section className="mb-10">
                                        <h2 className="text-2xl font-bold flex items-center gap-2">
                                            <Scale className="w-5 h-5 text-emerald-600" />
                                            {t('intellectual_property')}
                                        </h2>
                                        <p className="text-muted-foreground leading-relaxed">
                                            Все материалы, дизайн, код, логотипы и контент EcoTrackr являются
                                            интеллектуальной собственностью и защищены авторским правом.
                                        </p>
                                        <div className="grid sm:grid-cols-2 gap-4 my-4">
                                            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                                <Heart className="w-5 h-5 text-emerald-600 mb-2" />
                                                <h4 className="font-semibold text-sm">{t('what_is_allowed')}</h4>
                                                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                                    <li>{t('personal_use')}</li>
                                                    <li>{t('links_to_ecotrackr')}</li>
                                                    <li>{t('discussion_and_reviews')}</li>
                                                </ul>
                                            </div>
                                            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                                <AlertTriangle className="w-5 h-5 text-red-500 mb-2" />
                                                <h4 className="font-semibold text-sm">{t('what_is_prohibited')}</h4>
                                                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                                    <li>{t('copying_code')}</li>
                                                    <li>{t('logo_use_without_permission')}</li>
                                                    <li>{t('commercial_use')}</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                {/* 6. Прекращение использования */}
                                <div ref={sectionRefs.termination} className="scroll-mt-24">
                                    <section className="mb-10">
                                        <h2 className="text-2xl font-bold flex items-center gap-2">
                                            <AlertCircle className="w-5 h-5 text-emerald-600" />
                                            {t('termination')}
                                        </h2>
                                        <p className="text-muted-foreground leading-relaxed">
                                            Вы можете прекратить использование сервиса в любой момент:
                                        </p>
                                        <ul className="space-y-2 my-4">
                                            <li className="flex items-start gap-3">
                                                <CheckCircle className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                                                <div>
                                                    <span className="font-medium">{t('delete_account')}</span>
                                                    <p className="text-sm text-muted-foreground">
                                                        {t('delete_account_desc')}
                                                    </p>
                                                </div>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <CheckCircle className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                                                <div>
                                                    <span className="font-medium">{t('export_data')}</span>
                                                    <p className="text-sm text-muted-foreground">
                                                        {t('export_data_desc')}
                                                    </p>
                                                </div>
                                            </li>
                                        </ul>
                                        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl">
                                            <AlertTriangle className="w-4 h-4 text-red-600 inline mr-2" />
                                            <span className="text-sm text-red-700 dark:text-red-400">
                                                <strong>{t('important')}:</strong> {t('delete_account_irreversible')}
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
                                            По вопросам, связанным с Условиями использования:
                                        </p>
                                        <div className="grid sm:grid-cols-2 gap-4 my-4">
                                            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                                <Mail className="w-5 h-5 text-emerald-600 mb-2" />
                                                <p className="font-medium text-sm">{t('email')}</p>
                                                <p className="text-sm text-muted-foreground">legal@ecotrackr.com</p>
                                            </div>
                                            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                                <Clock className="w-5 h-5 text-emerald-600 mb-2" />
                                                <p className="font-medium text-sm">{t('response_time')}</p>
                                                <p className="text-sm text-muted-foreground">{t('response_time_72h')}</p>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                {/* Принятие условий */}
                                <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle className="w-6 h-6 text-emerald-600" />
                                            <div>
                                                <p className="font-medium">{t('acceptance')}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {t('acceptance_desc')}
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
                                                    {t('accept_and_continue')}
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