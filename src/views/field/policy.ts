import { encounter, meet } from '../../lattice/obligatory.ts';
import type { Lattice } from '../../lattice/lattice.ts';
import { coherence } from './wave.ts';
import { neighbours, reach } from '../product/reach.ts';
import type { Obligatory } from '../../lattice/obligatory.ts';

type Band = { readonly lo: number; readonly hi: number };

export interface Weights {
  readonly reach: number;
  readonly coherence: number;
  readonly rank: number;
  readonly bits: number;
}

const at = (cell: Obligatory<Band>): string => cell.at.join('/');
const said = (lattice: Lattice<Band>, cell: Obligatory<Band>): string => {
  const held = meet(lattice, cell);
  if (encounter(lattice, cell).origins < 2) return 'one';
  return held.lo > held.hi ? 'apart' : 'together';
};
const widthOf = (lattice: Lattice<Band>, cell: Obligatory<Band>): number => {
  const held = meet(lattice, cell);
  return Math.max(0, held.hi - held.lo);
};

/**
 * A policy is four weights and nothing else: what a cell is worth to look at next is its reach, how together its
 * claims arrived, what rests on it and what it still leaves free, each taken as it stands and added under the weights
 * a policy carries. A specialist is a policy with one weight; a mixed policy is one with four.
 */
export function choose(lattice: Lattice<Band>, world: readonly Obligatory<Band>[], weights: Weights, held: ReadonlySet<string>): string {
  let best = '';
  let top: number | undefined;
  for (const cell of world) {
    const name = at(cell);
    if (held.has(name)) continue;
    const said = cell.seen.map((claim, i) => ({ origin: claim.origin, epoch: claim.at ?? i, span: claim.span }));
    const score = weights.reach * reach(world, name)
      + weights.coherence * coherence(said, 8)
      + weights.rank * (neighbours(world).get(name) ?? []).length
      + weights.bits * Math.log2(1 + widthOf(lattice, cell));
    if (top === undefined || score > top) { top = score; best = name; }
  }
  return best;
}

/**
 * One run of a policy over a field: each epoch it looks where its weights send it, and what the look does is read off
 * the cell afterwards. A cell that had one origin and now has two that meet is closed; one whose origins no longer
 * meet is a fork; a cell closed before and forked now is reopened, which is the cost a policy pays for looking where
 * it should not. Coverage is the share of cells two origins have touched.
 */
export function play(lattice: Lattice<Band>, world: readonly Obligatory<Band>[], weights: Weights, epochs: number, seed: number, spread: number): {
  readonly closed: number; readonly forks: number; readonly reopened: number; readonly coverage: number;
} {
  let held = seed;
  const next = (): number => { held = (held * 1103515245 + 12345) % 2147483648; return held / 2147483648; };
  let now = [...world];
  const closed = new Set<string>();
  const forked = new Set<string>();
  let reopened = 0;
  for (let epoch = 1; epoch <= epochs; epoch += 1) {
    const name = choose(lattice, now, weights, new Set());
    if (!name) break;
    now = now.map((cell) => {
      if (at(cell) !== name) return cell;
      const was = said(lattice, cell);
      const held = meet(lattice, cell);
      const centre = (held.lo + held.hi) / 2 + (next() * 2 - 1) * spread;
      const one = { id: `p${epoch}`, origin: `p${epoch}`, at: epoch, span: { lo: centre - 5, hi: centre + 5 } };
      const after = { ...cell, epoch, seen: [...cell.seen, one] };
      const verdict = said(lattice, after);
      if (verdict === 'together' && was !== 'together') closed.add(name);
      if (verdict === 'apart') {
        forked.add(name);
        if (closed.has(name)) { reopened += 1; closed.delete(name); }
      }
      return after;
    });
  }
  const covered = now.filter((cell) => encounter(lattice, cell).origins > 1).length;
  return { closed: closed.size, forks: forked.size, reopened, coverage: Math.round((100 * covered) / now.length) };
}
