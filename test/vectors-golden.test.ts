import { chain, compose, entails, order, state, statesPerDebit, unit } from '@lapxo/obligations';
import type { Edge, Scale, Unit } from '@lapxo/obligations';
import { complexity, defect, slack, spectrum } from '@lapxo/obligations/price';
import { WORTH, effective, load, namesReached, scaleFrom } from './vectors-harness.ts';

test('complexity — how much a statement says', () => {
  const v = load('complexity');
  const o = chain(v.chain);
  const seen = new Set<number>();
  for (const c of v.cases) {
    const got = complexity(o, unit('s', { floor: c.floor, ceiling: c.ceiling }));
    compare(got, c.complexity, c.name);
    seen.add(got);
  }
  compare(seen.size > 2, true, 'the file only exercises one or two totals');
  for (const spec of v.extremes?.scales ?? []) {
    const s = scaleFrom(spec);
    const total = 2 * (s.levels.length - 1);
    const counts = s.levels.flatMap((floor: string) => s.levels.map((ceiling: string) => complexity(s, unit('s', { floor, ceiling }))));
    compare(Boolean(counts.every((n: number) => n >= 0 && n <= total)), true, `${s.levels.join('/')}: a count out of range`);
    compare(counts.filter((n: number) => n === 0).length, 1, `${s.levels.join('/')}: saying nothing must be reachable exactly one way`);
    compare(counts.filter((n: number) => n === total).length, 1, `${s.levels.join('/')}: saying everything must be reachable exactly one way`);
  }
});

test('slack — before anybody says what a level is worth', () => {
  const v = load('slack');
  let nonZero = 0;
  for (const c of v.cases) {
    const o = scaleFrom(v.scales[c.scale]);
    const got = slack(o, o.rank(c.a), o.rank(c.b));
    compare(got, { up: c.up, down: c.down }, c.name);
    if (c.up !== 0 || c.down !== 0) nonZero++;
  }
  compare(nonZero > 0, true, 'every case had no slack');
  const sign = v.sign;
  for (const spec of sign?.scales ?? []) {
    const s = scaleFrom(spec);
    for (let a = 0; a < s.levels.length; a++) {
      for (let b = 0; b < s.levels.length; b++) {
        const held = slack(s, a, b);
        compare(held !== null && held.up >= 0 && held.down >= 0, true, `${s.levels.join('/')}: ${a},${b} has no slack to read`);
        if (Array.isArray(spec)) compare(held, { up: 0, down: 0 }, `a ladder has slack at ${a},${b}`);
        for (const name of sign.worths) {
          const left = defect(s, WORTH[name]!, a, b);
          if (held.up === 0 && held.down === 0) compare(Math.abs(left) < sign.tolerance, true, `${name}: nothing should be left over, got ${left}`);
          if (held.down === 0) compare(left <= sign.tolerance, true, `${name}: wrong sign with no downward slack: ${left}`);
          if (held.up === 0) compare(left >= -sign.tolerance, true, `${name}: wrong sign with no upward slack: ${left}`);
        }
      }
    }
  }
});

test('spectrum — every outcome a scale can produce', () => {
  const v = load('spectrum');
  let spread = 0;
  for (const c of v.cases) {
    const o = scaleFrom(v.scales[c.scale]);
    const got = spectrum(o, WORTH[c.worth], v.places, 'defect');
    compare(got.values, c.values, `${c.name}: values`);
    compare(got.pairs, c.pairs, `${c.name}: pairs`);
    compare(got.band, { low: c.values[0], high: c.values[c.values.length - 1] }, `${c.name}: band`);
    compare(got.degeneracy, c.pairs / c.values.length, `${c.name}: degeneracy`);
    if (got.values.length > 1) spread++;
  }
  compare(spread > 0 && spread < v.cases.length, true, 'only one kind of answer was exercised');
  if (v.ladder) {
    for (const name of v.ladder.worths) {
      const got = spectrum(chain(v.ladder.levels), WORTH[name]!, v.places, 'defect');
      compare([got.values, got.band], [[0], { low: 0, high: 0 }], `a ladder valued by ${name} produced more than one outcome`);
    }
    const spreads = v.ladder.worths.filter((name: string) => spectrum(scaleFrom(v.ladder.spread), WORTH[name]!, v.places, 'defect').values.length > 1);
    compare(spreads.length > 0 && spreads.length < v.ladder.worths.length, true, 'every valuation or none spread the other scale');
  }
});

test('D3-state — states-per-step — the read-out that composes', () => {
  const v = load('states-per-step');
  const o = chain(v.chain);
  const kinds = new Set<string>();
  for (const c of v.cases) {
    const got = statesPerDebit(o, unit('s', { floor: c.floor, ceiling: c.ceiling }));
    compare(got, c.steps, c.name);
    for (const [, st] of got) kinds.add(st);
  }
  compare(kinds.size, v.states, `only saw ${[...kinds].join(', ')}`);
  if (v.coordinatewise) {
    const us = o.levels.flatMap((floor: string) => o.levels.map((ceiling: string) => unit('s', { floor, ceiling })))
      .filter((u: Unit) => o.leq(o.rank(u.floor), o.rank(u.ceiling)));
    const demands = (st: string): boolean => st === 'REQUIRED' || st === 'CONFLICT';
    const limits = (st: string): boolean => st === 'REQUIRED' || st === 'FREE';
    for (const a of us) {
      for (const b of us) {
        const [sa, sb, sj] = [a, b, compose(o, [a, b])].map((x) => statesPerDebit(o, x));
        sa.forEach(([, st], i) => {
          compare(demands(sj[i]![1]), demands(st) || demands(sb[i]![1]), `${v.coordinatewise}: demand`);
          compare(limits(sj[i]![1]), limits(st) && limits(sb[i]![1]), `${v.coordinatewise}: limit`);
        });
      }
    }
  }
});

test('T4-composition — effective — reaching means holding', () => {
  const v = load('effective');
  const o = chain(v.chain);
  let escalated = 0;
  for (const c of v.cases) {
    const held: Record<string, { floor: string; ceiling: string }> = c.held;
    const got = effective(o, c.edges as Edge[], c.from, (n) =>
      held[n] === undefined ? [] : [unit('s', held[n])],
    );
    compare([...got.via].sort(), [...c.via].sort(), `${c.name}: via`);
    if (c.bounds === null) {
      compare(got.bounds, null, `${c.name}: bounds`);
    } else {
      compare(got.bounds?.floor, c.bounds.floor, `${c.name}: floor`);
      compare(got.bounds?.ceiling, c.bounds.ceiling, `${c.name}: ceiling`);
      if (state(o, got.bounds!) === 'CONFLICT') escalated++;
    }
  }
  compare(escalated > 0, true, 'no case crossed');
  for (const c of v.walked ? v.cases : []) {
    const walked = new Set<string>([c.from]);
    for (let grew = true; grew;) {
      grew = false;
      for (const [from, to] of c.edges as Edge[]) {
        if (walked.has(from) && !walked.has(to)) {
          walked.add(to);
          grew = true;
        }
      }
    }
    compare(namesReached(c.edges, c.from).sort(), [...walked].sort(), `${c.name}: ${v.walked}`);
  }
});

test('entails — and the direction reverses between the marks', () => {
  const v = load('entails');
  const run = (
    o: Scale,
    cases: readonly { name: string; a: string[]; b: string[]; entails: boolean }[],
  ): void => {
    let yes = 0;
    let no = 0;
    for (const c of cases) {
      const [a, b] = [c.a, c.b].map((x: string[]) => unit('s', { floor: x[0], ceiling: x[1] }));
      compare(entails(o, a, b), c.entails, c.name);
      if (c.entails) yes++;
      else no++;
    }
    compare(yes > 0 && no > 0, true, 'the file only tests one answer');
  };
  run(chain(v.chain), v.cases);
  for (const extra of v.orders ?? []) {
    run(order(extra.levels, extra.leq), extra.cases);
  }
  const o = chain(v.chain);
  const us = o.levels.flatMap((floor: string) => o.levels.map((ceiling: string) => unit('s', { floor, ceiling })));
  if (v.product) {
    const product = (a: Unit, b: Unit): boolean => o.leq(o.rank(b.floor), o.rank(a.floor)) && o.leq(o.rank(a.ceiling), o.rank(b.ceiling));
    const drifted = us.flatMap((a: Unit) => us.filter((b: Unit) => entails(o, a, b) !== product(a, b)).map((b: Unit) => `${a.floor}/${a.ceiling} to ${b.floor}/${b.ceiling}`));
    compare(drifted, [], v.product);
  }
  if (v.composition) {
    const inhabited = us.filter((u: Unit) => o.leq(o.rank(u.floor), o.rank(u.ceiling)));
    for (const a of inhabited) {
      for (const b of inhabited) {
        const both = compose(o, [a, b]);
        compare(entails(o, both, a) && entails(o, both, b), true, `${v.composition}: ${a.floor}/${a.ceiling} and ${b.floor}/${b.ceiling}`);
      }
    }
  }
});
