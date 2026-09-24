import { isDeepStrictEqual } from 'node:util';
import { dangerous, moved, quadrants, stateAt, transitions } from '@lapxo/obligations';
import type { Quadrants, State } from '@lapxo/obligations';
import { biography, cell, maskOf, matrices, oracle } from './vectors-harness.ts';
import type { Row } from './vectors-harness.ts';

test('THE MATRIX: how many moved, and in which direction', () => {
  for (const c of matrices()) {
    const tokens: string[] = c.tokens;
    const ext = maskOf(tokens, tokens);
    const before = quadrants(maskOf(tokens, c.before.demanded), maskOf(tokens, c.before.permitted), ext);
    const after = quadrants(maskOf(tokens, c.after.demanded), maskOf(tokens, c.after.permitted), ext);
    const m = transitions(before, after, tokens.length);

    for (const [key, n] of Object.entries(c.expect as Record<string, number>)) {
      compare(cell(m, key), n, `${c.case}\n  ${key}`);
    }
    const named = new Set(Object.keys(c.expect));
    const states = Object.keys(before) as State[];
    for (const a of states) {
      for (const b of states) {
        if (!named.has(`${a}→${b}`)) {
          compare(m[a][b], 0, `${c.case}\n  ${a}→${b} was not zero`);
        }
      }
    }
    compare(moved(m), c.moved, `${c.case}\n  moved`);
    compare(dangerous(m), c.dangerous, `${c.case}\n  dangerous`);
  }
});

test('and a full BIOGRAPHY has exactly one dangerous step', () => {
  const bio = biography();
  const tokens: string[] = bio.tokens;
  const ext = maskOf(tokens, tokens);
  const at = (e: any): Quadrants =>
    quadrants(maskOf(tokens, e.demanded), maskOf(tokens, e.permitted), ext);

  const bit = tokens.indexOf(bio.token);
  const epochs = bio.epochs as Row[];

  for (const e of epochs) {
    compare(stateAt(at(e), bit), e.state, `${bio.token} at ${e.epoch}`);
  }

  let risky = 0;
  for (let i = 0; i + 1 < epochs.length; i++) {
    const m = transitions(at(epochs[i]), at(epochs[i + 1]), tokens.length);
    risky += dangerous(m).reduce((n, d) => n + d.n, 0);
  }
  compare(risky, bio.expect_dangerous_steps, 'the biography lost its one dangerous step');
});

test('NEGATIVE CONTROL: quadrants — a swapped quadrant fails the oracle, and the partition survives it', () => {
  const tokens = ['a', 'b'];
  const q = quadrants(maskOf(tokens, []), maskOf(tokens, ['a']), maskOf(tokens, tokens));
  const swapped: Quadrants = { ...q, FREE: q.FORBIDDEN, FORBIDDEN: q.FREE };

  const total = (Object.keys(swapped) as State[]).reduce((n, s) => n + swapped[s].size(), 0);
  compare(total, tokens.length, 'the swap broke the partition, so the partition test would have caught it');

  const want = oracle(tokens, [], ['a'], tokens);
  compare(isDeepStrictEqual(swapped.FREE.members(tokens), want.FREE), false, 'the oracle cannot see the swap');
});

