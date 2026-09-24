import { chain, vacuityOf } from '@lapxo/obligations';
import type { Level, Scale } from '@lapxo/obligations';
import { load } from './vectors-harness.ts';

type Valuation = (level: Level) => number;
type Predicate = (c: Scale, value: Valuation) => boolean;

const predicates: Readonly<Record<string, Predicate>> = {
  above: (c, value) => value(c.topIx) > value(c.bottomIx),
  nonNegative: (c, value) => c.levels.every((_, i) => value(i) >= 0),
  blind: () => true,
};

test('NEGATIVE CONTROL: vacuityOf — the checker can say DISCRIMINATES, and it says it with witnesses', () => {
  const v = load('vacuity');
  const levels = chain(v.chain);
  for (const c of v.cases) {
    const predicate = predicates[c.predicate] ?? (() => false);
    const r = vacuityOf(c.name, 'chain', levels, predicate);
    compare(r.verdict, c.verdict, c.name);
    if (r.witnesses === undefined) continue;
    const seen = r.witnesses;
    compare([predicate(levels, (x) => seen.yes[x] ?? 0), predicate(levels, (x) => seen.no[x] ?? 0)], [true, false], `${c.name}: a witness on each side`);
  }
});
