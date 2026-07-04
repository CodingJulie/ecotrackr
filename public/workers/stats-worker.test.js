import { describe, it, expect, vi, beforeEach } from 'vitest';

// Функция для создания эмуляции воркера
function createWorker(workerCode) {
    const worker = {
        postMessage: vi.fn(),
        onmessage: null,
    };
    const self = {
        onmessage: null,
        postMessage: (data) => worker.postMessage(data),
    };
    // Выполняем код воркера, передавая self
    const fn = new Function('self', workerCode);
    fn(self);
    worker.trigger = (data) => {
        if (self.onmessage) self.onmessage({ data });
    };
    return worker;
}

// Берём содержимое stats-worker.js (можно импортировать как строку, но проще скопировать)
const workerCode = `
// Расчёт углеродного следа и статистики
self.onmessage = function(e) {
    const { entries, period } = e.data;

    if (!entries || entries.length === 0) {
        self.postMessage({ error: 'Нет данных' });
        return;
    }

    let totalCO2 = 0;
    let maxCO2 = 0;
    let minCO2 = Infinity;
    const byCategory = {};
    const byDate = {};
    const byActivity = {};

    for (const entry of entries) {
        const co2e = entry.co2e || 0;
        totalCO2 += co2e;
        if (co2e > maxCO2) maxCO2 = co2e;
        if (co2e < minCO2) minCO2 = co2e;
        byCategory[entry.category] = (byCategory[entry.category] || 0) + co2e;
        const key = \`\${entry.category}_\${entry.activity}\`;
        byActivity[key] = (byActivity[key] || 0) + co2e;
        byDate[entry.date] = (byDate[entry.date] || 0) + co2e;
    }

    const dates = Object.keys(byDate).sort();
    const trend = dates.map(date => ({ date, co2e: byDate[date] }));

    let forecast = null;
    if (trend.length >= 3) {
        const values = trend.map(t => t.co2e);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const lastValue = values[values.length - 1];
        forecast = Math.round((lastValue + avg) / 2);
    }

    const result = {
        total: Math.round(totalCO2),
        max: Math.round(maxCO2),
        min: Math.round(minCO2 === Infinity ? 0 : minCO2),
        average: Math.round(totalCO2 / entries.length),
        byCategory,
        byActivity,
        trend: trend.slice(-30),
        forecast,
        entriesCount: entries.length
    };

    self.postMessage(result);
};
`;

describe('stats-worker', () => {
    let worker;

    beforeEach(() => {
        worker = createWorker(workerCode);
    });

    it('вычисляет статистику для списка записей', () => {
        const entries = [
            { co2e: 10, category: 'transport', activity: 'car', date: '2025-01-01' },
            { co2e: 20, category: 'food', activity: 'beef', date: '2025-01-02' },
            { co2e: 30, category: 'transport', activity: 'bus', date: '2025-01-03' },
        ];
        worker.trigger({ entries });

        expect(worker.postMessage).toHaveBeenCalledWith({
            total: 60,
            max: 30,
            min: 10,
            average: 20,
            byCategory: { transport: 40, food: 20 },
            byActivity: { transport_car: 10, food_beef: 20, transport_bus: 30 },
            trend: expect.any(Array),
            forecast: expect.any(Number),
            entriesCount: 3,
        });
    });

    it('возвращает ошибку при пустых данных', () => {
        worker.trigger({ entries: [] });
        expect(worker.postMessage).toHaveBeenCalledWith({ error: 'Нет данных' });
    });

    it('корректно обрабатывает записи без co2e', () => {
        const entries = [
            { co2e: null, category: 'test', activity: 'test', date: '2025-01-01' },
        ];
        worker.trigger({ entries });
        expect(worker.postMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                total: 0,
                max: 0,
                min: 0,
                average: 0,
            })
        );
    });
});