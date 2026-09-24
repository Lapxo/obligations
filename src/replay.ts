import { foldRegion } from './field/field.ts';
import type { Fold, Point, Region } from './field/field.ts';

/**
 * Replay is the proof: what landed is folded again over its region, and the same points give the same verdicts in any
 * order and on any machine. It is the one loop of the field with a verdict as its local reading; nothing is run again.
 */
export function replay<T>(landed: readonly Point[], where: Region, verdict: (met: readonly Point[]) => T): readonly Fold<T>[] {
  return foldRegion(landed, where, verdict);
}
