import { origins } from './encounter.ts';
import { resolution } from './field.ts';
import { premium } from '../lattice/price/premium.ts';
import type { Point } from './field.ts';
import type { Level, Scale, Unit } from '../lattice/types.ts';

/** A cell a signed ceiling bounds: where it lies, what it demands and permits, what rests on it, and who could close it. */
export interface Asked {
  readonly at: Point;
  readonly bound: Unit;
  readonly dependents: readonly string[];
  readonly closers: readonly { readonly by: string; readonly cost: number }[];
}

export interface Open {
  readonly at: string;
  readonly resolution: number;
  readonly premium: number;
  readonly dependents: number;
  readonly closer: string | null;
  readonly cost: number | null;
}

/**
 * The frontier: the cells a lock bounds that no origin has touched. Each is a question with a coordinate at a
 * resolution, the premium of closing it, what already rests on it, and the cheapest origin that could. A cell an
 * origin has touched is no longer a question, whatever else is owed on it.
 */
export function frontier(c: Scale, value: (level: Level) => number, asked: readonly Asked[]): readonly Open[] {
  return asked.filter((one) => origins(one.at) === 0).map((one) => {
    const cheapest = [...one.closers].sort((a, b) => (a.cost === b.cost ? (a.by < b.by ? -1 : 1) : a.cost - b.cost))[0];
    return {
      at: one.at.at.join('/'),
      resolution: resolution(one.at),
      premium: premium(c, value, c.rank(one.bound.floor), c.rank(one.bound.ceiling)),
      dependents: one.dependents.length,
      closer: cheapest?.by ?? null,
      cost: cheapest?.cost ?? null,
    };
  });
}
