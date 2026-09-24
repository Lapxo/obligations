import type { Level, Scale } from '../types.ts';

type Valuation = (level: Level) => number;

export function meetBlocks(c: Scale, u: Level, w: Level): Level[][] {
  const lo = c.lower(u, w);
  const hi = c.higher(u, w);
  const jis = c.joins().filter((j) => c.leq(lo, j) && c.leq(j, hi));
  if (jis.length === 0) return [];
  const parent = jis.map((_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const union = (a: number, b: number): void => {
    parent[find(a)] = find(b);
  };
  for (let i = 0; i < jis.length; i++) {
    for (let j = i + 1; j < jis.length; j++) {
      if (c.leq(jis[i], jis[j]) || c.leq(jis[j], jis[i])) union(i, j);
    }
  }
  const groups = new Map<number, Level[]>();
  jis.forEach((j, i) => {
    const r = find(i);
    const g = groups.get(r) ?? [];
    g.push(j);
    groups.set(r, g);
  });
  return [...groups.values()];
}
