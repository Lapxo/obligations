import { UnitError } from '../errors.ts';
import { best, premium as premiumOf } from './premium.ts';
import type { Level, Scale } from '../types.ts';

type Valuation = (level: Level) => number;

export const dropTo = (value: Valuation, u: Level, m: Level): number => value(u) - value(m);

export function defect(c: Scale, value: Valuation, a: Level, b: Level): number {
  return value(a) + value(b) - value(c.higher(a, b)) - value(c.lower(a, b));
}

export interface Price {
  readonly coarse: number;
  readonly gain: number;
  readonly gated: number;
  readonly derived: readonly ['gated'];
  readonly best: number;
  readonly at: Level;
  readonly premium: number;
  readonly licensed: boolean;
}

export function price(c: Scale, value: Valuation, u: Level, w: Level): Price {
  const coarse = dropTo(value, u, c.lower(u, w));
  const gain = defect(c, value, u, w);
  const found = best(c, value, u, w);
  const prem = coarse - found.cost;
  const gated = coarse - gain;
  return {
    coarse,
    gain,
    gated,
    derived: ['gated'],
    best: found.cost,
    at: found.at,
    premium: prem,
    licensed: Math.abs(gated - found.cost) <= 1e-9,
  };
}

export function slack(c: Scale, a: Level, b: Level): { up: number; down: number } | null {
  const bottom = c.bottomIx;
  const height = (x: Level): number | null => c.intervalHeight(bottom, x);
  const [ha, hb, hj, hm] = [height(a), height(b), height(c.higher(a, b)), height(c.lower(a, b))];
  if (ha === null || hb === null || hj === null || hm === null) return null;
  return { up: hj - Math.max(ha, hb), down: Math.min(ha, hb) - hm };
}

export type SpectrumQuantity = 'premium' | 'defect';

export function spectrum(
  c: Scale,
  worth: Valuation,
  places = 9,
  quantity: SpectrumQuantity = 'premium',
): { values: number[]; pairs: number; band: { low: number; high: number }; degeneracy: number } {
  const seen = new Set<number>();
  let pairs = 0;

  for (let a = 0; a < c.levels.length; a++) {
    for (let b = a; b < c.levels.length; b++) {
      const left = quantity === 'defect' ? defect(c, worth, a, b) : premiumOf(c, worth, a, b);
      if (!Number.isFinite(left)) {
        throw new UnitError('NOT_FINITE', 'this way of valuing levels is not finite');
      }
      pairs++;
      const step = 10 ** places;
      seen.add(Math.round(left * step) / step);
    }
  }

  const values = [...seen].sort((x, y) => x - y);
  return {
    values,
    pairs,
    band: { low: values[0] ?? 0, high: values[values.length - 1] ?? 0 },
    degeneracy: values.length > 0 ? pairs / values.length : 0,
  };
}
