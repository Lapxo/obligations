import { WideMask } from './masks.ts';
import type { State } from '../lattice/types.ts';

export const STATES = ['REQUIRED', 'FREE', 'FORBIDDEN', 'CONFLICT'] as const satisfies readonly State[];

export interface Quadrants {
  readonly REQUIRED: WideMask;
  readonly FREE: WideMask;
  readonly FORBIDDEN: WideMask;
  readonly CONFLICT: WideMask;
}

export function quadrants(demanded: WideMask, permitted: WideMask, extent: WideMask): Quadrants {
  const d = demanded.and(extent);
  const p = permitted.and(extent);
  return {
    REQUIRED: d.and(p),
    FREE: p.difference(d),
    FORBIDDEN: extent.difference(p).difference(d),
    CONFLICT: d.difference(p),
  };
}

export function sizes(q: Quadrants): Readonly<Record<State, number>> {
  return {
    REQUIRED: q.REQUIRED.size(),
    FREE: q.FREE.size(),
    FORBIDDEN: q.FORBIDDEN.size(),
    CONFLICT: q.CONFLICT.size(),
  };
}

export function stateAt(q: Quadrants, bit: number): State | null {
  for (const s of STATES) if (q[s].has(bit)) return s;
  return null;
}

export interface Run {
  readonly lo: number;
  readonly hi: number;
  readonly state: State;
  readonly coalesced?: number;
  readonly within?: Readonly<Record<State, number>>;
}

export interface Span {
  readonly lo: number;
  readonly hi: number;
}

const overlaps = (a: Span, x: number): boolean => x >= a.lo && x <= a.hi;

export function runQuadrants(
  demanded: readonly Span[],
  permitted: Span | null,
  extent: Span,
): readonly Run[] {
  if (extent.hi < extent.lo) return [];

  const cuts = new Set<number>([extent.lo]);
  const add = (s: Span): void => {
    if (s.lo > extent.lo && s.lo <= extent.hi) cuts.add(s.lo);
    if (s.hi >= extent.lo && s.hi < extent.hi) cuts.add(s.hi + 1);
  };
  for (const s of demanded) add(s);
  if (permitted) add(permitted);

  const at = (x: number): State => {
    const d = demanded.some((s) => overlaps(s, x));
    const p = permitted !== null && overlaps(permitted, x);
    if (d && p) return 'REQUIRED';
    if (d) return 'CONFLICT';
    return p ? 'FREE' : 'FORBIDDEN';
  };

  const points = [...cuts].sort((a, b) => a - b);
  const out: Run[] = [];
  for (let i = 0; i < points.length; i++) {
    const lo = points[i]!;
    const hi = i + 1 < points.length ? points[i + 1]! - 1 : extent.hi;
    if (hi < lo) continue;
    const state = at(lo);
    const last = out[out.length - 1];
    if (last && last.state === state && last.hi + 1 === lo) {
      out[out.length - 1] = { lo: last.lo, hi, state };
      continue;
    }
    out.push({ lo, hi, state });
  }
  return out;
}

export type { Matrix } from './vector-move.ts';
export { DANGEROUS, dangerous, moved, transitions } from './vector-move.ts';
