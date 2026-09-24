import { asBoolean, chain, closureViolationsIn, compose, composeState, fromIdeals, idealDebit, isIdealPair, order, state, table, unit } from '@lapxo/obligations';
import { load, throws } from './vectors-harness.ts';

test('D2-ideal — vectors/ideals: a non-closed set is not an ideal', () => {
  const v = load('ideals');
  const c = order(v.scale.levels, v.scale.leq);
  for (const k of v.cases) {
    compare(isIdealPair(c, { demand: k.demand, permit: k.permit }), k.closed, k.name);
    if (k.closed) {
      const d = idealDebit(c, k.demand, k.permit);
      compare([...d.demand].sort(), [...k.demand].sort(), `${k.name}: kept`);
    } else {
      compare(throws(() => idealDebit(c, k.demand, k.permit), (err: unknown) => (err as { code?: string } | null)?.code === 'MALFORMED'), true, `${k.name}: must refuse`);
    }
  }
  const closed = v.cases
    .filter((k: { closed: boolean }) => k.closed)
    .map((k: { demand: string[]; permit: string[] }) => idealDebit(c, k.demand, k.permit));
  compare(closureViolationsIn(c, closed), []);
  const L = fromIdeals(c);
  compare(String(L.show(closed[0]!)) === L.show(closed[0]!), true);
  compare(L.leq(closed[0]!, L.top), true);
});

test('D3-state — units-16', () => {
  for (const c of load('units-16').cases) {
    compare(table(c.a, c.b), c.outcome, `${c.a} ∧ ${c.b}`);
  }
});

test('composeState — chains', () => {
  const v = load('chains');
  const ch = chain(v.chain);
  for (const c of v.cases) {
    const units = c.units.map((u: { floor: string; ceiling: string }) => unit('subject', u));
    const got = compose(ch, units);
    compare(got.floor, c.expect.floor, `${c.name}: floor`);
    compare(got.ceiling, c.expect.ceiling, `${c.name}: ceiling`);
    compare(composeState(ch, units), c.expect.state, `${c.name}: state`);
  }
});

test('compose — decline — the half a suite usually forgets', () => {
  const seen = new Set<string>();
  for (const c of load('decline').cases) {
    seen.add(c.expect);
    const ch = chain(c.input.chain);
    let err;
    try {
      compose(ch, [unit('subject', c.input.unit)]);
    } catch (e) {
      err = e;
    }
    compare(typeof err === 'object' && err !== null && 'code' in err, true, `${c.name}: did not refuse`);
    const want = c.name.includes('nobody declared') ? 'UNKNOWN_LEVEL' : 'MALFORMED';
    compare(err.code, want, `${c.name}: refused for the wrong reason`);
  }
  compare(Boolean(seen.has('ERROR')), true, 'no refusal was tested');
});

test('prop-halfboolean — boolean — the projection that drops half', () => {
  const kinds = new Set();
  const v = load('boolean');
  for (const c of v.cases) {
    const ch = chain(c.chain);
    const u = unit('subject', c.unit);
    compare(state(ch, u), c.state, `${c.name}: state`);
    const view = asBoolean(ch, u);
    kinds.add(c.view);
    compare(view.kind, c.view, `${c.name}: view`);
    if (view.kind === 'exactly' || view.kind === 'lossy') {
      compare(view.value, c.value, `${c.name}: value`);
    }
    if (view.kind === 'lossy' || view.kind === 'unsayable') {
      compare(view.lost.length > 0, true, `${c.name}: lost something and did not say what`);
    }
  }
  compare(kinds.size, v.readings, 'not every reading was exercised');
});
