import { cell, live, mark, restOf } from '../lattice/obligatory.ts';
import type { Lattice } from '../lattice/lattice.ts';
import type { World } from '../lattice/obligatory.ts';

export interface Line {
  readonly id?: string;
  readonly at?: number;
  readonly takes?: string;
}

/**
 * Sign, the ceiling's act that travels: one line at the bound, never a value copied into the cells that rest on it.
 * Each of them reads it up its chain of rest, so signing costs one line and reading costs the depth of rest; a
 * signature the bound already holds tighter is absorbed and stays live, and taking the tighter back reveals it.
 */
export function sign<T>(L: Lattice<T>, world: World<T>, name: string, span: T, line: Line = {}): World<T> {
  const held = world.get(name) ?? cell<T>(name);
  return new Map([...world, [name, { ...held, marks: [...(held.marks ?? []), mark({ pole: 'ceiling', reach: 'travels', span: L.meet(L.top, span), ...line })] }]]);
}

export function restingOn<T>(world: World<T>): ReadonlyMap<string, readonly string[]> {
  const out = new Map<string, string[]>();
  for (const [name, one] of world) for (const bound of one.restsOn) out.set(bound, [...(out.get(bound) ?? []), name]);
  return out;
}

/**
 * What a signature bites, found the way a propagation would find it: down from the bound, cell by cell, stopping at any
 * cell whose travelling ceiling already lies within the new one, since everything resting there reads one at least as
 * tight. The visits are the cost, and a signature the bound itself absorbs visits one cell and bites none.
 */
export function bites<T>(L: Lattice<T>, world: World<T>, resting: ReadonlyMap<string, readonly string[]>, name: string, span: T): { readonly cells: readonly string[]; readonly visits: number } {
  const own = (at: string): T => live(world.get(at)?.marks ?? []).filter((one) => one.pole === 'ceiling' && one.reach === 'travels' && one.widens === undefined)
    .reduce((held, one) => L.meet(held, one.span), L.top);
  const above = (at: string): T => restOf(world.get(at) ?? cell<T>(at), world).reduce((held, up) => L.meet(held, own(up)), own(at));
  const bitten: string[] = [];
  const edge: (readonly [string, T])[] = [[name, above(name)]];
  const held = new Set([name]);
  for (let i = 0; i < edge.length; i += 1) {
    const [here, was] = edge[i]!;
    if (L.leq(was, span)) continue;
    bitten.push(here);
    for (const next of resting.get(here) ?? []) {
      if (held.has(next)) continue;
      held.add(next);
      const one = world.get(next);
      edge.push([next, one !== undefined && one.restsOn.length === 1 ? L.meet(was, own(next)) : above(next)]);
    }
  }
  return { cells: bitten, visits: edge.length };
}
