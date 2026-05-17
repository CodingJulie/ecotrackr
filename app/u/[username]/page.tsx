'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
    computePublicProfileStats,
    filterEntriesByPeriod,
    normalizeUsername,
    parseProfilePeriod,
    PROFILE_PERIODS,
    type FootprintEntry,
    type ProfilePeriod,
    type PublicProfile,
} from '@/lib/profile';
import { formatDate, groupByCategory, parseEntryDate } from '@/lib/utils';
import { Award, Leaf, Loader2, Share2, TreePine, TrendingDown } from 'lucide-react';

export default function PublicProfilePage() {
    const params = useParams<{ username: string }>();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { t, i18n } = useTranslation('common');

    const username = normalizeUsername(decodeURIComponent(params.username ?? ''));
    const period = parseProfilePeriod(searchParams.get('period'));

    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [entries, setEntries] = useState<FootprintEntry[]>([]);
    const [tree, setTree] = useState<{ tree_level?: number | null; total_co2_saved?: number | null } | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [copied, setCopied] = useState(false);

    const loadProfile = useCallback(async () => {
        setLoading(true);
        setNotFound(false);

        try {
            const { data: publicProfile, error: profileError } = await supabase
                .from('profiles')
                .select('id, name, username, avatar_url')
                .eq('username', username)
                .eq('is_public', true)
                .maybeSingle();

            if (profileError) throw profileError;
            if (!publicProfile?.username) {
                setNotFound(true);
                setProfile(null);
                setEntries([]);
                setTree(null);
                return;
            }

            setProfile(publicProfile as PublicProfile);

            const [{ data: footprintEntries, error: entriesError }, { data: treeData, error: treeError }] =
                await Promise.all([
                    supabase
                        .from('footprint_entries')
                        .select('id, co2e, date, category, activity, value')
                        .eq('user_id', publicProfile.id)
                        .order('date', { ascending: false }),
                    supabase
                        .from('user_trees')
                        .select('tree_level, total_co2_saved')
                        .eq('user_id', publicProfile.id)
                        .maybeSingle(),
                ]);

            if (entriesError) throw entriesError;
            if (treeError && treeError.code !== 'PGRST116') throw treeError;

            setEntries(footprintEntries ?? []);
            setTree(treeData ?? null);
        } catch (error) {
            console.error('Public profile load error:', error);
            setNotFound(true);
        } finally {
            setLoading(false);
        }
    }, [username]);

    useEffect(() => {
        if (username) {
            loadProfile();
        } else {
            setNotFound(true);
            setLoading(false);
        }
    }, [loadProfile, username]);

    const filteredEntries = useMemo(
        () => filterEntriesByPeriod(entries, period),
        [entries, period]
    );

    const stats = useMemo(
        () => computePublicProfileStats(filteredEntries, tree),
        [filteredEntries, tree]
    );

    const categories = useMemo(() => {
        const grouped = groupByCategory(filteredEntries);
        return Object.entries(grouped).sort(([, a], [, b]) => b - a);
    }, [filteredEntries]);

    const setPeriod = (nextPeriod: ProfilePeriod) => {
        const nextParams = new URLSearchParams(searchParams.toString());
        if (nextPeriod === 'all') {
            nextParams.delete('period');
        } else {
            nextParams.set('period', nextPeriod);
        }

        const query = nextParams.toString();
        router.replace(query ? `/u/${username}?${query}` : `/u/${username}`);
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Copy link error:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white dark:from-zinc-950 dark:to-zinc-900">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" aria-label={t('loading')} />
            </div>
        );
    }

    if (notFound || !profile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-white dark:from-zinc-950 dark:to-zinc-900 px-6">
                <h1 className="text-4xl font-bold mb-2">{t('public_profile_not_found_title')}</h1>
                <p className="text-muted-foreground mb-8 text-center max-w-md">
                    {t('public_profile_not_found_desc')}
                </p>
                <Link href="/">
                    <Button>{t('back_to_home')}</Button>
                </Link>
            </div>
        );
    }

    const userInitial = profile.name?.[0]?.toUpperCase() || '?';

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white dark:from-zinc-950 dark:to-zinc-900">
            <header className="border-b border-emerald-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
                    <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                        <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
                            <Leaf className="w-5 h-5 text-white" />
                        </div>
                        EcoTrackr
                    </Link>
                    <Button variant="outline" size="sm" onClick={handleCopyLink}>
                        <Share2 className="w-4 h-4 mr-2" />
                        {copied ? t('link_copied') : t('copy_profile_link')}
                    </Button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
                <section className="text-center space-y-4">
                    <Avatar className="w-24 h-24 mx-auto border-4 border-emerald-100">
                        {profile.avatar_url ? (
                            <AvatarImage src={profile.avatar_url} alt={profile.name} />
                        ) : null}
                        <AvatarFallback className="bg-emerald-100 text-emerald-700 text-3xl">
                            {userInitial}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-3xl font-bold">{profile.name}</h1>
                        <p className="text-muted-foreground mt-1">@{profile.username}</p>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40">
                        {t('public_profile_badge')}
                    </Badge>
                </section>

                <div className="flex flex-wrap justify-center gap-2">
                    {PROFILE_PERIODS.map((item) => (
                        <Button
                            key={item}
                            size="sm"
                            variant={period === item ? 'default' : 'outline'}
                            className={period === item ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                            onClick={() => setPeriod(item)}
                        >
                            {t(`public_profile_period_${item}`)}
                        </Button>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                                <Leaf className="w-4 h-4 text-emerald-600" />
                                {t('total_footprint')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{stats.totalCo2} {t('kg')}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                                <TrendingDown className="w-4 h-4 text-emerald-600" />
                                {t('entries')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{stats.entriesCount}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                                <TreePine className="w-4 h-4 text-emerald-600" />
                                {t('your_tree')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{t('public_profile_tree_level', { level: stats.treeLevel })}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                                <Award className="w-4 h-4 text-emerald-600" />
                                {t('co2_saved')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{stats.co2Saved} {t('kg')}</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('public_profile_by_category')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {categories.length === 0 ? (
                            <p className="text-muted-foreground text-center py-6">{t('public_profile_no_entries')}</p>
                        ) : (
                            categories.map(([category, value]) => {
                                const percent = stats.totalCo2 > 0 ? Math.round((value / stats.totalCo2) * 100) : 0;
                                return (
                                    <div key={category} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium capitalize">{t(`category_${category}`, category)}</span>
                                            <span className="text-muted-foreground">
                                                {Math.round(value)} {t('kg')} · {percent}%
                                            </span>
                                        </div>
                                        <div className="h-2 rounded-full bg-emerald-100 dark:bg-zinc-800 overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-600 rounded-full transition-all"
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </CardContent>
                </Card>

                {filteredEntries.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('public_profile_recent_activity')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {filteredEntries.slice(0, 8).map((entry) => (
                                <div
                                    key={entry.id ?? `${entry.date}-${entry.category}`}
                                    className="flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-3"
                                >
                                    <div>
                                        <p className="font-medium capitalize">{t(`category_${entry.category}`, entry.category)}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatDate(parseEntryDate(entry.date), i18n.language)}
                                        </p>
                                    </div>
                                    <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                                        {entry.co2e} {t('kg_co2')}
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20">
                    <CardContent className="py-8 text-center space-y-4">
                        <h2 className="text-2xl font-bold">{t('public_profile_cta_title')}</h2>
                        <p className="text-muted-foreground max-w-xl mx-auto">{t('public_profile_cta_desc')}</p>
                        <Link href="/register">
                            <Button className="bg-emerald-600 hover:bg-emerald-700">{t('create_account')}</Button>
                        </Link>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
