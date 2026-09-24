import { chain, isMonotone, order, vacuityOf } from '@lapxo/obligations';
import type { Level, Scale } from '@lapxo/obligations';
import { gap, isSupermodular, meetBlocks, premium, pricesAnything } from '@lapxo/obligations/price';
import { load, productOfChains, scaleFrom } from './vectors-harness.ts';
import type { Vector } from './vectors-harness.ts';

test('lem-mediant — blocks — the localisation pair, and the theorem that explains the zeros', () => {
  const v = load('blocks');
  for (const c0 of v.cases) {
    const c: Scale = c0.product
      ? productOfChains(c0.product as number[])
      : c0.leq
        ? order(c0.levels as string[], c0.leq as boolean[][])
        : chain(c0.levels as string[]);
    const worth = (i: Level) => (c0.worth as number[])[i]!;

    compare(pricesAnything(c, worth), c0.pricesAnything as boolean, `${c0.name}: pricesAnything`);

    const u = c.rank(c0.u as string);
    const w = c.rank(c0.w as string);
    const raw = meetBlocks(c, u, w);
    const named = raw.map((g) => g.map((j) => c.levels[j]));
    compare(JSON.parse(JSON.stringify(named)), c0.blocks, `${c0.name}: partition`);

    const isChain = (g: Level[]) => g.every((p) => g.every((q) => c.leq(p, q) || c.leq(q, p)));
    compare(raw.map(isChain), c0.blocksAreChains, `${c0.name}: which blocks are chains`);

    compare(Number(premium(c, worth, u, w).toFixed(9)), c0.whole, `${c0.name}: unblocked premium`);
    if (!(c0.pricesAnything as boolean)) {
      compare(c0.whole, 0, `${c0.name}: a supermodular valuation cannot carry a premium`);
    }
  }
});

test('NEGATIVE CONTROL: a chain cannot detect a wrong partition', () => {
  const c = chain(['none', 'own', 'team', 'all']);
  compare(meetBlocks(c, c.rank('all'), c.rank('own')).length, 1);
  const powerset = load('blocks').powerset;
  const b2 = scaleFrom(powerset);
  compare(meetBlocks(b2, b2.rank('x'), b2.rank('y')).length, powerset.blocks);
});

test('thm-gap — vectors/hypothesis — both halves, and here is what breaks without them', () => {
  const v = load('hypothesis');

  const lattice = (n: number, covers: readonly (readonly number[])[]) => {
    const leq = [...Array(n)].map((_, i) => [...Array(n)].map((_, j) => i === j));
    for (const [a, b] of covers) leq[a!]![b!] = true;
    for (let k = 0; k < n; k++) {
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) if (leq[i]![k]! && leq[k]![j]!) leq[i]![j] = true;
      }
    }
    return order([...Array(n)].map((_, i) => `L${i}`), leq);
  };

  const nonZeroPairs = (c: ReturnType<typeof chain>, worth: (i: number) => number): number => {
    let n = 0;
    for (let u = 0; u < c.levels.length; u++) {
      for (let w = 0; w < c.levels.length; w++) if (Math.abs(gap(c, worth, u, w)) > 1e-9) n += 1;
    }
    return n;
  };

  let counterexamples = 0;
  let halves = 0;

  for (const c0 of v.cases) {
    if (c0.kind === 'vacuous') {
      const sc = chain(c0.levels as string[]);
      const r = vacuityOf('isSupermodular', 'chain', sc, isSupermodular, { samples: c0.samples as number });
      compare(r.verdict, c0.verdict, 'isSupermodular now discriminates on a chain — the case is stale');
      compare(r.yes, c0.supermodular_count, `${r.yes} of ${r.samples} supermodular, expected all`);
      compare(r.no, 0);
    }

    if (c0.kind === 'counterexample' || c0.kind === 'unchanged') {
      const sc = chain(c0.levels as string[]);
      const worth = (i: number) => (c0.worth as number[])[i]!;

      compare(isSupermodular(sc, worth), c0.supermodular, `${c0.name}: supermodularity moved`);
      compare(isMonotone(sc, worth), c0.monotone, `${c0.name}: monotonicity moved`);
      compare(!pricesAnything(sc, worth), c0.worthless_to_plan, `${c0.name}: the repaired predicate moved`);
      compare(pricesAnything(sc, worth), !c0.worthless_to_plan, 'pricesAnything must be its exact negation');
      compare(nonZeroPairs(sc, worth), c0.gap_nonzero_pairs, `${c0.name}: the gap census moved`);
      compare(sc.levels.length ** 2, c0.total_pairs);

      if (c0.kind === 'counterexample') {
        counterexamples += 1;
        compare(c0.supermodular, true);
        compare((c0.gap_nonzero_pairs as number) > 0, true, 'a counterexample with no counterexample in it');
      }
    }

    if (c0.kind === 'half-fails') {
      halves += 1;
      const sc = lattice(4, c0.covers as number[][]);
      const half = c0.half === 'monotone' ? isMonotone : isSupermodular;
      let withHalf = 0;
      let bad = 0;
      let alsoNotSuper = 0;
      vacuityOf('half', String(c0.structure), sc, (s, w) => {
        if (!half(s, w)) return true;
        withHalf += 1;
        const g = nonZeroPairs(s as ReturnType<typeof chain>, w) > 0;
        if (g) {
          bad += 1;
          if (!isSupermodular(s, w)) alsoNotSuper += 1;
        }
        return true;
      }, { samples: 40000 });

      compare(withHalf > 1000, true, `${c0.half}: only ${withHalf} samples carried the half`);
      compare(bad > 0, true, `${c0.half} alone stopped failing — the whole point of this case is gone`);
      if (c0.and_those_are_exactly_the_non_supermodular) {
        compare(bad, alsoNotSuper, `${bad} monotone valuations had a gap and only ${alsoNotSuper} were non-supermodular — the iff broke`);
      }
    }
  }

  compare(counterexamples, v.counterexamples, 'both counterexamples must run, or one bad valuation carries the retraction');
  compare(halves, v.halves, 'both halves must be shown to fail alone');
});

test('lem-mediant — the stem is what separates the two outcomes, and nothing else does', () => {
  const v = load('blocks');
  const flat = v.cases.find((c: Vector) => c.name.startsWith('B2 under'))!;
  const stem = v.cases.find((c: Vector) => c.name.startsWith('B2 with a stem'))!;
  compare(flat.blocksAreChains, [true, true]);
  compare(stem.blocksAreChains, [false]);
  compare(flat.total, 0);
  compare(flat.total !== flat.whole, true);
  compare(stem.total, stem.whole);
});
