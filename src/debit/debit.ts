import type { MeetSemilattice } from '../lattice/lattice.ts';

export function foldIn<T>(L: MeetSemilattice<T>, demands: readonly T[]): T {
  let acc = L.top;
  for (const d of demands) acc = L.meet(acc, d);
  return acc;
}

export function witnessesIn<T>(L: MeetSemilattice<T>, demands: readonly T[]): readonly [T, T] | null {
  const whole = foldIn(L, demands);
  if (L.inhabited(whole)) return null;
  for (let i = 0; i < demands.length; i++) {
    for (let j = i + 1; j < demands.length; j++) {
      if (!L.inhabited(L.meet(demands[i]!, demands[j]!))) {
        return [demands[i]!, demands[j]!];
      }
    }
  }
  return null;
}
