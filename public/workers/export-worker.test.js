import { describe, it, expect, vi, beforeEach } from 'vitest';

// ✅ Функция для создания mock воркера
function createWorker(workerCode) {
    const worker = {
        postMessage: vi.fn(),
        onmessage: null,
        trigger: null,
    };

    // ✅ Создаём self с правильной реализацией
    const self = {
        onmessage: null,
        postMessage: (data) => {
            worker.postMessage(data);
        },
    };

    // ✅ Выполняем код воркера
    try {
        const fn = new Function('self', workerCode);
        fn(self);
    } catch (err) {
        console.error('Worker creation error:', err);
    }

    // ✅ Сохраняем ссылку на onmessage для триггера
    worker.trigger = (data) => {
        if (self.onmessage) {
            self.onmessage({ data });
        }
    };

    return worker;
}

// ✅ Код воркера как строка (экранируем специальные символы)
const workerCode = `
self.onmessage = function (e) {
    const {entries, format, userProfile} = e.data;

    if (!entries || entries.length === 0) {
        self.postMessage({error: 'Нет данных для экспорта'});
        return;
    }

    const totalCO2 = entries.reduce((sum, e) => sum + (e.co2e || 0), 0);
    const byCategory = {};
    for (const entry of entries) {
        byCategory[entry.category] = (byCategory[entry.category] || 0) + (entry.co2e || 0);
    }

    const formatDateForExcel = (dateStr) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return day + '.' + month + '.' + year;
        } catch {
            return dateStr;
        }
    };

    const formatNumberForExcel = (num) => {
        if (num === null || num === undefined || isNaN(num)) return '';
        return Number(num).toFixed(2).replace('.', ',');
    };

    if (format === 'csv') {
        const headers = ['Дата', 'Категория', 'Активность', 'Значение', 'CO₂e (кг)'];
        const delimiter = ';';
        let csvContent = headers.join(delimiter) + '\\n';

        for (const entry of entries) {
            const row = [
                formatDateForExcel(entry.date),
                entry.category || '',
                entry.activity || '',
                formatNumberForExcel(entry.value),
                formatNumberForExcel(entry.co2e)
            ];
            csvContent += row.join(delimiter) + '\\n';
        }

        self.postMessage({data: '\\uFEFF' + csvContent, format: 'csv'});

    } else if (format === 'json') {
        const exportData = {
            exportedAt: new Date().toISOString(),
            user: userProfile,
            summary: {
                totalCO2: Math.round(totalCO2),
                entriesCount: entries.length,
                categories: Object.keys(byCategory),
                averageCO2: Math.round(totalCO2 / entries.length),
            },
            entries: entries.map(function(entry) {
                return {
                    ...entry,
                    date: formatDateForExcel(entry.date),
                    value: Number(entry.value ?? 0),
                    co2e: Number(entry.co2e ?? 0)
                };
            })
        };
        self.postMessage({data: JSON.stringify(exportData, null, 2), format: 'json'});

    } else if (format === 'html') {
        var categoryRows = '';
        var categoryEntries = Object.entries(byCategory);
        categoryEntries.sort(function(a, b) { return b[1] - a[1]; });
        for (var i = 0; i < categoryEntries.length; i++) {
            var cat = categoryEntries[i];
            categoryRows += '<tr><td>' + cat[0] + '</td><td style="text-align: right; font-weight: 600; color: #059669;">' + Math.round(cat[1]) + '</td></tr>';
        }

        var entryRows = '';
        var maxEntries = Math.min(entries.length, 30);
        for (var j = 0; j < maxEntries; j++) {
            var entry = entries[j];
            entryRows += '<tr><td>' + formatDateForExcel(entry.date) + '</td><td>' + entry.category + '</td><td>' + entry.activity + '</td><td style="text-align: right; font-weight: 500;">' + Number(entry.co2e ?? 0).toFixed(2) + '</td></tr>';
        }

        var moreRows = '';
        if (entries.length > 30) {
            moreRows = '<tr><td colspan="4" style="text-align: center; color: #6b7280; font-style: italic;">... и ещё ' + (entries.length - 30) + ' записей</td></tr>';
        }

        var html = '<!DOCTYPE html>\\n<html>\\n<head>\\n<meta charset="UTF-8">\\n<title>Экологический отчёт</title>\\n<style>\\n* { box-sizing: border-box; }\\nbody { font-family: Arial, sans-serif; padding: 40px; max-width: 1000px; margin: 0 auto; background: #f9fafb; }\\n.container { background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }\\nh1 { color: #10b981; font-size: 28px; margin-top: 0; }\\n.header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #10b981; padding-bottom: 16px; margin-bottom: 24px; }\\n.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }\\n.stat-card { background: #f3f4f6; border-radius: 12px; padding: 16px; text-align: center; }\\n.stat-card .value { font-size: 28px; font-weight: bold; color: #059669; }\\n.stat-card .label { font-size: 13px; color: #6b7280; margin-top: 4px; }\\ntable { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }\\nth { background: #10b981; color: white; padding: 10px 16px; text-align: left; }\\ntd { padding: 8px 16px; border-bottom: 1px solid #e5e7eb; }\\n.footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px; }\\n</style>\\n</head>\\n<body>\\n<div class="container">\\n<div class="header">\\n<div>\\n<h1>🌿 Экологический отчёт</h1>\\n<p style="color: #6b7280; margin: 0;">EcoTrackr · ' + new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) + '</p>\\n</div>\\n<div style="text-align: right;">\\n<p style="margin: 0; font-weight: 500;">' + (userProfile?.name || 'Пользователь') + '</p>\\n<p style="margin: 0; font-size: 13px; color: #6b7280;">' + (userProfile?.email || '') + '</p>\\n</div>\\n</div>\\n<div class="stats">\\n<div class="stat-card"><div class="value">' + Math.round(totalCO2) + '</div><div class="label">кг CO₂e (всего)</div></div>\\n<div class="stat-card"><div class="value">' + Math.round(totalCO2 / entries.length) + '</div><div class="label">кг CO₂e (среднее)</div></div>\\n<div class="stat-card"><div class="value">' + entries.length + '</div><div class="label">всего записей</div></div>\\n</div>\\n<h2>📊 По категориям</h2>\\n<table>\\n<thead><tr><th>Категория</th><th style="text-align: right;">Выбросы (кг CO₂e)</th></tr></thead>\\n<tbody>' + categoryRows + '</tbody>\\n</table>\\n<h2>📋 Детали записей</h2>\\n<table>\\n<thead><tr><th>Дата</th><th>Категория</th><th>Активность</th><th style="text-align: right;">CO₂e (кг)</th></tr></thead>\\n<tbody>' + entryRows + moreRows + '</tbody>\\n</table>\\n<div class="footer">Отчёт создан с помощью EcoTrackr · ' + new Date().toLocaleString('ru-RU') + '</div>\\n</div>\\n</body>\\n</html>';

        self.postMessage({data: html, format: 'html'});
    }
};
`;

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

    it('генерирует CSV с BOM', () => {
        worker.trigger({ entries, format: 'csv', userProfile });

        expect(worker.postMessage).toHaveBeenCalled();
        const call = worker.postMessage.mock.calls[0][0];
        expect(call.format).toBe('csv');
        expect(call.data).toContain('\uFEFF');
        expect(call.data).toContain('Дата;Категория;Активность;Значение;CO₂e (кг)');
        // Проверяем, что данные содержат значения (формат может отличаться)
        expect(call.data).toContain('01.01.2025');
        expect(call.data).toContain('1,92');
    });

    it('генерирует JSON', () => {
        worker.trigger({ entries, format: 'json', userProfile });

        expect(worker.postMessage).toHaveBeenCalled();
        const call = worker.postMessage.mock.calls[0][0];
        expect(call.format).toBe('json');
        const parsed = JSON.parse(call.data);
        expect(parsed).toHaveProperty('exportedAt');
        expect(parsed.user).toEqual(userProfile);
        expect(parsed.summary.totalCO2).toBe(101);
        expect(parsed.entries).toHaveLength(2);
    });

    it('генерирует HTML отчёт', () => {
        worker.trigger({ entries, format: 'html', userProfile });

        expect(worker.postMessage).toHaveBeenCalled();
        const call = worker.postMessage.mock.calls[0][0];
        expect(call.format).toBe('html');
        expect(call.data).toContain('<!DOCTYPE html>');
        expect(call.data).toContain('Экологический отчёт');
        expect(call.data).toContain('Test');
        expect(call.data).toContain('101');
    });

    it('возвращает ошибку при пустых записях', () => {
        worker.trigger({ entries: [], format: 'csv' });
        expect(worker.postMessage).toHaveBeenCalledWith({ error: 'Нет данных для экспорта' });
    });
});