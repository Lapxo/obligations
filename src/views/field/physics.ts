import { meet } from '../../lattice/obligatory.ts';
import type { Lattice } from '../../lattice/lattice.ts';
import { coherence } from './wave.ts';
import type { Claim, Obligatory } from '../../lattice/obligatory.ts';

type Band = { readonly lo: number; readonly hi: number };

/**
 * What one look costs and what it is worth. Observing narrows a cell and that narrowing is the disturbance: it is
 * never nothing, because an origin that changes no bound was not an observation. A region read at a resolution needs
 * origins enough for every cell of it to be met twice, since one origin is potential and two are information. And
 * two readings are one object when they fall in one bin: the coarser the reading, the fewer objects a field holds.
 */
export function disturbance(lattice: Lattice<Band>, one: Obligatory<Band>, claim: Claim<Band>): number {
  const was = meet(lattice, one);
  const now = meet(lattice, { ...one, seen: [...one.seen, claim] });
  const width = (span: Band): number => Math.max(0, span.hi - span.lo);
  return width(was) - width(now);
}

export function budget(cells: number, resolution: number): number {
  if (resolution <= 0) throw new Error('obligations: REFUSE·budget a region read at no resolution has no budget to take');
  return Math.ceil((2 * cells) / resolution);
}

export function sameObject(lattice: Lattice<Band>, a: Obligatory<Band>, b: Obligatory<Band>, width: number): boolean {
  const bin = (one: Obligatory<Band>): number => {
    const held = meet(lattice, one);
    return width <= 0 ? held.lo : Math.round(held.lo / width);
  };
  return bin(a) === bin(b);
}

export function distinct(lattice: Lattice<Band>, world: readonly Obligatory<Band>[], width: number): number {
  const seen = new Set<number>();
  for (const one of world) {
    const held = meet(lattice, one);
    seen.add(width <= 0 ? held.lo : Math.round(held.lo / width));
  }
  return seen.size;
}

/**
 * A field left to itself: every epoch its budget lands where origins already are, in proportion to what is there, and
 * nothing is spent on what nothing has reached. What it does to the horizon is the measurement, not the model.
 */
export function evolve(world: readonly Obligatory<Band>[], epochs: number, budget_: number, seed: number): readonly (readonly Obligatory<Band>[])[] {
  let held = seed;
  const next = (): number => { held = (held * 1103515245 + 12345) % 2147483648; return held / 2147483648; };
  const out: (readonly Obligatory<Band>[])[] = [];
  let now = world;
  for (let epoch = 1; epoch <= epochs; epoch += 1) {
    for (let k = 0; k < budget_; k += 1) {
      const weight = now.map((one) => 1 + 20 * one.seen.length);
      const total = weight.reduce((sum, w) => sum + w, 0);
      const where = (): number => {
        let pick = next() * total;
        let at = 0;
        while (pick > weight[at]! && at < now.length - 1) { pick -= weight[at]!; at += 1; }
        return at;
      };
      const i = where();
      let j = where();
      if (j === i) j = (j + 1) % now.length;
      const name = `e${epoch}-${k}`;
      now = now.map((one, at) => (at === i || at === j ? { ...one, epoch, seen: [...one.seen, { id: `${name}-${at}`, origin: name, at: epoch, span: { lo: 0, hi: 100 } }] } : one));
    }
    out.push(now);
  }
  return out;
}

/** What an environment out of phase does to a cell that was in phase: the coherence it is left with. */
export function decohere(claims: readonly Claim<Band>[], environment: number, period: number): number {
  const about = claims.map((claim, i) => ({ ...claim, epoch: claim.at ?? 0, origin: claim.origin || `o${i}` }));
  const noise = Array.from({ length: environment }, (_, i) => ({
    origin: `n${i}`, span: { lo: 0, hi: 1 }, epoch: i % Math.max(1, period), at: i % Math.max(1, period),
  }));
  return coherence([...about, ...noise].map((claim) => ({ origin: claim.origin, epoch: claim.epoch, span: claim.span })), period);
}
