import { eq } from './lattice.ts';
import type { Lattice, MeetSemilattice, Poset } from './lattice.ts';
import { isDownset, isUpset, idealJoin, idealMeet } from '../debit/ideal.ts';
import type { IdealDebit } from '../debit/ideal.ts';
import type { Scale } from './types.ts';

export const POSET_LAW_NAMES = [
  'transitivity',
  'antisymmetry',
] as const;

export const MEET_LAW_NAMES = [
  'idempotence.meet',
  'unit.top',
  'top.greatest',
  'commutativity.meet',
  'consistency.meet',
  'associativity.meet',
] as const;

export const JOIN_LAW_NAMES = [
  'idempotence.join',
  'unit.bottom',
  'bottom.least',
  'commutativity.join',
  'consistency.join',
  'associativity.join',
] as const;

export const BOTH_LAW_NAMES = [
  'absorption.meet',
  'absorption.join',
] as const;

export const CLOSURE_LAW_NAMES = [
  'closure.demand',
  'closure.permit',
  'closure.meet',
  'closure.join',
] as const;

export const LATTICE_LAW_NAMES = [
  ...POSET_LAW_NAMES,
  ...MEET_LAW_NAMES,
  ...JOIN_LAW_NAMES,
  ...BOTH_LAW_NAMES,
] as const;

export type LatticeLawName = (typeof LATTICE_LAW_NAMES)[number];

const sayAt = <T>(L: Poset<T>, law: LatticeLawName, at: readonly T[]): string =>
  `${law}: ${at.map((x) => L.show(x)).join(' , ')}`;

export function posetViolationsIn<T>(L: Poset<T>, xs: readonly T[]): readonly string[] {
  const out: string[] = [];
  const same = (a: T, b: T): boolean => eq(L, a, b);
  for (const a of xs) {
    for (const b of xs) {
      if (L.leq(a, b) && L.leq(b, a) && !same(a, b)) {
        out.push(sayAt(L, 'antisymmetry', [a, b]));
      }
      for (const d of xs) {
        if (L.leq(a, b) && L.leq(b, d) && !L.leq(a, d)) {
          out.push(sayAt(L, 'transitivity', [a, b, d]));
        }
      }
    }
  }
  return out;
}

export function meetViolationsIn<T>(L: MeetSemilattice<T>, xs: readonly T[]): readonly string[] {
  const out: string[] = [...posetViolationsIn(L, xs)];
  const same = (a: T, b: T): boolean => eq(L, a, b);
  const say = (law: LatticeLawName, ...at: T[]): void => {
    out.push(sayAt(L, law, at));
  };

  for (const a of xs) {
    if (!same(L.meet(a, a), a)) say('idempotence.meet', a);
    if (!same(L.meet(a, L.top), a)) say('unit.top', a);
    if (!L.leq(a, L.top)) say('top.greatest', a);

    for (const b of xs) {
      if (!same(L.meet(a, b), L.meet(b, a))) say('commutativity.meet', a, b);
      const le = L.leq(a, b);
      if (le !== same(L.meet(a, b), a)) say('consistency.meet', a, b);

      for (const d of xs) {
        if (!same(L.meet(L.meet(a, b), d), L.meet(a, L.meet(b, d)))) {
          say('associativity.meet', a, b, d);
        }
      }
    }
  }
  return out;
}

export function violationsIn<T>(L: Lattice<T>, xs: readonly T[]): readonly string[] {
  const out: string[] = [...meetViolationsIn(L, xs)];
  const same = (a: T, b: T): boolean => eq(L, a, b);
  const say = (law: LatticeLawName, ...at: T[]): void => {
    out.push(sayAt(L, law, at));
  };

  for (const a of xs) {
    if (!same(L.join(a, a), a)) say('idempotence.join', a);
    if (!same(L.join(a, L.bottom), a)) say('unit.bottom', a);
    if (!L.leq(L.bottom, a)) say('bottom.least', a);

    for (const b of xs) {
      if (!same(L.join(a, b), L.join(b, a))) say('commutativity.join', a, b);
      if (!same(L.meet(a, L.join(a, b)), a)) say('absorption.meet', a, b);
      if (!same(L.join(a, L.meet(a, b)), a)) say('absorption.join', a, b);

      const le = L.leq(a, b);
      if (le !== same(L.join(a, b), b)) say('consistency.join', a, b);

      for (const d of xs) {
        if (!same(L.join(L.join(a, b), d), L.join(a, L.join(b, d)))) {
          say('associativity.join', a, b, d);
        }
      }
    }
  }
  return out;
}

export function closureViolationsIn(
  c: Scale,
  xs: readonly IdealDebit[],
): readonly string[] {
  const out: string[] = [];
  const say = (law: string, at: string): void => {
    out.push(`${law}: ${at}`);
  };
  const shown = (d: IdealDebit): string => `{${d.demand.join(',')}}/{${d.permit.join(',')}}`;
  for (const a of xs) {
    if (!isUpset(c, a.demand)) say('closure.demand', shown(a));
    if (!isDownset(c, a.permit)) say('closure.permit', shown(a));
    for (const b of xs) {
      const m = idealMeet(a, b);
      const j = idealJoin(a, b);
      if (!isUpset(c, m.demand) || !isDownset(c, m.permit)) {
        say('closure.meet', `${shown(a)} , ${shown(b)}`);
      }
      if (!isUpset(c, j.demand) || !isDownset(c, j.permit)) {
        say('closure.join', `${shown(a)} , ${shown(b)}`);
      }
    }
  }
  return out;
}
