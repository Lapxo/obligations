import type { Lattice, MeetSemilattice, Poset } from './lattice.ts';
import { WideMask } from '../debit/masks.ts';
import type { Unit } from './types.ts';
import { fromScale, subsets } from './scale-lattice.ts';
import { chain, order } from './order.ts';

/**
 * The forms of the algebra: each is a lattice a lock may name by its form. An interval orders by containment, an
 * alphabet by inclusion; which of them a wire admits, and what each is called there, is the wire's lock, not this file.
 * Every form carries its points: n elements of its lattice, the same for the same seed, and the sample every reading
 * over forms takes; a lattice with no points to list cannot be checked, as one with no inhabitant cannot be met.
 */
export interface Interval {
  readonly lo: number;
  readonly hi: number;
}

export function intervals(lo: number, hi: number): Lattice<Interval> {
  const low = Math.min(lo, hi);
  const high = Math.max(lo, hi);
  return {
    bottom: { lo: high, hi: low },
    top: { lo: low, hi: high },
    leq(a, b) {
      if (a.lo > a.hi) return true;
      if (b.lo > b.hi) return false;
      return b.lo <= a.lo && a.hi <= b.hi;
    },
    meet(a, b) {
      return { lo: Math.max(a.lo, b.lo), hi: Math.min(a.hi, b.hi) };
    },
    join(a, b) {
      /* * ⚠️ AN EMPTY INTERVAL IS THE IDENTITY, and every empty one is the SAME * element — `leq` returns true from any crossed interval to anything. The * hull ignored that and read its ends anyway, so `{lo:5,hi:3}` and * `bottom` were equal and joined with `8..8` to `5..8` and `8..8`. * `axioms.test.ts` found it as `consistency.join`. */
      if (a.lo > a.hi) return b;
      if (b.lo > b.hi) return a;
      return { lo: Math.min(a.lo, b.lo), hi: Math.max(a.hi, b.hi) };
    },
    show(x) {
      return x.lo > x.hi ? 'empty' : `${x.lo}..${x.hi}`;
    },
    inhabited(x) {
      return x.lo <= x.hi;
    },
  };
}

export interface Alphabet {
  readonly polarity: 'permit' | 'forbid';
  readonly values: ReadonlySet<string>;
}

/* Finite alphabets by inclusion: permitting fewer values, or forbidding more, is narrower. The universe is open. */
export function alphabets(): Poset<Alphabet> {
  const within = (x: ReadonlySet<string>, y: ReadonlySet<string>): boolean => [...x].every((v) => y.has(v));
  return {
    leq(a, b) {
      if (a.polarity === 'permit' && b.polarity === 'permit') return within(a.values, b.values);
      if (a.polarity === 'forbid' && b.polarity === 'forbid') return within(b.values, a.values);
      if (a.polarity === 'permit') return [...a.values].every((v) => !b.values.has(v));
      return false;
    },
    show(x) {
      return `${x.polarity === 'forbid' ? 'not:' : ''}${[...x.values].sort().join('|')}`;
    },
  };
}

export type FormCount =
  | { readonly kind: 'finite'; readonly n: number }
  | { readonly kind: 'refused'; readonly why: string };

export interface Form<T = unknown> {
  readonly id: string;
  lattice(params: unknown): Lattice<T>;
  parse(params: unknown, demand: unknown): T;
  emit(params: unknown, value: T): unknown;
  count(folded: T, params?: unknown): FormCount;
  show(value: T): string;
  points(params: unknown, seed: number, n: number): readonly T[];
}

function form<T>(f: Form<T>): Form<T> {
  const held = { lattice: f.lattice, parse: f.parse, emit: f.emit, count: f.count, show: f.show, points: f.points };
  const lacking = Object.entries(held).find(([, fn]) => typeof fn !== 'function');
  if (lacking) throw new Error(`form \`${f.id}\` declared no ${lacking[0]}`);
  return f;
}

const rec = (x: unknown): Record<string, unknown> =>
  x !== null && typeof x === 'object' ? x as Record<string, unknown> : {};

function strings(x: unknown): string[] {
  return Array.isArray(x) ? x.map(String) : [];
}

const drawn = (seed: number): (() => number) => {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const picked = <T>(draw: () => number, xs: readonly T[]): T => xs[Math.floor(draw() * xs.length)]!;

function bandCount(levels: string[], folded: Unit): FormCount {
  if (levels.length === 0) return { kind: 'refused', why: 'a ladder with no levels cannot be counted' };
  const c = chain(levels);
  const f = c.rank(folded.floor);
  const cl = c.rank(folded.ceiling);
  if (!c.leq(f, cl)) return { kind: 'finite', n: 0 };
  const n = levels.filter((_, i) => c.leq(f, i) && c.leq(i, cl)).length;
  return { kind: 'finite', n };
}

const BAND = {
  parse(this: Form<Unit>, params: unknown, demand: unknown): Unit {
    const L = this.lattice(params);
    const d = rec(demand);
    return {
      subject: String(d.subject ?? ''),
      floor: String(d.floor ?? L.top.floor),
      ceiling: String(d.ceiling ?? L.top.ceiling),
    };
  },
  emit(_params: unknown, value: Unit) {
    return { subject: value.subject, floor: value.floor, ceiling: value.ceiling };
  },
  count(folded: Unit, params?: unknown): FormCount {
    return bandCount(strings(rec(params).levels), folded);
  },
  points(this: Form<Unit>, params: unknown, seed: number, n: number): readonly Unit[] {
    const L = this.lattice(params);
    const levels = strings(rec(params).levels);
    const draw = drawn(seed);
    const band = (floor: string, ceiling: string): Unit => ({ subject: '', floor, ceiling });
    return Array.from({ length: n }, () => {
      const [a, b] = [picked(draw, levels), picked(draw, levels)];
      return [band(a, b), band(b, a)].find((x) => L.inhabited(x)) ?? band(a, a);
    });
  },
};

export const ladderForm: Form<Unit> = form({
  id: 'ladder',
  lattice(params) {
    const levels = strings(rec(params).levels);
    if (levels.length === 0) throw new Error('ladder needs levels');
    return fromScale(chain(levels));
  },
  ...BAND,
  show(value) {
    return value.floor === value.ceiling ? value.floor : `${value.floor}..${value.ceiling}`;
  },
});

export const alphabetForm: Form<WideMask> = form({
  id: 'alphabet',
  lattice(params) {
    return subsets(strings(rec(params).tokens));
  },
  parse(params, demand) {
    const tokens = strings(rec(params).tokens);
    const d = rec(demand);
    const want = d.want !== undefined ? strings(d.want) : tokens;
    return WideMask.fromTokens(tokens, new Set(want));
  },
  emit(params, value) {
    return { want: value.members(strings(rec(params).tokens)) };
  },
  count(folded) {
    return { kind: 'finite', n: folded.size() };
  },
  show(value) {
    return `${value.size()}`;
  },
  points(params, seed, n) {
    const tokens = strings(rec(params).tokens);
    const draw = drawn(seed);
    return Array.from({ length: n }, () => WideMask.fromTokens(tokens, new Set(tokens.filter(() => draw() < 0.5))));
  },
});

export const continuousForm: Form<{ lo: number; hi: number }> = form({
  id: 'continuous',
  lattice(params) {
    const p = rec(params);
    return intervals(Number(p.lo ?? 0), Number(p.hi ?? 1));
  },
  parse(params, demand) {
    const L = this.lattice(params) as MeetSemilattice<{ lo: number; hi: number }>;
    const d = rec(demand);
    return {
      lo: d.lo === undefined ? L.top.lo : Number(d.lo),
      hi: d.hi === undefined ? L.top.hi : Number(d.hi),
    };
  },
  emit(_params, value) {
    return { lo: value.lo, hi: value.hi };
  },
  count() {
    return { kind: 'refused', why: 'a continuous band has no count; prefer not to exist over inventing one' };
  },
  show(value) {
    return value.lo > value.hi ? 'empty' : `${value.lo}..${value.hi}`;
  },
  points(params, seed, n) {
    const p = rec(params);
    const lo = Number(p.lo ?? 0);
    const hi = Number(p.hi ?? 1);
    const draw = drawn(seed);
    const at = (): number => lo + Math.round(draw() * (hi - lo));
    return Array.from({ length: n }, () => ({ lo: at(), hi: at() }));
  },
});

export const latticeForm: Form<Unit> = form({
  id: 'lattice',
  lattice(params) {
    const p = rec(params);
    const levels = strings(p.levels);
    const leq = p.leq;
    if (levels.length && leq) return fromScale(order(levels, leq as boolean[][]));
    throw new Error('lattice needs levels+leq');
  },
  ...BAND,
  show(value) {
    return `${value.floor}..${value.ceiling}`;
  },
});

export const FORM_IMPLEMENTATIONS: ReadonlyArray<Form> = [ladderForm, alphabetForm, continuousForm, latticeForm];
export const FORMS: Form<unknown>[] = [...FORM_IMPLEMENTATIONS];
