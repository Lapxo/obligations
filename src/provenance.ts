import { chain } from './order';
import { compose, unit } from './unit';
import type { Method } from './types';

/**
 * The methods a claim can rest on, weakest first. An ORDER, not a set —
 * which is why provenance needs no machinery of its own.
 */
export const METHODS: readonly Method[] = ['declared', 'statistics', 'sample', 'exact'];

/**
 * THE PROVENANCE LAW: a claim is only as good as its weakest input.
 *
 * `exact` is the identity — measuring something exactly weakens nothing.
 * `declared` absorbs: one unread input makes the whole claim unread, and
 * saying otherwise is how an estimate ends up presented as a measurement.
 *
 * This is not a second algebra. It is `compose` on the method order, and the
 * golden vectors prove the two routes agree on all sixteen pairs.
 */
export function weakest(methods: Iterable<Method>): Method {
  const c = chain(METHODS as readonly string[]);
  const units = [...methods].map((m) => unit('evidence', { floor: METHODS[0], ceiling: m }));
  return units.length === 0 ? 'exact' : (compose(c, units).ceiling as Method);
}
