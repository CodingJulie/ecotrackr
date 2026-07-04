import { describe, expect, it } from 'vitest';
import { cn, formatDate, calculateCO2, groupByCategory, getEmissionFactor } from './utils';

describe('utils', () => {
    it('cn объединяет классы', () => {
        expect(cn('a', 'b')).toBe('a b');
        expect(cn('a', { b: true, c: false })).toBe('a b');
    });

    it('formatDate корректно форматирует', () => {
        const date = new Date('2025-06-28T12:00:00');
        expect(formatDate(date, 'ru')).toBe('28.06.2025');
        expect(formatDate(date, 'en')).toBe('06/28/2025');
    });

    it('calculateCO2 вычисляет выбросы', () => {
        const factor = 0.192;
        const value = 50;
        expect(calculateCO2(factor, value)).toBe(9.6);
    });

    it('groupByCategory группирует записи', () => {
        const entries = [
            { category: 'transport', co2e: 10 },
            { category: 'food', co2e: 20 },
            { category: 'transport', co2e: 15 },
        ];
        const result = groupByCategory(entries);
        expect(result).toEqual({ transport: 25, food: 20 });
    });

    it('getEmissionFactor возвращает коэффициент', () => {
        const factor = getEmissionFactor('transport', 'car_petrol');
        expect(factor).toBe(0.192);
        expect(getEmissionFactor('food', 'beef')).toBe(99.5);
        expect(getEmissionFactor('unknown', 'unknown')).toBe(0);
    });
});