import { eq } from '../lattice/lattice.ts';
import type { Lattice } from '../lattice/lattice.ts';
import { live, parts } from '../lattice/obligatory.ts';
import type { Obligatory, World } from '../lattice/obligatory.ts';

/** The ways to take `size` names out of `names`, in the order the names come. */
function takes(names: readonly string[], size: number): readonly (readonly string[])[] {
  if (size === 0) return [[]];
  return names.flatMap((name, i) => takes(names.slice(i + 1), size - 1).map((rest) => [name, ...rest]));
}

/**
 * How fragile a cell is: the fewest origins whose withdrawal moves one of its poles. A pole one origin sets breaks with
 * that origin; a pole several origins set together holds until all of them withdraw; a cell whose poles no withdrawal
 * moves (its marks alone set them) is not fragile at all, and reads zero.
 */
export function fragility<T>(L: Lattice<T>, c: Obligatory<T>, world: World<T> = new Map()): number {
  const was = parts(L, c, world);
  const names = [...new Set(live(c.seen).map((claim) => claim.origin))];
  for (let size = 1; size <= names.length; size += 1) {
    for (const out of takes(names, size)) {
      const now = parts(L, { ...c, seen: c.seen.filter((claim) => !out.includes(claim.origin)) }, world);
      if (!eq(L, now.floor, was.floor) || !eq(L, now.ceiling, was.ceiling)) return size;
    }
  }
  return 0;
}
