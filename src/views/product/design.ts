import { neighbours } from './reach.ts';
import { cell } from '../../lattice/obligatory.ts';
import type { Obligatory } from '../../lattice/obligatory.ts';

type Band = { readonly lo: number; readonly hi: number };

const at = (one: Obligatory<Band>): string => one.at.join('/');
const BAND = { lo: 0, hi: 100 };

function components(world: readonly Obligatory<Band>[], bounds: readonly string[] = []): readonly (readonly string[])[] {
  const graph = neighbours(world, bounds);
  const seen = new Set<string>();
  const out: string[][] = [];
  for (const one of world.map(at)) {
    if (seen.has(one)) continue;
    const edge = [one];
    const held: string[] = [];
    seen.add(one);
    while (edge.length) {
      const here = edge.pop()!;
      held.push(here);
      for (const there of graph.get(here) ?? []) if (!seen.has(there)) { seen.add(there); edge.push(there); }
    }
    out.push(held);
  }
  return out;
}

/** How much of a field is out of reach of the rest: the pairs of cells no walk of shared lookings joins. */
export function horizonTotal(world: readonly Obligatory<Band>[], bounds: readonly string[] = []): number {
  const sizes = components(world, bounds).map((part) => part.length);
  const all = sizes.reduce((sum, n) => sum + n, 0);
  return sizes.reduce((sum, n) => sum + n * (all - n), 0) / 2;
}

/**
 * Where to look next, for a budget of origins: each one joins the largest island to the next largest, because what an
 * origin is worth is the pairs it opens and that is the product of the two sides it bridges. The field a design is
 * read from is the field as it stands, so the answer is a question about this world and not a rule about worlds.
 */
export function design(world: readonly Obligatory<Band>[], budget: number, bounds: readonly string[] = []): readonly (readonly [string, string])[] {
  const parts = [...components(world, bounds)].sort((a, b) => b.length - a.length);
  const out: (readonly [string, string])[] = [];
  for (let k = 0; k < budget && k + 1 < parts.length; k += 1) out.push([parts[0]![0]!, parts[k + 1]![0]!]);
  return out;
}

const landed = (world: readonly Obligatory<Band>[], sites: readonly (readonly [string, string])[], epoch: number): readonly Obligatory<Band>[] => {
  const named = new Map<string, string[]>();
  for (const [k, [a, b]] of sites.entries()) {
    const name = `d${epoch}-${k}`;
    named.set(a, [...(named.get(a) ?? []), name]);
    named.set(b, [...(named.get(b) ?? []), name]);
  }
  return world.map((one) => {
    const mine = named.get(at(one));
    return mine === undefined ? one : { ...one, epoch, seen: [...one.seen, ...mine.map((origin) => ({ id: `${origin}-${at(one)}`, origin, at: epoch, span: BAND }))] };
  });
};

/** A field woven on purpose: each epoch spends its budget where reach is greatest, and the horizon is read after. */
export function loom(world: readonly Obligatory<Band>[], epochs: number, budget: number, bounds: readonly string[] = []): readonly number[] {
  let held = world;
  const out: number[] = [horizonTotal(held, bounds)];
  for (let epoch = 1; epoch <= epochs; epoch += 1) {
    held = landed(held, design(held, budget, bounds), epoch);
    out.push(horizonTotal(held, bounds));
  }
  return out;
}

export const apart = (world: readonly Obligatory<Band>[], a: string, b: string, bounds: readonly string[] = []): boolean =>
  !components(world, bounds).some((part) => part.includes(a) && part.includes(b));

export function rank(world: readonly Obligatory<Band>[], bound: string): number {
  return world.filter((one) => one.seen.some((claim) => claim.origin === bound)).length;
}

export const sited = (world: readonly Obligatory<Band>[], sites: readonly (readonly [string, string])[], epoch = 1): readonly Obligatory<Band>[] =>
  landed(world, sites, epoch);

export const lone = (name: string, epoch = 0): Obligatory<Band> => cell(name, epoch, [{ id: `own-${name}`, origin: `own-${name}`, at: epoch, span: BAND }]);
