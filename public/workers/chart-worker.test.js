import { describe, it, expect } from 'vitest';

function processChartData(data) {
    const { entries, chartType, dateRange } = data;

    if (!entries || entries.length === 0) {
        return { data: [], count: 0 };
    }

    let filtered = entries;
    if (dateRange) {
        const now = new Date();
        const startDate = new Date();
        if (dateRange === 'week') startDate.setDate(now.getDate() - 7);
        if (dateRange === 'month') startDate.setDate(now.getDate() - 30);
        if (dateRange === 'year') startDate.setFullYear(now.getFullYear() - 1);

        filtered = entries.filter((e) => new Date(e.date) >= startDate);
    }

    let result;

    switch (chartType) {
        case 'line':
            const byDate = {};
            for (const entry of filtered) {
                const date = entry.date;
                byDate[date] = (byDate[date] || 0) + entry.co2e;
            }
            result = Object.entries(byDate)
                .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
                .map(([date, value]) => ({
                    date: new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
                    co2e: value
                }));
            break;

        case 'bar':
            const byCategory = {};
            for (const entry of filtered) {
                byCategory[entry.category] = (byCategory[entry.category] || 0) + entry.co2e;
            }
            result = Object.entries(byCategory).map(([name, value]) => ({
                name,
                value: Math.round(value)
            }));
            break;

        case 'pie':
            const pieData = {};
            for (const entry of filtered) {
                pieData[entry.category] = (pieData[entry.category] || 0) + entry.co2e;
            }
            const total = Object.values(pieData).reduce((a, b) => a + b, 0);
            result = Object.entries(pieData).map(([name, value]) => ({
                name,
                value: Math.round(value),
                percent: Math.round((value / total) * 100)
            }));
            break;

        default:
            result = filtered;
    }

    return { data: result, count: filtered.length };
}

describe('chart-worker', () => {
    // ✅ Используем текущие даты
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);

    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

    const entries = [
        { date: todayStr, co2e: 10, category: 'transport' },
        { date: yesterdayStr, co2e: 20, category: 'food' },
        { date: twoDaysAgoStr, co2e: 15, category: 'transport' },
    ];

    it('генерирует данные для линейного графика', () => {
        const result = processChartData({ entries, chartType: 'line' });

        expect(result.data).toHaveLength(3);
        expect(result.count).toBe(3);

        // ✅ Проверяем, что все элементы имеют правильную структуру
        expect(result.data[0]).toHaveProperty('date');
        expect(result.data[0]).toHaveProperty('co2e');

        // ✅ Проверяем, что значения отсортированы по дате
        // Самая старая дата (twoDaysAgo) должна быть первой
        expect(result.data[0].co2e).toBe(15);
        expect(result.data[1].co2e).toBe(20);
        expect(result.data[2].co2e).toBe(10);
    });

    it('генерирует данные для столбчатого графика по категориям', () => {
        const result = processChartData({ entries, chartType: 'bar' });

        const transport = result.data.find((d) => d.name === 'transport');
        const food = result.data.find((d) => d.name === 'food');

        expect(transport.value).toBe(25);
        expect(food.value).toBe(20);
    });

    it('генерирует данные для круговой диаграммы', () => {
        const result = processChartData({ entries, chartType: 'pie' });

        const totalPercent = result.data.reduce((sum, d) => sum + d.percent, 0);
        expect(totalPercent).toBeCloseTo(100, -1);

        const transport = result.data.find((d) => d.name === 'transport');
        const food = result.data.find((d) => d.name === 'food');
        expect(transport.value).toBe(25);
        expect(food.value).toBe(20);
        expect(transport.percent).toBe(56);
        expect(food.percent).toBe(44);
    });

    it('фильтрует по дате (месяц) - все записи должны быть включены', () => {
        const result = processChartData({ entries, chartType: 'line', dateRange: 'month' });
        expect(result.count).toBe(3);
        expect(result.data).toHaveLength(3);
    });

    it('фильтрует по дате (неделя) - все записи должны быть включены', () => {
        const result = processChartData({ entries, chartType: 'line', dateRange: 'week' });
        expect(result.count).toBe(3);
        expect(result.data).toHaveLength(3);
    });

    it('возвращает пустой массив при отсутствии записей', () => {
        const result = processChartData({ entries: [], chartType: 'line' });
        expect(result.data).toEqual([]);
        expect(result.count).toBe(0);
    });

    it('возвращает пустой массив при null entries', () => {
        const result = processChartData({ entries: null, chartType: 'line' });
        expect(result.data).toEqual([]);
        expect(result.count).toBe(0);
    });

    it('фильтрует старые записи при dateRange', () => {
        const oldDate = new Date(today);
        oldDate.setDate(today.getDate() - 60);
        const oldDateStr = oldDate.toISOString().split('T')[0];

        const entriesWithOld = [
            ...entries,
            { date: oldDateStr, co2e: 100, category: 'old' },
        ];

        const result = processChartData({
            entries: entriesWithOld,
            chartType: 'line',
            dateRange: 'month'
        });

        expect(result.count).toBe(3);
        expect(result.data).toHaveLength(3);
    });
});