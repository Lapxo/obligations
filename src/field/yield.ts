import { freedom } from '../debit/ideal.ts';
import type { Scale, Unit } from '../lattice/types.ts';

/** One act of an origin on one cell: what the cell permitted before it, and what it permits after. */
export interface Act {
  readonly by: string;
  readonly epoch: number;
  readonly before: Unit;
  readonly after: Unit;
}

export interface Yield {
  readonly by: string;
  readonly epoch: number;
  readonly closed: number;
  readonly reopened: number;
  readonly acts: number;
}

/**
 * The yield of an origin: the bits it closed minus the bits reopened against it, counted per act and gathered per
 * epoch. Closing is what an act takes out of a cell's debit; reopening is what it puts back. An origin that only
 * widens what it touched has a negative yield, and an origin that touched nothing has none.
 */
export function yieldOf(c: Scale, acts: readonly Act[]): readonly Yield[] {
  const by = new Map<string, { by: string; epoch: number; closed: number; reopened: number; acts: number }>();
  for (const act of acts) {
    const moved = freedom(c, act.before) - freedom(c, act.after);
    const key = `${act.by} ${act.epoch}`;
    const held = by.get(key) ?? { by: act.by, epoch: act.epoch, closed: 0, reopened: 0, acts: 0 };
    by.set(key, {
      ...held,
      closed: held.closed + Math.max(moved, 0),
      reopened: held.reopened + Math.max(-moved, 0),
      acts: held.acts + 1,
    });
  }
  return [...by.values()].sort((a, b) => (a.by === b.by ? a.epoch - b.epoch : a.by < b.by ? -1 : 1));
}
