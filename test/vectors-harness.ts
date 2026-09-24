import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { alphabetForm, buildGraph, chain, compose, height, order, reachIds } from '@lapxo/obligations';
import type { Edge, Level, Matrix, Quadrants, Scale, State, Unit } from '@lapxo/obligations';

function observeFile(at: string, enc: BufferEncoding): string;
function observeFile(at: string): Buffer;
function observeFile(at: string, enc?: BufferEncoding): string | Buffer {
  return enc === undefined ? readFileSync(at) : readFileSync(at, enc);
}

export type Vector = Record<string, any>;

export const throws = (fn: () => unknown, pattern?: RegExp | ((e: any) => boolean)): boolean => {
  try {
    fn();
    return false;
  } catch (e) {
    if (pattern === undefined) return true;
    return pattern instanceof RegExp ? pattern.test(String((e as Error)?.message ?? e)) : pattern(e);
  }
};

export type Refusal = { readonly code: string; readonly message: string };

export function caught(fn: () => unknown): Refusal | null {
  try {
    fn();
    return null;
  } catch (e) {
    if (typeof e === 'object' && e !== null && 'code' in e) return e as Refusal;
    throw e;
  }
}

const VECTORS = join(import.meta.dirname, '..', 'vectors');

export const load = (name: string): Vector =>
  JSON.parse(observeFile(join(VECTORS, `${name}.json`), 'utf8'));

/** A law's own sample: the yes side is its vector, the no side its falsifier. */
export const sample = (side: 'yes' | 'no', name: string): Vector => {
  const held = JSON.parse(observeFile(join(import.meta.dirname, '..', 'samples', side, `${name}.json`), 'utf8')) as Vector;
  const note = (globalThis as { __boundRead?: (name: string) => void }).__boundRead;
  if (note === undefined || !Array.isArray(held['cases'])) return held;
  /** A case is run when its inputs are read, and counted when only its length or its label is: the runner sees which. */
  const cases = (held['cases'] as Vector[]).map((one, i) => new Proxy(one, {
    get: (target, field, receiver) => {
      if (typeof field === 'string') note(`samples/${side}/${name}#${i}:${field}`);
      return Reflect.get(target, field, receiver);
    },
  }));
  return { ...held, cases };
};

export const FILES = readdirSync(VECTORS)
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.slice(0, -'.json'.length))
  .sort();

export function namesReached(edges: readonly Edge[], from: string): string[] {
  if (!edges.some(([a, b]) => a === from || b === from)) return [from];
  const g = buildGraph(edges);
  const seen = reachIds(g, g.id(from));
  return [...Array(g.size).keys()].filter((i) => seen[i]).map((i) => g.name(i));
}

export function effective(
  c: Scale,
  edges: readonly Edge[],
  from: string,
  unitsOf: (name: string) => readonly Unit[] | undefined,
): { via: string[]; units: Unit[]; bounds: Unit | null } {
  const via = namesReached(edges, from);
  const units = via.flatMap((name) => [...(unitsOf(name) ?? [])]);
  return { via, units, bounds: units.length > 0 ? compose(c, units) : null };
}

export const T = true;
export const F = false;

export const b2 = () =>
  order(
    ['none', 'x', 'y', 'both'],
    [
      [T, T, T, T],
      [F, T, F, T],
      [F, F, T, T],
      [F, F, F, T],
    ],
  );

export const n5 = () =>
  order(
    ['none', 'a', 'b', 'c', 'all'],
    [
      [T, T, T, T, T],
      [F, T, T, F, T],
      [F, F, T, F, T],
      [F, F, F, T, T],
      [F, F, F, F, T],
    ],
  );

export const m3 = () =>
  order(
    ['bot', 'a', 'b', 'c', 'top'],
    [
      [true, true, true, true, true],
      [false, true, false, false, true],
      [false, false, true, false, true],
      [false, false, false, true, true],
      [false, false, false, false, true],
    ],
  );

export const heightWorth = (c: Scale) => (i: Level): number => height(c, i);

export const squareWorth = (i: Level): number => i * i;
export const cheapJoin = (i: Level): number => [0, 3, 3, 4][i] ?? i;

export const WORTH: Record<string, (i: Level) => number> = {
  counting: (i) => i,
  square: (i) => i * i,
  log: (i) => Math.log(i + 1),
  doubling: (i) => 2 ** i,
  root: (i) => Math.sqrt(i),
};

export const scaleFrom = (spec: string[] | { levels: string[]; leq: boolean[][] }): Scale =>
  Array.isArray(spec) ? chain(spec) : order(spec.levels, spec.leq);

export function productOfChains(dims: readonly number[]): Scale {
  const points: number[][] = [[]];
  const grid = dims.reduce<number[][]>(
    (acc, d) => acc.flatMap((p) => [...Array(d).keys()].map((k) => [...p, k])),
    points,
  );
  const levels = grid.map((p) => p.join(','));
  const leq = grid.map((a) => grid.map((b) => a.every((x, i) => x <= b[i]!)));
  return order(levels, leq);
}

/** Every partition of n places, coarsest first: the blocks a reading can tell apart. */
export function partitionsOf(n: number): number[][][] {
  const grow = (k: number): number[][][] => {
    if (k === 0) return [[]];
    return grow(k - 1).flatMap((p) => [
      ...p.map((_, i) => p.map((b, j) => (i === j ? [...b, k - 1] : b))),
      [...p, [k - 1]],
    ]);
  };
  return grow(n).map((p) => p.map((b) => [...b].sort((a, b2) => a - b2)).sort((a, b) => a[0]! - b[0]!));
}

/**
 * The partition lattice on n places, ordered by what it tells apart: the one block below, the discrete partition
 * above, and each level worth the entropy of its blocks under the even measure.
 */
export function partitionScale(n: number): {
  scale: Scale; blocks: readonly number[][][]; worth: (i: Level) => number; at: (p: readonly (readonly number[])[]) => Level;
} {
  const blocks = partitionsOf(n);
  const name = (p: readonly (readonly number[])[]): string => p.map((b) => [...b].sort((x, y) => x - y).join('')).sort().join('|');
  const inside = (a: number[][], b: number[][]): boolean =>
    b.every((block) => a.some((wide) => block.every((x) => wide.includes(x))));
  const scale = order(blocks.map(name), blocks.map((a) => blocks.map((b) => inside(a, b))));
  const worth = (i: Level): number => blocks[i]!.reduce((h, b) => h - (b.length / n) * Math.log2(b.length / n), 0);
  return { scale, blocks, worth, at: (p) => scale.rank(name(p)) };
}

export type Row = Vector;

export const maskOf = (tokens: readonly string[], values: readonly string[]) => alphabetForm.parse({ tokens }, { want: values });

export const only = (v: Record<string, unknown>, kind: string): Row[] =>
  (v.cases as Row[]).filter((c) => c.kind === kind);

export const matrices = (): Row[] => only(load('transitions'), 'matrix');
export const biography = (): Row => only(load('transitions'), 'biography')[0]!;

export function oracle(
  tokens: readonly string[],
  demanded: readonly string[],
  permitted: readonly string[],
  extent: readonly string[],
): Readonly<Record<State, readonly string[]>> {
  const out: Record<State, string[]> = { REQUIRED: [], FREE: [], FORBIDDEN: [], CONFLICT: [] };
  for (const t of tokens) {
    if (!extent.includes(t)) continue;
    const d = demanded.includes(t);
    const p = permitted.includes(t);
    out[d && p ? 'REQUIRED' : d ? 'CONFLICT' : p ? 'FREE' : 'FORBIDDEN'].push(t);
  }
  return out;
}

export const membersOf = (q: Quadrants, tokens: readonly string[]): Record<State, readonly string[]> => ({
  REQUIRED: q.REQUIRED.members(tokens),
  FREE: q.FREE.members(tokens),
  FORBIDDEN: q.FORBIDDEN.members(tokens),
  CONFLICT: q.CONFLICT.members(tokens),
});

export const cell = (m: Matrix, key: string): number => {
  const [from, to] = key.split('→') as [State, State];
  return m[from][to];
};
