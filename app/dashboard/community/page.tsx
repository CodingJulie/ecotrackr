// app/dashboard/community/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Users, TrendingDown, Award, Loader2 } from 'lucide-react';
import { useWorkers } from '@/components/workers/WorkersManager';
import { useTranslation } from 'react-i18next';

interface LeaderboardEntry {
    id: string;
    name: string;
    avatar_url?: string | null;
    total_co2: number;
    entries_count: number;
    rank: number;
    medal?: string | null;
}

export default function CommunityPage() {
    const { t } = useTranslation('common');
    const workers = useWorkers();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadLeaderboard = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const { data: entries, error: entriesError } = await supabase
                .from('footprint_entries')
                .select('user_id, co2e, category');

            if (entriesError) throw entriesError;

            if (!entries || entries.length === 0) {
                setLeaderboard([]);
                setLoading(false);
                return;
            }

            const userIds = [...new Set(entries.map(e => e.user_id))];
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, name, avatar_url')
                .in('id', userIds);

            if (profilesError) throw profilesError;

            const profileMap = new Map();
            profiles?.forEach(p => {
                profileMap.set(p.id, p);
            });

            const usersData = entries.map(entry => ({
                user_id: entry.user_id,
                user_name: profileMap.get(entry.user_id)?.name || t('user'),
                avatar_url: profileMap.get(entry.user_id)?.avatar_url,
                co2e: entry.co2e,
                category: entry.category
            }));

            const result = await workers.calculateLeaderboard(usersData, 'co2', 100);

            const formattedLeaderboard = result.leaderboard.map(user => ({
                id: user.id,
                name: user.name,
                avatar_url: user.avatar_url,
                total_co2: user.totalCO2,
                entries_count: user.entriesCount,
                rank: user.rank,
                medal: user.medal
            }));

            setLeaderboard(formattedLeaderboard);
        } catch (err) {
            console.error('Error loading leaderboard:', err);
            setError(t('load_error'));
        } finally {
            setLoading(false);
        }
    }, [workers, t]);

    useEffect(() => {
        loadLeaderboard();
    }, [loadLeaderboard]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-500 p-8">
                {error}
                <button onClick={loadLeaderboard} className="mt-4 text-emerald-600 hover:underline">
                    {t('try_again')}
                </button>
            </div>
        );
    }

    const totalParticipants = leaderboard.length;
    const globalTotalCO2 = leaderboard.reduce((sum, user) => sum + user.total_co2, 0);

    return (
        <div className="max-w-5xl mx-auto space-y-10">
            <div className="text-center">
                <h1 className="text-5xl font-bold tracking-tight mb-4">{t('leaderboard')}</h1>
                <p className="text-xl text-muted-foreground">{t('leaderboard_subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <Users className="w-10 h-10 text-emerald-600 mb-3" />
                        <p className="text-sm text-muted-foreground">{t('participants')}</p>
                        <p className="text-4xl font-bold">{totalParticipants}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <TrendingDown className="w-10 h-10 text-emerald-600 mb-3" />
                        <p className="text-sm text-muted-foreground">{t('total_co2')}</p>
                        <p className="text-4xl font-bold text-emerald-600">
                            {Math.round(globalTotalCO2)} {t('kg_co2')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <Award className="w-10 h-10 text-amber-500 mb-3" />
                        <p className="text-sm text-muted-foreground">{t('leader')}</p>
                        <p className="text-2xl font-bold truncate">{leaderboard[0]?.name || '—'}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('top_participants')}</CardTitle>
                </CardHeader>

                <CardContent>
                    <div className="space-y-3">
                        {leaderboard.map((user) => (
                            <div
                                key={user.id}
                                className={`flex items-center justify-between p-6 rounded-2xl transition-all ${
                                    user.rank <= 3
                                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800'
                                        : 'bg-zinc-50 dark:bg-zinc-900'
                                }`}
                            >
                                <div className="flex items-center gap-5 flex-wrap">
                                    <div className="w-12 text-center text-3xl">
                                        {user.medal || `#${user.rank}`}
                                    </div>

                                    <Avatar className="w-14 h-14 border-2 border-white dark:border-zinc-800">
                                        <AvatarImage src={user.avatar_url || undefined} />
                                        <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xl">
                                            {user.name?.[0]?.toUpperCase() || '?'}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div>
                                        <p className="font-semibold text-xl">{user.name}</p>
                                        <p className="text-sm text-muted-foreground">{user.entries_count} {t('entries')}</p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="text-4xl font-bold text-emerald-600">
                                        {Math.round(user.total_co2)}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{t('kg_co2')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}