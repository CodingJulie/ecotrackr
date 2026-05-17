function normalizeCo2(value: unknown): number {
    const co2 = Number(value);
    return Number.isFinite(co2) && co2 > 0 ? co2 : 25;
}

export function buildHeatData(
    points: Array<{ lat: number; lng: number; co2_estimate?: number | null | string }>,
    scaleMax: number,
) {
    const co2Values = points.map((point) => normalizeCo2(point.co2_estimate));
    const minCo2 = Math.min(...co2Values);
    const maxCo2 = Math.max(...co2Values);
    const contrast = Math.min(90 / Math.max(scaleMax, 1), 2);

    return points.map((point) => {
        const co2 = normalizeCo2(point.co2_estimate);
        let intensity: number;

        if (maxCo2 === minCo2) {
            intensity = Math.min(co2 / Math.max(scaleMax, 1), 1);
        } else {
            const relative = (co2 - minCo2) / (maxCo2 - minCo2);
            intensity = Math.min(0.05 + relative * 0.95 * contrast, 1);
        }

        return [point.lat, point.lng, intensity] as [number, number, number];
    });
}

export { normalizeCo2 };
