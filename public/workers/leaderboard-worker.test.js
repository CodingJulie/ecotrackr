import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

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

const workerCode = readFileSync(resolve(__dirname, './leaderboard-worker.js'), 'utf-8');

describe('leaderboard-worker', () => {
    let worker;

    beforeEach(() => {
        worker = createWorker(workerCode);
    });

    it('builds CO₂ leaderboard (highest to lowest)', () => {
        const usersData = [
            { user_id: '1', user_name: 'Alice', co2e: 100, category: 'transport' },
            { user_id: '2', user_name: 'Bob', co2e: 50, category: 'food' },
            { user_id: '1', user_name: 'Alice', co2e: 200, category: 'energy' },
        ];
        worker.trigger({ usersData, limit: 10 });

        const result = worker.postMessage.mock.calls[0][0].leaderboard;
        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('1'); // Alice – 300
        expect(result[0].rank).toBe(1);
        expect(result[0].medal).toBe('🥇');
        expect(result[0].totalCO2).toBe(300);
        expect(result[1].id).toBe('2'); // Bob – 50
        expect(result[1].rank).toBe(2);
        expect(result[1].medal).toBe('🥈');
        expect(result[0]).not.toHaveProperty('categories');
    });

    it('limits number of entries', () => {
        const usersData = [
            { user_id: '1', user_name: 'A', co2e: 10 },
            { user_id: '2', user_name: 'B', co2e: 20 },
            { user_id: '3', user_name: 'C', co2e: 30 },
        ];
        worker.trigger({ usersData, limit: 2 });
        const result = worker.postMessage.mock.calls[0][0].leaderboard;
        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('3');
        expect(result[1].id).toBe('2');
    });

    it('returns empty array when data is missing', () => {
        worker.trigger({ usersData: [] });
        expect(worker.postMessage).toHaveBeenCalledWith({ leaderboard: [] });
    });

    it('uses localized default name', () => {
        const usersData = [{ user_id: '1', co2e: 10, category: 'food' }];
        worker.trigger({
            usersData,
            limit: 10,
            defaultUserName: 'Пользователь',
        });
        const result = worker.postMessage.mock.calls[0][0].leaderboard;
        expect(result[0].name).toBe('Пользователь');
    });
});
