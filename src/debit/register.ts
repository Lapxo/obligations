import type { Scale, Unit } from '../lattice/types.ts';

export interface Register {
  readonly demanded: readonly string[];
  readonly limiting: readonly string[];
}

export function register(c: Scale, u: Unit): Register {
  const f = c.rank(u.floor);
  const cl = c.rank(u.ceiling);
  return {
    demanded: c.joins().filter((j) => c.leq(j, f)).map((j) => c.levels[j]),
    limiting: c.limits().filter((m) => c.leq(cl, m)).map((m) => c.levels[m]),
  };
}

export function rebuild(c: Scale, reg: Register, subject = ''): Unit {
  let floor = c.bottomIx;
  for (const name of reg.demanded) floor = c.higher(floor, c.rank(name));
  let ceiling = c.topIx;
  for (const name of reg.limiting) ceiling = c.lower(ceiling, c.rank(name));
  return { subject, floor: c.levels[floor], ceiling: c.levels[ceiling] };
}
