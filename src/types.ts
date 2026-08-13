/**
 * The shared shapes. Everything else in `src/` imports from here and nothing
 * imports back, which is the only structural rule this library has.
 */

/** The three a unit can be in, and the fourth composition can produce. */
export type State = 'FREE' | 'REQUIRED' | 'FORBIDDEN' | 'CONFLICT';

/** What the 4×4 envelope is allowed to say. Two cells are genuinely undecided. */
export type Outcome = State | 'REQUIRED_OR_CONFLICT';

/**
 * A position in a scale.
 *
 * A NAME, never a height. Nothing in this package compares two of these with
 * `<`: order is whatever the scale's join says it is, which is the only
 * reason any of this works off a chain.
 */
export type Level = number;

/**
 * The scale: the levels this kind of thing comes in, and how they relate.
 *
 * Usually a plain ladder — each level above the last. It does not have to
 * be: two levels can sit side by side with neither above the other, and
 * everything still works. `higher(a, b)` is the lowest level at or above
 * both; `lower(a, b)` is the highest at or below both.
 *
 * `isLadder` and `isSimple` are WORKED OUT from the scale itself, never
 * taken from the caller. They buy different things — a plain ladder means
 * combining costs nothing to work out, simple means the demand side stays
 * predictable — and treating them as the same thing is a mistake this
 * project made once and now tests against.
 */
export interface Scale {
  readonly levels: readonly string[];
  readonly isLadder: boolean;
  readonly isSimple: boolean;
  readonly bottomIx: Level;
  readonly topIx: Level;
  readonly bottom: string;
  readonly top: string;
  leq(a: Level, b: Level): boolean;
  higher(a: Level, b: Level): Level;
  lower(a: Level, b: Level): Level;
  /** A level nobody declared is an error, never a guess. */
  rank(level: string): Level;
  stateOf(floor: Level, ceiling: Level): State;
  /** The steps — computed, not "everything but the bottom". */
  debits(): Level[];
  /**
   * The steps a statement can LIMIT. The other half, and NOT the same set: on
   * a plain ladder it is every level below the top.
   *
   * A statement names some of each, and both halves are what `complexity`
   * counts.
   */
  limits(): Level[];
  /** `null` when the interval is not graded and a count would be a coin flip. */
  intervalHeight(lo: Level, hi: Level): number | null;
}

/** One opinion about one subject: the levels it finds acceptable. */
export interface Unit {
  readonly subject: string;
  readonly floor: string;
  readonly ceiling: string;
}

/** How much a level is worth. Monotone, and the caller's business. */
export type Worth = (level: Level) => number;

/** What a boolean can say about a unit, and what it drops saying it. */
export type BoolView =
  | { readonly kind: 'exactly'; readonly value: boolean }
  | { readonly kind: 'lossy'; readonly value: boolean; readonly lost: string }
  | { readonly kind: 'unsayable'; readonly lost: string };

/**
 * What a collision costs. TWO measurements; `gated` is `coarse − gain` and
 * says so in `derived`, because presenting a subtraction as evidence is a
 * mistake worth not repeating.
 */
export interface Priced {
  readonly coarse: number;
  readonly gain: number;
  readonly gated: number;
  readonly derived: readonly ['gated'];
}

/** One piece of the whole, and what it contributes. */
export interface Piece {
  readonly name: string;
  readonly mass: number;
  readonly coarse: number;
  readonly gain: number;
}

/** WHERE the price is, once it has been checked against the total. */
export interface Localised {
  readonly pieces: readonly Piece[];
  readonly total: { readonly coarse: number; readonly gain: number };
  readonly worst: Piece | null;
  readonly concentration: number;
}

/** The methods a claim can rest on, weakest first. An ORDER, not a set. */
export type Method = 'declared' | 'statistics' | 'sample' | 'exact';

/** `[from, to]`. What a viewpoint IS stays the caller's business. */
export type Edge = readonly [string, string];

/** What a caller is asking for, when asking whether this surface can answer. */
export interface Request {
  readonly ask?: string;
  readonly groupings?: readonly string[];
  readonly scale?: 'declared' | 'measured';
}
