import { join } from 'node:path';
import { permutationBlind, permute } from '@lapxo/obligations';
import { load } from './vectors-harness.ts';

test('permutationBlind — shuffle — a control that is one, and the two ways it stops being one', () => {
  const v = load('shuffle');
  for (const c0 of v.cases) {
    const xs = c0.values as string[];

    if (c0.kind === 'identity') {
      for (const salt of c0.salts as number[]) compare(permute(xs, salt), xs);
    }

    if (c0.kind === 'varies') {
      const seen = new Set<string>();
      for (let s2 = 0; s2 < (c0.salts as number); s2++) seen.add(permute(xs, s2).join(''));
      compare(seen.size >= (c0.distinct_at_least as number), true, `${seen.size} distinct draws from ${c0.salts} salts — the salt is not reaching the stream`);
    }

    if (c0.kind === 'not-cancelled') {
      const cancelled = (arr: readonly string[], salt: number): string[] => {
        const out = arr.slice();
        for (let i = out.length - 1; i > 0; i--) {
          const j = (salt + i * 17 + salt * i) % (i + 1);
          [out[i], out[j]] = [out[j]!, out[i]!];
        }
        return out;
      };
      const bad = new Set<string>();
      for (let s2 = 0; s2 < (c0.salts as number); s2++) bad.add(cancelled(xs, s2).join(''));
      compare(bad.size, c0.cancelled_form_distinct, 'the cancelled form is not degenerate here');
      const good = new Set<string>();
      for (let s2 = 0; s2 < (c0.salts as number); s2++) good.add(permute(xs, s2).join(''));
      compare(good.size > bad.size, true, 'ours is no better than the trap');
    }

    if (c0.kind === 'degenerate') {
      const salt = c0.salt as number;
      for (const i of c0.collapses_to_zero_at as number[]) {
        compare((salt + i * 17) % (i + 1), 0, `i=${i} was supposed to collapse`);
      }
    }

    if (c0.kind === 'preserves-multiset') {
      const want = [...xs].sort().join(',');
      for (const salt of c0.salts as number[]) {
        compare([...permute(xs, salt)].sort().join(','), want);
      }
    }

    if (c0.kind === 'blind') {
      const claims: Record<string, (ys: readonly string[]) => unknown> = {
        min: (ys) => Math.min(...ys.map(Number)),
        max: (ys) => Math.max(...ys.map(Number)),
        mod2: (ys) => ys.every((y) => Number(y) % 2 === 0),
        first: (ys) => ys[0],
      };
      for (const name of c0.blind_to as string[]) {
        compare(permutationBlind(xs, claims[name]!), true, `${name} should survive a shuffle`);
      }
      for (const name of c0.not_blind_to as string[]) {
        compare(permutationBlind(xs, claims[name]!), false, `${name} should NOT survive a shuffle`);
      }
    }
  }
});

test('NEGATIVE CONTROL: permutationBlind refuses to bless a real null', () => {
  const vals = ['2', '4', '6', '8'];
  compare(permutationBlind(vals, (ys) => Math.min(...ys.map(Number))), true);
  compare(permutationBlind(vals, (ys) => ys.join('')), false);
});
