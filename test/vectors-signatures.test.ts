import { alphabets, foldSigned, intervals } from '@lapxo/obligations';
import type { Alphabet, Interval, Poset } from '@lapxo/obligations';
import { load } from './vectors-harness.ts';

type Raw = { permit?: string[]; forbid?: string[]; lo?: number; hi?: number };

function standingOf<T>(L: Poset<T>, values: readonly T[], fork: boolean, name: string): number[][] {
  const folded = foldSigned(L, values);
  compare(folded.fork, fork, `${name}: fork`);
  return folded.standing.map((c) => [...folded.classes[c]!].sort((a, b) => a - b));
}

test('T19-signatures-fold — vectors/signatures: signed values fold by the cell order and never replace each other', () => {
  const v = load('signatures');
  for (const k of v.cases) {
    const got = k.form === 'interval'
      ? standingOf<Interval>(intervals(-Infinity, Infinity), k.values.map((x: Raw) => ({ lo: x.lo!, hi: x.hi! })), k.fork, k.name)
      : standingOf<Alphabet>(
        alphabets(),
        k.values.map((x: Raw) => ({ polarity: x.forbid ? 'forbid' as const : 'permit' as const, values: new Set(x.forbid ?? x.permit ?? []) })),
        k.fork,
        k.name,
      );
    compare(got, k.standing, `${k.name}: standing`);
  }
});
