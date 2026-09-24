import type { Level, Scale, Unit } from './types.ts';

/**
 * A declaration: a demanded level and a limiting level.
 *
 * `fuse` merges units. Conjunction raises demand and lowers the limit;
 * disjunction does the dual. (u₁,w₁) ∧ (u₂,w₂) = (u₁∨u₂, w₁∧w₂).
 */
export interface Declaration {
  readonly demand: Level;
  readonly limit: Level;
}

export function declaration(c: Scale, u: Unit): Declaration {
  return { demand: c.rank(u.floor), limit: c.rank(u.ceiling) };
}

export function asUnit(c: Scale, d: Declaration, subject = ''): Unit {
  return { subject, floor: c.levels[d.demand], ceiling: c.levels[d.limit] };
}

/** (u₁,w₁) ∧ (u₂,w₂) = (u₁∨u₂, w₁∧w₂). */
export function conj(c: Scale, a: Declaration, b: Declaration): Declaration {
  return { demand: c.higher(a.demand, b.demand), limit: c.lower(a.limit, b.limit) };
}

/** (u₁,w₁) ∨ (u₂,w₂) = (u₁∧u₂, w₁∨w₂). */
export function disj(c: Scale, a: Declaration, b: Declaration): Declaration {
  return { demand: c.lower(a.demand, b.demand), limit: c.higher(a.limit, b.limit) };
}
