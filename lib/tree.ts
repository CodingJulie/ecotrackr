import type { SupabaseClient } from '@supabase/supabase-js';
import {
  monthKey,
  parseEntryDate,
  type Co2Entry,
} from '@/lib/utils';

export const KG_PER_TREE_LEVEL = 100;
export const MAX_TREE_LEVEL = 5;
export const DEFAULT_TREE_TYPE = 'oak';

export const TREE_TYPE_IDS = ['oak', 'pine', 'cherry', 'palm', 'maple'] as const;
export type TreeTypeId = (typeof TREE_TYPE_IDS)[number];

export type TreeCycleStatus = 'growing' | 'ready_to_plant';

export function isTreeType(value: unknown): value is TreeTypeId {
  return typeof value === 'string' && (TREE_TYPE_IDS as readonly string[]).includes(value);
}

export function resolveTreeType(value?: string | null): TreeTypeId {
  return isTreeType(value) ? value : DEFAULT_TREE_TYPE;
}

export const TREE_TYPE_VISUALS: Record<
  TreeTypeId,
  { icon: string; color: string; stages: string[] }
> = {
  oak: {
    icon: '🌳',
    color: 'from-emerald-700 to-emerald-500',
    stages: ['🌰', '🌱', '🌿', '🌳', '👑🌳'],
  },
  pine: {
    icon: '🎄',
    color: 'from-green-700 to-green-500',
    stages: ['🌰', '🌱', '🌲', '🎄', '🌟🎄'],
  },
  cherry: {
    icon: '🌸',
    color: 'from-pink-600 to-pink-400',
    stages: ['🍒', '🌱', '🌿', '🌸', '✨🌸'],
  },
  palm: {
    icon: '🌴',
    color: 'from-yellow-700 to-yellow-500',
    stages: ['🥥', '🌱', '🌿', '🌴', '🌟🌴'],
  },
  maple: {
    icon: '🍁',
    color: 'from-orange-700 to-orange-500',
    stages: ['🍂', '🌱', '🌿', '🍁', '✨🍁'],
  },
};

export function getTreeStageIcon(
  treeType?: string | null,
  treeLevel?: number | null
): string {
  const type = resolveTreeType(treeType);
  const stage = Math.min(Math.max(Number(treeLevel) || 1, 1) - 1, 4);
  return TREE_TYPE_VISUALS[type].stages[stage];
}

export interface TreeState {
  tree_type: TreeTypeId;
  /** Cycle level (1–5) for the current growing tree. */
  tree_level: number;
  /** Lifetime CO₂ saved across all cycles. */
  total_co2_saved: number;
  /** CO₂ saved within the current cycle (after baseline). */
  cycle_co2_saved: number;
  current_progress: number;
  matured_at: string | null;
  cycle_baseline_co2: number;
  trees_completed: number;
  status: TreeCycleStatus;
}

export interface UserTreeRowExisting {
  tree_type?: string | null;
  tree_level?: number | null;
  total_co2_saved?: number | null;
  matured_at?: string | null;
  cycle_baseline_co2?: number | null;
  trees_completed?: number | null;
}

/**
 * Computes lifetime tree growth from month-over-month CO₂e reductions.
 * Gaps between the first entry and the current month count as 0 kg —
 * a pause in emissions counts as "savings" and advances the level.
 */
export function computeTreeState(
  entries: Co2Entry[],
  now: Date = new Date()
): Pick<TreeState, 'tree_level' | 'total_co2_saved' | 'current_progress'> {
  const monthTotals = new Map<string, number>();

  for (const entry of entries) {
    if (!entry.date) continue;
    const key = monthKey(parseEntryDate(entry.date));
    monthTotals.set(key, (monthTotals.get(key) || 0) + (entry.co2e || 0));
  }

  if (monthTotals.size === 0) {
    return { tree_level: 1, total_co2_saved: 0, current_progress: 0 };
  }

  const firstKey = [...monthTotals.keys()].sort()[0];
  const [startYear, startMonth] = firstKey.split('-').map(Number);
  const cursor = new Date(startYear, startMonth - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 1);

  let saved = 0;
  let previous: number | null = null;

  while (cursor <= end) {
    const total = monthTotals.get(monthKey(cursor)) || 0;
    if (previous !== null && previous > total) {
      saved += previous - total;
    }
    previous = total;
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const roundedSaved = Math.round(saved * 10) / 10;
  return levelFromSaved(roundedSaved);
}

export function levelFromSaved(
  saved: number
): Pick<TreeState, 'tree_level' | 'total_co2_saved' | 'current_progress'> {
  const roundedSaved = Math.round(saved * 10) / 10;
  const tree_level = Math.min(
    MAX_TREE_LEVEL,
    Math.floor(roundedSaved / KG_PER_TREE_LEVEL) + 1
  );
  const current_progress =
    tree_level >= MAX_TREE_LEVEL
      ? 100
      : ((roundedSaved % KG_PER_TREE_LEVEL) / KG_PER_TREE_LEVEL) * 100;

  return {
    tree_level,
    total_co2_saved: roundedSaved,
    current_progress,
  };
}

/** Cycle progress = lifetime saved minus baseline at plant time. */
export function computeCycleTreeState(
  lifetimeSaved: number,
  baseline: number
): Pick<TreeState, 'tree_level' | 'cycle_co2_saved' | 'current_progress'> {
  const cycleSaved = Math.max(0, Math.round((lifetimeSaved - baseline) * 10) / 10);
  const { tree_level, current_progress } = levelFromSaved(cycleSaved);
  return {
    tree_level,
    cycle_co2_saved: cycleSaved,
    current_progress,
  };
}

export function kgToNextLevel(cycleCo2Saved: number): number {
  if (cycleCo2Saved >= (MAX_TREE_LEVEL - 1) * KG_PER_TREE_LEVEL) {
    return 0;
  }
  const intoLevel = cycleCo2Saved % KG_PER_TREE_LEVEL;
  return Math.max(0, Math.round((KG_PER_TREE_LEVEL - intoLevel) * 10) / 10);
}

export function deriveTreeStatus(treeLevel: number): TreeCycleStatus {
  return treeLevel >= MAX_TREE_LEVEL ? 'ready_to_plant' : 'growing';
}

function buildTreeState(
  treeType: TreeTypeId,
  lifetime: Pick<TreeState, 'total_co2_saved'>,
  cycle: Pick<TreeState, 'tree_level' | 'cycle_co2_saved' | 'current_progress'>,
  maturedAt: string | null,
  baseline: number,
  treesCompleted: number
): TreeState {
  return {
    tree_type: treeType,
    tree_level: cycle.tree_level,
    total_co2_saved: lifetime.total_co2_saved,
    cycle_co2_saved: cycle.cycle_co2_saved,
    current_progress: cycle.current_progress,
    matured_at: maturedAt,
    cycle_baseline_co2: baseline,
    trees_completed: treesCompleted,
    status: deriveTreeStatus(cycle.tree_level),
  };
}

/**
 * Recomputes the tree from entries and persists to `user_trees`.
 * On write failure, still returns the computed state for the UI.
 */
export async function syncUserTree(
  client: SupabaseClient,
  userId: string,
  entries: Co2Entry[],
  existing?: UserTreeRowExisting | null,
  now: Date = new Date()
): Promise<TreeState> {
  const lifetime = computeTreeState(entries, now);
  const tree_type = resolveTreeType(existing?.tree_type);
  const baseline = Number(existing?.cycle_baseline_co2 ?? 0);
  const treesCompleted = Number(existing?.trees_completed ?? 0);
  const cycle = computeCycleTreeState(lifetime.total_co2_saved, baseline);

  let maturedAt = existing?.matured_at ?? null;
  if (cycle.tree_level >= MAX_TREE_LEVEL && !maturedAt) {
    maturedAt = now.toISOString();
  }

  const next = buildTreeState(
    tree_type,
    lifetime,
    cycle,
    maturedAt,
    baseline,
    treesCompleted
  );

  const existingTypeMissing = Boolean(existing) && !isTreeType(existing?.tree_type);
  const maturedChanged = (existing?.matured_at ?? null) !== next.matured_at;

  try {
    if (!existing) {
      const { error } = await client.from('user_trees').upsert(
        {
          user_id: userId,
          tree_type: next.tree_type,
          tree_level: next.tree_level,
          total_co2_saved: next.total_co2_saved,
          matured_at: next.matured_at,
          cycle_baseline_co2: next.cycle_baseline_co2,
          trees_completed: next.trees_completed,
        },
        { onConflict: 'user_id' }
      );
      if (error) console.error('Failed to create user tree:', error.message);
    } else if (
      existingTypeMissing ||
      maturedChanged ||
      Number(existing.tree_level ?? 1) !== next.tree_level ||
      Number(existing.total_co2_saved ?? 0) !== next.total_co2_saved
    ) {
      const { error } = await client
        .from('user_trees')
        .update({
          tree_type: next.tree_type,
          tree_level: next.tree_level,
          total_co2_saved: next.total_co2_saved,
          matured_at: next.matured_at,
          cycle_baseline_co2: next.cycle_baseline_co2,
          trees_completed: next.trees_completed,
        })
        .eq('user_id', userId);
      if (error) console.error('Failed to update user tree:', error.message);
    }
  } catch (err) {
    console.error('Failed to sync user tree:', err);
  }

  return next;
}

/**
 * Plants a new tree: increments completed count and resets the cycle.
 */
export async function plantNewTree(
  client: SupabaseClient,
  userId: string,
  entries: Co2Entry[],
  existing?: UserTreeRowExisting | null,
  now: Date = new Date()
): Promise<{ tree: TreeState | null; error: string | null }> {
  const lifetime = computeTreeState(entries, now);
  const baseline = Number(existing?.cycle_baseline_co2 ?? 0);
  const cycle = computeCycleTreeState(lifetime.total_co2_saved, baseline);

  if (deriveTreeStatus(cycle.tree_level) !== 'ready_to_plant') {
    return { tree: null, error: 'not_ready_to_plant' };
  }

  const tree_type = resolveTreeType(existing?.tree_type);
  const treesCompleted = Number(existing?.trees_completed ?? 0) + 1;
  const newBaseline = lifetime.total_co2_saved;
  const newCycle = computeCycleTreeState(lifetime.total_co2_saved, newBaseline);

  const next = buildTreeState(
    tree_type,
    lifetime,
    newCycle,
    null,
    newBaseline,
    treesCompleted
  );

  try {
    const { error } = await client
      .from('user_trees')
      .update({
        tree_level: next.tree_level,
        total_co2_saved: next.total_co2_saved,
        matured_at: null,
        cycle_baseline_co2: next.cycle_baseline_co2,
        trees_completed: next.trees_completed,
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to plant new tree:', error.message);
      return { tree: null, error: error.message };
    }

    return { tree: next, error: null };
  } catch (err) {
    console.error('Failed to plant new tree:', err);
    return {
      tree: null,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

export async function updateUserTreeType(
  client: SupabaseClient,
  userId: string,
  treeType: TreeTypeId
): Promise<{ error: string | null }> {
  try {
    const { data, error } = await client
      .from('user_trees')
      .update({ tree_type: treeType })
      .eq('user_id', userId)
      .select('user_id')
      .maybeSingle();

    if (error) {
      console.error('Failed to update tree type:', error.message);
      return { error: error.message };
    }

    if (data) return { error: null };

    const { error: insertError } = await client.from('user_trees').upsert(
      {
        user_id: userId,
        tree_type: treeType,
        tree_level: 1,
        total_co2_saved: 0,
        cycle_baseline_co2: 0,
        trees_completed: 0,
        matured_at: null,
      },
      { onConflict: 'user_id' }
    );

    if (insertError) {
      console.error('Failed to create user tree with type:', insertError.message);
      return { error: insertError.message };
    }

    return { error: null };
  } catch (err) {
    console.error('Failed to update tree type:', err);
    return { error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
