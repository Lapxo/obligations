import { chain, conflictDebits, unit, weakest } from '@lapxo/obligations';
import { load, namesReached } from './vectors-harness.ts';

test('provenance — a claim is only as good as its weakest input', () => {
  const v = load('provenance');
  for (const c of v.cases) {
    compare(weakest([c.a, c.b]), c.weakest, `${c.a} ∧ ${c.b}`);
  }
  compare(weakest([]), v.empty, 'nothing to weaken');
});

test('D4-debit-in-bits — debits — a collision is counted, not just named', () => {
  for (const c of load('debits').cases) {
    const ch = chain(c.chain);
    compare(conflictDebits(ch, unit('x', c.unit)), c.debits, c.name);
  }
});

test('T4-composition — reach — the law that had two implementations and no vector', () => {
  for (const c of load('reach').cases) {
    compare(namesReached(c.edges, c.from).sort(), [...c.reaches].sort(), c.name);
  }
});
