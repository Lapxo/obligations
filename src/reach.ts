import { compose } from './unit';
import type { Scale, Edge, Unit } from './types';

/**
 * Everything reachable from `from`, including itself. Transitive, because a
 * two-hop route is the one a review misses.
 *
 * What a viewpoint IS — a caller, a stage, a lens, a delegation — is the
 * caller's business and never this file's.
 */
export function reach(edges: readonly Edge[], from: string): string[] {
  const seen: string[] = [from];
  for (let i = 0; i < seen.length; i++) {
    for (const [a, b] of edges) {
      if (a === seen[i] && !seen.includes(b)) seen.push(b);
    }
  }
  return seen;
}

/**
 * What a viewpoint EFFECTIVELY holds.
 *
 * What holds, and the only reason this is a primitive rather than graph
 * bookkeeping: **reaching means holding**. A viewpoint that can reach
 * another holds both sets of opinions at once, so they compose — and the
 * result can collide when neither side collides alone. Checking viewpoints
 * one at a time cannot find that, which is how most reviews are done.
 *
 * It was implemented twice independently before it was promoted here, which
 * is the evidence that earned it the place.
 */
export function effective(
  c: Scale,
  edges: readonly Edge[],
  from: string,
  unitsOf: (name: string) => readonly Unit[] | undefined,
): { via: string[]; units: Unit[]; bounds: Unit | null } {
  const via = reach(edges, from);
  const units = via.flatMap((name) => [...(unitsOf(name) ?? [])]);
  return { via, units, bounds: units.length > 0 ? compose(c, units) : null };
}
