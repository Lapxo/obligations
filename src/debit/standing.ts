import { fuse } from './unit.ts';
import type { Scale, Unit } from '../lattice/types.ts';

export function touches(c: Scale, mine: Unit, folded: Unit): boolean {
  return c.rank(mine.floor) === c.rank(folded.floor) || c.rank(mine.ceiling) === c.rank(folded.ceiling);
}

export function holds(c: Scale, units: readonly Unit[], index: number): boolean {
  if (index < 0 || index >= units.length) return false;
  const whole = fuse(c, units);
  const rest = units.filter((_, i) => i !== index);
  const next = fuse(c, rest);
  return next.floor !== whole.floor || next.ceiling !== whole.ceiling;
}
