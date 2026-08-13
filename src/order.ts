import { UnitError } from './errors';
import type { Scale, Level, State } from './types';

/**
 * Build a scale from its two tables.
 *
 * `isLadder` and `isSimple` are computed here and never taken from the
 * caller. A caller that promised "this is a chain" and handed over something
 * else would otherwise get exact-looking answers about nothing.
 */
function build(levels: readonly string[], join: Level[][], meet: Level[][]): Scale {
  const n = levels.length;
  // A name is how a caller reaches a level, so two levels sharing one leaves
  // the other unreachable. It also made the two surfaces DISAGREE: Rust's
  // `rank` returned the first index and this one the last, and here that
  // broke `pack`/`unpack` being inverse — `unpack` can produce the
  // unreachable index, whose name ranks back to the other one.
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
  // A finite lattice always has a bottom and a top, and the checks above
  // proved this is one — so the fallbacks cannot run. They are kept because
  // `find` is typed as possibly-undefined, and marked because an unreachable
  // branch left unmarked drags the coverage number down and hides a real gap
  // somewhere else.
  /* istanbul ignore next -- unreachable: the constructor proved a bottom exists */
  const bottomIx = all.find((i) => all.every((j) => leq(i, j))) ?? 0;
  /* istanbul ignore next -- unreachable: the constructor proved a top exists */
  const topIx = all.find((i) => all.every((j) => leq(j, i))) ?? n - 1;

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

    debits: () =>
      all.filter(
        (j) =>
          j !== bottomIx &&
          all.filter((x) => x !== j && leq(x, j)).reduce((acc, x) => join[acc][x], bottomIx) !== j,
      ),

    // The mirror: a level that is not the lower of everything strictly above
    // it. On a plain ladder, every level below the top.
    limits: () =>
      all.filter(
        (m) =>
          m !== topIx &&
          all.filter((x) => x !== m && leq(m, x)).reduce((acc, x) => meet[acc][x], topIx) !== m,
      ),

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
          long.set(y, Math.max(long.get(y) ?? -Infinity, lx + 1));
          short.set(y, Math.min(short.get(y) ?? Infinity, sx + 1));
        }
      }
      const l = long.get(hi);
      // Different lengths mean the question was ill-posed, not that one of
      // the answers is the right one.
      return l !== undefined && l === short.get(hi) ? l : null;
    },
  };
}

/** A plain ladder, lowest first — where join and meet are max and min. */
export function chain(levels: readonly string[]): Scale {
  if (!Array.isArray(levels) || levels.length === 0) {
    throw new UnitError('EMPTY_CHAIN', 'a chain needs at least one level');
  }
  const n = levels.length;
  const grid = (f: (a: number, b: number) => number): Level[][] =>
    [...Array<undefined>(n)].map((_, i) => [...Array<undefined>(n)].map((__, j) => f(i, j)));
  return build(levels, grid(Math.max), grid(Math.min));
}

/**
 * Any scale: declare the ORDER and let the tables be derived. `leq[i][j]`
 * is `i ≤ j`.
 *
 * It earns its keep by refusing. A relation with no unique lowest common bound
 * is not a usable scale, and every law here would be quietly wrong on it — better
 * to fail at the declaration than to answer confidently about a scale that
 * does not exist.
 */
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

/** The shortest scale there is — and the one a boolean lives on. */
export const BOOLEAN = (): Scale => chain(['no', 'yes']);
