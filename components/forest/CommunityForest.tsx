'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { Users, Trees, Leaf, TrendingUp, Sparkles, Loader2 } from 'lucide-react';

interface CommunityForestProps {
    forestData: any;
}

export default function CommunityForest({ forestData }: CommunityForestProps) {
    const { t } = useTranslation('common');
    const [forest, setForest] = useState(forestData || {
        total_trees: 0,
        total_co2_saved: 0,
        last_updated: new Date().toISOString()
    });
    const [topUsers, setTopUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (forestData) setForest(forestData);
    }, [forestData]);

    useEffect(() => {
        const loadTopUsers = async () => {
            setLoading(true);
            try {
                const { data: treesData, error } = await supabase
                    .from('user_trees')
                    .select('user_id, tree_level, total_co2_saved')
                    .order('tree_level', { ascending: false })
                    .limit(5);
                if (error) throw error;
                if (treesData && treesData.length > 0) {
                    const userIds = treesData.map(t => t.user_id);
                    const { data: profiles } = await supabase
                        .from('profiles')
                        .select('id, name')
                        .in('id', userIds);
                    const userNames = new Map();
                    profiles?.forEach(p => userNames.set(p.id, p.name));
                    const usersWithNames = treesData.map(tree => ({
                        ...tree,
                        user_name: userNames.get(tree.user_id) || t('user')
                    }));
                    setTopUsers(usersWithNames);
                } else {
                    setTopUsers([]);
                }
            } catch (err) {
                console.error('Error loading top users:', err);
            } finally {
                setLoading(false);
            }
        };
        loadTopUsers();
    }, [t]);

    const totalTrees = forest?.total_trees || 0;
    const hectares = Math.floor(totalTrees / 1000);

    if (loading) {
        return (
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                <CardContent className="p-6 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">{t('loading_forest')}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
                <h2 className="flex items-center justify-between text-xl font-semibold">
                    <span className="flex items-center gap-2">
                        <Trees className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                        {t('community_forest')}
                    </span>
                    <span className="text-sm font-normal text-muted-foreground">
                        {t('together_we_are_strong')}
                    </span>
                </h2>
            </CardHeader>

            <CardContent className="space-y-6">
                <div className="relative min-h-[200px] bg-gradient-to-t from-green-800/20 to-transparent rounded-2xl overflow-hidden">
                    <div className="absolute bottom-0 left-0 right-0">
                        <div className="flex justify-around items-end h-40">
                            {Array.from({ length: Math.min(7, Math.floor(totalTrees / 10) + 1) }).map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: `${30 + Math.random() * 60}px`, opacity: 1 }}
                                    transition={{ delay: i * 0.1, duration: 0.5 }}
                                    className="relative"
                                >
                                    <div className="w-8 sm:w-12 text-center">
                                        <motion.div
                                            animate={{ y: [0, -5, 0] }}
                                            transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
                                            className="text-3xl sm:text-4xl"
                                        >
                                            🌳
                                        </motion.div>
                                    </div>
                                </motion.div>
                            ))}
                            {totalTrees === 0 && (
                                <div className="text-center text-muted-foreground py-8">
                                    <Trees className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
                                    <p className="text-sm">{t('forest_empty')}</p>
                                    <p className="text-xs">{t('forest_empty_desc')}</p>
                                </div>
                            )}
                        </div>
                        <div className="h-8 bg-gradient-to-t from-green-800/30 to-transparent" />
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-xl">
                        <Trees className="w-5 h-5 text-emerald-600 mx-auto mb-1" aria-hidden="true" />
                        <p className="text-2xl font-bold text-emerald-600">{totalTrees.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{t('total_trees')}</p>
                    </div>
                    <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-xl">
                        <Leaf className="w-5 h-5 text-emerald-600 mx-auto mb-1" aria-hidden="true" />
                        <p className="text-2xl font-bold text-emerald-600">{Math.round(forest?.total_co2_saved || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{t('co2_saved')}</p>
                    </div>
                    <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-xl">
                        <TrendingUp className="w-5 h-5 text-emerald-600 mx-auto mb-1" aria-hidden="true" />
                        <p className="text-2xl font-bold text-emerald-600">{hectares}</p>
                        <p className="text-xs text-muted-foreground">{t('hectares')}</p>
                    </div>
                </div>

                {topUsers.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4" aria-hidden="true" />
                            {t('forest_leaders')}
                        </h3>
                        <div className="space-y-2">
                            {topUsers.map((user, index) => (
                                <div key={user.user_id} className="flex items-center justify-between p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-emerald-600 w-6">
                                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                        </span>
                                        <span className="text-sm font-medium">{user.user_name || t('user')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-emerald-600 font-semibold">{user.tree_level} {t('level')}</span>
                                        <span className="text-xs text-muted-foreground">🌳</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="p-3 bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/40 dark:to-green-900/40 rounded-xl text-center">
                    <Sparkles className="w-4 h-4 text-emerald-500 mx-auto mb-1" aria-hidden="true" />
                    <p className="text-xs text-muted-foreground">
                        {totalTrees > 0
                            ? t('forest_created', { trees: totalTrees.toLocaleString() }) + (hectares > 0 ? t('forest_hectares', { hectares }) : '')
                            : t('be_first')
                        }
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}