// components/workers/WorkersManager.tsx
'use client';
import { useEffect, useRef } from 'react';

export interface Entry {
    id: string;
    user_id: string;
    category: string;
    activity: string;
    value: number;
    co2e: number;
    date: string;
    created_at: string;
}

export interface StatsResult {
    total: number;
    max: number;
    min: number;
    average: number;
    byCategory: Record<string, number>;
    byActivity: Record<string, number>;
    trend: Array<{ date: string; co2e: number }>;
    forecast: number | null;
    entriesCount: number;
}

export interface MapPoint {
    lat: number;
    lng: number;
    co2_estimate?: number;
    co2e?: number;
    name: string;
    id?: string;
}

export interface LeaderboardUser {
    id: string;
    name: string;
    avatar_url?: string;
    totalCO2: number;
    entriesCount: number;
    categoriesCount: number;
    avgCO2: number;
    rank: number;
    medal: string | null;
}

class WorkersManager {
    private workers: Map<string, Worker> = new Map();
    private static instance: WorkersManager;
    private initialized = false;

    private constructor() {}

    static getInstance(): WorkersManager {
        if (!WorkersManager.instance) {
            WorkersManager.instance = new WorkersManager();
        }
        return WorkersManager.instance;
    }

    init() {
        if (this.initialized || typeof window === 'undefined') return;

        try {
            // Создаём воркеры только на клиенте
            this.workers.set('stats', new Worker('/workers/stats-worker.js'));
            this.workers.set('map', new Worker('/workers/map-worker.js'));
            this.workers.set('chart', new Worker('/workers/chart-worker.js'));
            this.workers.set('export', new Worker('/workers/export-worker.js'));
            this.workers.set('leaderboard', new Worker('/workers/leaderboard-worker.js'));
            this.initialized = true;
            console.log('[Workers] Все воркеры инициализированы');
        } catch (error) {
            console.error('[Workers] Ошибка инициализации:', error);
        }

        // Регистрация Service Worker (опционально, игнорируем ошибки)
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(() => {
                    console.log('[SW] Service Worker зарегистрирован');
                })
                .catch(err => {
                    console.log('[SW] Service Worker не зарегистрирован (это нормально для разработки):', err);
                });
        }
    }

    destroy() {
        this.workers.forEach(worker => worker.terminate());
        this.workers.clear();
        this.initialized = false;
    }

    private getWorker(name: string): Worker {
        const worker = this.workers.get(name);
        if (!worker) {
            throw new Error(`Worker ${name} not initialized`);
        }
        return worker;
    }

    calculateStats(entries: Entry[]): Promise<StatsResult> {
        return new Promise((resolve, reject) => {
            const worker = this.getWorker('stats');
            const handleMessage = (e: MessageEvent) => {
                worker.removeEventListener('message', handleMessage);
                if (e.data.error) {
                    reject(new Error(e.data.error));
                } else {
                    resolve(e.data);
                }
            };
            worker.addEventListener('message', handleMessage);
            worker.postMessage({ entries });
        });
    }

    processMapData(points: MapPoint[]): Promise<{ points: MapPoint[]; heatmap: number[][]; totalPoints: number; aggregatedCount: number }> {
        return new Promise((resolve, reject) => {
            const worker = this.getWorker('map');
            const handleMessage = (e: MessageEvent) => {
                worker.removeEventListener('message', handleMessage);
                if (e.data.error) {
                    reject(new Error(e.data.error));
                } else {
                    resolve(e.data);
                }
            };
            worker.addEventListener('message', handleMessage);
            worker.postMessage({ points });
        });
    }

    prepareChartData(entries: Entry[], chartType: 'line' | 'bar' | 'pie', dateRange?: 'week' | 'month' | 'year'): Promise<{ data: any[]; count: number }> {
        return new Promise((resolve, reject) => {
            const worker = this.getWorker('chart');
            const handleMessage = (e: MessageEvent) => {
                worker.removeEventListener('message', handleMessage);
                if (e.data.error) {
                    reject(new Error(e.data.error));
                } else {
                    resolve(e.data);
                }
            };
            worker.addEventListener('message', handleMessage);
            worker.postMessage({ entries, chartType, dateRange });
        });
    }

    exportData(entries: Entry[], format: 'csv' | 'json' | 'html' | 'report', userProfile?: any): Promise<{ data: string; format: string }> {
        return new Promise((resolve, reject) => {
            const worker = this.getWorker('export');
            const handleMessage = (e: MessageEvent) => {
                worker.removeEventListener('message', handleMessage);
                if (e.data.error) {
                    reject(new Error(e.data.error));
                } else {
                    resolve(e.data);
                }
            };
            worker.addEventListener('message', handleMessage);
            worker.postMessage({ entries, format, userProfile });
        });
    }

    calculateLeaderboard(usersData: any[], sortBy: 'co2' | 'entries' | 'avg' | 'categories' = 'co2', limit: number = 100): Promise<{ leaderboard: LeaderboardUser[] }> {
        return new Promise((resolve, reject) => {
            const worker = this.getWorker('leaderboard');
            const handleMessage = (e: MessageEvent) => {
                worker.removeEventListener('message', handleMessage);
                if (e.data.error) {
                    reject(new Error(e.data.error));
                } else {
                    resolve(e.data);
                }
            };
            worker.addEventListener('message', handleMessage);
            worker.postMessage({ usersData, sortBy, limit });
        });
    }
}

// Компонент для использования в layout
export default function WorkersManagerComponent() {
    const manager = useRef(WorkersManager.getInstance());

    useEffect(() => {
        const managerInstance = manager.current;
        managerInstance.init();
        return () => {
            managerInstance.destroy();
        };
    }, []);

    return null;
}

// Хук для использования в компонентах
export function useWorkers() {
    return WorkersManager.getInstance();
}