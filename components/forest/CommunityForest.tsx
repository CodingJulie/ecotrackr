'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { Users, Trees, Leaf, TrendingUp, Sparkles, Loader2 } from 'lucide-react';
import {
    aggregateCommunityForest,
    decorativeTreeHeight,
    expandCompletedTreesForDisplay,
    getForestLeaders,
    type CommunityForestStats,
    type ForestLeader,
    type UserTreeRow,
} from '@/lib/forest';
import {
    getTreeStageIcon,
    MAX_TREE_LEVEL,
    resolveTreeType,
    type TreeTypeId,
} from '@/lib/tree';

interface CommunityForestProps {
    currentUserId?: string;
    currentUserTreeType?: TreeTypeId | string | null;
    refreshKey?: number;
    demoMode?: boolean;
}

const MAX_VISIBLE_TREES = 7;

export default function CommunityForest({
    currentUserId,
    currentUserTreeType,
    refreshKey = 0,
    demoMode = false,
}: CommunityForestProps) {
    const { t } = useTranslation('common');
    const [forest, setForest] = useState<CommunityForestStats>({
        total_trees: 0,
        total_co2_saved: 0,
    });
    const [trees, setTrees] = useState<UserTreeRow[]>([]);
    const [topUsers, setTopUsers] = useState<ForestLeader[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (demoMode) {
            const previewTrees: UserTreeRow[] = [
                {
                    user_id: currentUserId || 'preview-user',
                    tree_type: resolveTreeType(currentUserTreeType),
                    tree_level: 2,
                    total_co2_saved: 115,
                    trees_completed: 1,
                },
                {
                    user_id: 'preview-user-2',
                    tree_type: 'pine',
                    tree_level: 3,
                    total_co2_saved: 88,
                    trees_completed: 2,
                },
                {
                    user_id: 'preview-user-3',
                    tree_type: 'cherry',
                    tree_level: 1,
                    total_co2_saved: 24,
                    trees_completed: 0,
                },
            ];
            setTrees(previewTrees);
            setForest({ total_trees: 128, total_co2_saved: 420 });
            setTopUsers([
                { ...previewTrees[0], user_name: 'EcoTrackr Demo' },
                { ...previewTrees[1], user_name: 'Alex' },
                { ...previewTrees[2], user_name: 'Maria' },
            ]);
            setLoading(false);
            return;
        }

        let cancelled = false;

        const loadForest = async () => {
            setLoading(true);
            try {
                const { data: treesData, error } = await supabase
                    .from('user_trees')
                    .select('user_id, tree_type, tree_level, total_co2_saved, trees_completed')
                    .order('trees_completed', { ascending: false })
                    .order('total_co2_saved', { ascending: false });

                if (error) throw error;

                const nextTrees = (treesData || []) as UserTreeRow[];
                const stats = aggregateCommunityForest(nextTrees);

                if (!cancelled) {
                    setTrees(nextTrees);
                    setForest(stats);
                }

                const leaders = getForestLeaders(nextTrees);
                if (leaders.length === 0) {
                    if (!cancelled) setTopUsers([]);
                    return;
                }

                const userIds = leaders.map((tree) => tree.user_id);
                const { data: profiles, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, name')
                    .in('id', userIds);

                if (profilesError) throw profilesError;

                const userNames = new Map(
                    (profiles || []).map((profile) => [profile.id, profile.name])
                );

                if (!cancelled) {
                    setTopUsers(
                        leaders.map((tree) => ({
                            ...tree,
                            user_name: userNames.get(tree.user_id) || t('user'),
                        }))
                    );
                }
            } catch (err) {
                console.error('Error loading community forest:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void loadForest();
        return () => {
            cancelled = true;
        };
    }, [t, refreshKey, demoMode, currentUserId, currentUserTreeType]);

    const visibleTrees = useMemo(() => {
        return expandCompletedTreesForDisplay(trees, MAX_VISIBLE_TREES).map((slot) => {
            const isCurrentUser = Boolean(currentUserId && slot.user_id === currentUserId);
            const tree_type = isCurrentUser && currentUserTreeType
                ? resolveTreeType(currentUserTreeType)
                : resolveTreeType(slot.tree_type);
            return { ...slot, tree_type };
        });
    }, [trees, currentUserId, currentUserTreeType]);
    const resolvedLeaders = useMemo(() => {
        return topUsers.map((user) => {
            const isCurrentUser = Boolean(currentUserId && user.user_id === currentUserId);
            const tree_type = isCurrentUser && currentUserTreeType
                ? resolveTreeType(currentUserTreeType)
                : resolveTreeType(user.tree_type);
            return { ...user, tree_type };
        });
    }, [topUsers, currentUserId, currentUserTreeType]);

    const totalTrees = forest.total_trees;
    const totalCo2Saved = forest.total_co2_saved;
    const hectares = Math.floor(totalTrees / 1000);

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
                    <div className="absolute inset-x-0 bottom-0 flex justify-around items-end h-44 px-2 pb-5">
                        {visibleTrees.map((tree, i) => (
                            <motion.div
                                key={tree.id}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: `${decorativeTreeHeight(i)}px`, opacity: 1 }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                                className="relative w-10 sm:w-14"
                            >
                                <motion.div
                                    animate={{ y: [0, -4, 0] }}
                                    transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
                                    className="absolute top-0 left-1/2 -translate-x-1/2 text-3xl sm:text-4xl leading-none whitespace-nowrap"
                                >
                                    {getTreeStageIcon(tree.tree_type, MAX_TREE_LEVEL)}
                                </motion.div>
                            </motion.div>
                        ))}
                        {totalTrees === 0 && !loading && (
                            <div className="text-center text-muted-foreground py-8">
                                <Trees className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
                                <p className="text-sm">{t('forest_empty')}</p>
                                <p className="text-xs">{t('forest_empty_desc')}</p>
                            </div>
                        )}
                        {loading && totalTrees === 0 && (
                            <div className="text-center text-muted-foreground py-8 w-full">
                                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
                                <p className="text-sm mt-2">{t('loading_forest')}</p>
                            </div>
                        )}
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
                        <p className="text-2xl font-bold text-emerald-600">
                            {Math.round(totalCo2Saved).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">{t('co2_saved')}</p>
                    </div>
                    <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-xl">
                        <TrendingUp className="w-5 h-5 text-emerald-600 mx-auto mb-1" aria-hidden="true" />
                        <p className="text-2xl font-bold text-emerald-600">{hectares}</p>
                        <p className="text-xs text-muted-foreground">{t('hectares')}</p>
                    </div>
                </div>

                {resolvedLeaders.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4" aria-hidden="true" />
                            {t('forest_leaders')}
                        </h3>
                        <div className="space-y-2">
                            {resolvedLeaders.map((user, index) => (
                                <div
                                    key={user.user_id}
                                    className="flex items-center justify-between p-2 bg-white/50 dark:bg-black/20 rounded-lg"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-emerald-600 w-6">
                                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                        </span>
                                        <span className="text-sm font-medium">{user.user_name || t('user')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-emerald-600 font-semibold">
                                            {t('trees_planted_count', {
                                                count: Number(user.trees_completed || 0),
                                            })}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {getTreeStageIcon(user.tree_type, MAX_TREE_LEVEL)}
                                        </span>
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
                            ? t('forest_created', { trees: totalTrees.toLocaleString() }) +
                              (hectares > 0 ? t('forest_hectares', { hectares }) : '')
                            : t('be_first')}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
