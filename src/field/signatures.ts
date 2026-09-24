import { relate } from '../lattice/lattice.ts';
import type { Poset } from '../lattice/lattice.ts';

/**
 * Signatures as meet: two signed values on one cell never replace each other. They relate by the cell's order —
 * equal values are one encounter, the narrower stands over the wider, and incomparable values all stand as a fork.
 */
/* The fold of signed values on one cell: equal values share a class, and every class no other class is narrower than stands. */
export function foldSigned<T>(L: Poset<T>, values: readonly T[]): {
  readonly classes: readonly (readonly number[])[];
  readonly standing: readonly number[];
  readonly fork: boolean;
} {
  const classes: number[][] = [];
  for (let i = 0; i < values.length; i++) {
    const home = classes.find((c) => relate(L, values[c[0]!]!, values[i]!) === 'equal');
    if (home) home.push(i);
    else classes.push([i]);
  }
  const standing: number[] = [];
  for (let c = 0; c < classes.length; c++) {
    const mine = values[classes[c]![0]!]!;
    const beaten = classes.some((other, o) => o !== c && relate(L, values[other[0]!]!, mine) === 'narrower');
    if (!beaten) standing.push(c);
  }
  return { classes, standing, fork: standing.length > 1 };
}
