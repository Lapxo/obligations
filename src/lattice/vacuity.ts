import type { Level, Scale } from './types.ts';

type Valuation = (level: Level) => number;

import { unitStream } from '../debit/shuffle.ts';

export interface Verdict {
  readonly predicate: string;
  readonly structure: string;
  readonly samples: number;
  readonly yes: number;
  readonly no: number;
  readonly verdict: 'CONSTANT' | 'DISCRIMINATES' | 'INDEPENDENT';
  readonly witnesses?: { readonly yes: readonly number[]; readonly no: readonly number[] };
}

export interface VacuityOptions {
  readonly samples?: number;
  readonly spread?: number;
  readonly monotone?: boolean;
}

export function isMonotone(c: Scale, value: Valuation): boolean {
  for (let a = 0; a < c.levels.length; a++) {
    for (let b = 0; b < c.levels.length; b++) {
      if (c.leq(a, b) && value(a) > value(b) + 1e-12) return false;
    }
  }
  return true;
}

export function vacuityOf(
  predicate: string,
  structure: string,
  c: Scale,
  test: (c: Scale, value: Valuation) => boolean,
  opts: VacuityOptions = {},
): Verdict {
  const samples = opts.samples ?? 2000;
  const spread = opts.spread ?? 20;
  const next = unitStream(1);
  const n = c.levels.length;

  let yes = 0;
  let no = 0;
  let sawYes: number[] | undefined;
  let sawNo: number[] | undefined;
  let read = false;

  for (let i = 0; i < samples; i++) {
    const v: number[] = [];
    for (let k = 0; k < n; k++) v.push(Math.round(next() * spread));
    if (opts.monotone) {
      v.sort((a, b) => a - b);
      if (!isMonotone(c, (x) => v[x]!)) continue;
    }
    const probe: Valuation = (x) => {
      read = true;
      return v[x]!;
    };
    if (test(c, probe)) {
      yes += 1;
      if (!sawYes) sawYes = [...v];
    } else {
      no += 1;
      if (!sawNo) sawNo = [...v];
    }
  }

  const both = yes > 0 && no > 0;
  return {
    predicate,
    structure,
    samples: yes + no,
    yes,
    no,
    verdict: both ? 'DISCRIMINATES' : read ? 'CONSTANT' : 'INDEPENDENT',
    ...(both ? { witnesses: { yes: sawYes!, no: sawNo! } } : {}),
  };
}
