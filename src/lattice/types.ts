export type State = 'FREE' | 'REQUIRED' | 'FORBIDDEN' | 'CONFLICT';

export type DebitOutcome = State | 'REQUIRED_OR_CONFLICT';

export type Level = number;

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
  rank(level: string): Level;
  stateOf(floor: Level, ceiling: Level): State;
  joins(): Level[];
  limits(): Level[];
  debits(): Level[];
  intervalHeight(lo: Level, hi: Level): number | null;
}

export interface Unit {
  readonly subject: string;
  readonly floor: string;
  readonly ceiling: string;
}

export type BoolView =
  | { readonly kind: 'exactly'; readonly value: boolean }
  | { readonly kind: 'lossy'; readonly value: boolean; readonly lost: string }
  | { readonly kind: 'unsayable'; readonly lost: string };

export type Method = 'declared' | 'statistics' | 'sample' | 'exact';

export type MeasureForm = 'ladder' | 'alphabet' | 'continuous';

export type Edge = readonly [string, string];
