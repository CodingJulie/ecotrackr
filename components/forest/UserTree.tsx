'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { Leaf, TrendingUp, Award, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import {
    computeCycleTreeState,
    computeTreeState,
    deriveTreeStatus,
    getTreeStageIcon,
    kgToNextLevel,
    plantNewTree,
    resolveTreeType,
    updateUserTreeType,
    MAX_TREE_LEVEL,
    TREE_TYPE_IDS,
    TREE_TYPE_VISUALS,
    type TreeState,
    type TreeTypeId,
} from '@/lib/tree';

interface UserTreeProps {
    userId: string;
    treeData: Partial<TreeState> | null;
    entries: { co2e?: number | null; date?: string }[];
    demoMode?: boolean;
    onTreeTypeChange?: (treeType: TreeTypeId) => void;
    onPlanted?: () => void;
}

export default function UserTree({
    userId,
    treeData,
    entries,
    demoMode = false,
    onTreeTypeChange,
    onPlanted,
}: UserTreeProps) {
    const { t } = useTranslation('common');
    const [selectedType, setSelectedType] = useState<TreeTypeId>(() =>
        resolveTreeType(treeData?.tree_type)
    );
    const [saving, setSaving] = useState(false);
    const [planting, setPlanting] = useState(false);
    const [saveError, setSaveError] = useState(false);
    const [plantError, setPlantError] = useState(false);
    const [localTree, setLocalTree] = useState<TreeState | null>(null);

    useEffect(() => {
        setSelectedType(resolveTreeType(treeData?.tree_type));
    }, [treeData?.tree_type]);

    useEffect(() => {
        setLocalTree(null);
    }, [
        treeData?.tree_level,
        treeData?.cycle_co2_saved,
        treeData?.status,
        treeData?.matured_at,
        treeData?.trees_completed,
        treeData?.cycle_baseline_co2,
    ]);

    const tree = useMemo(() => {
        if (localTree) {
            return { ...localTree, tree_type: selectedType };
        }

        const lifetime = computeTreeState(entries || []);
        const baseline = Number(treeData?.cycle_baseline_co2 ?? 0);
        const cycle = computeCycleTreeState(lifetime.total_co2_saved, baseline);
        const maturedAt =
            treeData?.matured_at ??
            (cycle.tree_level >= MAX_TREE_LEVEL ? new Date().toISOString() : null);

        return {
            tree_type: selectedType,
            tree_level: cycle.tree_level,
            total_co2_saved: lifetime.total_co2_saved,
            cycle_co2_saved: cycle.cycle_co2_saved,
            current_progress: cycle.current_progress,
            matured_at: maturedAt,
            cycle_baseline_co2: baseline,
            trees_completed: Number(treeData?.trees_completed ?? 0),
            status: deriveTreeStatus(cycle.tree_level),
        } satisfies TreeState;
    }, [localTree, selectedType, entries, treeData]);

    const treeType = TREE_TYPE_VISUALS[tree.tree_type];
    const treeName = t(`tree_types.${tree.tree_type}.name`);
    const treeDescription = t(`tree_types.${tree.tree_type}.description`);
    const treeIcon = getTreeStageIcon(tree.tree_type, tree.tree_level);
    const remainingKg = kgToNextLevel(tree.cycle_co2_saved);

    const handleSelectType = async (nextType: TreeTypeId) => {
        if (nextType === selectedType || saving || planting) return;

        const previous = selectedType;
        setSelectedType(nextType);
        onTreeTypeChange?.(nextType);
        setSaveError(false);
        setSaving(true);

        if (demoMode) {
            setSaving(false);
            return;
        }

        const { error } = await updateUserTreeType(supabase, userId, nextType);
        if (error) {
            setSelectedType(previous);
            onTreeTypeChange?.(previous);
            setSaveError(true);
        }
        setSaving(false);
    };

    const handlePlantNew = async () => {
        if (planting || tree.status !== 'ready_to_plant') return;

        setPlanting(true);
        setPlantError(false);

        if (demoMode) {
            const nextLevelTree: TreeState = {
                ...tree,
                tree_level: 1,
                cycle_co2_saved: 0,
                current_progress: 0,
                matured_at: null,
                trees_completed: tree.trees_completed + 1,
                status: 'growing',
                cycle_baseline_co2: tree.total_co2_saved,
            };
            setLocalTree(nextLevelTree);
            setPlanting(false);
            onPlanted?.();
            return;
        }

        const { tree: next, error } = await plantNewTree(
            supabase,
            userId,
            entries || [],
            {
                tree_type: tree.tree_type,
                tree_level: tree.tree_level,
                total_co2_saved: tree.total_co2_saved,
                matured_at: tree.matured_at,
                cycle_baseline_co2: tree.cycle_baseline_co2,
                trees_completed: tree.trees_completed,
            }
        );

        if (error || !next) {
            setPlantError(true);
            setPlanting(false);
            return;
        }

        setLocalTree({ ...next, tree_type: selectedType });
        setPlanting(false);
        onPlanted?.();
    };

    const tip = (() => {
        if (tree.status === 'ready_to_plant') return t('tree_ready_to_plant_tip');
        if (remainingKg > 0) return t('tree_growth_tip', { co2: remainingKg });
        return t('tree_max_level_tip');
    })();

    return (
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800 overflow-hidden relative">
            <CardHeader className="pb-2">
                <h2 className="flex items-center justify-between text-xl font-semibold">
                    <span className="flex items-center gap-2">
                        <Leaf className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                        {t('your_eco_tree')}
                    </span>
                    <span className="text-sm font-normal text-muted-foreground">
                        {treeName} {treeIcon}
                    </span>
                </h2>
            </CardHeader>

            <CardContent className="space-y-6">
                <div className="relative text-center py-8">
                    <motion.div
                        animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                        className="text-8xl cursor-pointer hover:scale-110 transition-transform"
                    >
                        {treeIcon}
                    </motion.div>
                    <p className="mt-3 text-sm text-muted-foreground">{treeDescription}</p>
                    {tree.tree_level >= MAX_TREE_LEVEL && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute -top-2 -right-2"
                        >
                            <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
                        </motion.div>
                    )}
                </div>

                <div>
                    <p className="text-xs text-muted-foreground mb-2 text-center">
                        {t('choose_tree_type')}
                    </p>
                    <div
                        className="flex flex-wrap justify-center gap-2"
                        role="radiogroup"
                        aria-label={t('choose_tree_type')}
                    >
                        {TREE_TYPE_IDS.map((typeId) => {
                            const meta = TREE_TYPE_VISUALS[typeId];
                            const selected = typeId === selectedType;
                            return (
                                <button
                                    key={typeId}
                                    type="button"
                                    role="radio"
                                    aria-checked={selected}
                                    aria-label={t(`tree_types.${typeId}.name`)}
                                    disabled={saving || planting}
                                    onClick={() => { void handleSelectType(typeId); }}
                                    className={cn(
                                        'size-11 rounded-xl text-xl transition-all border',
                                        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-emerald-500/40',
                                        selected
                                            ? 'border-emerald-500 bg-white shadow-sm dark:bg-emerald-950/40'
                                            : 'border-transparent bg-white/40 hover:bg-white/70 dark:bg-black/20 dark:hover:bg-black/30',
                                        (saving || planting) && 'opacity-60'
                                    )}
                                >
                                    <span aria-hidden="true">{meta.icon}</span>
                                </button>
                            );
                        })}
                    </div>
                    {saveError && (
                        <p className="mt-2 text-xs text-center text-destructive">
                            {t('tree_type_update_error')}
                        </p>
                    )}
                </div>

                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span>{t('level_progress', { level: tree.tree_level })}</span>
                        <span className="text-emerald-600 font-semibold">
                            {t('to_next_level', { progress: Math.round(tree.current_progress) })}
                        </span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${tree.current_progress}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className={`h-full bg-gradient-to-r ${treeType.color} rounded-full`}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-xl">
                        <TrendingUp className="w-5 h-5 text-emerald-600 mx-auto mb-1" aria-hidden="true" />
                        <p className="text-2xl font-bold text-emerald-600">
                            {Math.round(tree.cycle_co2_saved)}
                        </p>
                        <p className="text-xs text-muted-foreground">{t('co2_saved')}</p>
                    </div>
                    <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-xl">
                        <Award className="w-5 h-5 text-amber-600 mx-auto mb-1" aria-hidden="true" />
                        <p className="text-2xl font-bold text-amber-600">
                            {tree.tree_level}
                        </p>
                        <p className="text-xs text-muted-foreground">{t('development_level')}</p>
                    </div>
                </div>

                <div className="p-3 bg-emerald-100/50 dark:bg-emerald-900/20 rounded-xl space-y-3">
                    <p className="text-xs text-center text-muted-foreground">{tip}</p>
                    {tree.status === 'ready_to_plant' && (
                        <div className="flex flex-col items-center gap-2">
                            <Button
                                type="button"
                                onClick={() => { void handlePlantNew(); }}
                                disabled={planting}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                {planting ? t('planting_tree') : t('plant_new_tree')}
                            </Button>
                            {plantError && (
                                <p className="text-xs text-center text-destructive">
                                    {t('plant_tree_error')}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
