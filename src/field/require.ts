import { cell, mark } from '../lattice/obligatory.ts';
import type { Lattice } from '../lattice/lattice.ts';
import type { World } from '../lattice/obligatory.ts';
import type { Line } from './sign.ts';

/**
 * Require, the floor's act that travels: one line at the bound that raises the floor of every cell resting on it, as a
 * signature lowers their ceiling. Both are meets, so they commute in any order, and both close freedom where they reach.
 */
export function require<T>(L: Lattice<T>, world: World<T>, name: string, span: T, line: Line = {}): World<T> {
  const held = world.get(name) ?? cell<T>(name);
  return new Map([...world, [name, { ...held, marks: [...(held.marks ?? []), mark({ pole: 'floor', reach: 'travels', span: L.meet(L.top, span), ...line })] }]]);
}
