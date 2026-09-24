import { WideMask } from '../debit/masks.ts';
import { entails, fuse, permitAll, state } from '../debit/unit.ts';
import type { Lattice } from './lattice.ts';
import type { Scale, Unit } from './types.ts';

/**
 * Bands on a scale form a lattice: the meet is where two bands agree, the join is the smallest band that holds both.
 * The bottom is the band no value can stand in; joining it changes nothing.
 */
export function fromScale(c: Scale): Lattice<Unit> {
  const inhabited = (x: Unit): boolean => state(c, x) !== 'CONFLICT';
  return {
    top: permitAll(c, ''),
    bottom: { subject: '', floor: c.levels[c.topIx] ?? '', ceiling: c.levels[c.bottomIx] ?? '' },
    leq: (a, b) => entails(c, a, b),
    meet: (a, b) => fuse(c, [a, b]),
    join: (a, b) => {
      if (!inhabited(a)) return b;
      if (!inhabited(b)) return a;
      return {
        subject: a.subject || b.subject,
        floor: c.levels[c.lower(c.rank(a.floor), c.rank(b.floor))] ?? a.floor,
        ceiling: c.levels[c.higher(c.rank(a.ceiling), c.rank(b.ceiling))] ?? a.ceiling,
      };
    },
    show: (x) => `[${x.floor}, ${x.ceiling}]`,
    inhabited,
  };
}

export function subsets(tokens: readonly string[]): Lattice<WideMask> {
  return {
    bottom: new WideMask(tokens.length),
    top: WideMask.filled(tokens.length),
    leq: (a, b) => a.subsetOf(b),
    meet: (a, b) => a.and(b),
    join: (a, b) => a.or(b),
    show: (x) => x.members(tokens).join(','),
    inhabited: (x) => x.size() > 0,
  };
}
