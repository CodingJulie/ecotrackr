import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function createWorker(workerCode) {
    const worker = {
        postMessage: vi.fn(),
        onmessage: null,
        trigger: null,
    };

    const self = {
        onmessage: null,
        postMessage: (data) => {
            worker.postMessage(data);
        },
    };

    const fn = new Function('self', workerCode);
    fn(self);

    worker.trigger = (data) => {
        if (self.onmessage) {
            self.onmessage({ data });
        }
    };

    return worker;
}

const workerCode = readFileSync(resolve(__dirname, './export-worker.js'), 'utf-8');

const ruLabels = {
    noData: 'Нет данных для экспорта',
    user: 'Пользователь',
    date: 'Дата',
    category: 'Категория',
    activity: 'Активность',
    value: 'Значение',
    co2e: 'CO₂e (кг)',
    reportTitle: 'Экологический отчёт',
    totalCo2: 'кг CO₂e (всего)',
    avgCo2: 'кг CO₂e (среднее)',
    totalEntries: 'всего записей',
    byCategory: '📊 По категориям',
    emissions: 'Выбросы (кг CO₂e)',
    details: '📋 Детали записей',
    moreEntries: '... и ещё {{count}} записей',
    footer: 'Отчёт создан с помощью EcoTrackr · {{date}}',
    unsupportedFormat: 'Неподдерживаемый формат экспорта',
};

describe('export-worker', () => {
    let worker;
    const entries = [
        { date: '2025-01-01', category: 'transport', activity: 'car', value: 10, co2e: 1.92 },
        { date: '2025-01-02', category: 'food', activity: 'beef', value: 1, co2e: 99.5 },
    ];
    const userProfile = { name: 'Test', email: 'test@test.com' };

    beforeEach(() => {
        vi.clearAllMocks();
        worker = createWorker(workerCode);
    });

    it('generates CSV with BOM and Russian headers', () => {
        worker.trigger({ entries, format: 'csv', userProfile, locale: 'ru', labels: ruLabels });

        expect(worker.postMessage).toHaveBeenCalled();
        const call = worker.postMessage.mock.calls[0][0];
        expect(call.format).toBe('csv');
        expect(call.data).toContain('\uFEFF');
        expect(call.data).toContain('Дата;Категория;Активность;Значение;CO₂e (кг)');
        expect(call.data).toContain('01.01.2025');
        expect(call.data).toContain('1,92');
    });

    it('generates CSV with English headers', () => {
        worker.trigger({ entries, format: 'csv', userProfile, locale: 'en' });

        const call = worker.postMessage.mock.calls[0][0];
        expect(call.format).toBe('csv');
        expect(call.data).toContain('Date,Category,Activity,Value,CO₂e (kg)');
        expect(call.data).toContain('1.92');
    });

    it('generates JSON', () => {
        worker.trigger({ entries, format: 'json', userProfile, locale: 'en' });

        expect(worker.postMessage).toHaveBeenCalled();
        const call = worker.postMessage.mock.calls[0][0];
        expect(call.format).toBe('json');
        const parsed = JSON.parse(call.data);
        expect(parsed).toHaveProperty('exportedAt');
        expect(parsed.user).toEqual(userProfile);
        expect(parsed.summary.totalCO2).toBe(101);
        expect(parsed.entries).toHaveLength(2);
    });

    it('generates HTML report in Russian', () => {
        worker.trigger({ entries, format: 'html', userProfile, locale: 'ru', labels: ruLabels });

        expect(worker.postMessage).toHaveBeenCalled();
        const call = worker.postMessage.mock.calls[0][0];
        expect(call.format).toBe('html');
        expect(call.data).toContain('<!DOCTYPE html>');
        expect(call.data).toContain('Экологический отчёт');
        expect(call.data).toContain('Test');
        expect(call.data).toContain('101');
    });

    it('generates HTML report in English', () => {
        worker.trigger({ entries, format: 'html', userProfile, locale: 'en' });

        const call = worker.postMessage.mock.calls[0][0];
        expect(call.format).toBe('html');
        expect(call.data).toContain('Environmental Report');
        expect(call.data).toContain('lang="en"');
    });

    it('returns error for empty entries', () => {
        worker.trigger({ entries: [], format: 'csv', locale: 'ru', labels: ruLabels });
        expect(worker.postMessage).toHaveBeenCalledWith({ error: 'Нет данных для экспорта' });
    });

    it('returns error for unsupported format', () => {
        worker.trigger({ entries, format: 'xml', locale: 'en' });
        expect(worker.postMessage).toHaveBeenCalledWith({ error: 'Unsupported export format' });
    });
});
