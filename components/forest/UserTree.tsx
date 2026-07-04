'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { Leaf, TrendingUp, Award, Sparkles, Loader2 } from 'lucide-react';

interface TreeState {
    tree_type: string;
    tree_level: number;
    total_co2_saved: number;
    current_progress: number;
}

const TREE_TYPES: Record<string, {
    name: string;
    icon: string;
    description: string;
    color: string;
    stages: string[];
}> = {
    oak: {
        name: 'Дуб',
        icon: '🌳',
        description: 'Символ силы и долголетия',
        color: 'from-emerald-700 to-emerald-500',
        stages: ['🌰', '🌱', '🌿', '🌳', '👑🌳']
    },
    pine: {
        name: 'Сосна',
        icon: '🎄',
        description: 'Вечнозелёный страж природы',
        color: 'from-green-700 to-green-500',
        stages: ['🌰', '🌱', '🌲', '🎄', '🌟🎄']
    },
    cherry: {
        name: 'Сакура',
        icon: '🌸',
        description: 'Цветущая красота',
        color: 'from-pink-600 to-pink-400',
        stages: ['🍒', '🌱', '🌿', '🌸', '✨🌸']
    },
    palm: {
        name: 'Пальма',
        icon: '🌴',
        description: 'Тропический защитник',
        color: 'from-yellow-700 to-yellow-500',
        stages: ['🥥', '🌱', '🌴', '🌴🌴', '🌟🌴']
    },
    maple: {
        name: 'Клён',
        icon: '🍁',
        description: 'Осенняя магия',
        color: 'from-orange-700 to-orange-500',
        stages: ['🍂', '🌱', '🌿', '🍁', '✨🍁']
    }
};

interface UserTreeProps {
    treeData: any;
    entries: any[];
}

export default function UserTree({ treeData, entries }: UserTreeProps) {
    const { t } = useTranslation('common');
    const [tree, setTree] = useState<TreeState>(treeData || {
        tree_type: 'oak',
        tree_level: 1,
        total_co2_saved: 0,
        current_progress: 0
    });

    useEffect(() => {
        if (!entries || entries.length === 0) return;
        const totalCO2 = entries.reduce((sum, e) => sum + (e.co2e || 0), 0);
        const co2Saved = Math.max(0, 500 - totalCO2);
        const progress = Math.min(100, (co2Saved / 500) * 100);
        setTree(prev => ({ ...prev, current_progress: progress }));
    }, [entries]);

    if (!tree) {
        return (
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
                <CardContent className="p-6 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">{t('loading_tree')}</p>
                </CardContent>
            </Card>
        );
    }

    const treeType = TREE_TYPES[tree.tree_type] || TREE_TYPES.oak;
    const currentStage = Math.min(tree.tree_level - 1, 4);
    const treeIcon = treeType.stages[currentStage];

    return (
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800 overflow-hidden relative">
            <CardHeader className="pb-2">
                <h2 className="flex items-center justify-between text-xl font-semibold">
                    <span className="flex items-center gap-2">
                        <Leaf className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                        {t('your_eco_tree')}
                    </span>
                    <span className="text-sm font-normal text-muted-foreground">
                        {treeType.name} {treeIcon}
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
                    {tree.tree_level >= 5 && (
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
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full bg-gradient-to-r ${treeType.color} rounded-full`}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-xl">
                        <TrendingUp className="w-5 h-5 text-emerald-600 mx-auto mb-1" aria-hidden="true" />
                        <p className="text-2xl font-bold text-emerald-600">
                            {Math.round(tree.total_co2_saved)}
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

                <div className="p-3 bg-emerald-100/50 dark:bg-emerald-900/20 rounded-xl">
                    <p className="text-xs text-center text-muted-foreground">
                        {t('tree_growth_tip', { co2: Math.max(0, Math.round(500 - (tree.current_progress * 5))) })}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}