import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import React from 'react';

// ✅ Мокаем framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => React.createElement('div', props, children),
  },
}));

// ✅ Мокаем lucide-react
vi.mock('lucide-react', () => ({
  Leaf: () => React.createElement('div', null, 'Leaf'),
  TrendingDown: () => React.createElement('div', null, 'TrendingDown'),
}));

// ✅ Мокаем react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'ru',
    },
  }),
}));

// ✅ ТОЛЬКО ОДИН импорт - после всех моков
import FootprintCard from './FootprintCard';

describe('FootprintCard', () => {
  it('отображает общий углеродный след', () => {
    render(<FootprintCard totalCO2={250} period="За месяц" />);
    expect(screen.getByText('250')).toBeInTheDocument();
    expect(screen.getByText('kg_co2e')).toBeInTheDocument();
    expect(screen.getByText('За месяц')).toBeInTheDocument();
    expect(screen.getByText('good_result')).toBeInTheDocument();
  });

  it('отображает "хороший" результат при totalCO2 < 400', () => {
    render(<FootprintCard totalCO2={350} period="Неделя" />);
    expect(screen.getByText('good_result')).toBeInTheDocument();
  });

  it('отображает "есть куда расти" при totalCO2 >= 400', () => {
    render(<FootprintCard totalCO2={500} period="Месяц" />);
    expect(screen.getByText('room_for_improvement')).toBeInTheDocument();
  });

  it('отображает сравнение с прошлым месяцем (отрицательное)', () => {
    render(<FootprintCard totalCO2={300} period="Месяц" comparison={-10} />);

    expect(screen.getByText((content) => content.includes('-10%'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('from_last_month'))).toBeInTheDocument();

    const trendElement = screen.getByText((content) => content.includes('-10%')).closest('div');
    expect(trendElement).toHaveClass('text-emerald-600');
  });

  it('отображает сравнение с прошлым месяцем (положительное)', () => {
    render(<FootprintCard totalCO2={300} period="Месяц" comparison={5} />);

    expect(screen.getByText((content) => content.includes('+5%'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('from_last_month'))).toBeInTheDocument();

    const trendElement = screen.getByText((content) => content.includes('+5%')).closest('div');
    expect(trendElement).toHaveClass('text-amber-600');
  });
});