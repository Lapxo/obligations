import { sign } from '../field/sign.ts';
import { UnitError } from '../lattice/errors.ts';
import { cell, parts } from '../lattice/obligatory.ts';
import type { Interval } from '../lattice/forms.ts';
import type { Lattice } from '../lattice/lattice.ts';
import type { World } from '../lattice/obligatory.ts';

/**
 * The price of a claim and the one who pays it. A claim costs the bits it closes where it lands, and it is paid by its
 * origin: the observer is a cell like any other, its ceiling the looks it has left, and every act it takes is a meet
 * on that ceiling, one look narrower. An origin with no look left cannot act, and nothing else pays for it.
 */
export function price<T>(bits: (held: T) => number, before: T, after: T): number {
  return bits(before) - bits(after);
}

export function looksLeft(L: Lattice<Interval>, world: World<Interval>, origin: string): number {
  return parts(L, world.get(origin) ?? cell<Interval>(origin), world).ceiling.hi;
}

export function pay(L: Lattice<Interval>, world: World<Interval>, origin: string): World<Interval> {
  const held = parts(L, world.get(origin) ?? cell<Interval>(origin), world);
  if (held.ceiling.hi - 1 < held.floor.lo) throw new UnitError('attention-spent', `obligations: REFUSE·attention ${origin} has no look left: an act nobody pays for is not taken`);
  return sign(L, world, origin, { lo: L.top.lo, hi: held.ceiling.hi - 1 });
}
