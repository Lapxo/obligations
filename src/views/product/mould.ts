import { meetAt } from '../../field/encounter.ts';
import type { Interval } from '../../lattice/forms.ts';
import type { Point } from '../../field/field.ts';

export type Lock = ReadonlyMap<string, Interval>;

const at = (cell: Point): string => cell.at.join('/');
const holds = (bound: Interval, held: Interval): boolean =>
  held.hi >= held.lo && held.lo >= bound.lo - 1e-12 && held.hi <= bound.hi + 1e-12;

/**
 * A lock stretched: every ceiling widened about its middle by the same factor, so what it holds is asked again at a
 * looser shape. What stays red however far it is stretched was never the ceiling's doing; what goes green at the first
 * turn was the ceiling and not the world.
 */
export function stretch(lock: Lock, k: number): Lock {
  const out = new Map<string, Interval>();
  for (const [place, bound] of lock) {
    const middle = (bound.lo + bound.hi) / 2;
    const half = ((bound.hi - bound.lo) / 2) * k;
    out.set(place, { lo: middle - half, hi: middle + half });
  }
  return out;
}

export function red(world: readonly Point[], lock: Lock): readonly string[] {
  return world.filter((cell) => {
    const bound = lock.get(at(cell));
    return bound !== undefined && !holds(bound, meetAt(cell));
  }).map(at);
}

/** What another world fills of a lock: the places it bounds that the world reaches, of all the places it bounds. */
export function pour(world: readonly Point[], lock: Lock): { readonly filled: number; readonly of: number } {
  const reached = new Set(world.map(at));
  return { filled: [...lock.keys()].filter((place) => reached.has(place)).length, of: lock.size };
}

/**
 * A lock under use: a ceiling the world touched closes toward what was seen there, and one nothing touched opens by
 * the same share. A lock deforms toward the shape the world gives it, and what no world gives it, it lets go of.
 */
export function tense(lock: Lock, world: readonly Point[], rate: number): Lock {
  const seen = new Map<string, Interval>();
  for (const cell of world) seen.set(at(cell), meetAt(cell));
  const out = new Map<string, Interval>();
  for (const [place, bound] of lock) {
    const held = seen.get(place);
    if (held === undefined || held.hi < held.lo) {
      const half = ((bound.hi - bound.lo) / 2) * (1 + rate);
      const middle = (bound.lo + bound.hi) / 2;
      out.set(place, { lo: middle - half, hi: middle + half });
      continue;
    }
    out.set(place, { lo: bound.lo + (held.lo - bound.lo) * rate, hi: bound.hi - (bound.hi - held.hi) * rate });
  }
  return out;
}

export function tighter(before: Lock, after: Lock): { readonly tightened: number; readonly loosened: number } {
  let tightened = 0;
  let loosened = 0;
  for (const [place, bound] of before) {
    const now = after.get(place);
    if (now === undefined) continue;
    const was = bound.hi - bound.lo;
    const is = now.hi - now.lo;
    if (is < was - 1e-12) tightened += 1;
    if (is > was + 1e-12) loosened += 1;
  }
  return { tightened, loosened };
}
