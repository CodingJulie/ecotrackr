import { describe, it, expect, vi, beforeEach } from 'vitest';

function createWorker(workerCode) {
    const worker = { postMessage: vi.fn(), onmessage: null };
    const self = {
        onmessage: null,
        postMessage: (data) => worker.postMessage(data),
    };
    const fn = new Function('self', workerCode);
    fn(self);
    worker.trigger = (data) => {
        if (self.onmessage) self.onmessage({ data });
    };
    return worker;
}

const workerCode = `
self.onmessage = function(e) {
    const { usersData, sortBy, limit } = e.data;

    if (!usersData || usersData.length === 0) {
        self.postMessage({ leaderboard: [] });
        return;
    }

    const userStats = new Map();

    for (const entry of usersData) {
        const userId = entry.user_id;
        if (!userStats.has(userId)) {
            userStats.set(userId, {
                id: userId,
                name: entry.user_name || 'Пользователь',
                avatar_url: entry.avatar_url,
                totalCO2: 0,
                entriesCount: 0,
                categories: new Set()
            });
        }

        const stats = userStats.get(userId);
        stats.totalCO2 += entry.co2e || 0;
        stats.entriesCount++;
        stats.categories.add(entry.category);
    }

    let leaderboard = Array.from(userStats.values()).map(user => ({
        ...user,
        categoriesCount: user.categories.size,
        avgCO2: user.entriesCount ? Math.round(user.totalCO2 / user.entriesCount) : 0,
        rank: 0
    }));

    if (sortBy === 'co2') {
        leaderboard.sort((a, b) => a.totalCO2 - b.totalCO2);
    } else if (sortBy === 'entries') {
        leaderboard.sort((a, b) => b.entriesCount - a.entriesCount);
    } else if (sortBy === 'avg') {
        leaderboard.sort((a, b) => a.avgCO2 - b.avgCO2);
    } else if (sortBy === 'categories') {
        leaderboard.sort((a, b) => b.categoriesCount - a.categoriesCount);
    }

    leaderboard = leaderboard.slice(0, limit || 100).map((user, index) => ({
        ...user,
        rank: index + 1
    }));

    const medals = ['🥇', '🥈', '🥉'];
    leaderboard = leaderboard.map(user => ({
        ...user,
        medal: user.rank <= 3 ? medals[user.rank - 1] : null
    }));

    self.postMessage({ leaderboard });
};
`;

describe('leaderboard-worker', () => {
    let worker;

    beforeEach(() => {
        worker = createWorker(workerCode);
    });

    it('строит лидерборд по CO₂ (от меньшего к большему)', () => {
        const usersData = [
            { user_id: '1', user_name: 'Alice', co2e: 100, category: 'transport' },
            { user_id: '2', user_name: 'Bob', co2e: 50, category: 'food' },
            { user_id: '1', user_name: 'Alice', co2e: 200, category: 'energy' },
        ];
        worker.trigger({ usersData, sortBy: 'co2', limit: 10 });

        const result = worker.postMessage.mock.calls[0][0].leaderboard;
        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('2'); // Bob – 50
        expect(result[0].rank).toBe(1);
        expect(result[0].medal).toBe('🥇');
        expect(result[1].id).toBe('1'); // Alice – 300
        expect(result[1].rank).toBe(2);
        expect(result[1].medal).toBe('🥈');
    });

    it('сортирует по количеству записей', () => {
        const usersData = [
            { user_id: '1', user_name: 'Alice', co2e: 10, category: 'transport' },
            { user_id: '1', user_name: 'Alice', co2e: 20, category: 'food' },
            { user_id: '2', user_name: 'Bob', co2e: 30, category: 'energy' },
        ];
        worker.trigger({ usersData, sortBy: 'entries', limit: 10 });
        const result = worker.postMessage.mock.calls[0][0].leaderboard;
        expect(result[0].id).toBe('1'); // Alice – 2 записи
        expect(result[0].entriesCount).toBe(2);
    });

    it('ограничивает количество записей', () => {
        const usersData = [
            { user_id: '1', user_name: 'A', co2e: 10 },
            { user_id: '2', user_name: 'B', co2e: 20 },
            { user_id: '3', user_name: 'C', co2e: 30 },
        ];
        worker.trigger({ usersData, sortBy: 'co2', limit: 2 });
        const result = worker.postMessage.mock.calls[0][0].leaderboard;
        expect(result).toHaveLength(2);
    });

    it('возвращает пустой массив при отсутствии данных', () => {
        worker.trigger({ usersData: [] });
        expect(worker.postMessage).toHaveBeenCalledWith({ leaderboard: [] });
    });
});