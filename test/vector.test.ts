import { runQuadrants } from '@lapxo/obligations';
import type { Span, State } from '@lapxo/obligations';
import { load, only } from './vectors-harness.ts';
const intervals = (): any[] => only(load('states'), 'interval');

test('D3-state — and a run answer agrees with an oracle that DOES enumerate, point by point', () => {
  for (const c of intervals()) {
    const ext = c.extent as Span;
    if (ext.hi - ext.lo > 500) continue;

    const runs = runQuadrants(c.demanded as Span[], c.permitted as Span | null, ext);
    for (let x = ext.lo; x <= ext.hi; x++) {
      const d = (c.demanded as Span[]).some((s) => x >= s.lo && x <= s.hi);
      const p = c.permitted !== null && x >= c.permitted.lo && x <= c.permitted.hi;
      const want: State = d && p ? 'REQUIRED' : d ? 'CONFLICT' : p ? 'FREE' : 'FORBIDDEN';
      const got = runs.find((r) => x >= r.lo && x <= r.hi)?.state;
      compare(got, want, `${c.case}\n  at ${x}`);
    }
  }
});
