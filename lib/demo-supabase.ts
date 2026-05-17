import type { DashboardEntry } from '@/hooks/useDashboardData';
import { DEMO_USER_ID, buildDemoDashboardData } from '@/lib/demo-mock-data';

function createFilterChain(rows: unknown[]) {
    let filtered = [...rows];

    const chain: Record<string, unknown> = {};
    chain.eq = (_col: string, val: unknown) => {
        filtered = filtered.filter((row) => {
            if (typeof row !== 'object' || row === null) return false;
            const record = row as Record<string, unknown>;
            if (_col === 'user_id' && record.user_id === undefined) return true;
            return record[_col] === val;
        });
        return chain;
    };
    chain.order = async (_col: string, opts?: { ascending?: boolean }) => {
        const sorted = [...filtered].sort((a, b) => {
            const av = String((a as Record<string, unknown>)?.[_col] ?? '');
            const bv = String((b as Record<string, unknown>)?.[_col] ?? '');
            return opts?.ascending === false ? bv.localeCompare(av) : av.localeCompare(bv);
        });
        return { data: sorted, error: null };
    };
    chain.select = () => chain;
    chain.insert = async (payload: unknown) => {
        const items = Array.isArray(payload) ? payload : [payload];
        const inserted = items.map((item, index) => {
            const record = (typeof item === 'object' && item !== null ? item : {}) as Record<string, unknown>;
            return {
                ...record,
                id: record.id ?? `demo-new-${Date.now()}-${index}`,
                user_id: DEMO_USER_ID,
            };
        });
        return { data: inserted, error: null };
    };
    chain.delete = () => ({
        eq: async (_col: string, val: unknown) => {
            const idsToRemove = filtered
                .filter((row) => {
                    if (_col !== 'id') return true;
                    return (row as Record<string, unknown>).id === val;
                })
                .map((row) => String((row as Record<string, unknown>).id));
            return { data: idsToRemove, error: null };
        },
    });
    chain.update = () => ({ eq: async () => ({ error: null }) });
    chain.upsert = async () => ({ error: null });
    chain.maybeSingle = async () => ({ data: filtered[0] ?? null, error: null });
    chain.single = async () => ({ data: filtered[0] ?? null, error: null });

    return chain;
}

interface DemoSupabaseOptions {
    onInsert?: (entries: DashboardEntry[]) => void;
    onDelete?: (id: string) => void;
}

export function createDemoSupabaseClient(
    getEntries: () => DashboardEntry[],
    options: DemoSupabaseOptions = {}
) {
    const demoUser = buildDemoDashboardData(getEntries()).user;

    const entriesChain = () => {
        const chain = createFilterChain(
            getEntries().map((entry) => ({ ...entry, user_id: DEMO_USER_ID }))
        );
        const originalInsert = chain.insert as (payload: unknown) => Promise<{ data: Record<string, unknown>[]; error: null }>;
        chain.insert = async (payload: unknown) => {
            const result = await originalInsert(payload);
            options.onInsert?.(result.data as unknown as DashboardEntry[]);
            return result;
        };
        const originalDeleteEq = (chain.delete as () => { eq: (col: string, val: unknown) => Promise<{ data: string[]; error: null }> })().eq;
        chain.delete = () => ({
            eq: async (col: string, val: unknown) => {
                const result = await originalDeleteEq(col, val);
                if (col === 'id' && typeof val === 'string') {
                    options.onDelete?.(val);
                }
                return result;
            },
        });
        return chain;
    };

    return {
        auth: {
            getUser: async () => ({ data: { user: demoUser }, error: null }),
            getSession: async () => ({
                data: { session: { user: demoUser } },
                error: null,
            }),
        },
        from: (table: string) => {
            const snapshot = buildDemoDashboardData(getEntries());

            if (table === 'footprint_entries') {
                return entriesChain();
            }
            if (table === 'profiles') {
                return createFilterChain(snapshot.profile ? [snapshot.profile] : []);
            }
            if (table === 'user_trees') {
                return createFilterChain([snapshot.tree]);
            }
            if (table === 'user_map_points') {
                return createFilterChain(snapshot.mapPoints);
            }
            return createFilterChain([]);
        },
        rpc: async () => ({ data: null, error: null }),
    };
}
