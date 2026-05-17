export interface CommunityForestStats {
  total_trees: number;
  total_co2_saved: number;
}

export interface UserTreeRow {
  user_id: string;
  tree_type?: string | null;
  tree_level?: number | null;
  total_co2_saved?: number | null;
  trees_completed?: number | null;
}

export interface ForestLeader extends UserTreeRow {
  user_name: string;
}

export interface CompletedTreeSlot {
  id: string;
  user_id: string;
  tree_type?: string | null;
}

/**
 * Fully planted trees only (`trees_completed`).
 * CO₂ is the sum of lifetime saved amounts.
 */
export function aggregateCommunityForest(
  trees: Pick<UserTreeRow, 'total_co2_saved' | 'trees_completed'>[]
): CommunityForestStats {
  return {
    total_trees: trees.reduce(
      (sum, tree) => sum + Number(tree.trees_completed || 0),
      0
    ),
    total_co2_saved: trees.reduce(
      (sum, tree) => sum + Number(tree.total_co2_saved || 0),
      0
    ),
  };
}

/** Users ranked by fully planted trees, then lifetime CO₂ saved. */
export function getForestLeaders(trees: UserTreeRow[], limit = 5): UserTreeRow[] {
  return [...trees]
    .filter((tree) => Number(tree.trees_completed || 0) > 0)
    .sort((a, b) => {
      const completedDiff =
        Number(b.trees_completed || 0) - Number(a.trees_completed || 0);
      if (completedDiff !== 0) return completedDiff;
      return Number(b.total_co2_saved || 0) - Number(a.total_co2_saved || 0);
    })
    .slice(0, limit);
}

/** One mature slot per completed tree, for the decorative forest strip. */
export function expandCompletedTreesForDisplay(
  trees: UserTreeRow[],
  maxVisible: number
): CompletedTreeSlot[] {
  const sorted = [...trees]
    .filter((tree) => Number(tree.trees_completed || 0) > 0)
    .sort(
      (a, b) => Number(b.trees_completed || 0) - Number(a.trees_completed || 0)
    );

  const slots: CompletedTreeSlot[] = [];
  for (const tree of sorted) {
    const count = Number(tree.trees_completed || 0);
    for (let index = 0; index < count && slots.length < maxVisible; index++) {
      slots.push({
        id: `${tree.user_id}-${index}`,
        user_id: tree.user_id,
        tree_type: tree.tree_type,
      });
    }
    if (slots.length >= maxVisible) break;
  }
  return slots;
}

/** Deterministic decorative tree height (no Math.random). */
export function decorativeTreeHeight(index: number): number {
  return 30 + ((index * 37) % 60);
}
