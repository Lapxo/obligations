import { UnitError } from '../lattice/errors.ts';
import type { Lattice } from '../lattice/lattice.ts';
import type { Scale, Unit } from '../lattice/types.ts';

export interface IdealDebit {
  readonly demand: readonly string[];
  readonly permit: readonly string[];
}

const namesOf = (c: Scale): readonly string[] => c.levels;

const sorted = (names: Iterable<string>): readonly string[] =>
  [...new Set(names)].sort();

const has = (xs: readonly string[], name: string): boolean => xs.includes(name);

export function upset(c: Scale, names: readonly string[]): readonly string[] {
  return sorted(
    namesOf(c).filter((_, i) => names.some((n) => c.leq(c.rank(n), i))),
  );
}

export function downset(c: Scale, names: readonly string[]): readonly string[] {
  return sorted(
    namesOf(c).filter((_, i) => names.some((n) => c.leq(i, c.rank(n)))),
  );
}

export function isUpset(c: Scale, names: readonly string[]): boolean {
  const closed = upset(c, names);
  return names.length === closed.length && names.every((n) => has(closed, n));
}

export function isDownset(c: Scale, names: readonly string[]): boolean {
  const closed = downset(c, names);
  return names.length === closed.length && names.every((n) => has(closed, n));
}

export function isIdealPair(c: Scale, d: IdealDebit): boolean {
  return isUpset(c, d.demand) && isDownset(c, d.permit);
}

export function idealDebit(
  c: Scale,
  demand: readonly string[],
  permit: readonly string[],
): IdealDebit {
  const pair = { demand: sorted(demand), permit: sorted(permit) };
  if (!isIdealPair(c, pair)) {
    throw new UnitError('MALFORMED', 'a debit that is not a pair of ideals', {
      demand: pair.demand,
      permit: pair.permit,
    });
  }
  return pair;
}

export function idealMeet(a: IdealDebit, b: IdealDebit): IdealDebit {
  return {
    demand: sorted(a.demand.filter((n) => has(b.demand, n))),
    permit: sorted([...a.permit, ...b.permit]),
  };
}

export function idealJoin(a: IdealDebit, b: IdealDebit): IdealDebit {
  return {
    demand: sorted([...a.demand, ...b.demand]),
    permit: sorted(a.permit.filter((n) => has(b.permit, n))),
  };
}

function idealInhabited(d: IdealDebit): boolean {
  return d.demand.some((n) => has(d.permit, n));
}

export function idealEntails(a: IdealDebit, b: IdealDebit): boolean {
  return a.demand.every((n) => has(b.demand, n)) && a.permit.every((n) => has(b.permit, n));
}

export function idealComplexity(c: Scale, d: IdealDebit): number {
  const omega = namesOf(c);
  return omega.filter((n) => !has(d.demand, n)).length
    + omega.filter((n) => !has(d.permit, n)).length;
}

export function unitToIdeal(c: Scale, u: Unit): IdealDebit {
  return {
    demand: upset(c, [u.floor]),
    permit: downset(c, [u.ceiling]),
  };
}

/**
 * Bits of freedom: what is left to decide between what a debit requires and what it permits — log2 of the states in
 * the upset of its floor that are also in the downset of its ceiling. A decided cell holds one state and no freedom; a
 * cell in conflict holds none, and has no freedom either.
 */
export function freedom(c: Scale, u: Unit): number {
  const d = unitToIdeal(c, u);
  const between = d.demand.filter((n) => has(d.permit, n)).length;
  return between > 1 ? Math.log2(between) : 0;
}

export function unitComplexity(c: Scale, u: Unit): number {
  return idealComplexity(c, unitToIdeal(c, u));
}

export function fromIdeals(c: Scale): Lattice<IdealDebit> {
  const omega = namesOf(c);
  return {
    bottom: { demand: [], permit: [] },
    top: { demand: [...omega], permit: [...omega] },
    leq: (a, b) => idealEntails(a, b),
    meet: (a, b) => idealMeet(a, b),
    join: (a, b) => idealJoin(a, b),
    show: (x) => `{${x.demand.join(',')}}/{${x.permit.join(',')}}`,
    inhabited: (x) => idealInhabited(x),
  };
}
