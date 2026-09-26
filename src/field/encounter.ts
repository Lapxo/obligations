import { witnessesIn } from '../debit/debit.ts';
import { key } from './field.ts';
import type { Point, Sighting } from './field.ts';
import { meet } from './meet.ts';
import { intervals } from '../lattice/forms.ts';
import type { Interval } from '../lattice/forms.ts';
import { live } from '../lattice/obligatory.ts';
import type { Lattice } from '../lattice/lattice.ts';
import type { Obligatory, Origin, World } from '../lattice/obligatory.ts';

/**
 * An encounter is two origins at one place. Everything below is read off the set of sightings a point already holds —
 * how many origins met, whether they agree, what they hold together, and what turned between two readings. The form
 * a cell is read in is the one its own claims span: a module here knows no poles of its own. What a place says — one
 * origin, origins apart, origins together — is those three words and no others, spelled here and read everywhere.
 */
const spanning = (spans: readonly Interval[]): ReturnType<typeof intervals> =>
  intervals(Math.min(...spans.map((one) => one.lo)), Math.max(...spans.map((one) => one.hi)));

/** How many origins met here. One is potential and holds no information yet; two that meet are an encounter (L01). */
export function origins(place: Point): number {
  return new Set(place.seen.map((s) => s.origin)).size;
}

export function potential(place: Point): boolean {
  return origins(place) < 2;
}

export function disagree(place: Point): readonly [Sighting, Sighting] | null {
  const spans = place.seen.map((s) => s.span);
  const split = spans.length ? witnessesIn(spanning(spans), spans) : null;
  if (!split) return null;
  const left = place.seen.find((s) => s.span === split[0]);
  const right = place.seen.find((s) => s.span === split[1]);
  return left && right ? [left, right] : null;
}

export function meetAt(place: Point): Interval {
  const spans = place.seen.map((s) => s.span);
  if (!spans.length) throw new Error('obligations: REFUSE·meet a cell no origin has claimed has no meet of its own: read it against the form it belongs to');
  const form = spanning(spans);
  return spans.reduce((held, span) => form.meet(held, span));
}

/** History at one coordinate: what stands is the latest epoch there, never the clock and never the order of a file (L22). */
export function latest(places: readonly Point[]): Point | null {
  return places.reduce<Point | null>((held, place) => (held === null || place.epoch > held.epoch ? place : held), null);
}

export function verdict(place: Point): string {
  return potential(place) ? 'one' : disagree(place) ? 'apart' : 'together';
}

export function turned(before: readonly Point[], after: readonly Point[]): readonly Point[] {
  const held = new Map(before.map((p) => [key([{ at: p.at }]), verdict(p)]));
  return after.filter((p) => held.get(key([{ at: p.at }])) !== verdict(p));
}

export function encounter<T>(L: Lattice<T>, c: Obligatory<T>, world: World<T> = new Map()): { readonly origins: number; readonly held: T } {
  return { origins: new Set(live(c.seen).map((claim) => claim.origin)).size, held: meet(L, c, world) };
}

export const cancels = (a: Origin, b: Origin): boolean => Math.cos(a.phase - b.phase) < 0;

export function pairs(origins: readonly Origin[]): { readonly forks: number; readonly closes: number } {
  let forks = 0;
  let closes = 0;
  for (let i = 0; i < origins.length; i += 1) for (let j = i + 1; j < origins.length; j += 1) if (cancels(origins[i]!, origins[j]!)) forks += 1; else closes += 1;
  return { forks, closes };
}

export function laminar(origins: readonly Origin[]): boolean {
  const x = origins.reduce((sum, one) => sum + Math.cos(one.phase), 0);
  const y = origins.reduce((sum, one) => sum + Math.sin(one.phase), 0);
  return x * x + y * y > origins.length;
}
