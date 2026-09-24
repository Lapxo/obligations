/**
 * The space claims live in. A point is where something is, how finely it is named and when, and which origins have
 * touched it; a region is a coordinate read at some resolution, and its points are the ones that refine it. Nothing
 * here stores a relation: containment, exclusivity, contraction and encounter are read off the coordinates and the
 * origins already at the point, so two sets of points give one space in any order and nothing is reconciled.
 */
import type { Interval } from '../lattice/forms.ts';

export interface Sighting {
  readonly origin: string;
  readonly span: Interval;
}

export interface Point {
  readonly at: readonly string[];
  readonly epoch: number;
  readonly seen: readonly Sighting[];
}

export interface Region {
  readonly at: readonly string[];
}

/**
 * A coordinate read from a name: each step is one resolution finer, and an empty step is no step (L09). Which
 * characters separate steps is the reader's word, not the space's: a tree of files steps on one, a scope on another.
 * Inside a region `*` is any one step and `**` any run of steps; a region that ends in either is the region before it.
 */
export function coordinate(name: string, steps = '/'): readonly string[] {
  const at = name.split(new RegExp(`[${steps.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&')}]`)).filter((s) => s !== '');
  while (at[at.length - 1] === '*' || at[at.length - 1] === '**') at.pop();
  return at;
}

export function point(name: string, epoch = 0, seen: readonly Sighting[] = [], steps = '/'): Point {
  return { at: coordinate(name, steps), epoch, seen };
}

export function region(name: string, steps = '/'): Region {
  return { at: coordinate(name, steps) };
}

export function coarsen(place: Point, steps: number): Point {
  return { at: place.at.slice(0, Math.max(0, steps)), epoch: place.epoch, seen: place.seen };
}

export function passes(place: Point | Region, step: string): boolean {
  return step.startsWith('*') ? place.at.some((s) => s.endsWith(step.slice(1))) : place.at.includes(step);
}

export function resolution(place: Point | Region): number {
  return place.at.length;
}

export function within(inner: Point | Region, outer: Region): boolean {
  const refines = (i: number, j: number): boolean => j === outer.at.length
    || (outer.at[j] === '**'
      ? refines(i, j + 1) || (i < inner.at.length && refines(i + 1, j))
      : i < inner.at.length && (outer.at[j] === '*' || outer.at[j] === inner.at[i]) && refines(i + 1, j + 1));
  return refines(0, 0);
}

/** The regions only this side reaches: where the origins disagree, and nowhere else (L00). */
export function exclusive(mine: readonly Region[], others: readonly (readonly Region[])[]): readonly Region[] {
  return mine.filter((one) => !others.some((other) => other.some((theirs) => resolution(theirs) === resolution(one) && within(one, theirs))));
}

export function contracts(regions: readonly Region[], touched: readonly Point[]): boolean {
  return !regions.some((one) => touched.some((p) => within(p, one)));
}

export function key(regions: readonly Region[]): string {
  return [...new Set(regions.map((one) => one.at.join('/')))].sort().join('|');
}

const inside = (one: number, of: Interval): boolean => one >= of.lo && one <= of.hi;

export interface Fold<T> {
  readonly at: string;
  readonly value: T;
}

export function foldRegion<T>(places: readonly Point[], where: Region, f: (met: readonly Point[]) => T): readonly Fold<T>[] {
  const gathered = new Map<string, Point[]>();
  for (const place of places) {
    if (!within(place, where)) continue;
    const at = place.at.join('/');
    gathered.set(at, [...(gathered.get(at) ?? []), place]);
  }
  return [...gathered].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)).map(([at, met]) => ({ at, value: f(met) }));
}

export function covers(met: readonly Point[], of: { readonly where: readonly Region[]; readonly steps: Interval; readonly when: Interval }): boolean {
  return met.every((place) => of.where.some((one) => within(place, one))
    && inside(resolution(place), of.steps)
    && inside(place.epoch, of.when));
}

export function outranks(met: readonly Point[], named: readonly (readonly [string, string])[], order: readonly string[]): string | null {
  const matched = named.filter(([step]) => met.some((place) => passes(place, step))).map(([, kind]) => kind);
  return order.find((kind) => matched.includes(kind)) ?? null;
}

export function answers(met: readonly Point[], where: readonly Region[]): boolean {
  return met.length > 0 && met.every((place) => where.some((one) => within(place, one)));
}

export function verified(met: readonly Point[], green: (place: Point) => boolean): boolean {
  return met.some((place) => green(place));
}

export function retracted(met: readonly Point[], by: readonly Region[]): readonly Point[] {
  return met.filter((place) => by.some((one) => within(place, one)));
}

export function size(at: readonly string[], steps?: number): number {
  return new Set(at.map((name) => {
    const place = point(name);
    return (steps === undefined ? place : coarsen(place, steps)).at.join('/');
  })).size;
}

export function sufficientResolution<T>(finest: number, verdict: (steps: number) => T, same: (a: T, b: T) => boolean = Object.is): number {
  const whole = verdict(finest);
  for (let steps = 1; steps < finest; steps += 1) if (same(verdict(steps), whole)) return steps;
  return finest;
}
