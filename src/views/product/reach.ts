import { meetAt, origins } from '../../field/encounter.ts';
import type { Interval } from '../../lattice/forms.ts';
import type { Point } from '../../field/field.ts';

const at = (cell: Point): string => cell.at.join('/');
const spoke = (cell: Point, bounds: readonly string[]): readonly string[] =>
  [...new Set(cell.seen.map((s) => s.origin))].filter((one) => !bounds.includes(one));

/**
 * Who stands beside whom: two cells are one step apart when an origin looked at both, so a world is a graph of the
 * lookings that cross it. A bound is not a looking: cells rest on it without anyone having been to both, so it is
 * named apart and carries no step. What no looking crosses to is past the horizon, and no number reaches it, which
 * is what a horizon returns. A distance is a value of the form the world gives it: no walk in a field of n cells is
 * longer than n steps, so n is that form's top and it is what unreachable reads as, never an absence.
 */
export function neighbours(world: readonly Point[], bounds: readonly string[] = []): ReadonlyMap<string, readonly string[]> {
  const byOrigin = new Map<string, string[]>();
  for (const cell of world) for (const one of spoke(cell, bounds)) byOrigin.set(one, [...(byOrigin.get(one) ?? []), at(cell)]);
  const out = new Map<string, Set<string>>();
  for (const held of byOrigin.values()) {
    for (const a of held) {
      const mine = out.get(a) ?? new Set<string>();
      for (const b of held) if (b !== a) mine.add(b);
      out.set(a, mine);
    }
  }
  return new Map([...out].map(([place, said]) => [place, [...said]]));
}

export function distance(world: readonly Point[], from: string, to: string, bounds: readonly string[] = []): number {
  if (from === to) return 0;
  const next = neighbours(world, bounds);
  const seen = new Set([from]);
  let edge = [from];
  for (let step = 1; edge.length; step += 1) {
    const further: string[] = [];
    for (const one of edge) {
      for (const other of next.get(one) ?? []) {
        if (seen.has(other)) continue;
        if (other === to) return step;
        seen.add(other);
        further.push(other);
      }
    }
    edge = further;
  }
  return world.length;
}

export function horizon(world: readonly Point[], from: string, bounds: readonly string[] = []): readonly string[] {
  const next = neighbours(world, bounds);
  const seen = new Set([from]);
  const edge = [from];
  while (edge.length) {
    const one = edge.pop()!;
    for (const other of next.get(one) ?? []) if (!seen.has(other)) { seen.add(other); edge.push(other); }
  }
  return world.map(at).filter((place) => !seen.has(place));
}

export function reach(world: readonly Point[], from: string, bounds: readonly string[] = []): number {
  return world.length - horizon(world, from, bounds).length - 1;
}

export function tunnel(world: readonly Point[], places: readonly string[], bounds: readonly string[] = []): readonly (readonly [string, string])[] {
  const crossed: [string, string][] = [];
  for (const a of places) for (const b of places) if (a < b && distance(world, a, b, bounds) >= world.length) crossed.push([a, b]);
  return crossed;
}

export function curvature(world: readonly Point[]): number {
  const counts = world.map((cell) => origins(cell)).filter((n) => n > 0).sort((a, b) => b - a);
  if (!counts.length) return 0;
  const top = counts.slice(0, Math.max(1, Math.floor(counts.length / 10)));
  const low = counts.slice(-Math.max(1, Math.floor(counts.length / 10)));
  const mean = (xs: readonly number[]): number => xs.reduce((s, x) => s + x, 0) / xs.length;
  if (mean(low) === 0) throw new Error('obligations: REFUSE·curvature the sparsest tenth of this field holds no origin, so there is no ratio to take');
  return mean(top) / mean(low);
}

/**
 * A cell grows until something stops it: a wall the lock names, or the place where the next origin's claim is nearer
 * than its own. What stops it is never its own doing, so a cell alone between two walls is as wide as they leave it,
 * and cells that rest on one bound move together when it moves, whoever was looking and whoever was not.
 */
export function grow(walls: readonly number[], placed: readonly number[]): readonly { readonly at: number; readonly width: number }[] {
  const edges = [...new Set(walls)].sort((a, b) => a - b);
  const held = [...placed].sort((a, b) => a - b);
  const first = edges[0] ?? 0;
  const last = edges[edges.length - 1] ?? 0;
  return held.map((one) => {
    const lo = Math.max(...edges.filter((w) => w <= one), first);
    const hi = Math.min(...edges.filter((w) => w >= one), last);
    const inside = held.filter((other) => other > lo && other < hi);
    const i = inside.indexOf(one);
    const left = i > 0 ? (inside[i - 1]! + one) / 2 : lo;
    const right = i < inside.length - 1 ? (inside[i + 1]! + one) / 2 : hi;
    return { at: one, width: right - left };
  });
}

export function entangled(world: readonly Point[], bound: string): readonly string[] {
  return world.filter((cell) => cell.seen.some((s) => s.origin === bound)).map(at);
}

export function resting(world: readonly Point[], bound: string, was: Interval, now: Interval): readonly string[] {
  const under = (span: Interval, cell: Point): boolean => {
    const held = meetAt({ ...cell, seen: cell.seen.map((s) => (s.origin === bound ? { ...s, span } : s)) });
    return held.hi >= held.lo;
  };
  return entangled(world, bound).flatMap((place) => {
    const cell = world.find((one) => at(one) === place);
    return cell !== undefined && under(was, cell) !== under(now, cell) ? [place] : [];
  });
}
