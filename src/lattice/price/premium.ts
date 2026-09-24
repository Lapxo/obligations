import type { Level, Scale } from '../types.ts';

const SLACK = 1e-12;

type Valuation = (level: Level) => number;

export function c_n(n: number): number {
  return Math.log2(n) - 2 + 2 / n;
}

export function costOfState(
  c: Scale,
  value: Valuation,
  u: Level,
  w: Level,
  s: Level,
): { shortfall: number; overshoot: number } {
  return {
    shortfall: value(u) - value(c.lower(u, s)),
    overshoot: value(s) - value(c.lower(s, w)),
  };
}

const costAt = (c: Scale, value: Valuation, u: Level, w: Level, s: Level): number => {
  const { shortfall, overshoot } = costOfState(c, value, u, w, s);
  return shortfall + overshoot;
};

type Search = (c: Scale, value: Valuation, u: Level, w: Level) => { cost: number; at: Level };

function cheapest(
  c: Scale,
  value: Valuation,
  u: Level,
  w: Level,
  visit: (take: (s: Level) => void) => void,
): { cost: number; at: Level } {
  let cost: number | undefined;
  let at = c.bottomIx;
  visit((s) => {
    const cs = costAt(c, value, u, w, s);
    if (cost === undefined || cs < cost) {
      cost = cs;
      at = s;
    }
  });
  return { cost: cost ?? costAt(c, value, u, w, at), at };
}

function eachPair(c: Scale, u: Level, w: Level, fn: (p: Level, q: Level) => void): void {
  for (let p = 0; p < c.levels.length; p++) {
    if (!c.leq(p, u)) continue;
    for (let q = 0; q < c.levels.length; q++) {
      if (!c.leq(q, w)) continue;
      fn(p, q);
    }
  }
}

export const best: Search = (c, value, u, w) => cheapest(c, value, u, w, (take) => {
  for (let s = 0; s < c.levels.length; s++) take(s);
});

export function gap(c: Scale, value: Valuation, u: Level, w: Level): number {
  const m = c.lower(u, w);
  let mx = value(m);
  eachPair(c, u, w, (p, q) => {
    const v = value(p) + value(q) - value(c.higher(p, q));
    if (v > mx) mx = v;
  });
  return mx - value(m);
}

export function premium(c: Scale, value: Valuation, u: Level, w: Level): number {
  return value(u) - value(c.lower(u, w)) - best(c, value, u, w).cost;
}

export function isSupermodular(c: Scale, value: Valuation): boolean {
  for (let x = 0; x < c.levels.length; x++) {
    for (let y = 0; y < c.levels.length; y++) {
      const ri = value(x) + value(y) - value(c.higher(x, y)) - value(c.lower(x, y));
      if (ri > SLACK) return false;
    }
  }
  return true;
}

function gapVanishes(c: Scale, value: Valuation): boolean {
  for (let a = 0; a < c.levels.length; a++) {
    for (let b = 0; b < c.levels.length; b++) {
      if (c.leq(a, b) && value(a) > value(b) + SLACK) return false;
    }
  }
  return isSupermodular(c, value);
}

export function pricesAnything(c: Scale, worth: Valuation): boolean {
  return !gapVanishes(c, worth);
}

export function collapses(c: Scale, value: Valuation, u: Level, w: Level, tol = 1e-9): boolean {
  const ri = value(u) + value(w) - value(c.higher(u, w)) - value(c.lower(u, w));
  return Math.abs(premium(c, value, u, w) - ri) <= tol;
}
