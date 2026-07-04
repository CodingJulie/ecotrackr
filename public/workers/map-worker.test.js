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
    const { points, viewMode, bounds } = e.data;

    if (!points || points.length === 0) {
        self.postMessage({ points: [], heatmap: [] });
        return;
    }

    let filteredPoints = points;
    if (bounds) {
        filteredPoints = points.filter(point =>
            point.lat >= bounds.south &&
            point.lat <= bounds.north &&
            point.lng >= bounds.west &&
            point.lng <= bounds.east
        );
    }

    const heatmapData = filteredPoints.map(point => [
        point.lat,
        point.lng,
        point.co2_estimate || point.co2e || 25
    ]);

    const aggregated = new Map();
    for (const point of filteredPoints) {
        const key = \`\${point.lat},\${point.lng}\`;
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
`;

describe('map-worker', () => {
    let worker;

    beforeEach(() => {
        worker = createWorker(workerCode);
    });

    it('агрегирует точки и возвращает heatmap', () => {
        const points = [
            { lat: 55.0, lng: 60.0, co2_estimate: 50, name: 'A' },
            { lat: 55.0, lng: 60.0, co2_estimate: 30, name: 'B' },
            { lat: 56.0, lng: 61.0, co2e: 20, name: 'C' },
        ];
        worker.trigger({ points });

        expect(worker.postMessage).toHaveBeenCalledWith({
            points: expect.arrayContaining([
                expect.objectContaining({ lat: 55.0, lng: 60.0, count: 2, totalCO2: 80, avgCO2: 40, names: ['A', 'B'] }),
                expect.objectContaining({ lat: 56.0, lng: 61.0, count: 1, totalCO2: 20, avgCO2: 20, names: ['C'] }),
            ]),
            heatmap: [
                [55.0, 60.0, 50],
                [55.0, 60.0, 30],
                [56.0, 61.0, 20],
            ],
            totalPoints: 3,
            aggregatedCount: 2,
        });
    });

    it('фильтрует точки по границам', () => {
        const points = [
            { lat: 55.0, lng: 60.0, co2_estimate: 50, name: 'A' },
            { lat: 56.0, lng: 61.0, co2_estimate: 20, name: 'B' },
        ];
        const bounds = { south: 54.0, north: 55.5, west: 59.5, east: 60.5 };
        worker.trigger({ points, bounds });

        expect(worker.postMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                totalPoints: 1,
                points: expect.arrayContaining([
                    expect.objectContaining({ lat: 55.0, lng: 60.0 }),
                ]),
            })
        );
    });

    it('возвращает пустые массивы, если points пуст', () => {
        worker.trigger({ points: [] });
        expect(worker.postMessage).toHaveBeenCalledWith({ points: [], heatmap: [] });
    });
});