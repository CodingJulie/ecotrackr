export interface EmissionEntry {
    id: string;
    category: 'transport' | 'energy' | 'food' | 'shopping' | 'waste' | 'other';
    activity: string;
    value: number; // км, кВтч, кг и т.д.
    unit: string;
    date: string;
    co2e: number; // кг CO₂e
}

export const EMISSION_FACTORS = {
    transport: {
        car: 0.192,        // кг CO₂e / км (средний автомобиль)
        plane: 0.24,       // кг CO₂e / км (эконом)
        train: 0.041,
        bus: 0.089,
    },
    energy: {
        electricity: 0.475, // кг CO₂e / кВтч (среднее по миру, можно по странам)
        gas: 0.202,         // кг CO₂e / кВтч
    },
    food: {
        beef: 99.5,         // кг CO₂e / кг продукта
        chicken: 14.0,
        plantBased: 2.5,
    },
    // ... добавляй остальные
} as const;

export function calculateCO2e(entry: Omit<EmissionEntry, 'co2e' | 'id'>): number {
    let factor = 0;

    if (entry.category === 'transport') {
        factor = EMISSION_FACTORS.transport[entry.activity as keyof typeof EMISSION_FACTORS.transport] || 0;
    } else if (entry.category === 'energy') {
        factor = EMISSION_FACTORS.energy[entry.activity as keyof typeof EMISSION_FACTORS.energy] || 0;
    } else if (entry.category === 'food') {
        factor = EMISSION_FACTORS.food[entry.activity as keyof typeof EMISSION_FACTORS.food] || 0;
    }

    return Number((entry.value * factor).toFixed(2));
}

export function calculateMonthlyTotal(entries: EmissionEntry[]): number {
    return entries.reduce((sum, entry) => sum + entry.co2e, 0);
}

export function getReductionTips(total: number): string[] {
    if (total > 1000) return ["Сократите перелёты", "Перейдите на электромобиль", "Уменьшите потребление красного мяса"];
    if (total > 500) return ["Больше общественного транспорта", "Энергоэффективность дома"];
    return ["Отличный результат! Продолжайте в том же духе"];
}