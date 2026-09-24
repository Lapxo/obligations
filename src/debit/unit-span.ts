import { unitComplexity } from './ideal.ts';
import type { Level, Scale, State, Unit } from '../lattice/types.ts';

/** The state of every debit under a unit — the exact read-out. */
export function statesPerDebit(c: Scale, u: Unit): [string, State][] {
  const f = c.rank(u.floor);
  const cl = c.rank(u.ceiling);
  return c.joins().map((j: Level): [string, State] => {
    const demanded = c.leq(j, f);
    const permitted = c.leq(j, cl);
    return [
      c.levels[j],
      demanded ? (permitted ? 'REQUIRED' : 'CONFLICT') : permitted ? 'FREE' : 'FORBIDDEN',
    ];
  });
}

/** ANY of these — exactly, as a list. Gaps stay gaps. */
export function anyOf(c: Scale, units: readonly Unit[]): Unit[] {
  const rank = (u: Unit): [Level, Level] => [c.rank(u.floor), c.rank(u.ceiling)];
  const holds = (f: Level, cl: Level, l: Level): boolean => c.leq(f, l) && c.leq(l, cl);
  const levels = [...c.levels.keys()];
  let live = units.filter((u) => {
    const [f, cl] = rank(u);
    return c.leq(f, cl);
  });
  for (let changed = true; changed;) {
    changed = false;
    outer: for (let i = 0; i < live.length; i++) {
      for (let j = i + 1; j < live.length; j++) {
        const [af, ac] = rank(live[i]);
        const [bf, bc] = rank(live[j]);
        const lo = c.lower(af, bf);
        const hi = c.higher(ac, bc);
        const gains = levels.some(
          (l) => holds(lo, hi, l) && !holds(af, ac, l) && !holds(bf, bc, l),
        );
        if (gains) continue;
        live = [
          ...live.filter((_, k) => k !== i && k !== j),
          { subject: live[i].subject, floor: c.levels[lo], ceiling: c.levels[hi] },
        ];
        changed = true;
        break outer;
      }
    }
  }
  return live.sort((x, y) => {
    const [xf, xc] = rank(x);
    const [yf, yc] = rank(y);
    return xf - yf || xc - yc;
  });
}

export function missing(
  c: Scale,
  have: Unit,
  want: Unit,
): { raiseFloorTo: string[]; raiseCeilingTo: string[] } {
  const [hf, hc] = [c.rank(have.floor), c.rank(have.ceiling)];
  const [wf, wc] = [c.rank(want.floor), c.rank(want.ceiling)];
  const all = [...c.levels.keys()];
  const weakestOf = (works: (l: Level) => boolean): string[] => {
    const ok = all.filter(works);
    return ok.filter((l) => !ok.some((o) => o !== l && c.leq(o, l))).map((l) => c.levels[l]);
  };
  return {
    raiseFloorTo: c.leq(wf, hf) ? [] : weakestOf((l) => c.leq(wf, c.higher(hf, l))),
    raiseCeilingTo: c.leq(wc, hc) ? [] : weakestOf((l) => c.leq(wc, c.higher(hc, l))),
  };
}

export function complexity(c: Scale, u: Unit): number {
  return unitComplexity(c, u);
}
