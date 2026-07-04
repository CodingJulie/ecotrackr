// components/ui/PollutionEffect.tsx
'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

interface PollutionEffectProps {
    co2Amount: number;
    onComplete?: () => void;
}

export default function PollutionEffect({ co2Amount, onComplete }: PollutionEffectProps) {
    const { t } = useTranslation('common');
    const [show, setShow] = useState(true);

    const intensity = Math.min(1, co2Amount / 300);
    const duration = 2500;

    useEffect(() => {
        if (co2Amount > 300) {
            document.body.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                document.body.style.animation = '';
            }, 500);
        }

        const timer = setTimeout(() => {
            setShow(false);
            onComplete?.();
        }, duration);

        return () => clearTimeout(timer);
    }, [co2Amount, duration, onComplete]);

    if (!show) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[10002] pointer-events-none"
            >
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 + intensity * 0.4 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-black"
                />

                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 2, opacity: 0.6 }}
                    exit={{ scale: 3, opacity: 0 }}
                    transition={{ duration: 1.5 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full"
                    style={{
                        background: `radial-gradient(circle, rgba(80,80,80,0.8) 0%, rgba(60,60,60,0.4) 50%, transparent 100%)`
                    }}
                />

                {Array.from({ length: 50 }).map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{
                            x: Math.random() * window.innerWidth,
                            y: window.innerHeight,
                            scale: 0.3 + Math.random() * 1
                        }}
                        animate={{
                            y: -100,
                            x: Math.random() * window.innerWidth,
                            rotate: 360
                        }}
                        transition={{
                            duration: 1 + Math.random() * 2,
                            delay: Math.random() * 0.3,
                            ease: "linear"
                        }}
                        className="absolute"
                    >
                        <span className="text-gray-400 text-sm opacity-60">
                            💨
                        </span>
                    </motion.div>
                ))}

                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0 }}
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
            </motion.div>
        </AnimatePresence>
    );
}