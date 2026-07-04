'use client';

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { TrendingDown, Leaf } from 'lucide-react';

interface FootprintCardProps {
  totalCO2: number;
  period: string;
  comparison?: number;
}

export default function FootprintCard({ totalCO2, period, comparison }: FootprintCardProps) {
  const { t } = useTranslation('common');
  const isGood = totalCO2 < 400;

  return (
      <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
      >
        <Card className="overflow-hidden border-emerald-100 dark:border-emerald-900">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Leaf className="w-5 h-5 text-emerald-600" />
                {t('carbon_footprint')}
              </CardTitle>
              <span className="text-sm text-muted-foreground">{period}</span>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex items-baseline gap-1">
            <span className="text-5xl font-bold tracking-tighter">
              {totalCO2.toFixed(0)}
            </span>
              <span className="text-2xl text-muted-foreground">{t('kg_co2e')}</span>
            </div>

            {comparison && (
                <div className={`flex items-center gap-1 text-sm mt-2 ${comparison < 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  <TrendingDown className="w-4 h-4" />
                  {comparison > 0 ? '+' : ''}{comparison}% {t('from_last_month')}
                </div>
            )}

            <div className="mt-4 text-xs text-muted-foreground">
              {isGood ? t('good_result') : t('room_for_improvement')}
            </div>
          </CardContent>
        </Card>
      </motion.div>
  );
}