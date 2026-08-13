import { UnitError } from './errors';
import type { Level, Localised, Piece, Priced, Scale, Worth } from './types';

/**
 * THE PRICE OF SETTLING FOR LESS.
 *
 * Two numbers, and neither one mentions what is being ordered:
 *
 * ```text
 *   dropTo(from, to)   what you give up by answering at a lower level
 *   defect(a, b)       what neither side holds on its own
 * ```
 *
 * They need a scale and a way to say what a level is WORTH — records
 * reached, seats, minutes, whatever the thing is sold by. That is all, so a
 * caller with levels and a cost per level gets the same two numbers as
 * anything else, with the same guarantee attached.
 *
 * The guarantee: on a plain ladder — every level above the last — `defect`
 * is ALWAYS zero, whatever you decide a level is worth. Nothing is left
 * over, so there is nothing to work out and this library can answer on its
 * own. That is because on a ladder any two levels can be compared; it is not
 * about the arithmetic being simple, and a scale can be perfectly ordinary
 * in every other way and still leave something over.
 *
 * What nobody can do here is price a scale whose levels are groups found in
 * the data and whose worth has to be measured: there is nothing to call,
 * only a scan.
 */

/** What answering at `m` instead of `u` gives up. */
export const dropTo = (value: Worth, u: Level, m: Level): number => value(u) - value(m);

/** What neither side holds. Zero exactly when the two sit on one ladder. */
export function defect(c: Scale, value: Worth, a: Level, b: Level): number {
  return value(a) + value(b) - value(c.higher(a, b)) - value(c.lower(a, b));
}

/**
 * Both prices of a pair. TWO measurements.
 *
 * `gated` is `coarse − gain` — arithmetic on the other two, not a third
 * measurement. It is returned for convenience and named in `derived`,
 * because presenting a subtraction as evidence is a mistake worth not
 * repeating.
 */
export function price(c: Scale, value: Worth, u: Level, w: Level): Priced {
  const coarse = dropTo(value, u, c.lower(u, w));
  const gain = defect(c, value, u, w);
  return { coarse, gain, gated: coarse - gain, derived: ['gated'] };
}

/** How far the two closure checks may drift before a piece counts as lost. */
const SLACK = 1e-6;

/**
 * WHERE the price is.
 *
 * One number about a whole population says how bad it is and never where.
 * Splitting it over the pieces says where, and what makes the split trustworthy is not that somebody computed it — it is the
 * law it is checked against:
 *
 * ```text
 *   coarse = Σ  mass · coarse
 *   gain   = Σ  mass · gain
 * ```
 *
 * A breakdown that does not add back is not a breakdown, it is decoration. A
 * caller that drops a piece would otherwise report a smaller, friendlier
 * number with no way to notice — so this THROWS instead of returning one.
 */
export function localise(
  pieces: readonly Piece[],
  total: { coarse: number; gain: number },
): Localised {
  // FIRST, because everything below compares, and every comparison with
  // `NaN` is false — including the ones meant to reject it. `Math.abs(NaN -
  // 1) > SLACK` is `false`, so a single `NaN` sailed through both checks and
  // came out the other side as a reconciled total. An empty block gives a
  // mass of `0/0`, so this is not an exotic input.
  for (const p of pieces) {
    for (const field of ['mass', 'coarse', 'gain'] as const) {
      if (!Number.isFinite(p[field])) {
        throw new UnitError('NOT_FINITE', `\`${p.name}\` has a ${field} that is not finite`, {
          name: p.name,
          field,
          value: p[field],
        });
      }
    }
  }
  for (const field of ['coarse', 'gain'] as const) {
    if (!Number.isFinite(total[field])) {
      throw new UnitError('NOT_FINITE', `the total ${field} is not finite`, { field });
    }
  }
  const mass = pieces.reduce((a, p) => a + p.mass, 0);
  if (pieces.length === 0 || Math.abs(mass - 1) > SLACK) {
    throw new UnitError('MALFORMED', `the pieces cover ${mass}, not the whole`, { mass });
  }
  const rebuilt = {
    coarse: pieces.reduce((a, p) => a + p.mass * p.coarse, 0),
    gain: pieces.reduce((a, p) => a + p.mass * p.gain, 0),
  };
  for (const field of ['coarse', 'gain'] as const) {
    if (Math.abs(total[field] - rebuilt[field]) > SLACK) {
      throw new UnitError(
        'MALFORMED',
        `the pieces rebuild ${field} as ${rebuilt[field]}, not ${total[field]}`,
        { field, total: total[field], fromParts: rebuilt[field] },
      );
    }
  }
  // Weighted by mass: a tiny piece with a huge local price is not where the
  // problem is.
  const weight = (p: Piece): number => p.mass * p.coarse;
  const worst = [...pieces]
    .filter((p) => p.coarse > 1e-12)
    .sort((a, b) => weight(b) - weight(a))[0];
  return {
    pieces,
    total: rebuilt,
    worst: worst ?? null,
    concentration:
      worst !== undefined && rebuilt.coarse > 1e-12 ? weight(worst) / rebuilt.coarse : 0,
  };
}

/**
 * WHY there is something left over — decided before you say what a level is
 * worth.
 *
 * Combining two statements gives a lower floor and a higher ceiling than
 * either had. How much lower and how much higher are the two **slacks**:
 *
 * ```text
 *   up     how far the combined ceiling reaches past the higher of the two
 *   down   how far the combined floor falls below the lower of the two
 * ```
 *
 * They decide the sign of what is left over, whatever you decide a level is
 * worth:
 *
 * ```text
 *   up = 0 and down = 0   nothing is left over, for ANY way of valuing levels
 *   down = 0              what is left over has one known sign
 *   up = 0                it has the other
 * ```
 *
 * The first line is the useful one. It is a property of the SCALE and the two
 * statements alone — no valuation, no measurement, no scan. On a plain ladder
 * both slacks are always zero, which is why a ladder never leaves anything
 * over and this library can answer on its own.
 *
 * `null` when the scale cannot count steps between those levels, which is
 * exactly when "how far" has no single answer.
 */
export function slack(c: Scale, a: Level, b: Level): { up: number; down: number } | null {
  const bottom = c.bottomIx;
  const height = (x: Level): number | null => c.intervalHeight(bottom, x);
  const [ha, hb, hj, hm] = [height(a), height(b), height(c.higher(a, b)), height(c.lower(a, b))];
  if (ha === null || hb === null || hj === null || hm === null) return null;
  return { up: hj - Math.max(ha, hb), down: Math.min(ha, hb) - hm };
}

/**
 * EVERY OUTCOME THIS SCALE CAN PRODUCE.
 *
 * Walk every pair of levels, work out what combining them leaves over, and
 * report the distinct answers. Two things fall out, and both are questions
 * about the SCALE rather than about any particular statement:
 *
 * ```text
 *   band         the lowest and highest anything can be
 *   degeneracy   pairs ÷ distinct answers — how much lands on the same value
 * ```
 *
 * A scale with three distinct outcomes behaves very differently from one with
 * three hundred, and you cannot tell which you have by reading the level
 * names. High degeneracy means most pairs are indistinguishable by price — so
 * a report that ranks by it is ranking mostly noise.
 *
 * `values` are rounded to `places` decimals before being counted as distinct,
 * because two ways of reaching the same answer differ in the last bits. The
 * rounding is stated rather than hidden: change it and the count changes.
 */
export function spectrum(
  c: Scale,
  worth: Worth,
  places = 9,
): { values: number[]; pairs: number; band: { low: number; high: number }; degeneracy: number } {
  const seen = new Set<number>();
  let pairs = 0;

  for (let a = 0; a < c.levels.length; a++) {
    for (let b = a; b < c.levels.length; b++) {
      const left = defect(c, worth, a, b);
      if (!Number.isFinite(left)) {
        throw new UnitError('NOT_FINITE', 'this way of valuing levels is not finite');
      }
      pairs++;
      seen.add(Number(left.toFixed(places)));
    }
  }

  // The band is the range of the values REPORTED, not of the raw ones. Taking
  // the raw min and max gave a ladder a band of ±1e-16 while its value list
  // was a single zero — the same answer, told two ways.
  const values = [...seen].sort((x, y) => x - y);
  return {
    values,
    pairs,
    band: { low: values[0] ?? 0, high: values[values.length - 1] ?? 0 },
    degeneracy: values.length > 0 ? pairs / values.length : 0,
  };
}
