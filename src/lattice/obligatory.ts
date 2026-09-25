import { coordinate } from '../field/field.ts';
import { UnitError } from './errors.ts';
import type { Lattice } from './lattice.ts';
import type { State } from './types.ts';

/**
 * The object, c = ⟨⊥, ⊤, O, ⊑⟩ over L at r: four parts in two pairs. Its value is the floor and the ceiling, and
 * neither is stored: the floor is read as what is required above the cell met with what its live claims hold, the
 * ceiling as what is signed above it, and widened at it alone with a witness, met with what they hold. Its relations
 * are the origins that spoke on it and the order of rest it stands in. The lattice it is given and the resolution it
 * is read at belong to the reading; the sign, +1 or −1, rides the line an act leaves, and a line at −1 names by its id
 * the line it takes back. A line lives where it was written, a signature at its bound, and every reading goes up to it.
 */
export type Act = 1 | -1;

export interface Origin {
  readonly name: string;
  readonly phase: number;
}

export interface Claim<T> {
  readonly origin: string;
  readonly span: T;
  readonly id?: string;
  readonly at?: number;
  readonly sign?: Act;
  readonly takes?: string;
  readonly phase?: number;
}

export interface Mark<T> {
  readonly pole: 'floor' | 'ceiling';
  readonly reach: 'local' | 'travels';
  readonly span: T;
  readonly widens?: string;
  readonly id?: string;
  readonly at?: number;
  readonly sign?: Act;
  readonly takes?: string;
}

export interface Obligatory<T> {
  readonly at: readonly string[];
  readonly epoch: number;
  readonly seen: readonly Claim<T>[];
  readonly restsOn: readonly string[];
  readonly marks?: readonly Mark<T>[];
}

export type World<T> = ReadonlyMap<string, Obligatory<T>>;

export interface Cell<T> {
  readonly floor: T;
  readonly ceiling: T;
  readonly origins: readonly Claim<T>[];
  readonly rest: readonly string[];
  readonly required: T;
  readonly signed: T;
}

export function cell<T>(at: string, epoch = 0, seen: readonly Claim<T>[] = [], restsOn: readonly string[] = []): Obligatory<T> {
  return { at: coordinate(at), epoch, seen, restsOn };
}

export function mark<T>(one: Mark<T>): Mark<T> {
  if (one.widens !== undefined && one.reach === 'travels') {
    throw new UnitError('widening-travels', 'obligations: REFUSE·widening-travels a widening stands where it was witnessed and never travels to what rests there', { pole: one.pole });
  }
  return one.takes === undefined ? one : { ...one, sign: -1 };
}

export function live<L extends { readonly id?: string; readonly takes?: string }>(lines: readonly L[]): readonly L[] {
  const taken = new Set(lines.flatMap((line) => (line.takes === undefined ? [] : [line.takes])));
  return lines.filter((line) => line.takes === undefined && (line.id === undefined || !taken.has(line.id)));
}

export function restOf<T>(c: Obligatory<T>, world: World<T> = new Map()): readonly string[] {
  const own = c.at.join('/');
  const out: string[] = [];
  const held = new Set<string>();
  const edge = [...c.restsOn];
  for (let i = 0; i < edge.length; i += 1) {
    const name = edge[i]!;
    if (name === own) throw new UnitError('rest-cycle', `obligations: REFUSE·rest ${own} rests on itself: an order of rest with a cycle has no fold to reach`, { at: own });
    if (held.has(name)) continue;
    held.add(name);
    out.push(name);
    edge.push(...(world.get(name)?.restsOn ?? []));
  }
  return out;
}

export function parts<T>(L: Lattice<T>, c: Obligatory<T>, world: World<T> = new Map()): Cell<T> {
  const rest = restOf(c, world);
  const above = rest.flatMap((name) => live(world.get(name)?.marks ?? []).filter((one) => one.reach === 'travels' && one.widens === undefined));
  const marks = [...live(c.marks ?? []), ...above].sort((a, b) => (a.at ?? 0) - (b.at ?? 0));
  let required = L.top;
  let signed = L.top;
  for (const one of marks) {
    if (one.pole === 'floor') required = L.meet(required, one.span);
    else signed = one.widens === undefined ? L.meet(signed, one.span) : L.join(signed, one.span);
  }
  const origins = live(c.seen);
  const held = origins.reduce((acc, claim) => L.meet(acc, claim.span), L.top);
  return { floor: L.meet(required, held), ceiling: L.meet(signed, held), origins, rest, required, signed };
}

export function state<T>(L: Lattice<T>, c: Obligatory<T>, world: World<T> = new Map()): State {
  const { floor, ceiling, origins, required, signed } = parts(L, c, world);
  if (!L.inhabited(L.meet(required, signed))) return 'CONFLICT';
  if (new Set(origins.map((claim) => claim.origin)).size < 2) return 'REQUIRED';
  if (!L.inhabited(origins.reduce((acc, claim) => L.meet(acc, claim.span), L.top))) return 'CONFLICT';
  return L.inhabited(L.meet(floor, ceiling)) ? 'FREE' : 'FORBIDDEN';
}
