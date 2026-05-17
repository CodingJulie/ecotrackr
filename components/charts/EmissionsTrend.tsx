// components/charts/EmissionsTrend.tsx
'use client';

import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const data = {
    labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'],
    datasets: [
        {
            label: 'Ваш след CO₂e',
            data: [320, 285, 310, 240, 198, 184],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            borderWidth: 4,
            tension: 0.4,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: '#fff',
            pointBorderWidth: 3,
        },
    ],
};

const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 1800, easing: 'easeOutQuart' as const },
    plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: '#1f2937', titleColor: '#fff', bodyColor: '#ddd' },
    },
    scales: {
        y: {
            beginAtZero: true,
            grid: { color: '#e5e7eb' },
            ticks: { color: '#666' }
        },
        x: {
            grid: { color: '#e5e7eb' },
            ticks: { color: '#666' }
        },
    },
};

export default function EmissionsTrend() {
    return (
        <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <CardHeader>
                <CardTitle>Динамика вашего углеродного следа</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[380px]">
                    <Line data={data} options={options} />
                </div>
            </CardContent>
        </Card>
    );
}