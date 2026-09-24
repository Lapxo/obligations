/**
 * The order structures of the algebra: a poset, its meet and join. The laws each of them keeps are checked in
 * axioms.ts. Nothing here names a form or a consumer.
 */
export interface Poset<T> {
  leq(a: T, b: T): boolean;
  show(x: T): string;
}

export interface MeetSemilattice<T> extends Poset<T> {
  readonly top: T;
  meet(a: T, b: T): T;
  inhabited(x: T): boolean;
}

export interface JoinSemilattice<T> extends Poset<T> {
  readonly bottom: T;
  join(a: T, b: T): T;
}

export interface Lattice<T> extends MeetSemilattice<T>, JoinSemilattice<T> {}

export function eq<T>(L: Poset<T>, a: T, b: T): boolean {
  return L.leq(a, b) && L.leq(b, a);
}

/*
 * Two signed values on one cell never replace each other: they relate by the cell's order. Equal values are one
 * encounter, the narrower value stands over the wider one, and incomparable values all stand as a fork.
 */
export type Relation = 'equal' | 'narrower' | 'wider' | 'incomparable';

export function relate<T>(L: Poset<T>, a: T, b: T): Relation {
  const ab = L.leq(a, b);
  const ba = L.leq(b, a);
  if (ab && ba) return 'equal';
  if (ab) return 'narrower';
  if (ba) return 'wider';
  return 'incomparable';
}
