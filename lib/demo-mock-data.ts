import type { DashboardData, DashboardEntry, DashboardMapPoint } from '@/hooks/useDashboardData';
import type { TreeState } from '@/lib/tree';

export const DEMO_USER_ID = '00000000-0000-4000-8000-000000000001';

/** Fixed anchor so SSR and client render identical demo dates. */
const DEMO_ANCHOR = new Date('2026-08-01T12:00:00.000Z');

function daysAgo(n: number): string {
    const d = new Date(DEMO_ANCHOR);
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
}

export function createDemoEntries(): DashboardEntry[] {
    return [
        { id: 'demo-1', category: 'transport', activity: 'car_petrol', value: 10, co2e: 1.8, date: daysAgo(1) },
        { id: 'demo-2', category: 'energy', activity: 'electricity', value: 88.4, co2e: 155.0, date: daysAgo(2) },
        { id: 'demo-3', category: 'food', activity: 'beef', value: 0.4, co2e: 10.8, date: daysAgo(4) },
        { id: 'demo-4', category: 'home', activity: 'heating_gas', value: 20, co2e: 4.2, date: daysAgo(6) },
        { id: 'demo-5', category: 'transport', activity: 'bus', value: 15, co2e: 1.4, date: daysAgo(8) },
        { id: 'demo-6', category: 'food', activity: 'vegetarian_meal', value: 1, co2e: 1.2, date: daysAgo(10) },
        { id: 'demo-7', category: 'shopping', activity: 'clothing', value: 2, co2e: 16, date: daysAgo(12) },
        { id: 'demo-8', category: 'transport', activity: 'train', value: 120, co2e: 4.8, date: daysAgo(15) },
        { id: 'demo-9', category: 'energy', activity: 'electricity', value: 45, co2e: 78.9, date: daysAgo(18) },
        { id: 'demo-10', category: 'food', activity: 'coffee', value: 3, co2e: 0.9, date: daysAgo(21) },
        { id: 'demo-11', category: 'transport', activity: 'car_petrol', value: 25, co2e: 4.8, date: daysAgo(25) },
        { id: 'demo-12', category: 'energy', activity: 'electricity', value: 60, co2e: 105.2, date: daysAgo(30) },
        { id: 'demo-13', category: 'food', activity: 'chicken', value: 0.5, co2e: 3.1, date: daysAgo(35) },
        { id: 'demo-14', category: 'home', activity: 'water', value: 5, co2e: 0.3, date: daysAgo(40) },
        { id: 'demo-15', category: 'transport', activity: 'metro', value: 8, co2e: 0.4, date: daysAgo(45) },
        { id: 'demo-16', category: 'shopping', activity: 'electronics', value: 1, co2e: 45, date: daysAgo(50) },
        { id: 'demo-17', category: 'energy', activity: 'electricity', value: 70, co2e: 122.7, date: daysAgo(60) },
        { id: 'demo-18', category: 'transport', activity: 'car_petrol', value: 40, co2e: 7.7, date: daysAgo(70) },
        { id: 'demo-19', category: 'food', activity: 'dairy', value: 0.6, co2e: 2.4, date: daysAgo(80) },
        { id: 'demo-20', category: 'transport', activity: 'flight_short', value: 800, co2e: 184, date: daysAgo(90) },
        { id: 'demo-21', category: 'energy', activity: 'electricity', value: 55, co2e: 96.4, date: daysAgo(100) },
    ];
}

const mapPoints: DashboardMapPoint[] = [
    { id: 'm1', user_id: DEMO_USER_ID, lat: 55.7558, lng: 37.6173, name: 'Moscow', co2_estimate: 12 },
    { id: 'm2', user_id: DEMO_USER_ID, lat: 59.9343, lng: 30.3351, name: 'Saint Petersburg', co2_estimate: 8 },
    { id: 'm3', user_id: DEMO_USER_ID, lat: 56.8389, lng: 60.6057, name: 'Yekaterinburg', co2_estimate: 5 },
    { id: 'm4', user_id: DEMO_USER_ID, lat: 54.9885, lng: 73.3242, name: 'Omsk', co2_estimate: 4 },
    { id: 'm5', user_id: DEMO_USER_ID, lat: 53.1959, lng: 50.1002, name: 'Samara', co2_estimate: 6 },
];

const tree: TreeState = {
    tree_type: 'oak',
    tree_level: 2,
    total_co2_saved: 115,
    cycle_co2_saved: 42,
    current_progress: 82,
    matured_at: null,
    cycle_baseline_co2: 0,
    trees_completed: 1,
    status: 'growing',
};

export function buildDemoDashboardData(entries: DashboardEntry[]): DashboardData {
    return {
        entries,
        mapPoints,
        user: {
            id: DEMO_USER_ID,
            app_metadata: {},
            user_metadata: { name: 'EcoTrackr Demo' },
            aud: 'authenticated',
            created_at: daysAgo(365),
        } as DashboardData['user'],
        profile: { name: 'EcoTrackr Demo', avatar_url: null },
        tree,
    };
}

export const initialDemoDashboardData = buildDemoDashboardData(createDemoEntries());
