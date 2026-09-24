import type { State } from '../lattice/types.ts';

type Quadrants = import('./vector.ts').Quadrants;
type Run = import('./vector.ts').Run;

const STATES = ['REQUIRED', 'FREE', 'FORBIDDEN', 'CONFLICT'] as const satisfies readonly State[];

function findWithin(runs: readonly Run[], s: State): number {
  let n = 0;
  for (const r of runs) if (r.within) n += r.within[s];
  return n;
}

export type Matrix = Readonly<Record<State, Readonly<Record<State, number>>>>;

export const DANGEROUS: readonly (readonly [State, State])[] =
  STATES.filter((s) => s !== 'CONFLICT').map((s) => [s, 'CONFLICT'] as const);

const zero = (): Record<State, Record<State, number>> => {
  const m = {} as Record<State, Record<State, number>>;
  for (const a of STATES) {
    m[a] = {} as Record<State, number>;
    for (const b of STATES) m[a][b] = 0;
  }
  return m;
};

export function transitions(before: Quadrants, after: Quadrants, width: number): Matrix {
  const at = (q: Quadrants, bit: number): State | null => {
    for (const s of STATES) if (q[s].has(bit)) return s;
    return null;
  };
  const m = zero();
  for (let bit = 0; bit < width; bit++) {
    const a = at(before, bit);
    const b = at(after, bit);
    if (a === null || b === null) continue;
    m[a][b] += 1;
  }
  return m;
}

export function dangerous(m: Matrix): readonly { from: State; to: State; n: number }[] {
  return DANGEROUS
    .map(([from, to]) => ({ from, to, n: m[from][to] }))
    .filter((x) => x.n > 0);
}

export function moved(m: Matrix): number {
  let n = 0;
  for (const a of STATES) for (const b of STATES) if (a !== b) n += m[a][b];
  return n;
}
