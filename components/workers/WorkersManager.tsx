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

export interface ExportLabels {
    noData?: string;
    user?: string;
    date?: string;
    category?: string;
    activity?: string;
    value?: string;
    co2e?: string;
    reportTitle?: string;
    totalCo2?: string;
    avgCo2?: string;
    totalEntries?: string;
    byCategory?: string;
    emissions?: string;
    details?: string;
    moreEntries?: string;
    footer?: string;
    unsupportedFormat?: string;
}

export interface ExportOptions {
    locale?: string;
    labels?: ExportLabels;
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
            this.workers.set('export', new Worker('/workers/export-worker.js'));
            this.workers.set('leaderboard', new Worker('/workers/leaderboard-worker.js'));
            this.initialized = true;
        } catch (error) {
            console.error('[Workers] Error during initialization:', error);
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

    exportData(
        entries: Entry[],
        format: 'csv' | 'json' | 'html',
        userProfile?: { name?: string; email?: string } | null,
        options: ExportOptions = {}
    ): Promise<{ data: string; format: string }> {
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
            worker.postMessage({
                entries,
                format,
                userProfile,
                locale: options.locale || 'en',
                labels: options.labels || {},
            });
        });
    }

    calculateLeaderboard(
        usersData: Array<{
            user_id: string;
            user_name?: string;
            avatar_url?: string | null;
            co2e?: number;
            category?: string;
        }>,
        limit: number = 100,
        defaultUserName: string = 'User'
    ): Promise<{ leaderboard: LeaderboardUser[] }> {
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
            worker.postMessage({ usersData, limit, defaultUserName });
        });
    }
}

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

export function useWorkers() {
    return WorkersManager.getInstance();
}
