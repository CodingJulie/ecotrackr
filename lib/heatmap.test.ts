import { describe, expect, it } from 'vitest';
import { buildHeatData, normalizeCo2 } from './heatmap';

describe('buildHeatData', () => {
    it('gives full intensity range for different CO₂ values', () => {
        const data = buildHeatData(
            [
                { lat: 1, lng: 2, co2_estimate: 25 },
                { lat: 3, lng: 4, co2_estimate: 75 },
            ],
            90,
        );

        expect(data[0][2]).toBeCloseTo(0.05, 2);
        expect(data[1][2]).toBeCloseTo(1, 2);
    });

    it('increases contrast with smaller scaleMax', () => {
        const data = buildHeatData(
            [
                { lat: 1, lng: 2, co2_estimate: 20 },
                { lat: 3, lng: 4, co2_estimate: 40 },
            ],
            45,
        );

        expect(data[1][2]).toBe(1);
    });

    it('uses absolute scale when all values are equal', () => {
        const data = buildHeatData(
            [{ lat: 1, lng: 2, co2_estimate: 45 }],
            90,
        );

        expect(data[0][2]).toBeCloseTo(0.5, 1);
    });

    it('coerces co2 to a number', () => {
        expect(normalizeCo2('75')).toBe(75);
        expect(normalizeCo2(null)).toBe(25);
    });
});
