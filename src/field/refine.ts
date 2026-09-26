import type { Obligatory } from '../lattice/obligatory.ts';

/** Refine, the act with no pole that rescales: the same cell read at another resolution, its coordinate cut to that depth. */
export function refine<T>(c: Obligatory<T>, steps: number): Obligatory<T> {
  return { ...c, at: steps >= c.at.length ? c.at : c.at.slice(0, Math.max(1, steps)) };
}
