import { coordinate } from '../field/field.ts';
import type { Lattice } from './lattice.ts';

/**
 * The object, written once. A cell is two poles on a lattice it is given and never one it assumes: what its origins
 * hold together is their meet in that lattice, and the state it is in is the one that lattice names. Its origins carry
 * claims that say who, when and what, and a withdrawal names the claim it takes back rather than a value that looks
 * like it. A cell rests on bounds it does not own: a signature narrows a bound, every cell resting on it reads the
 * narrower one, and no origin's claim is touched — which is why signatures commute and no order of them ever shows.
 * Its ceiling is a value: a signature over a world narrows it in every cell resting on the bound, joined or not, and a
 * join widens it in one cell only, with a witness. A signature closes freedom where it reaches; a join opens it where
 * it stands. Signatures commute; a signature and a join on one cell never do, which is why a join carries who stood for it.
 */
export interface Claim<T> {
  readonly origin: string;
  readonly span: T;
  readonly id?: string;
  readonly at?: number;
  readonly takes?: string;
}

export interface Obligatory<T> {
  readonly at: readonly string[];
  readonly epoch: number;
  readonly seen: readonly Claim<T>[];
  readonly restsOn: readonly string[];
  readonly ceiling?: T;
  readonly witnesses?: readonly string[];
}

export function cell<T>(at: string, epoch = 0, seen: readonly Claim<T>[] = [], restsOn: readonly string[] = []): Obligatory<T> {
  return { at: coordinate(at), epoch, seen, restsOn };
}

const standing = <T>(one: Obligatory<T>): readonly Claim<T>[] => {
  const taken = new Set(one.seen.flatMap((claim) => (claim.takes === undefined ? [] : [claim.takes])));
  return one.seen.filter((claim) => claim.takes === undefined && (claim.id === undefined || !taken.has(claim.id)));
};

export function meet<T>(lattice: Lattice<T>, one: Obligatory<T>, bounds: ReadonlyMap<string, T> = new Map()): T {
  const rested = one.restsOn.flatMap((name) => (bounds.has(name) ? [bounds.get(name)!] : []));
  const own = one.ceiling === undefined ? [] : [one.ceiling];
  return [...standing(one).map((claim) => claim.span), ...rested, ...own].reduce((held, span) => lattice.meet(held, span), lattice.top);
}

export function encounter<T>(lattice: Lattice<T>, one: Obligatory<T>, bounds?: ReadonlyMap<string, T>): { readonly origins: number; readonly held: T } {
  return { origins: new Set(standing(one).map((claim) => claim.origin)).size, held: meet(lattice, one, bounds) };
}

export function observe<T>(one: Obligatory<T>, claim: Claim<T>): Obligatory<T> {
  return { ...one, epoch: Math.max(one.epoch, claim.at ?? one.epoch), seen: [...one.seen, claim] };
}

export function sign<T>(lattice: Lattice<T>, bounds: ReadonlyMap<string, T>, name: string, span: T): ReadonlyMap<string, T>;
export function sign<T>(lattice: Lattice<T>, world: readonly Obligatory<T>[], name: string, span: T): readonly Obligatory<T>[];
export function sign<T>(lattice: Lattice<T>, held: ReadonlyMap<string, T> | readonly Obligatory<T>[], name: string, span: T): ReadonlyMap<string, T> | readonly Obligatory<T>[] {
  if (!(held instanceof Map)) {
    return (held as readonly Obligatory<T>[]).map((one) => (one.restsOn.includes(name) ? { ...one, ceiling: lattice.meet(one.ceiling ?? lattice.top, span) } : one));
  }
  return new Map([...held, [name, lattice.meet(held.get(name) ?? lattice.top, span)]]);
}

export function join<T>(lattice: Lattice<T>, one: Obligatory<T>, span: T, witness: string): Obligatory<T> {
  if (witness === '') throw new Error('REFUSE·join a widening lands only with a witness or the signatures of whoever rests on the old bound');
  return { ...one, ceiling: lattice.join(one.ceiling ?? lattice.top, span), witnesses: [...(one.witnesses ?? []), witness] };
}

export function refine<T>(one: Obligatory<T>, steps: number): Obligatory<T> {
  return { ...one, at: steps >= one.at.length ? one.at : one.at.slice(0, Math.max(1, steps)) };
}
