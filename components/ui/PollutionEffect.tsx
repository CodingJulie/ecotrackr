'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

interface PollutionEffectProps {
    co2Amount: number;
    onComplete?: () => void;
}

const DURATION_MS = 2500;

export default function PollutionEffect({ co2Amount, onComplete }: PollutionEffectProps) {
    const { t } = useTranslation('common');
    const [show, setShow] = useState(true);

    const intensity = Math.min(1, co2Amount / 300);

    useEffect(() => {
        if (co2Amount > 300) {
            document.body.style.animation = 'shake 0.5s ease-in-out';
            const shakeTimer = setTimeout(() => {
                document.body.style.animation = '';
            }, 500);
            return () => {
                clearTimeout(shakeTimer);
                document.body.style.animation = '';
            };
        }
    }, [co2Amount]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShow(false);
            onComplete?.();
        }, DURATION_MS);

        return () => clearTimeout(timer);
    }, [onComplete]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[10002] pointer-events-none">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.35 + intensity * 0.4 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-zinc-900"
            />

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="absolute top-1/3 left-1/2 -translate-x-1/2 text-center bg-black/50 backdrop-blur-sm px-6 py-3 rounded-2xl"
            >
                <p className="text-red-500 font-bold text-xl">
                    {t('pollution_co2_added', { amount: co2Amount })}
                </p>
                <p className="text-white/80 text-sm mt-1">
                    {t('pollution_added_to_atmosphere')}
                </p>
            </motion.div>
        </div>
    );
}
