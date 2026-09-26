import { meet } from '../../field/meet.ts';
import { observe } from '../../field/observe.ts';
import type { Obligatory } from '../../lattice/obligatory.ts';
import type { Lattice } from '../../lattice/lattice.ts';

type Band = { readonly lo: number; readonly hi: number };

/**
 * A cell that folds itself: each epoch it observes a claim of the given width centred on its own meet, off by at most
 * the spread. It narrows only when the offset cuts inside what it already holds, so its freedom settles instead of
 * vanishing, and it never conflicts, because every claim it makes is centred on what it holds.
 */
export function selfFold(lattice: Lattice<Band>, one: Obligatory<Band>, epochs: number, width: number, spread: number, seed: number): readonly Obligatory<Band>[] {
  let held = seed;
  const next = (): number => { held = (held * 1103515245 + 12345) % 2147483648; return held / 2147483648; };
  const out: Obligatory<Band>[] = [];
  let now = one;
  for (let epoch = 1; epoch <= epochs; epoch += 1) {
    const at = meet(lattice, now);
    const centre = (at.lo + at.hi) / 2 + (next() * 2 - 1) * spread;
    now = observe(now, { origin: `self${epoch}`, at: epoch, span: { lo: centre - width / 2, hi: centre + width / 2 } });
    out.push(now);
  }
  return out;
}
