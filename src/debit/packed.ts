import { UnitError } from '../lattice/errors.ts';
import type { Scale, Level, State, Unit } from '../lattice/types.ts';

export const WIDTH = 32;

export interface Packed {
  readonly demanded: number;
  readonly permitted: number;
  readonly limiting: number;
  readonly required: number;
  readonly demand: number;
  readonly limit: number;
}

export const opinion = (
  demanded: number,
  permitted: number,
  limiting: number,
  required: number,
): Packed => ({
  demanded,
  permitted,
  limiting,
  required,
  demand: demanded,
  limit: permitted,
});

export interface Packer {
  readonly width: number;
  readonly joinWidth: number;
  readonly limitWidth: number;
  free(): Packed;
  pack(u: Unit): Packed;
  unpack(subject: string, p: Packed): Unit;
  state(p: Packed): State;
  clashing(p: Packed): string[];
  clashingLimits(p: Packed): string[];
  maskOf(level: string): number;
  accepts(p: Packed, mask: number): boolean;
  above(jBit: number): number;
  coherent(p: Packed): boolean;
}

const clashes = (p: Packed): number => p.demanded & ~p.permitted;

const dualClashes = (p: Packed): number => p.limiting & ~p.required;

const isConflict = (p: Packed): boolean => clashes(p) !== 0;

export const or = (a: Packed, b: Packed): Packed =>
  opinion(
    a.demanded & b.demanded,
    a.permitted | b.permitted,
    a.limiting & b.limiting,
    a.required | b.required,
  );

export const and = (a: Packed, b: Packed): Packed =>
  opinion(
    a.demanded | b.demanded,
    a.permitted & b.permitted,
    a.limiting | b.limiting,
    a.required & b.required,
  );

const ones = (n: number): number => (n === WIDTH ? -1 : (1 << n) - 1);

export function packer(c: Scale): Packer {
  const joins: Level[] = c.joins();
  const limits: Level[] = c.limits();
  if (joins.length > WIDTH || limits.length > WIDTH) {
    throw new UnitError(
      'MALFORMED',
      `this scale has ${joins.length} demand-debits and ${limits.length} ` +
        `limit-debits; each opinion holds at most ${WIDTH}`,
      { joins: joins.length, limits: limits.length, width: WIDTH },
    );
  }

  const allJ = ones(joins.length);
  const allM = ones(limits.length);

  const above: number[] = joins.map((j) => {
    let m = 0;
    limits.forEach((lim, bit) => {
      if (c.leq(j, lim)) m |= 1 << bit;
    });
    return m;
  });

  const miAboveAll = (jiMask: number): number => {
    let acc = allM;
    for (let bit = 0; bit < joins.length; bit++) {
      if ((jiMask & (1 << bit)) !== 0) acc &= above[bit];
    }
    return acc;
  };

  const jiBelowAll = (miMask: number): number => {
    let out = 0;
    for (let bit = 0; bit < joins.length; bit++) {
      if ((miMask & ~above[bit]) === 0) out |= 1 << bit;
    }
    return out;
  };

  const joinOf = (mask: number): Level =>
    joins.reduce((acc, j, bit) => ((mask & (1 << bit)) !== 0 ? c.higher(acc, j) : acc), c.bottomIx);

  return {
    width: joins.length,
    joinWidth: joins.length,
    limitWidth: limits.length,
    free: () => opinion(0, allJ, 0, allM),

    pack(u: Unit): Packed {
      const f = c.rank(u.floor);
      const cl = c.rank(u.ceiling);
      let demanded = 0;
      let permitted = 0;
      joins.forEach((j, bit) => {
        if (c.leq(j, f)) demanded |= 1 << bit;
        if (c.leq(j, cl)) permitted |= 1 << bit;
      });
      let limiting = 0;
      let required = 0;
      limits.forEach((m, bit) => {
        if (c.leq(cl, m)) limiting |= 1 << bit;
        if (c.leq(f, m)) required |= 1 << bit;
      });
      return opinion(demanded, permitted, limiting, required);
    },

    unpack: (subject: string, p: Packed): Unit => ({
      subject,
      floor: c.levels[joinOf(p.demanded)],
      ceiling: c.levels[joinOf(p.permitted)],
    }),

    state(p: Packed): State {
      if (isConflict(p)) return 'CONFLICT';
      if (p.demanded !== 0) return 'REQUIRED';
      if (p.permitted !== allJ) return 'FORBIDDEN';
      return 'FREE';
    },

    clashing: (p: Packed): string[] =>
      joins.filter((_, bit) => (clashes(p) & (1 << bit)) !== 0).map((j) => c.levels[j]),

    clashingLimits: (p: Packed): string[] =>
      limits.filter((_, bit) => (dualClashes(p) & (1 << bit)) !== 0).map((m) => c.levels[m]),

    maskOf(level: string): number {
      const l = c.rank(level);
      let m = 0;
      joins.forEach((j, bit) => {
        if (c.leq(j, l)) m |= 1 << bit;
      });
      return m;
    },

    accepts: (p: Packed, mask: number): boolean =>
      (p.demanded & ~mask) === 0 && (mask & ~p.permitted) === 0,

    above: (jBit: number): number => above[jBit] ?? 0,

    coherent(p: Packed): boolean {
      return (
        p.required === miAboveAll(p.demanded) &&
        p.limiting === miAboveAll(p.permitted) &&
        p.demanded === jiBelowAll(p.required) &&
        p.permitted === jiBelowAll(p.limiting)
      );
    },
  };
}

export function canonical(pk: Packer, p: Packed): Packed {
  return pk.pack(pk.unpack('', p));
}
