import { isDistributive } from '../lattice/order.ts';
import { isSupermodular, premium } from '../lattice/price/premium.ts';
import type { Level, Scale, State, Unit } from '../lattice/types.ts';
import { state, unit } from '../debit/unit.ts';
import { statesPerDebit } from '../debit/unit-span.ts';
import { STATES } from '../debit/vector.ts';
import type { Matrix } from '../debit/vector-move.ts';
import type { Point } from './field.ts';

/**
 * The field is the lattice and the debit in motion. Each origin at a point holds a band on a scale — the floor it
 * demands, the ceiling it allows — and the point's declaration is their fold: the demand is the join of the floors,
 * the limit the meet of the ceilings. Everything below is read with the other two theories, and nothing new is priced:
 * the debit's four states and its register, the premium of the declaration, the shape of the scale.
 */
export function declarationOf(c: Scale, place: Point): { readonly demand: Level; readonly limit: Level } {
  return place.seen.reduce(
    (held, s) => ({ demand: c.higher(held.demand, s.span.lo), limit: c.lower(held.limit, s.span.hi) }),
    { demand: c.bottomIx, limit: c.topIx },
  );
}

/** The point as a unit of the debit: its coordinate is the subject, its declaration the floor and the ceiling. */
export function unitOf(c: Scale, place: Point): Unit {
  const { demand, limit } = declarationOf(c, place);
  return unit(place.at.join('/'), { floor: c.levels[demand] ?? c.bottom, ceiling: c.levels[limit] ?? c.top });
}

/** A point's state is one of the debit's four. */
export function stateOf(c: Scale, place: Point): State {
  return state(c, unitOf(c, place));
}

export function registerOf(c: Scale, place: Point): readonly [string, State][] {
  return statesPerDebit(c, unitOf(c, place));
}

export function premiumOf(c: Scale, value: (level: Level) => number, place: Point): number {
  const { demand, limit } = declarationOf(c, place);
  return premium(c, value, demand, limit);
}

export function degenerate(c: Scale, value: (level: Level) => number): boolean {
  return isSupermodular(c, value);
}

export function withdrawsExactly(c: Scale): boolean {
  return isDistributive(c);
}

export function movesOf(c: Scale, before: Point, after: Point): Matrix {
  const moves = Object.fromEntries(STATES.map((a) => [a, Object.fromEntries(STATES.map((b) => [b, 0]))])) as Record<State, Record<State, number>>;
  const was = new Map(registerOf(c, before));
  for (const [debit, now] of registerOf(c, after)) {
    const then = was.get(debit);
    if (then) moves[then][now] += 1;
  }
  return moves;
}
