import { parts } from '../lattice/obligatory.ts';
import type { Lattice } from '../lattice/lattice.ts';
import type { Obligatory, World } from '../lattice/obligatory.ts';

/**
 * Meet, the ceiling's act on one cell: what its floor, its ceiling and its live claims hold together in the lattice it
 * is given. It narrows and never travels; the order the lines arrived in never shows, except where a witnessed join
 * widened the ceiling between two signatures.
 */
export function meet<T>(L: Lattice<T>, c: Obligatory<T>, world: World<T> = new Map()): T {
  const { floor, ceiling } = parts(L, c, world);
  return L.meet(floor, ceiling);
}
