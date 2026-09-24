import type { Edge } from '../lattice/types.ts';

/**
 * Compressed sparse row over interned integer ids.
 * Two Int32Arrays hold the estate; names stay in one table.
 */
export interface Graph {
  readonly size: number;
  id(name: string): number;
  name(id: number): string;
  readonly heads: Int32Array;
  readonly tails: Int32Array;
}

export function buildGraph(edges: readonly Edge[]): Graph {
  const index = new Map<string, number>();
  const names: string[] = [];
  const intern = (s: string): number => {
    const hit = index.get(s);
    if (hit !== undefined) return hit;
    const i = names.length;
    names.push(s);
    index.set(s, i);
    return i;
  };
  const pairs: [number, number][] = [];
  for (const [a, b] of edges) pairs.push([intern(a), intern(b)]);
  const size = names.length;
  const counts = new Int32Array(size);
  for (const [a] of pairs) counts[a]++;
  const heads = new Int32Array(size + 1);
  for (let i = 0; i < size; i++) heads[i + 1] = heads[i] + counts[i];
  const tails = new Int32Array(pairs.length);
  const cursor = heads.slice();
  for (const [a, b] of pairs) tails[cursor[a]++] = b;
  return {
    size,
    id: (name) => index.get(name) ?? -1,
    name: (id) => names[id] ?? '',
    heads,
    tails,
  };
}

/** A name is owed only when the carrier is unobserved or contains it. */
function owed(carrier: ReadonlySet<string>, name: string): boolean {
  return carrier.size === 0 || carrier.has(name);
}

export function reachIds(g: Graph, from: number, scratch?: Uint8Array): Uint8Array {
  const seen = scratch ?? new Uint8Array(g.size);
  if (scratch) seen.fill(0);
  if (from < 0 || from >= g.size) return seen;
  const queue = [from];
  seen[from] = 1;
  while (queue.length > 0) {
    const v = queue.pop()!;
    for (let i = g.heads[v]; i < g.heads[v + 1]; i++) {
      const n = g.tails[i];
      if (!seen[n]) {
        seen[n] = 1;
        queue.push(n);
      }
    }
  }
  return seen;
}
