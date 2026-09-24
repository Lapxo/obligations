import { UnitError } from './errors.ts';
import type { Scale, Level, State } from './types.ts';

function build(levels: readonly string[], join: Level[][], meet: Level[][]): Scale {
  const n = levels.length;
  for (let i = 0; i < n; i++) {
    if (levels.indexOf(levels[i]) !== i) {
      throw new UnitError('DUPLICATE_LEVEL', `the level \`${levels[i]}\` is declared twice`, {
        level: levels[i],
      });
    }
  }
  const index = new Map(levels.map((l, i) => [l, i] as const));
  const leq = (a: Level, b: Level): boolean => join[a][b] === b;

  const total = levels.every((_, i) =>
    levels.every((__, j) => join[i][j] === i || join[i][j] === j),
  );
  let simple = true;
  for (let x = 0; x < n && simple; x++) {
    for (let y = 0; y < n && simple; y++) {
      for (let z = 0; z < n; z++) {
        if (meet[x][join[y][z]] !== join[meet[x][y]][meet[x][z]]) {
          simple = false;
          break;
        }
      }
    }
  }

  const all: Level[] = [...levels.keys()];
  const bottomIx = all.find((i) => all.every((j) => leq(i, j))) ?? 0;
  const topIx = all.find((i) => all.every((j) => leq(j, i))) ?? n - 1;

  const joinIrr: Level[] = all.filter(
    (j) =>
      j !== bottomIx &&
      all.filter((x) => x !== j && leq(x, j)).reduce((acc, x) => join[acc][x], bottomIx) !== j,
  );
  const meetIrr: Level[] = all.filter(
    (m) =>
      m !== topIx &&
      all.filter((x) => x !== m && leq(m, x)).reduce((acc, x) => meet[acc][x], topIx) !== m,
  );
  const seen = new Set<Level>();
  const allDebits: Level[] = [];
  for (const x of [...joinIrr, ...meetIrr]) {
    if (!seen.has(x)) {
      seen.add(x);
      allDebits.push(x);
    }
  }

  return {
    levels,
    isLadder: total,
    isSimple: simple,
    bottomIx,
    topIx,
    bottom: levels[bottomIx],
    top: levels[topIx],
    leq,
    higher: (a, b) => join[a][b],
    lower: (a, b) => meet[a][b],

    rank(level: string): Level {
      const r = index.get(level);
      if (r === undefined) {
        throw new UnitError('UNKNOWN_LEVEL', `no level \`${level}\` in this scale`, {
          level,
          levels,
        });
      }
      return r;
    },

    stateOf(floor: Level, ceiling: Level): State {
      if (!leq(floor, ceiling)) return 'CONFLICT';
      if (floor !== bottomIx) return 'REQUIRED';
      if (ceiling !== topIx) return 'FORBIDDEN';
      return 'FREE';
    },

    joins: () => joinIrr.slice(),
    limits: () => meetIrr.slice(),
    debits: () => allDebits.slice(),

    intervalHeight(lo: Level, hi: Level): number | null {
      if (!leq(lo, hi)) return null;
      const inside = all.filter((x) => leq(lo, x) && leq(x, hi));
      const covers = (x: Level): Level[] =>
        inside.filter(
          (y) =>
            y !== x &&
            leq(x, y) &&
            !inside.some((z) => z !== x && z !== y && leq(x, z) && leq(z, y)),
        );
      const long = new Map<Level, number>([[lo, 0]]);
      const short = new Map<Level, number>([[lo, 0]]);
      const walk = [...inside].sort(
        (a, b) => inside.filter((z) => leq(z, a)).length - inside.filter((z) => leq(z, b)).length,
      );
      for (const x of walk) {
        const lx = long.get(x);
        const sx = short.get(x);
        if (lx === undefined || sx === undefined) continue;
        for (const y of covers(x)) {
          long.set(y, Math.max(long.get(y) ?? lx + 1, lx + 1));
          short.set(y, Math.min(short.get(y) ?? sx + 1, sx + 1));
        }
      }
      const l = long.get(hi);
      return l !== undefined && l === short.get(hi) ? l : null;
    },
  };
}

export function chain(levels: readonly string[]): Scale {
  if (!Array.isArray(levels) || levels.length === 0) {
    throw new UnitError('EMPTY_CHAIN', 'a chain needs at least one level');
  }
  const n = levels.length;
  const grid = (f: (a: number, b: number) => number): Level[][] =>
    [...Array<undefined>(n)].map((_, i) => [...Array<undefined>(n)].map((__, j) => f(i, j)));
  return build(levels, grid(Math.max), grid(Math.min));
}

export function height(c: Scale, level: Level): number {
  const r = level;
  const depth = (x: number): number => {
    let d = 0;
    for (let y = 0; y < c.levels.length; y++) if (y !== x && c.leq(y, x)) d++;
    return d;
  };
  let h = 0;
  for (let x = 0; x < c.levels.length; x++)
    if (x !== r && c.leq(x, r)) h = Math.max(h, depth(x) + 1);
  return h;
}

export function isDistributive(c: Scale): boolean {
  const n = c.levels.length;
  for (let x = 0; x < n; x++)
    for (let y = 0; y < n; y++)
      for (let z = 0; z < n; z++) {
        const left = c.higher(x, c.lower(y, z));
        const right = c.lower(c.higher(x, y), c.higher(x, z));
        if (left !== right) return false;
      }
  return true;
}

export function order(levels: readonly string[], leq: readonly boolean[][]): Scale {
  if (!Array.isArray(levels) || levels.length === 0) {
    throw new UnitError('EMPTY_CHAIN', 'an order needs at least one level');
  }
  const n = levels.length;
  const bound = (a: Level, b: Level, up: boolean): Level => {
    const bs = [...Array(n).keys()].filter((x) =>
      up ? leq[a][x] && leq[b][x] : leq[x][a] && leq[x][b],
    );
    const least = bs.filter((x) => bs.every((y) => (up ? leq[x][y] : leq[y][x])));
    if (least.length !== 1) {
      throw new UnitError(
        'MALFORMED',
        `\`${levels[a]}\` and \`${levels[b]}\` have ${least.length} ` +
          `${up ? 'lowest common' : 'highest common'} bounds, so this is not a usable scale`,
        { levels: [levels[a], levels[b]] },
      );
    }
    return least[0];
  };
  const grid = (up: boolean): Level[][] =>
    [...Array<undefined>(n)].map((_, i) =>
      [...Array<undefined>(n)].map((__, j) => bound(i, j, up)),
    );
  return build(levels, grid(true), grid(false));
}

export const BOOLEAN = (): Scale => chain(['no', 'yes']);
