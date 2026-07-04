// Расчёт углеродного следа и статистики
self.onmessage = function(e) {
    const { entries, period } = e.data;

    if (!entries || entries.length === 0) {
        self.postMessage({ error: 'Нет данных' });
        return;
    }

    // Общая статистика
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

        // По категориям
        byCategory[entry.category] = (byCategory[entry.category] || 0) + co2e;

        // По активности
        const key = `${entry.category}_${entry.activity}`;
        byActivity[key] = (byActivity[key] || 0) + co2e;

        // По датам
        byDate[entry.date] = (byDate[entry.date] || 0) + co2e;
    }

    // Тренды
    const dates = Object.keys(byDate).sort();
    const trend = dates.map(date => ({
        date,
        co2e: byDate[date]
    }));

    // Прогноз на следующий месяц (простая линейная регрессия)
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
        trend: trend.slice(-30), // последние 30 дней
        forecast,
        entriesCount: entries.length
    };

    self.postMessage(result);
};