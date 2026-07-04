import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Объединяет классы CSS с помощью tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Форматирует дату в зависимости от локали
 * @param date - объект Date
 * @param locale - строка локали ('ru' или 'en')
 * @returns строка с отформатированной датой (дд.мм.гггг или мм/дд/гггг)
 */
export function formatDate(date: Date, locale: string = 'ru'): string {
  return date.toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Вычисляет выбросы CO₂ по коэффициенту и значению
 * @param factor - коэффициент выбросов (кг CO₂ на единицу)
 * @param value - количество единиц
 * @returns число с округлением до 2 знаков
 */
export function calculateCO2(factor: number, value: number): number {
  return Number((factor * value).toFixed(2));
}

/**
 * Группирует записи по категории и суммирует CO₂
 * @param entries - массив объектов с полями category и co2e
 * @returns объект, где ключи – категории, значения – сумма CO₂
 */
export function groupByCategory(
    entries: { category: string; co2e: number }[]
): Record<string, number> {
  return entries.reduce((acc, entry) => {
    acc[entry.category] = (acc[entry.category] || 0) + entry.co2e;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Возвращает коэффициент выбросов для активности в категории
 * @param category - категория (transport, food, energy, shopping, home, lifestyle)
 * @param activity - активность (car_petrol, beef, electricity и т.д.)
 * @returns коэффициент или 0, если не найден
 */
export function getEmissionFactor(category: string, activity: string): number {
  const factors: Record<string, Record<string, number>> = {
    transport: {
      car_petrol: 0.192,
      car_diesel: 0.168,
      car_hybrid: 0.11,
      car_electric: 0.05,
      plane_short: 0.255,
      plane_long: 0.185,
      train: 0.041,
      bus: 0.089,
      metro: 0.033,
      bicycle: 0,
      walking: 0,
    },
    food: {
      beef: 99.5,
      lamb: 39.2,
      pork: 12.1,
      chicken: 14.0,
      fish: 8.5,
      cheese: 23.9,
      eggs: 0.8,
      milk: 3.15,
      vegetables: 2.5,
      fruits: 1.8,
      grains: 2.0,
      coffee: 15.3,
    },
    energy: {
      electricity: 0.475,
      gas: 0.202,
      heating_oil: 0.267,
      coal: 2.42,
      solar: 0.05,
    },
    shopping: {
      clothes: 15,
      shoes: 30,
      electronics_small: 80,
      electronics_large: 300,
      furniture: 150,
      plastic: 3.5,
      paper: 1.8,
    },
    home: {
      water: 0.15,
      waste: 0.58,
      recycling: -0.3,
      heating: 0.275,
      air_conditioning: 0.42,
    },
    lifestyle: {
      streaming: 0.05,
      online_shopping: 2.5,
      restaurant: 3.2,
      hotel: 31.5,
    },
  };

  return factors[category]?.[activity] ?? 0;
}