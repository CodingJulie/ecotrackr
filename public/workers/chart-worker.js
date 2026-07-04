// Подготовка данных для графиков
self.onmessage = function(e) {
    const { entries, chartType, dateRange } = e.data;

    if (!entries || entries.length === 0) {
        self.postMessage({ data: [] });
        return;
    }

    // Фильтрация по дате
    let filtered = entries;
    if (dateRange) {
        const now = new Date();
        const startDate = new Date();
        if (dateRange === 'week') startDate.setDate(now.getDate() - 7);
        if (dateRange === 'month') startDate.setDate(now.getDate() - 30);
        if (dateRange === 'year') startDate.setFullYear(now.getFullYear() - 1);

        filtered = entries.filter(e => new Date(e.date) >= startDate);
    }

    let result;

    switch (chartType) {
        case 'line':
            // Данные для линейного графика
            const byDate = {};
            for (const entry of filtered) {
                const date = entry.date;
                byDate[date] = (byDate[date] || 0) + entry.co2e;
            }
            result = Object.entries(byDate)
                .sort((a, b) => new Date(a[0]) - new Date(b[0]))
                .map(([date, value]) => ({
                    date: new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
                    co2e: value
                }));
            break;

        case 'bar':
            // Данные для столбчатого графика по категориям
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
            // Данные для круговой диаграммы
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

    self.postMessage({ data: result, count: filtered.length });
};