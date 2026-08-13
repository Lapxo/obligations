import { UnitError } from './errors';
import type { Scale, Level, State, Unit } from './types';

/**
 * THE FAST REPRESENTATION: one opinion as two numbers.
 *
 * Instead of asking "what is the highest floor and the lowest ceiling", ask
 * every STEP of the scale two yes/no questions: is this step demanded, and
 * is it permitted? Those two answers combine one step at a time — demanded
 * by OR, permitted by AND — so an opinion becomes two bitmasks and combining
 * any number of them is `|` and `&`.
 *
 * OR and AND do not care what order things arrive in, so neither does the
 * answer.
 *
 * ## What it buys beyond speed
 *
 * A register of booleans answers "is there a conflict". This answers
 * **which**, for free: `demand & ~limit` is exactly the set of steps that
 * collide, in one operation. Nothing has to be worked out again to say what
 * to fix.
 *
 * ## It is not a summary
 *
 * `pack` and `unpack` are exact inverses on every well-formed opinion, so
 * nothing is lost by working in this form. The shared test files check it by
 * exhaustion rather than by argument.
 *
 * ## The one place this surface is narrower than others
 *
 * JavaScript's bitwise operators work on 32 bits, so a scale may carry at
 * most 32 steps here. A wider one is REFUSED, never truncated — steps
 * dropped past the thirty-second would read as "no conflict", which is the
 * worst available way to be wrong. A refusal is never a wrong answer; a
 * truncation is.
 */

/** How many debits fit. Bounded by JavaScript's 32-bit bitwise operators. */
export const WIDTH = 32;

/** One opinion, packed: what it insists on, and what it tolerates. */
export interface Packed {
  readonly demand: number;
  readonly limit: number;
}

/**
 * A scale prepared for packing.
 *
 * The debit list and the all-ones mask are computed once. Doing it per
 * opinion would put the expensive part back in the hot loop, which is the
 * usual way a fast representation ends up slower than what it replaced.
 */
export interface Packer {
  readonly width: number;
  /** Every bit set: the identity of composition. */
  free(): Packed;
  /** The only place the scale's tables are consulted. */
  pack(u: Unit): Packed;
  /** Read bounds back out. Exact, not approximate. */
  unpack(subject: string, p: Packed): Unit;
  /** The state, without touching the scale. */
  state(p: Packed): State;
  /** Which debits collide, in the caller's own words. */
  clashing(p: Packed): string[];
  /**
   * The debits at or below a level. Resolve once per level, then reuse.
   */
  maskOf(level: string): number;
  /**
   * MAY this happen at this level? Two bit tests, no unpacking.
   *
   * A different question from `clashes`, and conflating them is easy: a
   * collision asks whether the promises can hold together, this asks whether
   * a particular level is inside what they left. An opinion of "nothing above
   * the bottom" does not collide with anything and permits nothing, so a
   * caller that only checked for collisions would read it as allowed.
   *
   * `floor ≤ L` because every demanded debit is at or below `L`;
   * `L ≤ ceiling` because every debit at or below `L` is permitted.
   */
  accepts(p: Packed, mask: number): boolean;
}

/** Demanded and not permitted — the collision, as a set, in one operation. */
export const clashes = (p: Packed): number => p.demand & ~p.limit;

export const isConflict = (p: Packed): boolean => clashes(p) !== 0;

/**
 * How many debits the collision consumes. Free — the bits are already there.
 */
export function debitsOwed(p: Packed): number {
  let bits = clashes(p);
  let n = 0;
  while (bits !== 0) {
    bits &= bits - 1;
    n++;
  }
  return n;
}

/** Compose two. One OR and one AND. */
export const and = (a: Packed, b: Packed): Packed => ({
  demand: a.demand | b.demand,
  limit: a.limit & b.limit,
});

/**
 * Fold many into one.
 *
 * Deliberately NOT `all.reduce(and)`. That allocates one object per opinion,
 * and measured on a four-opinion check it left the packed path only twice as
 * fast as walking the scale — the allocation ate the whole advantage. Two
 * locals and one object at the end is the same arithmetic and about four
 * times the throughput.
 */
export const composePacked = (free: Packed, all: Iterable<Packed>): Packed => {
  let demand = free.demand;
  let limit = free.limit;
  for (const p of all) {
    demand |= p.demand;
    limit &= p.limit;
  }
  return { demand, limit };
};

/**
 * Prepare a scale. Refuses one too wide to hold, rather than silently
 * dropping the debits past the thirty-second.
 */
export function packer(c: Scale): Packer {
  const debits: Level[] = c.debits();
  if (debits.length > WIDTH) {
    throw new UnitError(
      'MALFORMED',
      `this scale has ${debits.length} debits, more than the ${WIDTH} that fit`,
      { debits: debits.length, width: WIDTH },
    );
  }
  // `1 << 32` is 1 in JavaScript, not 0 — the shift wraps. The full mask has
  // to be written out rather than computed, or a 32-debit scale would come
  // back with a mask of zero and read as FORBIDDEN everywhere.
  const all = debits.length === WIDTH ? -1 : (1 << debits.length) - 1;

  const joinOf = (mask: number): Level =>
    debits.reduce(
      (acc, j, bit) => ((mask & (1 << bit)) !== 0 ? c.higher(acc, j) : acc),
      c.bottomIx,
    );

  return {
    width: debits.length,
    free: () => ({ demand: 0, limit: all }),

    pack(u: Unit): Packed {
      const f = c.rank(u.floor);
      const cl = c.rank(u.ceiling);
      let demand = 0;
      let limit = 0;
      debits.forEach((j, bit) => {
        if (c.leq(j, f)) demand |= 1 << bit;
        if (c.leq(j, cl)) limit |= 1 << bit;
      });
      return { demand, limit };
    },

    unpack: (subject: string, p: Packed): Unit => ({
      subject,
      floor: c.levels[joinOf(p.demand)],
      ceiling: c.levels[joinOf(p.limit)],
    }),

    state(p: Packed): State {
      if (isConflict(p)) return 'CONFLICT';
      if (p.demand !== 0) return 'REQUIRED';
      if (p.limit !== all) return 'FORBIDDEN';
      return 'FREE';
    },

    clashing: (p: Packed): string[] =>
      debits.filter((_, bit) => (clashes(p) & (1 << bit)) !== 0).map((j) => c.levels[j]),

    maskOf(level: string): number {
      const l = c.rank(level);
      let m = 0;
      debits.forEach((j, bit) => {
        if (c.leq(j, l)) m |= 1 << bit;
      });
      return m;
    },

    accepts: (p: Packed, mask: number): boolean =>
      (p.demand & ~mask) === 0 && (mask & ~p.limit) === 0,
  };
}

/**
 * MANY opinions, laid out the way the machine wants them.
 *
 * Build it once per scale and reuse it: the ranks, the lookups and the
 * allocation all happen here, and a check afterwards is two array reads and
 * two bit operations.
 *
 * Two flat arrays, not an array of objects. That is not style — an array of
 * objects means chasing a pointer per opinion, and it costs more than the
 * arithmetic it surrounds.
 */
export interface Register {
  readonly size: number;
  /** Compose a selection of rows — the hot path. */
  fold(rows: ArrayLike<number>): Packed;
  /** Compose every row. */
  foldAll(): Packed;
  /**
   * The colliding debits of a selection, as a mask — no object built.
   *
   * This is the hot question ("may this happen, and if not what stops it"),
   * and answering it without allocating is worth its own entry: `fold` has
   * to build a `Packed` to return, and on a four-opinion check that
   * allocation is about a third of the remaining time.
   *
   * Zero means no collision. Non-zero names them: pass it to `Packer.clashing`
   * only when something is actually wrong, which on the happy path is never.
   */
  clashesOf(rows: ArrayLike<number>): number;
}

/**
 * Lay a set of opinions out for repeated composition.
 *
 * Build it once per scale and reuse it: everything expensive — the ranks,
 * the leq lookups, the allocation — happens here, and a check afterwards is
 * two machine words per opinion.
 */
export function register(pk: Packer, opinions: readonly Packed[]): Register {
  const n = opinions.length;
  const demand = new Int32Array(n);
  const limit = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    demand[i] = opinions[i].demand;
    limit[i] = opinions[i].limit;
  }
  const free = pk.free();
  return {
    size: n,
    fold(rows: ArrayLike<number>): Packed {
      let d = free.demand;
      let l = free.limit;
      for (let k = 0; k < rows.length; k++) {
        const i = rows[k];
        // A row nobody registered would read `undefined` out of the array,
        // and `x & undefined` is 0 — so the fold would come back permitting
        // NOTHING, with confidence, instead of refusing. Silent and wrong is
        // the one outcome worth spending a bounds check on.
        if (i < 0 || i >= n) {
          throw new UnitError('UNKNOWN_ROW', `row ${i} is not in this register`, {
            row: i,
            size: n,
          });
        }
        d |= demand[i];
        l &= limit[i];
      }
      return { demand: d, limit: l };
    },
    foldAll(): Packed {
      let d = free.demand;
      let l = free.limit;
      for (let i = 0; i < n; i++) {
        d |= demand[i];
        l &= limit[i];
      }
      return { demand: d, limit: l };
    },
    clashesOf(rows: ArrayLike<number>): number {
      let d = free.demand;
      let l = free.limit;
      for (let k = 0; k < rows.length; k++) {
        const i = rows[k];
        if (i < 0 || i >= n) {
          throw new UnitError('UNKNOWN_ROW', `row ${i} is not in this register`, {
            row: i,
            size: n,
          });
        }
        d |= demand[i];
        l &= limit[i];
      }
      return d & ~l;
    },
  };
}

/**
 * REACHING MEANS HOLDING, precomputed.
 *
 * `effective` in `reach.ts` walks the graph and composes on every call. That
 * is the right shape when the graph is a question; it is the wrong shape when
 * the graph is a fact. A delegation graph changes when somebody edits it —
 * rarely — and gets asked about on every request.
 *
 * So the closure is folded ONCE, at build time, into two flat arrays. A check
 * afterwards is an index and two reads: the reach, the composition and the
 * conflict test have all already happened.
 *
 * The saving is not the bit twiddling. It is that a viewpoint reaching k
 * others costs k ORs per check in the folded-per-call shape and zero here —
 * and k is exactly what grows when somebody adds a layer of delegation, which
 * is the moment a permission system is least able to afford getting slower.
 */
export interface Effective {
  readonly size: number;
  /** The row for a viewpoint, or `-1`. Resolve once, then use the row. */
  row(name: string): number;
  /** The colliding debits at a row — no object built. Zero means none. */
  clashesAt(row: number): number;
  packedAt(row: number): Packed;
  /**
   * What the closure walked to get there.
   *
   * Kept because it is the answer to the only question that matters after a
   * collision is found: WHERE did this viewpoint get the opinion that broke
   * it. A conflict with no route is a fact nobody can act on.
   */
  via(name: string): readonly string[];
}

/**
 * Fold every viewpoint's whole reach.
 *
 * `rowsOf` hands back the rows a viewpoint holds DIRECTLY; the closure adds
 * everything it can reach. What a viewpoint is, and what reaching means in
 * the caller's world, stays the caller's business.
 */
export function closure(
  reg: Register,
  names: readonly string[],
  reachOf: (name: string) => readonly string[],
  rowsOf: (name: string) => ArrayLike<number>,
): Effective {
  const index = new Map<string, number>();
  const demand = new Int32Array(names.length);
  const limit = new Int32Array(names.length);
  const routes: (readonly string[])[] = [];

  names.forEach((name, i) => {
    index.set(name, i);
    const seen = reachOf(name);
    routes.push(seen);
    const rows: number[] = [];
    for (const holder of seen) {
      const held = rowsOf(holder);
      for (let k = 0; k < held.length; k++) rows.push(held[k]);
    }
    const folded = reg.fold(rows);
    demand[i] = folded.demand;
    limit[i] = folded.limit;
  });

  return {
    size: names.length,
    row: (name) => index.get(name) ?? -1,
    clashesAt: (row) => demand[row] & ~limit[row],
    packedAt: (row) => ({ demand: demand[row], limit: limit[row] }),
    via: (name) => routes[index.get(name) ?? -1] ?? [],
  };
}
