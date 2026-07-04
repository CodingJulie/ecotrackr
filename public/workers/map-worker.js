// Оптимизация данных для карты
self.onmessage = function(e) {
    const { points, viewMode, bounds } = e.data;

    if (!points || points.length === 0) {
        self.postMessage({ points: [], heatmap: [] });
        return;
    }

    // Фильтрация точек по границам карты
    let filteredPoints = points;
    if (bounds) {
        filteredPoints = points.filter(point =>
            point.lat >= bounds.south &&
            point.lat <= bounds.north &&
            point.lng >= bounds.west &&
            point.lng <= bounds.east
        );
    }

    // Подготовка данных для тепловой карты
    const heatmapData = filteredPoints.map(point => [
        point.lat,
        point.lng,
        point.co2_estimate || point.co2e || 25
    ]);

    // Агрегация точек с одинаковыми координатами
    const aggregated = new Map();
    for (const point of filteredPoints) {
        const key = `${point.lat},${point.lng}`;
        if (aggregated.has(key)) {
            const existing = aggregated.get(key);
            existing.count++;
            existing.totalCO2 += (point.co2_estimate || point.co2e || 25);
            existing.names.push(point.name);
        } else {
            aggregated.set(key, {
                lat: point.lat,
                lng: point.lng,
                count: 1,
                totalCO2: point.co2_estimate || point.co2e || 25,
                names: [point.name]
            });
        }
    }

    // Конвертация обратно в массив
    const markersData = Array.from(aggregated.values()).map(item => ({
        ...item,
        avgCO2: Math.round(item.totalCO2 / item.count)
    }));

    self.postMessage({
        points: markersData,
        heatmap: heatmapData,
        totalPoints: filteredPoints.length,
        aggregatedCount: markersData.length
    });
};