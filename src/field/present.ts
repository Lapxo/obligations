import { meetAt, potential } from './encounter.ts';
import type { Point } from './field.ts';
import type { Interval } from '../lattice/forms.ts';

export function present(place: Point): Interval | 'potential' | null {
  if (potential(place)) return 'potential';
  const held = meetAt(place);
  return held.lo > held.hi ? null : held;
}

/** The present's width moves by maturation minus forgetting each epoch and never below zero (L22c). */
export function converge(width: number, maturation: number, forgetting: number, epochs: number): { readonly width: number; readonly trend: 'widens' | 'narrows' | 'holds' | 'zero' } {
  let at = width;
  for (let epoch = 0; epoch < epochs; epoch += 1) at = Math.max(0, at + maturation - forgetting);
  return { width: at, trend: at === 0 && width > 0 ? 'zero' : at > width ? 'widens' : at < width ? 'narrows' : 'holds' };
}

/** Where the present ends: the latest epoch any claim reaches. With no leading claim it ends before now. */
export function endsBeforeNow(now: number, leading: readonly (readonly [number, number])[], lagging: readonly (readonly [number, number])[]): boolean {
  const ends = [...leading, ...lagging].map(([, hi]) => hi);
  const end = ends.length ? Math.max(...ends) : 0;
  return leading.length === 0 && end < now;
}
