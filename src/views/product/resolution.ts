import { coarsen } from '../../field/field.ts';
import { verdict } from '../../field/encounter.ts';
import { area } from './polygon.ts';
import type { Point } from '../../field/field.ts';

/**
 * What a scale hides: read coarsely, the origins of many cells pool into one coordinate and may agree there; read
 * finely, each cell answers alone and the agreement opens into the forks the coarser scale held together. The
 * resolution a region is sufficient at is the one past which the figure its origins enclose stops changing.
 */
export function agreements(cells: readonly Point[], steps: number): { readonly agreed: number; readonly forks: number; readonly cells: number } {
  const pooled = new Map<string, Point>();
  for (const cell of cells) {
    const coarse = coarsen(cell, steps);
    const key = coarse.at.join('/');
    const held = pooled.get(key);
    pooled.set(key, held === undefined ? coarse : { ...held, seen: [...held.seen, ...coarse.seen] });
  }
  const said = [...pooled.values()].map((one) => verdict(one));
  return { agreed: said.filter((one) => one === 'together').length, forks: said.filter((one) => one === 'apart').length, cells: pooled.size };
}

export function residual(cells: readonly Point[], steps: number): number {
  const pooled = new Map<string, Point>();
  for (const cell of cells) {
    const coarse = coarsen(cell, steps);
    const key = coarse.at.join('/');
    const held = pooled.get(key);
    pooled.set(key, held === undefined ? coarse : { ...held, seen: [...held.seen, ...coarse.seen] });
  }
  return [...pooled.values()].reduce((sum, one) => sum + area(one), 0);
}

export function sufficient(cells: readonly Point[], upTo: number, tolerance = 1e-9): number {
  let held = residual(cells, 1);
  for (let steps = 2; steps <= upTo; steps += 1) {
    const now = residual(cells, steps);
    if (Math.abs(now - held) <= tolerance) return steps - 1;
    held = now;
  }
  return upTo;
}
