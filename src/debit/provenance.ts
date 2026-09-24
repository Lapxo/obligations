import { chain } from '../lattice/order.ts';
import { compose, unit } from './unit.ts';
import type { Method } from '../lattice/types.ts';

export const METHODS = ['declared', 'statistics', 'sample', 'exact'] as const satisfies readonly Method[];

export function weakest(methods: Iterable<Method>): Method {
  const c = chain(METHODS as readonly string[]);
  const units = [...methods].map((m) => unit('evidence', { floor: METHODS[0], ceiling: m }));
  return units.length === 0 ? 'exact' : (compose(c, units).ceiling as Method);
}
